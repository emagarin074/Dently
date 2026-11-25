/**
 * Security Sanitization Utilities
 * Protects against Cross-Site Scripting (XSS) and HTML/Email Injection
 */

/**
 * Escapes HTML control characters in plain text to prevent injection into HTML contexts.
 */
export function escapeHtml(str: string | null | undefined): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Sanitizes rich HTML content by stripping executable scripts, event handlers,
 * iframe/object embeds, and javascript: pseudo-protocols.
 */
export function sanitizeHtml(rawHtml: string | null | undefined): string {
  if (!rawHtml) return "";

  let cleaned = String(rawHtml);

  // 1. Remove script tags and their content
  cleaned = cleaned.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    "",
  );

  // 2. Remove style tags and their content to prevent CSS-based injection
  cleaned = cleaned.replace(
    /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
    "",
  );

  // 3. Remove dangerous HTML elements (iframes, objects, embeds, applets, frames, forms, meta, link, base)
  cleaned = cleaned.replace(
    /<\/?(iframe|object|embed|applet|frame|frameset|form|meta|link|base)\b[^>]*>/gi,
    "",
  );

  // 4. Strip inline event handlers (e.g. onload=, onerror=, onclick=, onmouseover=)
  cleaned = cleaned.replace(
    /\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi,
    "",
  );

  // 5. Strip javascript: / vbscript: / data: pseudo-protocols in href or src
  cleaned = cleaned.replace(
    /\s+(href|src)\s*=\s*("javascript:[^"]*"|'javascript:[^']*'|javascript:[^\s>]+)/gi,
    "",
  );
  cleaned = cleaned.replace(
    /\s+(href|src)\s*=\s*("vbscript:[^"]*"|'vbscript:[^']*'|vbscript:[^\s>]+)/gi,
    "",
  );
  cleaned = cleaned.replace(
    /\s+(href|src)\s*=\s*("data:text\/html[^"]*"|'data:text\/html[^']*'|data:text\/html[^\s>]+)/gi,
    "",
  );

  return cleaned;
}
