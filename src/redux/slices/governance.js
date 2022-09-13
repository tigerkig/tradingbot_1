/* eslint-disable no-restricted-properties */
/* eslint-disable no-empty */
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isLoading: false,
  isInitialized: false,
  error: false,
  proposalNum: 0,
  proposalThreshold: 0,
  proposalDelay: 0,
  quorumNeeded: 0,
  votingPeriod: 0,
  proposals: [],
  manageProposals: []
};

const slice = createSlice({
  name: 'governance',
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
    },
    setProposalNum(state, action) {
      state.proposalNum = action.payload;
    },
    setProposalThreshold(state, action) {
      state.proposalThreshold = action.payload;
    },
    setProposalDelay(state, action) {
      state.proposalDelay = action.payload;
    },
    setQuorumNeeded(state, action) {
      state.quorumNeeded = action.payload;
    },
    setVotingPeriod(state, action) {
      state.votingPeriod = action.payload;
    },
    setProposals(state, action) {
      state.proposals = action.payload;
    },
    setManageProposals(state, action) {
      state.manageProposals = action.payload;
    }
  }
});

// Reducer
export default slice.reducer;
// Actions
export const {
  initialized,
  setProposalNum,
  setProposalThreshold,
  setProposalDelay,
  setQuorumNeeded,
  setVotingPeriod,
  setProposals,
  setManageProposals
} = slice.actions;

// ----------------------------------------------------------------------
