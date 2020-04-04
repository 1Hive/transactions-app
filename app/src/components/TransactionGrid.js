import React, {
  useReducer,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import makeCancelable from 'makecancelable'
import { v4 as uuidv4 } from 'uuid'
import {
  Button,
  Field,
  IconPlus,
  IconUpload,
  theme,
  textStyle,
  IconError,
} from '@aragon/ui'
import { useAragonApi } from '@aragon/api-react'

import TransactionRow, { useFieldsLayout } from './TransactionRow'

import { csvStringToArray, readFile, removeCSVHeaders } from '../lib/csv-utils'
import {
  DEFAULT_TRANSFER,
  searchIdentity,
  validateFormItems,
  validateAddresses,
} from '../lib/transactions-utils'

function initTransferItems() {
  return [
    {
      ...DEFAULT_TRANSFER,
      id: uuidv4(),
    },
  ]
}

function transferItemsReducer(state, { type, payload }) {
  switch (type) {
    case 'ADD': {
      const lastItem = state[state.length - 1]

      return [
        ...state,
        {
          ...DEFAULT_TRANSFER,
          ...lastItem,
          id: uuidv4(),
          account: '',
        },
      ]
    }
    case 'APPEND': {
      const { transactionItems } = payload

      return [...state, ...transactionItems]
    }
    case 'UPDATE': {
      const { transactionItem, updatedTransferItem } = payload
      const index = state.indexOf(transactionItem)

      return [
        ...state.slice(0, index),
        updatedTransferItem,
        ...state.slice(index + 1),
      ]
    }
    case 'REMOVE': {
      const { transactionItem } = payload
      if (state.length === 1) {
        return initTransferItems()
      } else {
        return state.filter(t => t !== transactionItem)
      }
    }
    case 'REMOVE_ALL': {
      return initTransferItems()
    }
    default: {
      return state
    }
  }
}

const TransactionGrid = React.memo(
  React.forwardRef(({ tokens, onSubmit }, ref) => {
    const { api } = useAragonApi()
    const accountsRef = useRef()
    const fieldsLayout = useFieldsLayout(tokens)

    const [transactionItems, setTransferItems] = useReducer(
      transferItemsReducer,
      null,
      initTransferItems
    )
    const errors = validateFormItems(transactionItems)
    const [addressErrors, setAddressErrors] = useState([])
    const showDeleteAll = transactionItems.length > 1

    const [focusLastAccountNext, setFocusLastAccountNext] = useState(false)

    const addAccount = () => {
      setTransferItems({
        type: 'ADD',
      })
      setTimeout(() => {
        focusLastAccount()
      }, 0)
    }

    const removeAccount = transactionItem => () => {
      setTransferItems({
        type: 'REMOVE',
        payload: {
          transactionItem,
        },
      })
    }

    const removeAllAccounts = () => {
      setTransferItems({
        type: 'REMOVE_ALL',
      })
      setTimeout(() => {
        focusLastAccount()
      }, 0)
    }

    const updateAccount = transactionItem => updatedTransferItem => {
      setTransferItems({
        type: 'UPDATE',
        payload: {
          transactionItem,
          updatedTransferItem,
        },
      })
    }

    const handleSubmit = async () => {
      if (errors.length !== 0) return

      const _transferItems = await Promise.all(
        transactionItems.map(async transactionItem => ({
          ...transactionItem,
          address: await searchIdentity(api, transactionItem.account),
        }))
      )
      const addressErrors = validateAddresses(
        _transferItems.map(({ address }) => address)
      )

      if (addressErrors.length > 0) {
        setAddressErrors(addressErrors)
      } else {
        setAddressErrors([])
        await onSubmit(_transferItems)
        setTransferItems({
          type: 'REMOVE_ALL',
        })
      }
    }

    const handlePaste = transactionItem => pasteData => {
      try {
        let parsedItems = csvStringToArray(pasteData)
        if (parsedItems[0][1] === undefined) {
          parsedItems = csvStringToArray(pasteData, ',')
        }
        if (parsedItems.length === 1 && parsedItems[0].length === 1)
          return false // data is just a normal string, just skip here and paste in input

        if (parsedItems[0].length !== (tokens ? 3 : 2))
          throw new Error(
            'CSV rows have invalid length. Should have 2 elements for minting and 3 for token transfer (address, amount[, symbol])'
          )

        const appendItems = parsedItems.map(row => ({
          id: uuidv4(),
          account: row[0],
          amount: row[1],
          tokenIndex:
            tokens && tokens.findIndex(token => token.symbol === row[2]),
        }))
        setTransferItems({
          type: 'APPEND',
          payload: {
            transactionItems: appendItems,
          },
        })

        if (transactionItem) {
          setTransferItems({
            type: 'REMOVE',
            payload: {
              transactionItem,
            },
          })
        }
        return true // confirm we handled the data and that the event propagtion should be stopped
      } catch (e) {
        console.error('parse paste invalid', e)
        return false
      }
    }

    const handleImport = data => {
      console.log(data)
      removeAllAccounts()
      handlePaste()(data)
    }

    useEffect(() => {
      return makeCancelable(
        new Promise(() => {
          if (!focusLastAccountNext || !accountsRef.current) return
          setFocusLastAccountNext(false)
          const elts = accountsRef.current.querySelectorAll('.account')
          if (elts.length > 0) {
            elts[elts.length - 1].querySelector('input').focus()
          }
        })
      )
    }, [focusLastAccountNext])

    const focusLastAccount = useCallback(() => {
      setFocusLastAccountNext(true)
    }, [])

    return (
      <>
        <Field
          label={
            <div
              css={`
                width: 100%;
                ${fieldsLayout}
              `}
            >
              <InnerLabel>Recipients</InnerLabel>
              <InnerLabel>Amount</InnerLabel>
              {tokens && <InnerLabel>Token</InnerLabel>}
            </div>
          }
        >
          <div ref={accountsRef}>
            {transactionItems.map((transactionItem, index) => (
              <TransactionRow
                key={transactionItem.id}
                transactionItem={transactionItem}
                onRemove={removeAccount(transactionItem)}
                onUpdate={updateAccount(transactionItem)}
                onPaste={handlePaste(transactionItem)}
                tokens={tokens}
              />
            ))}
          </div>
          <Buttons>
            <span>
              <Button
                label="Add more"
                size="small"
                icon={
                  <IconPlus
                    css={`
                      color: ${theme.accent};
                    `}
                  />
                }
                onClick={addAccount}
              />
              <ImportButton handleImport={handleImport} />
            </span>
            {showDeleteAll && (
              <Button
                label="Delete all"
                mode="negative"
                size="small"
                onClick={removeAllAccounts}
              />
            )}
          </Buttons>
        </Field>
        <Button
          mode="strong"
          onClick={handleSubmit}
          wide
          disabled={errors.length !== 0}
        >
          Send
        </Button>
        {errors && (
          <div
            css={`
              margin-top: 2%;
            `}
          >
            {errors.concat(addressErrors).map((err, index) => (
              <ErrorMessage key={index}>
                <IconError /> {err}
              </ErrorMessage>
            ))}
          </div>
        )}
      </>
    )
  })
)

const ImportButton = ({ handleImport = f => f }) => {
  const fileInput = useRef(null)
  const handleChange = async file => {
    const csv = removeCSVHeaders(await readFile(file))
    handleImport(csv)
  }
  const handleClick = () => fileInput.current.click()
  return (
    <>
      <Button
        onClick={handleClick}
        size="small"
        label="Import"
        icon={
          <IconUpload
            css={`
              color: ${theme.accent};
            `}
          />
        }
      />
      <input
        ref={fileInput}
        css={{ display: 'none' }}
        type="file"
        setTransferItems={e => handleChange(e.target.files[0])}
      />
    </>
  )
}

const Buttons = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const InnerLabel = styled.div`
  text-transform: capitalize;
  ${textStyle('label3')}
`

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  color: red;
`

TransactionGrid.propTypes = {
  tokens: PropTypes.bool,
  onSubmit: PropTypes.func,
}

export default TransactionGrid
