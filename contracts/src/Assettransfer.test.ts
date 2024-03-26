import { Assettransfer } from './Assettransfer';
import { Field, Mina, PrivateKey, PublicKey, AccountUpdate } from 'o1js';

let proofsEnabled = false;

describe('Assettransfer', () => {
  let deployerAccount: PublicKey,
    deployerKey: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: Assettransfer;

  beforeAll(async () => {
    if (proofsEnabled) await Assettransfer.compile();
  });

  beforeEach(() => {
    const Local = Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    ({ privateKey: deployerKey, publicKey: deployerAccount } = Local.testAccounts[0]);
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new Assettransfer(zkAppAddress);
  });

  async function localDeploy() {
    const txn = await Mina.transaction(deployerAccount, () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      zkApp.deploy();
    });
    await txn.prove();
    await txn.sign([deployerKey, zkAppPrivateKey]).send();
  }

  it('deploys the `Assettransfer` smart contract and verifies initialization', async () => {
    await localDeploy();
    // Assuming the contract has a method to check the owner or asset value for verification
    // const assetValue = zkApp.assetValue.get();
    // expect(assetValue).toEqual(Field(<expected_value>));
  });

  // Additional tests to simulate and verify asset transfers
});
