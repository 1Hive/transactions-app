import { isAddress } from '@aragon/ui'

export const DEFAULT_TRANSFER = {
  account: '',
  amount: 1,
  id: 0,
}

export function validateAddresses(addresses) {
  // TODO per-item errors
  const errors = []

  if (addresses.some(address => !isAddress(address)))
    errors.push('Some addresses are invalid')

  const lowcaseAddresses = addresses.map(address => address.toLowerCase())
  if (lowcaseAddresses.length !== new Set(lowcaseAddresses).size) {
    errors.push('Some addresses are duplicated.')
  }

  return errors
}

export function validateFormItems(transferItems) {
  // TODO per-item errors
  const errors = []

  if (transferItems.some(({ account }) => !account))
    errors.push('Some addresses are invalid')

  if (
    transferItems.some(
      ({ amount }) => isNaN(amount) || amount === null || amount === 0
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
