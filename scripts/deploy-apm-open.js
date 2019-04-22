const namehash = require('eth-ens-namehash').hash
const keccak256 = require('js-sha3').keccak_256

const deployAPM = require('./deploy-apm')

const globalArtifacts = this.artifacts // Not injected unless called directly via truffle
const globalWeb3 = this.web3 // Not injected unless called directly via truffle

const defaultOwner = process.env.OWNER
const defaultDaoFactoryAddress = process.env.DAO_FACTORY
const defaultENSAddress = process.env.ENS

module.exports = async (
  truffleExecCallback,
  {
    artifacts = globalArtifacts,
    web3 = globalWeb3,
    ensAddress = defaultENSAddress,
    owner = defaultOwner,
    daoFactoryAddress = defaultDaoFactoryAddress,
    verbose = true,
  } = {}
) => {
  const log = (...args) => {
    if (verbose) {
      console.log(...args)
    }
  }

  const APMRegistry = artifacts.require('APMRegistry')
  const ENSSubdomainRegistrar = artifacts.require('ENSSubdomainRegistrar')
  const Kernel = artifacts.require('Kernel')
  const ACL = artifacts.require('ACL')

  const tldName = 'aragonpm.eth'
  const labelName = 'open'
  const tldHash = namehash(tldName)
  const labelHash = '0x' + keccak256(labelName)

  // wrap deploy-apm
  const { apmFactory, ens, apm } = await deployAPM(null, {
    artifacts,
    web3,
    ensAddress,
    daoFactoryAddress,
    verbose,
  })

  ensAddress = ens.address
  const registrar = await apm.registrar()
  const apmENSSubdomainRegistrar = ENSSubdomainRegistrar.at(registrar)
  const create_name_role = await apmENSSubdomainRegistrar.CREATE_NAME_ROLE()

  log('Managing permissions...')
  const kernel = Kernel.at(await apm.kernel())
  const acl = ACL.at(await kernel.acl())

  log(`Remove manager for create_name_role`)
  // We need to remove the manager of the role to add permissions
  await acl.removePermissionManager(registrar, create_name_role, {
    from: owner,
  })
  log(`Create permission for root account on create_name_role`)
  await acl.createPermission(owner, registrar, create_name_role, owner, {
    from: owner,
  })
  log('=========')

  log(`TLD: ${tldName} (${tldHash})`)
  log(`Label: ${labelName} (${labelHash})`)
  log('=========')

  log(`Assigning ENS name (${labelName}.${tldName}) to factory...`)
  try {
    await apmENSSubdomainRegistrar.createName(labelHash, apmFactory.address, {
      from: owner,
    })
  } catch (err) {
    console.error(
      `Error: could not set the owner of '${labelName}.${tldName}' on the given ENS instance`,
      `(${ensAddress}). Make sure you have ownership rights over the subdomain.`
    )
    throw err
  }

  log('Deploying Open APM...')
  const receipt = await apmFactory.newAPM(tldHash, labelHash, owner)

  log('=========')
  const openAPMAddr = receipt.logs.filter(l => l.event == 'DeployAPM')[0].args
    .apm
  log('# Open APM:')
  log('Address:', openAPMAddr)
  log('Transaction hash:', receipt.tx)
  log('=========')

  if (typeof truffleExecCallback === 'function') {
    // Called directly via `truffle exec`
    truffleExecCallback()
  } else {
    return {
      apmFactory,
      ens,
      apm: APMRegistry.at(openAPMAddr),
    }
  }
}
