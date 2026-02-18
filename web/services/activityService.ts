import api from '@/lib/axios';

export const activityService = {
  // List & search
  getActivities: (params?: any) => api.get('/activities', { params }),
  
  // Activity details
  getActivityById: (id: string) => api.get(`/activities/${id}`),
  
  // Get activities by entity
  getDriverActivities: (driverId: string, params?: any) => 
    api.get(`/activities/driver/${driverId}`, { params }),
  getStaffActivities: (staffId: string, params?: any) => 
    api.get(`/activities/staff/${staffId}`, { params }),
  getTripActivities: (tripId: string, params?: any) => 
    api.get(`/activities/trip/${tripId}`, { params }),
};
