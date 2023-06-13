import tokenManagerAbi from '../abi/TokenManager.json'
import tokenAbi from '../abi/minimeToken.json'

import tokenSymbolAbi from '../abi/token-symbol.json'
import tokenSymbolBytesAbi from '../abi/token-symbol-bytes.json'
import tokenNameAbi from '../abi/token-name.json'
import tokenNameBytesAbi from '../abi/token-name-bytes.json'

import { ETHER_TOKEN_VERIFIED_ADDRESSES } from './verified-tokens'

import { toUtf8 } from 'web3-utils'

const SAI_MAINNET_TOKEN_ADDRESS = '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359'

// Some known tokens don’t strictly follow ERC-20 and it would be difficult to
// adapt to every situation. The data listed in this map is used as an override
// if either some part of their interface doesn't conform to a standard we
// support.
const KNOWN_TOKENS_OVERRIDE = new Map([
  [
    'main',
    new Map([
      [
        SAI_MAINNET_TOKEN_ADDRESS,
        { symbol: 'SAI', name: 'Sai Stablecoin v1.0', decimals: '18' },
      ],
    ]),
  ],
])

export const ETHER_TOKEN_FAKE_ADDRESS =
  '0x0000000000000000000000000000000000000000'

/**
 * Get the whole and decimal parts from a number.
 * Trims leading and trailing zeroes.
 *
 * @param {string} num the number
 * @returns {Array<string>} array with the [<whole>, <decimal>] parts of the number
 */
function splitDecimalNumber(num) {
  const [whole = '', dec = ''] = String(num).split('.')
  return [
    whole.replace(/^0*/, ''), // trim leading zeroes
    dec.replace(/0*$/, ''), // trim trailing zeroes
  ]
}

export function isNegative(num) {
  return num.startsWith('-');
}

export function absoluteNum(num) {
  return isNegative(num) ? num.substring(1) : num;
}

/**
 * Format the number to be in a given decimal base
 *
 * @param {string} num the number
 * @param {number} rawDecimals number of decimal places
 * @param {Object} [options] options object
 * @param {bool} [options.truncate=true] Should the number be truncated to its decimal base
 * @returns {string} formatted number
 */
export function toDecimals(num, rawDecimals, { truncate = true } = {}) {
  const decimals = parseInt(rawDecimals)
  const [whole, dec] = splitDecimalNumber(num)
  if (!whole && (!dec || !decimals)) {
    return '0'
  }

  const wholeLengthWithBase = whole.length + decimals
  const withoutDecimals = (whole + dec).padEnd(wholeLengthWithBase, '0')
  const wholeWithBase = withoutDecimals.slice(0, wholeLengthWithBase)

  if (!truncate && wholeWithBase.length < withoutDecimals.length) {
    return `${wholeWithBase}.${withoutDecimals.slice(wholeLengthWithBase)}`
  }
  return wholeWithBase
}

export async function getTokenHandler(api, tokenManagerAddress) {
  const tmHandler = api.external(tokenManagerAddress, tokenManagerAbi)
  const tokenAddress = await tmHandler.token().toPromise()
  return api.external(tokenAddress, tokenAbi)
}

export const isTokenVerified = (tokenAddress, networkType) =>
  // The verified list is without checksums
  networkType === 'main'
    ? ETHER_TOKEN_VERIFIED_ADDRESSES.has(tokenAddress.toLowerCase())
    : true

export const tokenDataOverride = (tokenAddress, fieldName, networkType) => {
  // The override list is without checksums
  const addressWithoutChecksum = tokenAddress.toLowerCase()

  const overridesForNetwork = KNOWN_TOKENS_OVERRIDE.get(networkType)
  if (
    overridesForNetwork == null ||
    !overridesForNetwork.has(addressWithoutChecksum)
  ) {
    return null
  }
  return overridesForNetwork.get(addressWithoutChecksum)[fieldName] || null
}

export async function getTokenSymbol(app, address) {
  // Symbol is optional; note that aragon.js doesn't return an error (only an falsey value) when
  // getting this value fails
  let tokenSymbol
  try {
    const token = app.external(address, tokenSymbolAbi)
    tokenSymbol = await token.symbol().toPromise()
  } catch (err) {
    // Some tokens (e.g. DS-Token) use bytes32 as the return type for symbol().
    const token = app.external(address, tokenSymbolBytesAbi)
    tokenSymbol = toUtf8(await token.symbol().toPromise())
  }

  return tokenSymbol || null
}

export async function getTokenName(app, address) {
  // Name is optional; note that aragon.js doesn't return an error (only an falsey value) when
  // getting this value fails
  let tokenName
  try {
    const token = app.external(address, tokenNameAbi)
    tokenName = await token.name().toPromise()
  } catch (err) {
    // Some tokens (e.g. DS-Token) use bytes32 as the return type for name().
    const token = app.external(address, tokenNameBytesAbi)
    tokenName = toUtf8(await token.name().toPromise())
  }

  return tokenName || null
}
