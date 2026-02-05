export const API_ENDPOINTS ={
    AUTH:{
        REFRESH_TOKEN:'/auth/refresh-token',
        LOGIN:'/drivers/login',
        LOGOUT:'/auth/logout',

    },
    ATTENDANCE:{
        LIST:'/attendance',
        CLOCK_IN:'/attendance/clock-in',
        CLOCK_OUT:'/attendance/clock-out',
        LEAVE_REQUEST:'/leave-requests',

    },
    LEAVE: {
        REQUESTS: '/leave-requests',
    },
    DRIVER:{
        DRIVER_DETAILS:'/drivers/:id',
        DAILY_STATS:'/drivers/:id/daily-stats',
        MONTHLY_STATS:'/drivers/:id/monthly-stats',
        SETTLEMENT:'/drivers/:id/settlement',
        ME_LOCATION: '/drivers/me/location',
        ME_PROFILE: '/drivers/me/profile',
    },
    DRIVER_TRANSACTIONS: {
        LIST: '/driver-transactions',
        ME: '/driver-transactions/me',
        ME_SUMMARY: '/driver-transactions/me/summary',
        DRIVER_SUMMARY: '/driver-transactions/driver/:driverId/summary',
    },
    TRIPS: {
        MY_ASSIGNED: '/trips/my-assigned',
        MY: '/trips/my',
        DETAILS: '/trips/:id',
        START_INITIATE: '/trips/:id/start-initiate',
        START_VERIFY: '/trips/:id/start-verify',
        END_INITIATE: '/trips/:id/end-initiate',
        END_VERIFY: '/trips/:id/end-verify',
        COLLECT_PAYMENT: '/trips/:id/collect-payment',
        VERIFY_PAYMENT: '/trips/:id/verify-payment',
        LIVE_LOCATION: '/trips/:id/live-location',
    },
    TRIP_OFFERS: {
        MY_PENDING: '/trip-offers/my-pending',
        ACCEPT: '/trip-offers/:id/accept',
        REJECT: '/trip-offers/:id/reject',
    },
}as const;
