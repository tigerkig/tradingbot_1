import { InjectedConnector } from '@web3-react/injected-connector';
import { WalletConnectConnector } from '@web3-react/walletconnect-connector';
import { BscConnector } from '@binance-chain/bsc-connector';
import { ConnectorNames } from 'redrum-pancake-uikit';
import { ethers } from 'ethers';
import getNodeUrl from './getRpcUrl';

const POLLING_INTERVAL = 12000;

const injected = new InjectedConnector({
  supportedChainIds: [
    Number(process.env.REACT_APP_ETHEREUM_CHAINID),
    Number(process.env.REACT_APP_RINKEBY_CHAINID),
    Number(process.env.REACT_APP_BSC_CHAINID)
  ]
});

const walletconnect = new WalletConnectConnector({
  rpc: {
    [Number(process.env.REACT_APP_ETHEREUM_CHAINID)]: getNodeUrl(Number(process.env.REACT_APP_ETHEREUM_CHAINID)),
    [Number(process.env.REACT_APP_RINKEBY_CHAINID)]: getNodeUrl(Number(process.env.REACT_APP_RINKEBY_CHAINID)),
    [Number(process.env.REACT_APP_BSC_CHAINID)]: getNodeUrl(Number(process.env.REACT_APP_BSC_CHAINID))
  },
  qrcode: true,
  pollingInterval: POLLING_INTERVAL
});

const bscConnector = new BscConnector({
  supportedChainIds: [
    Number(process.env.REACT_APP_ETHEREUM_CHAINID),
    Number(process.env.REACT_APP_RINKEBY_CHAINID),
    Number(process.env.REACT_APP_BSC_CHAINID)
  ]
});

export const connectorsByName = {
  [ConnectorNames.Injected]: injected,
  [ConnectorNames.WalletConnect]: walletconnect,
  [ConnectorNames.BSC]: bscConnector
};

export const getLibrary = (provider) => {
  const library = new ethers.providers.Web3Provider(provider);
  library.pollingInterval = POLLING_INTERVAL;
  return library;
};
