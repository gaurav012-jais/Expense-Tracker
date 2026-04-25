import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import authReducer from '../slices/authSlice';
import transactionReducer from '../slices/transactionSlice';
import budgetReducer from '../slices/budgetSlice';
import aiReducer from '../slices/aiSlice';

const createCustomStorage = () => {
  return {
    getItem: (key) => Promise.resolve(localStorage.getItem(key)),
    setItem: (key, item) => {
      localStorage.setItem(key, item);
      return Promise.resolve();
    },
    removeItem: (key) => {
      localStorage.removeItem(key);
      return Promise.resolve();
    },
  };
};

const storage = createCustomStorage();

const persistConfig = {
  key: 'root',
  version: 1,
  storage,
  whitelist: ['auth'],
};

const rootReducer = combineReducers({
  auth: authReducer,
  transactions: transactionReducer,
  budgets: budgetReducer,
  ai: aiReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);