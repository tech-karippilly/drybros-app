"use client";

import React, { useState, useEffect } from 'react';
import { Clock, User, UserCheck, MapPin, DollarSign, CheckCircle, XCircle, AlertCircle, FileText, Loader2 } from 'lucide-react';
import { getTripLogs, TripActivityLog } from '@/lib/features/trip/tripApi';
import { cn } from '@/lib/utils';

interface TripLogProps {
    tripId: string;
}

export function TripLog({ tripId }: TripLogProps) {
    const [logs, setLogs] = useState<TripActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchLogs();
    }, [tripId]);

    const fetchLogs = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const activityLogs = await getTripLogs(tripId);
            // Sort by createdAt descending (newest first)
            const sortedLogs = [...activityLogs].sort((a, b) => {
                const dateA = new Date(a.createdAt).getTime();
                const dateB = new Date(b.createdAt).getTime();
                return dateB - dateA;
            });
            setLogs(sortedLogs);
        } catch (err: any) {
            setError(
                err?.response?.data?.error ||
                err?.message ||
                'Failed to load trip logs'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const formatDateTime = (date: Date | string) => {
        const d = new Date(date);
        return d.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const getActionIcon = (action: string) => {
        if (action.includes('CREATED')) return FileText;
        if (action.includes('ASSIGNED') || action.includes('ACCEPTED')) return UserCheck;
        if (action.includes('STARTED')) return MapPin;
        if (action.includes('ENDED') || action.includes('COMPLETED')) return CheckCircle;
        if (action.includes('CANCELLED') || action.includes('REJECTED')) return XCircle;
        if (action.includes('PAYMENT') || action.includes('PAID')) return DollarSign;
        if (action.includes('UPDATED') || action.includes('STATUS_CHANGED')) return AlertCircle;
        return Clock;
    };

    const getActionColor = (action: string) => {
        if (action.includes('CREATED')) return 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400';
        if (action.includes('ASSIGNED') || action.includes('ACCEPTED')) return 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400';
        if (action.includes('STARTED')) return 'text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400';
        if (action.includes('ENDED') || action.includes('COMPLETED')) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400';
        if (action.includes('CANCELLED') || action.includes('REJECTED')) return 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400';
        if (action.includes('PAYMENT') || action.includes('PAID')) return 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400';
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/30 dark:text-gray-400';
    };

    const getActionLabel = (action: string) => {
        const actionMap: Record<string, string> = {
            'TRIP_CREATED': 'Trip Created',
            'TRIP_ASSIGNED': 'Driver Assigned',
            'TRIP_ACCEPTED': 'Driver Accepted',
            'TRIP_REJECTED': 'Driver Rejected',
            'TRIP_STARTED': 'Trip Started',
            'TRIP_ENDED': 'Trip Ended',
            'TRIP_CANCELLED': 'Trip Cancelled',
            'TRIP_STATUS_CHANGED': 'Status Changed',
            'TRIP_UPDATED': 'Trip Updated',
        };
        return actionMap[action] || action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const getPerformedBy = (log: TripActivityLog) => {
        if (log.user) {
            return `${log.user.fullName} (${log.user.role})`;
        }
        if (log.driver) {
            return `${log.driver.firstName} ${log.driver.lastName} (Driver: ${log.driver.driverCode})`;
        }
        if (log.staff) {
            return `${log.staff.name} (Staff)`;
        }
        return 'System';
    };

    const formatCurrency = (amount: number | null | undefined): string => {
        if (amount === null || amount === undefined) return '₹0.00';
        return `₹${amount.toFixed(2)}`;
    };

    const renderMetadata = (log: TripActivityLog) => {
        if (!log.metadata || typeof log.metadata !== 'object') return null;

        const metadata = log.metadata as any;

        // Payment-related metadata
        if (log.action.includes('PAYMENT') || log.action.includes('PAID') || metadata.paymentMethod || metadata.totalPaid) {
            return (
                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p className="text-xs font-bold uppercase text-[#49659c] dark:text-gray-400 mb-1">
                                Total Paid
                            </p>
                            <p className="text-sm font-bold text-[#0d121c] dark:text-white">
                                {formatCurrency(metadata.totalPaid)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase text-[#49659c] dark:text-gray-400 mb-1">
                                Payment Method
                            </p>
                            <p className="text-sm font-bold text-[#0d121c] dark:text-white">
                                {metadata.paymentMethod || 'N/A'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase text-[#49659c] dark:text-gray-400 mb-1">
                                Cash Amount
                            </p>
                            <p className="text-sm font-bold text-[#0d121c] dark:text-white">
                                {formatCurrency(metadata.cashAmount)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase text-[#49659c] dark:text-gray-400 mb-1">
                                UPI Amount
                            </p>
                            <p className="text-sm font-bold text-[#0d121c] dark:text-white">
                                {formatCurrency(metadata.upiAmount)}
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        // Status change metadata
        if (log.action.includes('STATUS_CHANGED') || log.action.includes('UPDATED')) {
            const relevantFields: string[] = [];
            if (metadata.oldStatus && metadata.newStatus) {
                relevantFields.push(`Status: ${metadata.oldStatus} → ${metadata.newStatus}`);
            }
            if (metadata.oldValue && metadata.newValue) {
                relevantFields.push(`${metadata.field || 'Value'}: ${metadata.oldValue} → ${metadata.newValue}`);
            }
            if (metadata.reason) {
                relevantFields.push(`Reason: ${metadata.reason}`);
            }
            
            if (relevantFields.length > 0) {
                return (
                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded text-xs text-[#49659c] dark:text-gray-400">
                        {relevantFields.map((field, idx) => (
                            <p key={idx} className="mb-1 last:mb-0">{field}</p>
                        ))}
                    </div>
                );
            }
        }

        // Driver assignment metadata
        if (log.action.includes('ASSIGNED') || log.action.includes('REASSIGNED')) {
            if (metadata.driverName || metadata.driverCode) {
                return (
                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded text-xs text-[#49659c] dark:text-gray-400">
                        {metadata.driverName && <p>Driver: {metadata.driverName}</p>}
                        {metadata.driverCode && <p>Code: {metadata.driverCode}</p>}
                    </div>
                );
            }
        }

        // Only show metadata if it has meaningful content (not empty object)
        const hasRelevantData = Object.keys(metadata).some(key => {
            const value = metadata[key];
            return value !== null && value !== undefined && value !== '';
        });

        if (!hasRelevantData) return null;

        // For other metadata, show only key-value pairs that are relevant
        const relevantKeys = ['reason', 'oldStatus', 'newStatus', 'oldValue', 'newValue', 'field', 'driverName', 'driverCode'];
        const relevantEntries = Object.entries(metadata).filter(([key, value]) => 
            relevantKeys.includes(key) && value !== null && value !== undefined && value !== ''
        );

        if (relevantEntries.length === 0) return null;

        return (
            <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded text-xs text-[#49659c] dark:text-gray-400">
                {relevantEntries.map(([key, value]) => (
                    <p key={key} className="mb-1 last:mb-0">
                        <span className="font-medium">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span> {String(value)}
                    </p>
                ))}
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="size-6 animate-spin text-[#0d59f2] mr-3" />
                    <p className="text-sm text-[#49659c] dark:text-gray-400">Loading trip logs...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="text-center py-8">
                    <AlertCircle className="size-8 text-red-500 mx-auto mb-2" />
                    <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
                    <button
                        onClick={fetchLogs}
                        className="px-4 py-2 bg-[#0d59f2] text-white rounded-lg text-sm font-medium hover:bg-[#0d59f2]/90 transition-all"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
                <h3 className="text-lg font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                    <Clock size={20} />
                    Trip Activity Log
                </h3>
                <div className="text-center py-8">
                    <FileText className="size-8 text-[#49659c] opacity-50 mx-auto mb-2" />
                    <p className="text-sm text-[#49659c] dark:text-gray-400">No activity logs found for this trip</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="text-lg font-bold text-[#0d121c] dark:text-white mb-6 flex items-center gap-2">
                <Clock size={20} />
                Trip Activity Log
            </h3>
            <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                
                <div className="space-y-6">
                    {logs.map((log, index) => {
                        const Icon = getActionIcon(log.action);
                        const actionColor = getActionColor(log.action);
                        const actionLabel = getActionLabel(log.action);
                        const performedBy = getPerformedBy(log);

                        return (
                            <div key={log.id} className="relative flex items-start gap-4">
                                {/* Icon */}
                                <div className={cn(
                                    "relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 border-white dark:border-gray-900",
                                    actionColor
                                )}>
                                    <Icon size={20} />
                                </div>

                                {/* Content */}
                                <div className="flex-1 pt-1">
                                    <div className="flex items-start justify-between gap-4 mb-1">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={cn(
                                                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold",
                                                    actionColor
                                                )}>
                                                    {actionLabel}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-[#0d121c] dark:text-white mb-1">
                                                {log.description}
                                            </p>
                                            {renderMetadata(log)}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-[#49659c] dark:text-gray-400 mb-1">
                                                {formatDateTime(log.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-[#49659c] dark:text-gray-400">
                                        <User size={12} />
                                        <span>Performed by: {performedBy}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
