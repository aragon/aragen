const { expect } = require("chai");
const { ethers, artifacts } = require("hardhat");
const namehash = require("eth-ens-namehash").hash;
const keccak256 = ethers.utils.id;

// addresses for mumbai environment
const apmRegistryName = "1hive";
const owner = "0x94C34FB5025e054B24398220CBDaBE901bd8eE5e";
const apmRegistryFactoryAddress = "0x5e5de5f3dae619b5469b02a3d50ffb7602f6e726";
const jsonRpcUrl =
  "https://polygon-mumbai.g.alchemy.com/v2/z3go4SKtSuiegUwtfkfd5tBCLDTcwYP_";

const ENS = {
  address: "0x431f0eed904590b176f9ff8c36a1c4ff0ee9b982",
  abi: [
    "function owner(bytes32 node) public view returns(address)",
    "function setSubnodeOwner(bytes32,bytes32,address)",
  ],
};

const log = console.log;

async function setEnsOwner(ens, owner) {
  try {
    tx = await ens.setSubnodeOwner(
      namehash("eth"),
      keccak256("aragonpm"),
      owner
    );
    await tx.wait();
    console.log("successfully set apm owner", tx.hash);
  } catch (err) {
    console.error(`failed to set aragonpm.eth to ${owner}`, err);
  }
}

describe("create 1hive APM", function () {
  before(async () => {
    await network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl,
          },
        },
      ],
    });
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [owner],
    });
  });

  after(async () => {
    await network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: [owner],
    });
    await network.provider.request({
      method: "hardhat_reset",
      params: [],
    });
  });

  it("Should create successfully", async function () {
    const APMRegistryFactory = await artifacts.readArtifact(
      "APMRegistryFactory"
    );

    const tldName = "aragonpm.eth";
    const labelName = apmRegistryName;
    const tldHash = namehash(tldName);
    const labelHash = keccak256(labelName);

    const signer = await ethers.getSigner(owner);
    const apmFactory = new ethers.Contract(
      apmRegistryFactoryAddress,
      APMRegistryFactory.abi,
      signer
    );

    log("=========");
    log("ETH: ", namehash("eth"));
    log(`TLD: ${tldName} (${tldHash})`);
    log(`Label: ${labelName} (${labelHash})`);
    log("=========");

    // apm factory must own aragonpm.eth to create subdomain
    log("set aragonpm.eth to apm factory", apmFactory.address);
    const ens = new ethers.Contract(ENS.address, ENS.abi, signer);
    const apmOwner = await ens.owner(namehash("aragonpm.eth"));
    log("apmOwner...", apmOwner);
    await setEnsOwner(ens, apmFactory.address);

    log("Deploying 1hive APM...");
    tx = await apmFactory.newAPM(tldHash, labelHash, owner);
    const receipt = await tx.wait();

    log("=========");
    const newAPMAddr = receipt.events?.find((e) => e.event === "DeployAPM")
      ?.args?.apm;

    log(`# ${apmRegistryName} APM:`);
    log("Address:", newAPMAddr);
    log("Transaction hash:", tx.hash);
    log("=========");

    expect(newAPMAddr).to.be.a("string");
    expect(tx.hash).to.be.a("string");

    // revert back to previous owner
    await setEnsOwner(ens, apmOwner);
    log("apm owner..", await ens.owner(namehash("aragonpm.eth")));
  });
});
