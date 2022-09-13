/* eslint-disable global-require */
/* eslint-disable no-plusplus */
/* eslint-disable no-loop-func */
/* eslint-disable guard-for-in */
/* eslint-disable no-empty */
const Web3 = require('web3');
require('dotenv').config();
const Tx = require('ethereumjs-transaction');
const bridgeAddresses = require('./addresses');

const web3 = new Web3(process.env.BSC_TESTNET_ENDPOINT);

const startRunning = async () => {
  const privKey = Buffer.from(process.env.ADMIN_WALLET, 'hex'); // Genesis private key
  const BridgeABI = require('./abi/bridge.json');
  const bridgeContracts = new web3.eth.Contract(BridgeABI, bridgeAddresses[97]);

  const network = 97;
  const to = '0x5A297809fd9Bac9a820acB00fE538aAA6498FA3C';
  const amount = '100000000000';
  const nonce = 17;

  const { address } = web3.eth.accounts.privateKeyToAccount(process.env.ADMIN_WALLET);
  const txCount = await web3.eth.getTransactionCount(address);
  // eslint-disable-next-line no-plusplus
  console.log(txCount);
  const gasPrice = await web3.eth.getGasPrice();
  const txObject = {
    chainId: 97,
    nonce: web3.utils.toHex(txCount),
    gasLimit: web3.utils.toHex(100000), // Raise the gas limit to a much higher amount
    gasPrice: web3.utils.toHex(gasPrice),
    to: bridgeAddresses['97'],
    data: bridgeContracts.methods.withdraw(to, amount, nonce).encodeABI(),
    from: address
  };
  console.log(txObject);

  try {
    const tx = new Tx(txObject);
    tx.sign(privKey);
    const txHash = await web3.eth.sendSignedTransaction(`0x${tx.serialize().toString('hex')}`);
    console.log(txHash);
  } catch (err) {
    console.log(err);
  }
};

startRunning();

console.log('running ....');
