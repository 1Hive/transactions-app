import 'core-js/stable'
import { first } from 'rxjs/operators'
import 'regenerator-runtime/runtime'
import Aragon, { events } from '@aragon/api'

import {
  tokenDataOverride,
  getTokenName,
  getTokenSymbol,
  isTokenVerified,
  ETHER_TOKEN_FAKE_ADDRESS,
} from './lib/token-utils'

import vaultAbi from './abi/Vault.json'
import tokenBalanceOfAbi from './abi/token-balanceof.json'
import tokenDecimalsAbi from './abi/token-decimals.json'
import tokenNameAbi from './abi/token-name.json'
import tokenSymbolAbi from './abi/token-symbol.json'

import { addressesEqual } from './lib/web3-utils'

const tokenAbi = [].concat(
  tokenBalanceOfAbi,
  tokenDecimalsAbi,
  tokenNameAbi,
  tokenSymbolAbi
)

const tokenContracts = new Map() // Addr -> External contract
const tokenDecimals = new Map() // External contract -> decimals
const tokenNames = new Map() // External contract -> name
const tokenSymbols = new Map() // External contract -> symbol

const app = new Aragon()

/*
 * Calls `callback` exponentially, everytime `retry()` is called.
 * Returns a promise that resolves with the callback's result if it (eventually) succeeds.
 *
 * Usage:
 *
 * retryEvery(retry => {
 *  // do something
 *
 *  if (condition) {
 *    // retry in 1, 2, 4, 8 seconds… as long as the condition passes.
 *    retry()
 *  }
 * }, 1000, 2)
 *
 */
const retryEvery = async (
  callback,
  { initialRetryTimer = 1000, increaseFactor = 3, maxRetries = 3 } = {}
) => {
  const sleep = time => new Promise(resolve => setTimeout(resolve, time))

  let retryNum = 0
  const attempt = async (retryTimer = initialRetryTimer) => {
    try {
      return await callback()
    } catch (err) {
      if (retryNum === maxRetries) {
        throw err
      }
      ++retryNum

      // Exponentially backoff attempts
      const nextRetryTime = retryTimer * increaseFactor
      console.log(
        `Retrying in ${nextRetryTime}s... (attempt ${retryNum} of ${maxRetries})`
      )
      await sleep(nextRetryTime)
      return attempt(nextRetryTime)
    }
  }

  return attempt()
}

// Get the token address to initialize ourselves
retryEvery(() =>
  getVaultAddresses(app)
    .then(vaultAddrs => initialize(vaultAddrs, ETHER_TOKEN_FAKE_ADDRESS))
    .catch(err => {
      console.error(
        'Could not start background script execution due to the contract not loading the Vault:',
        err
      )
      throw err
    })
)

async function initialize(vaultAddrs, ethAddress) {
  const vaultContracts = await Promise.all(
    vaultAddrs.map(address => app.external(address, vaultAbi))
  )
  const initializationBlocks = await Promise.all(
    vaultContracts.map(contract =>
      contract.getInitializationBlock().toPromise()
    )
  )
  const vaults = vaultAddrs.map((address, i) => ({
    address,
    contract: vaultContracts[i],
    initializationBlock: initializationBlocks[i],
  }))

  const network = await app
    .network()
    .pipe(first())
    .toPromise()

  const settings = {
    network,
    ethToken: {
      address: ethAddress,
    },
  }
  return app.store(
    async (state, { address: eventAddress, event, returnValues }) => {
      const nextState = {
        ...state,
      }
      // Vault event
      if (vaults.some(({ address }) => addressesEqual(eventAddress, address))) {
        return vaultLoadTokens(nextState, returnValues, settings)
      }

      try {
        switch (event) {
          case events.SYNC_STATUS_SYNCING:
            return { ...nextState, isSyncing: true }
          case events.SYNC_STATUS_SYNCED:
            return { ...nextState, isSyncing: false }
          default:
            return state
        }
      } catch (err) {
        console.log(err)
      }
    },
    {
      externals: vaults.map(({ contract, initializationBlock }) => ({
        contract,
        initializationBlock,
      })),
    }
  )
}

