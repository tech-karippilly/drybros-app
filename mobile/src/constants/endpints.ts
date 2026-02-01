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
        ME_LOCATION: '/drivers/me/location',
    },
    TRIPS: {
        MY_ASSIGNED: '/trips/my-assigned',
        DETAILS: '/trips/:id',
    },
    TRIP_OFFERS: {
        MY_PENDING: '/trip-offers/my-pending',
        ACCEPT: '/trip-offers/:id/accept',
    },
}as const;
