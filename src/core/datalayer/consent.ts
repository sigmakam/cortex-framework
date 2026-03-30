/**
 * Consent Mode v2 — generates consent default commands for dataLayer.
 *
 * Architecture:
 *   1. Cortex sets consent defaults (all denied for EU) BEFORE GTM loads
 *   2. GTM loads and respects these defaults (no tags fire without consent)
 *   3. CMP (loaded as GTM tag, e.g. Cookiebot) shows banner to user
 *   4. User accepts → CMP sends 'consent update' → GTM unblocks tags
 *
 * Cortex is CMP-agnostic. CMP is configured in GTM, not in code.
 */

import type { ConsentRegion } from "@/core/site-config";

type ConsentState = "granted" | "denied";

interface ConsentDefault {
  ad_storage: ConsentState;
  ad_user_data: ConsentState;
  ad_personalization: ConsentState;
  analytics_storage: ConsentState;
  functionality_storage: ConsentState;
  personalization_storage: ConsentState;
  security_storage: ConsentState;
  wait_for_update?: number;
  region?: string[];
}

/**
 * Generates the JavaScript code to initialize consent defaults.
 * This code MUST be injected into <head> BEFORE the GTM snippet.
 *
 * @param regions - Consent regions from site_config DB
 * @returns JavaScript string to inject in a <script> tag
 */
export function generateConsentScript(regions: ConsentRegion[]): string {
  const commands = regions.map((r) => {
    const consent: ConsentDefault = {
      ad_storage: r.ad_storage,
      ad_user_data: r.ad_user_data,
      ad_personalization: r.ad_personalization,
      analytics_storage: r.analytics_storage,
      functionality_storage: r.functionality_storage ?? r.analytics_storage,
      personalization_storage: r.personalization_storage ?? "denied",
      security_storage: "granted", // always granted
    };

    if (r.wait_for_update) {
      consent.wait_for_update = r.wait_for_update;
    }

    // Empty region array = global default (no region key)
    if (r.region.length > 0) {
      consent.region = r.region;
    }

    return `  gtag('consent', 'default', ${JSON.stringify(consent)});`;
  });

  return [
    "window.dataLayer = window.dataLayer || [];",
    "function gtag(){dataLayer.push(arguments);}",
    "",
    "// Consent Mode v2 defaults — set BEFORE GTM loads",
    "// Regional rules: specific regions first, global default last",
    ...commands,
  ].join("\n");
}

/**
 * Default consent for development/fallback when no regions configured.
 * All denied except security_storage — safe for any jurisdiction.
 */
export function generateFallbackConsentScript(): string {
  return [
    "window.dataLayer = window.dataLayer || [];",
    "function gtag(){dataLayer.push(arguments);}",
    "gtag('consent', 'default', {",
    "  ad_storage: 'denied',",
    "  ad_user_data: 'denied',",
    "  ad_personalization: 'denied',",
    "  analytics_storage: 'denied',",
    "  functionality_storage: 'denied',",
    "  personalization_storage: 'denied',",
    "  security_storage: 'granted',",
    "  wait_for_update: 500",
    "});",
  ].join("\n");
}
