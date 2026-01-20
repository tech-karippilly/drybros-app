"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { setCredentials } from '@/lib/features/auth/authSlice';
import { AUTH_ROUTES, STORAGE_KEYS } from '@/lib/constants/auth';
import { login } from '@/lib/features/auth/authApi';
import { getAuthTokens } from '@/lib/utils/auth';

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const router = useRouter();
    const { toast } = useToast();
    const dispatch = useAppDispatch();
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

            // Also check localStorage as fallback (in case Redux state is not initialized)
            const tokens = getAuthTokens();
            if (tokens.accessToken) {
                router.replace(AUTH_ROUTES.DASHBOARD);
                return;
            }

            // If not authenticated, show the login form
            setIsCheckingAuth(false);
        };

        // Small timeout to prevent race condition with Redux initialization
        const timer = setTimeout(checkAuth, 100);
        return () => clearTimeout(timer);
    }, [isAuthenticated, isLogin, router]);

    // Don't render login form while checking authentication
    if (isCheckingAuth) {
        return null; // Or a loading spinner
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(e.target as HTMLFormElement);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        // Validate required fields
        if (!email || !password) {
            setError('Please fill in all fields.');
            setIsLoading(false);
            return;
        }

        try {
            // Call the login API
            const response = await login({
                email: email.trim().toLowerCase(),
                password,
            });

            // Map backend user response to frontend User type
            // Backend roles: ADMIN, OFFICE_STAFF, DRIVER, STAFF
            // Frontend expects: admin, staff, driver
            const mapRole = (backendRole: string): string => {
                const role = backendRole.toUpperCase();
                if (role === 'ADMIN') return 'admin';
                if (role === 'OFFICE_STAFF' || role === 'STAFF') return 'staff';
                if (role === 'DRIVER') return 'driver';
                return 'admin'; // Default fallback
            };

            const user = {
                _id: response.user.id,
                email: response.user.email,
                name: response.user.fullName,
                role: mapRole(response.user.role),
            };

            // Store tokens in localStorage
            localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);
            localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);

            // Update Redux store
            dispatch(setCredentials({
                user,
                accessToken: response.accessToken,
                refreshToken: response.refreshToken,
            }));

            toast({
                title: "Success",
                description: "Sign in successful. Welcome back!",
                variant: "success",
            });

            // Redirect to dashboard after success (use replace to prevent back navigation)
            setTimeout(() => {
                router.replace(AUTH_ROUTES.DASHBOARD);
            }, 1000);
        } catch (err: any) {
            // Handle API errors
            const errorMessage =
                err?.response?.data?.error ||
                err?.message ||
                'Invalid email or password. Please try again.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2 text-center">
                <Text variant="h3">Welcome Back</Text>
                <Text variant="muted">Enter your credentials to access your account</Text>
            </div>

            {error && (
                <Alert variant="error">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <Text variant="label" htmlFor="email">Email Address</Text>
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-theme-blue transition-colors">
                            <Mail size={18} />
                        </div>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="name@company.com"
                            className="pl-10"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <Text variant="label" htmlFor="password">Password</Text>
                        <Link
                            href="/forgot-password"
                            className="text-xs font-semibold text-theme-blue hover:underline underline-offset-4"
                        >
                            Forgot password?
                        </Link>
                    </div>
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
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between py-1">
                    <Checkbox label="Remember me" id="remember" />
                </div>

                <Button type="submit" className="w-full" isLoading={isLoading} size="lg">
                    Sign In
                </Button>
            </form>
        </div>
    );
}
