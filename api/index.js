/* eslint-disable no-plusplus */
/* eslint-disable no-loop-func */
/* eslint-disable guard-for-in */
/* eslint-disable no-empty */
const Web3 = require('web3');
require('dotenv').config();
const Tx = require('ethereumjs-transaction');
const bridgeAddresses = require('./addresses');

const web3 = {
  3: new Web3(process.env.ROPSTEN_TESTENT_ENDPOINT),
  97: new Web3(process.env.BSC_TESTNET_ENDPOINT)
};

const startRunning = async () => {
  const privKey = Buffer.from(process.env.ADMIN_WALLET, 'hex'); // Genesis private key
  // eslint-disable-next-line global-require
  const BridgeABI = require('./abi/bridge.json');
  const bridgeContracts = {
    3: new web3[3].eth.Contract(BridgeABI, bridgeAddresses[3]),
    97: new web3[97].eth.Contract(BridgeABI, bridgeAddresses[97])
  };

  // eslint-disable-next-line no-restricted-syntax
  for (const prop in bridgeContracts) {
    bridgeContracts[prop].events.Convert(async (err, events) => {
      if (err) {
        console.log(err);
      } else {
        const { returnValues } = events;
        console.log(returnValues);
        let { network, nonce } = returnValues;
        const { to, amount } = returnValues;
        network = Number(network);
        // const network = 97;
        // const to = '0x5A297809fd9Bac9a820acB00fE538aAA6498FA3C';
        // const amount = '100000000000';
        nonce = Number(nonce);

        const { address } = web3[network].eth.accounts.privateKeyToAccount(process.env.ADMIN_WALLET);
        console.log(address);
        const txCount = await web3[network].eth.getTransactionCount(address);
        console.log(txCount);
        const gasPrice = await web3[network].eth.getGasPrice();
        console.log(gasPrice, bridgeAddresses[network]);
        const txObject = {
          chainId: network,
          nonce: web3[network].utils.toHex(txCount),
          gasLimit: web3[network].utils.toHex(100000), // Raise the gas limit to a much higher amount
          gasPrice: web3[network].utils.toHex(gasPrice),
          to: bridgeAddresses[network],
          data: bridgeContracts[network].methods.withdraw(to, amount, nonce).encodeABI(),
          from: address
        };
        console.log(txObject);
        // const tx = new Tx(txObject);
        // tx.sign(privKey);
        // console.log(bridgeAddresses[network]);
        // const txHash = await web3[network].eth.sendSignedTransaction(`0x${tx.serialize().toString('hex')}`);
        // console.log(txHash);
        try {
          const tx = new Tx(txObject);
          tx.sign(privKey);
          const txHash = await web3[network].eth.sendSignedTransaction(`0x${tx.serialize().toString('hex')}`);
          console.log(txHash);
        } catch (err) {
          console.log(err);
        }
      }
    });
  }
};

startRunning();

console.log('running ....');
