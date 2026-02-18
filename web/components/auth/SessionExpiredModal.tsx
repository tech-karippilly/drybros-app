'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { AUTH_ROUTES } from '@/lib/constants/auth';

interface SessionExpiredModalProps {
    open: boolean;
    onClose: () => void;
}

const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({ open, onClose }) => {
    const router = useRouter();

    const handleLogin = () => {
        onClose();
        router.push(AUTH_ROUTES.LOGIN);
    };

    return (
        <Modal
            open={open}
            onClose={() => {}} // Prevent closing by backdrop click or escape
            title="Session Expired"
            size="small"
            showCloseButton={false}
            closeOnBackdropClick={false}
            footer={
                <Button color="primary" onClick={handleLogin}>
                    Login Again
                </Button>
            }
        >
            <div className="text-center py-4">
                <div className="mx-auto w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
                    <svg
                        className="w-8 h-8 text-amber-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                </div>
                <p className="text-gray-300 mb-2">
                    Your session has expired due to inactivity.
                </p>
                <p className="text-sm text-gray-500">
                    Please login again to continue using the application.
                </p>
            </div>
        </Modal>
    );
};

export default SessionExpiredModal;
