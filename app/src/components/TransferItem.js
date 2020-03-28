import React, { useCallback, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { TextInput, IconCross, Button, GU, DropDown } from '@aragon/ui'

import LocalIdentitiesAutoComplete from './LocalIdentitiesAutoComplete/LocalIdentitiesAutoComplete'

export function useFieldsLayout(tokens) {
  const columns = tokens
    ? `auto ${12 * GU}px ${12 * GU}px ${5 * GU}px`
    : `auto ${12 * GU}px ${5 * GU}px`

  return `
    display: grid;
    grid-template-columns: ${columns};
    grid-column-gap: ${1.5 * GU}px;
    align-items: center;
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
        if (captured) e.preventDefault()
      },
      [onPaste]
    )

    useEffect(() => {
      if (
        accountRef &&
        accountRef.current &&
        !accountRef.current._pasteListened
      ) {
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
          />
        </div>
        {tokens && (
          <DropDown
            items={tokens.map(token => token.symbol)}
            selected={tokenIndex}
            onChange={handleTokenChange}
          />
        )}
        <Button
          display="icon"
          icon={
            <IconCross
              style={{
                color: 'red',
              }}
            />
          }
          label="Remove account"
          size="mini"
          onClick={() => onRemove()}
        />
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
