"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { StaffList } from './StaffList';
import { StaffDetails } from './StaffDetails';
import { CreateStaffForm } from './CreateStaffForm';
import { Staff } from '@/lib/types/staff';
import { fetchStaffList } from '@/lib/features/staff/staffSlice';
import { STORAGE_KEYS } from '@/lib/constants/auth';

export function StaffManager() {
    const dispatch = useAppDispatch();
    const { selectedStaff } = useAppSelector((state) => state.staff);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

    useEffect(() => {
        const loadStaff = async () => {
            if (typeof window !== 'undefined') {
                const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
                if (!token) {
                    console.warn('No access token found. User may need to login.');
                    return;
                }
            }
            try {
                await dispatch(
                    fetchStaffList({ page: 1, limit: 10 })
                ).unwrap();
            } catch (err) {
                console.error('Failed to fetch staff list:', err);
            }
        };
        loadStaff();
    }, [dispatch]);

    const handleEdit = useCallback((staff: Staff) => {
        setEditingStaff(staff);
        setIsCreateOpen(true);
    }, []);

    const handleClose = useCallback(() => {
        setIsCreateOpen(false);
        setEditingStaff(null);
    }, []);

    // If a staff is selected, show details view
    if (selectedStaff && !isCreateOpen) {
        return <StaffDetails onEditClick={() => handleEdit(selectedStaff)} />;
    }

    return (
        <div className="relative">
            <StaffList
                onCreateClick={() => setIsCreateOpen(true)}
                onEditClick={handleEdit}
            />

            {isCreateOpen && (
                <CreateStaffForm
                    onClose={handleClose}
                    editingStaff={editingStaff}
                />
            )}
        </div>
    );
}
