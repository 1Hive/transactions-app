import { isAddress } from '@aragon/ui'

export const DEFAULT_TRANSFER = {
  account: '',
  amount: 1,
  id: 0,
  tokenIndex: 0,
}

export function validateAddresses(addresses) {
  const errors = []

  if (addresses.some(address => !isAddress(address)))
    errors.push('Some addresses are invalid')

  const lowcaseAddresses = addresses.map(address => address.toLowerCase())
  if (lowcaseAddresses.length !== new Set(lowcaseAddresses).size) {
    errors.push('Some addresses are duplicated.')
  }

  return errors
}

export function validateFormItems(transactionItems) {
  const errors = []

  if (
    transactionItems.some(({ account }) => !account) &&
    transactionItems.length > 1
  )
    errors.push('Some addresses are empty')

  if (
    transactionItems.some(
      ({ amount }) => isNaN(parseFloat(amount)) || parseFloat(amount) === 0
    )
  ) {
    errors.push('Some balances are invalid.')
  }

  return errors
}

export async function searchIdentity(api, value) {
  if (/^(0x)?[0-9a-f]{40}$/i.test(value)) {
    return value
  }
  const exists = await api.searchIdentities(value).toPromise()
  if (exists && exists.length === 1) {
    const item = exists[0]
    if (
      item.name.toLowerCase() === value.toLowerCase() ||
      item.address.toLowerCase() === value.toLowerCase()
    ) {
      return item.address
    }
  }
  return value
}
