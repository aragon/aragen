module.exports = {
  // ENS is deterministically deployed to this address
  ens: '0x5f6f7e8cc7346a11ca2def8f827b7a0b612c56a1',
  commands: {
    start: require('./src/commands/start'),
    status: require('./src/commands/status'),
  },
  daoFacotry: '0x5d94e3e7aec542ab0f9129b9a7badeb5b3ca0f77',
  minimeFactory: '0xd526b7aba39cccf76422835e7fd5327b98ad73c9',
  fifsResolvingRegistrar: '0xf1f8aac64036cdd399886b1c157b7e3b361093f3',
  apmRegistry: '0x32296d9f8fed89658668875dc73cacf87e8888b2',
  openRegistry: '0x983f1d68a781abbc3a49676a6399dd173de25105',
  hatchRegistry: '0xd4592f8b2116d00fc4ce183773eb24c584060cfc',
}
