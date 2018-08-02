const Web3 = require('web3');
const assert = require('assert');
const ganache = require('ganache-cli');
const BigNumber = require('bignumber.js');

const web3 = new Web3(ganache.provider());
const {
  auction,
  dist,
  erc223,
  token,
} = require('../compile');
// const { interface, bytecode } = require('../compile');

let accounts;
let auctionContract;
let distContract;

let auctionAddress;
let distAddress;
let tokenAddress;

const INITIAL_DEFENSE = '10';
const INITIAL_DEFENSE_2 = '25';
const DECIMALS = new BigNumber(Math.pow(10, 18));
const SUPPLY_IN_WAIFU = new BigNumber(100000000);
const TOTAL_SUPPLY = DECIMALS.multipliedBy(SUPPLY_IN_WAIFU);
const TEST_TRANSFER = DECIMALS.multipliedBy(100);
const TEST_BURN = DECIMALS.multipliedBy(20000);

before(async () => {
  accounts = await web3.eth.getAccounts();
  console.log("Current address: ", accounts[0]);

  auctionContract = await new web3.eth.Contract(JSON.parse(auction.interface))
    .deploy({
      data: auction.bytecode,
      arguments: [
        accounts[0],
        '10000',
        '10000',
        '18',
      ]
    })
    .send({
      from: accounts[0],
      gas: '4000000',
    });

  distContract = await new web3.eth.Contract(JSON.parse(dist.interface))
    .deploy({
      data: dist.bytecode,
      arguments: [
        auctionContract.options.address,
      ]
    })
    .send({
      from: accounts[0],
      gas: '4000000',
    });

  tokenContract = await new web3.eth.Contract(JSON.parse(token.interface))
    .deploy({
      data: token.bytecode,
      arguments: [
        auctionContract.options.address,
        accounts[0],
        TOTAL_SUPPLY,
      ]
    })
    .send({
      from: accounts[0],
      gas: '4000000',
    });
});

