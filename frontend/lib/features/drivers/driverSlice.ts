import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { GetDriver, CreateDriverInput, UpdateDriverInput, DriverStatus, GenderType, EmploymentType } from "@/lib/types/drivers";
import { DRIVERS_STRINGS } from "@/lib/constants/drivers";
import {
    getDriverList,
    getDriverById as getDriverByIdApi,
    createDriver as createDriverApi,
    updateDriver as updateDriverApi,
    updateDriverStatus as updateDriverStatusApi,
    deleteDriver as deleteDriverApi,
    DriverResponse,
    CreateDriverRequest,
    UpdateDriverRequest,
    UpdateDriverStatusRequest,
    PaginationQuery,
} from './driverApi';

// Constants for status mapping
const STATUS_MAP: Record<string, DriverStatus> = {
    'ACTIVE': DriverStatus.ACTIVE,
    'INACTIVE': DriverStatus.INACTIVE,
    'BLOCKED': DriverStatus.BLOCKED,
    'TERMINATED': DriverStatus.TERMINATED,
} as const;

// Helper function to map backend status to frontend enum
const mapStatus = (status: string): DriverStatus => {
    return STATUS_MAP[status.toUpperCase()] || DriverStatus.ACTIVE;
};

// Constants for document mapping
const DOCUMENT_MAP = {
    aadharCard: 'Govt Identity',
    license: 'License',
    educationCert: 'Educational Certificates',
    previousExp: 'Previous Experience',
} as const;

// Helper function to convert UUID to number (fallback for frontend _id)
const uuidToNumber = (uuid: string): number => {
    return parseInt(uuid.replace(/-/g, '').substring(0, 10), 16) || 0;
};

// Helper function to normalize date to ISO string
const normalizeDate = (date: Date | string): string => {
    return typeof date === 'string' ? date : date.toISOString();
};

// Helper function to map backend DriverResponse to frontend GetDriver
const mapBackendDriverToFrontend = (backendDriver: DriverResponse): GetDriver => {
    // Map documents from boolean flags to array
    const documentsCollected: string[] = [];
    if (backendDriver.aadharCard) documentsCollected.push(DOCUMENT_MAP.aadharCard);
    if (backendDriver.license) documentsCollected.push(DOCUMENT_MAP.license);
    if (backendDriver.educationCert) documentsCollected.push(DOCUMENT_MAP.educationCert);
    if (backendDriver.previousExp) documentsCollected.push(DOCUMENT_MAP.previousExp);

    const driverId = uuidToNumber(backendDriver.id);
    
    return {
        _id: driverId,
        id: backendDriver.id, // Store original UUID for API calls
        userId: driverId,
        firstName: backendDriver.firstName,
        lastName: backendDriver.lastName,
        driverPhone: backendDriver.phone,
        driverAltPhone: backendDriver.altPhone,
        email: backendDriver.email,
        status: mapStatus(backendDriver.status),
        complaintCount: backendDriver.complaintCount,
        bannedGlobally: backendDriver.bannedGlobally,
        dailyTargetAmount: backendDriver.dailyTargetAmount || 0,
        currentRating: backendDriver.currentRating || 0,
        createdAt: normalizeDate(backendDriver.createdAt),
        updatedAt: normalizeDate(backendDriver.updatedAt),
        // Personal details - using defaults for fields not in backend response
        dateOfBirth: new Date().toISOString(), // Not in backend DTO
        gender: GenderType.MALE, // Not in backend DTO
        profilePhoto: '', // Not in backend DTO
        licenseNumber: backendDriver.licenseNumber,
        licenseType: 'LMV', // Not in backend DTO
        licenseFront: '', // Not in backend DTO
        licenseBack: '', // Not in backend DTO
        licenseExpiryDate: normalizeDate(backendDriver.licenseExpDate),
        documentsCollected,
        // Address Details
        address: backendDriver.address,
        city: backendDriver.city,
        state: backendDriver.state,
        pincode: backendDriver.pincode,
        // Employment Details
        franchiseId: uuidToNumber(backendDriver.franchiseId),
        franchiseName: '', // Will need to fetch from franchise API
        dateOfJoining: new Date().toISOString(), // Not in backend DTO
        assignedCity: backendDriver.city,
        employmentType: EmploymentType.FULL_TIME, // Not in backend DTO
        remainingDailyLimit: backendDriver.remainingDailyLimit ?? null,
        // Daily Status from API
        dailyStatus: (backendDriver as any).dailyStatus,
        // Bank Details
        bankAccountNumber: backendDriver.bankAccountNumber,
        accountHolderName: backendDriver.bankAccountName,
        ifscCode: backendDriver.bankIfscCode,
        upiId: null, // Not in backend DTO
        // Emergency Contact
        contactName: backendDriver.emergencyContactName,
        contactNumber: backendDriver.emergencyContactPhone,
        relationship: backendDriver.emergencyContactRelation,
        carTypes: backendDriver.carTypes || ['MANUAL'],
    };
};

