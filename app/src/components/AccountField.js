import React, { useCallback, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { TextInput, IconRemove, Button, GU } from '@aragon/ui'

import LocalIdentitiesAutoComplete from './LocalIdentitiesAutoComplete/LocalIdentitiesAutoComplete'

function useFieldsLayout() {
  return `
    display: grid;
    grid-template-columns: auto ${12 * GU}px;
    grid-column-gap: ${1.5 * GU}px;
  `
}

const AccountField = React.forwardRef(
  ({ transferItem, onUpdate, onRemove, onPaste }, ref) => {
    const fieldsLayout = useFieldsLayout()
    const { account, amount } = transferItem

    const handleAccountChange = useCallback(
      value => {
        onUpdate({
          ...transferItem,
          account: value,
        })
      },
      [onUpdate, transferItem]
    )

    const handleAmountChange = useCallback(
      event => {
        onUpdate({
          ...transferItem,
          amount: parseFloat(event.target.value, 10),
        })
      },
      [onUpdate, transferItem]
    )
    const accountRef = useRef()

    // const handlePaste = useCallback(
    //   e => {
    //     e.preventDefault()
    //     onPaste(
    //       e.clipboardData.getData('text/csv') ||
    //       e.clipboardData.getData('Text') ||
    //       e.clipboardData.getData('text/plain')
    //     )
    //   },
    //   [onPaste]
    // )

    // useEffect(() => {
    //   if (accountRef && accountRef.current) {
    //     accountRef.current.placeholder = 'Ethereum address'
    //     accountRef.current.addEventListener('paste', handlePaste)
    //   }
    // }, [accountRef && accountRef.current && accountRef.current.placeholder])

    return (
      <div
        className="account"
        css={`
          ${fieldsLayout};
          position: relative;
          margin-bottom: ${1.5 * GU}px;
        `}
      >
        <LocalIdentitiesAutoComplete
          ref={accountRef}
          onChange={handleAccountChange}
          value={account}
          wide
          required
        />
        <div>
          <TextInput
            type="number"
            onChange={handleAmountChange}
            value={amount || ''}
            wide
            adornment={
              <Button
                display="icon"
                icon={
                  <IconRemove
                    style={{
                      color: 'red',
                    }}
                  />
                }
                label="Remove account"
                onClick={() => onRemove()}
                size="mini"
              />
            }
            adornmentPosition="end"
            adornmentSettings={{ width: 52, padding: 8 }}
          />
        </div>
      </div>
    )
  }
)

AccountField.propTypes = {
  transferItem: PropTypes.shape({
    account: PropTypes.string,
    amount: PropTypes.number,
  }).isRequired,
  onRemove: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
}

export default AccountField
