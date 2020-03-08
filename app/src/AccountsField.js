import React, { useState, useCallback, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import makeCancelable from 'makecancelable'
import { Button, Field, IconPlus, theme, textStyle, GU } from '@aragon/ui'

import AccountField from './AccountField'

import { csvStringToArray } from '../src/lib/csv-utils'

import { DEFAULT_STAKE } from './lib/account-utils'

function useFieldsLayout() {
  return `
    display: grid;
    grid-template-columns: auto ${12 * GU}px;
    grid-column-gap: ${1.5 * GU}px;
  `
}

const ACCOUNTS_SIZE = 1

const AccountsField = React.memo(
  React.forwardRef(
    (
      {
        accounts = [['', DEFAULT_STAKE]],
        onChange = f => f,
        accountStake = DEFAULT_STAKE,
      },
      ref
    ) => {
      const [focusLastAccountNext, setFocusLastAccountNext] = useState(false)
      const [showDeleteAll, setShowDeleteAll] = useState(false)

      const accountsRef = useRef()

      const fieldsLayout = useFieldsLayout()

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

      const checkAccountsLength = useCallback(accounts => {
        setShowDeleteAll(accounts.length > ACCOUNTS_SIZE)
      }, [])

      const focusLastAccount = useCallback(() => {
        setFocusLastAccountNext(true)
      }, [])

      const addAccount = () => {
        const newAccounts = [...accounts, ['', accountStake]]
        onChange(newAccounts)
        checkAccountsLength(newAccounts)
        focusLastAccount()
      }

      const removeAccount = index => {
        const newAccounts =
          accounts.length < 2
            ? // When the remove button of the last field
              // gets clicked, we only empty the field.
              [['', accountStake]]
            : accounts.filter((_, i) => i !== index)
        onChange(newAccounts)
        checkAccountsLength(newAccounts)
        focusLastAccount()
      }

      const removeAllAccounts = () => {
        onChange([['', accountStake]])
        setShowDeleteAll(false)
      }

      const hideRemoveButton = accounts.length < 2 && !accounts[0]

      const updateAccount = (index, updatedAccount, updatedStake) => {
        onChange(
          accounts.map((account, i) =>
            i === index ? [updatedAccount, updatedStake] : account
          )
        )
      }

      const handlePaste = (pasteData, fieldIndex) => {
        const pasteAccounts = csvStringToArray(pasteData)
        const newAccounts = [...accounts]
        newAccounts.splice(fieldIndex, 1, ...pasteAccounts)
        onChange(newAccounts)
        checkAccountsLength(newAccounts)
      }

      return (
        <Field
          label={
            <div
              css={`
                width: 100%;
                ${fieldsLayout}
              `}
            >
              <InnerLabel>Mint to</InnerLabel>
              <InnerLabel>Amount</InnerLabel>
            </div>
          }
        >
          <div ref={accountsRef}>
            {accounts.map((account, index) => (
              <AccountField
                ref={ref}
                key={index}
                index={index}
                account={account}
                onRemove={removeAccount}
                hideRemoveButton={hideRemoveButton}
                onUpdate={updateAccount}
                onPaste={handlePaste}
              />
            ))}
          </div>
          <Buttons>
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
    }
  )
)

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
  accounts: PropTypes.array,
  onChange: PropTypes.func,
  accountStake: PropTypes.number,
}

export default AccountsField
