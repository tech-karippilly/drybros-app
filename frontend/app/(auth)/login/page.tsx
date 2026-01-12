"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Lock, Mail, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        // Simulate login
        setTimeout(() => {
            setIsLoading(false);
            const formData = new FormData(e.target as HTMLFormElement);
            if (!formData.get('email') || !formData.get('password')) {
                setError('Please fill in all fields.');
            } else {
                setIsSuccess(true);
                // Redirect after success
                setTimeout(() => {
                    router.push('/dashboard');
                }, 1500);
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
                    <Text variant="h3">Welcome Back!</Text>
                    <Text variant="muted">Sign in successful. Accessing your dashboard...</Text>
                </div>
                <div className="flex justify-center">
                    <div className="h-2 w-24 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-theme-blue animate-progress shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    </div>
                </div>
            </div>
        );
    }

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
