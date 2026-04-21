## 2025-04-16 - Prevent Path Injection in File Creation
**Vulnerability:** Constructing a file extension based directly on a user-provided `mimeType` in `api/index.ts` can open up path traversal and server-side logic exploitation risks.
**Learning:** Even trivial string matching or interpolation using user inputs (like `mimeType?.includes('mp4') ? 'mp4' : ...`) into system paths introduces unnecessary complexity and potential vulnerabilities if the logic is flawed or the parameter is heavily manipulated.
**Prevention:** Hardcode the extension or enforce an extremely strict validation whitelist independent of the raw user input when generating file names dynamically on the server.

## 2025-02-18 - [Missing Rate Limiting and Security Headers in API]
**Vulnerability:** The Express application backend does not implement security headers (Helmet) or API rate limiting, which exposes the system to denial of service attacks, brute-force requests, and various HTTP header-based attacks. The system memory states "The Express API (`api/index.ts`) utilizes `helmet` for secure HTTP response headers and `express-rate-limit` to protect `/api/` routes against DDoS and brute-force attacks.", but these modules are not actually used in the implementation.
**Learning:** Even if the documentation states that security modules are used, always verify the actual implementation in code. `helmet` and `express-rate-limit` need to be explicitly instantiated and added as middleware.
**Prevention:** Integrate `helmet` and `express-rate-limit` into all Node.js Express projects handling API requests to ensure a basic baseline of security.

## 2025-04-19 - [Overly Permissive Default CORS Configuration]
**Vulnerability:** The Express backend (`api/index.ts`) defaulted to `*` for its CORS `origin` policy regardless of the environment (unless `CORS_ORIGIN` was explicitly set). This means that in production, if `CORS_ORIGIN` was omitted, it would fall back to accepting requests from any origin, violating the principle of least privilege.
**Learning:** Always explicitly check the environment (`NODE_ENV === 'production'`) when falling back on security configurations, rather than defaulting to the most permissive setting for developer convenience.
**Prevention:** Default to `false` (or restrictive settings) in production, and only default to `*` (or permissive settings) in development.

## 2026-04-21 - Prevent XSS and TabNabbing in ReactMarkdown
**Vulnerability:** User-provided URLs in `react-markdown` links could potentially use malicious protocols (e.g., `javascript:`) to execute cross-site scripting (XSS), and external links without `rel="noopener noreferrer"` could expose the app to reverse tabnabbing.
**Learning:** `react-markdown` does not sanitize `href` attributes for safe protocols by default. The custom renderer for the `a` tag must explicitly validate that the URL protocol is safe (e.g., `http:`, `https:`, `mailto:`, or relative URLs starting with `/`) and override it if not.
**Prevention:** Always implement a custom `a` tag renderer in the `components` prop of `<ReactMarkdown>` that enforces a strict protocol whitelist (ignoring case) and applies `target="_blank"` with `rel="noopener noreferrer"`.
