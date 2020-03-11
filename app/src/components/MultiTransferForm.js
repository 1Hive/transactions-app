import React, { useState } from 'react'

import styled from 'styled-components'
import { useAragonApi } from '@aragon/api-react'
import { Button, IconError, DropDown, textStyle } from '@aragon/ui'
import AccountsField from './AccountsField'

import LocalAppBadge from '../components/LocalIdentityBadge/LocalAppBadge'

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
  const { installedApps, api } = useAragonApi()

  const [accounts, setAccounts] = useState([['', DEFAULT_STAKE]])
  const [errors, setErrors] = useState([])

  const [tokenManagerIndex, setTokenManager] = useState(0)
  const [votingAppIndex, setVotingApp] = useState(0)

  const tokenManagerApps = installedApps.filter(
    ({ name }) => name.toLowerCase() === 'tokens'
  )
  const votingApps = installedApps.filter(
    ({ name }) => name.toLowerCase() === 'voting'
  )

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

      const tokenManager = tokenManagerApps[tokenManagerIndex]
      const votingApp = votingApps[votingAppIndex]

      await onSubmit(_accounts, tokenManager, votingApp)
      setAccounts([['', DEFAULT_STAKE]])
    }
  }

  return (
    <>
      <InnerLabel>Apps</InnerLabel>
      <DropDowns>
        <DropDown
          items={formattedApps(tokenManagerApps)}
          selected={tokenManagerIndex}
          onChange={setTokenManager}
        />
        <DropDown
          items={formattedApps(votingApps)}
          selected={votingAppIndex}
          onChange={setVotingApp}
        />
      </DropDowns>
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

const DropDowns = styled.div`
  display: flex;
  align-items: center;
  padding-bottom: 15px;
`

const formattedApps = apps =>
  apps.map((app, index) => {
    return (
      <StyledAppBadge>
        <LocalAppBadge installedApp={app} />
      </StyledAppBadge>
    )
  })

const InnerLabel = styled.div`
  text-transform: capitalize;
  ${textStyle('label3')}
`

const StyledAppBadge = styled.div`
  display: inline-flex;
  margin-top: 5px;
`
