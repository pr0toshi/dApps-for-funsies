const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const {
  erc721,
  erc721Token,
  erc721Basic,
  erc721BasicToken,
} = require('../compile');
// const { interface, bytecode } = require('../compile');

let accounts;
let erc721tama;
let birthBlock;
let lastBlock;

const TOKEN_ID = "3414124";

before(async () => {
  accounts = await web3.eth.getAccounts();
  console.log("Current address: ", accounts[0]);

  erc721tama = await new web3.eth.Contract(JSON.parse(erc721Token.interface))
    .deploy({
      data: erc721Token.bytecode,
      arguments: ["thing", "THING"],
    })
    .send({
      from: accounts[0],
      gas: '4000000',
    });
});

describe('ERC721 Contract', () => {
  it('deploys a contract', () => {
    assert.ok(erc721tama.options.address);
  });

  it('properly creates a Tama', async () => {
    const exists = await erc721tama.methods.createTama(
      accounts[0],
      TOKEN_ID,
    ).send({
        value: web3.utils.toWei('0.02', 'ether'),
        from: accounts[0],
        gas: '200000',
    });
    birthBlock = await web3.eth.getBlock('latest');
    birthBlock = birthBlock.number;
    assert.ok(exists);
  })

  it('tama properly exists', async () => {
    const exists = await erc721tama.methods.tamaExistsByID(TOKEN_ID).call();
    assert.equal(exists, true);
  })

  it('tama happiness is properly stored', async () => {
    const happiness = await erc721tama.methods.tamaHappinessByID(TOKEN_ID).call();
    assert.equal(happiness, 140);
  })

  it('tama interaction is properly stored', async () => {
    const interaction = await erc721tama.methods.tamaLastInteractionByID(TOKEN_ID).call();
    assert.equal(interaction, birthBlock);
  })

  it('tama age is properly stored', async () => {
    const age = await erc721tama.methods.tamaAgeByID(TOKEN_ID).call();
    assert.equal(age, 0);
  })

  it('tama birth block is properly stored', async () => {
    const birth = await erc721tama.methods.tamaBirthBlockByID(TOKEN_ID).call();
    assert.equal(birth, birthBlock);
  })

  it('tama state is properly stored', async () => {
    const state = await erc721tama.methods.tamaStateByID(TOKEN_ID).call();
    assert.equal(state, 0);
  })

  it('tama stats uint is properly stored', async () => {
    const stats = await erc721tama.methods.tamaStatsByID(TOKEN_ID).call();
    assert.ok(!!stats);
  })

  it('properly checks into a Tama', async () => {
    const exists = await erc721tama.methods.checkInToTama(
      TOKEN_ID,
    ).send({
        from: accounts[0],
        gas: '200000',
    });
    lastBlock = await web3.eth.getBlock('latest');
    lastBlock = lastBlock.number;
    assert.ok(exists);
  })

  it('tama happiness is properly the same', async () => {
    const happiness = await erc721tama.methods.tamaHappinessByID(TOKEN_ID).call();
    assert.equal(happiness, 140);
  })

  it('tama stats uint is properly changed', async () => {
    const stats = await erc721tama.methods.tamaStatsByID(TOKEN_ID).call();
    assert.ok(!!stats);
  })

  it('tama age is properly changed', async () => {
    const age = await erc721tama.methods.tamaAgeByID(TOKEN_ID).call();
    assert.equal(age, lastBlock - birthBlock);
  })

  it('tama interaction is properly changed', async () => {
    const interaction = await erc721tama.methods.tamaLastInteractionByID(TOKEN_ID).call();
    assert.equal(interaction, lastBlock);
  })

  it('properly checks into a Tama', async () => {
    const exists = await erc721tama.methods.checkInToTama(
      TOKEN_ID,
    ).send({
        from: accounts[0],
        gas: '200000',
    });
    lastBlock = await web3.eth.getBlock('latest');
    lastBlock = lastBlock.number;
    assert.ok(exists);
  })

  it('tama happiness is properly the same', async () => {
    const happiness = await erc721tama.methods.tamaHappinessByID(TOKEN_ID).call();
    assert.equal(happiness, 140);
  })

  it('tama age is properly changed again', async () => {
    const age = await erc721tama.methods.tamaAgeByID(TOKEN_ID).call();
    assert.equal(age, lastBlock - birthBlock);
  })

  it('tama interaction is properly changed', async () => {
    const interaction = await erc721tama.methods.tamaLastInteractionByID(TOKEN_ID).call();
    assert.equal(interaction, lastBlock);
  })


  // it('checks if new Character exists', async () => {
  //   const exists = await charsContract.methods.getIfCharacterExists(accounts[0]).call({
  //     from: accounts[0],
  //     gas: '30000',
  //   });
  //   assert.equal(exists, true);
  // })

  // it('successfully sets new Helmet', async () => {
  //   const tx = await charsContract.methods.setSenderHelmet(newArmorContract.options.address).send({
  //     from: accounts[0],
  //     gas: '32000',
  //   });
  //   assert.ok(tx);
  // })
});

// describe('Characters contract clean up', () => {
//   it('properly restricts selfdestruct', async () => {
//     try {
//       const tx = await charsContract.methods.destroy().send({
//         from: accounts[1],
//         gas: '32000',
//       })
//       assert.fail();
//     } catch(err) {
//       assert.ok(/revert/.test(err.message));
//     }
//   })

//   it('properly selfdestructs', async () => {
//     const successful = await charsContract.methods.destroy().send({
//       from: accounts[0],
//       gas: '30000',
//     })
//     try {
//       const owner = await charsContract.methods.owner().call();
//       assert.fail();
//     } catch (err) {
//       assert.ok(/not a contract/.test(err.message));
//     }
//   })
// })