// Helper function to extract document flags from array
const extractDocumentFlags = (documentsCollected: string[] = []) => {
    return {
        aadharCard: documentsCollected.includes(DOCUMENT_MAP.aadharCard),
        license: documentsCollected.includes(DOCUMENT_MAP.license),
        educationCert: documentsCollected.includes(DOCUMENT_MAP.educationCert),
        previousExp: documentsCollected.includes(DOCUMENT_MAP.previousExp),
    };
};

// Helper function to convert franchiseId to UUID string
const normalizeFranchiseId = (franchiseId: number | string): string => {
    return typeof franchiseId === 'string' ? franchiseId : franchiseId.toString();
};

// Map frontend EmploymentType enum to API-facing string
const mapEmploymentTypeToApi = (employmentType?: EmploymentType | null): 'part time' | 'full time' | 'contract' | undefined => {
    if (!employmentType) return undefined;
    switch (employmentType) {
        case EmploymentType.FULL_TIME:
            return 'full time';
        case EmploymentType.PART_TIME:
            return 'part time';
        case EmploymentType.CONTRACT:
            return 'contract';
        default:
            return undefined;
    }
};

// Helper function to map frontend CreateDriverInput to backend CreateDriverRequest
const mapFrontendDriverToBackend = (frontendDriver: CreateDriverInput): CreateDriverRequest => {
    // Extract documents from array
    const docFlags = extractDocumentFlags(frontendDriver.documentsCollected);

    // Convert franchiseId to string (UUID)
    const franchiseId = normalizeFranchiseId(frontendDriver.franchiseId);

    return {
        firstName: frontendDriver.firstName,
        lastName: frontendDriver.lastName,
        phone: frontendDriver.driverPhone,
        email: frontendDriver.email,
        altPhone: frontendDriver.driverAltPhone || undefined,
        password: frontendDriver.password || '', // Password is required
        emergencyContactName: frontendDriver.emergencyContactName,
        emergencyContactPhone: frontendDriver.emergencyContactPhone,
        emergencyContactRelation: frontendDriver.emergencyContactRelation,
        address: frontendDriver.address,
        city: frontendDriver.city,
        state: frontendDriver.state,
        pincode: frontendDriver.pincode,
        licenseNumber: frontendDriver.licenseNumber,
        licenseExpDate: new Date(frontendDriver.licenseExpDate),
        bankAccountName: frontendDriver.bankAccountName,
        bankAccountNumber: frontendDriver.bankAccountNumber,
        bankIfscCode: frontendDriver.bankIfscCode,
        ...docFlags,
        carTypes: frontendDriver.carTypes || ['MANUAL'], // Use provided or default
        franchiseId, // UUID string
        licenseType: frontendDriver.licenseType || null,
        employmentType: mapEmploymentTypeToApi(frontendDriver.employmentType),
    };
};



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

// Async Thunks with Real API Calls

export const fetchDrivers = createAsyncThunk(
    'drivers/fetchDrivers',
    async (pagination: PaginationQuery | undefined, { rejectWithValue }) => {
        try {
            const result = await getDriverList(pagination);
            
            // Handle paginated response
            if ('pagination' in result) {
                return result.data.map(mapBackendDriverToFrontend);
            }
            
            // Handle simple list response
            return (result as DriverResponse[]).map(mapBackendDriverToFrontend);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || DRIVERS_STRINGS.LIST_ERROR;
            return rejectWithValue(errorMessage);
        }
    }
);

export const fetchDriverById = createAsyncThunk(
    'drivers/fetchDriverById',
    async (id: string, { rejectWithValue }) => {
        try {
            const driver = await getDriverByIdApi(id);
            return mapBackendDriverToFrontend(driver);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Failed to fetch driver';
            return rejectWithValue(errorMessage);
        }
    }
);

export const createDriver = createAsyncThunk(
    'drivers/createDriver',
    async (driverData: CreateDriverInput, { rejectWithValue }) => {
        try {
            // Validate password
            if (!driverData.password) {
                return rejectWithValue('Password is required');
            }
            
            // Convert frontend input to backend request
            const backendRequest = mapFrontendDriverToBackend(driverData);
            
            const response = await createDriverApi(backendRequest);
            return mapBackendDriverToFrontend(response.data);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || DRIVERS_STRINGS.CREATE_ERROR;
            return rejectWithValue(errorMessage);
        }
    }
);

