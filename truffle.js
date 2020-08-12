
const homedir = require("os").homedir;
const path = require("path");

const HDWalletProvider = require("@truffle/hdwallet-provider");

let config = require('@aragon/truffle-config-v5');


const DEFAULT_MNEMONIC =
  "explain tackle mirror kit van hammer degree position ginger unfair soup bonus";

const defaultRPC = network => `https://${network}.eth.aragon.network`;

const configFilePath = filename => path.join(homedir(), `.aragon/${filename}`);

const mnemonic = () => {
  try {
    return require(configFilePath("mnemonic.json")).mnemonic;
  } catch (e) {
    return DEFAULT_MNEMONIC;
  }
};

const settingsForNetwork = network => {
  try {
    return require(configFilePath(`${network}_key.json`));
  } catch (e) {
    return {};
  }
};

// Lazily loaded provider
const providerForNetwork = network => () => {
  let { rpc, keys } = settingsForNetwork(network);
  rpc = rpc || defaultRPC(network);

  if (!keys || keys.length === 0) {
    return new HDWalletProvider(mnemonic(), rpc);
  }

  return new HDWalletProvider(keys, rpc);
};


config.networks.xdai = {
  network_id: 100,
  provider: providerForNetwork("xdai"),
  gas: 500000,
  gasPrice: 1000000000
};

module.exports = config;