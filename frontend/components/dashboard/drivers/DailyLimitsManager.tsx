"use client";

import React, { useState, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { fetchDrivers } from '@/lib/features/drivers/driverSlice';
import { setDriverDailyLimit, setDriversDailyLimit } from '@/lib/features/drivers/driverApi';
import { useToast } from '@/components/ui/toast';
import { Target, Users, Building2, Save, Check, X } from 'lucide-react';
import { GetDriver } from '@/lib/types/drivers';

export function DailyLimitsManager() {
    const dispatch = useAppDispatch();
    const { drivers } = useAppSelector(state => state.drivers);
    const { list: franchises } = useAppSelector((state) => state.franchise);
    const { toast } = useToast();
    
    const [selectedDrivers, setSelectedDrivers] = useState<Set<string>>(new Set());
    const [selectedFranchise, setSelectedFranchise] = useState<string>('all');
    const [dailyLimit, setDailyLimit] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mode, setMode] = useState<'single' | 'bulk'>('single');
    const [selectedDriverId, setSelectedDriverId] = useState<string>('');

    React.useEffect(() => {
        dispatch(fetchDrivers());
    }, [dispatch]);

    // Filter drivers by franchise
    const filteredDrivers = useMemo(() => {
        if (selectedFranchise === 'all') return drivers;
        return drivers.filter(d => {
            const driverFranchiseId = typeof d.franchiseId === 'number' 
                ? d.franchiseId.toString() 
                : d.franchiseId;
            return driverFranchiseId === selectedFranchise || 
                   franchises.find(f => f._id === selectedFranchise && 
                   parseInt(f._id.replace(/-/g, '').substring(0, 10), 16) === d.franchiseId);
        });
    }, [drivers, selectedFranchise, franchises]);

    // Create franchise map for lookup
    const franchiseMap = useMemo(() => {
        const map = new Map<string | number, { code: string; name: string; _id: string }>();
        franchises.forEach(franchise => {
            map.set(franchise._id, { code: franchise.code, name: franchise.name, _id: franchise._id });
            const numId = typeof franchise._id === 'string' ? parseInt(franchise._id.replace(/-/g, '').substring(0, 10), 16) : franchise._id;
            if (!isNaN(numId)) {
                map.set(numId, { code: franchise.code, name: franchise.name, _id: franchise._id });
            }
        });
        return map;
    }, [franchises]);

    const handleDriverToggle = (driverId: string) => {
        setSelectedDrivers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(driverId)) {
                newSet.delete(driverId);
            } else {
                newSet.add(driverId);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (selectedDrivers.size === filteredDrivers.length) {
            setSelectedDrivers(new Set());
        } else {
            setSelectedDrivers(new Set(filteredDrivers.map(d => d.id || d._id.toString())));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!dailyLimit || parseInt(dailyLimit) <= 0) {
            toast({
                title: 'Error',
                description: 'Please enter a valid daily limit (greater than 0)',
                variant: 'error',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const limitAmount = parseInt(dailyLimit);

            if (mode === 'single') {
                if (!selectedDriverId) {
                    toast({
                        title: 'Error',
                        description: 'Please select a driver',
                        variant: 'error',
                    });
                    setIsSubmitting(false);
                    return;
                }

                // Use driver.id (UUID) if available
                const driverId = drivers.find(d => d._id.toString() === selectedDriverId || d.id === selectedDriverId)?.id || selectedDriverId;
                
                await setDriverDailyLimit(driverId, { dailyTargetAmount: limitAmount });
                
                toast({
                    title: 'Success',
                    description: 'Daily limit updated successfully',
                    variant: 'success',
                });
            } else {
                // Bulk update
                if (selectedDrivers.size === 0 && selectedFranchise === 'all') {
                    toast({
                        title: 'Error',
                        description: 'Please select drivers or a franchise',
                        variant: 'error',
                    });
                    setIsSubmitting(false);
                    return;
                }

                let requestData: any = { dailyTargetAmount: limitAmount };

                if (selectedDrivers.size > 0) {
                    // Update selected drivers
                    const driverIds = Array.from(selectedDrivers).map(id => {
                        const driver = drivers.find(d => d._id.toString() === id || d.id === id);
                        return driver?.id || id;
                    });
                    requestData.driverIds = driverIds;
                } else if (selectedFranchise !== 'all') {
                    // Update all drivers in franchise
                    requestData.franchiseId = selectedFranchise;
                }

                await setDriversDailyLimit(requestData);
                
                toast({
                    title: 'Success',
                    description: `Daily limit updated for ${selectedDrivers.size || 'all drivers in franchise'}`,
                    variant: 'success',
                });
            }

            // Reset form
            setDailyLimit('');
            setSelectedDrivers(new Set());
            setSelectedDriverId('');
            dispatch(fetchDrivers()); // Refresh driver list
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error?.response?.data?.error || error?.message || 'Failed to update daily limit',
                variant: 'error',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white">Daily Limits Management</h2>
                    <p className="text-[#49659c] dark:text-gray-400">Set daily target amounts for drivers</p>
                </div>
            </div>

            {/* Mode Toggle */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-4">
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setMode('single');
                            setSelectedDrivers(new Set());
                            setSelectedFranchise('all');
                        }}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            mode === 'single'
                                ? 'bg-[#0d59f2] text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                        }`}
                    >
                        Single Driver
                    </button>
                    <button
                        onClick={() => {
                            setMode('bulk');
                            setSelectedDriverId('');
                        }}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            mode === 'bulk'
                                ? 'bg-[#0d59f2] text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                        }`}
                    >
                        Bulk Update
                    </button>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
                <div className="space-y-6">
                    {mode === 'single' ? (
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-bold text-[#49659c] uppercase tracking-wider mb-2 block">
                                    Select Driver
                                </label>
                                <select
                                    value={selectedDriverId}
                                    onChange={(e) => setSelectedDriverId(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white"
                                >
                                    <option value="">Select a driver</option>
                                    {drivers.map(driver => (
                                        <option key={driver._id} value={driver._id.toString()}>
                                            {driver.firstName} {driver.lastName} ({driver.driverPhone})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {selectedDriverId && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        Current Daily Limit: <strong className="text-[#0d121c] dark:text-white">
                                            ₹{drivers.find(d => d._id.toString() === selectedDriverId)?.dailyTargetAmount?.toLocaleString() || 0}
                                        </strong>
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-bold text-[#49659c] uppercase tracking-wider mb-2 block">
                                    Filter by Franchise
                                </label>
                                <select
                                    value={selectedFranchise}
                                    onChange={(e) => {
                                        setSelectedFranchise(e.target.value);
                                        setSelectedDrivers(new Set());
                                    }}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white"
                                >
                                    <option value="all">All Franchises</option>
                                    {franchises.map(franchise => (
                                        <option key={franchise._id} value={franchise._id}>
                                            {franchise.name} ({franchise.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedFranchise === 'all' && (
                                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto">
                                    <div className="flex items-center justify-between mb-4">
                                        <label className="text-sm font-bold text-[#49659c] uppercase tracking-wider">
                                            Select Drivers
                                        </label>
                                        <button
                                            type="button"
                                            onClick={handleSelectAll}
                                            className="text-xs text-[#0d59f2] hover:underline"
                                        >
                                            {selectedDrivers.size === filteredDrivers.length ? 'Deselect All' : 'Select All'}
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {filteredDrivers.map(driver => {
                                            const driverId = driver.id || driver._id.toString();
                                            const franchise = driver.franchiseId !== null && driver.franchiseId !== undefined 
                                                ? franchiseMap.get(driver.franchiseId) || franchiseMap.get(driver.franchiseId.toString())
                                                : null;
                                            
                                            return (
                                                <label
                                                    key={driver._id}
                                                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedDrivers.has(driverId)}
                                                        onChange={() => handleDriverToggle(driverId)}
                                                        className="size-4 rounded border-gray-300 text-[#0d59f2] focus:ring-[#0d59f2]"
                                                    />
                                                    <div className="flex-1">
                                                        <p className="text-sm font-bold text-[#0d121c] dark:text-white">
                                                            {driver.firstName} {driver.lastName}
                                                        </p>
                                                        <div className="flex items-center gap-4 mt-1">
                                                            <p className="text-xs text-[#49659c]">{driver.driverPhone}</p>
                                                            {franchise && (
                                                                <p className="text-xs text-[#49659c]">{franchise.code}</p>
                                                            )}
                                                            <p className="text-xs text-green-600 font-medium">
                                                                Current: ₹{driver.dailyTargetAmount?.toLocaleString() || 0}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                    {filteredDrivers.length === 0 && (
                                        <p className="text-center text-sm text-gray-500 py-8">No drivers found</p>
                                    )}
                                </div>
                            )}

                            {selectedFranchise !== 'all' && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        This will update daily limit for <strong className="text-[#0d121c] dark:text-white">
                                            all drivers in {franchises.find(f => f._id === selectedFranchise)?.name}
                                        </strong>
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <div>
                        <label className="text-sm font-bold text-[#49659c] uppercase tracking-wider mb-2 block flex items-center gap-2">
                            <Target size={16} />
                            Daily Target Amount (₹)
                        </label>
                        <input
                            type="number"
                            value={dailyLimit}
                            onChange={(e) => setDailyLimit(e.target.value)}
                            placeholder="Enter daily limit amount"
                            required
                            min="1"
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white"
                        />
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 bg-[#0d59f2] text-white py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#0d59f2]/90 shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save size={18} />
                            <span>{isSubmitting ? 'Updating...' : 'Update Daily Limit'}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setDailyLimit('');
                                setSelectedDrivers(new Set());
                                setSelectedDriverId('');
                                setSelectedFranchise('all');
                            }}
                            className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
