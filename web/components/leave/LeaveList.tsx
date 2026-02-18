'use client';

import React, { useState, useEffect } from 'react';
import { leaveService } from '@/services/leaveService';

interface LeaveRequest {
  id: string;
  driverId: string | null;
  staffId: string | null;
  userId: string | null;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  requestedBy: string | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  Driver?: {
    firstName: string;
    lastName: string;
    driverCode: string;
  };
  Staff?: {
    name: string;
    email: string;
  };
  User?: {
    fullName: string;
    email: string;
  };
}

const formatDate = (dateString: Date | string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const LeaveList: React.FC = () => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchLeaveRequests();
  }, [statusFilter]);

  const fetchLeaveRequests = async () => {
    try {
      const params: any = {};
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      
      const response = await leaveService.getLeaveRequests(params);
      setLeaveRequests(response.data.data);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReject = async (id: string, status: 'APPROVED' | 'REJECTED', rejectionReason?: string) => {
    try {
      await leaveService.updateLeaveRequestStatus(id, { 
        status, 
        rejectionReason: status === 'REJECTED' ? rejectionReason : undefined 
      });
      fetchLeaveRequests(); // Refresh the list
    } catch (error) {
      console.error(`Error ${status.toLowerCase()} leave request:`, error);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Leave Requests</h2>
        <div>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>
      
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested On</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaveRequests.map((request) => (
                <tr key={request.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {request.Driver ? `${request.Driver.firstName} ${request.Driver.lastName} (${request.Driver.driverCode})` :
                     request.Staff ? request.Staff.name :
                     request.User ? request.User.fullName : 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{request.leaveType}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatDate(request.startDate)} - {formatDate(request.endDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{request.reason}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatDate(request.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      {request.status === 'PENDING' && (
                        <>
                          <button 
                            onClick={() => handleApproveReject(request.id, 'APPROVED')}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleApproveReject(request.id, 'REJECTED', 'Not approved')}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
                        View Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LeaveList;