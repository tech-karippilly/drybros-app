"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            setIsSubmitted(true);
        }, 1500);
    };

    if (isSubmitted) {
        return (
            <div className="space-y-6 text-center">
                <div className="flex justify-center">
                    <div className="h-16 w-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-theme-blue">
                        <Mail size={32} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Text variant="h3">Check your email</Text>
                    <Text variant="muted">
                        We&apos;ve sent a password reset link to your email address. Please follow the instructions in the email.
                    </Text>
                </div>
                <div className="pt-2">
                    <Link
                        href="/login"
                        className="inline-flex items-center text-sm font-semibold text-theme-blue hover:underline underline-offset-4"
                    >
                        <ArrowLeft size={16} className="mr-2" />
                        Back to login
                    </Link>
                </div>
            </div>
        );
    }

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
