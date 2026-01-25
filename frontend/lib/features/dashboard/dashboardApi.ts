/**
 * Dashboard API Module
 * 
 * Fetches dashboard metrics for different roles.
 * Falls back to dummy data if APIs are not available.
 */
import api from '../../axios';
import { getTripCount, getTripsPaginated } from '../trip/tripApi';
import { getDriversPaginated } from '../drivers/driverApi';
import { getTodayYYYYMMDD, KPI_ACTIVE_TRIP_STATUSES, KPI_CANCELED_TRIP_STATUSES } from '../../constants/kpi';

// Dashboard Metrics Response Types
export interface DashboardMetrics {
    // Trip Metrics
    tripsToday: number;
    tripsThisWeek: number;
    tripsThisMonth: number;
    totalRevenue: number;
    revenueToday: number;
    revenueThisWeek: number;
    revenueThisMonth: number;
    
    // Driver Metrics
    activeDrivers: number;
    inactiveDrivers: number;
    driversOnDuty: number;
    
    // Franchise Metrics
    activeFranchises: number;
    totalBranches: number;
    
    // Customer Metrics
    totalCustomers: number;
    
    // Trip Status Metrics
    ongoingTrips: number;
    completedTrips: number;
    cancelledTrips: number;
    cancellationRate: number;
    
    // Complaint Metrics
    complaintsCount: number;
    complaintsPending: number;
    complaintsResolved: number;
    
    // Penalty Metrics
    penaltiesIssued: number;
    penaltiesToday: number;
    
    // Pending Items
    pendingTripAssignments: number;
    pendingDriverRegistrations: number;
    pendingFranchiseRequests: number;
    vehiclesPendingVerification: number;
    expiredDocuments: number;
    paymentSettlementPending: number;
}

export interface RevenueTrend {
    date: string;
    revenue: number;
    trips: number;
}

export interface TripTypeDistribution {
    type: string;
    count: number;
    revenue: number;
}

export interface CityBranchDistribution {
    city: string;
    branch: string;
    trips: number;
    revenue: number;
}

export interface DriverUtilization {
    driverId: string;
    driverName: string;
    utilizationPercent: number;
    tripsCompleted: number;
}

export interface PeakBookingHours {
    hour: number;
    bookings: number;
}

export interface AlertItem {
    id: string;
    type: 'low_rating' | 'high_complaint' | 'expired_document' | 'pending_verification' | 'payment_pending';
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    entityId?: string;
    entityName?: string;
}

export interface DashboardAnalytics {
    revenueTrend: RevenueTrend[];
    tripTypeDistribution: TripTypeDistribution[];
    cityBranchDistribution: CityBranchDistribution[];
    driverUtilization: DriverUtilization[];
    peakBookingHours: PeakBookingHours[];
}

export interface ManagerDashboardData {
    metrics: {
        tripsToday: number;
        revenueToday: number;
        activeDriversOnDuty: number;
        pendingTripAssignments: number;
        complaintsAssigned: number;
    };
    ongoingTrips: any[];
    tripsWaitingForDriver: any[];
    delayedTrips: any[];
    highValueTrips: any[];
    driverPerformance: {
        attendance: number;
        avgRating: number;
        tripsPerDriver: number;
        penaltiesToday: number;
        idleDrivers: number;
    };
    branchInsights: {
        revenueByArea: { area: string; revenue: number }[];
        cancellationReasons: { reason: string; count: number }[];
    };
    alerts: AlertItem[];
}

export interface StaffDashboardData {
    tasks: {
        assigned: number;
        openComplaints: number;
        escalatedIssues: number;
        followUpsPending: number;
    };
    tripSupport: {
        manualIntervention: number;
        driverNotReachable: number;
        customerHelpRequests: number;
        tripModificationRequests: number;
    };
    customerSupport: {
        newComplaints: number;
        inProgressComplaints: number;
        resolvedToday: number;
        slaBreachWarnings: number;
    };
    driverSupport: {
        onboardingPending: number;
        documentVerificationPending: number;
        queries: number;
    };
    productivity: {
        tasksCompletedToday: number;
        avgResolutionTime: number;
        pendingBacklog: number;
    };
}

