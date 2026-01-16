"use client";

import React from 'react';
import {
    ArrowLeft,
    Phone,
    Mail,
    MapPin,
    Calendar,
    CreditCard,
    FileText,
    Briefcase,
    Star,
    TrendingUp,
    Clock,
    Edit2,
    FileCheck,
    Heart,
    Shield,
    AlertTriangle,
    Ban,
    User
} from 'lucide-react';
import { GetDriver, DriverStatus } from '@/lib/types/drivers';
import { cn } from '@/lib/utils';
import { useAppDispatch } from '@/lib/hooks';
import { deleteDriver, banDriver, reactivateDriver } from '@/lib/features/drivers/driverSlice';
import { DeleteDriverModal, BanDriverModal } from './ActionModals';

interface DriverDetailsProps {
    driver: GetDriver | null;
    onBack: () => void;
    onEdit: () => void;
}

// Memoized StatusBadge component moved outside
const StatusBadge = React.memo(({ status }: { status: DriverStatus }) => {
    const styles = {
        [DriverStatus.ACTIVE]: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
        [DriverStatus.INACTIVE]: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
        [DriverStatus.BLOCKED]: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
        [DriverStatus.TERMINATED]: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    };
    return (
        <span className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider", styles[status] || styles[DriverStatus.INACTIVE])}>
            {status === DriverStatus.ACTIVE ? 'Active' : status === DriverStatus.INACTIVE ? 'Inactive' : status === DriverStatus.BLOCKED ? 'Blocked' : 'Terminated'}
        </span>
    );
});
StatusBadge.displayName = 'StatusBadge';

