"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { fetchDrivers } from '@/lib/features/drivers/driverSlice';
import { fetchPenalties } from '@/lib/features/penalties/penaltiesSlice';
import { 
    applyPenaltyToDriver, 
    applyPenaltyToDrivers,
    getDriverPenalties,
    updateDriverPenalty,
    deleteDriverPenalty
} from '@/lib/features/penalties/penaltiesApi';
import { useToast } from '@/components/ui/toast';
import { AlertTriangle, Users, Building2, Save, X, Edit2, Trash2, Calendar, DollarSign } from 'lucide-react';
import { GetDriver } from '@/lib/types/drivers';
import { Penalty } from '@/lib/types/penalties';
import { cn } from '@/lib/utils';

interface DriverPenalty {
    id: string;
    driverId: string;
    penaltyId: string;
    penalty: {
        id: string;
        name: string;
        amount: number;
    };
    amount: number;
    reason?: string;
    violationDate?: string;
    appliedAt: string;
    appliedBy?: string;
    driver: {
        id: string;
        firstName: string;
        lastName: string;
        phone: string;
    };
}

export function DriverPenaltiesManager() {
    const dispatch = useAppDispatch();
    const { drivers } = useAppSelector(state => state.drivers);
    const { list: franchises } = useAppSelector((state) => state.franchise);
    const { penalties = [] } = useAppSelector((state) => state.penalties);
    const { toast } = useToast();
    
    const [mode, setMode] = useState<'apply' | 'view'>('apply');
    const [selectedPenalty, setSelectedPenalty] = useState<Penalty | null>(null);
    const [selectedDrivers, setSelectedDrivers] = useState<Set<string>>(new Set());
    const [selectedFranchise, setSelectedFranchise] = useState<string>('all');
    const [amount, setAmount] = useState<string>('');
    const [reason, setReason] = useState<string>('');
    const [violationDate, setViolationDate] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // View mode state
    const [driverPenalties, setDriverPenalties] = useState<DriverPenalty[]>([]);
    const [isLoadingPenalties, setIsLoadingPenalties] = useState(false);
    const [selectedDriverForView, setSelectedDriverForView] = useState<string>('all');
    const [editingPenalty, setEditingPenalty] = useState<DriverPenalty | null>(null);

    React.useEffect(() => {
        dispatch(fetchDrivers());
        dispatch(fetchPenalties());
    }, [dispatch]);

    // Load driver penalties when in view mode
    useEffect(() => {
        if (mode === 'view') {
            loadDriverPenalties();
        }
    }, [mode, selectedDriverForView]);

    const loadDriverPenalties = async () => {
        setIsLoadingPenalties(true);
        try {
            const params: any = {};
            if (selectedDriverForView !== 'all') {
                params.driverId = selectedDriverForView;
            }
            const response = await getDriverPenalties(params);
            setDriverPenalties(Array.isArray(response.data) ? response.data : []);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error?.response?.data?.error || error?.message || 'Failed to load driver penalties',
                variant: 'error',
            });
        } finally {
            setIsLoadingPenalties(false);
        }
    };

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

    const handleApplyPenalty = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedPenalty) {
            toast({
                title: 'Error',
                description: 'Please select a penalty',
                variant: 'error',
            });
            return;
        }

        if (selectedDrivers.size === 0 && selectedFranchise === 'all') {
            toast({
                title: 'Error',
                description: 'Please select at least one driver',
                variant: 'error',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const penaltyAmount = amount ? parseInt(amount) : selectedPenalty.amount;
            // Convert penalty ID to string (UUID format expected by API)
            const penaltyId = typeof selectedPenalty.id === 'string' 
                ? selectedPenalty.id 
                : selectedPenalty.id.toString();
            
            const requestData: any = {
                penaltyId: penaltyId,
                amount: penaltyAmount,
            };
            
            if (reason) requestData.reason = reason;
            if (violationDate) requestData.violationDate = new Date(violationDate).toISOString();

            if (selectedDrivers.size === 1) {
                // Single driver
                const driverId = Array.from(selectedDrivers)[0];
                const driver = drivers.find(d => d.id === driverId || d._id.toString() === driverId);
                const actualDriverId = driver?.id || driverId;
                
                await applyPenaltyToDriver(actualDriverId, requestData);
                
                toast({
                    title: 'Success',
                    description: `Penalty applied to ${driver?.firstName} ${driver?.lastName}`,
                    variant: 'success',
                });
            } else {
                // Multiple drivers
                const driverIds = Array.from(selectedDrivers).map(id => {
                    const driver = drivers.find(d => d.id === id || d._id.toString() === id);
                    return driver?.id || id;
                });
                
                requestData.driverIds = driverIds;
                await applyPenaltyToDrivers(requestData);
                
                toast({
                    title: 'Success',
                    description: `Penalty applied to ${driverIds.length} driver(s)`,
                    variant: 'success',
                });
            }

            // Reset form
            setSelectedPenalty(null);
            setSelectedDrivers(new Set());
            setAmount('');
            setReason('');
            setViolationDate('');
            loadDriverPenalties(); // Refresh penalties list
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error?.response?.data?.error || error?.message || 'Failed to apply penalty',
                variant: 'error',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdatePenalty = async (penaltyId: string, data: any) => {
        try {
            await updateDriverPenalty(penaltyId, data);
            toast({
                title: 'Success',
                description: 'Penalty updated successfully',
                variant: 'success',
            });
            setEditingPenalty(null);
            loadDriverPenalties();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error?.response?.data?.error || error?.message || 'Failed to update penalty',
                variant: 'error',
            });
        }
    };

    const handleDeletePenalty = async (penaltyId: string) => {
        if (!confirm('Are you sure you want to delete this penalty record?')) return;
        
        try {
            await deleteDriverPenalty(penaltyId);
            toast({
                title: 'Success',
                description: 'Penalty deleted successfully',
                variant: 'success',
            });
            loadDriverPenalties();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error?.response?.data?.error || error?.message || 'Failed to delete penalty',
                variant: 'error',
            });
        }
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white">Penalties & Detections</h2>
                    <p className="text-[#49659c] dark:text-gray-400">Apply penalties and view driver violations</p>
                </div>
            </div>

            {/* Mode Toggle */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-4">
                <div className="flex gap-2">
                    <button
                        onClick={() => setMode('apply')}
                        className={cn(
                            "flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            mode === 'apply'
                                ? 'bg-[#0d59f2] text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                        )}
                    >
                        Apply Penalty
                    </button>
                    <button
                        onClick={() => setMode('view')}
                        className={cn(
                            "flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            mode === 'view'
                                ? 'bg-[#0d59f2] text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                        )}
                    >
                        View Penalties
                    </button>
                </div>
            </div>

            {mode === 'apply' ? (
                <form onSubmit={handleApplyPenalty} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
                    <div className="space-y-6">
                        <div>
                            <label className="text-sm font-bold text-[#49659c] uppercase tracking-wider mb-2 block flex items-center gap-2">
                                <AlertTriangle size={16} />
                                Select Penalty
                            </label>
                            <select
                                value={selectedPenalty?.id || ''}
                                onChange={(e) => {
                                    const penalty = penalties.find(p => p.id.toString() === e.target.value);
                                    setSelectedPenalty(penalty || null);
                                    setAmount(penalty?.amount.toString() || '');
                                }}
                                required
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white"
                            >
                                <option value="">Select a penalty</option>
                                {penalties.map(penalty => (
                                    <option key={penalty.id} value={penalty.id.toString()}>
                                        {penalty.name} - ₹{penalty.amount}
                                    </option>
                                ))}
                            </select>
                            {penalties.length === 0 && (
                                <p className="text-sm text-gray-500 mt-2">No penalties available. Please create penalties first.</p>
                            )}
                        </div>

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
                                                <p className="text-xs text-[#49659c]">{driver.driverPhone}</p>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-bold text-[#49659c] uppercase tracking-wider mb-2 block flex items-center gap-2">
                                <DollarSign size={16} />
                                Amount (₹)
                            </label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder={selectedPenalty ? `Default: ₹${selectedPenalty.amount}` : 'Enter amount'}
                                min="1"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-bold text-[#49659c] uppercase tracking-wider mb-2 block">
                                Reason (Optional)
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Enter reason for penalty..."
                                rows={3}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-bold text-[#49659c] uppercase tracking-wider mb-2 block flex items-center gap-2">
                                <Calendar size={16} />
                                Violation Date (Optional)
                            </label>
                            <input
                                type="datetime-local"
                                value={violationDate}
                                onChange={(e) => setViolationDate(e.target.value)}
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
                                <span>{isSubmitting ? 'Applying...' : 'Apply Penalty'}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedPenalty(null);
                                    setSelectedDrivers(new Set());
                                    setAmount('');
                                    setReason('');
                                    setViolationDate('');
                                }}
                                className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                </form>
            ) : (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
                    <div className="mb-6">
                        <label className="text-sm font-bold text-[#49659c] uppercase tracking-wider mb-2 block">
                            Filter by Driver
                        </label>
                        <select
                            value={selectedDriverForView}
                            onChange={(e) => setSelectedDriverForView(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white"
                        >
                            <option value="all">All Drivers</option>
                            {drivers.map(driver => (
                                <option key={driver._id} value={driver.id || driver._id.toString()}>
                                    {driver.firstName} {driver.lastName} ({driver.driverPhone})
                                </option>
                            ))}
                        </select>
                    </div>

                    {isLoadingPenalties ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500">Loading penalties...</p>
                        </div>
                    ) : driverPenalties.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No penalties found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#49659c]">Driver</th>
                                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#49659c]">Penalty</th>
                                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#49659c]">Amount</th>
                                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#49659c]">Reason</th>
                                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#49659c]">Date</th>
                                        <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#49659c] text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {driverPenalties.map((penalty) => (
                                        <tr key={penalty.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-bold text-[#0d121c] dark:text-white">
                                                    {penalty.driver.firstName} {penalty.driver.lastName}
                                                </p>
                                                <p className="text-xs text-[#49659c]">{penalty.driver.phone}</p>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                {penalty.penalty.name}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-bold text-[#0d121c] dark:text-white">
                                                ₹{penalty.amount.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                {penalty.reason || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                {new Date(penalty.appliedAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setEditingPenalty(penalty)}
                                                        className="p-2 text-[#49659c] hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePenalty(penalty.id)}
                                                        className="p-2 text-[#49659c] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
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
            )}
        </div>
    );
}
