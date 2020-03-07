import React, { useState, useCallback, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import makeCancelable from 'makecancelable'
import { Button, Field, IconPlus, theme, textStyle, GU } from '@aragon/ui'

import AccountField from './AccountField'

import { csvStringToArray, fromLocalToNumber } from '../src/lib/csv-utils'

function useFieldsLayout() {
  return `
    display: grid;
    grid-template-columns: auto ${12 * GU}px;
    grid-column-gap: ${1.5 * GU}px;
  `
}

const AccountsField = React.memo(
  React.forwardRef(
    ({ accounts = [['', 0]], onChange = f => f, accountStake = 0 }, ref) => {
      const [focusLastAccountNext, setFocusLastAccountNext] = useState(false)

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

      const focusLastAccount = useCallback(() => {
        setFocusLastAccountNext(true)
      }, [])

      const addAccount = () => {
        // setFormError(null)
        onChange([...accounts, ['', accountStake]])
        focusLastAccount()
      }

      const removeAccount = index => {
        // setFormError(null)
        onChange(
          accounts.length < 2
            ? // When the remove button of the last field
              // gets clicked, we only empty the field.
              [['', accountStake]]
            : accounts.filter((_, i) => i !== index)
        )
        focusLastAccount()
      }

      const hideRemoveButton = accounts.length < 2 && !accounts[0]

      const updateAccount = (index, updatedAccount, updatedStake) => {
        onChange(
          accounts.map((account, i) =>
            i === index ? [updatedAccount, updatedStake] : account
          )
        )
      }

      const handlePaste = pasteData => {
        const accounts = csvStringToArray(pasteData)

        onChange(accounts)
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
          <Button
            display="icon"
            label="Add account"
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
        </Field>
      )
    }
  )
)

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
