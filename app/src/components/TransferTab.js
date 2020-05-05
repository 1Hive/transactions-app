import React, { useState } from 'react'

import { useAragonApi } from '@aragon/api-react'
import { DropDown, Field, TextInput, textStyle } from '@aragon/ui'
import LocalAppBadge from '../components/LocalIdentityBadge/LocalAppBadge'

import { toDecimals } from '../lib/token-utils'

import { createTransferEVMScript } from '../lib/evmscripts-utils'

import votingAbi from '../abi/Voting.json'

import TransactionGrid from './TransactionGrid'
import styled from 'styled-components'

const TOKENS = [
  {
    symbol: 'ETH',
    address: '0x0000000000000000000000000000000000000000',
    decimals: 18,
  },
  {
    symbol: 'TKN',
    address: '0x862F57eDA3d93dCB6845D5fDc11098e921AFe38c',
    decimals: 18,
  },
]

export default function Transfer() {
  const { installedApps, api } = useAragonApi()

  const [reference, setReference] = useState('')
  const [financeAppIndex, setFinanceApp] = useState(0)
  const [votingAppIndex, setVotingApp] = useState(0)

  const financeApps = installedApps.filter(
    ({ name }) => name.toLowerCase() === 'finance'
  )
  const votingApps = installedApps.filter(
    ({ name }) => name.toLowerCase() === 'voting'
  )

  const transferTokens = async transactionItems => {
    const financeApp = financeApps[financeAppIndex]
    const votingApp = votingApps[votingAppIndex]

    // const tokenHandler = await getTokenHandler(api, tokenManager.appAddress)
    // const decimals = await tokenHandler.decimals().toPromise()
    // const formattedAccounts = addDecimalsToAccountsAmounts(accounts, decimals)

    const payments = transactionItems.map(transactionItem => ({
      receiverAddress: transactionItem.address,
      amount: toDecimals(
        transactionItem.amount,
        TOKENS[transactionItem.tokenIndex].decimals
      ),
      tokenAddress: TOKENS[transactionItem.tokenIndex].address,
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
      <Field label="Reference (optional)">
        <TextInput
          type="text"
          value={reference}
          onChange={e => setReference(e.target.value)}
          wide
        />
      </Field>
      <TransactionGrid onSubmit={transferTokens} tokens={TOKENS} />
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
