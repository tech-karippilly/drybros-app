"use client";

import React, { useState, useCallback } from 'react';
import { CashSettlementForm } from './CashSettlementForm';

export function CashSettlementManager() {
    const [isFormOpen, setIsFormOpen] = useState(false);

    const handleClose = useCallback(() => {
        setIsFormOpen(false);
    }, []);

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-[#0d121c] dark:text-white mb-2">
                            Cash Settlement
                        </h1>
                        <p className="text-sm text-[#49659c] dark:text-gray-400">
                            Submit cash collected by drivers after trips
                        </p>
                    </div>

                    <CashSettlementForm onClose={handleClose} />
                </div>
            </div>
        </div>
    );
}
