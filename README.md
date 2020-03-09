# Transactions <img align="right" src="https://github.com/1Hive/website/blob/master/website/static/img/bee.png" height="80px" />

1Hive's Transactions app allows users to create a vote with multiple token mintings or token transfers.

#### 🐲 Project Stage: development

The Transactiosn app is still in development. If you are interested in contributing please see our [open issues](https://github.com/1hive/transactions-app).

#### 🚨 Security Review Status: pre-audit

The code in this repository has not been audited.

### Initialization

The transactions app does not need any parameter to be initialized.

## How to run Transactions app locally

First make sure that you have node, npm, and the aragonCLI installed and working. Instructions on how to set that up can be found [here](https://hack.aragon.org/docs/cli-intro.html). You'll also need to have [Metamask](https://metamask.io) or some kind of web wallet enabled to sign transactions in the browser.

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
npm i
```

Deploy a dao with Token Manager and Voting apps installed on your local environment.

```sh
npm run start:ipfs:template
```

## How to deploy to an organization

Transactions app will be published to APM on Mainnet and Rinkeby at `transactions.open.aragonpm.eth`

To deploy to an Aragon DAO you can use the [Aragon CLI](https://hack.aragon.org/docs/cli-intro.html).

```
aragon dao install <dao-address> transactions.open.aragonpm.eth
```

<br />

## Contributing

We welcome community contributions!

Please check out our [open Issues](https://github.com/1Hive/transactions-app/issues) to get started.

If you discover something that could potentially impact security, please notify us immediately. The quickest way to reach us is via the #dev channel in our [team Keybase chat](https://1hive.org/contribute/keybase). Just say hi and that you discovered a potential security vulnerability and we'll DM you to discuss details.

<br />