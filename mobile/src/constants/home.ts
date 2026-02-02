/**
 * Home screen constants (labels, layout, mock data)
 * Replace mock data with API/store once wired.
 */

import type { TripItem } from './trips';

export const HOME_STRINGS = {
  // Brand
  BRAND_DRY: 'DRY',
  BRAND_BROS: 'BROS',

  // Cards
  MY_TARGET: 'My Target',
  STATUS: 'Status:',
  CHECKED_IN: 'Checked In',
  NOT_CHECKED_IN: 'Not Checked In',
  CHECK_OUT: 'Check Out',
  CHECK_IN: 'Check In',
  CLOCK_IN_FAILED: 'Clock in failed. Please try again.',
  CLOCK_OUT_FAILED: 'Clock out failed. Please try again.',

  // Checkout modal
  CHECKOUT_TITLE: 'Check out?',
  CHECKOUT_SUBTITLE: 'This will make you unavailable for new trips.',
  SWIPE_TO_CHECKOUT: 'Swipe to Checkout',
  CANCEL: 'Cancel',

  // Sections
  UPCOMING_TRIPS: 'Upcoming Trips',
  GET_HELP: 'Get Help',

  // Trip card
  TRIP_PREFIX: 'Trip',
  FROM: 'From',
  TO: 'To',
  TRANSMISSION_TYPE: 'Transmission Type',
  NAVIGATE: 'Navigate',
  TRIP_DETAILS: 'Trip Details',
  SWIPE_START_TRIP: 'Swipe Start Trip',
  SWIPE_END_TRIP: 'Swipe End Trip',
  SWIPE_COLLECT_PAYMENT: 'Swipe Collect Payment',

  VIEW_ALL_PREFIX: 'View All',
} as const;

export const HOME_LAYOUT = {
  SCREEN_BG: '#EFEFEF',

  TOP_BG_HEIGHT_PERCENT: 54,

  SCREEN_HORIZONTAL_PADDING: 20,
  CONTENT_TOP_PADDING: 12,
  CONTENT_BOTTOM_PADDING: 24,

  BRAND_TOP_PADDING: 12,
  BRAND_FONT_SIZE: 28,

  TOP_CARDS_GAP: 14,
  TOP_CARD_RADIUS: 18,
  TOP_CARD_HEIGHT: 110,

  TARGET_PROGRESS_HEIGHT: 8,
  TARGET_PROGRESS_RADIUS: 999,

  BADGE_SIZE: 28,
  BADGE_RADIUS: 999,

  UPCOMING_TITLE_FONT_SIZE: 22,

  TRIP_CARD_RADIUS: 26,
  TRIP_CARD_PADDING: 18,
  TRIP_CARD_GAP: 16,

  CALL_BTN_SIZE: 56,
  CALL_BTN_RADIUS: 999,
  CALL_ICON_SIZE: 22,

  STATUS_PILL_HEIGHT: 32,
  STATUS_PILL_RADIUS: 999,
  STATUS_PILL_PADDING_H: 14,

  ROUTE_DOT_SIZE: 10,
  ROUTE_LINE_WIDTH: 2,
  ROUTE_LINE_HEIGHT: 42,

  CAR_IMAGE_W: 120,
  CAR_IMAGE_H: 64,

  ACTION_BTN_HEIGHT: 52,
  ACTION_BTN_RADIUS: 999,
  ACTION_ICON_SIZE: 18,

  SWIPE_HEIGHT: 64,

  VIEW_ALL_HEIGHT: 62,
  VIEW_ALL_RADIUS: 20,
  VIEW_ALL_ARROW_SIZE: 22,
} as const;

export const HOME_COLORS = {
  TOP_BG: '#1A1B29',
  TOP_BADGE_BG: '#DE8509',

  GLASS_GRADIENT_TOP: 'rgba(255, 255, 255, 0.046)',
  GLASS_GRADIENT_BOTTOM: 'rgba(255, 255, 255, 0.04)',

  PROGRESS_TRACK: 'rgba(255, 255, 255, 0.1)',
  PROGRESS_GRADIENT: ['#5E66B7', '#8E97EA'] as const,

  /** Button colors for attendance card */
  CHECK_IN_BG: '#4CAF50',
  CHECK_OUT_BG: '#D14646',

  CARD_TEXT: '#FFFFFF',
  CARD_TEXT_MUTED: 'rgba(255, 255, 255, 0.75)',

  /** Checkout modal */
  CHECKOUT_MODAL_BG: '#FFFFFF',
  CHECKOUT_MODAL_SWIPE_TRACK: '#111111',
  CHECKOUT_MODAL_SWIPE_THUMB: '#3A3A3A',
  CHECKOUT_MODAL_CANCEL_BG: '#E9EAED',
  CHECKOUT_MODAL_CANCEL_TEXT: '#111827',
  CHECKOUT_MODAL_ICON_INNER_BG: '#F05D5D',
  CHECKOUT_MODAL_ICON_COLOR: '#FFFFFF',
  CHECKOUT_MODAL_LABEL_GRADIENT: ['#6B7280', '#FFFFFF'] as const,

  TRIP_CARD_BG: '#FFFFFF',
  TRIP_SUBTEXT: '#8E8E8E',
  DIVIDER: '#E7E7E7',

  STATUS_UPCOMING_BG: '#DDF2D4',
  STATUS_UPCOMING_TEXT: '#2E7D32',

  PICKUP_DOT: '#3F51B5',
  DROP_DOT: '#D32F2F',

  ACTION_BTN_BG: '#E6E6E6',
  ACTION_BTN_TEXT: '#111827',

  SWIPE_TRACK_BG: '#1A244B',

  VIEW_ALL_BG: '#F2A1A1',
  VIEW_ALL_TEXT: '#111827',
} as const;

