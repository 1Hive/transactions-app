import React, { useState } from 'react'

import styled from 'styled-components'
import { useAragonApi } from '@aragon/api-react'
import { Button, IconError } from '@aragon/ui'
import AccountsField from './AccountsField'

import { DEFAULT_STAKE, validateAccounts } from '../lib/account-utils'

const searchIdentity = async (api, value) => {
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

export default function MultiTransferForm({ onSubmit }) {
  const { api } = useAragonApi()

  const [accounts, setAccounts] = useState([['', DEFAULT_STAKE]])
  const [errors, setErrors] = useState([])

  const handleSubmit = async () => {
    const accountsErrors = []
    const identities = await Promise.all(
      accounts.map(([identity]) => searchIdentity(api, identity))
    )
    const _accounts = accounts.map(([, amount], i) => [identities[i], amount])
    const errorMsg = validateAccounts(_accounts)
    if (errorMsg) accountsErrors.push(errorMsg)

    if (accountsErrors.length) setErrors([...accountsErrors])
    else {
      setErrors([])

      await onSubmit(_accounts)
      setAccounts([['', DEFAULT_STAKE]])
    }
  }

  return (
    <>
      <AccountsField accounts={accounts} onChange={setAccounts} />
      <Button
        mode="strong"
        onClick={handleSubmit}
        wide
        disabled={
          !accounts.filter(([address, amount]) => address && amount !== null)
            .length > 0
        }
      >
        Send
      </Button>
      {errors && (
        <div
          css={`
            margin-top: 2%;
          `}
        >
          {errors.map((err, index) => (
            <ErrorMessage key={index}>
              <IconError /> {err}
            </ErrorMessage>
          ))}
        </div>
      )}
    </>
  )
}

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  color: red;
`
