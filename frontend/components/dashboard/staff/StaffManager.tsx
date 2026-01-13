"use client";

import React, { useState } from 'react';
import { useAppSelector } from '@/lib/hooks';
import { StaffList } from './StaffList';
import { StaffDetails } from './StaffDetails';
import { CreateStaffForm } from './CreateStaffForm';
import { Staff } from '@/lib/types/staff';

export function StaffManager() {
    const { selectedStaff } = useAppSelector((state) => state.staff);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

    const handleEdit = (staff: Staff) => {
        setEditingStaff(staff);
        setIsCreateOpen(true);
    };

    const handleClose = () => {
        setIsCreateOpen(false);
        setEditingStaff(null);
    };

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
