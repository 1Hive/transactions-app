import React from 'react'
import PropTypes from 'prop-types'

import { useAragonApi } from '@aragon/api-react'
import { Tag, GU } from '@aragon/ui'
import { toChecksumAddress } from 'web3-utils'

import LocalLabelAppBadge from './LocalLabelAppBadge'

function LocalAppBadge({ appAddress, installedApp }) {
  const { installedApps } = useAragonApi()
  const app =
    installedApp ||
    installedApps.find(
      installed => appAddress === toChecksumAddress(installed.appAddress)
    )
  return (
    <>
      <LocalLabelAppBadge
        appAddress={app.appAddress}
        label={app.name}
        iconSrc={app.icon() || ''}
      />
      {app.identifier && (
        <Tag
          mode="identifier"
          css={`
            margin-left: ${1 * GU}px;
          `}
        >
          {app.identifier}
        </Tag>
      )}
    </>
  )
}

LocalAppBadge.propTypes = {
  appAddress: PropTypes.string,
  installedApp: PropTypes.object,
}

export default LocalAppBadge
