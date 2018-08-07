const path = require('path');
const fs = require('fs');
const solc = require('solc');

console.log("Finding SafeMath");
const mathContractPath = path.resolve(__dirname, 'contracts', 'SafeMath.sol');
const mathSource = fs.readFileSync(mathContractPath, 'utf8');

console.log("Finding AddressUtils");
const adrContractPath = path.resolve(__dirname, 'contracts', 'AddressUtils.sol');
const adrSource = fs.readFileSync(adrContractPath, 'utf8');

console.log("Finding ERC165");
const erc165ContractPath = path.resolve(__dirname, 'contracts', 'ERC165.sol');
const erc165Source = fs.readFileSync(erc165ContractPath, 'utf8');

console.log("Finding ERC721");
const erc721ContractPath = path.resolve(__dirname, 'contracts', 'ERC721.sol');
const erc721Source = fs.readFileSync(erc721ContractPath, 'utf8');

console.log("Finding ERC721Basic");
const erc721BasicContractPath = path.resolve(__dirname, 'contracts', 'ERC721Basic.sol');
const erc721BasicSource = fs.readFileSync(erc721BasicContractPath, 'utf8');

console.log("Finding ERC721BasicToken");
const erc721BasicTokenContractPath = path.resolve(__dirname, 'contracts', 'ERC721BasicToken.sol');
const erc721BasicTokenSource = fs.readFileSync(erc721BasicTokenContractPath, 'utf8');

console.log("Finding ERC721Receiver");
const erc721ReceiverContractPath = path.resolve(__dirname, 'contracts', 'ERC721Receiver.sol');
const erc721ReceiverSource = fs.readFileSync(erc721ReceiverContractPath, 'utf8');

console.log("Finding ERC721Token");
const erc721TokenContractPath = path.resolve(__dirname, 'contracts', 'ERC721Tamagotchis.sol');
const erc721TokenSource = fs.readFileSync(erc721TokenContractPath, 'utf8');

console.log("Finding SupportsInterfaceWithLookup");
const interfaceSupportContractPath = path.resolve(__dirname, 'contracts', 'SupportsInterfaceWithLookup.sol');
const interfaceSupportSource = fs.readFileSync(interfaceSupportContractPath, 'utf8');

const input = {
  'SafeMath.sol':mathSource,
  'ERC165.sol':erc165Source,
  'AddressUtils.sol':adrSource,
  'SupportsInterfaceWithLookup.sol':interfaceSupportSource,
  'ERC721.sol':erc721Source,
  'ERC721Basic.sol':erc721BasicSource,
  'ERC721Receiver.sol':erc721ReceiverSource,
  'ERC721Tamagotchis.sol':erc721TokenSource,
  'ERC721BasicToken.sol':erc721BasicTokenSource,
};

console.log("Compiling All");
const compiled = solc.compile({sources: input}, 1);
const erc165 = compiled.contracts['ERC165.sol:ERC165'];
const erc721 = compiled.contracts['ERC721.sol:ERC721'];
const math = compiled.contracts['SafeMath.sol:SafeMath'];
const erc721Basic = compiled.contracts['ERC721Basic.sol:ERC721Basic'];
const erc721BasicToken = compiled.contracts['ERC721BasicToken.sol:ERC721BasicToken'];
const erc721Receiver = compiled.contracts['ERC721Receiver.sol:ERC721Receiver'];
const supportInterface = compiled.contracts['SupportsInterfaceWithLookup.sol:SupportsInterfaceWithLookup'];
const erc721Token = compiled.contracts['ERC721Tamagotchis.sol:ERC721Tamagotchis'];

module.exports = {
    erc165,
    erc721,
    math,
    erc721Token,
    erc721Basic,
    erc721BasicToken,
    erc721Receiver,
    supportInterface,
}