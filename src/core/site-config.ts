/**
 * SiteConfig Service — loads site configuration from DB.
 * Replaces the static cortex.site.config.ts file.
 * Config is a key-value store: each key maps to a JSON value.
 *
 * Usage:
 *   const name = await siteConfigService.get<string>('company.name')
 *   const ctx  = await siteConfigService.getSiteContext()
 */

import { db } from "@/lib/db";
import { siteConfig } from "@/lib/schema";
import { eq } from "drizzle-orm";

// --- SiteContext type (previously in cortex.site.config.ts) ---

export interface ConsentRegion {
  region: string[]; // ISO 3166-1 alpha-2 codes. Empty array = default/global
  analytics_storage: "granted" | "denied";
  ad_storage: "granted" | "denied";
  ad_user_data: "granted" | "denied";
  ad_personalization: "granted" | "denied";
  functionality_storage?: "granted" | "denied";
  personalization_storage?: "granted" | "denied";
  wait_for_update?: number;
}

export interface SiteContext {
  company: {
    name: string;
    legalName?: string;
    domain: string;
    foundingDate?: string;
    logo?: string;
    themeColor?: string;
  };
  seo: {
    locale: string;
    primaryKeyword?: string;
    industry?: string;
    location?: {
      city?: string;
      region?: string;
      country?: string;
      postalCode?: string;
      streetAddress?: string;
    };
  };
  founder?: {
    name: string;
    jobTitle?: string;
    sameAs?: Record<string, string>;
    credentials?: string[];
  };
  ratings?: {
    value: number;
    count: number;
    bestRating: number;
    worstRating: number;
  };
  contact: {
    telephone?: string;
    email?: string;
    openingHours?: string[];
    priceRange?: string;
  };
  social?: {
    twitterHandle?: string;
    ogImage?: string;
  };
  analytics: {
    gtmId?: string;
    ga4MeasurementId?: string;
    currency: string;
    debugMode: boolean;
  };
  consent: {
    regions: ConsentRegion[];
  };
  externalResources?: string[];
}

// --- In-memory cache ---

let cachedConfig: Map<string, unknown> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000; // 1 minute

// --- Service ---

class SiteConfigService {
  /** Get a single config value by key */
  async get<T = unknown>(key: string): Promise<T | undefined> {
    const all = await this.loadAll();
    return all.get(key) as T | undefined;
  }

  /** Get a single config value by key, with a fallback default */
  async getOrDefault<T = unknown>(key: string, defaultValue: T): Promise<T> {
    const value = await this.get<T>(key);
    return value !== undefined ? value : defaultValue;
  }

  /** Set a config value (atomic upsert — no race condition) */
  async set(key: string, value: unknown): Promise<void> {
    await db
      .insert(siteConfig)
      .values({ key, value })
      .onConflictDoUpdate({
        target: siteConfig.key,
        set: { value, updatedAt: new Date() },
      });

    // Invalidate cache
    cachedConfig = null;
  }

  /** Delete a config key */
  async delete(key: string): Promise<void> {
    await db.delete(siteConfig).where(eq(siteConfig.key, key));
    cachedConfig = null;
  }

  /** Get all config as a flat Map */
  async loadAll(): Promise<Map<string, unknown>> {
    const now = Date.now();
    if (cachedConfig && now - cacheTimestamp < CACHE_TTL_MS) {
      return cachedConfig;
    }

    try {
      const rows = await db.select().from(siteConfig);
      const map = new Map<string, unknown>();
      for (const row of rows) {
        map.set(row.key, row.value);
      }
      cachedConfig = map;
      cacheTimestamp = now;
      return map;
    } catch {
      // DB not available — return empty map (allows app to boot without DB)
      return cachedConfig ?? new Map();
    }
  }

  /** Build full SiteContext from DB config */
  async getSiteContext(): Promise<SiteContext> {
    const all = await this.loadAll();
    const g = <T>(key: string, fallback: T): T => {
      const v = all.get(key);
      return (v !== undefined ? v : fallback) as T;
    };

    return {
      company: {
        name: g("company.name", "Cortex Site"),
        legalName: g("company.legalName", undefined),
        domain: g("company.domain", "localhost"),
        foundingDate: g("company.foundingDate", undefined),
        logo: g("company.logo", "/logo.svg"),
        themeColor: g("company.themeColor", "#0066FF"),
      },
      seo: {
        locale: g("seo.locale", "pl_PL"),
        primaryKeyword: g("seo.primaryKeyword", undefined),
        industry: g("seo.industry", undefined),
        location: g("seo.location", undefined),
      },
      founder: g("founder", undefined),
      ratings: g("ratings", undefined),
      contact: {
        telephone: g("contact.telephone", undefined),
        email: g("contact.email", undefined),
        openingHours: g("contact.openingHours", undefined),
        priceRange: g("contact.priceRange", undefined),
      },
      social: g("social", undefined),
      analytics: {
        gtmId: g("analytics.gtmId", undefined),
        ga4MeasurementId: g("analytics.ga4MeasurementId", undefined),
        currency: g("analytics.currency", "PLN"),
        debugMode: g("analytics.debugMode", false),
      },
      consent: {
        regions: g("consent.regions", DEFAULT_CONSENT_REGIONS),
      },
      externalResources: g("externalResources", []),
    };
  }

  /** Invalidate the in-memory cache (call after bulk updates) */
  invalidateCache(): void {
    cachedConfig = null;
  }
}

// --- Default consent regions (EU strict, US relaxed analytics, rest granted) ---

export const DEFAULT_CONSENT_REGIONS: ConsentRegion[] = [
  {
    region: [
      "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
      "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
      "PL", "PT", "RO", "SK", "SI", "ES", "SE",
      "IS", "LI", "NO", "CH", "GB",
    ],
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    wait_for_update: 500,
  },
  {
    region: ["US", "CA"],
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    wait_for_update: 500,
  },
  {
    region: ["BR"],
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    wait_for_update: 500,
  },
  {
    // Default — rest of the world
    region: [],
    analytics_storage: "granted",
    ad_storage: "granted",
    ad_user_data: "granted",
    ad_personalization: "granted",
  },
];

export const siteConfigService = new SiteConfigService();
