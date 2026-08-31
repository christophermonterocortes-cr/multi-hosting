# Administrator Setup & Operations Guide 🛠️

This guide covers initial setup, administrative operations, user management, and maintenance workflows for the Multi Hosting platform.

---

## 1. Initial Administrator Bootstrapping

When the platform database initializes for the first time, an administrative account is automatically generated:

| Field | Default Value | Environment Variable |
|---|---|---|
| **Username** | `admin` | `DEFAULT_ADMIN_USERNAME` |
| **Email** | `admin@multihosting.local` | `DEFAULT_ADMIN_EMAIL` |
| **Password** | `AdminPass123!Secure` | `DEFAULT_ADMIN_PASSWORD` |

> [!IMPORTANT]
> Immediately log in and change the default administrator password in production deployments.

---

## 2. Administrator Dashboard Capabilities

Administrators have access to global management views:

### 📊 System Overview
- Total hosted websites across all platform users.
- Live container counts (Running, Stopped, Failed, Provisioning).
- Active database instances and allocated port counters.
- Host metrics (CPU %, RAM %, Disk %, and container uptime).

### 👥 User Management (`/users`)
- View all registered users and their project counts.
- Create new user accounts directly with `USER` or `ADMIN` roles.
- Deactivate or lock compromised user accounts with instant revocation.
- Promote or demote accounts safely (self-demotion is blocked).
- Delete user accounts and cascade-remove associated resources.

### 🔌 Port Allocator Matrix (`/ports`)
- Visual grid of the full port range (`16000-20000`).
- View allocations mapped to projects and creation timestamps.
- **Reconcile Allocations Tool**: Automatically detect orphaned port allocations or host collisions and reclaim them.

### 📜 Security & Audit Logs (`/audit-logs`)
- Searchable log of every sensitive action (logins, container lifecycle, file modifications, password resets).
- Passwords, authorization headers, and JWT tokens are automatically redacted.

### ⚙️ System Settings (`/settings`)
- `port_range_start`: Lower boundary of port allocator (default: `16000`).
- `port_range_end`: Upper boundary of port allocator (default: `20000`).
- `server_ip`: Public IP or domain name displayed to users for website URLs.
- `max_upload_size_mb`: File manager upload limit in MB (default: `100`).
- `allow_user_registrations`: Toggle public self-registration (`true` / `false`).

---

## 3. Managing Projects on Behalf of Users

Administrators can view, start, stop, restart, edit files, inspect container logs, and delete projects owned by any user from the main projects view.
