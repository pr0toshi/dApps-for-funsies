const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const {
  chars,
  armor,
  weapon,
} = require('../compile');
// const { interface, bytecode } = require('../compile');

let accounts;
let charsContract;
let armorContract;
let weaponContract;

let helmetAddress;
let torsoAddress;
let armPlatesAddress;
let legPlatesAddress;
let weaponAddress;

let newArmorContract;
let newWeaponContract;

let currentHelmet;
let currentTorso;
let currentArmPlates;
let currentLegPlates;
let currentWeapon;

const INITIAL_DEFENSE = '10';
const INITIAL_DEFENSE_2 = '25';

before(async () => {
  accounts = await web3.eth.getAccounts();
  console.log("Current address: ", accounts[0]);

  charsContract = await new web3.eth.Contract(JSON.parse(chars.interface))
    .deploy({
      data: chars.bytecode,
    })
    .send({
      from: accounts[0],
      gas: '4000000',
    });

  armorContract = await new web3.eth.Contract(JSON.parse(armor.interface))
    .deploy({
      data: armor.bytecode,
      arguments: [
        INITIAL_DEFENSE,
        INITIAL_DEFENSE,
        INITIAL_DEFENSE,
        INITIAL_DEFENSE,
      ]
    })
    .send({
      from: accounts[0],
      gas: '4000000',
    });

  weaponContract = await new web3.eth.Contract(JSON.parse(weapon.interface))
    .deploy({
      data: weapon.bytecode,
      arguments: [
        INITIAL_DEFENSE,
        INITIAL_DEFENSE,
        INITIAL_DEFENSE,
        INITIAL_DEFENSE,
      ]
    })
    .send({
      from: accounts[0],
      gas: '4000000',
    });


  newArmorContract = await new web3.eth.Contract(JSON.parse(armor.interface))
    .deploy({
      data: armor.bytecode,
      arguments: [
        INITIAL_DEFENSE_2,
        INITIAL_DEFENSE_2,
        INITIAL_DEFENSE_2,
        INITIAL_DEFENSE_2,
      ]
    })
    .send({
      from: accounts[0],
      gas: '4000000',
    });

  newWeaponContract = await new web3.eth.Contract(JSON.parse(weapon.interface))
    .deploy({
      data: weapon.bytecode,
      arguments: [
        INITIAL_DEFENSE_2,
        INITIAL_DEFENSE_2,
        INITIAL_DEFENSE_2,
        INITIAL_DEFENSE_2,
      ]
    })
    .send({
      from: accounts[0],
      gas: '4000000',
    });
  });

describe('Armor Contract', () => {
  it('deploys a contract', () => {
    assert.ok(armorContract.options.address);
  });

  it('properly marks itself as Armor',async () => {
    const isArmor = await armorContract.methods.isArmor().call();
    assert.equal(isArmor, true);
  })

  it('has proper base defense', async () => {
    const defense = await armorContract.methods.baseDefense().call();
    assert.equal(defense, INITIAL_DEFENSE);
  })

  it('has proper fire resistance', async () => {
    const defense = await armorContract.methods.fireResistance().call();
    assert.equal(defense, INITIAL_DEFENSE);
  })

  it('has proper water resistance', async () => {
    const defense = await armorContract.methods.waterResistance().call();
    assert.equal(defense, INITIAL_DEFENSE);
  })

  it('has proper physical resistance', async () => {
    const defense = await armorContract.methods.physicalResistance().call();
    assert.equal(defense, INITIAL_DEFENSE);
  })
});

describe('Weapon Contract', () => {
  it('deploys a contract', () => {
    assert.ok(weaponContract.options.address);
  });

  it('properly marks itself as a Weapon',async () => {
    const isWeapon = await weaponContract.methods.isWeapon().call();
    assert.equal(isWeapon, true);
  })

  it('has proper standard attack', async () => {
    const attack = await weaponContract.methods.standardAttack().call();
    assert.equal(attack, INITIAL_DEFENSE);
  })

  it('has proper fire damage', async () => {
    const attack = await weaponContract.methods.fireDamage().call();
    assert.equal(attack, INITIAL_DEFENSE);
  })

  it('has proper water damage', async () => {
    const attack = await weaponContract.methods.waterDamage().call();
    assert.equal(attack, INITIAL_DEFENSE);
  })

  it('has proper physical damage', async () => {
    const attack = await weaponContract.methods.physicalDamage().call();
    assert.equal(attack, INITIAL_DEFENSE);
  })
});

