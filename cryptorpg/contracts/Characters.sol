pragma solidity ^0.4.23;

import "./SafeMath.sol";
import "./Armor.sol";
import "./Weapon.sol";

contract Characters {
    using SafeMath for int;
    using SafeMath for uint;

    struct CharacterSpec {
        uint health;
        bool exists;
        address creator;
        address helmet;
        address torso;
        address armPlates;
        address legPlates;
        address weapon;
    }

    mapping(address => CharacterSpec) characters;

    address public owner;

    function () public payable {
        revert();
    }

    function destroy() public onlyOwner {
        selfdestruct(owner);
    }

    constructor() public {
        owner = msg.sender;
    }

    function createCharacter(
        address _helmet,
        address _torso,
        address _armPlates,
        address _legPlates,
        address _weapon
    ) public validateCharacterIsNew(characters[msg.sender]) returns (bool) {
        require(Armor(_helmet).isArmor(), "Helmet sent is not a proper contract");
        require(Armor(_torso).isArmor(), "Torso sent is not a proper contract");
        require(Armor(_armPlates).isArmor(), "Arm Plates sent is not a proper contract");
        require(Armor(_legPlates).isArmor(), "Leg Plates sent is not a proper contract");
        require(Weapon(_weapon).isWeapon(), "Weapon sent is not a proper contract");
        characters[msg.sender].creator = msg.sender;
        characters[msg.sender].health = 100;
        characters[msg.sender].helmet = _helmet;
        characters[msg.sender].torso = _torso;
        characters[msg.sender].armPlates = _armPlates;
        characters[msg.sender].legPlates = _legPlates;
        characters[msg.sender].weapon = _weapon;
        characters[msg.sender].exists = true;
        return true;
    }

    function getIfCharacterExists(address _char) public view returns (bool) {
        return characters[_char].exists;
    }

    function getCreatorOf(address _char) public view validateCharacter(characters[_char]) returns (address) {
        return characters[_char].creator;
    }

    function getHealthOf(address _char) public view validateCharacter(characters[_char]) returns (uint) {
        return characters[_char].health;
    }

    function getHelmetOf(address _char) public view validateArmor(characters[_char].helmet) returns (address) {
        return characters[_char].helmet;
    }

    function getTorsoOf(address _char) public view validateArmor(characters[_char].helmet) returns (address) {
        return characters[_char].torso;
    }

    function getArmPlatesOf(address _char) public view validateArmor(characters[_char].armPlates) returns (address) {
        return characters[_char].armPlates;
    }

    function getLegPlatesOf(address _char) public view validateArmor(characters[_char].legPlates) returns (address) {
        return characters[_char].legPlates;
    }

    function getWeaponOf(address _char) public view validateWeapon(characters[_char].weapon) returns (address) {
        return characters[_char].weapon;
    }

    function getTotalDefense(address _char) public view validateCharacterSet(characters[_char]) returns (int) {
        int totalDefense = Armor(characters[_char].helmet).baseDefense();
        totalDefense += Armor(characters[_char].torso).baseDefense();
        totalDefense += Armor(characters[_char].armPlates).baseDefense();
        totalDefense += Armor(characters[_char].legPlates).baseDefense();
        return totalDefense;
    }

    function setSenderHelmet(Armor _helmet) public validateArmor(_helmet) {
        characters[msg.sender].helmet = _helmet;
    }

    function setSenderTorso(Armor _torso) public validateArmor(_torso)  {
        characters[msg.sender].torso = _torso;
    }

    function setSenderArmPlates(Armor _armPlates) public validateArmor(_armPlates)  {
        characters[msg.sender].armPlates = _armPlates;
    }

    function setSenderLegPlates(Armor _legPlates) public validateArmor(_legPlates) {
        characters[msg.sender].legPlates = _legPlates;
    }

    function setSenderWeapon(Weapon _weapon) public validateWeapon(_weapon) {
        characters[msg.sender].weapon = _weapon;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    modifier validateCharacterSet(CharacterSpec _char) {
        require(_char.exists);
        require(Weapon(_char.weapon).isWeapon());
        require(Armor(_char.helmet).isArmor());
        require(Armor(_char.torso).isArmor());
        require(Armor(_char.armPlates).isArmor());
        require(Armor(_char.legPlates).isArmor());
        _;
    }

    modifier validateCharacter(CharacterSpec _char) {
        require(_char.exists, "Character exists");
        _;
    }

    modifier validateCharacterIsNew(CharacterSpec _char) {
        require(!_char.exists, "Character doesnt exist");
        _;
    }

    modifier validateArmor(address _armor) {
        require(characters[msg.sender].exists);
        require(Armor(_armor).isArmor());
        _;
    }

    modifier validateWeapon(address _weapon) {
        require(characters[msg.sender].exists);
        require(Weapon(_weapon).isWeapon());
        _;
    }
}