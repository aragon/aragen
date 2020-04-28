const { ethers } = require('ethers')
const path = require('path')
const Web3 = require('web3')
//
const {
  encodePublishVersionTxData,
  getExternalRepoVersion,
  publishVersion,
} = require('./apm')
const { readJson } = require('./utils')

const ensAddress = '0x5f6f7e8cc7346a11ca2def8f827b7a0b612c56a1'
const networkToFetch = 'homestead'

const log = (...args) => {
  console.log(...args)
}

const main = async () => {
  const web3 = new Web3('http://localhost:8545')

  const ethersWeb3Provider = new ethers.providers.Web3Provider(
    web3.currentProvider,
    {
      name: 'rpc',
      chainId: 15,
      ensAddress,
    }
  )

  const { registries } = readJson(path.resolve(__dirname, 'apm.json'))

  log('Deploying Repos...')
  log('====================')
  for (let [registry, repos] of Object.entries(registries)) {
    for (const repo of repos) {
      const accounts = await web3.eth.getAccounts()
      owner = accounts[0]

      const fullName = `${repo}.${registry}`

      const infuraProvider = new ethers.providers.InfuraProvider(networkToFetch)
      const etherscanProvider = new ethers.providers.EtherscanProvider(
        networkToFetch
      )

      // Fetch version from external network
      const versionData = await getExternalRepoVersion(
        fullName,
        '',
        infuraProvider
      )
      const { contractAddress, contentURI } = versionData

      // Fetch the deploy transaction from etherscan
      const history = await etherscanProvider.getHistory(contractAddress, 0)
      const deployTx = history[0]

      log('Deploying Repo...')
      const newDeployTx = await web3.eth.sendTransaction({
        from: owner,
        data: deployTx.data,
        gas: 4712388,
        gasPrice: 100000000000,
      })
      log('====================')

      const newContractAddress = newDeployTx.contractAddress
      log(newContractAddress)

      log('Publishing Repo...')
      const versionInfo = {
        version: '1.0.0',
        contractAddress: newContractAddress,
        contentUri: toUtf8IfHex(contentURI),
      }

      const txData = await publishVersion(
        fullName,
        versionInfo,
        ethersWeb3Provider,
        {
          managerAddress: owner,
        }
      )

      const newPublishTx = await web3.eth.sendTransaction({
        from: owner,
        to: txData.to,
        data: encodePublishVersionTxData(txData),
        gas: 4712388,
        gasPrice: 100000000000,
      })
      log('====================')

      const newRepoAddress = newPublishTx.contractAddress
      log(newRepoAddress)
    }
  }
}

/**
 * Parses hex string if it's a hex string, otherwise returns it
 * @param hex "0xaa6161" | "hello"
 */
function toUtf8IfHex(hex) {
  return ethers.utils.isHexString(hex)
    ? ethers.utils.toUtf8String(hex, true)
    : hex
}

main()
  .then(() => {
    console.log('Script finished.')
    process.exit()
  })
  .catch((e) => console.error(e))
