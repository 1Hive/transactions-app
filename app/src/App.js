import React, { useState, useCallback } from 'react'
import styled from 'styled-components'
import { useAragonApi, useGuiStyle } from '@aragon/api-react'
import {
  Main,
  Header,
  Tabs,
  Button,
  IconError,
  DropDown,
  textStyle,
} from '@aragon/ui'
import AccountsField from './AccountsField'

import LocalAppBadge from './components/LocalIdentityBadge/LocalAppBadge'

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

  const [tokenManagerIndex, setTokenManager] = useState(0)
  const [votingAppIndex, setVotingApp] = useState(0)

  const tokenManagerApps = installedApps.filter(
    ({ name }) => name.toLowerCase() === 'tokens'
  )
  const votingApps = installedApps.filter(
    ({ name }) => name.toLowerCase() === 'voting'
  )

  const tokenManager = tokenManagerApps[tokenManagerIndex]
  const votingApp = votingApps[votingAppIndex]
  console.log(tokenManager, votingApp)

  const mintTokens = async () => {
    const tokenHandler = await getTokenHandler(api, tokenManager.appAddress)
    const decimals = await tokenHandler.decimals().toPromise()
    const formattedAccounts = addDecimalsToAccountsAmounts(accounts, decimals)

    const votingHandler = api.external(votingApp.appAddress, votingAbi)
    const evmScript = await createTokenEVMScript(
      formattedAccounts,
      tokenManager.appAddress
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
const Transfer = () => {
  return `Transfers not enabled yet.`
}

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  color: red;
`

const StyledAppBadge = styled.div`
  display: inline-flex;
  margin-top: 5px;
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

export default App
