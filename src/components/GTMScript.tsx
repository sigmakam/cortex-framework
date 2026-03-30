/**
 * Google Tag Manager integration for Cortex Framework.
 *
 * Loading order in <head> (CRITICAL):
 *   1. Consent defaults (gtag consent default) — via ConsentScript
 *   2. GTM snippet — loads GTM container
 *      └── GTM loads CMP (e.g. Cookiebot) as a tag
 *
 * Cortex is CMP-agnostic. CMP is configured inside GTM, not in code.
 */

const GTM_ID_PATTERN = /^GTM-[A-Z0-9]{1,10}$/;

function validateGtmId(gtmId: string): string {
  if (!GTM_ID_PATTERN.test(gtmId)) {
    throw new Error(
      `Invalid GTM ID: "${gtmId}". Must match pattern GTM-XXXXXXX (alphanumeric).`,
    );
  }
  return gtmId;
}

/**
 * Generates consent defaults + GTM initialization script.
 * Renders as a <script> in <head> — server component safe.
 *
 * @param consentScript - JS code from generateConsentScript() or generateFallbackConsentScript()
 * @param gtmId - GTM container ID from site_config DB (validated against XSS)
 */
export function GTMHead({
  consentScript,
  gtmId,
}: {
  consentScript: string;
  gtmId: string;
}) {
  const safeGtmId = validateGtmId(gtmId);

  const gtmSnippet = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${safeGtmId}');`;

  return (
    <>
      {/* STEP 1: dataLayer init + consent defaults — BEFORE GTM */}
      <script
        dangerouslySetInnerHTML={{
          __html: consentScript,
        }}
      />
      {/* STEP 2: GTM snippet — AFTER consent defaults */}
      <script
        dangerouslySetInnerHTML={{
          __html: gtmSnippet,
        }}
      />
    </>
  );
}

/**
 * GTM noscript fallback — place immediately after <body> opening tag.
 */
export function GTMNoScript({ gtmId }: { gtmId: string }) {
  const safeGtmId = validateGtmId(gtmId);
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${safeGtmId}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>
  );
}
