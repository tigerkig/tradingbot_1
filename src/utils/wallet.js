// Set of helper functions to facilitate wallet setup

import { SCAN_URL, CURRENCY_NAME, CURRENCY_SYMBOL, NETWORK_NAME } from '../config/constants';
import { nodes } from './getRpcUrl';

/**
 * Prompt the user to add BSC as a network on Metamask, or switch to BSC if the wallet is on a different network
 * @returns {boolean} true if the setup succeeded, false otherwise
 */
export const setupNetwork = async (network) => {
  const provider = window.ethereum;
  if (provider) {
    const chainId = Number(network);
    try {
      if (
        chainId === Number(process.env.REACT_APP_ETHEREUM_CHAINID) ||
        chainId === Number(process.env.REACT_APP_RINKEBY_CHAINID)
      ) {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [
            {
              chainId: `0x${chainId.toString(16)}`
            }
          ]
        });
      } else {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${chainId.toString(16)}`,
              chainName: NETWORK_NAME[String(chainId)],
              nativeCurrency: {
                name: CURRENCY_NAME[String(chainId)],
                symbol: CURRENCY_SYMBOL[String(chainId)],
                decimals: 18
              },
              rpcUrls: nodes[chainId],
              blockExplorerUrls: [`${SCAN_URL[String(chainId)]}/`]
            }
          ]
        });
      }

      return 1;
    } catch (error) {
      console.error(error);
      return 0;
    }
  } else {
    console.error("Can't setup the network on metamask because window.ethereum is undefined");
    return -1;
  }
};

/**
 * Prompt the user to add a custom token to metamask
 * @param tokenAddress
 * @param tokenSymbol
 * @param tokenDecimals
 * @param tokenImage
 * @returns {boolean} true if the token has been added, false otherwise
 */
