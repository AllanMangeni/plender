import fs from 'fs/promises';
import { Mina, PrivateKey } from 'o1js';
import { CreditWorthiness } from './CreditWorthiness.js';
import { Assettransfer } from './Assettransfer.js';

let deployAlias = process.argv[2];
if (!deployAlias) {
  throw new Error(`Missing <deployAlias> argument.

Usage:
node build/src/interact.js <deployAlias>
`);
}

Error.stackTraceLimit = 1000;
const DEFAULT_NETWORK_ID = 'testnet';

type Config = {
  deployAliases: Record<
    string,
    {
      networkId?: string;
      url: string;
      keyPath: string;
      fee: string;
      feepayerKeyPath: string;
      feepayerAlias: string;
    }
  >;
};

let configJson: Config = JSON.parse(await fs.readFile('config.json', 'utf8'));
let config = configJson.deployAliases[deployAlias];
let feepayerKeysBase58 = JSON.parse(await fs.readFile(config.feepayerKeyPath, 'utf8'));
let zkAppKeysBase58 = JSON.parse(await fs.readFile(config.keyPath, 'utf8'));

let feepayerKey = PrivateKey.fromBase58(feepayerKeysBase58.privateKey);
let zkAppKey = PrivateKey.fromBase58(zkAppKeysBase58.privateKey);

const Network = Mina.Network({
  networkId: (config.networkId ?? DEFAULT_NETWORK_ID),
  mina: config.url,
});
const fee = Number(config.fee) * 1e9; // in nanomina
Mina.setActiveInstance(Network);
let feepayerAddress = feepayerKey.toPublicKey();
let creditWorthinessAddress = zkAppKey.toPublicKey();
let assettransferAddress = zkAppKey.toPublicKey(); // Assuming the same key, adjust as needed

let creditWorthinessApp = new CreditWorthiness(creditWorthinessAddress);
let assettransferApp = new Assettransfer(assettransferAddress);

try {
  console.log('compile the contracts...');
  await Promise.all([CreditWorthiness.compile(), Assettransfer.compile()]);

  console.log('build transactions and create proofs...');

  let creditTx = await Mina.transaction({ sender: feepayerAddress, fee }, () => {
    creditWorthinessApp.update();
  });
  await creditTx.prove();

  let assetTx = await Mina.transaction({ sender: feepayerAddress, fee }, () => {
    assettransferApp.transferAsset(/* newOwner, signature */); // Replace with actual parameters
  });
  await assetTx.prove();

  console.log('send transactions...');
  const sentCreditTx = await creditTx.sign([feepayerKey]).send();
  const sentAssetTx = await assetTx.sign([feepayerKey]).send();

  // Output success messages or transaction details as needed
} catch (err) {
  console.error(err);
}

function getTxnUrl(graphQlUrl: string, txnHash: string | undefined) {
  // Implementation remains the same as provided
}
