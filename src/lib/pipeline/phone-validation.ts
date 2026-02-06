import { PhoneValidation } from '../types';

const UK_MOBILE_PATTERN = /^\+447\d{9}$/;

/**
 * Validates that a phone number is a valid UK mobile number.
 * Format: +447xxxxxxxxx (13 characters total)
 */
export function validatePhone(phone: string | null | undefined): PhoneValidation {
  if (!phone || phone === '') {
    return { phone_valid: false, phone_validation_reason: 'empty' };
  }

  const phoneStr = String(phone).trim();

  if (!phoneStr.startsWith('+44')) {
    return { phone_valid: false, phone_validation_reason: 'not_uk' };
  }

  const ukNumber = phoneStr.substring(3);
  if (!ukNumber.startsWith('7')) {
    return { phone_valid: false, phone_validation_reason: 'not_mobile' };
  }

  if (!UK_MOBILE_PATTERN.test(phoneStr)) {
    return { phone_valid: false, phone_validation_reason: 'invalid_format' };
  }

  return { phone_valid: true, phone_validation_reason: 'uk_mobile' };
}
