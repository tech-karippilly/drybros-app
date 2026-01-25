/**
 * Dashboard Metrics Constants
 * Centralized labels and configuration for dashboard metrics
 */

export const DASHBOARD_METRICS_LABELS = {
    // Trip Metrics
    TRIPS_TODAY: "Today's Trips",
    TRIPS_WEEK: 'Trips This Week',
    TRIPS_MONTH: 'Trips This Month',
    TOTAL_REVENUE: 'Total Revenue',
    REVENUE_TODAY: "Today's Revenue",
    REVENUE_WEEK: 'Revenue This Week',
    REVENUE_MONTH: 'Revenue This Month',
    
    // Driver Metrics
    ACTIVE_DRIVERS: 'Active Drivers',
    INACTIVE_DRIVERS: 'Inactive Drivers',
    DRIVERS_ON_DUTY: 'Drivers On Duty',
    
    // Franchise Metrics
    ACTIVE_FRANCHISES: 'Active Franchises',
    TOTAL_BRANCHES: 'Total Branches',
    
    // Customer Metrics
    TOTAL_CUSTOMERS: 'Total Customers',
    
    // Trip Status
    ONGOING_TRIPS: 'Ongoing Trips',
    COMPLETED_TRIPS: 'Completed Trips',
    CANCELLED_TRIPS: 'Cancelled Trips',
    CANCELLATION_RATE: 'Cancellation Rate',
    
    // Complaints
    COMPLAINTS_COUNT: 'Total Complaints',
    COMPLAINTS_PENDING: 'Pending Complaints',
    COMPLAINTS_RESOLVED: 'Resolved Complaints',
    
    // Penalties
    PENALTIES_ISSUED: 'Penalties Issued',
    PENALTIES_TODAY: 'Penalties Today',
    
    // Pending Items
    PENDING_TRIP_ASSIGNMENTS: 'Pending Trip Assignments',
    PENDING_DRIVER_REGISTRATIONS: 'Pending Driver Registrations',
    PENDING_FRANCHISE_REQUESTS: 'Pending Franchise Requests',
    VEHICLES_PENDING_VERIFICATION: 'Vehicles Pending Verification',
    EXPIRED_DOCUMENTS: 'Expired Documents',
    PAYMENT_SETTLEMENT_PENDING: 'Payment Settlement Pending',
} as const;

export const ALERT_TYPES = {
    LOW_RATING: 'low_rating',
    HIGH_COMPLAINT: 'high_complaint',
    EXPIRED_DOCUMENT: 'expired_document',
    PENDING_VERIFICATION: 'pending_verification',
    PAYMENT_PENDING: 'payment_pending',
} as const;

export const ALERT_SEVERITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
} as const;

export const ALERT_SEVERITY_COLORS = {
    [ALERT_SEVERITY.LOW]: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    [ALERT_SEVERITY.MEDIUM]: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
    [ALERT_SEVERITY.HIGH]: 'text-red-600 bg-red-50 dark:bg-red-900/20',
} as const;

export const TRIP_TYPE_LABELS = {
    LOCAL: 'Local',
    OUTSTATION: 'Outstation',
    RENTAL: 'Rental',
} as const;

export const CHART_COLORS = {
    PRIMARY: '#0d59f2',
    SECONDARY: '#49659c',
    SUCCESS: '#07883b',
    WARNING: '#f59e0b',
    DANGER: '#e73908',
    GRADIENT_START: 'rgba(13, 89, 242, 0.1)',
    GRADIENT_END: 'rgba(13, 89, 242, 0)',
} as const;
