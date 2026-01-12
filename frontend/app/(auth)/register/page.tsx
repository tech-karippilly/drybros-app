"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Lock, Mail, User, CheckCircle2 } from 'lucide-react';
import { validatePassword } from '@/lib/utils';

export default function RegisterPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(e.target as HTMLFormElement);
        const password = formData.get('password') as string;

        const validation = validatePassword(password);
        if (!validation.isValid) {
            setError(validation.message);
            setIsLoading(false);
            return;
        }

        // Simulate registration
        setTimeout(() => {
            setIsLoading(false);
            if (!formData.get('name') || !formData.get('email') || !formData.get('password')) {
                setError('Please fill in all fields.');
            } else {
                setIsSuccess(true);
                // Redirect after success
                setTimeout(() => {
                    router.push('/login');
                }, 2000);
            }
        }, 1500);
    };

    if (isSuccess) {
        return (
            <div className="space-y-6 text-center py-4">
                <div className="flex justify-center">
                    <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600">
                        <CheckCircle2 size={32} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Text variant="h3">Account Created!</Text>
                    <Text variant="muted">Your administrative account has been created successfully. Redirecting you to login...</Text>
                </div>
                <Button onClick={() => router.push('/login')} variant="outline" className="w-full">
                    Click here if not redirected
                </Button>
            </div>
        );
    }

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
