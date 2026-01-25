"use client";

import React, { useState, useEffect } from 'react';
import {
    CalendarOff,
    Plus,
    Search,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    User,
    Truck,
    Building,
    Edit,
} from 'lucide-react';
import { useAppSelector } from '@/lib/hooks';
import { USER_ROLES } from '@/lib/constants/roles';
import { cn } from '@/lib/utils';

interface LeaveRequest {
    id: string;
    driverId: string | null;
    staffId: string | null;
    driverName?: string;
    staffName?: string;
    startDate: string;
    endDate: string;
    reason: string;
    leaveType: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
    requestedBy: string | null;
    approvedBy: string | null;
    approvedAt: string | null;
    rejectionReason: string | null;
    createdAt: string;
    requesterRole?: string;
}

// Dummy data generator
function generateDummyLeaves(): LeaveRequest[] {
    return [
        {
            id: '1',
            driverId: null,
            staffId: 'staff-1',
            staffName: 'John Doe',
            startDate: '2026-01-28',
            endDate: '2026-01-30',
            reason: 'Family emergency - need to attend wedding',
            leaveType: 'CASUAL_LEAVE',
            status: 'PENDING',
            requestedBy: 'staff-1',
            approvedBy: null,
            approvedAt: null,
            rejectionReason: null,
            createdAt: '2026-01-25T10:00:00Z',
            requesterRole: 'staff',
        },
        {
            id: '2',
            driverId: 'driver-1',
            staffId: null,
            driverName: 'Rajesh Kumar',
            startDate: '2026-02-01',
            endDate: '2026-02-03',
            reason: 'Medical checkup',
            leaveType: 'SICK_LEAVE',
            status: 'APPROVED',
            requestedBy: 'driver-1',
            approvedBy: 'manager-1',
            approvedAt: '2026-01-25T14:00:00Z',
            rejectionReason: null,
            createdAt: '2026-01-25T11:00:00Z',
            requesterRole: 'driver',
        },
        {
            id: '3',
            driverId: null,
            staffId: 'manager-1',
            staffName: 'Sarah Manager',
            startDate: '2026-02-05',
            endDate: '2026-02-07',
            reason: 'Personal work',
            leaveType: 'CASUAL_LEAVE',
            status: 'PENDING',
            requestedBy: 'manager-1',
            approvedBy: null,
            approvedAt: null,
            rejectionReason: null,
            createdAt: '2026-01-25T12:00:00Z',
            requesterRole: 'manager',
        },
        {
            id: '4',
            driverId: 'driver-2',
            staffId: null,
            driverName: 'Amit Singh',
            startDate: '2026-01-26',
            endDate: '2026-01-27',
            reason: 'Not feeling well',
            leaveType: 'SICK_LEAVE',
            status: 'REJECTED',
            requestedBy: 'driver-2',
            approvedBy: 'manager-1',
            approvedAt: '2026-01-25T15:00:00Z',
            rejectionReason: 'Insufficient medical documentation provided',
            createdAt: '2026-01-25T09:00:00Z',
            requesterRole: 'driver',
        },
    ];
}

function StatusBadge({ status }: { status: LeaveRequest['status'] }) {
    const styles = {
        PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        CANCELLED: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    };

    const icons = {
        PENDING: Clock,
        APPROVED: CheckCircle,
        REJECTED: XCircle,
        CANCELLED: AlertCircle,
    };

    const Icon = icons[status];

    return (
        <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold', styles[status])}>
            <Icon size={12} />
            {status}
        </span>
    );
}