export interface DriverDashboardData {
    tripInfo: {
        currentTrip: any | null;
        upcomingTrips: any[];
        completedToday: number;
        cancelledToday: number;
    };
    earnings: {
        today: number;
        weekly: number;
        pendingSettlements: number;
        incentives: number;
    };
    attendance: {
        isOnline: boolean;
        loginTime: string | null;
        hoursWorkedToday: number;
    };
    performance: {
        rating: number;
        totalTripsCompleted: number;
        complaints: number;
        penalties: number;
    };
    compliance: {
        documentExpiryAlerts: number;
        vehicleVerificationStatus: string;
        appUpdates: string[];
    };
}

/**
 * Generate dummy dashboard metrics
 */
function generateDummyMetrics(): DashboardMetrics {
    return {
        tripsToday: 45,
        tripsThisWeek: 312,
        tripsThisMonth: 1280,
        totalRevenue: 2450000,
        revenueToday: 67500,
        revenueThisWeek: 468000,
        revenueThisMonth: 1920000,
        activeDrivers: 85,
        inactiveDrivers: 12,
        driversOnDuty: 62,
        activeFranchises: 8,
        totalBranches: 12,
        totalCustomers: 1250,
        ongoingTrips: 18,
        completedTrips: 1245,
        cancelledTrips: 35,
        cancellationRate: 2.7,
        complaintsCount: 28,
        complaintsPending: 8,
        complaintsResolved: 20,
        penaltiesIssued: 15,
        penaltiesToday: 2,
        pendingTripAssignments: 5,
        pendingDriverRegistrations: 3,
        pendingFranchiseRequests: 1,
        vehiclesPendingVerification: 4,
        expiredDocuments: 7,
        paymentSettlementPending: 12,
    };
}

/**
 * Generate dummy analytics data
 */
function generateDummyAnalytics(): DashboardAnalytics {
    const today = new Date();
    const revenueTrend: RevenueTrend[] = [];
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        revenueTrend.push({
            date: date.toISOString().split('T')[0],
            revenue: Math.floor(Math.random() * 50000) + 30000,
            trips: Math.floor(Math.random() * 30) + 20,
        });
    }

    return {
        revenueTrend,
        tripTypeDistribution: [
            { type: 'Local', count: 850, revenue: 425000 },
            { type: 'Outstation', count: 320, revenue: 960000 },
            { type: 'Rental', count: 110, revenue: 550000 },
        ],
        cityBranchDistribution: [
            { city: 'Mumbai', branch: 'Andheri', trips: 450, revenue: 675000 },
            { city: 'Mumbai', branch: 'Bandra', trips: 380, revenue: 570000 },
            { city: 'Pune', branch: 'Hinjewadi', trips: 290, revenue: 435000 },
            { city: 'Delhi', branch: 'Gurgaon', trips: 160, revenue: 370000 },
        ],
        driverUtilization: [
            { driverId: '1', driverName: 'Rajesh Kumar', utilizationPercent: 92, tripsCompleted: 145 },
            { driverId: '2', driverName: 'Amit Singh', utilizationPercent: 88, tripsCompleted: 138 },
            { driverId: '3', driverName: 'Vikram Patel', utilizationPercent: 85, tripsCompleted: 132 },
        ],
        peakBookingHours: [
            { hour: 8, bookings: 45 },
            { hour: 9, bookings: 62 },
            { hour: 10, bookings: 78 },
            { hour: 11, bookings: 85 },
            { hour: 12, bookings: 92 },
            { hour: 13, bookings: 88 },
            { hour: 14, bookings: 75 },
            { hour: 15, bookings: 68 },
            { hour: 16, bookings: 72 },
            { hour: 17, bookings: 80 },
            { hour: 18, bookings: 95 },
            { hour: 19, bookings: 88 },
        ],
    };
}

