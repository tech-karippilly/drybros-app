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
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
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