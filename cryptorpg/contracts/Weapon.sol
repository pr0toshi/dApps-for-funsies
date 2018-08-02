pragma solidity ^0.4.23;

contract Weapon {
    int public standardAttack;
    int public fireDamage;
    int public waterDamage;
    int public physicalDamage;

    constructor(int _atk, int _fire, int _water, int _physical) public {
        standardAttack = _atk;
        fireDamage = _fire;
        waterDamage = _water;
        physicalDamage = _physical;
    }

    function isWeapon() public pure returns (bool) {
        return true;
    }
}