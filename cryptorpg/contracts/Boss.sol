pragma solidity ^0.4.23;

import "./Characters.sol";

contract Boss {
    address owner;
    uint32 health;
    uint32 attack;
    uint32 defense;

    Characters characters;

    function () public payable {
        revert();
    }

    constructor(address _characters) public {
        owner = msg.sender;
        characters = Characters(_characters);
    }

    // function attack(address char) public {
    //     characters[char].defense;
    // }
}