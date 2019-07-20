#!/usr/bin/env node
import 'core-js/stable'
import 'regenerator-runtime/runtime'
const ConsoleReporter = require('@aragon/cli-utils/src/reporters/ConsoleReporter')

// Set up commands
const cmd = require('yargs')
  .strict()
  .parserConfiguration({
    'parse-numbers': false,
  })
  .usage(`Usage: aragen <command> [options]`)
  .commandDir('./commands')

cmd.alias('h', 'help')
cmd.alias('v', 'version')

// Configure CLI behavior
cmd.demandCommand(1, 'You need to specify a command')

// Set global options
cmd.option('silent', {
  description: 'Silence output to terminal',
  default: false,
})

cmd.option('debug', {
  description: 'Show more output to terminal',
  default: false,
  coerce: debug => {
    if (debug || process.env.DEBUG) {
      global.DEBUG_MODE = true
      return true
    }
  },
})

// Run
const reporter = new ConsoleReporter()
// reporter.debug(JSON.stringify(process.argv))
cmd
  .fail((msg, err, yargs) => {
    if (!err) yargs.showHelp()
    reporter.error(msg || err.message || 'An error occurred')
    reporter.debug(err && err.stack)
  })
  .parse(process.argv.slice(2), {
    reporter,
  })
