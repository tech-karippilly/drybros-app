"use client";

import React, { useState } from 'react';
import { Flame, Ban, Info } from 'lucide-react';

interface FireModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    staffName: string;
}

export function FireModal({ isOpen, onClose, onConfirm, staffName }: FireModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#0d121c]/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#101622] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                <div className="p-8 text-center">
                    <div className="size-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
                        <Flame size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-[#0d121c] dark:text-white mb-2">Terminate Employment</h3>
                    <p className="text-[#49659c] dark:text-gray-400 mb-8">
                        Are you sure you want to <span className="text-red-600 font-bold uppercase">fire</span> <span className="font-bold text-[#0d121c] dark:text-white">{staffName}</span>? This action is irreversible and will revoke all access.
                    </p>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={onConfirm}
                            className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-xl shadow-red-500/20 active:scale-95"
                        >
                            Confirm Termination
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-4 bg-gray-50 dark:bg-gray-800 text-[#49659c] rounded-2xl font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                        >
                            Keep Employee
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface SuspendModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (duration: string) => void;
    staffName: string;
}

export function SuspendModal({ isOpen, onClose, onConfirm, staffName }: SuspendModalProps) {
    const [duration, setDuration] = useState("1 month");

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#0d121c]/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#101622] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                <div className="p-8">
                    <div className="size-16 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mb-6 text-amber-600">
                        <Ban size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-[#0d121c] dark:text-white mb-2">Suspend Staff</h3>
                    <p className="text-[#49659c] dark:text-gray-400 mb-6 text-sm">
                        Apply a temporary suspension for <span className="font-bold text-[#0d121c] dark:text-white uppercase tracking-wider">{staffName}</span>. Access will be limited during this period.
                    </p>

                    <div className="space-y-4 mb-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[#49659c] uppercase tracking-widest flex items-center gap-2">
                                <Info size={12} /> Suspension Duration
                            </label>
                            <input
                                autoFocus
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                placeholder="e.g. 3 months, 1 week"
                                className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500/20 dark:text-white font-bold"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-2xl font-bold text-[#49659c] hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => onConfirm(duration)}
                            className="flex-[2] py-4 bg-amber-500 text-white rounded-2xl font-bold hover:bg-amber-600 transition-all shadow-xl shadow-amber-500/20 active:scale-95"
                        >
                            Suspend Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
