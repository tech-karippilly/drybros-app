"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { applyPenaltyToDriver } from '@/lib/features/penalties/penaltiesSlice';
import { Penalty, ApplyPenaltyInput, PenaltyTargetType } from '@/lib/types/penalties';
import { Staff } from '@/lib/types/staff';
import { PENALTIES_STRINGS } from '@/lib/constants/penalties';
import { Input, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import api from '@/lib/axios';

interface Driver {
    id: number;
    firstName: string;
    lastName: string;
    phone: string;
    franchiseId: number;
}

interface ApplyPenaltyModalProps {
    isOpen: boolean;
    onClose: () => void;
    penalty: Penalty | null;
}

export function ApplyPenaltyModal({ isOpen, onClose, penalty }: ApplyPenaltyModalProps) {
    const dispatch = useAppDispatch();
    const { toast } = useToast();
    const { list: staffList } = useAppSelector((state) => state.staff);
    const [targetType, setTargetType] = useState<PenaltyTargetType>('DRIVER');
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [selectedDriverId, setSelectedDriverId] = useState<number | ''>('');
    const [selectedStaffId, setSelectedStaffId] = useState<string>('');
    const [reason, setReason] = useState('');
    const [amount, setAmount] = useState<number>(0);
    const [errors, setErrors] = useState<{ targetType?: string; driver?: string; staff?: string; reason?: string; amount?: string }>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingDrivers, setIsFetchingDrivers] = useState(false);

    useEffect(() => {
        if (isOpen && penalty) {
            setAmount(penalty.amount);
            if (targetType === 'DRIVER') {
                fetchDrivers();
            }
        }
    }, [isOpen, penalty, targetType, fetchDrivers]);

    useEffect(() => {
        if (!isOpen) {
            setTargetType('DRIVER');
            setSelectedDriverId('');
            setSelectedStaffId('');
            setReason('');
            setAmount(penalty?.amount || 0);
            setErrors({});
        }
    }, [isOpen, penalty]);

    const fetchDrivers = useCallback(async () => {
        setIsFetchingDrivers(true);
        try {
            const response = await api.get('/drivers');
            const driversData = response.data.data || response.data;
            setDrivers(Array.isArray(driversData) ? driversData : []);
        } catch {
            setDrivers([]);
        } finally {
            setIsFetchingDrivers(false);
        }
    }, []);

    const validate = useCallback((): boolean => {
        const newErrors: typeof errors = {};

        if (!targetType) {
            newErrors.targetType = PENALTIES_STRINGS.TARGET_TYPE_REQUIRED;
        }

        if (targetType === 'DRIVER' && !selectedDriverId) {
            newErrors.driver = PENALTIES_STRINGS.DRIVER_REQUIRED;
        }

        if (targetType === 'STAFF' && !selectedStaffId) {
            newErrors.staff = PENALTIES_STRINGS.STAFF_REQUIRED;
        }

        if (!reason.trim()) {
            newErrors.reason = PENALTIES_STRINGS.REASON_REQUIRED;
        }

        if (amount <= 0) {
            newErrors.amount = PENALTIES_STRINGS.AMOUNT_INVALID;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [targetType, selectedDriverId, selectedStaffId, reason, amount]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!penalty || !validate()) {
            return;
        }

        setIsLoading(true);
        try {
            const input: ApplyPenaltyInput = {
                penaltyId: penalty.id,
                targetType: targetType,
                driverId: targetType === 'DRIVER' ? (selectedDriverId as number) : undefined,
                staffId: targetType === 'STAFF' ? selectedStaffId : undefined,
                reason: reason.trim(),
                amount: amount !== penalty.amount ? amount : undefined,
            };
            await dispatch(applyPenaltyToDriver(input)).unwrap();
            toast({
                title: "Success",
                description: `Penalty applied to ${targetType === 'DRIVER' ? 'driver' : 'staff'} successfully`,
                variant: "success",
            });
            onClose();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error?.message || PENALTIES_STRINGS.APPLY_ERROR,
                variant: "error",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const selectedDriver = useMemo(() => drivers.find((d) => d.id === selectedDriverId), [drivers, selectedDriverId]);
    const selectedStaff = useMemo(() => staffList.find((s) => s._id === selectedStaffId), [staffList, selectedStaffId]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={PENALTIES_STRINGS.APPLY_TITLE}
        >
            {penalty && (
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                    {/* Penalty Info */}
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-[#0d121c] dark:text-white">{penalty.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-[#49659c] dark:text-gray-400">Type:</span>
                            <span className="text-xs font-medium text-[#0d121c] dark:text-white">
                                {penalty.type === 'PENALTY' ? PENALTIES_STRINGS.TYPE_PENALTY : PENALTIES_STRINGS.TYPE_DEDUCTION}
                            </span>
                            <span className="text-xs text-[#49659c] dark:text-gray-400">|</span>
                            <span className="text-xs text-[#49659c] dark:text-gray-400">Amount:</span>
                            <span className="text-xs font-bold text-green-600">₹{penalty.amount.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Target Type Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[#0d121c] dark:text-white">
                            {PENALTIES_STRINGS.TARGET_TYPE} *
                        </label>
                        <select
                            value={targetType}
                            onChange={(e) => {
                                setTargetType(e.target.value as PenaltyTargetType);
                                setSelectedDriverId('');
                                setSelectedStaffId('');
                                setErrors((prev) => ({ ...prev, targetType: undefined, driver: undefined, staff: undefined }));
                                if (e.target.value === 'DRIVER') {
                                    fetchDrivers();
                                }
                            }}
                            className={`w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white ${
                                errors.targetType ? 'border-red-500' : 'border-gray-200 dark:border-gray-800'
                            }`}
                        >
                            <option value="DRIVER">{PENALTIES_STRINGS.TARGET_TYPE_DRIVER}</option>
                            <option value="STAFF">{PENALTIES_STRINGS.TARGET_TYPE_STAFF}</option>
                        </select>
                        {errors.targetType && (
                            <p className="text-xs text-red-500">{errors.targetType}</p>
                        )}
                    </div>

                    {/* Driver Selection */}
                    {targetType === 'DRIVER' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[#0d121c] dark:text-white">
                                {PENALTIES_STRINGS.DRIVER_SELECT} *
                            </label>
                        {isFetchingDrivers ? (
                            <div className="p-3 text-center text-sm text-[#49659c]">
                                {PENALTIES_STRINGS.LOADING}
                            </div>
                        ) : (
                            <select
                                value={selectedDriverId}
                                onChange={(e) => {
                                    setSelectedDriverId(e.target.value ? Number(e.target.value) : '');
                                    if (errors.driver) {
                                        setErrors((prev) => ({ ...prev, driver: undefined }));
                                    }
                                }}
                                className={`w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white ${
                                    errors.driver ? 'border-red-500' : 'border-gray-200 dark:border-gray-800'
                                }`}
                            >
                                <option value="">Select a driver...</option>
                                {drivers.map((driver) => (
                                    <option key={driver.id} value={driver.id}>
                                        {driver.firstName} {driver.lastName} - {driver.phone}
                                    </option>
                                ))}
                            </select>
                        )}
                        {errors.driver && (
                            <p className="text-xs text-red-500">{errors.driver}</p>
                        )}
                        {selectedDriver && (
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-[#49659c] dark:text-gray-300">
                                Selected: {selectedDriver.firstName} {selectedDriver.lastName}
                            </div>
                        )}
                        </div>
                    )}

                    {/* Staff Selection */}
                    {targetType === 'STAFF' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[#0d121c] dark:text-white">
                                {PENALTIES_STRINGS.STAFF_SELECT} *
                            </label>
                            <select
                                value={selectedStaffId}
                                onChange={(e) => {
                                    setSelectedStaffId(e.target.value);
                                    if (errors.staff) {
                                        setErrors((prev) => ({ ...prev, staff: undefined }));
                                    }
                                }}
                                className={`w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white ${
                                    errors.staff ? 'border-red-500' : 'border-gray-200 dark:border-gray-800'
                                }`}
                            >
                                <option value="">Select a staff member...</option>
                                {staffList.map((staff) => (
                                    <option key={staff._id} value={staff._id}>
                                        {staff.name} - {staff.email} ({staff.phone})
                                    </option>
                                ))}
                            </select>
                            {errors.staff && (
                                <p className="text-xs text-red-500">{errors.staff}</p>
                            )}
                            {selectedStaff && (
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-[#49659c] dark:text-gray-300">
                                    Selected: {selectedStaff.name} ({selectedStaff.email})
                                </div>
                            )}
                        </div>
                    )}

                    {/* Amount Override */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[#0d121c] dark:text-white">
                            {PENALTIES_STRINGS.AMOUNT} *
                            <span className="text-xs text-[#49659c] ml-2">(Default: ₹{penalty.amount.toLocaleString()})</span>
                        </label>
                        <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={amount}
                            onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                setAmount(value);
                                if (errors.amount) {
                                    setErrors((prev) => ({ ...prev, amount: undefined }));
                                }
                            }}
                            placeholder={PENALTIES_STRINGS.AMOUNT_PLACEHOLDER}
                            className={errors.amount ? 'border-red-500' : ''}
                        />
                        {errors.amount && (
                            <p className="text-xs text-red-500">{errors.amount}</p>
                        )}
                    </div>

                    {/* Reason */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[#0d121c] dark:text-white">
                            {PENALTIES_STRINGS.REASON} *
                        </label>
                        <Textarea
                            value={reason}
                            onChange={(e) => {
                                setReason(e.target.value);
                                if (errors.reason) {
                                    setErrors((prev) => ({ ...prev, reason: undefined }));
                                }
                            }}
                            placeholder={PENALTIES_STRINGS.REASON_PLACEHOLDER}
                            rows={4}
                            className={errors.reason ? 'border-red-500' : ''}
                        />
                        {errors.reason && (
                            <p className="text-xs text-red-500">{errors.reason}</p>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 sm:pt-4">
                        <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
                            {PENALTIES_STRINGS.CANCEL}
                        </Button>
                        <Button type="submit" variant="primary" isLoading={isLoading} className="w-full sm:w-auto">
                            {PENALTIES_STRINGS.APPLY}
                        </Button>
                    </div>
                </form>
            )}
        </Modal>
    );
}
