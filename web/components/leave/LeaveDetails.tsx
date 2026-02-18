'use client';

import React, { useState, useEffect } from 'react';
import { leaveService } from '@/services/leaveService';
import Button from '@/components/ui/Button';

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

interface LeaveDetailsProps {
  leaveId: string;
}

const formatDate = (dateString: Date | string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const LeaveDetails: React.FC<LeaveDetailsProps> = ({ leaveId }) => {
  const [leaveRequest, setLeaveRequest] = useState<LeaveRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaveRequest();
  }, [leaveId]);

  const fetchLeaveRequest = async () => {
    try {
      setLoading(true);
      const response = await leaveService.getLeaveRequestById(leaveId);
      setLeaveRequest(response.data.data);
    } catch (err) {
      setError('Failed to load leave request details');
      console.error('Error fetching leave request:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      await leaveService.updateLeaveRequestStatus(leaveId, { status: 'APPROVED' });
      fetchLeaveRequest(); // Refresh the details
    } catch (err) {
      console.error('Error approving leave request:', err);
    }
  };

  const handleReject = async () => {
    try {
      await leaveService.updateLeaveRequestStatus(leaveId, { status: 'REJECTED', rejectionReason: 'Not approved' });
      fetchLeaveRequest(); // Refresh the details
    } catch (err) {
      console.error('Error rejecting leave request:', err);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!leaveRequest) return <div className="p-6">Leave request not found</div>;

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const requesterName = leaveRequest.Driver 
    ? `${leaveRequest.Driver.firstName} ${leaveRequest.Driver.lastName} (${leaveRequest.Driver.driverCode})`
    : leaveRequest.Staff 
    ? leaveRequest.Staff.name
    : leaveRequest.User 
    ? leaveRequest.User.fullName
    : 'Unknown';

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-3xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-xl font-bold">Leave Request Details</h2>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(leaveRequest.status)}`}>
          {leaveRequest.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Request Information</h3>
          <div className="space-y-2">
            <p><span className="font-medium">Employee:</span> {requesterName}</p>
            <p><span className="font-medium">Leave Type:</span> {leaveRequest.leaveType}</p>
            <p><span className="font-medium">Dates:</span> {formatDate(leaveRequest.startDate)} - {formatDate(leaveRequest.endDate)}</p>
            <p><span className="font-medium">Status:</span> {leaveRequest.status}</p>
            <p><span className="font-medium">Requested On:</span> {formatDate(leaveRequest.createdAt)}</p>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Approval Information</h3>
          <div className="space-y-2">
            <p><span className="font-medium">Approved By:</span> {leaveRequest.approvedBy || 'Not approved yet'}</p>
            <p><span className="font-medium">Approved On:</span> {leaveRequest.approvedAt ? formatDate(leaveRequest.approvedAt) : 'Not approved yet'}</p>
            {leaveRequest.rejectionReason && (
              <p><span className="font-medium">Rejection Reason:</span> {leaveRequest.rejectionReason}</p>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold mb-2">Reason</h3>
        <p>{leaveRequest.reason}</p>
      </div>

      {leaveRequest.status === 'PENDING' && (
        <div className="flex space-x-4 mt-6">
          <Button 
            onClick={handleApprove}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            Approve
          </Button>
          <Button 
            onClick={handleReject}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            Reject
          </Button>
        </div>
      )}
    </div>
  );
};

export default LeaveDetails;