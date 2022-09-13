import { combineReducers } from 'redux';
import storage from 'redux-persist/lib/storage';
// slices
import networkReducer from './slices/network';
import stakingReducer from './slices/staking';
import governanceReducer from './slices/governance';

// ----------------------------------------------------------------------

const rootPersistConfig = {
  key: 'root',
  storage,
  keyPrefix: 'redux-',
  whitelist: []
};

const rootReducer = combineReducers({
  network: networkReducer,
  staking: stakingReducer,
  governance: governanceReducer
});

export { rootPersistConfig, rootReducer };
