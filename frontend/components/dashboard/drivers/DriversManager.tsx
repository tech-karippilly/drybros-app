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
        setIsFormOpen(true);
    };

    const handleViewClick = (driver: GetDriver) => {
        setSelectedDriver(driver);
        setIsDetailsOpen(true);
    };

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

            <DriverDetails
                isOpen={isDetailsOpen}
                driver={selectedDriver}
                onClose={() => setIsDetailsOpen(false)}
            />
        </>
    );
}