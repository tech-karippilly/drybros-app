'use client';

import React from 'react';
import Modal from '@/components/ui/Modal';
import TripTypeForm from './TripTypeForm';

interface TripTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  isLoading?: boolean;
  title: string;
}

const TripTypeModal: React.FC<TripTypeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading,
  title
}) => {
  const handleSubmit = (data: any) => {
    onSubmit(data);
  };

  return (
    <Modal open={isOpen} onClose={onClose} size="large" title={title}>
      <div className="p-6">
        
        <TripTypeForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={onClose}
          isLoading={isLoading}
        />
      </div>
    </Modal>
  );
};

export default TripTypeModal;