/**
 * Generate dummy alerts
 */
function generateDummyAlerts(): AlertItem[] {
    return [
        {
            id: '1',
            type: 'low_rating',
            title: 'Drivers with Low Ratings',
            description: '3 drivers have ratings below 3.5',
            severity: 'high',
        },
        {
            id: '2',
            type: 'high_complaint',
            title: 'High Complaint Drivers',
            description: '2 drivers have 5+ complaints this month',
            severity: 'high',
        },
        {
            id: '3',
            type: 'expired_document',
            title: 'Expired Documents',
            description: '7 documents (RC, Insurance, License) are expired',
            severity: 'medium',
        },
        {
            id: '4',
            type: 'pending_verification',
            title: 'Vehicles Pending Verification',
            description: '4 vehicles are pending verification',
            severity: 'medium',
        },
        {
            id: '5',
            type: 'payment_pending',
            title: 'Payment Settlement Pending',
            description: '12 payment settlements are pending',
            severity: 'low',
        },
    ];
}

/**
 * Get Admin Dashboard Metrics
 * Tries to fetch from API, falls back to dummy data
 */
export async function getAdminDashboardMetrics(): Promise<DashboardMetrics> {
    try {
        const today = getTodayYYYYMMDD();
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);

        const [
            tripsToday,
            tripsThisWeek,
            tripsThisMonth,
            activeTrips,
            completedTrips,
            cancelledTrips,
            driversRes,
            todayTripsRes,
        ] = await Promise.all([
            getTripCount({ dateFrom: today, dateTo: today }),
            getTripCount({ dateFrom: weekAgo.toISOString().split('T')[0], dateTo: today }),
            getTripCount({ dateFrom: monthAgo.toISOString().split('T')[0], dateTo: today }),
            getTripCount({ statuses: [...KPI_ACTIVE_TRIP_STATUSES] }),
            getTripCount({ status: 'COMPLETED' }),
            getTripCount({ statuses: [...KPI_CANCELED_TRIP_STATUSES] }),
            getDriversPaginated({ page: 1, limit: 1 }),
            getTripsPaginated({ page: 1, limit: 500, dateFrom: today, dateTo: today }),
        ]);

        const revenueToday = todayTripsRes.data.reduce(
            (sum, t) => sum + (t.finalAmount ?? t.totalAmount ?? 0),
            0
        );

        // Calculate cancellation rate
        const totalTrips = tripsToday;
        const cancellationRate = totalTrips > 0 ? (cancelledTrips / totalTrips) * 100 : 0;

        // Get active/inactive drivers
        const totalDrivers = driversRes.pagination.total;
        const activeDrivers = Math.floor(totalDrivers * 0.85); // Estimate
        const inactiveDrivers = totalDrivers - activeDrivers;

        return {
            tripsToday,
            tripsThisWeek,
            tripsThisMonth,
            totalRevenue: revenueToday * 30, // Estimate
            revenueToday,
            revenueThisWeek: revenueToday * 7, // Estimate
            revenueThisMonth: revenueToday * 30, // Estimate
            activeDrivers,
            inactiveDrivers,
            driversOnDuty: Math.floor(activeDrivers * 0.75), // Estimate
            activeFranchises: 8, // Would need franchise API
            totalBranches: 12, // Would need franchise API
            totalCustomers: 1250, // Would need customer API
            ongoingTrips: activeTrips,
            completedTrips,
            cancelledTrips,
            cancellationRate: parseFloat(cancellationRate.toFixed(2)),
            complaintsCount: 28, // Would need complaint API
            complaintsPending: 8,
            complaintsResolved: 20,
            penaltiesIssued: 15, // Would need penalty API
            penaltiesToday: 2,
            pendingTripAssignments: 5, // Would need trip API
            pendingDriverRegistrations: 3,
            pendingFranchiseRequests: 1,
            vehiclesPendingVerification: 4,
            expiredDocuments: 7,
            paymentSettlementPending: 12,
        };
    } catch (error) {
        console.warn('Failed to fetch dashboard metrics, using dummy data:', error);
        return generateDummyMetrics();
    }
}