export function DriverDetails({ driver, onBack, onEdit }: DriverDetailsProps) {
    const dispatch = useAppDispatch();
    const [deleteTarget, setDeleteTarget] = React.useState(false);
    const [banTarget, setBanTarget] = React.useState(false);

    // Memoized stats array with null checks
    const stats = React.useMemo(() => [
        { label: 'Current Rating', value: (driver?.currentRating ?? 0).toFixed(1), icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Daily Target', value: `₹${driver?.dailyTargetAmount ?? 0}`, icon: Clock, color: 'text-green-600', bg: 'bg-green-50' },
    ], [driver?.currentRating, driver?.dailyTargetAmount]);

    if (!driver) return null;

    return (
        <div className="flex flex-col gap-8 animate-in slide-in-from-right duration-500">
            {/* Top Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-[#49659c] hover:text-[#0d121c] dark:hover:text-white transition-all shadow-sm group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold">Back to Directory</span>
                </button>
                <div className="flex items-center gap-3">
                    <StatusBadge status={driver.status} />
                    <button
                        onClick={onEdit}
                        className="p-2.5 bg-[#0d59f2] text-white rounded-xl hover:bg-[#0d59f2]/90 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                    >
                        <Edit2 size={18} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm">
                        <div className="flex flex-col items-center text-center">
                            <div className="size-32 rounded-3xl bg-[#0d59f2]/10 border-4 border-white dark:border-gray-800 shadow-xl flex items-center justify-center text-[#0d59f2] text-4xl font-black mb-6">
                                {driver.profilePhoto ? <img src={driver.profilePhoto} alt="" className="size-full rounded-3xl object-cover" /> : driver.firstName.charAt(0)}
                            </div>
                            <h3 className="text-2xl font-black text-[#0d121c] dark:text-white">{driver.firstName} {driver.lastName}</h3>
                            <p className="text-[#49659c] font-bold uppercase tracking-widest text-[10px] mt-1">Driver ID: {driver._id}</p>

                            <div className="w-full mt-8 pt-8 border-t border-gray-50 dark:border-gray-800 space-y-4 text-left">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-[#49659c]">
                                        <Phone size={16} />
                                    </div>
                                    <span className="text-sm font-bold text-[#0d121c] dark:text-white truncate">{driver.driverPhone}</span>
                                </div>
                                {driver.driverAltPhone && (
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-[#49659c]">
                                            <Phone size={16} />
                                        </div>
                                        <span className="text-sm font-bold text-[#0d121c] dark:text-white">{driver.driverAltPhone}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-[#49659c]">
                                        <Mail size={16} />
                                    </div>
                                    <span className="text-sm font-bold text-[#0d121c] dark:text-white truncate">{driver.email}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-[#49659c]">
                                        <MapPin size={16} />
                                    </div>
                                    <span className="text-sm font-bold text-[#0d121c] dark:text-white leading-tight">{driver.address}, {driver.city}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Daily Target Glance */}
                    <div className="bg-[#0d121c] dark:bg-black rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 transition-opacity group-hover:opacity-20 translate-x-4 -translate-y-4">
                            <Briefcase size={120} />
                        </div>
                        <h4 className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Daily Target</h4>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black italic">₹</span>
                            <span className="text-4xl font-black">{driver.dailyTargetAmount.toLocaleString()}</span>
                        </div>
                        <p className="text-[#49659c] text-xs font-bold mt-2">Revenue Goal</p>
                    </div>
                    {/* Actions Panel */}
                    <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <AlertTriangle className="text-amber-500" size={20} />
                            <h4 className="font-black text-[#0d121c] dark:text-white uppercase tracking-widest text-xs">Administrative Actions</h4>
                        </div>
                        <div className="flex flex-col gap-4">
                            {driver.status !== DriverStatus.BLOCKED && driver.status !== DriverStatus.TERMINATED && (
                                <button
                                    onClick={() => setBanTarget(true)}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-500 rounded-2xl font-bold hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all border border-amber-200 dark:border-amber-800"
                                >
                                    <Ban size={18} />
                                    <span>Block Driver</span>
                                </button>
                            )}
                            {driver.status !== DriverStatus.TERMINATED && (
                                <button
                                    onClick={() => setDeleteTarget(true)}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-500 rounded-2xl font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-all border border-red-200 dark:border-red-800"
                                >
                                    <Ban size={18} />
                                    <span>Delete Driver</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>


                {/* Dashboard & Metrics */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Performance Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {stats.map((stat, i) => (
                            <div key={i} className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col gap-4">
                                <div className={cn("size-12 rounded-2xl flex items-center justify-center", stat.bg, stat.color)}>
                                    <stat.icon size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-[#49659c] uppercase tracking-widest">{stat.label}</p>
                                    <p className="text-3xl font-black text-[#0d121c] dark:text-white mt-1">{stat.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Information Grids */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Emergency Contact */}
                        {(driver.contactName || driver.contactNumber) && (
                            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <Heart className="text-red-500" size={20} />
                                    <h4 className="font-black text-[#0d121c] dark:text-white uppercase tracking-widest text-xs">Emergency Contact</h4>
                                </div>
                                <div className="space-y-6">
                                    {driver.contactName && (
                                        <div>
                                            <p className="text-[10px] font-black text-[#49659c] uppercase tracking-tight">Contact Name</p>
                                            <p className="font-bold text-[#0d121c] dark:text-white mt-1">{driver.contactName}</p>
                                        </div>
                                    )}
                                    {driver.contactNumber && (
                                        <div>
                                            <p className="text-[10px] font-black text-[#49659c] uppercase tracking-tight">Phone Number</p>
                                            <p className="font-bold text-[#0d121c] dark:text-white mt-1 tracking-wider">{driver.contactNumber}</p>
                                        </div>
                                    )}
                                    {driver.relationship && (
                                        <div>
                                            <p className="text-[10px] font-black text-[#49659c] uppercase tracking-tight">Relationship</p>
                                            <p className="font-bold text-[#0d121c] dark:text-white mt-1">{driver.relationship}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Documents */}
                        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <Shield className="text-[#0d59f2]" size={20} />
                                <h4 className="font-black text-[#0d121c] dark:text-white uppercase tracking-widest text-xs">Documents Verified</h4>
                            </div>
                            <div className="space-y-3">
                                {driver.documentsCollected.map((doc, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                                        <FileCheck size={16} className="text-green-600" />
                                        <span className="text-sm font-bold text-[#49659c] dark:text-gray-300">{doc}</span>
                                    </div>
                                ))}
                                {driver.documentsCollected.length === 0 && (
                                    <p className="text-sm text-[#49659c] italic">No documents verified yet.</p>
                                )}
                            </div>
                        </div>

                        {/* Employment Details */}
                        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <Briefcase className="text-[#0d59f2]" size={20} />
                                <h4 className="font-black text-[#0d121c] dark:text-white uppercase tracking-widest text-xs">Employment Details</h4>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] font-black text-[#49659c] uppercase tracking-tight">Franchise</p>
                                    <p className="font-bold text-[#0d121c] dark:text-white mt-1">{driver.franchiseName}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-[#49659c] uppercase tracking-tight">Assigned City</p>
                                    <p className="font-bold text-[#0d121c] dark:text-white mt-1">{driver.assignedCity}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-[#49659c] uppercase tracking-tight">Employment Type</p>
                                    <p className="font-bold text-[#0d121c] dark:text-white mt-1 capitalize">{driver.employmentType === 0 ? 'Full Time' : driver.employmentType === 1 ? 'Part Time' : 'Contract'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-[#49659c] uppercase tracking-tight">Date of Joining</p>
                                    <p className="font-bold text-[#0d121c] dark:text-white mt-1">{new Date(driver.dateOfJoining).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* License Details */}
                        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <FileText className="text-[#0d59f2]" size={20} />
                                <h4 className="font-black text-[#0d121c] dark:text-white uppercase tracking-widest text-xs">License Information</h4>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] font-black text-[#49659c] uppercase tracking-tight">License Number</p>
                                    <p className="font-bold text-[#0d121c] dark:text-white mt-1 font-mono">{driver.licenseNumber}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-[#49659c] uppercase tracking-tight">License Type</p>
                                    <p className="font-bold text-[#0d121c] dark:text-white mt-1">{driver.licenseType}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-[#49659c] uppercase tracking-tight">Expiry Date</p>
                                    <p className="font-bold text-[#0d121c] dark:text-white mt-1">{new Date(driver.licenseExpiryDate).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>


                        {/* Bank Details */}
                        <div className="md:col-span-2 bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <CreditCard className="text-[#0d59f2]" size={20} />
                                <h4 className="font-black text-[#0d121c] dark:text-white uppercase tracking-widest text-xs">Bank Information</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-[10px] font-black text-[#49659c] uppercase tracking-tight">Account Holder</p>
                                    <p className="font-bold text-[#0d121c] dark:text-white mt-1">{driver.accountHolderName}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-[#49659c] uppercase tracking-tight">Account Number</p>
                                    <p className="font-bold text-[#0d121c] dark:text-white mt-1 font-mono">{driver.bankAccountNumber}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-[#49659c] uppercase tracking-tight">IFSC Code</p>
                                    <p className="font-bold text-[#0d121c] dark:text-white mt-1 font-mono">{driver.ifscCode}</p>
                                </div>
                                {driver.upiId && (
                                    <div>
                                        <p className="text-[10px] font-black text-[#49659c] uppercase tracking-tight">UPI ID</p>
                                        <p className="font-bold text-[#0d121c] dark:text-white mt-1">{driver.upiId}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Modals */}
            <DeleteDriverModal
                isOpen={deleteTarget}
                driverName={`${driver.firstName} ${driver.lastName}`}
                onClose={() => setDeleteTarget(false)}
                onConfirm={() => {
                    dispatch(deleteDriver(driver._id));
                    setDeleteTarget(false);
                    onBack();
                }}
            />

            <BanDriverModal
                isOpen={banTarget}
                driverName={`${driver.firstName} ${driver.lastName}`}
                onClose={() => setBanTarget(false)}
                onConfirm={() => {
                    dispatch(banDriver(driver._id));
                    setBanTarget(false);
                }}
            />
        </div>
    );
}
