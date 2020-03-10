import React, { useCallback, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { TextInput, IconRemove, Button, GU } from '@aragon/ui'

import LocalIdentitiesAutoComplete from './components/LocalIdentitiesAutoComplete/LocalIdentitiesAutoComplete'

import { DEFAULT_STAKE } from './lib/account-utils'

function useFieldsLayout() {
  return `
    display: grid;
    grid-template-columns: auto ${12 * GU}px;
    grid-column-gap: ${1.5 * GU}px;
  `
}

const AccountField = React.forwardRef(
  ({ index, account, hideRemoveButton, onUpdate, onRemove, onPaste }, ref) => {
    const fieldsLayout = useFieldsLayout()
    const [address, stake = DEFAULT_STAKE] = account

    const handleRemove = useCallback(() => {
      onRemove(index)
    }, [onRemove, index])

    const handleAccountChange = useCallback(
      value => {
        onUpdate(index, value, stake)
      },
      [onUpdate, stake, index]
    )

    const handleStakeChange = useCallback(
      event => {
        const value = parseFloat(event.target.value, 10)
        onUpdate(index, address, isNaN(value) ? DEFAULT_STAKE : value)
      },
      [onUpdate, address, index]
    )
    const accountRef = useRef()

    const handlePaste = useCallback(
      e => {
        e.preventDefault()
        onPaste(
          e.clipboardData.getData('text/csv') ||
            e.clipboardData.getData('Text') ||
            e.clipboardData.getData('text/plain'),
          index
        )
      },
      [onPaste]
    )

    useEffect(() => {
      if (accountRef && accountRef.current) {
        accountRef.current.placeholder = 'Ethereum address'
        accountRef.current.addEventListener('paste', handlePaste)
      }
    }, [accountRef && accountRef.current && accountRef.current.placeholder])

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
          value={address}
          wide
          required
        />
        <div>
          <TextInput
            type="number"
            onChange={handleStakeChange}
            value={stake === null ? '' : stake}
            wide
            adornment={
              <Button
                display="icon"
                icon={
                  !hideRemoveButton && (
                    <IconRemove
                      style={{
                        color: 'red',
                      }}
                    />
                  )
                }
                label="Remove account"
                onClick={handleRemove}
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
  hideRemoveButton: PropTypes.bool.isRequired,
  index: PropTypes.number.isRequired,
  account: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.number, PropTypes.string])
  ).isRequired,
  onRemove: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
}

export default AccountField
