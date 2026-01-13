import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Franchise, FranchiseState } from '@/lib/types/franchise';

const initialState: FranchiseState = {
    list: [
        {
            _id: 'fran_001',
            code: 'DB-MAIN-001',
            name: 'Main Branch',
            address: '123 Main St, Downtown',
            location: 'Downtown',
            email: 'main@drybros.com',
            phone: '+1 234 567 8900',
            staffCount: 12,
            driverCount: 5,
            image: '/franchises/main.jpg',
            description: 'The primary operations hub for Drybros.',
            inchargeName: 'John Admin',
            staff: [
                { _id: 's1', name: 'Alice Smith', role: 'Manager' },
                { _id: 's2', name: 'Bob Wilson', role: 'Staff' }
            ],
            drivers: [
                { _id: 'd1', name: 'Charlie Driver' }
            ],
            status: 'active'
        },
        {
            _id: 'fran_002',
            code: 'DB-WEST-002',
            name: 'Westside Hub',
            address: '456 West Ave, Northside',
            location: 'Northside',
            email: 'west@drybros.com',
            phone: '+1 234 567 8901',
            staffCount: 8,
            driverCount: 3,
            image: '/franchises/west.jpg',
            description: 'Regional hub serving the western sectors.',
            inchargeName: 'Jane Manager',
            staff: [
                { _id: 's3', name: 'David Lee', role: 'Supervisor' }
            ],
            drivers: [
                { _id: 'd2', name: 'Daniel Trucker' }
            ],
            status: 'active'
        }
    ],
    selectedFranchise: null,
    isLoading: false,
    error: null,
};

const franchiseSlice = createSlice({
    name: 'franchise',
    initialState,
    reducers: {
        setFranchises: (state, action: PayloadAction<Franchise[]>) => {
            state.list = action.payload;
        },
        setSelectedFranchise: (state, action: PayloadAction<Franchise | null>) => {
            state.selectedFranchise = action.payload;
        },
        addFranchise: (state, action: PayloadAction<Franchise>) => {
            state.list.push(action.payload);
        },
        updateFranchise: (state, action: PayloadAction<Franchise>) => {
            const index = state.list.findIndex(f => f._id === action.payload._id);
            if (index !== -1) {
                state.list[index] = action.payload;
            }
        },
        deleteFranchise: (state, action: PayloadAction<string>) => {
            state.list = state.list.filter(f => f._id !== action.payload);
        },
        toggleFranchiseStatus: (state, action: PayloadAction<string>) => {
            const index = state.list.findIndex(f => f._id === action.payload);
            if (index !== -1) {
                state.list[index].status = state.list[index].status === 'active' ? 'blocked' : 'active';
            }
        }
    },
});

export const {
    setFranchises,
    setSelectedFranchise,
    addFranchise,
    updateFranchise,
    deleteFranchise,
    toggleFranchiseStatus
} = franchiseSlice.actions;

export default franchiseSlice.reducer;
