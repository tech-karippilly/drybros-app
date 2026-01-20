/**
 * Common formatters utility functions
 */

/**
 * Format date to readable string
 */
export const formatDate = (date: Date, format: 'short' | 'long' | 'numeric' = 'short'): string => {
  const options: Intl.DateTimeFormatOptions = {
    short: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { month: 'long', day: 'numeric', year: 'numeric' },
    numeric: { month: 'numeric', day: 'numeric', year: 'numeric' },
  }[format];

  return new Intl.DateTimeFormat('en-US', options).format(date);
};

/**
 * Format time to readable string
 */
export const formatTime = (date: Date, format: '12h' | '24h' = '12h'): string => {
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: format === '12h',
  };

  return new Intl.DateTimeFormat('en-US', options).format(date);
};

/**
 * Format date and time together
 */
export const formatDateTime = (date: Date): string => {
  return `${formatDate(date)} ${formatTime(date)}`;
};

/**
 * Format phone number
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  // Limit to 10 digits for US phone numbers
  const limited = cleaned.slice(0, 10);
  
  if (limited.length === 0) return '';
  if (limited.length <= 3) return `(${limited}`;
  if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
  return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
};

/**
 * Format currency
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};