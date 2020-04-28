const logDeploy = require('@aragon/os/scripts/helpers/deploy-logger')

const globalArtifacts = this.artifacts // Not injected unless called directly via truffle

module.exports = async (
  truffleExecCallback,
  { artifacts = globalArtifacts, verbose = true } = {}
) => {
  const log = (...args) => {
    if (verbose) {
      console.log(...args)
    }
  }

  log('=========')
  log('Deploying Minime factory...')

  const MiniMeTokenFactory = this.artifacts.require('MiniMeTokenFactory')

  const miniMeFactory = await MiniMeTokenFactory.new()

  await logDeploy(miniMeFactory, { verbose })

  if (typeof truffleExecCallback === 'function') {
    // Called directly via `truffle exec`
    truffleExecCallback()
  } else {
    return {
      miniMeFactory,
    }
  }
}
