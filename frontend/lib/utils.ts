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

/**
 * Formats car type for display
 * Handles both JSON string format {"gearType":"MANUAL","category":"NORMAL"} and object format
 */
export function formatCarType(carType: string | null | undefined): string {
    if (!carType) return 'Not specified';
    
    try {
        // Try to parse as JSON if it's a string
        let parsed: { gearType?: string; category?: string } | string = carType;
        if (typeof carType === 'string' && carType.trim().startsWith('{')) {
            parsed = JSON.parse(carType);
        }
        
        // If it's an object, format it
        if (typeof parsed === 'object' && parsed !== null) {
            const gearType = parsed.gearType || '';
            const category = parsed.category || '';
            
            // Format gear type (MANUAL -> Manual, AUTOMATIC -> Automatic)
            const formattedGearType = gearType 
                ? gearType.charAt(0) + gearType.slice(1).toLowerCase()
                : '';
            
            // Format category (NORMAL -> Normal, PREMIUM -> Premium, LUXURY -> Luxury)
            const formattedCategory = category
                ? category.charAt(0) + category.slice(1).toLowerCase()
                : '';
            
            // Combine them
            if (formattedGearType && formattedCategory) {
                return `${formattedGearType} - ${formattedCategory}`;
            } else if (formattedGearType) {
                return formattedGearType;
            } else if (formattedCategory) {
                return formattedCategory;
            }
        }
        
        // If it's already a simple string, return as is
        return carType;
    } catch (error) {
        // If parsing fails, return the original string
        return carType;
    }
}

