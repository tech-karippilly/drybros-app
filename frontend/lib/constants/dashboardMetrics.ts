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
    TOTAL_DRIVERS: 'Total Drivers',
    DRIVERS_ON_LEAVE: 'Drivers On Leave',
    
    // Staff Metrics
    TOTAL_STAFF: 'Total Staff',
    STAFF_ON_LEAVE: 'Staff On Leave',
    
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

/** Admin Executive Dashboard – UI strings and labels */
export const ADMIN_DASHBOARD_STRINGS = {
    PAGE_TITLE: 'Executive Dashboard',
    PAGE_SUBTITLE: 'Real-time performance metrics across all global branches.',
    FILTER_LAST_30_DAYS: 'Last 30 Days',
    BTN_NEW_FRANCHISE: 'New Franchise',
    STAT_TOTAL_FRANCHISES: 'Total Franchises',
    STAT_ACTIVE_TRIPS: 'Active Trips',
    STAT_DAILY_REVENUE: 'Daily Revenue',
    STAT_ACTIVE_DRIVERS: 'Active Drivers',
    TREND_UP: '+2%',
    TREND_FLAT: 'Flat',
    CHART_TITLE: 'Global Revenue Analytics',
    CHART_SUBTITLE: 'Consolidated monthly gross merchant value',
    CHART_VS_LAST_MONTH: '+12.5% vs last month',
    TABLE_TOP_FRANCHISES: 'Top Performing Franchises',
    TABLE_VIEW_ALL: 'View All',
    TABLE_HEAD_FRANCHISE: 'Franchise',
    TABLE_HEAD_ACTIVE_TRIPS: 'Active Trips',
    TABLE_HEAD_REVENUE: 'Revenue',
    TABLE_HEAD_CSAT: 'CSAT',
    TABLE_HEAD_STATUS: 'Status',
    STATUS_EXCELLENT: 'Excellent',
    STATUS_HIGH: 'High',
    STATUS_STEADY: 'Steady',
    SYSTEM_MONITOR_TITLE: 'System Monitor',
    SYSTEM_CORE_API: 'Core API Latency',
    SYSTEM_SERVER_LOAD: 'Server Load',
    SYSTEM_MEMORY: 'Memory Usage',
    SYSTEM_AWS_UPTIME: '99.98% Uptime',
    CRITICAL_EVENTS_TITLE: 'Critical Events',
    LOADING_MESSAGE: 'Loading dashboard metrics...',
} as const;

/** Manager Franchise Dashboard – UI strings and labels */
export const MANAGER_DASHBOARD_STRINGS = {
    PAGE_TITLE: 'Manager Dashboard',
    BRANCH_OVERVIEW_TITLE: 'Branch Overview',
    BRANCH_OVERVIEW_SUBTITLE: 'Real-time performance and driver logistics for North London.',
    CURRENT_TIME_LABEL: 'Current Time',
    ON_SHIFT_LABEL: 'On Shift',
    CLOCK_OUT: 'Clock Out',
    STAT_ACTIVE_STAFF: 'Active Staff',
    STAT_TODAYS_ATTENDANCE: "Today's Attendance",
    STAT_TODAYS_BOOKINGS: "Today's Bookings",
    STAT_PENDING_APPROVALS: 'Pending Approvals',
    STAFF_PRESENT: 'Staff Present',
    ACTION_REQUIRED: 'Action Required',
    CHART_WEEKLY_TITLE: 'Weekly Booking Performance',
    CHART_WEEKLY_SUBTITLE: 'Total volume aggregated per day',
    CHART_VS_PREV: '+12.5% vs Prev.',
    STAFF_AVAILABILITY_TITLE: 'Staff Availability',
    MANAGE_ROSTERS: 'Manage Rosters',
    PRESENT_STATUS: 'Present',
    ABSENT_STATUS: 'Absent',
    IN_AT: 'In at',
    NOT_CLOCKED_IN: 'Not Clocked In',
    LATE_ARRIVALS_TITLE: 'Late Arrivals',
    LATE_ARRIVALS_DESC: '3 staff members clocked in after 09:15 today.',
    FLEET_STATUS_TITLE: 'Active Fleet Status',
    FLEET_ON_DUTY: 'On Duty',
    FLEET_IN_TRIP: 'In Trip',
    FLEET_IDLE: 'Idle',
    TABLE_HEAD_DRIVER: 'Driver',
    TABLE_HEAD_VEHICLE: 'Vehicle',
    TABLE_HEAD_CURRENT_TASK: 'Current Task',
    TABLE_HEAD_STATUS: 'Status',
    TABLE_HEAD_ACTION: 'Action',
    STATUS_IN_TRIP: 'In Trip',
    STATUS_ON_DUTY: 'On Duty',
    SEARCH_PLACEHOLDER: 'Search bookings, drivers...',
    LOADING_MESSAGE: 'Loading manager dashboard...',
} as const;
