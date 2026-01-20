"use client";

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Eye, EyeOff, Lock, AlertCircle } from 'lucide-react';
import { validatePassword } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { AUTH_ROUTES } from '@/lib/constants/auth';
import { resetPassword } from '@/lib/features/auth/authApi';

export default function ResetPasswordPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const token = searchParams.get('token');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token) {
            setError("Reset token is missing. Please use the link from your email.");
            return;
        }

        setError(null);
        const formData = new FormData(e.target as HTMLFormElement);
        const password = formData.get('password') as string;
        const confirmPassword = formData.get('confirm-password') as string;

        // Validate password
        const validation = validatePassword(password);
        if (!validation.isValid) {
            setError(validation.message);
            return;
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setIsLoading(true);

        try {
            // Call the reset password API
            await resetPassword({
                token: token,
                password: password,
            });

            toast({
                title: "Password Updated!",
                description: "Your password has been successfully reset. Please log in with your new password.",
                variant: "success",
            });

            // Redirect to login after success
            setTimeout(() => {
                router.push(AUTH_ROUTES.LOGIN);
            }, 1500);
        } catch (err: any) {
            // Handle API errors
            const errorMessage =
                err?.response?.data?.error ||
                err?.message ||
                'Failed to reset password. The token may be invalid or expired. Please request a new reset link.';
            
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="space-y-6">
                <div className="space-y-2 text-center">
                    <Text variant="h3">Invalid Link</Text>
                    <Text variant="muted">This password reset link is invalid or has expired.</Text>
                </div>
                <Alert variant="error">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        The reset token is missing. Please request a new password reset link.
                    </AlertDescription>
                </Alert>
                <Button onClick={() => router.push('/forgot-password')} className="w-full">
                    Request new link
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="space-y-2 text-center">
                <Text variant="h3">Reset Password</Text>
                <Text variant="muted">Set a strong new password for your account</Text>
            </div>

            {error && (
                <Alert variant="error" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <Text variant="label" htmlFor="password">New Password</Text>
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-theme-blue transition-colors">
                            <Lock size={18} />
                        </div>
                        <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pl-10 pr-10"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Text variant="label" htmlFor="confirm-password">Confirm New Password</Text>
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-theme-blue transition-colors">
                            <Lock size={18} />
                        </div>
                        <Input
                            id="confirm-password"
                            name="confirm-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pl-10 pr-10"
                            required
                        />
                    </div>
                </div>

                <Button type="submit" className="w-full" isLoading={isLoading} size="lg">
                    Reset Password
                </Button>
            </form>
        </div>
    );
}
