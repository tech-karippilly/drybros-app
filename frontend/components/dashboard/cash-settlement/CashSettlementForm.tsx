"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppSelector } from '@/lib/hooks';
import { submitCashForSettlement, getDriverList, type DriverResponse } from '@/lib/features/drivers/driverApi';
import api from '@/lib/axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { Wallet, Truck, DollarSign, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CashSettlementFormProps {
    onClose?: () => void;
}

export function CashSettlementForm({ onClose }: CashSettlementFormProps) {
    const { toast } = useToast();
    const [drivers, setDrivers] = useState<DriverResponse[]>([]);
    const [selectedDriverId, setSelectedDriverId] = useState<string>('');
    const [settlementAmount, setSettlementAmount] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingDrivers, setIsFetchingDrivers] = useState(false);
    const [errors, setErrors] = useState<{
        driver?: string;
        amount?: string;
    }>({});

    // Fetch drivers on mount
    useEffect(() => {
        const fetchDrivers = async () => {
            setIsFetchingDrivers(true);
            try {
                // Use direct API call to get drivers with cashInHand
                const response = await api.get('/drivers');
                const driversData = response.data.data || response.data;
                const driversList = Array.isArray(driversData) ? driversData : [];
                
                // Map to DriverResponse format
                const mappedDrivers: DriverResponse[] = driversList.map((driver: any) => ({
                    id: driver.id || driver._id?.toString(),
                    firstName: driver.firstName,
                    lastName: driver.lastName,
                    phone: driver.phone || driver.driverPhone,
                    email: driver.email || '',
                    driverCode: driver.driverCode || '',
                    franchiseId: driver.franchiseId || '',
                    cashInHand: driver.cashInHand || 0,
                }));
                
                setDrivers(mappedDrivers);
            } catch (error: any) {
                console.error('Failed to fetch drivers:', error);
                toast({
                    title: 'Error',
                    description: error?.response?.data?.error || error?.message || 'Failed to load drivers',
                    variant: 'error',
                });
            } finally {
                setIsFetchingDrivers(false);
            }
        };

        fetchDrivers();
    }, [toast]);

    const selectedDriver = useMemo(() => {
        return drivers.find((d) => d.id === selectedDriverId);
    }, [drivers, selectedDriverId]);

    const cashInHand = useMemo(() => {
        if (!selectedDriver) return 0;
        // Handle both number and string formats
        const cash = selectedDriver.cashInHand;
        if (typeof cash === 'string') {
            return parseFloat(cash) || 0;
        }
        return cash || 0;
    }, [selectedDriver]);

    const validate = useCallback(() => {
        const newErrors: typeof errors = {};

        if (!selectedDriverId) {
            newErrors.driver = 'Please select a driver';
        }

        const amount = parseFloat(settlementAmount);
        if (!settlementAmount || isNaN(amount) || amount <= 0) {
            newErrors.amount = 'Please enter a valid amount greater than zero';
        } else if (amount > cashInHand) {
            newErrors.amount = `Amount cannot exceed cash in hand (₹${cashInHand.toFixed(2)})`;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [selectedDriverId, settlementAmount, cashInHand]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        setIsLoading(true);
        try {
            const amount = parseFloat(settlementAmount);
            const result = await submitCashForSettlement({
                driverId: selectedDriverId,
                settlementAmount: amount,
            });

            toast({
                title: 'Success',
                description: `Cash settlement submitted successfully. Remaining cash: ₹${result.remainingCash.toFixed(2)}`,
                variant: 'success',
            });

            // Reset form
            setSelectedDriverId('');
            setSettlementAmount('');
            setErrors({});

            // Refresh drivers list to update cash in hand
            const response = await api.get('/drivers');
            const driversData = response.data.data || response.data;
            const driversList = Array.isArray(driversData) ? driversData : [];
            
            const mappedDrivers: DriverResponse[] = driversList.map((driver: any) => ({
                id: driver.id || driver._id?.toString(),
                firstName: driver.firstName,
                lastName: driver.lastName,
                phone: driver.phone || driver.driverPhone,
                email: driver.email || '',
                driverCode: driver.driverCode || '',
                franchiseId: driver.franchiseId || '',
                cashInHand: driver.cashInHand || 0,
            }));
            setDrivers(mappedDrivers);

            if (onClose) {
                onClose();
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error?.response?.data?.error || error?.message || 'Failed to submit cash settlement',
                variant: 'error',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDriverChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedDriverId(e.target.value);
        setSettlementAmount('');
        setErrors((prev) => ({ ...prev, driver: undefined, amount: undefined }));
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Allow only numbers and decimal point
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setSettlementAmount(value);
            setErrors((prev) => ({ ...prev, amount: undefined }));
        }
    };

    return (
        <div className="bg-white dark:bg-[#101622] rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#0d59f2]/10 text-[#0d59f2]">
                        <Wallet size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-[#0d121c] dark:text-white">
                            Submit Cash Settlement
                        </h2>
                        <p className="text-sm text-[#49659c] dark:text-gray-400">
                            Record cash collected from drivers after trips
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Driver Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[#0d121c] dark:text-white flex items-center gap-2">
                            <Truck size={16} className="text-[#49659c] dark:text-gray-400" />
                            Select Driver *
                        </label>
                        {isFetchingDrivers ? (
                            <div className="flex items-center gap-2 p-3 text-sm text-[#49659c] dark:text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                                <Loader2 size={16} className="animate-spin" />
                                Loading drivers...
                            </div>
                        ) : (
                            <select
                                value={selectedDriverId}
                                onChange={handleDriverChange}
                                className={cn(
                                    'w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white transition-colors',
                                    errors.driver
                                        ? 'border-red-500 focus:ring-red-500/20'
                                        : 'border-gray-200 dark:border-gray-800'
                                )}
                            >
                                <option value="">-- Select a driver --</option>
                                {drivers.map((driver) => (
                                    <option key={driver.id} value={driver.id}>
                                        {driver.firstName} {driver.lastName} ({driver.phone})
                                    </option>
                                ))}
                            </select>
                        )}
                        {errors.driver && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle size={12} />
                                {errors.driver}
                            </p>
                        )}
                    </div>

                    {/* Cash in Hand Display */}
                    {selectedDriver && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <DollarSign size={18} className="text-blue-600 dark:text-blue-400" />
                                    <span className="text-sm font-medium text-[#0d121c] dark:text-white">
                                        Cash in Hand:
                                    </span>
                                </div>
                                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                    ₹{cashInHand.toFixed(2)}
                                </span>
                            </div>
                            <p className="text-xs text-[#49659c] dark:text-gray-400 mt-1">
                                {selectedDriver.firstName} {selectedDriver.lastName} has ₹{cashInHand.toFixed(2)} available for settlement
                            </p>
                        </div>
                    )}

                    {/* Settlement Amount Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[#0d121c] dark:text-white flex items-center gap-2">
                            <DollarSign size={16} className="text-[#49659c] dark:text-gray-400" />
                            Settlement Amount *
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#49659c] dark:text-gray-400 text-sm">
                                ₹
                            </span>
                            <Input
                                type="text"
                                inputMode="decimal"
                                value={settlementAmount}
                                onChange={handleAmountChange}
                                placeholder="0.00"
                                className={cn(
                                    'pl-8',
                                    errors.amount && 'border-red-500 focus:ring-red-500/20'
                                )}
                                disabled={!selectedDriverId || isLoading}
                            />
                        </div>
                        {errors.amount && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle size={12} />
                                {errors.amount}
                            </p>
                        )}
                        {selectedDriver && !errors.amount && settlementAmount && (
                            <p className="text-xs text-[#49659c] dark:text-gray-400">
                                Remaining after settlement: ₹
                                {(cashInHand - parseFloat(settlementAmount || '0')).toFixed(2)}
                            </p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-3 pt-2">
                        <Button
                            type="submit"
                            variant="primary"
                            className="flex-1"
                            isLoading={isLoading}
                            disabled={!selectedDriverId || !settlementAmount || isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin mr-2" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Wallet size={16} className="mr-2" />
                                    Submit Settlement
                                </>
                            )}
                        </Button>
                        {onClose && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
