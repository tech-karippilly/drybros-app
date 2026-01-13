import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Staff, StaffState } from '@/lib/types/staff';

const initialState: StaffState = {
    list: [
        {
            _id: 'st_001',
            name: 'Alice Smith',
            email: 'alice@drybros.com',
            phone: '+1 234 567 8910',
            franchises_code: 'DB-MAIN-001',
            salary: 45000,
            status: 'active'
        },
        {
            _id: 'st_002',
            name: 'Bob Wilson',
            email: 'bob@drybros.com',
            phone: '+1 234 567 8911',
            franchises_code: 'DB-MAIN-001',
            salary: 38000,
            status: 'active'
        },
        {
            _id: 'st_003',
            name: 'David Lee',
            email: 'david@greenwash.com',
            phone: '+1 234 567 8912',
            franchises_code: 'DB-WEST-002',
            salary: 40000,
            status: 'suspended'
        }
    ],
    selectedStaff: null,
    isLoading: false,
    error: null,
    filters: {
        name: '',
        salary: '',
        status: 'all',
        email: '',
        phone: ''
    },
    pagination: {
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 3
    }
};

const staffSlice = createSlice({
    name: 'staff',
    initialState,
    reducers: {
        setStaffList: (state, action: PayloadAction<Staff[]>) => {
            state.list = action.payload;
            state.pagination.totalItems = action.payload.length;
        },
        setSelectedStaff: (state, action: PayloadAction<Staff | null>) => {
            state.selectedStaff = action.payload;
        },
        addStaff: (state, action: PayloadAction<Staff>) => {
            state.list.push(action.payload);
            state.pagination.totalItems += 1;
        },
        updateStaff: (state, action: PayloadAction<Staff>) => {
            const index = state.list.findIndex(s => s._id === action.payload._id);
            if (index !== -1) {
                state.list[index] = action.payload;
            }
        },
        deleteStaff: (state, action: PayloadAction<string>) => {
            state.list = state.list.filter(s => s._id !== action.payload);
            state.pagination.totalItems -= 1;
        },
        setStaffStatus: (state, action: PayloadAction<{ id: string; status: Staff['status'] }>) => {
            const index = state.list.findIndex(s => s._id === action.payload.id);
            if (index !== -1) {
                state.list[index].status = action.payload.status;
            }
        },
        setStaffFilters: (state, action: PayloadAction<Partial<StaffState['filters']>>) => {
            state.filters = { ...state.filters, ...action.payload };
            state.pagination.currentPage = 1;
        },
        setStaffPage: (state, action: PayloadAction<number>) => {
            state.pagination.currentPage = action.payload;
        }
    },
});

export const {
    setStaffList,
    setSelectedStaff,
    addStaff,
    updateStaff,
    deleteStaff,
    setStaffStatus,
    setStaffFilters,
    setStaffPage
} = staffSlice.actions;

export default staffSlice.reducer;
