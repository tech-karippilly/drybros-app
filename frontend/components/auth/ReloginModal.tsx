"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/lib/hooks';
import { logout } from '@/lib/features/auth/authSlice';
import { AlertCircle, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { AUTH_ROUTES } from '@/lib/constants/auth';
import { clearAuthTokens } from '@/lib/utils/auth';

interface ReloginModalProps {
    isOpen: boolean;
    onClose?: () => void;
}

export function ReloginModal({ isOpen, onClose }: ReloginModalProps) {
    const router = useRouter();
    const dispatch = useAppDispatch();

    const handleRelogin = () => {
        // Clear tokens from localStorage
        clearAuthTokens();
        
        // Clear Redux state
        dispatch(logout());
        
        // Close modal first
        if (onClose) {
            onClose();
        }
        
        // Redirect to login (use replace to prevent back navigation)
        router.replace(AUTH_ROUTES.LOGIN);
    };

    // Prevent modal from closing - user must relogin
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div 
                className="relative grid w-full max-w-md gap-4 border bg-white dark:bg-[#101622] p-6 shadow-2xl rounded-2xl dark:border-gray-800 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()} // Prevent closing on click
            >
                <div className="flex flex-col space-y-1.5 text-center">
                    <h2 className="text-lg font-semibold leading-none tracking-tight text-[#0d121c] dark:text-white">
                        Session Expired
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Your session has expired. Please log in again to continue.
                    </p>
                </div>

                <div className="space-y-6 mt-2">
                    <div className="flex items-center justify-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                        <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
                    </div>

                    <div className="text-center space-y-2">
                        <Text variant="subheading" className="border-none font-semibold text-[#0d121c] dark:text-white">
                            Your Refresh Token Has Expired
                        </Text>
                        <Text variant="small" className="text-[#49659c] dark:text-gray-400">
                            For security reasons, you need to log in again to continue using the application.
                        </Text>
                    </div>

                    <div className="flex flex-col gap-3 pt-4">
                        <Button
                            onClick={handleRelogin}
                            className="w-full"
                            size="lg"
                        >
                            <LogIn size={18} className="mr-2" />
                            Go to Login
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