export function LeaveManagement() {
    const { user } = useAppSelector((state) => state.auth);
    const userRole = user?.role || USER_ROLES.STAFF;
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [showActionModal, setShowActionModal] = useState<LeaveRequest | null>(null);

    // Check if user can approve leaves
    const canApprove = userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.MANAGER;
    // Check if user can approve manager leaves (only admin)
    const canApproveManagerLeaves = userRole === USER_ROLES.ADMIN;

    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
            setLeaves(generateDummyLeaves());
            setLoading(false);
        }, 500);
    }, []);

    const filteredLeaves = leaves.filter((leave) => {
        const matchesSearch =
            leave.reason.toLowerCase().includes(search.toLowerCase()) ||
            leave.driverName?.toLowerCase().includes(search.toLowerCase()) ||
            leave.staffName?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || leave.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleApplyLeave = (formData: {
        startDate: string;
        endDate: string;
        reason: string;
        leaveType: string;
    }) => {
        const newLeave: LeaveRequest = {
            id: Date.now().toString(),
            driverId: userRole === USER_ROLES.DRIVER ? user?._id || '' : null,
            staffId: userRole !== USER_ROLES.DRIVER ? user?._id || '' : null,
            staffName: userRole !== USER_ROLES.DRIVER ? user?.name : undefined,
            driverName: userRole === USER_ROLES.DRIVER ? user?.name : undefined,
            startDate: formData.startDate,
            endDate: formData.endDate,
            reason: formData.reason,
            leaveType: formData.leaveType,
            status: 'PENDING',
            requestedBy: user?._id || null,
            approvedBy: null,
            approvedAt: null,
            rejectionReason: null,
            createdAt: new Date().toISOString(),
            requesterRole: userRole,
        };
        setLeaves([newLeave, ...leaves]);
        
        setShowApplyModal(false);
    };

    const handleApproveReject = (leaveId: string, action: 'APPROVED' | 'REJECTED', rejectionReason?: string) => {
        setLeaves(
            leaves.map((leave) =>
                leave.id === leaveId
                    ? {
                          ...leave,
                          status: action,
                          approvedBy: user?._id || null,
                          approvedAt: new Date().toISOString(),
                          rejectionReason: action === 'REJECTED' ? rejectionReason || null : null,
                      }
                    : leave
            )
        );
        setShowActionModal(null);
    };

    const canTakeAction = (leave: LeaveRequest): boolean => {
        if (leave.status !== 'PENDING') return false;
        if (!canApprove) return false;
        // If it's a manager leave, only admin can approve
        if (leave.requesterRole === 'manager' && !canApproveManagerLeaves) return false;
        return true;
    };

    return (
        <div className="animate-in fade-in duration-500 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white">Leave Management</h2>
                    <p className="text-[#49659c] dark:text-gray-400">Apply for leave and manage leave requests</p>
                </div>
                <button
                    onClick={() => setShowApplyModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0d59f2] text-white rounded-lg font-semibold hover:bg-[#0d59f2]/90 transition-all shadow-lg shadow-blue-500/20"
                >
                    <Plus size={18} />
                    Apply Leave
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#49659c] size-4" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by reason, name..."
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm dark:text-white outline-none focus:ring-2 focus:ring-[#0d59f2]/20"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm dark:text-white"
                >
                    <option value="all">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="CANCELLED">Cancelled</option>
                </select>
            </div>

            {/* Leave List */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-8 h-8 border-4 border-[#0d59f2] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filteredLeaves.length === 0 ? (
                    <div className="py-16 text-center text-[#49659c] dark:text-gray-400">No leave requests found</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                                <tr>
                                    <th className="text-left px-6 py-3 font-semibold text-sm text-[#0d121c] dark:text-white">Requester</th>
                                    <th className="text-left px-6 py-3 font-semibold text-sm text-[#0d121c] dark:text-white">Date Range</th>
                                    <th className="text-left px-6 py-3 font-semibold text-sm text-[#0d121c] dark:text-white">Reason</th>
                                    <th className="text-left px-6 py-3 font-semibold text-sm text-[#0d121c] dark:text-white">Type</th>
                                    <th className="text-left px-6 py-3 font-semibold text-sm text-[#0d121c] dark:text-white">Status</th>
                                    <th className="text-left px-6 py-3 font-semibold text-sm text-[#0d121c] dark:text-white">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLeaves.map((leave) => (
                                    <tr
                                        key={leave.id}
                                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {leave.driverId ? (
                                                    <Truck size={16} className="text-[#49659c]" />
                                                ) : (
                                                    <User size={16} className="text-[#49659c]" />
                                                )}
                                                <div>
                                                    <p className="font-medium text-sm text-[#0d121c] dark:text-white">
                                                        {leave.driverName || leave.staffName || 'Unknown'}
                                                    </p>
                                                    <p className="text-xs text-[#49659c] dark:text-gray-400 capitalize">
                                                        {leave.requesterRole || 'staff'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-[#49659c] dark:text-gray-400">
                                            {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-[#0d121c] dark:text-white max-w-xs truncate">{leave.reason}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-[#49659c] dark:text-gray-400">
                                            {leave.leaveType.replace('_', ' ')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={leave.status} />
                                            {leave.rejectionReason && (
                                                <p className="text-xs text-red-600 dark:text-red-400 mt-1 max-w-xs">
                                                    {leave.rejectionReason}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {canTakeAction(leave) && (
                                                <button
                                                    onClick={() => setShowActionModal(leave)}
                                                    className="flex items-center gap-1 text-sm text-[#0d59f2] hover:underline font-medium"
                                                >
                                                    <Edit size={14} />
                                                    Review
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Apply Leave Modal */}
            {showApplyModal && (
                <ApplyLeaveModal
                    onClose={() => setShowApplyModal(false)}
                    onSubmit={handleApplyLeave}
                    userRole={userRole}
                />
            )}

            {/* Approve/Reject Modal */}
            {showActionModal && (
                <ReviewLeaveModal
                    leave={showActionModal}
                    onClose={() => setShowActionModal(null)}
                    onApprove={(rejectionReason) => handleApproveReject(showActionModal.id, 'APPROVED')}
                    onReject={(rejectionReason) => handleApproveReject(showActionModal.id, 'REJECTED', rejectionReason)}
                    canApprove={canApproveManagerLeaves || showActionModal.requesterRole !== 'manager'}
                />
            )}
        </div>
    );
}

function ApplyLeaveModal({
    onClose,
    onSubmit,
    userRole,
}: {
    onClose: () => void;
    onSubmit: (data: { startDate: string; endDate: string; reason: string; leaveType: string }) => void;
    userRole: string;
}) {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');
    const [leaveType, setLeaveType] = useState('CASUAL_LEAVE');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!startDate || !endDate || !reason.trim()) {
            alert('Please fill all required fields');
            return;
        }
        if (new Date(endDate) < new Date(startDate)) {
            alert('End date must be after start date');
            return;
        }
        onSubmit({ startDate, endDate, reason: reason.trim(), leaveType });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-[#0d121c] dark:text-white">Apply for Leave</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                        <XCircle size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-[#0d121c] dark:text-white mb-2">Start Date *</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            required
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-[#0d121c] dark:text-white mb-2">End Date *</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            required
                            min={startDate || new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-[#0d121c] dark:text-white mb-2">Leave Type *</label>
                        <select
                            value={leaveType}
                            onChange={(e) => setLeaveType(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white"
                        >
                            <option value="CASUAL_LEAVE">Casual Leave</option>
                            <option value="SICK_LEAVE">Sick Leave</option>
                            <option value="EARNED_LEAVE">Earned Leave</option>
                            <option value="EMERGENCY_LEAVE">Emergency Leave</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-[#0d121c] dark:text-white mb-2">Reason *</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                            rows={4}
                            placeholder="Please provide a reason for your leave request..."
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white resize-none"
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 font-medium text-[#0d121c] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 rounded-lg bg-[#0d59f2] text-white font-semibold hover:bg-[#0d59f2]/90"
                        >
                            Submit Request
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function ReviewLeaveModal({
    leave,
    onClose,
    onApprove,
    onReject,
    canApprove,
}: {
    leave: LeaveRequest;
    onClose: () => void;
    onApprove: () => void;
    onReject: (reason: string) => void;
    canApprove: boolean;
}) {
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectForm, setShowRejectForm] = useState(false);

    const handleReject = () => {
        if (!rejectionReason.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }
        onReject(rejectionReason.trim());
    };

    if (!canApprove) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-[#0d121c] dark:text-white">Permission Denied</h3>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                            <XCircle size={20} />
                        </button>
                    </div>
                    <p className="text-sm text-[#49659c] dark:text-gray-400 mb-4">
                        Only Admin can approve Manager leave requests.
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 rounded-lg bg-[#0d59f2] text-white font-semibold hover:bg-[#0d59f2]/90"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-[#0d121c] dark:text-white">Review Leave Request</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                        <XCircle size={20} />
                    </button>
                </div>

                <div className="space-y-4 mb-6">
                    <div>
                        <p className="text-xs font-semibold text-[#49659c] dark:text-gray-400 uppercase tracking-wider mb-1">Requester</p>
                        <p className="font-medium text-[#0d121c] dark:text-white">{leave.driverName || leave.staffName}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-[#49659c] dark:text-gray-400 uppercase tracking-wider mb-1">Date Range</p>
                        <p className="text-[#0d121c] dark:text-white">
                            {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-[#49659c] dark:text-gray-400 uppercase tracking-wider mb-1">Reason</p>
                        <p className="text-[#0d121c] dark:text-white">{leave.reason}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-[#49659c] dark:text-gray-400 uppercase tracking-wider mb-1">Leave Type</p>
                        <p className="text-[#0d121c] dark:text-white">{leave.leaveType.replace('_', ' ')}</p>
                    </div>
                </div>

                {!showRejectForm ? (
                    <div className="flex gap-3">
                        <button
                            onClick={onApprove}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700"
                        >
                            <CheckCircle size={18} />
                            Approve
                        </button>
                        <button
                            onClick={() => setShowRejectForm(true)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700"
                        >
                            <XCircle size={18} />
                            Reject
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-[#0d121c] dark:text-white mb-2">
                                Rejection Reason *
                            </label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                required
                                rows={3}
                                placeholder="Please provide a reason for rejecting this leave request..."
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-[#0d121c] dark:text-white resize-none"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowRejectForm(false)}
                                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 font-medium text-[#0d121c] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700"
                            >
                                <XCircle size={18} />
                                Confirm Reject
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
