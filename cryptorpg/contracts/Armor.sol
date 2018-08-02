pragma solidity ^0.4.23;

contract Armor {
    int public baseDefense;
    int public fireResistance;
    int public waterResistance;
    int public physicalResistance;

    constructor(int _base, int _fire, int _water, int _physical) public {
        baseDefense = _base;
        fireResistance = _fire;
        waterResistance = _water;
        physicalResistance = _physical;
    }

    function isArmor() public pure returns (bool) {
        return true;
    }
}
