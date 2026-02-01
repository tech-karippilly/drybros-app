export const API_ENDPOINTS ={
    AUTH:{
        REFRESH_TOKEN:'/auth/refresh-token',
        LOGIN:'/drivers/login',

    },
    ATTENDANCE:{
        CLOCK_IN:'/attendance/clock-in',
        CLOCK_OUT:'/attendance/clock-out',
        LEAVE_REQUEST:'/leave-requests',

    },
    DRIVER:{
        DRIVER_DETAILS:'/drivers/:id'
    }
}as const;