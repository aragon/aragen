const TaskList = require('listr')
const ncp = require('ncp')
const ganache = require('ganache-core')
const Web3 = require('web3')
const { promisify } = require('util')
const os = require('os')
const path = require('path')
const rimraf = require('rimraf')
const mkdirp = require('mkdirp')
const chalk = require('chalk')
const fs = require('fs')
const listrOpts = require('@aragon/cli-utils/src/helpers/listr-options')
const pjson = require('../../package.json')
const devchainStatus = require('./status')

const { BLOCK_GAS_LIMIT, MNEMONIC } = require('../helpers/ganache-vars')

exports.command = 'devchain'

exports.describe =
  'Open a test chain for development and pass arguments to ganache'

exports.builder = yargs => {
  return yargs
    .option('port', {
      description: 'The port to run the local chain on',
      default: 8545,
    })
    .option('network-id', {
      description: 'Network id to connect with',
    })
    .option('mnemonic', {
      type: 'string',
      default: MNEMONIC,
      description: 'Mnemonic phrase',
    })
    .option('gas-limit', {
      default: BLOCK_GAS_LIMIT,
      description: 'Block gas limit',
    })
    .option('reset', {
      type: 'boolean',
      default: false,
      description: 'Reset devchain to snapshot',
    })
    .option('accounts', {
      default: 2,
      description: 'Number of accounts to print',
    })
    .option('verbose', {
      default: false,
      type: 'boolean',
      description: 'Enable verbose devchain output',
    })
}

exports.task = async function({
  port,
  networkId,
  mnemonic,
  gasLimit,
  verbose,
  reset,
  showAccounts,
  reporter,
  silent,
  debug,
}) {
  const removeDir = promisify(rimraf)
  const mkDir = promisify(mkdirp)
  const recursiveCopy = promisify(ncp)

  const snapshotPath = path.join(
    os.homedir(),
    `.aragon/aragen-db-${pjson.version}`
  )

  const tasks = new TaskList(
    [
      {
        title: 'Check devchain status',
        task: async ctx => {
          const task = await devchainStatus.task({
            port,
            reset,
            silent,
            debug,
          })

          const { portTaken, processID } = await task.run()

          if (portTaken && !reset) {
            throw new Error(
              `Process ${chalk.red(
                processID
              )} already running at port ${chalk.blue(port)}`
            )
          }
        },
      },
      {
        title: 'Setting up a new chain from latest Aragon snapshot',
        task: async (ctx, task) => {
          await removeDir(snapshotPath)
          await mkDir(path.resolve(snapshotPath, '..'))
          const snapshot = path.join(__dirname, '../../aragon-ganache')
          await recursiveCopy(snapshot, snapshotPath)
        },
        enabled: () => !fs.existsSync(snapshotPath) || reset,
      },
      {
        title: 'Starting a local chain from snapshot',
        task: async (ctx, task) => {
          const server = ganache.server({
            network_id: networkId || parseInt(1e8 * Math.random()),
            gasLimit,
            mnemonic,
            db_path: snapshotPath,
            logger: verbose ? { log: reporter.info.bind(reporter) } : undefined,
          })
          const listen = () =>
            new Promise((resolve, reject) => {
              server.listen(port, err => {
                if (err) return reject(err)

                task.title = `Local chain started at port ${chalk.blue(port)}\n`
                resolve()
              })
            })
          await listen()

          ctx.web3 = new Web3(
            new Web3.providers.WebsocketProvider(`ws://localhost:${port}`)
          )
          const accounts = await ctx.web3.eth.getAccounts()

          ctx.accounts = accounts.slice(0, parseInt(showAccounts))
          ctx.mnemonic = MNEMONIC

          const ganacheAccounts = server.provider.manager.state.accounts
          ctx.privateKeys = ctx.accounts.map(address => ({
            key: ganacheAccounts[address.toLowerCase()].secretKey.toString(
              'hex'
            ),
            address,
          }))
        },
      },
    ],
    listrOpts(silent, debug)
  )

  return tasks
}

exports.printAccounts = (reporter, privateKeys) => {
  const firstAccountComment =
    '(account used to deploy DAOs, has more permissions)'

  const formattedAccounts = privateKeys.map(
    ({ address, key }, i) =>
      `Address #${i + 1}:  ${chalk.green(address)} ${
        i === 0 ? firstAccountComment : ''
      }\nPrivate key: ` +
      chalk.blue(key) +
      '\n'
  )

  reporter.info(`Here are some Ethereum accounts you can use.
  The first one will be used for all the actions the aragonCLI performs.
  You can use your favorite Ethereum provider or wallet to import their private keys.
  \n${formattedAccounts.join('\n')}`)
}

exports.printMnemonic = (reporter, mnemonic) => {
  reporter.info(
    `The accounts were generated from the following mnemonic phrase:\n${chalk.blue(
      mnemonic
    )}\n`
  )
}

exports.printResetNotice = (reporter, reset) => {
  if (reset) {
    reporter.warning(`${chalk.yellow(
      'The devchain was reset, some steps need to be done to prevent issues:'
    )}
    - Reset the application cache in Aragon Client by going to Settings -> Troubleshooting.
    - If using Metamask: switch to a different network, and then switch back to the 'Private Network' (this will clear the nonce cache and prevent errors when sending transactions)
  `)
  }
}

exports.handler = async ({
  reporter,
  port,
  networkId,
  mnemonic,
  gasLimit,
  reset,
  verbose,
  accounts,
  silent,
  debug,
}) => {
  const task = await exports.task({
    port,
    networkId,
    mnemonic,
    gasLimit,
    reset,
    verbose,
    reporter,
    showAccounts: accounts,
    silent,
    debug,
  })
  const { privateKeys } = await task.run()
  exports.printAccounts(reporter, privateKeys)
  exports.printMnemonic(reporter, mnemonic)
  exports.printResetNotice(reporter, reset)

  reporter.info(
    'ENS instance deployed at',
    chalk.green('0x5f6f7e8cc7346a11ca2def8f827b7a0b612c56a1'),
    '\n'
  )

  reporter.info(`Devchain running: ${chalk.blue('http://localhost:' + port)}.`)
}
