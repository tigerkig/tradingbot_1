import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import useActiveWeb3React from './useActiveWeb3React';
import ERC20_ABI from '../config/abi/erc20.json';
import BRIDGE_ABI from '../config/abi/bridge.json';
import GOVERNOR_ABI from '../config/abi/governor.json';
import STAKING_ABI from '../config/abi/staking.json';
import TREASURY_ABI from '../config/abi/treasury.json';
import WRAP_ABI from '../config/abi/wrap.json';
import GTOKEN_ABI from '../config/abi/gtoken.json';
import {
  BRIDGE_ADDRESS,
  GOVERNOR_ADDRESS,
  STAKING_ADDRESS,
  TREASURY_ADDRESS,
  WRAPPER_ADDRESS
} from '../config/constants';
// Imports below migrated from Exchange useContract.ts

import { getContract } from '../utils/contract';

function useContract(address, ABI, withSignerIfPossible = true) {
  const { library, account } = useActiveWeb3React();
  return useMemo(() => {
    if (!address || !ABI || !library) return null;
    try {
      return getContract(address, ABI, library, withSignerIfPossible && account ? account : undefined);
    } catch (error) {
      console.error('Failed to get contract', error);
      return null;
    }
  }, [address, ABI, library, withSignerIfPossible, account]);
}

export function useTokenContract(tokenAddress, withSignerIfPossible = true) {
  return useContract(tokenAddress, ERC20_ABI, withSignerIfPossible);
}

export function useGtokenContract(tokenAddress, withSignerIfPossible = true) {
  return useContract(tokenAddress, GTOKEN_ABI, withSignerIfPossible);
}

export function useBridgeContract(withSignerIfPossible = true) {
  const network = useSelector((state) => state.network.chainId);
  return useContract(BRIDGE_ADDRESS[network], BRIDGE_ABI, withSignerIfPossible);
}

export function useGovernorContract(withSignerIfPossible = true) {
  const network = useSelector((state) => state.network.chainId);
  return useContract(GOVERNOR_ADDRESS[network], GOVERNOR_ABI, withSignerIfPossible);
}

export function useStakingContract(withSignerIfPossible = true) {
  const network = useSelector((state) => state.network.chainId);
  return useContract(STAKING_ADDRESS[network], STAKING_ABI, withSignerIfPossible);
}

export function useTreasuryContract(withSignerIfPossible = true) {
  const network = useSelector((state) => state.network.chainId);
  return useContract(TREASURY_ADDRESS[network], TREASURY_ABI, withSignerIfPossible);
}

export function useWrapperContract(withSignerIfPossible = true) {
  const network = useSelector((state) => state.network.chainId);
  return useContract(WRAPPER_ADDRESS[network], WRAP_ABI, withSignerIfPossible);
}
