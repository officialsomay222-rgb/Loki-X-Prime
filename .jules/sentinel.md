## 2025-04-16 - Prevent Path Injection in File Creation
**Vulnerability:** Constructing a file extension based directly on a user-provided `mimeType` in `api/index.ts` can open up path traversal and server-side logic exploitation risks.
**Learning:** Even trivial string matching or interpolation using user inputs (like `mimeType?.includes('mp4') ? 'mp4' : ...`) into system paths introduces unnecessary complexity and potential vulnerabilities if the logic is flawed or the parameter is heavily manipulated.
**Prevention:** Hardcode the extension or enforce an extremely strict validation whitelist independent of the raw user input when generating file names dynamically on the server.
## 2026-04-17 - [Added express rate-limiting and helmet]
**Vulnerability:** The Express server lacked any rate-limiting, and was not setting any secure HTTP headers out-of-the box. This opens the app up to basic attacks like basic DoS, brute force on any endpoints, and leaves the application lacking simple default security response headers (e.g. Content-Security-Policy or X-Frame-Options), allowing potential minor side-channel attacks or frame hijacking.
**Learning:** This is a basic setup of an express app, which naturally doesn't enforce these, leaving the developers responsible for applying basic defense-in-depth principles.
**Prevention:** Remember to always install helmet and express-rate-limit during the initial setup of an Express server as baseline security practices.
