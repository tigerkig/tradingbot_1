import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  chainId: Number(process.env.REACT_APP_BSC_CHAINID)
};
const slice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    // START LOADING
    switchNetwork(state, action) {
      state.chainId = Number(action.payload);
    }
  }
});

// Reducer
export default slice.reducer;
export function switchNetwork(network) {
  return (dispatch) => {
    dispatch(slice.actions.switchNetwork(network));
  };
}
