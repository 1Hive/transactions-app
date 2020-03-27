import React, { useState } from 'react'

import { useAragonApi } from '@aragon/api-react'
import { DropDown, Field, TextInput, textStyle } from '@aragon/ui'
import LocalAppBadge from '../components/LocalIdentityBadge/LocalAppBadge'

import {addDecimalsToTransferItems, createTransferEVMScript, toDecimals} from '../lib/token-utils'

import votingAbi from '../abi/Voting.json'

import MultiTransferForm from './MultiTransferForm'
import styled from 'styled-components'

const TOKENS = [
  {
    name: 'ETH',
    address: '0x0000000000000000000000000000000000000000',
    decimals: 18,
  },
  {
    name: 'TKN',
    address: '0xf2804D07A941F77F34EEEb252D172E4268d0e9D4',
    decimals: 18,
  },
]

export default function Transfer() {
  const { installedApps, api } = useAragonApi()

  const [tokenIndex, setTokenIndex] = useState(0)
  const [reference, setReference] = useState('')
  const [financeAppIndex, setFinanceApp] = useState(0)
  const [votingAppIndex, setVotingApp] = useState(0)

  const financeApps = installedApps.filter(
    ({ name }) => name.toLowerCase() === 'finance'
  )
  const votingApps = installedApps.filter(
    ({ name }) => name.toLowerCase() === 'voting'
  )

  const transferTokens = async transferItems => {
    const financeApp = financeApps[financeAppIndex]
    const votingApp = votingApps[votingAppIndex]

    const token = TOKENS[tokenIndex]

    // const tokenHandler = await getTokenHandler(api, tokenManager.appAddress)
    // const decimals = await tokenHandler.decimals().toPromise()
    // const formattedAccounts = addDecimalsToAccountsAmounts(accounts, decimals)

    const payments = addDecimalsToTransferItems(
      transferItems,
      token.decimals
    ).map(transferItem => ({
      receiverAddress: transferItem.address,
      amount: transferItem.amount,
      tokenAddress: token.address,
      reference,
    }))

    const votingHandler = api.external(votingApp.appAddress, votingAbi)
    const evmScript = await createTransferEVMScript(
      payments,
      financeApp.appAddress
    )

    return new Promise((resolve, reject) => {
      votingHandler.newVote(evmScript, 'Transfer Tokens').subscribe(() => {
        resolve()
      })
    })
  }

  return (
    <>
      <InnerLabel>Apps</InnerLabel>
      <DropDowns>
        <DropDown
          items={formattedApps(financeApps)}
          selected={financeAppIndex}
          onChange={setFinanceApp}
        />
        <DropDown
          items={formattedApps(votingApps)}
          selected={votingAppIndex}
          onChange={setVotingApp}
        />
      </DropDowns>
      <Field label="Token">
        <DropDown
          items={TOKENS.map(token => token.name)}
          selected={tokenIndex}
          onChange={setTokenIndex}
        />
      </Field>
      <Field label="Reference">
        <TextInput
          type="text"
          value={reference}
          onChange={e => setReference(e.target.value)}
          wide
        />
      </Field>
      <MultiTransferForm onSubmit={transferTokens} />
    </>
  )
}

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
