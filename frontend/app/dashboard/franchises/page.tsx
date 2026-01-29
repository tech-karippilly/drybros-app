"use client";

import React, { useEffect } from 'react';
import { useAppDispatch } from '@/lib/hooks';
import { fetchFranchises } from '@/lib/features/franchise/franchiseSlice';
import { FranchiseManager } from '@/components/dashboard/franchise/FranchiseManager';

export default function FranchisesPage() {
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(fetchFranchises());
    }, [dispatch]);

    return <FranchiseManager />;
}
