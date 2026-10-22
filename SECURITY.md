# Security Policy

## Supported Versions

We actively support and provide security fixes for the latest release:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

---

## 🔒 Security Architecture in Tuck

Tuck is architected following industry-standard defensive security:
1. **Zero-Knowledge / Client-Side Persistence**: Primary data (documents, lists, notes, links) is written directly to client-side Dexie IndexedDB.
2. **Encrypted Storage**: Sensitive document numbers and images are stored with client-side masking and encryption.
3. **Strict Supabase Row-Level Security (RLS)**: Public `anon` users have zero read/write access. Database operations are strictly mediated through authenticated server-side API handlers (`service_role`).
4. **Hardened HTTP Headers**: Strict Content Security Policy, `HSTS`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and restricted permissions.
5. **No Secret Leaks**: Zero hardcoded credentials or database secrets are included in client bundles or git history.

---

## 🛡️ Reporting a Vulnerability

If you discover a security vulnerability in Tuck, please report it responsibly:

1. **Do NOT report security vulnerabilities through public GitHub issues.**
2. Send an email to **`raviattrash@gmail.com`** (or open a private security advisory through GitHub).
3. Please include:
   - A description of the vulnerability and its potential impact.
   - Step-by-step instructions or proof-of-concept (PoC) to reproduce the issue.
   - Any recommended remediations if you have them.

We take security seriously and will acknowledge your report within 48 hours and work on a prompt remediation.
