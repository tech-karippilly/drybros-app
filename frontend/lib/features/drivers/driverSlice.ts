import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { GetDriver, CreateDriverInput, UpdateDriverInput, DriverStatus, GenderType, EmploymentType, Trip, TripType, TripStatus, PaymentStatus, PaymentMode } from "@/lib/types/drivers";
import { DRIVERS_STRINGS } from "@/lib/constants/drivers";

// Constants
const DELAY_MS = 800;

// Dummy Data
const DUMMY_DRIVERS: GetDriver[] = [
    {
        _id: 101,
        userId: 1001,
        firstName: "Rajesh",
        lastName: "Kumar",
        driverPhone: "9876543210",
        driverAltPhone: "9876543211",
        email: "some@example.com",
        status: DriverStatus.ACTIVE,
        complaintCount: 0,
        bannedGlobally: false,
        dailyTargetAmount: 1500,
        currentRating: 4.8,
        createdAt: "2024-01-01T10:00:00Z",
        updatedAt: "2024-01-15T10:00:00Z",
        trips: [], // Can populate with dummy trips if needed
        dateOfBirth: "1990-05-15",
        gender: GenderType.MALE,
        profilePhoto: "",
        licenseNumber: "DL-1420110012345",
        licenseType: "LMV",
        licenseFront: "",
        licenseBack: "",
        licenseExpiryDate: "2030-05-15",
        documentsCollected: ["Govt Identity", "Address Proof"],
        address: "123, Main Street, MG Road",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560001",
        franchiseId: 1,
        franchiseName: "Bangalore Central",
        dateOfJoining: "2023-01-01",
        assignedCity: "Bangalore",
        employmentType: EmploymentType.FULL_TIME,
        bankAccountNumber: "1234567890",
        accountHolderName: "Rajesh Kumar",
        ifscCode: "SBIN0001234",
        upiId: "rajesh@upi",
        contactName: "Suresh Kumar",
        contactNumber: "9988776655",
        relationship: "Brother"
    },
    {
        _id: 102,
        userId: 1002,
        firstName: "Suresh",
        lastName: "Singh",
        driverPhone: "9123456789",
        driverAltPhone: null,
        email: "some@example.com",
        status: DriverStatus.INACTIVE,
        complaintCount: 1,
        bannedGlobally: false,
        dailyTargetAmount: 1200,
        currentRating: 4.2,
        createdAt: "2024-02-01T10:00:00Z",
        updatedAt: "2024-02-01T10:00:00Z",
        trips: [],
        dateOfBirth: "1988-08-20",
        gender: GenderType.MALE,
        profilePhoto: "",
        licenseNumber: "DL-1420110054321",
        licenseType: "LMV",
        licenseFront: "",
        licenseBack: "",
        licenseExpiryDate: "2028-08-20",
        documentsCollected: ["Govt Identity"],
        address: "456, Lake View, Indiranagar",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560038",
        franchiseId: 1,
        franchiseName: "Bangalore Central",
        dateOfJoining: "2023-06-01",
        assignedCity: "Bangalore",
        employmentType: EmploymentType.CONTRACT,
        bankAccountNumber: "0987654321",
        accountHolderName: "Suresh Singh",
        ifscCode: "HDFC0001234",
        upiId: null,
        contactName: null,
        contactNumber: null,
        relationship: null
    }
];

interface DriversState {
    drivers: GetDriver[];
    isLoading: boolean;
    error: string | null;
}

const initialState: DriversState = {
    drivers: [], // Initially empty, will pull dummy data
    isLoading: false,
    error: null,
};

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Async Thunks with Dummy Logic

export const fetchDrivers = createAsyncThunk(
    'drivers/fetchDrivers',
    async (_, { rejectWithValue }) => {
        try {
            await delay(DELAY_MS);
            return DUMMY_DRIVERS;
        } catch (error: any) {
             return rejectWithValue(DRIVERS_STRINGS.LIST_ERROR);
        }
    }
);

export const createDriver = createAsyncThunk(
    'drivers/createDriver',
    async (driverData: CreateDriverInput, { rejectWithValue }) => {
        try {
            await delay(DELAY_MS);
            
            // Mock created driver
            const newDriver: GetDriver = {
                _id: Math.floor(Math.random() * 1000) + 200, // Random ID > 200
                ...driverData,
                // Fill default/mock values for fields not in CreateDriverInput
                status: DriverStatus.ACTIVE,
                complaintCount: 0,
                bannedGlobally: false,
                dailyTargetAmount: 0,
                currentRating: 5.0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                trips: [],
                franchiseName: "Assigned Franchise", // In real apps this would arguably come from backend relation
                profilePhoto: "",
                licenseFront: "",
                licenseBack: ""
            };
            return newDriver;
        } catch (error: any) {
            return rejectWithValue(DRIVERS_STRINGS.CREATE_ERROR);
        }
    }
);

