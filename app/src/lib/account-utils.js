import { isAddress } from '@aragon/ui'

export const DEFAULT_STAKE = null

function validateDuplicateAddresses(accounts, validateAddress) {
  const validAddresses = accounts
    .map(([address]) => address.toLowerCase())
    .filter(address => validateAddress(address))
  return validAddresses.length === new Set(validAddresses).size
}

export function validateAccounts(accounts) {
  if (accounts.some(([address]) => !isAddress(address)))
    return 'Some addresses are invalid'

  if (
    accounts.some(([, stake]) => isNaN(stake) || stake === null || stake === 0)
  ) {
    return 'Some balances are invalid.'
  }

  if (!validateDuplicateAddresses(accounts, isAddress)) {
    return 'Some addresses are duplicated.'
  }
}