/**
 * Get Admin Dashboard Analytics
 */
export async function getAdminDashboardAnalytics(): Promise<DashboardAnalytics> {
    try {
        // Try to fetch real data, but for now return dummy
        // In the future, these would be separate API endpoints
        return generateDummyAnalytics();
    } catch (error) {
        console.warn('Failed to fetch analytics, using dummy data:', error);
        return generateDummyAnalytics();
    }
}

/**
 * Get Admin Dashboard Alerts
 */
export async function getAdminDashboardAlerts(): Promise<AlertItem[]> {
    try {
        // Try to fetch real alerts from API
        // For now, return dummy data
        return generateDummyAlerts();
    } catch (error) {
        console.warn('Failed to fetch alerts, using dummy data:', error);
        return generateDummyAlerts();
    }
}

/**
 * Get Manager Dashboard Data
 */
export async function getManagerDashboardData(franchiseId?: string): Promise<ManagerDashboardData> {
    try {
        const today = getTodayYYYYMMDD();
        const [tripsToday, todayTripsRes, driversRes, unassignedTrips] = await Promise.all([
            getTripCount({ dateFrom: today, dateTo: today, franchiseId }),
            getTripsPaginated({ page: 1, limit: 500, dateFrom: today, dateTo: today, franchiseId }),
            getDriversPaginated({ page: 1, limit: 1, franchiseId }),
            getTripsPaginated({ page: 1, limit: 100, status: 'NOT_ASSIGNED', franchiseId }),
        ]);

        const revenueToday = todayTripsRes.data.reduce(
            (sum, t) => sum + (t.finalAmount ?? t.totalAmount ?? 0),
            0
        );

        const ongoingTrips = todayTripsRes.data.filter((t) =>
            KPI_ACTIVE_TRIP_STATUSES.includes(t.status as any)
        );
        const tripsWaitingForDriver = unassignedTrips.data;
        const highValueTrips = todayTripsRes.data
            .filter((t) => (t.finalAmount ?? t.totalAmount ?? 0) > 5000)
            .slice(0, 10);

        return {
            metrics: {
                tripsToday,
                revenueToday,
                activeDriversOnDuty: Math.floor(driversRes.pagination.total * 0.75),
                pendingTripAssignments: unassignedTrips.pagination.total,
                complaintsAssigned: 5, // Would need complaint API
            },
            ongoingTrips: ongoingTrips.slice(0, 10),
            tripsWaitingForDriver: tripsWaitingForDriver.slice(0, 10),
            delayedTrips: [], // Would need to calculate based on scheduled time
            highValueTrips,
            driverPerformance: {
                attendance: 92,
                avgRating: 4.6,
                tripsPerDriver: 12,
                penaltiesToday: 1,
                idleDrivers: 3,
            },
            branchInsights: {
                revenueByArea: [
                    { area: 'Andheri', revenue: 125000 },
                    { area: 'Bandra', revenue: 98000 },
                    { area: 'Hinjewadi', revenue: 87000 },
                ],
                cancellationReasons: [
                    { reason: 'Customer Cancelled', count: 15 },
                    { reason: 'Driver Unavailable', count: 8 },
                    { reason: 'Vehicle Issue', count: 5 },
                ],
            },
            alerts: generateDummyAlerts().slice(0, 3),
        };
    } catch (error) {
        console.warn('Failed to fetch manager dashboard data, using dummy data:', error);
        return {
            metrics: {
                tripsToday: 25,
                revenueToday: 45000,
                activeDriversOnDuty: 18,
                pendingTripAssignments: 3,
                complaintsAssigned: 2,
            },
            ongoingTrips: [],
            tripsWaitingForDriver: [],
            delayedTrips: [],
            highValueTrips: [],
            driverPerformance: {
                attendance: 90,
                avgRating: 4.5,
                tripsPerDriver: 10,
                penaltiesToday: 0,
                idleDrivers: 2,
            },
            branchInsights: {
                revenueByArea: [],
                cancellationReasons: [],
            },
            alerts: [],
        };
    }
}

