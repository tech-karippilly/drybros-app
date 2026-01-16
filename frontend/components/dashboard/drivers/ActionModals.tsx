"use client";

import React from 'react';
import { Trash2, Ban } from 'lucide-react';

interface DeleteDriverModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    driverName: string;
}

export function DeleteDriverModal({ isOpen, onClose, onConfirm, driverName }: DeleteDriverModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#0d121c]/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#101622] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                <div className="p-8 text-center">
                    <div className="size-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
                        <Trash2 size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-[#0d121c] dark:text-white mb-2">Delete Driver</h3>
                    <p className="text-[#49659c] dark:text-gray-400 mb-8">
                        Are you sure you want to <span className="text-red-600 font-bold uppercase">delete</span> <span className="font-bold text-[#0d121c] dark:text-white">{driverName}</span>? This action is irreversible and will permanently remove all driver data.
                    </p>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={onConfirm}
                            className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-xl shadow-red-500/20 active:scale-95"
                        >
                            Confirm Deletion
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-4 bg-gray-50 dark:bg-gray-800 text-[#49659c] rounded-2xl font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface BanDriverModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    driverName: string;
}

export function BanDriverModal({ isOpen, onClose, onConfirm, driverName }: BanDriverModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#0d121c]/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#101622] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                <div className="p-8 text-center">
                    <div className="size-20 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-600">
                        <Ban size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-[#0d121c] dark:text-white mb-2">Block Driver</h3>
                    <p className="text-[#49659c] dark:text-gray-400 mb-8">
                        Are you sure you want to <span className="text-amber-600 font-bold uppercase">block</span> <span className="font-bold text-[#0d121c] dark:text-white">{driverName}</span>? This will prevent them from accessing the system.
                    </p>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={onConfirm}
                            className="w-full py-4 bg-amber-600 text-white rounded-2xl font-bold hover:bg-amber-700 transition-all shadow-xl shadow-amber-500/20 active:scale-95"
                        >
                            Confirm Block
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-4 bg-gray-50 dark:bg-gray-800 text-[#49659c] rounded-2xl font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
