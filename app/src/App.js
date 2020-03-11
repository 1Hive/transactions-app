import React, { useState, useCallback } from 'react'
import { useGuiStyle } from '@aragon/api-react'
import { Main, Header, Tabs } from '@aragon/ui'

import Mint from './components/Mint'
import Transfer from './components/Transfer'

const tabs = [
  { name: 'Mint', id: 'mint' },
  { name: 'Transfer', id: 'transfer' },
]

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

  return (
    <Main theme={appearance}>
      <Header primary="Transactfdsfons" />
      <Tabs
        items={tabs.map(t => t.name)}
        selected={tabs.indexOf(currentTab)}
        onChange={tabChangeHandler}
      />
      <ScreenTab tabId={currentTab.id} />
    </Main>
  )
}

export default App
