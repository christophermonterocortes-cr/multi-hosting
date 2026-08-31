# Security Policy & Hardening Guide 🔒

This document outlines the security architecture, threat model, and hardening recommendations for the Multi Hosting platform.

---

## 1. Authentication & Session Security

- **Password Hashing**: Passwords are encrypted using **bcrypt** with a work factor of 12 (or Argon2id).
- **Progressive Account Lockout**:
  - Accounts are locked for 15 minutes after 5 consecutive failed login attempts.
  - Mitigates brute-force attacks against user and administrator passwords.
- **JWT Protection**: Tokens are signed using cryptographically strong secrets (`HS256` / `RS256`), with expiration periods and user activity checks.
- **Role-Based Access Control (RBAC)**: Enforced across all endpoints. Non-administrator users are restricted strictly to their own projects and credentials.

---

## 2. Cryptographic Security at Rest

- Tenant database passwords are encrypted at rest in the platform database using **AES-256-GCM**.
- Each stored password utilizes a unique 12-byte initialization vector (`iv`) and 16-byte authentication tag (`authTag`).
- Passwords are decrypted only on-demand when an authorized owner or administrator explicitly requests credential reveal.

---

## 3. Container & Host Isolation

- **Docker Socket Protection**: The Docker Engine socket (`/var/run/docker.sock`) is accessed **ONLY** by the backend control plane container. It is **NEVER** mounted into user-controlled website containers.
- **Dedicated Volume Mounts**: Each container mounts strictly its own project directory (`/data/projects/:id:/var/www/html`).
- **Resource Constraints**: Default per-container limits (Memory: 256MB, CPU: 1.0 core) prevent noisy neighbor or denial-of-service impacts.

---

## 4. File Security & Anti-Zip-Slip Protection

- **Path Traversal Prevention**: Resolves all file paths to absolute paths and checks that `path.relative(projectRoot, resolvedPath)` does not start with `..`.
- **Zip Slip Exploit Prevention**: Archive entry headers are validated against path traversal characters before extraction. Malicious archives attempting to extract entries outside the target directory are rejected with security alerts.

---

## 5. Network & Firewall Hardening

- Only ports `80` (HTTP) and `443` (HTTPS) should be exposed publicly through the reverse proxy.
- Port range `16000-20000` is mapped directly to hosted website containers. If a reverse proxy handles domain routing, ports `16000-20000` can be bound to `127.0.0.1`.
- Database ports `5432` and `3306` should remain on internal Docker networks and not be exposed to the public internet unless required.
