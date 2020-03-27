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
import {
  Button,
  Field,
  IconPlus,
  IconUpload,
  theme,
  textStyle,
  GU,
  IconError,
} from '@aragon/ui'
import { useAragonApi } from '@aragon/api-react'

import TransferItem, { useFieldsLayout } from './TransferItem'

import { csvStringToArray, readFile, removeCSVHeaders } from '../lib/csv-utils'
import {
  DEFAULT_TRANSFER,
  searchIdentity,
  validateFormItems,
  validateAddresses,
} from '../lib/transfer-utils'

function transferItemsReducer(state, { type, payload }) {
  switch (type) {
    case 'ADD': {
      const maxId = state.map(t => t.id).reduce((a, b) => Math.max(a, b), 0)

      const lastItem = state[state.length - 1]

      return [
        ...state,
        {
          ...lastItem,
          account: '',
          id: maxId + 1,
        },
      ]
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
        return [DEFAULT_TRANSFER]
      } else {
        return state.filter(t => t !== transferItem)
      }
    }
    case 'REMOVE_ALL': {
      return [DEFAULT_TRANSFER]
    }
    default: {
      return state
    }
  }
}

const TransferItems = React.memo(
  React.forwardRef(({ tokens, onSubmit }, ref) => {
    const { api } = useAragonApi()
    const accountsRef = useRef()
    const fieldsLayout = useFieldsLayout(tokens)

    const [transferItems, setTransferItems] = useReducer(transferItemsReducer, [
      DEFAULT_TRANSFER,
    ])
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

    // TODO broken
    // const handlePaste = index => (pasteData) => {
    //   let pasteAccounts = csvStringToArray(pasteData)
    //   if (pasteAccounts[0][1] === undefined) {
    //     pasteAccounts = csvStringToArray(pasteData, ',')
    //   }
    //   const newAccounts = [...transferItems]
    //   newAccounts.splice(index, 1, ...pasteAccounts)
    //   if (newAccounts[newAccounts.length - 1][0] === '') {
    //     newAccounts.pop() // Remove last empty element
    //   }
    //   setTransferItems(newAccounts)
    // }

    // const handleImport = data => {
    //   removeAllAccounts()
    //   handlePaste(data, 0)
    // }

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
              {tokens && <InnerLabel>Token</InnerLabel>}
              <InnerLabel>Amount</InnerLabel>
            </div>
          }
        >
          <div ref={accountsRef}>
            {transferItems.map((transferItem, index) => (
              <TransferItem
                key={transferItem.id}
                transferItem={transferItem}
                onRemove={removeAccount(transferItem)}
                onUpdate={updateAccount(transferItem)}
                // onPaste={handlePaste(index)}
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
              {/* <ImportButton handleImport={handleImport} /> */}
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

TransferItems.propTypes = {
  transferItems: PropTypes.array,
  setTransferItems: PropTypes.func,
}

export default TransferItems
