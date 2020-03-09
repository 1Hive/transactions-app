import { encodeActCall, encodeCallScript } from './evmscripts-utils'

import tokenManagerAbi from '../abi/TokenManager.json'
import tokenAbi from '../abi/minimeToken.json'

const MINT_SIGNATURE = 'mint(address,uint256)'
// const BURN_SIGNATURE = 'burn(address,uint256)'

export async function createTokenEVMScript(accounts, tokenManagerAddress) {
  const calldatum = await Promise.all([
    ...accounts.map(([receiverAddress, amount]) =>
      encodeActCall(MINT_SIGNATURE, [receiverAddress, amount])
    ),
  ])

  const actions = calldatum.map(calldata => ({
    to: tokenManagerAddress,
    calldata,
  }))

  // Encode all actions into a single EVM script.
  const script = encodeCallScript(actions)

  return script
}

export function addDecimalsToAccountsAmounts(accounts, decimals) {
  return accounts.map(([address, amount]) => [
    address,
    (amount * Math.pow(10, decimals)).toString(),
  ])
}

export async function getTokenHandler(api, tokenManagerAddress) {
  const tmHandler = api.external(tokenManagerAddress, tokenManagerAbi)
  const tokenAddress = await tmHandler.token().toPromise()
  return api.external(tokenAddress, tokenAbi)
}
