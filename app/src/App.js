import React, { useState, useCallback } from 'react'
import { useAragonApi, useGuiStyle } from '@aragon/api-react'
import { Main, SyncIndicator, Header, Tabs, Button } from '@aragon/ui'
import AccountsField from './AccountsField'

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
  const [accounts, setAccounts] = useState([['', -1]])
  return (
    <>
      <AccountsField accounts={accounts} onChange={setAccounts} />
      <Button mode="strong" wide>
        Send
      </Button>
    </>
  )
}
const Transfer = () => {
  return `Transfers not enabled yet.`
}

export default App
