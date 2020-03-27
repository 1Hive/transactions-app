import React, { useCallback, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { TextInput, IconRemove, Button, GU, DropDown, Field } from '@aragon/ui'

import LocalIdentitiesAutoComplete from './LocalIdentitiesAutoComplete/LocalIdentitiesAutoComplete'

export function useFieldsLayout(tokens) {
  let columns = ''
  if (tokens) {
    columns += `${14 * GU}px`
  }
  columns += ` ${12 * GU}px`

  return `
    display: grid;
    grid-template-columns: auto ${columns};
    grid-column-gap: ${1.5 * GU}px;
  `
}

const TransferItem = React.forwardRef(
  ({ transferItem, onUpdate, onRemove, onPaste, tokens }, ref) => {
    const fieldsLayout = useFieldsLayout(tokens)
    const { account, amount, tokenIndex } = transferItem

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
    const handleTokenChange = useCallback(
      value => {
        onUpdate({
          ...transferItem,
          tokenIndex: value,
        })
      },
      [onUpdate, transferItem]
    )
    const accountRef = useRef()

    const handlePaste = useCallback(
      e => {
        const captured = onPaste(
          e.clipboardData.getData('text/csv') ||
          e.clipboardData.getData('Text') ||
          e.clipboardData.getData('text/plain')
        )
        if(captured) e.preventDefault()
      },
      [onPaste]
    )

    useEffect(() => {
      if (accountRef && accountRef.current && !accountRef.current._pasteListened) {
        accountRef.current.placeholder = 'Ethereum address'
        accountRef.current.addEventListener('paste', handlePaste)
        accountRef.current._pasteListened = true
      }
    }, [accountRef && accountRef.current])

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
        {tokens && (
          <DropDown
            items={tokens.map(token => token.symbol)}
            selected={tokenIndex}
            onChange={handleTokenChange}
          />
        )}
      </div>
    )
  }
)

TransferItem.propTypes = {
  transferItem: PropTypes.shape({
    account: PropTypes.string,
    amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  onRemove: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
}

export default TransferItem
