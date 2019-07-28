const TaskList = require('listr')
const chalk = require('chalk')
const listrOpts = require('@aragon/cli-utils/src/helpers/listr-options')
const { isPortTaken } = require('@aragon/cli-utils/src/util')
const execa = require('execa')
const find = require('find-process')

exports.command = 'status'
exports.describe = 'Status of the local devchain.'

exports.builder = yargs => {
  return yargs.option('port', {
    description: 'The port to check',
    default: 8545,
  })
}

exports.task = async ({ port, reset, silent, debug }) => {
  return new TaskList(
    [
      {
        title: 'Check port',
        task: async ctx => {
          ctx.portTaken = await isPortTaken(port)
          if (ctx.portTaken) {
            const processData = await find('port', port)
            ctx.processID = processData[0].pid
          }
        },
      },
      {
        title: 'Kill running process',
        enabled: ctx => ctx.portTaken && reset,
        task: async ctx => {
          await execa('kill', [ctx.processID])
          return `Process running at port ${chalk.blue(port)} was killed.`
        },
      },
    ],
    listrOpts(silent, debug)
  )
}

exports.handler = async function({
  port,
  reset = false,
  reporter,
  debug,
  silent,
}) {
  const task = await exports.task({
    port,
    reset,
    reporter,
    debug,
    silent,
  })

  const { portTaken, processID } = await task.run()

  reporter.newLine()

  if (portTaken && !reset) {
    reporter.info(`Process running at port: ${chalk.blue(port)}`)
    reporter.info(`Process ID: ${chalk.blue(processID)}`)
  } else if (!reset) {
    reporter.info(`Devchain is not running at port: ${chalk.blue(port)}`)
  }

  reporter.newLine()
}
