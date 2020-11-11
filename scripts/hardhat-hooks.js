/*
 * These hooks are called by the Aragon Buidler plugin during the start task's lifecycle. Use them to perform custom tasks at certain entry points of the development build process, like deploying a token before a proxy is initialized, etc.
 *
 * Link them to the main hardhat config file (hardhat.config.js) in the `aragon.hooks` property.
 *
 * All hooks receive two parameters:
 * 1) A params object that may contain other objects that pertain to the particular hook.
 * 2) A "hre" or HardhatRuntimeEnvironment object that contains enviroment objects like web3, Truffle artifacts, etc.
 *
 * Please see AragonConfigHooks, in the plugin's types for further details on these interfaces.
 * https://github.com/aragon/buidler-aragon/blob/develop/src/types.ts#L31
 */

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const TOKEN_TRANSFERABLE = true
const TOKEN_DECIMALS = 18
const TOKEN_MAX_PER_ACCOUNT = 0
const DEFAULT_FINANCE_PERIOD = 30 * 24 * 60 * 60

const getInstallers = ({ artifacts, web3 }, { _experimentalAppInstaller }) => {
  const newTokenAndManager = async (tokenName, tokenSymbol) => {
    const MiniMeToken = artifacts.require('MiniMeToken')
    const TokenManager = artifacts.require('TokenManager')
    const token = await MiniMeToken.new(
      ZERO_ADDRESS,
      ZERO_ADDRESS,
      0,
      tokenName,
      TOKEN_DECIMALS,
      tokenSymbol,
      TOKEN_TRANSFERABLE
    )
    const tm = await _experimentalAppInstaller('token-manager', {
      skipInitialize: true,
    })

    await token.changeController(tm.address)
    await tm.initialize([
      token.address,
      TOKEN_TRANSFERABLE,
      TOKEN_MAX_PER_ACCOUNT,
    ])
    const accounts = await web3.eth.getAccounts()
    await tm.createPermission('MINT_ROLE')
    const tokenManager = await TokenManager.at(tm.address)
    await tokenManager.mint(accounts[0], '1000000000000000000')
    await tokenManager.mint(accounts[1], '1000000000000000000')
    return [token, tm]
  }

  const newVoting = async (token, votingSettings) => {
    const voting = await _experimentalAppInstaller('voting', {
      initializeArgs: [token, ...votingSettings],
    })
    await voting.createPermission('CREATE_VOTES_ROLE')
    return voting
  }

  const newVaultAndFinance = async voting => {
    const vault = await _experimentalAppInstaller('vault')
    const finance = await _experimentalAppInstaller('finance', {
      initializeArgs: [vault.address, DEFAULT_FINANCE_PERIOD],
    })

    await vault.createPermission('TRANSFER_ROLE', finance.address)
    await finance.createPermission('CREATE_PAYMENTS_ROLE', voting.address)
  }
  return { newTokenAndManager, newVoting, newVaultAndFinance }
}

module.exports = {
  // Called before a dao is deployed.
  preDao: async ({ log }, { web3, artifacts }) => {},

  // Called after a dao is deployed.
  postDao: async (
    { dao, _experimentalAppInstaller, log },
    { web3, artifacts }
  ) => {},

  // Called after the app's proxy is created, but before it's initialized.
  preInit: async (
    { proxy, _experimentalAppInstaller, log },
    { web3, artifacts }
  ) => {
    const { newTokenAndManager, newVoting, newVaultAndFinance } = getInstallers(
      { web3, artifacts },
      { _experimentalAppInstaller }
    )
    const [token1] = await newTokenAndManager('Token 1', 'TKN')
    const [token2] = await newTokenAndManager('Token 2', 'TKN2')

    const voting = await newVoting(token1.address, [
      '500000000000000000',
      '150000000000000000',
      '86400',
    ])

    const voting2 = await newVoting(token2.address, [
      '500000000000000000',
      '150000000000000000',
      '86400',
    ])

    await newVaultAndFinance(voting)
    await newVaultAndFinance(voting2)
  },

  // Called after the app's proxy is initialized.
  postInit: async (
    { proxy, _experimentalAppInstaller, log },
    { web3, artifacts }
  ) => {},

  // Called when the start task needs to know the app proxy's init parameters.
  // Must return an array with the proxy's init parameters.
  getInitParams: async ({ log }, { web3, artifacts }) => {
    return []
  },

  // Called after the app's proxy is updated with a new implementation.
  postUpdate: async ({ proxy, log }, { web3, artifacts }) => {},
}
