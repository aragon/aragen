module.exports = {
  // ENS is deterministically deployed to this address
  ens: '0x5f6f7e8cc7346a11ca2def8f827b7a0b612c56a1',
  commands: {
    start: require('./src/commands/start'),
    status: require('./src/commands/status'),
  },
}
