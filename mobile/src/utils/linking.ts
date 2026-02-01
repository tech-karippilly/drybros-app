/**
 * External app linking helpers
 */

import { Linking } from 'react-native';
import { LINK_SCHEMES } from '../constants/links';

function sanitizePhoneNumber(input: string): string {
  // Keep leading + and digits only.
  const trimmed = input.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/[^\d]/g, '');
  return hasPlus ? `+${digits}` : digits;
}

export async function openPhoneDialer(phoneNumber: string): Promise<void> {
  const sanitized = sanitizePhoneNumber(phoneNumber);
  if (!sanitized) return;

  const url = `${LINK_SCHEMES.TEL}${sanitized}`;
  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) return;
  await Linking.openURL(url);
}

