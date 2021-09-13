const { expect } = require("chai");
const { ethers, artifacts } = require("hardhat");
const namehash = require("eth-ens-namehash").hash;
const keccak256 = ethers.utils.id;

// addresses for mumbai environment
const apmRegistryName = "1hive";
const owner = "0x94C34FB5025e054B24398220CBDaBE901bd8eE5e";

const ensAddress = "0x431f0eed904590b176f9ff8c36a1c4ff0ee9b982";
const apmAddr = "0x78e08e43244187f2b922241ce7397d8f013a02d6";
const apmRegistryFactoryAddress = "0x5e5de5f3dae619b5469b02a3d50ffb7602f6e726";

const log = console.log;

describe("create 1hive APM", function () {
  before(async () => {
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
  });

  it("Should create successfully", async function () {
    const APMRegistryFactory = await artifacts.readArtifact(
      "APMRegistryFactory"
    );
    const APMRegistry = await artifacts.readArtifact("APMRegistry");
    const ENSSubdomainRegistrar = await artifacts.readArtifact(
      "ENSSubdomainRegistrar"
    );
    const Kernel = await artifacts.readArtifact("Kernel");
    const ACL = await artifacts.readArtifact("ACL");
    const ENS = await artifacts.readArtifact("ENS");

    const tldName = "aragonpm.eth";
    const labelName = apmRegistryName;
    const tldHash = namehash(tldName);
    const labelHash = keccak256(labelName);

    const signer = await ethers.getSigner(owner);
    const ens = new ethers.Contract(ensAddress, ENS.abi, signer);
    const apm = new ethers.Contract(apmAddr, APMRegistry.abi, signer);
    const apmFactory = new ethers.Contract(
      apmRegistryFactoryAddress,
      APMRegistryFactory.abi,
      signer
    );

    const registrar = await apm.registrar();
    const apmENSSubdomainRegistrar = new ethers.Contract(
      registrar,
      ENSSubdomainRegistrar.abi,
      signer
    );
    const create_name_role = await apmENSSubdomainRegistrar.CREATE_NAME_ROLE();

    log("Managing permissions...");
    const kernelAddress = await apm.kernel();
    const kernel = new ethers.Contract(kernelAddress, Kernel.abi, signer);
    const aclAddress = await kernel.acl();
    const acl = new ethers.Contract(aclAddress, ACL.abi, signer);

    log(`Remove manager for create_name_role`);
    // We need to remove the manager of the role to add permissions
    let tx = await acl.removePermissionManager(registrar, create_name_role);
    await tx.wait();
    log(`Create permission for root account on create_name_role`);
    tx = await acl.createPermission(owner, registrar, create_name_role, owner);
    await tx.wait();

    log("=========");
    log("ETH: ", namehash("eth"));
    log(`TLD: ${tldName} (${tldHash})`);
    log(`Label: ${labelName} (${labelHash})`);
    log("=========");

    /*
    log(
      `Assigning ENS name (${tldName}) to ENSSubdomainRegistrar...`,
      apmENSSubdomainRegistrar.address
    );
    try {
      tx = await ens.setSubnodeOwner(
        namehash("eth"),
        keccak256("aragonpm"),
        apmENSSubdomainRegistrar.address
      );
      await tx.wait();
      log(`assigned ${tldName} successfully`);
    } catch (err) {
      console.err("failed to set aragonpm.eth to apmFactory", err);
    }

    log("=========");
    log(
      `Assigning ENS name (${labelName}.${tldName}) to APM factory...`,
      apmFactory.address
    );

    try {
      tx = await apmENSSubdomainRegistrar.createName(
        labelHash,
        apmFactory.address
      );
      await tx.wait();
    } catch (err) {
      console.error(
        `Error: could not set the owner of '${labelName}.${tldName}' on the given ENS instance`,
        `(${ensAddress}). Make sure you have ownership rights over the subdomain.`
      );
      throw err;
    }
*/
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
  });
});
