# Transactions <img align="right" src="https://github.com/1Hive/website/blob/master/website/static/img/bee.png" height="80px" />

1Hive's Transactions app allows users to create a vote with multiple token mintings or token transfers.

#### 🐲 Project Stage: Mainnet

The Transactions app has been published to `open.aragonpm.eth` on Mainnet, Rinkeby, and xDAI networks. If you are interested in contributing please see our [open issues](https://github.com/1hive/transactions-app).

#### 🚨 Security Review Status: pre-audit

The code in this repository has not been audited.

### Initialization

The transactions app does not need any parameter to be initialized.

## How to run Transactions app locally

First make sure that you have node and yarn installed and working. You'll also need to have [Metamask](https://metamask.io) or some kind of web wallet enabled to sign transactions in the browser.

Git clone this repo.

```sh
git clone https://github.com/1Hive/transactions-app.git
```

Navigate into the `transactions-app` directory.

```sh
cd transactions-app
```

Install npm dependencies.

```sh
yarn
```

Deploy a dao with Token Manager, Voting, and Finance apps installed on your local environment.

```sh
yarn start
```

## How to deploy to an organization

Transactions app are published to APM on Mainnet and Rinkeby at `transactions.open.aragonpm.eth`

To deploy to an Aragon DAO you can use the [Aragon CLI](https://hack.aragon.org/docs/cli-intro.html), and follow these steps.

```
# setup your environment
env="--environment aragon:mainnet --ipfs-rpc https://ipfs.eth.aragon.network/ipfs/"

# set a variable for your DAO
dao=<your_dao_address>

# set a variable for the voting app
voting=<your-voting-app-address>

# install the app to the DAO
aragon dao install $dao transactions.open.aragonpm.eth $env

# go to https://mainnet.aragon.org/#/<your-dao-address>/<your-voting-app-address>
# and vote on the installation 

# check the DAO to get the proxy address of the new app
dao apps $dao --all $env

# set a variable for the address of the proxy of the new app
app=<transactions_app_proxy_address_goes_here>

# we need to set up any permission for the app to wire it into the DAO
# (this makes it show up in the UI).
# Note: We assign to $voting the app's DUMMY_ROLE and set up

aragon dao acl create $dao $app DUMMY_ROLE $voting $voting $env

# go back again to https://mainnet.aragon.org/#/<your-dao-address>/<your-voting-app-address>
# and vote on the permission assignation. When it's done, you will see the Transactions
# app appear in the apps' sidebar.

```

<br />

## Contributing

We welcome community contributions!

Please check out our [open Issues](https://github.com/1Hive/transactions-app/issues) to get started.

If you discover something that could potentially impact security, please notify us immediately. The quickest way to reach us is via the #dev channel in our [Discord chat](https://discord.gg/mP75t4n). Just say hi and that you discovered a potential security vulnerability and we'll DM you to discuss details.

<br />