describe('Characters Contract', () => {
  it('deploys a contract', () => {
    assert.ok(charsContract.options.address);
  });

  it('properly creates Character', async () => {
    const exists = await charsContract.methods.createCharacter(
      '1000',
      armorContract.options.address,
      armorContract.options.address,
      armorContract.options.address,
      armorContract.options.address,
      weaponContract.options.address,
    ).send({
        from: accounts[0],
        gas: '200000',
    });
    assert.ok(exists);
  })

  it('checks if new Character exists', async () => {
    const exists = await charsContract.methods.getIfCharacterExists(accounts[0]).call({
      from: accounts[0],
      gas: '30000',
    });
    assert.equal(exists, true);
  })

  it('properly marks creator', async () => {
    const creator = await charsContract.methods.getCreatorOf(accounts[0]).call({
      from: accounts[0],
      gas: '32000',
    });
    assert.equal(creator, accounts[0]);
  })

  it('assigns helmet of new character', async () => {
    const helmet = await charsContract.methods.getHelmetOf(accounts[0]).call({
      from: accounts[0],
      gas: '32000',
    });
    helmetAddress = helmet;
    assert.equal(helmet, armorContract.options.address);
  })

  it(`equips an existing helmet with proper base defense`, async () => {
    const contract = new web3.eth.Contract(JSON.parse(armor.interface), helmetAddress);
    const defense = await contract.methods.baseDefense().call();
    assert.equal(defense, INITIAL_DEFENSE);
  })

  it('assigns torso of new character', async () => {
    const torso = await charsContract.methods.getTorsoOf(accounts[0]).call({
      from: accounts[0],
      gas: '32000',
    });
    torsoAddress = torso;
    assert.equal(torsoAddress, armorContract.options.address);
  })

  it(`equips an existing torso with proper base defense`, async () => {
    const contract = new web3.eth.Contract(JSON.parse(armor.interface), torsoAddress);
    const defense = await contract.methods.baseDefense().call();
    assert.equal(defense, INITIAL_DEFENSE);
  })

  it('assigns arm plates of new character', async () => {
    const armPlates = await charsContract.methods.getArmPlatesOf(accounts[0]).call({
      from: accounts[0],
      gas: '32000',
    });
    armPlatesAddress = armPlates;
    assert.equal(armPlatesAddress, armorContract.options.address);
  })

  it(`equips an existing arm plate with proper base defense`, async () => {
    const contract = new web3.eth.Contract(JSON.parse(armor.interface), armPlatesAddress);
    const defense = await contract.methods.baseDefense().call();
    assert.equal(defense, INITIAL_DEFENSE);
  })

  it('assigns leg plates of new character', async () => {
    const legPlates = await charsContract.methods.getLegPlatesOf(accounts[0]).call({
      from: accounts[0],
      gas: '32000',
    });
    legPlatesAddress = legPlates;
    assert.equal(legPlatesAddress, armorContract.options.address);
  })

  it(`equips an existing leg plate with proper base defense`, async () => {
    const contract = new web3.eth.Contract(JSON.parse(armor.interface), legPlatesAddress);
    const defense = await contract.methods.baseDefense().call();
    assert.equal(defense, INITIAL_DEFENSE);
  })

  it('assigns weapon of new character', async () => {
    const weapon = await charsContract.methods.getWeaponOf(accounts[0]).call({
      from: accounts[0],
      gas: '32000',
    });
    weaponAddress = weapon;
    assert.equal(weaponAddress, weaponContract.options.address);
  })

  it(`equips an existing weapon with proper standard attack`, async () => {
    const contract = new web3.eth.Contract(JSON.parse(weapon.interface), weaponAddress);
    const defense = await contract.methods.standardAttack().call();
    assert.equal(defense, INITIAL_DEFENSE);
  })

  it('properly calculates total defense', async () => {
    const defense = await charsContract.methods.getTotalDefense(accounts[0]).call({
      from: accounts[0],
      gas: '50000',
    });
    assert.equal(defense, (Number(INITIAL_DEFENSE) * 4).toString());
  })
});