export const updateDriver = createAsyncThunk(
    'drivers/updateDriver',
    async ({ id, data }: { id: string | number; data: UpdateDriverInput }, { rejectWithValue, getState }) => {
        try {
            // Convert frontend UpdateDriverInput to backend UpdateDriverRequest
            const updateRequest: UpdateDriverRequest = {};
            
            if (data.firstName !== null && data.firstName !== undefined) updateRequest.firstName = data.firstName;
            if (data.lastName !== null && data.lastName !== undefined) updateRequest.lastName = data.lastName;
            if (data.driverPhone !== null && data.driverPhone !== undefined) updateRequest.phone = data.driverPhone;
            if (data.driverAltPhone !== null && data.driverAltPhone !== undefined) updateRequest.altPhone = data.driverAltPhone;
            if (data.email !== null && data.email !== undefined) updateRequest.email = data.email;
            if (data.address !== null && data.address !== undefined) updateRequest.address = data.address;
            if (data.city !== null && data.city !== undefined) updateRequest.city = data.city;
            if (data.state !== null && data.state !== undefined) updateRequest.state = data.state;
            if (data.pincode !== null && data.pincode !== undefined) updateRequest.pincode = data.pincode;
            if (data.licenseNumber !== null && data.licenseNumber !== undefined) updateRequest.licenseNumber = data.licenseNumber;
            if (data.licenseExpiryDate !== null && data.licenseExpiryDate !== undefined) {
                updateRequest.licenseExpDate = new Date(data.licenseExpiryDate);
            }
            if (data.bankAccountNumber !== null && data.bankAccountNumber !== undefined) updateRequest.bankAccountNumber = data.bankAccountNumber;
            if (data.accountHolderName !== null && data.accountHolderName !== undefined) updateRequest.bankAccountName = data.accountHolderName;
            if (data.ifscCode !== null && data.ifscCode !== undefined) updateRequest.bankIfscCode = data.ifscCode;
            if (data.contactName !== null && data.contactName !== undefined) updateRequest.emergencyContactName = data.contactName;
            if (data.contactNumber !== null && data.contactNumber !== undefined) updateRequest.emergencyContactPhone = data.contactNumber;
            if (data.relationship !== null && data.relationship !== undefined) updateRequest.emergencyContactRelation = data.relationship;
            
            // Map documents
            if (data.documentsCollected !== null && data.documentsCollected !== undefined) {
                updateRequest.aadharCard = data.documentsCollected.includes('Govt Identity');
                updateRequest.license = data.documentsCollected.includes('License');
                updateRequest.educationCert = data.documentsCollected.includes('Educational Certificates');
                updateRequest.previousExp = data.documentsCollected.includes('Previous Experience');
            }
            
            if (data.franchiseId !== null && data.franchiseId !== undefined) {
                updateRequest.franchiseId = data.franchiseId.toString();
            }
            // Map employment type if provided
            if (data.employmentType !== null && data.employmentType !== undefined) {
                updateRequest.employmentType = mapEmploymentTypeToApi(data.employmentType as EmploymentType) || null;
            }
            
            // Convert id to UUID string
            let driverId: string;
            if (typeof id === 'string') {
                // Check if it's already a UUID format
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                if (uuidRegex.test(id)) {
                    driverId = id;
                } else {
                    return rejectWithValue("Invalid driver ID format. Expected UUID.");
                }
            } else {
                // If id is a number, find the driver in state to get its UUID
                const state = getState() as any;
                const driver = state.drivers?.list?.find((d: GetDriver) => d._id === id);
                if (driver && driver.id) {
                    driverId = driver.id;
                } else {
                    return rejectWithValue("Driver ID not found. Please refresh the driver list.");
                }
            }
            const response = await updateDriverApi(driverId, updateRequest);
            return mapBackendDriverToFrontend(response.data);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || DRIVERS_STRINGS.UPDATE_ERROR;
            return rejectWithValue(errorMessage);
        }
    }
);

// Helper function to convert driver ID (number or string) to UUID string
const getDriverUuid = (id: string | number, getState: any): string => {
    if (typeof id === 'string') {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(id)) {
            return id;
        }
    }
    // If id is a number, find the driver in state to get its UUID
    const state = getState();
    const driver = state.drivers?.list?.find((d: GetDriver) => d._id === id);
    if (driver && driver.id) {
        return driver.id;
    }
    throw new Error("Driver ID not found. Please refresh the driver list.");
};