async function vaultLoadTokens(state, { token }, settings) {
  return {
    ...state,
    tokens: await updateTokens(
      state.tokens,
      token || settings.ethToken.address,
      settings
    ),
  }
}

async function updateTokens(
  tokens,
  tokenAddress,
  settings,
  { reloadEntireToken } = {}
) {
  const newTokens = Array.from(tokens || [])

  const tokenContract = tokenContracts.has(tokenAddress)
    ? tokenContracts.get(tokenAddress)
    : app.external(tokenAddress, tokenAbi)
  tokenContracts.set(tokenAddress, tokenContract)

  const tokensIndex = newTokens.findIndex(({ address }) =>
    addressesEqual(address, tokenAddress)
  )
  if (tokensIndex === -1 && tokenAddress !== ETHER_TOKEN_FAKE_ADDRESS) {
    return newTokens.concat(
      await newTokenEntry(tokenContract, tokenAddress, settings)
    )
  } else {
    const updatedState = reloadEntireToken
      ? await newTokenEntry(tokenContract, tokenAddress, settings)
      : {}
    newTokens[tokensIndex] = {
      ...newTokens[tokensIndex],
      ...updatedState,
    }
    return newTokens
  }
}

async function newTokenEntry(tokenContract, tokenAddress, settings) {
  const [decimals, name, symbol] = await Promise.all([
    loadTokenDecimals(tokenContract, tokenAddress, settings),
    loadTokenName(tokenContract, tokenAddress, settings),
    loadTokenSymbol(tokenContract, tokenAddress, settings),
  ])

  return {
    decimals,
    name,
    symbol,
    address: tokenAddress,
    verified:
      isTokenVerified(tokenAddress, settings.network.type) ||
      addressesEqual(tokenAddress, settings.ethToken.address),
  }
}

/***********************
 *                     *
 *    Token Helpers    *
 *                     *
 ***********************/

async function loadTokenDecimals(tokenContract, tokenAddress, { network }) {
  if (tokenDecimals.has(tokenContract)) {
    return tokenDecimals.get(tokenContract)
  }

  const override = tokenDataOverride(tokenAddress, 'decimals', network.type)

  let decimals
  try {
    decimals = override || (await tokenContract.decimals().toPromise())
    tokenDecimals.set(tokenContract, decimals)
  } catch (err) {
    // decimals is optional
    decimals = '0'
  }
  return decimals
}

async function loadTokenName(tokenContract, tokenAddress, { network }) {
  if (tokenNames.has(tokenContract)) {
    return tokenNames.get(tokenContract)
  }
  const override = tokenDataOverride(tokenAddress, 'name', network.type)

  let name
  try {
    name = override || (await getTokenName(app, tokenAddress))
    tokenNames.set(tokenContract, name)
  } catch (err) {
    // name is optional
    name = ''
  }
  return name
}

async function loadTokenSymbol(tokenContract, tokenAddress, { network }) {
  if (tokenSymbols.has(tokenContract)) {
    return tokenSymbols.get(tokenContract)
  }
  const override = tokenDataOverride(tokenAddress, 'symbol', network.type)

  let symbol
  try {
    symbol = override || (await getTokenSymbol(app, tokenAddress))
    tokenSymbols.set(tokenContract, symbol)
  } catch (err) {
    // symbol is optional
    symbol = ''
  }
  return symbol
}

async function getVaultAddresses(app) {
  const apps = await app
    .installedApps()
    .pipe(first())
    .toPromise()
  const vaultAddrs = apps
    .filter(app => app.name === 'Vault' || app.name === 'Agent')
    .map(({ appAddress }) => appAddress)
  return vaultAddrs
}
