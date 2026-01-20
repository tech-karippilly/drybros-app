"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Lock, Mail, User, Phone } from 'lucide-react';
import { validatePassword } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { useAppSelector } from '@/lib/hooks';
import { AUTH_ROUTES } from '@/lib/constants/auth';
import { registerAdmin } from '@/lib/features/auth/authApi';
import { getAuthTokens } from '@/lib/utils/auth';

export default function RegisterPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const router = useRouter();
    const { toast } = useToast();
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

            // If not authenticated, show the register form
            setIsCheckingAuth(false);
        };

        // Small timeout to prevent race condition with Redux initialization
        const timer = setTimeout(checkAuth, 100);
        return () => clearTimeout(timer);
    }, [isAuthenticated, isLogin, router]);

    // Don't render register form while checking authentication
    if (isCheckingAuth) {
        return null; // Or a loading spinner
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(e.target as HTMLFormElement);
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const phone = formData.get('phone') as string;

        // Validate required fields
        if (!name || !email || !password) {
            setError('Please fill in all required fields.');
            setIsLoading(false);
            return;
        }

        // Validate password
        const validation = validatePassword(password);
        if (!validation.isValid) {
            setError(validation.message);
            setIsLoading(false);
            return;
        }

        try {
            // Call the API
            await registerAdmin({
                name: name.trim(),
                email: email.trim().toLowerCase(),
                password,
                phone: phone?.trim() || null,
            });

            toast({
                title: "Account Created!",
                description: "Your administrative account has been created successfully.",
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
                'Failed to create account. Please try again.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2 text-center">
                <Text variant="h3">Create Admin Account</Text>
                <Text variant="muted">Enter your details to register as an administrator</Text>
            </div>

            {error && (
                <Alert variant="error">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <Text variant="label" htmlFor="name">Full Name</Text>
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-theme-blue transition-colors">
                            <User size={18} />
                        </div>
                        <Input
                            id="name"
                            name="name"
                            type="text"
                            placeholder="John Doe"
                            className="pl-10"
                            required
                        />
                    </div>
                </div>

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
                            placeholder="admin@drybros.com"
                            className="pl-10"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Text variant="label" htmlFor="phone">
                        Phone Number <span className="text-gray-400 text-xs">(Optional)</span>
                    </Text>
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-theme-blue transition-colors">
                            <Phone size={18} />
                        </div>
                        <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            placeholder="+1 234 567 8900"
                            className="pl-10"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Text variant="label" htmlFor="password">Password</Text>
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

                <Button type="submit" className="w-full" isLoading={isLoading} size="lg">
                    Create Account
                </Button>

                <div className="text-center pt-2">
                    <Text variant="small" className="text-gray-500">
                        Already have an account?{' '}
                        <Link
                            href="/login"
                            className="font-semibold text-theme-blue hover:underline underline-offset-4"
                        >
                            Sign In
                        </Link>
                    </Text>
                </div>
            </form>
        </div>
    );
}
