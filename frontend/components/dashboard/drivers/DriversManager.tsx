import React, { useState } from 'react';
import { DriversList } from './DriversList';
import { DriverForm } from './DriverForm';
import { DriverDetails } from './DriverDetails';
import { GetDriver } from '@/lib/types/drivers';

export function DriversManager() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<GetDriver | null>(null);

    const handleCreateClick = () => {
        setSelectedDriver(null);
        setIsFormOpen(true);
    };
        
    const handleEditClick = (driver: GetDriver) => {
        setSelectedDriver(driver);
        setIsDetailsOpen(false);
        setIsFormOpen(true);
    };

    const handleViewClick = (driver: GetDriver) => {
        setSelectedDriver(driver);
        setIsDetailsOpen(true);
    };

    const handleBackToList = () => {
        setIsDetailsOpen(false);
        setSelectedDriver(null);
    };

    // If viewing driver details, show full-page details view
    if (isDetailsOpen && selectedDriver) {
        return (
            <>
                <DriverDetails
                    driver={selectedDriver}
                    onBack={handleBackToList}
                    onEdit={() => handleEditClick(selectedDriver)}
                />
                
                <DriverForm
                    isOpen={isFormOpen}
                    driver={selectedDriver}
                    onClose={() => setIsFormOpen(false)}
                />
            </>
        );
    }

    return (
        <>
            <DriversList
                onEditClick={handleEditClick}
                onCreateClick={handleCreateClick}
                onViewClick={handleViewClick}
            />
            
            <DriverForm
                isOpen={isFormOpen}
                driver={selectedDriver}
                onClose={() => setIsFormOpen(false)}
            />
        </>
    );
}