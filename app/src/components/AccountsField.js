import React, { useState, useCallback, useRef, useEffect } from 'react'
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
} from '@aragon/ui'

import AccountField from './AccountField'

import { csvStringToArray, readFile, removeCSVHeaders } from '../lib/csv-utils'
import { DEFAULT_TRANSFER } from '../lib/transfer-utils'

function useFieldsLayout() {
  return `
    display: grid;
    grid-template-columns: auto ${12 * GU}px;
    grid-column-gap: ${1.5 * GU}px;
  `
}

const AccountsField = React.memo(
  React.forwardRef(({ transferItems, onChange = f => f }, ref) => {
    const [focusLastAccountNext, setFocusLastAccountNext] = useState(false)

    const accountsRef = useRef()

    const fieldsLayout = useFieldsLayout()

    const showDeleteAll = transferItems.length > 1

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

    const addAccount = () => {
      const maxId = transferItems.map(t => t.id).reduce(Math.max, 0)

      const newAccounts = [
        ...transferItems,
        {
          ...DEFAULT_TRANSFER,
          id: maxId + 1,
        },
      ]

      onChange(newAccounts)
      setTimeout(() => {
        focusLastAccount()
      }, 0)
    }

    const removeAccount = index => () => {
      const newAccounts =
        transferItems.length < 2
          ? // When the remove button of the last field
            // gets clicked, we only empty the field.
            [DEFAULT_TRANSFER]
          : transferItems.filter((_, i) => i !== index)
      onChange(newAccounts)
    }

    const removeAllAccounts = () => {
      onChange([DEFAULT_TRANSFER])
      setTimeout(() => {
        focusLastAccount()
      }, 0)
    }

    const updateAccount = index => updatedTransferItem => {
      onChange(
        transferItems.map((transferItem, i) =>
          i === index ? updatedTransferItem : transferItem
        )
      )
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
    //   onChange(newAccounts)
    // }

    // const handleImport = data => {
    //   removeAllAccounts()
    //   handlePaste(data, 0)
    // }

    return (
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
          </div>
        }
      >
        <div ref={accountsRef}>
          {transferItems.map((transferItem, index) => (
            <AccountField
              key={transferItem.id}
              transferItem={transferItem}
              onRemove={removeAccount(index)}
              onUpdate={updateAccount(index)}
              // onPaste={handlePaste(index)}
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
            {/*<ImportButton handleImport={handleImport} />*/}
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
        onChange={e => handleChange(e.target.files[0])}
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

AccountsField.propTypes = {
  transferItems: PropTypes.array,
  onChange: PropTypes.func,
}

export default AccountsField
