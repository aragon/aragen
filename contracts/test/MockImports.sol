pragma solidity 0.4.24;

import "@aragon/os/contracts/acl/ACL.sol";
import "@aragon/os/contracts/kernel/Kernel.sol";
import "@aragon/os/contracts/factory/DAOFactory.sol";
import "@aragon/os/contracts/factory/APMRegistryFactory.sol";
import "@aragon/os/contracts/factory/ENSFactory.sol";
import "@aragon/os/contracts/apm/APMRegistry.sol";
import "@aragon/os/contracts/apm/Repo.sol";
import "@aragon/os/contracts/ens/ENSSubdomainRegistrar.sol";
import "@aragon/os/contracts/lib/ens/ENS.sol";
import "@aragon/os/contracts/lib/ens/AbstractENS.sol";

import "@aragon/id/contracts/FIFSResolvingRegistrar.sol";

import "@aragon/apps-shared-minime/contracts/MiniMeToken.sol";


// You might think this file is a bit odd, but let me explain.
// We only use some contracts for deploy, which means Truffle
// will not compile it for us, because it is from an external
// dependency.
//
// We are now left with two options:
// - Copy/paste these contracts
// - Or trick Truffle by claiming we use it in a Solidity test
//

contract MockImports {
  constructor() public {
    // to avoid lint error
  }
}