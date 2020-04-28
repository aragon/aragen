const { ethers } = require('ethers')
const semver = require('semver')

const ApmRepoAbi = [
  'function getLatest() public view returns (uint16[3] semanticVersion, address contractAddress, bytes contentURI)',
  'function getBySemanticVersion(uint16[3] _semanticVersion) public view returns (uint16[3] semanticVersion, address contractAddress, bytes contentURI)',
]

const apmRegistryAbi = [
  'function newRepoWithVersion(string _name, address _dev, uint16[3] _initialSemanticVersion, address _contractAddress, bytes _contentURI) public returns (address)',
  'function CREATE_REPO_ROLE() view returns (bytes32)',
  'function canPerform(address, bytes32, uint256[]) external view returns (bool)',
  'event NewRepo(bytes32 id, string name, address repo)',
]

const DEFAULT_APM_REGISTRY = 'aragonpm.eth'

/**
 * Returns the full ENS domain app name
 * @param appName "finance" | "finance.aragonpm.eth"
 * @param registry "open.aragonpm.eth"
 */
function getFullAppName(appName, registry = DEFAULT_APM_REGISTRY) {
  if (!appName) throw Error(`appName is not defined`)
  // Already full ENS domain
  if (appName.includes('.')) return appName
  // Concat with registry
  return `${appName}.${registry}`
}

/**
 * Returns the parts of an appName split by shortName and registry
 * @param appName "finance.aragonpm.eth"
 */
function getAppNameParts(appName) {
  const nameParts = getFullAppName(appName).split('.')
  return {
    shortName: nameParts[0],
    registryName: nameParts.slice(1).join('.'),
  }
}

/**
 * Return a semantic version string into the APM version array format
 * @param version "0.2.4"
 */
function toApmVersionArray(version) {
  const semverObj = semver.parse(version)
  if (!semverObj) throw Error(`Invalid semver ${version}`)
  return [semverObj.major, semverObj.minor, semverObj.patch]
}

/**
 * Fetches APM Repo version from external network
 * @param name "finance.aragonpm.eth"
 * @param version "2.0.0"
 * @param provider ethers provider connected to an external network
 */
async function getExternalRepoVersion(name, version, provider) {
  const contract = new ethers.Contract(
    getFullAppName(name),
    ApmRepoAbi,
    provider
  )
  const { contentURI, contractAddress } = version
    ? await contract.getBySemanticVersion(toApmVersionArray(version))
    : await contract.getLatest()

  // throws an error in the event it is not an address
  ethers.utils.getAddress(contractAddress)
  if (!contentURI) throw Error('version data contentURI is not defined')

  return { contentURI, contractAddress }
}

/**
 * Return tx data to publish a new version of an APM repo
 * If the repo does not exist yet, it will return a tx to create
 * a new repo and publish first version to its registry
 * @param appName "finance.aragonpm.eth"
 * @param provider Initialized ethers provider
 * @param versionInfo Object with required version info
 * @param options Additional options
 *  - managerAddress: Must be provided to deploy a new repo
 */
async function publishVersion(
  appName,
  versionInfo,
  provider,
  options = { managerAddress }
) {
  const { version, contentUri, contractAddress } = versionInfo
  if (!semver.valid(version)) {
    throw new Error(`${version} is not a valid semantic version`)
  }

  // const repoAddress = await provider.resolveName(appName)
  const versionArray = toApmVersionArray(version)

  // if (repoAddress) {
  //   // If the repo exists, create a new version in the repo
  //   return {
  //     to: repoAddress,
  //     methodName: 'newVersion',
  //     params: [versionArray, contractAddress, contentUri],
  //   }
  // } else {
  //   // If the repo does not exist yet, create a repo with the first version
  const { shortName, registryName } = getAppNameParts(appName)
  //   const registryAddress = await provider.resolveName(registryName)
  const managerAddress = options && options.managerAddress
  //   if (!registryAddress) throw Error(`Registry ${registryName} does not exist`)
  //   if (!managerAddress) throw Error('managerAddress must be provided')

  const registryAddress = '0x32296d9f8fed89658668875dc73cacf87e8888b2'

  return {
    to: registryAddress,
    methodName: 'newRepoWithVersion',
    params: [
      shortName,
      managerAddress,
      versionArray,
      contractAddress,
      contentUri,
    ],
  }
  // }
}

/**
 * Returns encoded tx data for publishing a new version
 */
function encodePublishVersionTxData({ methodName, params }) {
  switch (methodName) {
    case 'newRepoWithVersion':
      const apmRegistry = new ethers.utils.Interface(apmRegistryAbi)
      return apmRegistry.functions.newRepoWithVersion.encode(params)

    case 'newVersion':
      const apmRepo = new ethers.utils.Interface(repoAbi)
      return apmRepo.functions.newVersion.encode(params)

    default:
      throw Error(`Unsupported publish version method name: ${methodName}`)
  }
}

module.exports = {
  encodePublishVersionTxData,
  getExternalRepoVersion,
  getFullAppName,
  publishVersion,
}
