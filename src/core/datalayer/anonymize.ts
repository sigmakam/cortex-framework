/**
 * Data anonymization utilities for dataLayer events.
 * Required by GDPR / privacy regulations before sending to analytics.
 */

/**
 * Anonymize phone number.
 * Keeps country prefix + first 3 local digits + last 2 digits, rest → 'x'.
 *
 * @example anonymizePhone('+48 711 222 333') → '+48711xxxxx33'
 * @example anonymizePhone('711222333')       → '711xxxxx33'
 */
export function anonymizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 9) return phone;

  const hasCountryCode = digits.length > 9;
  const countryPrefix = hasCountryCode
    ? "+" + digits.slice(0, digits.length - 9)
    : "";
  const localDigits = digits.slice(-9);

  return (
    countryPrefix +
    localDigits.slice(0, 3) +
    "x".repeat(localDigits.length - 5) +
    localDigits.slice(-2)
  );
}

/**
 * Anonymize email address.
 * Returns only the local part (before @).
 *
 * @example anonymizeEmail('biuro@firma.pl') → 'biuro'
 * @example anonymizeEmail('jan.kowalski@example.com') → 'jan.kowalski'
 */
export function anonymizeEmail(email: string): string {
  const atIndex = email.indexOf("@");
  return atIndex >= 0 ? email.slice(0, atIndex) : email;
}
