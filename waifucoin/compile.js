const path = require('path');
const fs = require('fs');
const solc = require('solc');

console.log("Finding ERC223ReceivingContract");
const erc223ContractPath = path.resolve(__dirname, 'contracts', 'ERC223ReceivingContract.sol');
const erc223Source = fs.readFileSync(erc223ContractPath, 'utf8');

console.log("Finding Distribution");
const distContractPath = path.resolve(__dirname, 'contracts', 'distribution.sol');
const distSource = fs.readFileSync(distContractPath, 'utf8');

console.log("Finding Token");
const tokenContractPath = path.resolve(__dirname, 'contracts', 'token.sol');
const tokenSource = fs.readFileSync(tokenContractPath, 'utf8');

console.log("Finding Auction");
const auctionContractPath = path.resolve(__dirname, 'contracts', 'auction.sol');
const auctionSource = fs.readFileSync(auctionContractPath, 'utf8');

const input = {
  'auction.sol': auctionSource,
  'distribution.sol': distSource,
  'ERC223ReceivingContract.sol': erc223Source,
  'token.sol': tokenSource,
};

console.log("Compiling All");
const compiled = solc.compile({sources: input}, 1);
const auction = compiled.contracts['auction.sol:DutchAuction'];
const dist = compiled.contracts['distribution.sol:Distributor'];
const erc223 = compiled.contracts['ERC223ReceivingContract.sol:ERC223ReceivingContract'];
const token = compiled.contracts['token.sol:WaifuToken'];

module.exports = {
  auction,
  dist,
  erc223,
  token,
}