describe('Token Contract', () => {
  it('deploys a contract', () => {
    assert.ok(tokenContract.options.address);
  });

  it('has correct supply', async () => {
    // const gas = await tokenContract.methods.totalSupply().estimateGas();
    // console.log(gas);
    const supply = await tokenContract.methods.totalSupply().call();
    assert.ok(TOTAL_SUPPLY.isEqualTo(supply));
  });

  it('sends supply to wallet account', async () => {
    const balanceOf = await tokenContract.methods.balanceOf(accounts[0]).call({
      from: accounts[0],
      gas: '23500',
    });
    assert.ok(BigNumber(balanceOf).isEqualTo(TOTAL_SUPPLY.dividedBy(2)));
  });

  it('sends supply to auction account', async () => {
    const balanceOf = await tokenContract.methods.balanceOf(auctionContract.options.address).call({
      from: accounts[0],
      gas: '23500',
    });
    assert.ok(BigNumber(balanceOf).isEqualTo(TOTAL_SUPPLY.dividedBy(2)));
  });

  it('properly restricts insufficient balance transfers', async () => {
    try {
      const spentTokens = await tokenContract.methods.transfer(
        accounts[0],
        TEST_TRANSFER
      ).send({
        from: accounts[1],
        gas: '54800',
      });
      assert.fail();
    } catch(err) {
      assert.ok(/revert/.test(err.message));
    }
  });

  it('successfully transfers from wallet account', async () => {
    const transferSuccess = await tokenContract.methods.transfer(
      accounts[1],
      TEST_TRANSFER,
      '0x00'
    ).send({
      from: accounts[0],
      gas: '54800',
    });
    assert.ok(transferSuccess);
  });

  it('transfers correct amount', async () => {
    const balanceOf = await tokenContract.methods.balanceOf(accounts[1]).call({
      from: accounts[0],
      gas: '23500',
    });
    assert.ok(BigNumber(balanceOf).isEqualTo(TEST_TRANSFER));
  });

  it('properly restricts unallowed spenders', async () => {
    try {
      const spentTokens = await tokenContract.methods.transferFrom(
        accounts[1],
        accounts[0],
        TEST_TRANSFER
      ).send({
        from: accounts[0],
        gas: '56000',
      });
      assert.fail();
    } catch(err) {
      assert.ok(/revert/.test(err.message));
    }
  });

  it('successfully sets allowance', async () => {
    const approve = await tokenContract.methods.approve(
      accounts[0],
      TEST_TRANSFER,
    ).send({
      from: accounts[1],
      gas: '46500',
    });
    assert.ok(approve);
  });

  it('properly sets allowance', async () => {
    const approve = await tokenContract.methods.allowance(
      accounts[1],
      accounts[0],
    ).call({
      from: accounts[1],
      gas: '25100',
    });
    assert.ok(BigNumber(approve).isEqualTo(TEST_TRANSFER));
  });

  it('successfully transfers allotted coins', async () => {
    const transferFromSuccess = await tokenContract.methods.transferFrom(
      accounts[1],
      accounts[0],
      TEST_TRANSFER,
    ).send({
      from: accounts[0],
      gas: '56000',
    });
    assert.ok(transferFromSuccess);
  });

  it('properly removes allowance', async () => {
    const approve = await tokenContract.methods.allowance(
      accounts[1],
      accounts[0],
    ).call({
      from: accounts[1],
      gas: '25100',
    });
    assert.ok(BigNumber(approve).isEqualTo(0));
  });

  it('reduces accounts[1] properly', async () => {
    const balanceOf = await tokenContract.methods.balanceOf(accounts[1]).call({
      from: accounts[0],
      gas: '23500',
    });
    assert.ok(BigNumber(balanceOf).isEqualTo(0));
  });

  it('increases accounts[0] properly', async () => {
    const balanceOf = await tokenContract.methods.balanceOf(accounts[0]).call({
      from: accounts[0],
      gas: '23500',
    });
    assert.ok(TOTAL_SUPPLY.dividedBy(2).isEqualTo(balanceOf));
  });

  it('successfully burns supply', async () => {
    const success = await tokenContract.methods.burn(TEST_BURN).send({
      from: accounts[0],
      gas: '37500',
    });
    assert.ok(success);
  });

  it('properly reduces supply after burn', async () => {
    const totalSupply = await tokenContract.methods.totalSupply().call({
      from: accounts[0],
      gas: '21800',
    });
    assert.ok(TOTAL_SUPPLY.minus(TEST_BURN).isEqualTo(totalSupply));
  });

  it('properly reduces senders balance after burn', async () => {
    const balanceOf = await tokenContract.methods.balanceOf(accounts[0]).call({
      from: accounts[0],
      gas: '23500',
    });
    assert.ok(TOTAL_SUPPLY.dividedBy(2).minus(TEST_BURN).isEqualTo(balanceOf));
  });
});

describe('Auction Contract', () => {
  it('deploys a contract', () => {
    assert.ok(auctionContract.options.address);
  });
});

describe('Distribution Contract', () => {
  it('deploys a contract', () => {
    assert.ok(distContract.options.address);
  });

  it('properly sets stage after deployment', async () => {
    const properStage = await auctionContract.methods.stage().call({
      from: accounts[0],
      gas: '22200',
    })
    assert.equal(properStage, '0');
  });

  it('places auction into setup stage', async () => {
    await auctionContract.methods.setup(tokenContract.options.address).send({
      from: accounts[0],
      gas: '110000',
    });
    const properStage = await auctionContract.methods.stage().call({
      from: accounts[0],
      gas: '22200',
    })
    assert.equal(properStage, '1');
  })
});

/*
describe('Characters contract clean up', () => {
  it('properly restricts selfdestruct', async () => {
    try {
      const tx = await charsContract.methods.destroy().send({
        from: accounts[1],
        gas: '32000',
      })
      assert.fail();
    } catch(err) {
      assert.ok(/revert/.test(err.message));
    }
  })

  it('properly selfdestructs', async () => {
    const successful = await charsContract.methods.destroy().send({
      from: accounts[0],
      gas: '30000',
    })
    try {
      const owner = await charsContract.methods.owner().call();
      assert.fail();
    } catch (err) {
      assert.ok(/not a contract/.test(err.message));
    }
  })
})  */