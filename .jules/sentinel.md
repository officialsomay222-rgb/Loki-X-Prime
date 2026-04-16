## 2025-04-16 - Prevent Path Injection in File Creation
**Vulnerability:** Constructing a file extension based directly on a user-provided `mimeType` in `api/index.ts` can open up path traversal and server-side logic exploitation risks.
**Learning:** Even trivial string matching or interpolation using user inputs (like `mimeType?.includes('mp4') ? 'mp4' : ...`) into system paths introduces unnecessary complexity and potential vulnerabilities if the logic is flawed or the parameter is heavily manipulated.
**Prevention:** Hardcode the extension or enforce an extremely strict validation whitelist independent of the raw user input when generating file names dynamically on the server.
