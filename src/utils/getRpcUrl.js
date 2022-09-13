import random from 'lodash/random';
import { NODE_URL } from '../config/constants';
// Array of available nodes to connect to

export const nodes = {
  [Number(process.env.REACT_APP_BSC_CHAINID)]: NODE_URL[process.env.REACT_APP_BSC_CHAINID],
  [Number(process.env.REACT_APP_ETHEREUM_CHAINID)]: NODE_URL[process.env.REACT_APP_ETHEREUM_CHAINID],
  [Number(process.env.REACT_APP_RINKEBY_CHAINID)]: NODE_URL[process.env.REACT_APP_RINKEBY_CHAINID]
};

const getNodeUrl = (network) => {
  const randomIndex = random(0, nodes[network].length - 1);
  return nodes[network][randomIndex];
};

export default getNodeUrl;
