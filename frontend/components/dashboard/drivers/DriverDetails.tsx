"use client";

import React from 'react';
import { 
    X, Phone, Mail, MapPin, Calendar, CreditCard, 
    FileText, Briefcase, Star, TrendingUp, Clock, User
} from 'lucide-react';
import { GetDriver, DriverStatus } from '@/lib/types/drivers';
import { cn } from '@/lib/utils';

interface DriverDetailsProps {
    isOpen: boolean;
    onClose: () => void;
    driver: GetDriver | null;
}

export function DriverDetails({ isOpen, onClose, driver }: DriverDetailsProps) {
    if (!isOpen || !driver) return null;

    const StatusBadge = ({ status }: { status: DriverStatus }) => {
        const styles = {
            [DriverStatus.ACTIVE]: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
            [DriverStatus.INACTIVE]: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
            [DriverStatus.BLOCKED]: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
            [DriverStatus.TERMINATED]: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
        };
        return (
            <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider", styles[status] || styles[DriverStatus.INACTIVE])}>
                {status}
            </span>
        );
    };

    const InfoCard = ({ icon: Icon, label, value, subValue }: any) => (
        <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg text-[#0d59f2] shadow-sm">
                <Icon size={18} />
            </div>
            <div>
                <p className="text-xs text-[#49659c] font-black uppercase tracking-wider mb-0.5">{label}</p>
                <p className="font-bold text-[#0d121c] dark:text-gray-100">{value || 'N/A'}</p>
                {subValue && <p className="text-xs text-[#49659c] mt-0.5">{subValue}</p>}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-[#0d121c]/40 backdrop-blur-sm z-[100] flex justify-end">
            <div className="w-full max-w-md bg-white dark:bg-[#101622] h-full shadow-2xl overflow-hidden animate-in slide-in-from-right duration-300 flex flex-col">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-800 z-10 sticky top-0">
                    <h3 className="font-bold text-lg dark:text-white">Driver Profile</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-[#49659c]">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* Header */}
                    <div className="p-6 text-center border-b border-gray-100 dark:border-gray-800 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-[#101622]">
                        <div className="size-24 rounded-full bg-[#0d59f2] text-white flex items-center justify-center text-3xl font-bold mx-auto mb-4 shadow-lg shadow-blue-500/30">
                            {driver.profilePhoto ? <img src={driver.profilePhoto} alt="" className="size-full rounded-full object-cover" /> : driver.firstName.charAt(0)}
                        </div>
                        <h2 className="text-2xl font-bold text-[#0d121c] dark:text-white">{driver.firstName} {driver.lastName}</h2>
                        <div className="flex items-center justify-center gap-2 mt-2">
                             <StatusBadge status={driver.status} />
                             <span className="text-sm font-medium text-[#49659c]">ID: {driver._id}</span>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-0 border-b border-gray-100 dark:border-gray-800">
                        <div className="p-4 text-center border-r border-gray-100 dark:border-gray-800">
                            <div className="flex items-center justify-center gap-1.5 text-[#0d59f2] mb-1">
                                <TrendingUp size={16} />
                                <span className="font-bold text-lg">0</span>
                            </div>
                            <p className="text-[10px] font-black uppercase text-[#49659c] tracking-wider">Trips</p>
                        </div>
                        <div className="p-4 text-center border-r border-gray-100 dark:border-gray-800">
                             <div className="flex items-center justify-center gap-1.5 text-orange-500 mb-1">
                                <Star size={16} fill="currentColor" />
                                <span className="font-bold text-lg">0.0</span>
                            </div>
                            <p className="text-[10px] font-black uppercase text-[#49659c] tracking-wider">Rating</p>
                        </div>
                        <div className="p-4 text-center">
                             <div className="flex items-center justify-center gap-1.5 text-green-600 mb-1">
                                <Clock size={16} />
                                <span className="font-bold text-lg">0h</span>
                            </div>
                            <p className="text-[10px] font-black uppercase text-[#49659c] tracking-wider">Online</p>
                        </div>
                    </div>

                    <div className="p-6 space-y-8">
                        {/* Contact Info */}
                        <section className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-[#49659c] flex items-center gap-2">
                                <User size={14} /> Contact Information
                            </h4>
                            <div className="grid gap-3">
                                <InfoCard icon={Phone} label="Mobile Number" value={driver.driverPhone} subValue={driver.driverAltPhone ? `Alt: ${driver.driverAltPhone}` : null} />
                                <InfoCard icon={MapPin} label="Address" value={`${driver.address}, ${driver.city}`} subValue={`${driver.state} - ${driver.pincode}`} />
                            </div>
                        </section>

                        {/* Employment */}
                         <section className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-[#49659c] flex items-center gap-2">
                                <Briefcase size={14} /> Employment
                            </h4>
                            <div className="grid gap-3">
                                <InfoCard icon={Briefcase} label="Franchise" value={driver.franchiseName || 'N/A'} subValue={driver.assignedCity ? `Assigned to: ${driver.assignedCity}` : null} />
                                <InfoCard icon={Calendar} label="Date of Joining" value={new Date(driver.dateOfJoining).toLocaleDateString()} subValue={driver.employmentType} />
                            </div>
                        </section>

                        {/* Legal */}
                        <section className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-[#49659c] flex items-center gap-2">
                                <FileText size={14} /> Legal Documents
                            </h4>
                             <div className="grid gap-3">
                                <InfoCard icon={CreditCard} label="Driving License" value={driver.licenseNumber} subValue={`Expires: ${new Date(driver.licenseExpiryDate).toLocaleDateString()}`} />
                                {driver.licenseType && <InfoCard icon={FileText} label="License Type" value={driver.licenseType} />}
                            </div>
                        </section>

                        {/* Bank Details */}
                         <section className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-[#49659c] flex items-center gap-2">
                                <CreditCard size={14} /> Bank Details
                            </h4>
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800 space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-xs text-[#49659c]">Account Holder</span>
                                    <span className="text-sm font-bold dark:text-white">{driver.accountHolderName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-xs text-[#49659c]">Account Number</span>
                                    <span className="text-sm font-bold font-mono dark:text-white">{driver.bankAccountNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-xs text-[#49659c]">IFSC Code</span>
                                    <span className="text-sm font-bold font-mono dark:text-white">{driver.ifscCode}</span>
                                </div>
                                 {driver.upiId && (
                                     <div className="flex justify-between">
                                        <span className="text-xs text-[#49659c]">UPI ID</span>
                                        <span className="text-sm font-bold dark:text-white">{driver.upiId}</span>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