describe('new Armor Contract', () => {
  it('deploys a contract', () => {
    assert.ok(newArmorContract.options.address);
  });

  it('properly marks itself as Armor',async () => {
    const isArmor = await newArmorContract.methods.isArmor().call();
    assert.equal(isArmor, true);
  })

  it('has proper base defense', async () => {
    const defense = await newArmorContract.methods.baseDefense().call();
    assert.equal(defense, INITIAL_DEFENSE_2);
  })

  it('has proper fire resistance', async () => {
    const defense = await newArmorContract.methods.fireResistance().call();
    assert.equal(defense, INITIAL_DEFENSE_2);
  })

  it('has proper water resistance', async () => {
    const defense = await newArmorContract.methods.waterResistance().call();
    assert.equal(defense, INITIAL_DEFENSE_2);
  })

  it('has proper physical resistance', async () => {
    const defense = await newArmorContract.methods.physicalResistance().call();
    assert.equal(defense, INITIAL_DEFENSE_2);
  })
});

describe('new Weapon Contract', () => {
  it('deploys a contract', () => {
    assert.ok(newWeaponContract.options.address);
  });

  it('properly marks itself as a Weapon',async () => {
    const isWeapon = await newWeaponContract.methods.isWeapon().call();
    assert.equal(isWeapon, true);
  })

  it('has proper standard attack', async () => {
    const attack = await newWeaponContract.methods.standardAttack().call();
    assert.equal(attack, INITIAL_DEFENSE_2);
  })

  it('has proper fire damage', async () => {
    const attack = await newWeaponContract.methods.fireDamage().call();
    assert.equal(attack, INITIAL_DEFENSE_2);
  })

  it('has proper water damage', async () => {
    const attack = await newWeaponContract.methods.waterDamage().call();
    assert.equal(attack, INITIAL_DEFENSE_2);
  })

  it('has proper physical damage', async () => {
    const attack = await newWeaponContract.methods.physicalDamage().call();
    assert.equal(attack, INITIAL_DEFENSE_2);
  })
});

describe('Modifying Character in Characters Contract', () =>{
  it('successfully sets new Helmet', async () => {
    const tx = await charsContract.methods.setSenderHelmet(newArmorContract.options.address).send({
      from: accounts[0],
      gas: '32000',
    });
    assert.ok(tx);
  })

  it('properly assigns new helmet to character', async () => {
    const helmet = await charsContract.methods.getHelmetOf(accounts[0]).call({
      from: accounts[0],
      gas: '30000',
    });
    assert.equal(helmet, newArmorContract.options.address);
  })

  it('successfully sets new Torso', async () => {
    const tx = await charsContract.methods.setSenderTorso(newArmorContract.options.address).send({
      from: accounts[0],
      gas: '32000',
    });
    assert.ok(tx);
  })

  it('properly assigns new Torso to character', async () => {
    const torso = await charsContract.methods.getTorsoOf(accounts[0]).call({
      from: accounts[0],
      gas: '30000',
    });
    assert.equal(torso, newArmorContract.options.address);
  })

  it('successfully sets new Arm Plates', async () => {
    const tx = await charsContract.methods.setSenderArmPlates(newArmorContract.options.address).send({
      from: accounts[0],
      gas: '32000',
    });
    assert.ok(tx);
  })

  it('properly assigns new Arm Plates to character', async () => {
    const armPlates = await charsContract.methods.getArmPlatesOf(accounts[0]).call({
      from: accounts[0],
      gas: '30000',
    });
    assert.equal(armPlates, newArmorContract.options.address);
  })

  it('successfully sets new Leg Plates', async () => {
    const tx = await charsContract.methods.setSenderLegPlates(newArmorContract.options.address).send({
      from: accounts[0],
      gas: '32000',
    });
    assert.ok(tx);
  })

  it('properly assigns new Leg Plates to character', async () => {
    const legPlates = await charsContract.methods.getLegPlatesOf(accounts[0]).call({
      from: accounts[0],
      gas: '30000',
    });
    assert.equal(legPlates, newArmorContract.options.address);
  })

  it('properly calculates total defense', async () => {
    const defense = await charsContract.methods.getTotalDefense(accounts[0]).call({
      from: accounts[0],
      gas: '50000',
    });
    assert.equal(defense, (Number(INITIAL_DEFENSE_2) * 4).toString());
  })

  it('successfully sets new Weapon', async () => {
    const tx = await charsContract.methods.setSenderWeapon(newWeaponContract.options.address).send({
      from: accounts[0],
      gas: '32000',
    });
    assert.ok(tx);
  })

  it('properly assigns new Weapons to character', async () => {
    const weapon = await charsContract.methods.getWeaponOf(accounts[0]).call({
      from: accounts[0],
      gas: '30000',
    });
    assert.equal(weapon, newWeaponContract.options.address);
  })
})

