/*
 * this task is used to create APM (AragonPM Registry DAO) such as
 * 1hive.aragonpm.eth, open.aragonpm.eth.
 *
 * Usage:
 *    npx hardhat new-apm --name {name} --factory {apmFactoryAddress} --network {network}
 * where
 *    - name is the label name of the APM, i.e. 1hive
 *    - apmFacotryAddress is APMRegistryFactory address
 *
 * For example, on mumbai:
 *    npx hardhat new-apm --name 1hive --factory 0x5e5de5f3dae619b5469b02a3d50ffb7602f6e726 --network mumbai
 */

const namehash = require("eth-ens-namehash").hash;
const ENS = {
  address: "0x431f0eed904590b176f9ff8c36a1c4ff0ee9b982",
  abi: [
    "function owner(bytes32 node) public view returns(address)",
    "function setSubnodeOwner(bytes32,bytes32,address)",
  ],
};

const log = console.log;

task("new-apm", "Create a new APM")
  .addParam("name", "The name of the new APM")
  .addParam("factory", "The APM Factory address")
  .setAction(async ({ name, factory }, { ethers, artifacts }) => {
    const keccak256 = ethers.utils.id;

    async function setEnsOwner(ens, owner) {
      try {
        tx = await ens.setSubnodeOwner(
          namehash("eth"),
          keccak256("aragonpm"),
          owner
        );
        await tx.wait();
        console.log("successfully set apm owner");
      } catch (err) {
        console.error(`failed to set aragonpm.eth to ${owner}`, err);
      }
    }

    const APMRegistryFactory = await artifacts.readArtifact(
      "APMRegistryFactory"
    );

    const tldName = "aragonpm.eth";
    const tldHash = namehash(tldName);
    const labelHash = keccak256(name);

    const [signer] = await ethers.getSigners();
    const owner = signer.address;
    console.log("owner", owner);

    const apmFactory = new ethers.Contract(
      factory,
      APMRegistryFactory.abi,
      signer
    );

    log("=========");
    log("ETH: ", namehash("eth"));
    log(`TLD: ${tldName} (${tldHash})`);
    log(`Label: ${name} (${labelHash})`);
    log("=========");

    // apm factory must own aragonpm.eth to create subdomain
    log("set aragonpm.eth to apm factory", apmFactory.address);
    const ens = new ethers.Contract(ENS.address, ENS.abi, signer);
    const apmOwner = await ens.owner(namehash("aragonpm.eth"));
    log("apmOwner...", apmOwner);
    await setEnsOwner(ens, apmFactory.address);

    log(`Deploying ${name} APM...`);
    tx = await apmFactory.newAPM(tldHash, labelHash, owner);
    const receipt = await tx.wait();

    log("=========");
    const newAPMAddr = receipt.events?.find((e) => e.event === "DeployAPM")
      ?.args?.apm;

    log(`# ${name} APM:`);
    log("Address:", newAPMAddr);
    log("Transaction hash:", tx.hash);
    log("=========");

    // revert back to previous owner
    await setEnsOwner(ens, apmOwner);
    log("apm owner..", await ens.owner(namehash("aragonpm.eth")));
  });
