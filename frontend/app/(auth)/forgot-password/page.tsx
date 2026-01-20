"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Mail, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useAppSelector } from '@/lib/hooks';
import { AUTH_ROUTES } from '@/lib/constants/auth';
import { getAuthTokens } from '@/lib/utils/auth';

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const { toast } = useToast();
    const router = useRouter();
    const { isAuthenticated, isLogin } = useAppSelector((state) => state.auth);

    // Redirect to dashboard if already authenticated
    useEffect(() => {
        // Small delay to ensure Redux state is initialized
        const checkAuth = () => {
            // Check Redux state first
            if (isAuthenticated || isLogin) {
                router.replace(AUTH_ROUTES.DASHBOARD);
                return;
            }

            // Also check localStorage as fallback
            const tokens = getAuthTokens();
            if (tokens.accessToken) {
                router.replace(AUTH_ROUTES.DASHBOARD);
                return;
            }

            // If not authenticated, show the forgot password form
            setIsCheckingAuth(false);
        };

        // Small timeout to prevent race condition with Redux initialization
        const timer = setTimeout(checkAuth, 100);
        return () => clearTimeout(timer);
    }, [isAuthenticated, isLogin, router]);

    // Don't render form while checking authentication
    if (isCheckingAuth) {
        return null; // Or a loading spinner
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            toast({
                title: "Email Sent",
                description: "We've sent a password reset link to your email address.",
                variant: "success",
            });
            // Redirect after success
            setTimeout(() => {
                router.push(AUTH_ROUTES.LOGIN);
            }, 2000);
        }, 1500);
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2 text-center">
                <Text variant="h3">Forgot Password?</Text>
                <Text variant="muted">Enter your email and we&apos;ll send you a password reset link</Text>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1.5">
                    <Text variant="label" htmlFor="email">Email Address</Text>
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-theme-blue transition-colors">
                            <Mail size={18} />
                        </div>
                        <Input
                            id="email"
                            type="email"
                            placeholder="name@company.com"
                            className="pl-10"
                            required
                        />
                    </div>
                </div>

                <Button type="submit" className="w-full" isLoading={isLoading} size="lg">
                    Send Reset Link
                </Button>

                <div className="text-center pt-2">
                    <Link
                        href="/login"
                        className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-theme-blue transition-colors"
                    >
                        <ArrowLeft size={16} className="mr-2" />
                        Back to login
                    </Link>
                </div>
            </form>
        </div>
    );
}
