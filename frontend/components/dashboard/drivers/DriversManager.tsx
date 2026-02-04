import React, { useState, useCallback, useEffect } from 'react';
import { DriversList } from './DriversList';
import { DriverForm } from './DriverForm';
import { DriverDetails } from './DriverDetails';
import { GetDriver } from '@/lib/types/drivers';
import { getDriverById } from '@/lib/features/drivers/driverApi';

export function DriversManager() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<GetDriver | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState<string | null>(null);

    const handleCreateClick = useCallback(() => {
        setSelectedDriver(null);
        setIsFormOpen(true);
    }, []);
        
    const handleEditClick = useCallback((driver: GetDriver) => {
        setSelectedDriver(driver);
        setIsDetailsOpen(false);
        setIsFormOpen(true);
    }, []);

    const handleViewClick = useCallback((driver: GetDriver) => {
        setSelectedDriver(driver);
        setIsDetailsOpen(true);
        setDetailsLoading(true);
        setDetailsError(null);
    }, []);

    const handleBackToList = useCallback(() => {
        setIsDetailsOpen(false);
        setSelectedDriver(null);
    }, []);

    const handleCloseForm = useCallback(() => {
        setIsFormOpen(false);
    }, []);

    // Fetch driver details by ID when details page opens
    useEffect(() => {
        if (isDetailsOpen && selectedDriver?.id) {
            setDetailsLoading(true);
            setDetailsError(null);
            
            getDriverById(selectedDriver.id)
                .then((response) => {
                    // Map documents from boolean flags to array
                    const documentsCollected: string[] = [];
                    const DOCUMENT_MAP = {
                        aadharCard: 'Govt Identity',
                        license: 'License',
                        educationCert: 'Educational Certificates',
                        previousExp: 'Previous Experience',
                    };
                    if (response.aadharCard) documentsCollected.push(DOCUMENT_MAP.aadharCard);
                    if (response.license) documentsCollected.push(DOCUMENT_MAP.license);
                    if (response.educationCert) documentsCollected.push(DOCUMENT_MAP.educationCert);
                    if (response.previousExp) documentsCollected.push(DOCUMENT_MAP.previousExp);

                    // Map API response to frontend GetDriver type
                    const apiDriver = response;
                    const dailyTarget = (apiDriver as any).dailyStatus?.dailyLimit?.dailyTargetAmount ?? apiDriver.dailyTargetAmount ?? 0;
                    
                    setSelectedDriver({
                        _id: selectedDriver._id,
                        id: apiDriver.id,
                        userId: selectedDriver.userId,
                        firstName: apiDriver.firstName,
                        lastName: apiDriver.lastName,
                        driverPhone: apiDriver.phone,
                        driverAltPhone: apiDriver.altPhone,
                        email: apiDriver.email,
                        status: selectedDriver.status,
                        complaintCount: apiDriver.complaintCount,
                        bannedGlobally: apiDriver.bannedGlobally,
                        dailyTargetAmount: dailyTarget,
                        currentRating: apiDriver.currentRating || 0,
                        createdAt: apiDriver.createdAt?.toString() || selectedDriver.createdAt,
                        updatedAt: apiDriver.updatedAt?.toString() || selectedDriver.updatedAt,
                        dateOfBirth: selectedDriver.dateOfBirth,
                        gender: selectedDriver.gender,
                        profilePhoto: selectedDriver.profilePhoto,
                        licenseNumber: apiDriver.licenseNumber,
                        licenseType: apiDriver.licenseType || 'LMV',
                        licenseFront: selectedDriver.licenseFront,
                        licenseBack: selectedDriver.licenseBack,
                        licenseExpiryDate: apiDriver.licenseExpDate?.toString() || selectedDriver.licenseExpiryDate,
                        documentsCollected,
                        address: apiDriver.address,
                        city: apiDriver.city,
                        state: apiDriver.state,
                        pincode: apiDriver.pincode,
                        franchiseId: selectedDriver.franchiseId,
                        franchiseName: selectedDriver.franchiseName,
                        dateOfJoining: selectedDriver.dateOfJoining,
                        assignedCity: apiDriver.city,
                        employmentType: selectedDriver.employmentType,
                        remainingDailyLimit: apiDriver.remainingDailyLimit,
                        bankAccountNumber: apiDriver.bankAccountNumber,
                        accountHolderName: apiDriver.bankAccountName,
                        ifscCode: apiDriver.bankIfscCode,
                        upiId: selectedDriver.upiId,
                        contactName: apiDriver.emergencyContactName,
                        contactNumber: apiDriver.emergencyContactPhone,
                        relationship: apiDriver.emergencyContactRelation,
                        carTypes: apiDriver.carTypes,
                        dailyStatus: (apiDriver as any).dailyStatus,
                    });
                    setDetailsLoading(false);
                })
                .catch((err) => {
                    setDetailsError(err?.response?.data?.error || err?.message || 'Failed to load driver details');
                    setDetailsLoading(false);
                });
        }
    }, [isDetailsOpen, selectedDriver?.id]);

    // If viewing driver details, show full-page details view
    if (isDetailsOpen && selectedDriver) {
        if (detailsLoading) {
            return (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0d59f2]"></div>
                        <p className="text-[#49659c] font-semibold">Loading driver details...</p>
                    </div>
                </div>
            );
        }

        if (detailsError) {
            return (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="flex flex-col items-center gap-4 bg-red-50 dark:bg-red-900/20 p-8 rounded-2xl border border-red-200 dark:border-red-800">
                        <p className="text-red-700 dark:text-red-400 font-semibold">{detailsError}</p>
                        <button
                            onClick={handleBackToList}
                            className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all"
                        >
                            Back to List
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <DriverDetails
                driver={selectedDriver}
                onBack={handleBackToList}
                onEdit={() => handleEditClick(selectedDriver)}
            />
        );
    }

    // If form is open, show full-page form
    if (isFormOpen) {
        return (
            <DriverForm
                isOpen={isFormOpen}
                driver={selectedDriver}
                onClose={handleCloseForm}
            />
        );
    }

    return (
        <DriversList
            onEditClick={handleEditClick}
            onCreateClick={handleCreateClick}
            onViewClick={handleViewClick}
        />
    );
}