#!/usr/bin/env node
require('@babel/polyfill')
const ConsoleReporter = require('./ConsoleReporter')

// Set up commands
const cmd = require('yargs')
  .commandDir('./commands')

cmd.alias('h', 'help')
cmd.alias('v', 'version')

// Configure CLI behavior
cmd.demandCommand(1, 'You need to specify a command')

// Run
const reporter = new ConsoleReporter()
// reporter.debug(JSON.stringify(process.argv))
cmd.fail((msg, err, yargs) => {
  if (!err) yargs.showHelp()
  reporter.error(msg || err.message || 'An error occurred')
  reporter.debug(err && err.stack)
}).parse(process.argv.slice(2), {
  reporter
})
