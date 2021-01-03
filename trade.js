#!/usr/bin/env node

// All code examples in this guide have not been audited and should not be used in production.
// If so, it is done at your own risk!

/* eslint-disable no-underscore-dangle, no-unused-vars */

const BN = require('bn.js');
const fs = require('fs');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const moment = require('moment');
const Web3 = require('web3');
const env = require('dotenv').config().parsed;

process.on('unhandledRejection', console.error.bind(console));

const mnemonic = env.DEV_MNEMONIC;
const rpcUrl = 'https://ropsten.infura.io/v3/'+env.INFURA_ID;
const provider = new HDWalletProvider(mnemonic, rpcUrl);
const web3 = new Web3(provider);
const { addresses, wallets } = provider;
const gasPrice = web3.utils.toWei(new BN(10), 'gwei');

const KyberNetworkProxyABI = JSON.parse(fs.readFileSync('./abi/KyberNetworkProxy.abi', 'utf8'));
const KyberNetworkProxyAddress = env.KYBER_PROXY;
const NetworkProxyInstance = new web3.eth.Contract(KyberNetworkProxyABI, KyberNetworkProxyAddress);

const ETH_ADDRESS = env.ETH_ADDRESS;
const KNC_ADDRESS = env.KNC_ADDRESS;
const OMG_ADDRESS = env.OMG_ADDRESS;
const MANA_ADDRESS = env.MANA_ADDRESS;
const KNC_ABI = JSON.parse(fs.readFileSync('./abi/KNC.abi', 'utf8'));
const OMG_ABI = JSON.parse(fs.readFileSync('./abi/OMG.abi', 'utf8'));
const MANA_ABI = JSON.parse(fs.readFileSync('./abi/MANA.abi', 'utf8'));
const KNCInstance = new web3.eth.Contract(KNC_ABI, KNC_ADDRESS);
const OMGInstance = new web3.eth.Contract(OMG_ABI, OMG_ADDRESS);
const MANAInstance = new web3.eth.Contract(MANA_ABI, MANA_ADDRESS);

const userWallet = addresses[0];

function stdlog(input) {
  console.log(`${moment().format('YYYY-MM-DD HH:mm:ss.SSS')}] ${input}`);
}

function tx(result, call) {
  const logs = result.logs.length > 0 ? result.logs[0] : { address: null, event: null };

  console.log();
  console.log(`   ${call}`);
  console.log('   ------------------------');
  console.log(`   > transaction hash: ${result.transactionHash}`);
  console.log(`   > gas used: ${result.gasUsed}`);
  console.log();
}

async function sendTx(txObject, txTo, txValue) {
  const nonce = await web3.eth.getTransactionCount(userWallet);
  const gas = 500 * 1000;

  let maxGasPrice = await NetworkProxyInstance.methods.maxGasPrice().call();

  const txData = txObject.encodeABI();
  const txFrom = userWallet;

  const txParams = {
    from: txFrom,
    to: txTo,
    data: txData,
    value: txValue,
    gas,
    nonce,
    chainId: await web3.eth.net.getId(),
    maxGasPrice,
  };

  const signedTx = await web3.eth.signTransaction(txParams);

  return web3.eth.sendSignedTransaction(signedTx.raw);
}

