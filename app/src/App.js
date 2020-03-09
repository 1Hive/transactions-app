import React, { useState, useCallback } from 'react'
import styled from 'styled-components'
import { useAragonApi, useGuiStyle } from '@aragon/api-react'
import {
  Main,
  SyncIndicator,
  Header,
  Tabs,
  Button,
  IconError,
} from '@aragon/ui'
import AccountsField from './AccountsField'

import { DEFAULT_STAKE, validateAccounts } from './lib/account-utils'
import {
  createTokenEVMScript,
  addDecimalsToAccountsAmounts,
  getTokenHandler,
} from './lib/token-utils'

import votingAbi from './abi/Voting.json'

const tabs = [
  { name: 'Mint', id: 'mint' },
  { name: 'Transfer', id: 'transfer' },
]

function App() {
  const { appState } = useAragonApi()
  const { isSyncing } = appState

  const { appearance } = useGuiStyle()

  const [selectedTab, setSelectedTab] = useState('mint')

  const currentTab = tabs.find(t => t.id === selectedTab) || {}

  const tabChangeHandler = useCallback(
    index => {
      const id = tabs[index].id
      setSelectedTab(id)
    },
    [tabs]
  )

  const ScreenTab = ({ tabId }) => {
    switch (tabId) {
      case 'mint':
        return <Mint />
      case 'transfer':
        return <Transfer />
      default:
        return null
    }
  }

  return (
    <Main theme={appearance}>
      {isSyncing && <SyncIndicator />}
      <Header primary="Transactions" />
      <Tabs
        items={tabs.map(t => t.name)}
        selected={tabs.indexOf(currentTab)}
        onChange={tabChangeHandler}
      />
      <ScreenTab tabId={currentTab.id} />
    </Main>
  )
}

const Mint = () => {
  const { installedApps, api } = useAragonApi()

  const [accounts, setAccounts] = useState([['', DEFAULT_STAKE]])
  const [errors, setErrors] = useState([])

  const mintTokens = async () => {
    const tmApp = installedApps.find(
      ({ name }) => name.toLowerCase() === 'tokens'
    )
    const votingApps = installedApps.find(
      ({ name }) => name.toLowerCase() === 'voting'
    )

    const tokenHandler = await getTokenHandler(api, tmApp.appAddress)
    const decimals = await tokenHandler.decimals().toPromise()
    const formattedAccounts = addDecimalsToAccountsAmounts(accounts, decimals)

    const votingHandler = api.external(votingApps.appAddress, votingAbi)
    const evmScript = await createTokenEVMScript(
      formattedAccounts,
      tmApp.appAddress
    )

    votingHandler.newVote(evmScript, 'Mint Tokens').subscribe(() => {
      setAccounts([['', DEFAULT_STAKE]])
    })
  }

  const handleSubmit = () => {
    const accountsErrors = []
    const errorMsg = validateAccounts(accounts)
    if (errorMsg) accountsErrors.push(errorMsg)

    if (accountsErrors.length) setErrors([...accountsErrors])
    else {
      setErrors([])
      mintTokens()
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
          accounts.filter(([address, amount]) => address && amount !== null)
            .length === 0
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
const Transfer = () => {
  return `Transfers not enabled yet.`
}

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  color: red;
`

export default App
