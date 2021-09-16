require("@nomiclabs/hardhat-ethers");
require("./scripts/tasks/new-apm");

const { homedir } = require("os");
const { join } = require("path");

// get the network url and account private key from ~/.aragon/network_key.json
function getNetworkConfig(network) {
  // default to mumbai
  let url = "";
  let accounts = [];

  try {
    const networkConfig = require(join(
      homedir(),
      `.aragon/${network}_key.json`
    ));
    url = networkConfig.rpc;
    accounts = networkConfig.keys;
  } catch (_) {
    // for testing, use default url
    if (network === "mumbai") {
      url =
        "https://polygon-mumbai.g.alchemy.com/v2/z3go4SKtSuiegUwtfkfd5tBCLDTcwYP_";
    }
  }

  return { url, accounts };
}

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.4.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 20000, // TODO: target average DAO use
      },
    },
  },
  namedAccounts: {
    deployer: 0,
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      throwOnTransactionFailures: true,
      throwOnCallFailures: true,
      allowUnlimitedContractSize: true,
    },
    mainnet: getNetworkConfig("mainnet"),
    rinkeby: getNetworkConfig("rinkeby"),
    mumbai: getNetworkConfig("mumbai"),
    matic: getNetworkConfig("matic"),
  },
  mocha: {
    timeout: 30000,
  },
};
