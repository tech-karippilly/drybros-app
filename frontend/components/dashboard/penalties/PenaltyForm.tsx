"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppDispatch } from '@/lib/hooks';
import { createPenalty, updatePenalty, setSelectedPenalty } from '@/lib/features/penalties/penaltiesSlice';
import { Penalty, CreatePenaltyInput, UpdatePenaltyInput } from '@/lib/types/penalties';
import { PENALTIES_STRINGS, PENALTY_TYPES } from '@/lib/constants/penalties';
import { Input, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';

interface PenaltyFormProps {
    isOpen: boolean;
    onClose: () => void;
    penalty?: Penalty | null;
}

export function PenaltyForm({ isOpen, onClose, penalty }: PenaltyFormProps) {
    const dispatch = useAppDispatch();
    const { toast } = useToast();
    const [formData, setFormData] = useState<CreatePenaltyInput>({
        name: '',
        amount: 0,
        description: '',
        type: PENALTY_TYPES.PENALTY,
    });
    const [errors, setErrors] = useState<Partial<Record<keyof CreatePenaltyInput, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (penalty) {
            setFormData({
                name: penalty.name,
                amount: penalty.amount,
                description: penalty.description || '',
                type: penalty.type,
            });
        } else {
            setFormData({
                name: '',
                amount: 0,
                description: '',
                type: PENALTY_TYPES.PENALTY,
            });
        }
        setErrors({});
    }, [penalty, isOpen]);

    const validate = useCallback((): boolean => {
        const newErrors: Partial<Record<keyof CreatePenaltyInput, string>> = {};

        if (!formData.name.trim()) {
            newErrors.name = PENALTIES_STRINGS.NAME_REQUIRED;
        }

        if (formData.amount <= 0) {
            newErrors.amount = PENALTIES_STRINGS.AMOUNT_INVALID;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData.name, formData.amount]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        setIsSubmitting(true);
        try {
            if (penalty) {
                const updateInput: UpdatePenaltyInput = {
                    ...formData,
                    id: penalty.id,
                };
                await dispatch(updatePenalty(updateInput)).unwrap();
                toast({
                    title: "Success",
                    description: PENALTIES_STRINGS.UPDATE_SUCCESS,
                    variant: "success",
                });
            } else {
                await dispatch(createPenalty(formData)).unwrap();
                toast({
                    title: "Success",
                    description: PENALTIES_STRINGS.CREATE_SUCCESS,
                    variant: "success",
                });
            }
            onClose();
            dispatch(setSelectedPenalty(null));
        } catch (error: any) {
            // When using .unwrap(), the error is the payload from rejectWithValue
            // Our slice returns: { message, code, status }
            let errorMessage = PENALTIES_STRINGS.CREATE_ERROR;
            let errorTitle = "Error";
            
            // Extract error message from the error object
            if (error) {
                if (typeof error === 'object' && error.message) {
                    errorMessage = error.message;
                    
                    // Check for specific error types
                    if (error.status === 404 || error.code === 'ERR_NETWORK') {
                        errorTitle = "Backend Not Available";
                        errorMessage = "The penalties API endpoint is not yet implemented. Please implement the backend endpoints first.";
                    }
                } else if (typeof error === 'string') {
                    errorMessage = error;
                }
            }
            
            toast({
                title: errorTitle,
                description: errorMessage,
                variant: "error",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = useCallback((field: keyof CreatePenaltyInput, value: string | number) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    }, [errors]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={penalty ? PENALTIES_STRINGS.EDIT_TITLE : PENALTIES_STRINGS.CREATE_TITLE}
        >
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-[#0d121c] dark:text-white">
                        {PENALTIES_STRINGS.NAME} *
                    </label>
                    <Input
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder={PENALTIES_STRINGS.NAME_PLACEHOLDER}
                        className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && (
                        <p className="text-xs text-red-500">{errors.name}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-[#0d121c] dark:text-white">
                        {PENALTIES_STRINGS.TYPE} *
                    </label>
                    <select
                        value={formData.type}
                        onChange={(e) => handleChange('type', e.target.value as typeof formData.type)}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0d59f2]/20 dark:text-white"
                    >
                        <option value={PENALTY_TYPES.PENALTY}>{PENALTIES_STRINGS.TYPE_PENALTY}</option>
                        <option value={PENALTY_TYPES.DEDUCTION}>{PENALTIES_STRINGS.TYPE_DEDUCTION}</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-[#0d121c] dark:text-white">
                        {PENALTIES_STRINGS.AMOUNT} *
                    </label>
                    <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                        placeholder={PENALTIES_STRINGS.AMOUNT_PLACEHOLDER}
                        className={errors.amount ? 'border-red-500' : ''}
                    />
                    {errors.amount && (
                        <p className="text-xs text-red-500">{errors.amount}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-[#0d121c] dark:text-white">
                        {PENALTIES_STRINGS.DESCRIPTION}
                    </label>
                    <Textarea
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        placeholder={PENALTIES_STRINGS.DESCRIPTION_PLACEHOLDER}
                        rows={3}
                    />
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 sm:pt-4">
                    <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
                        {PENALTIES_STRINGS.CANCEL}
                    </Button>
                    <Button type="submit" variant="primary" isLoading={isSubmitting} className="w-full sm:w-auto">
                        {PENALTIES_STRINGS.SAVE}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
