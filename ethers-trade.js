// DISCLAIMER: Code snippets in this guide are just examples and you
// should always do your own testing. If you have questions, visit our
// https://t.me/KyberDeveloper.

const ethers = require('ethers');
const BN = ethers.BigNumber
const fetch = require('node-fetch');
const env = require('dotenv').config().parsed;

console.log(ethers.BigNumber.from(18))

const NETWORK = "ropsten";
const PROJECT_ID = env.INFURA_ID // Replace this with your own Project ID
const provider = new ethers.getDefaultProvider(NETWORK, {'infura': PROJECT_ID});

// Universal Constants
const ETH_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
const ZERO_BN = ethers.constants.Zero;
const MAX_UINT256 = ethers.constants.MaxUint256;
const EMPTY_HINT = "0x";

// Tokens and srcQty
const SRC_TOKEN_ADDRESS = "0x7b2810576aa1cce68f2b118cef1f36467c648f92"; // Ropsten KNC address
const DEST_TOKEN_ADDRESS = "0xad6d458402f60fd3bd25163575031acdce07538d"; // Ropsten DAI address
const SRC_DECIMALS = new BN.from(18);
const SRC_QTY = BN.from(10).mul((BN.from(10).pow(SRC_DECIMALS))); // 10 KNC

// Contract ABIs and proxy address
const IERC20_ABI = [{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_owner","type":"address"},{"indexed":true,"internalType":"address","name":"_spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"_value","type":"uint256"}],"name":"Approval","type":"event"},{"inputs":[{"internalType":"address","name":"_owner","type":"address"},{"internalType":"address","name":"_spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"remaining","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_spender","type":"address"},{"internalType":"uint256","name":"_value","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"success","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"balance","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"digits","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"supply","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_to","type":"address"},{"internalType":"uint256","name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"success","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_from","type":"address"},{"internalType":"address","name":"_to","type":"address"},{"internalType":"uint256","name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"success","type":"bool"}],"stateMutability":"nonpayable","type":"function"}];
const IKyberNetworkProxy_ABI = [{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"trader","type":"address"},{"indexed":false,"internalType":"contract IERC20","name":"src","type":"address"},{"indexed":false,"internalType":"contract IERC20","name":"dest","type":"address"},{"indexed":false,"internalType":"address","name":"destAddress","type":"address"},{"indexed":false,"internalType":"uint256","name":"actualSrcAmount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"actualDestAmount","type":"uint256"},{"indexed":false,"internalType":"address","name":"platformWallet","type":"address"},{"indexed":false,"internalType":"uint256","name":"platformFeeBps","type":"uint256"}],"name":"ExecuteTrade","type":"event"},{"inputs":[],"name":"enabled","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"contract ERC20","name":"src","type":"address"},{"internalType":"contract ERC20","name":"dest","type":"address"},{"internalType":"uint256","name":"srcQty","type":"uint256"}],"name":"getExpectedRate","outputs":[{"internalType":"uint256","name":"expectedRate","type":"uint256"},{"internalType":"uint256","name":"worstRate","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"contract IERC20","name":"src","type":"address"},{"internalType":"contract IERC20","name":"dest","type":"address"},{"internalType":"uint256","name":"srcQty","type":"uint256"},{"internalType":"uint256","name":"platformFeeBps","type":"uint256"},{"internalType":"bytes","name":"hint","type":"bytes"}],"name":"getExpectedRateAfterFee","outputs":[{"internalType":"uint256","name":"expectedRate","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"maxGasPrice","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"contract IERC20","name":"src","type":"address"},{"internalType":"uint256","name":"srcAmount","type":"uint256"},{"internalType":"contract IERC20","name":"dest","type":"address"},{"internalType":"address payable","name":"destAddress","type":"address"},{"internalType":"uint256","name":"maxDestAmount","type":"uint256"},{"internalType":"uint256","name":"minConversionRate","type":"uint256"},{"internalType":"address payable","name":"platformWallet","type":"address"}],"name":"trade","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"contract ERC20","name":"src","type":"address"},{"internalType":"uint256","name":"srcAmount","type":"uint256"},{"internalType":"contract ERC20","name":"dest","type":"address"},{"internalType":"address payable","name":"destAddress","type":"address"},{"internalType":"uint256","name":"maxDestAmount","type":"uint256"},{"internalType":"uint256","name":"minConversionRate","type":"uint256"},{"internalType":"address payable","name":"walletId","type":"address"},{"internalType":"bytes","name":"hint","type":"bytes"}],"name":"tradeWithHint","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"contract IERC20","name":"src","type":"address"},{"internalType":"uint256","name":"srcAmount","type":"uint256"},{"internalType":"contract IERC20","name":"dest","type":"address"},{"internalType":"address payable","name":"destAddress","type":"address"},{"internalType":"uint256","name":"maxDestAmount","type":"uint256"},{"internalType":"uint256","name":"minConversionRate","type":"uint256"},{"internalType":"address payable","name":"platformWallet","type":"address"},{"internalType":"uint256","name":"platformFeeBps","type":"uint256"},{"internalType":"bytes","name":"hint","type":"bytes"}],"name":"tradeWithHintAndFee","outputs":[{"internalType":"uint256","name":"destAmount","type":"uint256"}],"stateMutability":"payable","type":"function"}];

// Kyber Network Proxy Contract Address
const IKyberNetworkProxy_ADDRESS = "0xa16Fc6e9b5D359797999adA576F7f4a4d57E8F75";

// User Details
const PRIVATE_KEY = env.DEV_PK; // Eg. 0x40ddbce3c7df9ab8d507d6b4af3861d224711b35299470ab7a217f780fe696cd
const USER_WALLET = new ethers.Wallet(PRIVATE_KEY, provider);

// Platform fees
const PLATFORM_WALLET = "0x94e552A9c0A86B794eE7601C765698332D41EcD0"; // Eg. 0x483C5100C3E544Aef546f72dF4022c8934a6945E
const PLATFORM_FEE = 25; // 0.25%

// Instantiate contracts, using USER_WALLET as sender of txns
const KyberNetworkProxyContract = new ethers.Contract(
  IKyberNetworkProxy_ADDRESS,
  IKyberNetworkProxy_ABI,
  USER_WALLET
);
const srcTokenContract = new ethers.Contract(SRC_TOKEN_ADDRESS, IERC20_ABI, USER_WALLET);

async function main() {
  // Step 1: Check and approve allowance if needed
  await checkAndApproveTokenForTrade(srcTokenContract, USER_WALLET.address, SRC_QTY);

  let hint = EMPTY_HINT; // build hint here (see section on reserve routing)
  // Step 2: Get rate for trade
  let minConversionRate = await KyberNetworkProxyContract.getExpectedRateAfterFee(
    SRC_TOKEN_ADDRESS,
    DEST_TOKEN_ADDRESS,
    SRC_QTY,
    PLATFORM_FEE,
    hint
    );

  // Step 3: Get gas limit estimates and price
  let gasConfig = await getGasConfig(
    KyberNetworkProxyContract, provider, SRC_TOKEN_ADDRESS, DEST_TOKEN_ADDRESS, SRC_QTY,
    USER_WALLET.address, MAX_UINT256, minConversionRate, PLATFORM_WALLET, PLATFORM_FEE, hint
    );

  // Step 4: Execute trade
  let ethValue = (SRC_TOKEN_ADDRESS == ETH_ADDRESS) ? SRC_QTY : ZERO_BN;

  console.log("Executing Trade...");
  await KyberNetworkProxyContract.tradeWithHintAndFee(
    SRC_TOKEN_ADDRESS,
    SRC_QTY,
    DEST_TOKEN_ADDRESS,
    USER_WALLET.address, // destAddress
    MAX_UINT256, // maxDestAmount: set to be arbitrarily large
    minConversionRate,
    PLATFORM_WALLET,
    PLATFORM_FEE,
    hint,
    { value: ethValue, gasLimit: gasConfig.gasLimit, gasPrice: gasConfig.gasPrice }
  );

  // Quit the program
  process.exit(0);
}

async function checkAndApproveTokenForTrade(srcTokenContract, userAddress, srcQty) {
  if (srcTokenContract.address == ETH_ADDRESS) {
    return;
  }

  // check existing allowance given to proxy contract
  let existingAllowance = await srcTokenContract.allowance(userAddress, IKyberNetworkProxy_ADDRESS);

  // if zero allowance, just set to MAX_UINT256
  if (existingAllowance.eq(ZERO_BN)) {
    console.log("Approving KNP contract to max allowance");
    await srcTokenContract.approve(IKyberNetworkProxy_ADDRESS, MAX_UINT256);
  } else if (existingAllowance.lt(srcQty)) {
    // if existing allowance is insufficient, reset to zero, then set to MAX_UINT256
    console.log("Approving KNP contract to zero, then max allowance");
    await srcTokenContract.approve(IKyberNetworkProxy_ADDRESS, ZERO_BN);
    await srcTokenContract.approve(IKyberNetworkProxy_ADDRESS, MAX_UINT256);
  }
  return;
}

async function getGasConfig(
  KyberNetworkProxyContract, provider, srcTokenAddress, destTokenAddress, srcQty,
  destAddress, maxDestAmount, minConversionRate, platformWallet, platformFee, hint
  )
{
  let gasConfig = { gasLimit: ZERO_BN, gasPrice: ZERO_BN};

  // Configure gas limit
  // Method 1: Use estimateGas function, add buffer
//   let gasLimit = await KyberNetworkProxyContract.estimateGas.tradeWithHintAndFee(
//     srcTokenAddress,
//     srcQty,
//     destTokenAddress,
//     destAddress,
//     maxDestAmount,
//     minConversionRate,
//     platformWallet,
//     platformFee,
//     hint
//   );

//   gasConfig.gasLimit = gasLimit.mul(BN.from(110)).div(BN.from(100));

  // Method 2: Use /gasLimit API (only Ropsten and mainnet)
  let gasLimitRequest = await fetch(
    `https://${NETWORK == "mainnet" ? "" : NETWORK + "-"}api.kyber.network/gas_limit?` + 
    `source=${srcTokenAddress}&dest=${destTokenAddress}&amount=${srcQty}`
    );

  let gasLimit = await gasLimitRequest.json();
  if (gasLimit.error) {
    console.log(gasLimit);
    process.exit(0);
  } else {
    gasConfig.gasLimit = BN.from(gasLimit.data);
  }

  // Configure gas price
  let maxGasPrice = await KyberNetworkProxyContract.maxGasPrice();
  // Method 1: Fetch gasPrice
  let gasPrice = await provider.getGasPrice();

  //Method 2: Manual gasPrice input
  // let gasPrice = BN.from(30).mul((BN.from(10).mul(BN.from(9))));

  // Check against maxGasPrice
  gasConfig.gasPrice = gasPrice.gt(maxGasPrice) ? maxGasPrice : gasPrice;
  return gasConfig;
}

main();