import React from 'react'

import { useAragonApi } from '@aragon/api-react'

import {
  createTokenEVMScript,
  addDecimalsToAccountsAmounts,
  getTokenHandler,
} from '../lib/token-utils'

import votingAbi from '../abi/Voting.json'

import MultiTransferForm from './MultiTransferForm'

export default function Mint() {
  const { api } = useAragonApi()

  const mintTokens = async (accounts, tokenManager, votingApp) => {
    const tokenHandler = await getTokenHandler(api, tokenManager.appAddress)
    const decimals = await tokenHandler.decimals().toPromise()
    const formattedAccounts = addDecimalsToAccountsAmounts(accounts, decimals)

    const votingHandler = api.external(votingApp.appAddress, votingAbi)
    const evmScript = await createTokenEVMScript(
      formattedAccounts,
      tokenManager.appAddress
    )

    return new Promise((resolve, reject) => {
      votingHandler.newVote(evmScript, 'Mint Tokens').subscribe(() => {
        resolve()
      })
    })
  }

  return (
      <MultiTransferForm onSubmit={mintTokens} />
  )
}