async function main() {
  let expectedRate;
  let slippageRate;
  let result;
  let txObject;

  NetworkProxyInstance.setProvider(provider);
  KNCInstance.setProvider(provider);
  OMGInstance.setProvider(provider);
  MANAInstance.setProvider(provider);

  stdlog('- START -');
  stdlog(`KyberNetworkProxy (${KyberNetworkProxyAddress})`);

  stdlog(
    `ETH balance of ${userWallet} = ${web3.utils.fromWei(await web3.eth.getBalance(userWallet))}`,
  );
  stdlog(
    `KNC balance of ${userWallet} = ${web3.utils.fromWei(
      await KNCInstance.methods.balanceOf(userWallet).call(),
    )}`,
  );
  stdlog(
    `OMG balance of ${userWallet} = ${web3.utils.fromWei(
      await OMGInstance.methods.balanceOf(userWallet).call(),
    )}`,
  );
  stdlog(
    `MANA balance of ${userWallet} = ${web3.utils.fromWei(
      await MANAInstance.methods.balanceOf(userWallet).call(),
    )}`,
  );

  ({ expectedRate, slippageRate } = await NetworkProxyInstance.methods
    .getExpectedRate(
      ETH_ADDRESS, // srcToken
      KNC_ADDRESS, // destToken
      web3.utils.toWei('.1'), // srcQty
    )
    .call());

  // Perform an ETH to KNC trade
  txObject = NetworkProxyInstance.methods.trade(
    ETH_ADDRESS, // srcToken
    web3.utils.toWei('.1'), // srcAmount
    KNC_ADDRESS, // destToken
    userWallet, // destAddress
    web3.utils.toWei('.1'), // maxDestAmount
    expectedRate, // minConversionRate
    '0x0000000000000000000000000000000000000000', // walletId
  )

  result = await sendTx(txObject, KyberNetworkProxyAddress, web3.utils.toWei('.1'));
  tx(result, 'ETH <-> KNC trade()');

  // // Approve the KyberNetwork contract to spend user's tokens
  // txObject = KNCInstance.methods.approve(KyberNetworkProxyAddress, web3.utils.toWei('10000'));
  // await sendTx(txObject, KNC_ADDRESS);

  // ({ expectedRate, slippageRate } = await NetworkProxyInstance.methods
  //   .getExpectedRate(
  //     KNC_ADDRESS, // srcToken
  //     OMG_ADDRESS, // destToken
  //     web3.utils.toWei('100'), // srcQty
  //   )
  //   .call());

  // txObject = NetworkProxyInstance.methods.trade(
  //   KNC_ADDRESS, // srcToken
  //   web3.utils.toWei('100'), // srcAmount
  //   OMG_ADDRESS, // destToken
  //   userWallet, // destAddress
  //   web3.utils.toWei('100000'), // maxDestAmount
  //   expectedRate, // minConversionRate
  //   '0x0000000000000000000000000000000000000000', // walletId
  // );
  // result = await sendTx(txObject, KyberNetworkProxyAddress, 0);
  // tx(result, 'KNC <-> OMG trade()');

  // ({ expectedRate, slippageRate } = await NetworkProxyInstance.methods
  //   .getExpectedRate(
  //     KNC_ADDRESS, // srcToken
  //     MANA_ADDRESS, // destToken
  //     web3.utils.toWei('100'), // srcQty
  //   )
  //   .call());

  // txObject = NetworkProxyInstance.methods.trade(
  //   KNC_ADDRESS, // srcToken
  //   web3.utils.toWei('100'), // srcAmount
  //   MANA_ADDRESS, // destToken
  //   userWallet, // destAddress
  //   web3.utils.toWei('100000'), // maxDestAmount
  //   expectedRate, // minConversionRate
  //   '0x0000000000000000000000000000000000000000', // walletId
  // );
  // result = await sendTx(txObject, KyberNetworkProxyAddress, 0);
  // tx(result, 'KNC <-> MANA trade()');

  stdlog(
    `ETH balance of ${userWallet} = ${web3.utils.fromWei(await web3.eth.getBalance(userWallet))}`,
  );
  stdlog(
    `KNC balance of ${userWallet} = ${web3.utils.fromWei(
      await KNCInstance.methods.balanceOf(userWallet).call(),
    )}`,
  );
  stdlog(
    `OMG balance of ${userWallet} = ${web3.utils.fromWei(
      await OMGInstance.methods.balanceOf(userWallet).call(),
    )}`,
  );
  stdlog(
    `MANA balance of ${userWallet} = ${web3.utils.fromWei(
      await MANAInstance.methods.balanceOf(userWallet).call(),
    )}`,
  );

  stdlog('- END -');
}

// Start the script
main();
