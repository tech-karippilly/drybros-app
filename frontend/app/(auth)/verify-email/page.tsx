"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function VerifyEmailPage() {
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputs = useRef<(HTMLInputElement | null)[]>([]);
    const router = useRouter();

    const handleChange = (index: number, value: string) => {
        if (value.length > 1) value = value.slice(-1);
        if (!/^\d*$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        // Auto focus next
        if (value && index < 5) {
            inputs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const verificationCode = code.join('');

        if (verificationCode.length < 6) {
            setError('Please enter the full 6-digit code.');
            return;
        }

        setIsLoading(true);
        setError(null);

        // Simulate verification
        setTimeout(() => {
            setIsLoading(false);
            router.push('/reset-password');
        }, 1500);
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2 text-center">
                <Text variant="h3">Verify Email</Text>
                <Text variant="muted">Enter the 6-digit code sent to your email</Text>
            </div>

            {error && (
                <Alert variant="error">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="flex justify-between gap-2 max-w-[300px] mx-auto">
                    {code.map((digit, idx) => (
                        <input
                            key={idx}
                            ref={(el) => { inputs.current[idx] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(idx, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(idx, e)}
                            className="w-10 h-12 text-center text-lg font-bold border-2 rounded-lg bg-background focus:border-theme-blue focus:ring-4 focus:ring-theme-blue/10 outline-none transition-all dark:border-gray-700"
                        />
                    ))}
                </div>

                <div className="space-y-4">
                    <Button type="submit" className="w-full" isLoading={isLoading} size="lg">
                        Verify Code
                    </Button>

                    <div className="text-center">
                        <Text variant="small" className="text-gray-500">
                            Didn&apos;t receive the code?{' '}
                            <button type="button" className="text-theme-blue font-semibold hover:underline">
                                Resend
                            </button>
                        </Text>
                    </div>
                </div>
            </form>
        </div>
    );
}
