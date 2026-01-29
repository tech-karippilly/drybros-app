/**
 * Profile screen labels and mock data
 * Replace with API/store data when wired
 */

export const PROFILE_STRINGS = {
  EARNINGS: 'Earnings',
  TODAY_EARNINGS: "Today's Earnings",
  MONTHLY_EARNINGS: 'Monthly Earnings',
  VIEW_EARNINGS_HISTORY: 'View Earnings History →',
  EARNINGS_HISTORY_TITLE: 'Earnings History',
  COMPLAINTS: 'Complaints',
  VIEW_COMPLAINTS: 'View Complaints →',
  LOGOUT: 'Logout',
} as const;

/** Mock user – replace with real user from API/store */
export const PROFILE_MOCK_USER = {
  name: 'Rajesh Kumar',
  phone: '+91 98765 43210',
  imageUri: null as string | null,
  tier: 'Supreme',
} as const;

/** Mock earnings – replace with API */
export const PROFILE_MOCK_EARNINGS = {
  today: '₹ 1,240',
  monthly: '₹ 34,580',
} as const;
