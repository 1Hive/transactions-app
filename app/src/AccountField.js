import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import {
  TextInput,
  IconRemove,
  Button,
  EthIdenticon,
  theme,
  isAddress,
  GU,
  RADIUS,
} from '@aragon/ui'

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

    const [address, stake = 0] = account

    const handleRemove = useCallback(() => {
      onRemove(index)
    }, [onRemove, index])

    const handleAccountChange = useCallback(
      event => {
        onUpdate(index, event.target.value, stake)
      },
      [onUpdate, stake, index]
    )

    const handleStakeChange = useCallback(
      event => {
        const value = parseInt(event.target.value, 10)
        onUpdate(index, address, isNaN(value) ? -1 : value)
      },
      [onUpdate, address, index]
    )

    const handlePaste = useCallback(
      e => {
        e.preventDefault()
        onPaste(
          e.clipboardData.getData('text/csv') ||
            e.clipboardData.getData('Text') ||
            e.clipboardData.getData('text/plain')
        )
      },
      [onPaste]
    )

    return (
      <div
        className="account"
        css={`
          ${fieldsLayout};
          position: relative;
          margin-bottom: ${1.5 * GU}px;
        `}
      >
        <div
          css={`
            position: relative;
          `}
        >
          <TextInput
            ref={ref}
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
            onChange={handleAccountChange}
            placeholder="Ethereum address"
            value={address}
            onPaste={handlePaste}
            wide
            css={`
              padding-left: ${4.5 * GU}px;
              width: 100%;
            `}
          />
          <div
            css={`
              position: absolute;
              top: ${1 * GU}px;
              left: ${1 * GU}px;
            `}
          >
            {isAddress(account) ? (
              <EthIdenticon address={address} radius={RADIUS} />
            ) : (
              <div
                css={`
                  width: ${3 * GU}px;
                  height: ${3 * GU}px;
                  background: ${theme.disabled};
                  border-radius: ${RADIUS}px;
                `}
              />
            )}
          </div>
        </div>
        <div>
          <TextInput
            type="number"
            onChange={handleStakeChange}
            value={stake === -1 ? '' : stake}
            wide
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
