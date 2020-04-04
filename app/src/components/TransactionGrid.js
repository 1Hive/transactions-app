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
} from '../lib/transfer-utils'

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
      const { transferItems } = payload

      return [...state, ...transferItems]
    }
    case 'UPDATE': {
      const { transferItem, updatedTransferItem } = payload
      const index = state.indexOf(transferItem)

      return [
        ...state.slice(0, index),
        updatedTransferItem,
        ...state.slice(index + 1),
      ]
    }
    case 'REMOVE': {
      const { transferItem } = payload
      if (state.length === 1) {
        return initTransferItems()
      } else {
        return state.filter(t => t !== transferItem)
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

    const [transferItems, setTransferItems] = useReducer(
      transferItemsReducer,
      null,
      initTransferItems
    )
    const errors = validateFormItems(transferItems)
    const [addressErrors, setAddressErrors] = useState([])
    const showDeleteAll = transferItems.length > 1

    const [focusLastAccountNext, setFocusLastAccountNext] = useState(false)

    const addAccount = () => {
      setTransferItems({
        type: 'ADD',
      })
      setTimeout(() => {
        focusLastAccount()
      }, 0)
    }

    const removeAccount = transferItem => () => {
      setTransferItems({
        type: 'REMOVE',
        payload: {
          transferItem,
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

    const updateAccount = transferItem => updatedTransferItem => {
      setTransferItems({
        type: 'UPDATE',
        payload: {
          transferItem,
          updatedTransferItem,
        },
      })
    }

    const handleSubmit = async () => {
      if (errors.length !== 0) return

      const _transferItems = await Promise.all(
        transferItems.map(async transferItem => ({
          ...transferItem,
          address: await searchIdentity(api, transferItem.account),
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

    const handlePaste = transferItem => pasteData => {
      try {
        let parsedItems = csvStringToArray(pasteData)
        if (parsedItems[0][1] === undefined) {
          parsedItems = csvStringToArray(pasteData, ',')
        }
        if (parsedItems.length === 1 && parsedItems[0].length === 1)
          throw new Error('just string')

        if (parsedItems[0].length !== (tokens ? 3 : 2))
          throw new Error('invalid row length')

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
            transferItems: appendItems,
          },
        })

        if (transferItem) {
          setTransferItems({
            type: 'REMOVE',
            payload: {
              transferItem,
            },
          })
        }
        return true
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
            {transferItems.map((transferItem, index) => (
              <TransactionRow
                key={transferItem.id}
                transferItem={transferItem}
                onRemove={removeAccount(transferItem)}
                onUpdate={updateAccount(transferItem)}
                onPaste={handlePaste(transferItem)}
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
