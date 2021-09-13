const namehash = require("eth-ens-namehash").hash;

const log = console.log;

task("new-apm", "Create a new APM")
  .addParam("name", "The name of the new APM")
  .addParam("apm", "The APM (aragonpm.eth) address")
  .addParam("factory", "The APM Factory address")
  .setAction(async ({ name, apm, factory }, { ethers, artifacts }) => {
    const keccak256 = ethers.utils.id;
    const APMRegistryFactory = await artifacts.readArtifact(
      "APMRegistryFactory"
    );
    const APMRegistry = await artifacts.readArtifact("APMRegistry");
    const ENSSubdomainRegistrar = await artifacts.readArtifact(
      "ENSSubdomainRegistrar"
    );
    const Kernel = await artifacts.readArtifact("Kernel");
    const ACL = await artifacts.readArtifact("ACL");

    const tldName = "aragonpm.eth";
    const tldHash = namehash(tldName);
    const labelHash = keccak256(name);

    const [signer] = await ethers.getSigners();
    const owner = signer.address;
    console.log("owner", owner);

    const apmContract = new ethers.Contract(apm, APMRegistry.abi, signer);
    const apmFactory = new ethers.Contract(
      factory,
      APMRegistryFactory.abi,
      signer
    );

    const registrar = await apmContract.registrar();
    const apmENSSubdomainRegistrar = new ethers.Contract(
      registrar,
      ENSSubdomainRegistrar.abi,
      signer
    );
    const create_name_role = await apmENSSubdomainRegistrar.CREATE_NAME_ROLE();

    log("Managing permissions...");
    const kernelAddress = await apmContract.kernel();
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
    log(`Label: ${name} (${labelHash})`);
    log("=========");

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
  });
