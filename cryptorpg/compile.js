const path = require('path');
const fs = require('fs');
const solc = require('solc');

console.log("Finding SafeMath");
const mathContractPath = path.resolve(__dirname, 'contracts', 'SafeMath.sol');
const mathSource = fs.readFileSync(mathContractPath, 'utf8');

console.log("Finding Armor");
const armorContractPath = path.resolve(__dirname, 'contracts', 'Armor.sol');
const armorSource = fs.readFileSync(armorContractPath, 'utf8');

console.log("Finding Weapon");
const weaponContractPath = path.resolve(__dirname, 'contracts', 'Weapon.sol');
const weaponSource = fs.readFileSync(weaponContractPath, 'utf8');

console.log("Finding Characters");
const charsContractPath = path.resolve(__dirname, 'contracts', 'Characters.sol');
const charsSource = fs.readFileSync(charsContractPath, 'utf8');

const input = {
  'Armor.sol': armorSource,
  'Weapon.sol': weaponSource,
  'SafeMath.sol': mathSource,
  'Characters.sol': charsSource,
};

console.log("Compiling All");
const compiled = solc.compile({sources: input}, 1);
const armor = compiled.contracts['Armor.sol:Armor'];
const math = compiled.contracts['SafeMath.sol:SafeMath'];
const weapon = compiled.contracts['Weapon.sol:Weapon'];
const chars = compiled.contracts['Characters.sol:Characters'];

module.exports = {
  chars,
  armor,
  weapon,
}