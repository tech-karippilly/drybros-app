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
    const { selectedStaff, isLoading, list } = useAppSelector((state) => state.staff);
    const { activeTab } = useAppSelector((state) => state.auth);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

    // Fetch staff list when component mounts or when staff menu is clicked
    useEffect(() => {
        // Only fetch if staff tab is active
        if (activeTab === 'staff') {
            const loadStaff = async () => {
                // Check if token exists before making API call
                if (typeof window !== 'undefined') {
                    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
                    if (!token) {
                        console.warn('No access token found. User may need to login.');
                        return;
                    }
                }

                try {
                    // Fetch with current pagination settings
                    // The axios interceptor will automatically add the Authorization header
                    await dispatch(fetchStaffList({
                        page: 1,
                        limit: 10,
                    })).unwrap();
                } catch (error: any) {
                    // Error is handled by the slice
                    // If it's a 401 error, the interceptor will handle token refresh
                    // If refresh fails, interceptor will redirect to login
                    console.error('Failed to fetch staff list:', error);
                }
            };

            // Always fetch when staff tab is clicked to ensure fresh data
            loadStaff();
        }
    }, [dispatch, activeTab]);

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
