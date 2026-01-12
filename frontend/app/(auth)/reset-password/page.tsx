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

export default function ResetPasswordPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const token = searchParams.get('token');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!token) return;

        setError(null);
        const formData = new FormData(e.target as HTMLFormElement);
        const password = formData.get('password') as string;
        const confirmPassword = formData.get('confirm-password') as string;

        const validation = validatePassword(password);
        if (!validation.isValid) {
            setError(validation.message);
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setIsLoading(true);

        // Simulate reset
        setTimeout(() => {
            setIsLoading(false);
            toast({
                title: "Password Updated!",
                description: "Your password has been successfully reset. Log in with your new password.",
                variant: "success",
            });
            // Wait bit then go to login
            setTimeout(() => {
                router.push(AUTH_ROUTES.LOGIN);
            }, 1500);
        }, 1500);
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
