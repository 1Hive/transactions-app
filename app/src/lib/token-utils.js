import { encodeActCall, encodeCallScript } from './evmscripts-utils'

import tokenManagerAbi from '../abi/TokenManager.json'
import tokenAbi from '../abi/minimeToken.json'

const MINT_SIGNATURE = 'mint(address,uint256)'
// const BURN_SIGNATURE = 'burn(address,uint256)'

const PAYMENT_SIGNATURE = 'newImmediatePayment(address,address,uint256,string)'

export async function createMintEVMScript(accounts, tokenManagerAddress) {
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

export async function createTransferEVMScript(payments, financeAppAddress) {
  const calldatum = await Promise.all(
    payments.map(({ tokenAddress, receiverAddress, amount, reference = '' }) =>
      encodeActCall(PAYMENT_SIGNATURE, [
        tokenAddress,
        receiverAddress,
        amount,
        reference,
      ])
    )
  )
  const actions = calldatum.map(calldata => ({
    to: financeAppAddress,
    calldata,
  }))

  // Encode all actions into a single EVM script.
  const script = encodeCallScript(actions)

  return script
}

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

/**
 * Format the number to be in a given decimal base
 *
 * @param {string} num the number
 * @param {number} decimals number of decimal places
 * @param {Object} [options] options object
 * @param {bool} [options.truncate=true] Should the number be truncated to its decimal base
 * @returns {string} formatted number
 */
export function toDecimals(num, decimals, { truncate = true } = {}) {
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

export function addDecimalsToAccountsAmounts(accounts, decimals) {
  return accounts.map(([address, amount]) => {
    console.log(amount, decimals, toDecimals(amount, parseInt(decimals)))
    return [address, toDecimals(amount, parseInt(decimals))]
  })
}

export async function getTokenHandler(api, tokenManagerAddress) {
  const tmHandler = api.external(tokenManagerAddress, tokenManagerAbi)
  const tokenAddress = await tmHandler.token().toPromise()
  return api.external(tokenAddress, tokenAbi)
}
