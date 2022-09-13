import { useEffect, useState, useRef } from 'react';
import { useWeb3React } from '@web3-react/core';
import { useSelector } from 'react-redux';

// eslint-disable-next-line import/no-unresolved

/**
 * Provides a web3 provider with or without user's signer
 * Recreate web3 instance only if the provider change
 */
const useActiveWeb3React = () => {
  const { library, chainId, ...web3React } = useWeb3React();
  const refEth = useRef(library);
  const network = useSelector((state) => state.network.chainId);
  // const [provider, setProvider] = useState(library || (Number(network) !== Number(process.env.REACT_APP_ETHEREUM_CHAINID) && Number(network) !== Number(process.env.REACT_APP_BSC_CHAINID) ?
  //   simpleRpcProvider(Number(process.env.REACT_APP_BSC_CHAINID)) : simpleRpcProvider(network)));
  const [provider, setProvider] = useState(library);

  useEffect(() => {
    if (library !== refEth.current) {
      // setProvider(library || simpleRpcProvider(Number(process.env.REACT_APP_BSC_CHAINID)));
      setProvider(library);
      refEth.current = library;
    }
  }, [library, network]);

  return { library: provider, chainId, ...web3React };
};

export default useActiveWeb3React;
