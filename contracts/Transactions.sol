pragma solidity ^0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";


contract Transactions is AragonApp {

    address public finance;

    function initialize(address _finance) public onlyInit {
        initialized();
        finance = _finance;
    }
}
