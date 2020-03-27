import React, { useState } from 'react'

import styled from 'styled-components'
import { useAragonApi } from '@aragon/api-react'
import { Button, IconError } from '@aragon/ui'
import AccountsField from './AccountsField'

import {
  DEFAULT_TRANSFER,
  searchIdentity,
  validateFormItems,
  validateAddresses,
} from '../lib/transfer-utils'

export default function MultiTransferForm({ onSubmit }) {
  const { api } = useAragonApi()

  const [transferItems, setTransferItems] = useState([DEFAULT_TRANSFER])
  const errors = validateFormItems(transferItems)
  const [addressErrors, setAddressErrors] = useState([])

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
      setTransferItems([DEFAULT_TRANSFER])
    }
  }

  return (
    <>
      <AccountsField
        transferItems={transferItems}
        onChange={setTransferItems}
      />
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
}

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  color: red;
`
