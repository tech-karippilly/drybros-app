'use client';

import React, { useState } from 'react';
import { leaveService } from '@/services/leaveService';
import Input from '@/components/ui/Input';
import TextArea from '@/components/ui/TextArea';
import Button from '@/components/ui/Button';
import DatePicker from '@/components/ui/DatePicker';

interface LeaveFormData {
  startDate: string;
  endDate: string;
  reason: string;
  leaveType: string;
}

const LeaveApplicationForm: React.FC = () => {
  const [formData, setFormData] = useState<LeaveFormData>({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
    leaveType: 'SICK_LEAVE',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      // Prepare the request data
      const requestData = {
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason,
        leaveType: formData.leaveType,
      };
      
      const response = await leaveService.createLeaveRequest(requestData);
      setMessage('Leave request submitted successfully!');
      setFormData({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        reason: '',
        leaveType: 'SICK_LEAVE',
      });
    } catch (error) {
      console.error('Error submitting leave request:', error);
      setMessage('Failed to submit leave request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof LeaveFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-6">Apply for Leave</h2>
      
      {message && (
        <div className={`mb-4 p-3 rounded ${
          message.includes('successfully') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
            <select
              value={formData.leaveType}
              onChange={(e) => handleChange('leaveType', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            >
              <option value="SICK_LEAVE">Sick Leave</option>
              <option value="CASUAL_LEAVE">Casual Leave</option>
              <option value="EARNED_LEAVE">Earned Leave</option>
              <option value="EMERGENCY_LEAVE">Emergency Leave</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <DatePicker
              value={formData.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <DatePicker
              value={formData.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              className="w-full"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
          <TextArea
            value={formData.reason}
            onChange={(e) => handleChange('reason', e.target.value)}
            placeholder="Enter reason for leave..."
            rows={4}
            required
          />
        </div>
        
        <div className="pt-4">
          <Button 
            type="submit" 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? 'Submitting...' : 'Submit Leave Request'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LeaveApplicationForm;