/**
 * Get Staff Dashboard Data
 */
export async function getStaffDashboardData(): Promise<StaffDashboardData> {
    try {
        // Try to fetch real data
        // For now, return dummy data
        return {
            tasks: {
                assigned: 15,
                openComplaints: 8,
                escalatedIssues: 3,
                followUpsPending: 5,
            },
            tripSupport: {
                manualIntervention: 4,
                driverNotReachable: 2,
                customerHelpRequests: 6,
                tripModificationRequests: 3,
            },
            customerSupport: {
                newComplaints: 5,
                inProgressComplaints: 8,
                resolvedToday: 12,
                slaBreachWarnings: 2,
            },
            driverSupport: {
                onboardingPending: 3,
                documentVerificationPending: 4,
                queries: 7,
            },
            productivity: {
                tasksCompletedToday: 18,
                avgResolutionTime: 2.5,
                pendingBacklog: 12,
            },
        };
    } catch (error) {
        console.warn('Failed to fetch staff dashboard data, using dummy data:', error);
        return {
            tasks: {
                assigned: 10,
                openComplaints: 5,
                escalatedIssues: 2,
                followUpsPending: 3,
            },
            tripSupport: {
                manualIntervention: 2,
                driverNotReachable: 1,
                customerHelpRequests: 4,
                tripModificationRequests: 2,
            },
            customerSupport: {
                newComplaints: 3,
                inProgressComplaints: 5,
                resolvedToday: 8,
                slaBreachWarnings: 1,
            },
            driverSupport: {
                onboardingPending: 2,
                documentVerificationPending: 3,
                queries: 5,
            },
            productivity: {
                tasksCompletedToday: 12,
                avgResolutionTime: 3.0,
                pendingBacklog: 8,
            },
        };
    }
}

/**
 * Get Driver Dashboard Data
 */
export async function getDriverDashboardData(driverId: string): Promise<DriverDashboardData> {
    try {
        // Try to fetch real data
        // For now, return dummy data
        return {
            tripInfo: {
                currentTrip: null,
                upcomingTrips: [],
                completedToday: 8,
                cancelledToday: 0,
            },
            earnings: {
                today: 2500,
                weekly: 17500,
                pendingSettlements: 5000,
                incentives: 500,
            },
            attendance: {
                isOnline: true,
                loginTime: new Date().toISOString(),
                hoursWorkedToday: 6.5,
            },
            performance: {
                rating: 4.8,
                totalTripsCompleted: 142,
                complaints: 0,
                penalties: 0,
            },
            compliance: {
                documentExpiryAlerts: 0,
                vehicleVerificationStatus: 'Verified',
                appUpdates: [],
            },
        };
    } catch (error) {
        console.warn('Failed to fetch driver dashboard data, using dummy data:', error);
        return {
            tripInfo: {
                currentTrip: null,
                upcomingTrips: [],
                completedToday: 6,
                cancelledToday: 0,
            },
            earnings: {
                today: 2000,
                weekly: 14000,
                pendingSettlements: 3000,
                incentives: 300,
            },
            attendance: {
                isOnline: false,
                loginTime: null,
                hoursWorkedToday: 0,
            },
            performance: {
                rating: 4.5,
                totalTripsCompleted: 120,
                complaints: 1,
                penalties: 0,
            },
            compliance: {
                documentExpiryAlerts: 1,
                vehicleVerificationStatus: 'Pending',
                appUpdates: ['New version available'],
            },
        };
    }
}
