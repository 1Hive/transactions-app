import tokenManagerAbi from '../abi/TokenManager.json'
import tokenAbi from '../abi/minimeToken.json'

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
