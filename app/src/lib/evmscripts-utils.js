import abi from 'ethereumjs-abi'
import web3EthAbiUntyped from 'web3-eth-abi'

const web3EthAbi = web3EthAbiUntyped

function encodeCallScript(actions) {
  return actions.reduce((script, { to, calldata }) => {
    const addr = abi.rawEncode(['address'], [to]).toString('hex')
    const length = abi
      .rawEncode(['uint256'], [(calldata.length - 2) / 2])
      .toString('hex')

    // Remove 12 first 0s of padding for addr and 28 0s for uint32
    return script + addr.slice(24) + length.slice(56) + calldata.slice(2)
  }, '0x00000001') // spec 1
}

function encodeActCall(signature, params) {
  const sigBytes = web3EthAbi.encodeFunctionSignature(signature)

  const types = signature.replace(')', '').split('(')[1]

  // No params, return signature directly
  if (types === '') {
    return sigBytes
  }

  const paramBytes = web3EthAbi.encodeParameters(types.split(','), params)

  return `${sigBytes}${paramBytes.slice(2)}`
}

const MINT_SIGNATURE = 'mint(address,uint256)'
const PAYMENT_SIGNATURE = 'newImmediatePayment(address,address,uint256,string)'
// const BURN_SIGNATURE = 'burn(address,uint256)'

export async function createMintEVMScript(
  transactionItems,
  tokenManagerAddress
) {
  const calldatum = await Promise.all([
    ...transactionItems.map(({ address, amount }) =>
      encodeActCall(MINT_SIGNATURE, [address, amount])
    ),
  ])

  const actions = calldatum.map(calldata => ({
    to: tokenManagerAddress,
    calldata,
  }))

  // Encode all actions into a single EVM script.
  return encodeCallScript(actions)
}

export async function createTransferEVMScript(payments, financeAppAddress) {
  const calldatum = await Promise.all(
    payments.map(({ tokenAddress, receiverAddress, amount, reference = '' }) =>
      encodeActCall(PAYMENT_SIGNATURE, [
        tokenAddress,
        receiverAddress,
        amount,
        reference,
      ])
    )
  )
  const actions = calldatum.map(calldata => ({
    to: financeAppAddress,
    calldata,
  }))

  // Encode all actions into a single EVM script.
  return encodeCallScript(actions)
}
