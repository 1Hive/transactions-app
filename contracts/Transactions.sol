pragma solidity ^0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";


contract Transactions is AragonApp {

    // ACL
    bytes32 constant public DUMMY_ROLE = keccak256("DUMMY_ROLE");

    function initialize() public onlyInit {
        initialized();
    }
}