// FAILING CASES
describe('Characters contract failing cases', () => {
  it('checks if unmade Character doesnt exist', async () => {
    const exists = await charsContract.methods.getIfCharacterExists(accounts[1]).call({
      from: accounts[0],
      gas: '30000',
    });
    assert.equal(exists, false);
  })

  it('properly restricts check calls on unmade Characters', async () => {
    try {
      const creator = await charsContract.methods.getCreatorOf(accounts[1]).call({
        from: accounts[0],
        gas: '32000',
      });
      assert.fail();
    } catch(err) {
      assert.ok(/revert/.test(err.message));
    }
  })

  it('properly restricts getting helmet of unmade character', async () => {
    try {
      const helmet = await charsContract.methods.getHelmetOf(accounts[1]).call({
      from: accounts[0],
      gas: '32000',
    });
      assert.fail();
    } catch(err) {
      assert.ok(/revert/.test(err.message));
    }
  })

  it('properly restricts getting torso of unmade character', async () => {
    try {
      const torso = await charsContract.methods.getTorsoOf(accounts[1]).call({
        from: accounts[0],
        gas: '32000',
      });
      assert.fail();
    } catch(err) {
      assert.ok(/revert/.test(err.message));
    }
  })

  it('properly restricts getting arm plates of unmade character', async () => {
    try {
      const armPlates = await charsContract.methods.getArmPlatesOf(accounts[1]).call({
        from: accounts[0],
        gas: '32000',
      });
      assert.fail();
    } catch(err) {
      assert.ok(/revert/.test(err.message));
    }
  })

  it('properly restricts getting leg plates of unmade character', async () => {
    try {
      const legPlates = await charsContract.methods.getLegPlatesOf(accounts[1]).call({
        from: accounts[0],
        gas: '32000',
      });
      assert.fail();
    } catch(err) {
      assert.ok(/revert/.test(err.message));
    }
  })

  it('properly restricts getting weapon of unmade character', async () => {
    try {
      const weapon = await charsContract.methods.getWeaponOf(accounts[1]).call({
        from: accounts[0],
        gas: '32000',
      });
      assert.fail();
    } catch(err) {
      assert.ok(/revert/.test(err.message));
    }
  })

  it('properly fails total defense for unmade character', async () => {
    try {
      const defense = await charsContract.methods.getTotalDefense(accounts[1]).call({
        from: accounts[0],
        gas: '50000',
      });
      assert.fail();
    } catch(err) {
      assert.ok(/revert/.test(err.message));
    }
  })

  it('properly restricts setting new Helmet on unmade character', async () => {
    try {
      const tx = await charsContract.methods.setSenderHelmet(armorContract.options.address).send({
        from: accounts[1],
        gas: '32000',
      });
      assert.fail();
    } catch(err) {
      assert.ok(/revert/.test(err.message));
    }
  })

  it('properly restricts setting new Torso on unmade character', async () => {
    try {
      const tx = await charsContract.methods.setSenderTorso(armorContract.options.address).send({
        from: accounts[1],
        gas: '32000',
      });
      assert.fail();
    } catch(err) {
      assert.ok(/revert/.test(err.message));
    }
  })

  it('properly restricts setting new Arm Plates on unmade character', async () => {
    try {
      const tx = await charsContract.methods.setSenderArmPlates(armorContract.options.address).send({
        from: accounts[1],
        gas: '32000',
      });
      assert.fail();
    } catch(err) {
      assert.ok(/revert/.test(err.message));
    }
  })

  it('properly restricts setting new Leg Plates on unmade character', async () => {
    try {
      const tx = await charsContract.methods.setSenderLegPlates(armorContract.options.address).send({
        from: accounts[1],
        gas: '32000',
      });
      assert.fail();
    } catch(err) {
      assert.ok(/revert/.test(err.message));
    }
  })

  it('properly restricts setting new Weapon on unmade character', async () => {
    try {
      const tx = await charsContract.methods.setSenderWeapon(weaponContract.options.address).send({
        from: accounts[1],
        gas: '32000',
      });
      assert.fail();
    } catch(err) {
      assert.ok(/revert/.test(err.message));
    }
  })
})

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
})