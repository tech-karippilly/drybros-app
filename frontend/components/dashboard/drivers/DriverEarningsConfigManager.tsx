"use client";

import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { fetchEarningsConfig, updateEarningsConfig } from '@/lib/features/earningsConfig/earningsConfigSlice';
import { 
    getEarningsConfigByFranchise, 
    setFranchiseEarningsConfig,
    getEarningsConfigByDriver,
    setDriverEarningsConfig,
    EarningsConfigResponse
} from '@/lib/features/earningsConfig/earningsConfigApi';
import { fetchDrivers } from '@/lib/features/drivers/driverSlice';
import { getFranchisePersonnel } from '@/lib/features/franchise/franchiseApi';
import { useToast } from '@/components/ui/toast';
import { Save, DollarSign, TrendingUp, TrendingDown, Target, Settings, Plus, X, Users, Building2, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

type ConfigMode = 'all' | 'franchise' | 'driver';

export function DriverEarningsConfigManager() {
    const dispatch = useAppDispatch();
    const { config: globalConfig, isLoading: isLoadingGlobal } = useAppSelector(state => state.earningsConfig);
    const { drivers } = useAppSelector(state => state.drivers);
    const { list: franchises } = useAppSelector(state => state.franchise);
    const { toast } = useToast();
    
    const [mode, setMode] = useState<ConfigMode>('all');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingConfig, setIsLoadingConfig] = useState(false);
    const [currentConfig, setCurrentConfig] = useState<EarningsConfigResponse | null>(null);
    
    // Franchise mode state
    const [selectedFranchise, setSelectedFranchise] = useState<string>('');
    
    // Driver mode state
    const [selectedDrivers, setSelectedDrivers] = useState<Set<string>>(new Set());
    const [selectedDriverForView, setSelectedDriverForView] = useState<string>('');
    const [driverConfig, setDriverConfig] = useState<EarningsConfigResponse | null>(null);
    const [franchiseDrivers, setFranchiseDrivers] = useState<Array<{ id: string; firstName: string; lastName: string; phone: string }>>([]);
    const [isLoadingFranchiseDrivers, setIsLoadingFranchiseDrivers] = useState(false);
    
    const [formData, setFormData] = useState({
        dailyTargetDefault: 1250,
        incentiveTier1Min: 1250,
        incentiveTier1Max: 1550,
        incentiveTier1Type: 'full_extra',
        incentiveTier2Min: 1550,
        incentiveTier2Percent: 20,
        monthlyBonusTiers: [
            { minEarnings: 25000, bonus: 3000 },
            { minEarnings: 28000, bonus: 500 },
        ] as Array<{ minEarnings: number; bonus: number }>,
        monthlyDeductionTiers: [
            { maxEarnings: 26000, cutPercent: 25 },
            { maxEarnings: 22000, cutPercent: 20 },
        ] as Array<{ maxEarnings: number; cutPercent: number }>,
    });

    useEffect(() => {
        dispatch(fetchDrivers());
        if (mode === 'all') {
            dispatch(fetchEarningsConfig());
        }
    }, [dispatch, mode]);

    useEffect(() => {
        if (mode === 'all' && globalConfig) {
            loadConfigIntoForm(globalConfig);
        }
    }, [globalConfig, mode]);

    useEffect(() => {
        if (mode === 'franchise' && selectedFranchise) {
            loadFranchiseConfig(selectedFranchise);
        }
    }, [mode, selectedFranchise]);

    useEffect(() => {
        if (mode === 'driver' && selectedFranchise && selectedFranchise !== 'all') {
            loadFranchiseDrivers(selectedFranchise);
        } else if (mode === 'driver' && selectedFranchise === 'all') {
            setFranchiseDrivers([]);
        }
    }, [mode, selectedFranchise]);

    useEffect(() => {
        if (mode === 'driver' && selectedDriverForView) {
            loadDriverConfig(selectedDriverForView);
        }
    }, [mode, selectedDriverForView]);

    const loadConfigIntoForm = (config: EarningsConfigResponse) => {
        setCurrentConfig(config);
        setFormData({
            dailyTargetDefault: config.dailyTargetDefault || 1250,
            incentiveTier1Min: config.incentiveTier1Min || 1250,
            incentiveTier1Max: config.incentiveTier1Max || 1550,
            incentiveTier1Type: config.incentiveTier1Type || 'full_extra',
            incentiveTier2Min: config.incentiveTier2Min || 1550,
            incentiveTier2Percent: config.incentiveTier2Percent || 20,
            monthlyBonusTiers: Array.isArray(config.monthlyBonusTiers) ? config.monthlyBonusTiers : [
                { minEarnings: 25000, bonus: 3000 },
                { minEarnings: 28000, bonus: 500 },
            ],
            monthlyDeductionTiers: Array.isArray(config.monthlyDeductionTiers) ? config.monthlyDeductionTiers : [
                { maxEarnings: 26000, cutPercent: 25 },
                { maxEarnings: 22000, cutPercent: 20 },
            ],
        });
    };

    const loadFranchiseConfig = async (franchiseId: string) => {
        setIsLoadingConfig(true);
        try {
            const response = await getEarningsConfigByFranchise(franchiseId);
            loadConfigIntoForm(response.data);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error?.response?.data?.error || error?.message || 'Failed to load franchise configuration',
                variant: 'error',
            });
        } finally {
            setIsLoadingConfig(false);
        }
    };

    const loadDriverConfig = async (driverId: string) => {
        setIsLoadingConfig(true);
        try {
            const response = await getEarningsConfigByDriver(driverId);
            setDriverConfig(response.data);
            loadConfigIntoForm(response.data);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error?.response?.data?.error || error?.message || 'Failed to load driver configuration',
                variant: 'error',
            });
        } finally {
            setIsLoadingConfig(false);
        }
    };

    const loadFranchiseDrivers = async (franchiseId: string) => {
        setIsLoadingFranchiseDrivers(true);
        try {
            const personnel = await getFranchisePersonnel(franchiseId);
            // Map drivers to the format expected by the component
            const driversList = personnel.drivers.map(driver => ({
                id: driver.id,
                firstName: driver.firstName || driver.name?.split(' ')[0] || '',
                lastName: driver.lastName || driver.name?.split(' ').slice(1).join(' ') || '',
                phone: driver.phone,
            }));
            setFranchiseDrivers(driversList);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error?.response?.data?.error || error?.message || 'Failed to load franchise drivers',
                variant: 'error',
            });
            setFranchiseDrivers([]);
        } finally {
            setIsLoadingFranchiseDrivers(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            if (mode === 'all') {
                await dispatch(updateEarningsConfig(formData)).unwrap();
                toast({
                    title: 'Success',
                    description: 'Global earnings configuration updated successfully',
                    variant: 'success',
                });
            } else if (mode === 'franchise') {
                if (!selectedFranchise) {
                    toast({
                        title: 'Error',
                        description: 'Please select a franchise',
                        variant: 'error',
                    });
                    setIsSubmitting(false);
                    return;
                }
                await setFranchiseEarningsConfig(selectedFranchise, formData);
                toast({
                    title: 'Success',
                    description: 'Franchise earnings configuration updated successfully',
                    variant: 'success',
                });
            } else if (mode === 'driver') {
                if (selectedDrivers.size === 0 && !selectedDriverForView) {
                    toast({
                        title: 'Error',
                        description: 'Please select at least one driver',
                        variant: 'error',
                    });
                    setIsSubmitting(false);
                    return;
                }
                
                const driverIds = selectedDrivers.size > 0 
                    ? Array.from(selectedDrivers).map(id => {
                        const driver = drivers.find(d => d._id.toString() === id || d.id === id);
                        return driver?.id || id;
                    })
                    : [drivers.find(d => d._id.toString() === selectedDriverForView || d.id === selectedDriverForView)?.id || selectedDriverForView];
                
                await setDriverEarningsConfig(driverIds, formData);
                toast({
                    title: 'Success',
                    description: `Earnings configuration updated for ${driverIds.length} driver(s)`,
                    variant: 'success',
                });
                
                // Reset selections
                setSelectedDrivers(new Set());
                setSelectedDriverForView('');
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error?.response?.data?.error || error?.message || 'Failed to update earnings configuration',
                variant: 'error',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const addBonusTier = () => {
        setFormData(prev => ({
            ...prev,
            monthlyBonusTiers: [...prev.monthlyBonusTiers, { minEarnings: 0, bonus: 0 }],
        }));
    };

    const removeBonusTier = (index: number) => {
        setFormData(prev => ({
            ...prev,
            monthlyBonusTiers: prev.monthlyBonusTiers.filter((_, i) => i !== index),
        }));
    };

    const updateBonusTier = (index: number, field: 'minEarnings' | 'bonus', value: number) => {
        setFormData(prev => ({
            ...prev,
            monthlyBonusTiers: prev.monthlyBonusTiers.map((tier, i) =>
                i === index ? { ...tier, [field]: value } : tier
            ),
        }));
    };

    const addDeductionTier = () => {
        setFormData(prev => ({
            ...prev,
            monthlyDeductionTiers: [...prev.monthlyDeductionTiers, { maxEarnings: 0, cutPercent: 0 }],
        }));
    };

    const removeDeductionTier = (index: number) => {
        setFormData(prev => ({
            ...prev,
            monthlyDeductionTiers: prev.monthlyDeductionTiers.filter((_, i) => i !== index),
        }));
    };

    const updateDeductionTier = (index: number, field: 'maxEarnings' | 'cutPercent', value: number) => {
        setFormData(prev => ({
            ...prev,
            monthlyDeductionTiers: prev.monthlyDeductionTiers.map((tier, i) =>
                i === index ? { ...tier, [field]: value } : tier
            ),
        }));
    };

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

    const handleSelectAllDrivers = () => {
        const filtered = drivers.filter(d => {
            if (selectedFranchise === 'all') return true;
            const driverFranchiseId = typeof d.franchiseId === 'number' 
                ? d.franchiseId.toString() 
                : d.franchiseId;
            return driverFranchiseId === selectedFranchise;
        });
        
        if (selectedDrivers.size === filtered.length) {
            setSelectedDrivers(new Set());
        } else {
            setSelectedDrivers(new Set(filtered.map(d => d.id || d._id.toString())));
        }
    };

    // Use franchise drivers if available, otherwise fall back to filtering all drivers
    const filteredDrivers = mode === 'driver' && selectedFranchise !== 'all' && franchiseDrivers.length > 0
        ? franchiseDrivers.map(d => ({
            _id: d.id,
            id: d.id,
            firstName: d.firstName,
            lastName: d.lastName,
            driverPhone: d.phone,
            franchiseId: selectedFranchise,
        }))
        : drivers.filter(d => {
            if (mode !== 'driver' || selectedFranchise === 'all') return true;
            const driverFranchiseId = typeof d.franchiseId === 'number' 
                ? d.franchiseId.toString() 
                : d.franchiseId;
            return driverFranchiseId === selectedFranchise;
        });

    if (isLoadingGlobal && mode === 'all' && !globalConfig) {
        return (
            <div className="flex flex-col gap-6 animate-in fade-in duration-500">
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-12 text-center">
                    <p className="text-[#49659c]">Loading configuration...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white">Driver Earnings Configuration</h2>
                    <p className="text-[#49659c] dark:text-gray-400">Configure earnings rules, incentives, and deductions</p>
                </div>
            </div>

            {/* Mode Toggle */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-4">
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setMode('all');
                            setSelectedFranchise('');
                            setSelectedDrivers(new Set());
                            setSelectedDriverForView('');
                        }}
                        className={cn(
                            "flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                            mode === 'all'
                                ? 'bg-[#0d59f2] text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                        )}
                    >
                        <Users size={16} />
                        All Drivers
                    </button>
                    <button
                        onClick={() => {
                            setMode('franchise');
                            setSelectedDrivers(new Set());
                            setSelectedDriverForView('');
                        }}
                        className={cn(
                            "flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                            mode === 'franchise'
                                ? 'bg-[#0d59f2] text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                        )}
                    >
                        <Building2 size={16} />
                        By Franchise
                    </button>
                    <button
                        onClick={() => {
                            setMode('driver');
                            setSelectedFranchise('all');
                        }}
                        className={cn(
                            "flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                            mode === 'driver'
                                ? 'bg-[#0d59f2] text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                        )}
                    >
                        <Truck size={16} />
                        By Driver(s)
                    </button>
                </div>
            </div>

            {/* Mode-specific selectors */}
            {mode === 'franchise' && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-4">
                    <label className="text-sm font-bold text-[#49659c] uppercase tracking-wider mb-2 block">
                        Select Franchise
                    </label>
                    <select
                        value={selectedFranchise}
                        onChange={(e) => setSelectedFranchise(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white"
                    >
                        <option value="">Select a franchise</option>
                        {franchises.map(franchise => (
                            <option key={franchise._id} value={franchise._id}>
                                {franchise.name} ({franchise.code})
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {mode === 'driver' && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 space-y-4">
                    <div>
                        <label className="text-sm font-bold text-[#49659c] uppercase tracking-wider mb-2 block">
                            Filter by Franchise (Optional)
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

                    <div>
                        <label className="text-sm font-bold text-[#49659c] uppercase tracking-wider mb-2 block">
                            View Config for Single Driver (Optional)
                        </label>
                        {isLoadingFranchiseDrivers && selectedFranchise !== 'all' ? (
                            <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-[#49659c]">
                                Loading drivers...
                            </div>
                        ) : (
                            <select
                                value={selectedDriverForView}
                                onChange={(e) => {
                                    setSelectedDriverForView(e.target.value);
                                    setSelectedDrivers(new Set());
                                }}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white"
                            >
                                <option value="">Select a driver to view/edit config</option>
                                {filteredDrivers.map(driver => (
                                    <option key={driver._id || driver.id} value={(driver._id || driver.id).toString()}>
                                        {driver.firstName} {driver.lastName} ({driver.driverPhone || driver.phone})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {!selectedDriverForView && (
                        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                                <label className="text-sm font-bold text-[#49659c] uppercase tracking-wider">
                                    Select Drivers to Update
                                </label>
                                <button
                                    type="button"
                                    onClick={handleSelectAllDrivers}
                                    className="text-xs text-[#0d59f2] hover:underline"
                                >
                                    {selectedDrivers.size === filteredDrivers.length ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {filteredDrivers.map(driver => {
                                    const driverId = driver.id || driver._id.toString();
                                    return (
                                        <label
                                            key={driver._id}
                                            className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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
                    )}
                </div>
            )}

            {/* Loading state for franchise/driver config */}
            {isLoadingConfig && (mode === 'franchise' || mode === 'driver') && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-12 text-center">
                    <p className="text-[#49659c]">Loading configuration...</p>
                </div>
            )}

            {/* Configuration Form */}
            {(!isLoadingConfig || mode === 'all') && (
                <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
                    <div className="space-y-8">
                        {/* Daily Target Default */}
                        <div>
                            <label className="text-sm font-bold text-[#49659c] uppercase tracking-wider mb-2 block flex items-center gap-2">
                                <Target size={16} />
                                Daily Target Default (₹)
                            </label>
                            <input
                                type="number"
                                value={formData.dailyTargetDefault}
                                onChange={(e) => setFormData(prev => ({ ...prev, dailyTargetDefault: parseInt(e.target.value) || 0 }))}
                                required
                                min="0"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white"
                            />
                            <p className="text-xs text-gray-500 mt-1">Default daily target amount</p>
                        </div>

                        {/* Incentive Tier 1 */}
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                            <h3 className="text-sm font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                                <TrendingUp size={16} />
                                Incentive Tier 1
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-[#49659c] uppercase tracking-wider mb-2 block">
                                        Minimum (₹)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.incentiveTier1Min}
                                        onChange={(e) => setFormData(prev => ({ ...prev, incentiveTier1Min: parseInt(e.target.value) || 0 }))}
                                        required
                                        min="0"
                                        className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[#49659c] uppercase tracking-wider mb-2 block">
                                        Maximum (₹)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.incentiveTier1Max}
                                        onChange={(e) => setFormData(prev => ({ ...prev, incentiveTier1Max: parseInt(e.target.value) || 0 }))}
                                        required
                                        min="0"
                                        className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[#49659c] uppercase tracking-wider mb-2 block">
                                        Type
                                    </label>
                                    <select
                                        value={formData.incentiveTier1Type}
                                        onChange={(e) => setFormData(prev => ({ ...prev, incentiveTier1Type: e.target.value }))}
                                        className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white"
                                    >
                                        <option value="full_extra">Full Extra</option>
                                        <option value="percentage">Percentage</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Incentive Tier 2 */}
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                            <h3 className="text-sm font-bold text-[#0d121c] dark:text-white mb-4 flex items-center gap-2">
                                <TrendingUp size={16} />
                                Incentive Tier 2
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-[#49659c] uppercase tracking-wider mb-2 block">
                                        Minimum (₹)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.incentiveTier2Min}
                                        onChange={(e) => setFormData(prev => ({ ...prev, incentiveTier2Min: parseInt(e.target.value) || 0 }))}
                                        required
                                        min="0"
                                        className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[#49659c] uppercase tracking-wider mb-2 block">
                                        Percentage (%)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.incentiveTier2Percent}
                                        onChange={(e) => setFormData(prev => ({ ...prev, incentiveTier2Percent: parseInt(e.target.value) || 0 }))}
                                        required
                                        min="0"
                                        max="100"
                                        className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Monthly Bonus Tiers */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <label className="text-sm font-bold text-[#49659c] uppercase tracking-wider flex items-center gap-2">
                                    <DollarSign size={16} />
                                    Monthly Bonus Tiers
                                </label>
                                <button
                                    type="button"
                                    onClick={addBonusTier}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#0d59f2] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                                >
                                    <Plus size={14} />
                                    Add Tier
                                </button>
                            </div>
                            <div className="space-y-3">
                                {formData.monthlyBonusTiers.map((tier, index) => (
                                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                        <div className="flex-1 grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs font-bold text-[#49659c] mb-1 block">Min Earnings (₹)</label>
                                                <input
                                                    type="number"
                                                    value={tier.minEarnings}
                                                    onChange={(e) => updateBonusTier(index, 'minEarnings', parseInt(e.target.value) || 0)}
                                                    required
                                                    min="0"
                                                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-[#49659c] mb-1 block">Bonus (₹)</label>
                                                <input
                                                    type="number"
                                                    value={tier.bonus}
                                                    onChange={(e) => updateBonusTier(index, 'bonus', parseInt(e.target.value) || 0)}
                                                    required
                                                    min="0"
                                                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white"
                                                />
                                            </div>
                                        </div>
                                        {formData.monthlyBonusTiers.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeBonusTier(index)}
                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                            >
                                                <X size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Monthly Deduction Tiers */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <label className="text-sm font-bold text-[#49659c] uppercase tracking-wider flex items-center gap-2">
                                    <TrendingDown size={16} />
                                    Monthly Deduction Tiers
                                </label>
                                <button
                                    type="button"
                                    onClick={addDeductionTier}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#0d59f2] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                                >
                                    <Plus size={14} />
                                    Add Tier
                                </button>
                            </div>
                            <div className="space-y-3">
                                {formData.monthlyDeductionTiers.map((tier, index) => (
                                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                        <div className="flex-1 grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs font-bold text-[#49659c] mb-1 block">Max Earnings (₹)</label>
                                                <input
                                                    type="number"
                                                    value={tier.maxEarnings}
                                                    onChange={(e) => updateDeductionTier(index, 'maxEarnings', parseInt(e.target.value) || 0)}
                                                    required
                                                    min="0"
                                                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-[#49659c] mb-1 block">Cut Percent (%)</label>
                                                <input
                                                    type="number"
                                                    value={tier.cutPercent}
                                                    onChange={(e) => updateDeductionTier(index, 'cutPercent', parseInt(e.target.value) || 0)}
                                                    required
                                                    min="0"
                                                    max="100"
                                                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white"
                                                />
                                            </div>
                                        </div>
                                        {formData.monthlyDeductionTiers.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeDeductionTier(index)}
                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                            >
                                                <X size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                            <button
                                type="submit"
                                disabled={isSubmitting || (mode === 'franchise' && !selectedFranchise) || (mode === 'driver' && selectedDrivers.size === 0 && !selectedDriverForView)}
                                className="flex-1 bg-[#0d59f2] text-white py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#0d59f2]/90 shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save size={18} />
                                <span>{isSubmitting ? 'Saving...' : `Save ${mode === 'all' ? 'Global' : mode === 'franchise' ? 'Franchise' : 'Driver'} Configuration`}</span>
                            </button>
                        </div>
                    </div>
                </form>
            )}
        </div>
    );
}