export const updateDriverStatus = createAsyncThunk(
    'drivers/updateDriverStatus',
    async ({ id, status }: { id: string | number; status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'TERMINATED' }, { rejectWithValue, getState }) => {
        try {
            const driverId = getDriverUuid(id, getState);
            const response = await updateDriverStatusApi(driverId, { status });
            return mapBackendDriverToFrontend(response.data);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || error?.message || 'Failed to update driver status';
            return rejectWithValue(errorMessage);
        }
    }
);

export const deleteDriver = createAsyncThunk(
    'drivers/deleteDriver',
    async (id: string | number, { rejectWithValue, getState }) => {
        try {
            const driverId = getDriverUuid(id, getState);
            await deleteDriverApi(driverId);
            return driverId;
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || DRIVERS_STRINGS.DELETE_ERROR;
            return rejectWithValue(errorMessage);
        }
    }
);

export const banDriver = createAsyncThunk(
    'drivers/banDriver',
    async (id: string | number, { rejectWithValue, getState }) => {
        try {
            const driverId = getDriverUuid(id, getState);
            const response = await updateDriverStatusApi(driverId, { status: 'BLOCKED' });
            const driver = mapBackendDriverToFrontend(response.data);
            return { _id: parseInt(String(id).replace(/-/g, '').substring(0, 10), 16) || 0, status: DriverStatus.BLOCKED, driver };
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Failed to ban driver';
            return rejectWithValue(errorMessage);
        }
    }
);

export const reactivateDriver = createAsyncThunk(
    'drivers/reactivateDriver',
    async (id: string | number, { rejectWithValue, getState }) => {
        try {
            const driverId = getDriverUuid(id, getState);
            const response = await updateDriverStatusApi(driverId, { status: 'ACTIVE' });
            const driver = mapBackendDriverToFrontend(response.data);
            return { _id: typeof id === 'number' ? id : driver._id, status: DriverStatus.ACTIVE, driver };
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Failed to reactivate driver';
            return rejectWithValue(errorMessage);
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

        // Fetch by ID
        builder
            .addCase(fetchDriverById.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchDriverById.fulfilled, (state, action) => {
                state.isLoading = false;
                const index = state.drivers.findIndex(d => d._id === action.payload._id);
                if (index !== -1) {
                    state.drivers[index] = action.payload;
                } else {
                    state.drivers.push(action.payload);
                }
            })
            .addCase(fetchDriverById.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // Create
        builder
            .addCase(createDriver.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createDriver.fulfilled, (state, action) => {
                state.isLoading = false;
                state.drivers.push(action.payload);
            })
            .addCase(createDriver.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // Update
        builder
            .addCase(updateDriver.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateDriver.fulfilled, (state, action) => {
                state.isLoading = false;
                const index = state.drivers.findIndex(d => d._id === action.payload._id);
                if (index !== -1) {
                    state.drivers[index] = action.payload;
                }
            })
            .addCase(updateDriver.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
        
        // Update Status
        builder
            .addCase(updateDriverStatus.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateDriverStatus.fulfilled, (state, action) => {
                state.isLoading = false;
                const index = state.drivers.findIndex(d => d._id === action.payload._id);
                if (index !== -1) {
                    state.drivers[index] = action.payload;
                }
            })
            .addCase(updateDriverStatus.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
        
        // Ban
        builder
            .addCase(banDriver.fulfilled, (state, action) => {
                 const index = state.drivers.findIndex(d => d._id === action.payload._id);
                if (index !== -1) {
                    state.drivers[index] = action.payload.driver;
                }
            });

        // Reactivate
        builder
            .addCase(reactivateDriver.fulfilled, (state, action) => {
                 const index = state.drivers.findIndex(d => d._id === action.payload._id);
                if (index !== -1) {
                    state.drivers[index] = action.payload.driver;
                }
            });

        // Delete
        builder
            .addCase(deleteDriver.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(deleteDriver.fulfilled, (state, action) => {
                state.isLoading = false;
                // Convert UUID string to number for comparison
                const idNum = parseInt(action.payload.replace(/-/g, '').substring(0, 10), 16) || 0;
                state.drivers = state.drivers.filter(d => {
                    // Try to match by UUID string if _id is stored as string
                    const driverId = typeof d._id === 'string' ? d._id : d._id.toString();
                    return driverId !== action.payload && d._id !== idNum;
                });
            })
            .addCase(deleteDriver.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export default driversSlice.reducer;
