/* eslint-disable no-restricted-properties */
/* eslint-disable no-empty */
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isLoading: false,
  isInitialized: false,
  error: false,
  tokenBalance: 0,
  stokenBalance: 0,
  rewardRate: '',
  totalStaked: '',
  apy: '',
  stakingRewardLastBlock: '',
  roi5: '',
  totalReward: '',
  tokenInfo: {
    name: '',
    symbol: '',
    decimals: 0,
    totalSupply: 0,
    balanceOf: 0,
    isLiquidity: false
  },
  stokenInfo: {
    name: '',
    symbol: '',
    decimals: 0,
    totalSupply: 0,
    balanceOf: 0,
    isLiquidity: false
  }
};

const slice = createSlice({
  name: 'staking',
  initialState,
  reducers: {
    // START LOADING
    startLoading(state) {
      state.isLoading = true;
    },
    // HAS ERROR
    hasError(state, action) {
      state.isLoading = false;
      state.error = action.payload;
    },
    // GET
    initialized(state) {
      state.isLoading = false;
      state.isInitialized = true;
      console.log(state.isInitialized);
    },
    setTokenInfo(state, action) {
      state.tokenInfo = action.payload;
    },
    setStokenInfo(state, action) {
      state.stokenInfo = action.payload;
    },
    // SET
    setTokenBalance(state, action) {
      state.tokenBalance = action.payload;
    },
    setStokenBalance(state, action) {
      state.stokenBalance = action.payload;
    },
    setRewardRate(state, action) {
      state.rewardRate = action.payload;
    },
    setTotalStaked(state, action) {
      state.totalStaked = action.payload;
    },
    setAPY(state, action) {
      state.apy = action.payload;
    },
    setStakingRewardLastBlock(state, action) {
      state.stakingRewardLastBlock = action.payload;
    },
    setRoi5(state, action) {
      state.roi5 = action.payload;
    },
    setTotalReward(state, action) {
      state.totalReward = action.payload;
    }
  }
});

// Reducer
export default slice.reducer;
// Actions
export const {
  initialized,
  setTokenBalance,
  setStokenBalance,
  setRewardRate,
  setTotalStaked,
  setAPY,
  setStakingRewardLastBlock,
  setRoi5,
  setTotalReward,
  setTokenInfo,
  setStokenInfo
} = slice.actions;

// ----------------------------------------------------------------------
