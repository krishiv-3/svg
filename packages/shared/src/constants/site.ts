/**
 * Site-wide constants.
 *
 * Only genuinely known facts belong here. Descriptions, addresses, phone
 * numbers, registration details and statistics are supplied by the organisation
 * in Phase 10 and stored in the CMS — never invented in code.
 */

export const SITE_NAME = 'Shri Vanshidhar Gaushala' as const;

/** IANA timezone used for display; the blueprint fixes Asia/Kolkata. */
export const SITE_TIMEZONE = 'Asia/Kolkata' as const;

/** Locale tag for dates and numbers. */
export const SITE_LOCALE = 'en-IN' as const;

/** Product identity, used in health, logs and the API index. */
export const API_SERVICE_NAME = 'gaushala-api' as const;
export const WEB_SERVICE_NAME = 'gaushala-web' as const;
