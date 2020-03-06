/* global artifacts */
var Transactions = artifacts.require('Transactions.sol')

module.exports = function(deployer) {
  deployer.deploy(Transactions)
}