export const updateDriver = createAsyncThunk(
    'drivers/updateDriver',
    async ({ id, data }: { id: number; data: UpdateDriverInput }, { rejectWithValue, getState }) => {
        try {
            await delay(DELAY_MS);
            // In a real mock, we'd grab the existing driver from state, merge, and return
            // For now, simpler to just return the mocked updated object or let the reducer handle the merge visually
            // But to return a full GetDriver object is ideal.
            
            // NOTE: Ideally we access state here to merge with existing data, 
            // but for this simple mock we can just return the input data merged with ID
            // However, the reducer expects a full GetDriver object.
            
            // Hacky reconstruction for mock purposes:
            // We'll trust the reducer to likely find the existing one and update it, 
            // OR we fetch current state here to do it right.
            const state = getState() as { driver: DriversState }; // Assuming root state structure
            // Just returning the data + id for the reducer to merge is usually cleaner if the payload type allowed partials
            // But our reducer expects full GetDriver in payload?
            // Let's actually find it in the list if we can, or just return a "best effort" object
            
            // Simplest Mock Strategy: Return the data given, and 'Active' status etc.
            // But data is UpdateDriverInput (partials).
            // We need to return a FULL driver or change the reducer logic to accept partial updates.
            // Let's change the reducer to handle partial updates coming back from this action, 
            // OR simpler: just return the payload as is and cast it, letting the reducer merge.
            
            return data; 
        } catch (error: any) {
             return rejectWithValue(DRIVERS_STRINGS.UPDATE_ERROR);
        }
    }
);

export const deleteDriver = createAsyncThunk(
    'drivers/deleteDriver',
    async (id: number, { rejectWithValue }) => {
        try {
            await delay(DELAY_MS);
            return id;
        } catch (error: any) {
             return rejectWithValue(DRIVERS_STRINGS.DELETE_ERROR);
        }
    }
);

export const banDriver = createAsyncThunk(
    'drivers/banDriver',
    async (id: number, { rejectWithValue }) => {
        try {
            await delay(DELAY_MS);
            return { _id: id, status: DriverStatus.BLOCKED };
        } catch (error: any) {
            return rejectWithValue("Failed to ban driver");
        }
    }
);

export const reactivateDriver = createAsyncThunk(
    'drivers/reactivateDriver',
    async (id: number, { rejectWithValue }) => {
        try {
            await delay(DELAY_MS);
            return { _id: id, status: DriverStatus.ACTIVE };
        } catch (error: any) {
            return rejectWithValue("Failed to reactivate driver");
        }
    }
);

const driversSlice = createSlice({
    name: 'drivers',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        // Fetch
        builder
            .addCase(fetchDrivers.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchDrivers.fulfilled, (state, action) => {
                state.isLoading = false;
                state.drivers = action.payload;
            })
            .addCase(fetchDrivers.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // Create
        builder
            .addCase(createDriver.fulfilled, (state, action) => {
                state.drivers.push(action.payload as GetDriver); // Cast safely since we constructed it
            });

        // Update
        builder
            .addCase(updateDriver.fulfilled, (state, action) => {
                const index = state.drivers.findIndex(d => d._id === action.payload._id);
                if (index !== -1) {
                    // Deep merge the partial update
                    state.drivers[index] = { ...state.drivers[index], ...action.payload } as GetDriver;
                }
            });
        
        // Ban
        builder
            .addCase(banDriver.fulfilled, (state, action) => {
                 const index = state.drivers.findIndex(d => d._id === action.payload._id);
                if (index !== -1) {
                    state.drivers[index].status = action.payload.status;
                }
            });

        // Reactivate
        builder
            .addCase(reactivateDriver.fulfilled, (state, action) => {
                 const index = state.drivers.findIndex(d => d._id === action.payload._id);
                if (index !== -1) {
                    state.drivers[index].status = action.payload.status;
                }
            });

        // Delete
        builder
            .addCase(deleteDriver.fulfilled, (state, action) => {
                state.drivers = state.drivers.filter(d => d._id !== action.payload);
            });
    },
});

export default driversSlice.reducer;
