import React, { useState } from 'react'

import { useAragonApi } from '@aragon/api-react'
import { DropDown, textStyle } from '@aragon/ui'
import LocalAppBadge from '../components/LocalIdentityBadge/LocalAppBadge'

import { toDecimals, getTokenHandler, isNegative, absoluteNum } from '../lib/token-utils'

import { createMintEVMScript } from '../lib/evmscripts-utils'

import votingAbi from '../abi/Voting.json'

import TransactionGrid from './TransactionGrid'
import styled from 'styled-components'

export default function Mint() {
  const { installedApps, api } = useAragonApi()

  const [tokenManagerIndex, setTokenManager] = useState(0)
  const [votingAppIndex, setVotingApp] = useState(0)

  const tokenManagerApps = installedApps.filter(
    ({ name }) => name.toLowerCase() === 'tokens'
  )
  const votingApps = installedApps.filter(
    ({ name }) => name.toLowerCase() === 'voting'
  )

  const mintTokens = async transactionItems => {
    const tokenManager = tokenManagerApps[tokenManagerIndex]
    const votingApp = votingApps[votingAppIndex]

    const tokenHandler = await getTokenHandler(api, tokenManager.appAddress)
    const decimals = await tokenHandler.decimals().toPromise()
    const mintings = transactionItems.map(item => ({
      address: item.address,
      amount: (isNegative(item.amount) ? '-' : '') + toDecimals(absoluteNum(item.amount), decimals),
    }))
    console.log(transactionItems, mintings)

    const votingHandler = api.external(votingApp.appAddress, votingAbi)
    const evmScript = await createMintEVMScript(
      mintings,
      tokenManager.appAddress
    )

    return new Promise((resolve, reject) => {
      votingHandler.newVote(evmScript, 'Mint / Burn Tokens').subscribe(() => {
        resolve()
      })
    })
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
      <TransactionGrid onSubmit={mintTokens} />
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