export const HOME_CHECKOUT_MODAL = {
  /** Modal card radius */
  RADIUS: 28,
  /** Modal content padding */
  PADDING_H: 24,
  PADDING_V: 28,
  /** Icon spacing */
  ICON_SIZE: 140,
  ICON_MARGIN_BOTTOM: 18,
  /** Swipe + cancel sizing */
  SWIPE_HEIGHT: 64,
  SWIPE_MARGIN_TOP: 22,
  CANCEL_HEIGHT: 64,
  CANCEL_RADIUS: 999,
  CANCEL_MARGIN_TOP: 18,
} as const;

export type HomeUpcomingTrip = {
  id: string;
  tripNumberLabel: string; // "Trip #TR-2847"
  customerName: string;
  statusLabel: string; // "UPCOMING"
  etaLabel: string; // "in 34 mins"
  fromLabel: string;
  toLabel: string;
  vehicleMake: string;
  vehicleLabel: string; // "Taigun | KL 41 BF 1986"
  transmission: string;
  /** Underlying TripItem used for Trip Details navigation */
  trip: TripItem;
};

export const HOME_MOCK = {
  target: {
    current: 800,
    total: 1500,
  },
  status: {
    checkedInAt: '09:30 AM',
    isCheckedIn: true,
  },
  upcomingCount: 3,
} as const;

export const HOME_UPCOMING_TRIPS: HomeUpcomingTrip[] = [
  {
    id: 'home-trip-1',
    tripNumberLabel: 'Trip #TR-2847',
    customerName: 'Jose Augustine',
    statusLabel: 'UPCOMING',
    etaLabel: 'in 34 mins',
    fromLabel: 'Koramangala, 4th Block',
    toLabel: 'Indiranagar Metro Station',
    vehicleMake: 'Volkswagen',
    vehicleLabel: 'Taigun | KL 41 BF 1986',
    transmission: 'Automatic',
    trip: {
      id: 'home-trip-details-1',
      tripIdLabel: 'TRP-2025-00848',
      status: 'upcoming',
      customerName: 'Jose Augustine',
      pickup: 'Phoenix Marketcity, LB Road, Kurla West, Mumbai, Maharashtra 400070',
      drop: 'Bandra Kurla Complex, G Block, Bandra East, Mumbai, Maharashtra 400051',
      footerLabel: 'Scheduled for 5:00 PM',
      scheduledDateTimeLabel: '28 Dec 2025, 02:30 PM',
      bookingTimeLabel: '28 Dec 2025, 01:45 PM',
      customerPhone: '+91 98765 43210',
      estDistanceKm: '8.5 km',
      estDurationMin: '25 min',
      vehicleNumber: 'KL 41 BF 1986',
      transmission: 'Automatic',
      vehicleModel: 'Volkswagen Taigun',
      serviceType: 'Point to Point',
      specialRequests: 'None',
    },
  },
  {
    id: 'home-trip-2',
    tripNumberLabel: 'Trip #TR-3215',
    customerName: 'Vipin Narayanan',
    statusLabel: 'UPCOMING',
    etaLabel: 'in 2 hours',
    fromLabel: 'HAL 2nd Stage, Kodihalli',
    toLabel: 'KG Halli, Ashok Nagar',
    vehicleMake: 'Volkswagen',
    vehicleLabel: 'Taigun | KL 41 BF 1986',
    transmission: 'Automatic',
    trip: {
      id: 'home-trip-details-2',
      tripIdLabel: 'TRP-2025-00847',
      status: 'upcoming',
      customerName: 'Vipin Narayanan',
      pickup: 'HAL 2nd Stage, Kodihalli',
      drop: 'KG Halli, Ashok Nagar',
      footerLabel: 'Scheduled for 7:30 PM',
      scheduledDateTimeLabel: '28 Dec 2025, 07:30 PM',
      bookingTimeLabel: '28 Dec 2025, 06:45 PM',
      customerPhone: '+91 98765 43210',
      estDistanceKm: '8.5 km',
      estDurationMin: '25 min',
      vehicleNumber: 'KL 41 BF 1986',
      transmission: 'Automatic',
      vehicleModel: 'Volkswagen Taigun',
      serviceType: 'Point to Point',
      specialRequests: 'None',
    },
  },
] as const;

