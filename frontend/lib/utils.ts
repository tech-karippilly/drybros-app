import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { FOCUS_RING as FOCUS_RING_CONST, INPUT_STYLES as INPUT_STYLES_CONST } from './constants/styles';
import { PASSWORD_VALIDATION_MESSAGES } from './constants/auth';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const FOCUS_RING = FOCUS_RING_CONST;

export const INPUT_STYLES = INPUT_STYLES_CONST;

export function validatePassword(password: string): { isValid: boolean; message: string } {
    if (password.length < 8) {
        return { isValid: false, message: PASSWORD_VALIDATION_MESSAGES.LENGTH };
    }
    if (!/[A-Z]/.test(password)) {
        return { isValid: false, message: PASSWORD_VALIDATION_MESSAGES.UPPERCASE };
    }
    if (!/[0-9]/.test(password)) {
        return { isValid: false, message: PASSWORD_VALIDATION_MESSAGES.NUMBER };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return { isValid: false, message: PASSWORD_VALIDATION_MESSAGES.SPECIAL };
    }
    return { isValid: true, message: "" };
}

