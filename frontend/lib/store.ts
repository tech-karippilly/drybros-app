import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/auth/authSlice';
import franchiseReducer from './features/franchise/franchiseSlice';
import staffReducer from './features/staff/staffSlice';
import penaltiesReducer from './features/penalties/penaltiesSlice';
import driversReducer from './features/drivers/driverSlice';
import tripTypeReducer from './features/tripType/tripTypeSlice';

export const makeStore = () => {
    return configureStore({
        reducer: {
            auth: authReducer,
            franchise: franchiseReducer,
            staff: staffReducer,
            penalties: penaltiesReducer,
            drivers: driversReducer,
            tripType: tripTypeReducer,
        },
    });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
