# Multi Hosting Platform Architecture 🏛️

Multi Hosting is structured as a decoupled, micro-containerized hosting control plane designed for high tenant isolation, automated resource allocation, and simple scalability.

---

## 1. System Architecture

```mermaid
graph TB
    subgraph Client["Client Browser"]
        UI["React SPA (Tailwind CSS)"]
    end

    subgraph Gateway["Reverse Proxy Layer"]
        NginxGateway["Nginx Gateway / Traefik\nPorts: 80, 443"]
    end

    subgraph ControlPlane["Multi Hosting Control Plane"]
        API["Node.js / Express API Server (Port 5000)"]
        SQLiteDB[("SQLite WAL Database\n(multi_hosting.sqlite)")]
        PortEngine["Atomic Port Allocator\n(Range: 16000-20000)"]
        DockerAdapter["Docker / Podman Engine Adapter\n(/var/run/docker.sock)"]
        DBProvisioner["Database Provisioning Service\n(AES-256 Encrypted Store)"]
        FileManager["Secure File Manager\n(Anti-ZipSlip Validator)"]
    end

    subgraph TenantRuntimes["Containerized Workloads"]
        subgraph StaticContainers["Static Projects"]
            Site1["Site 1 (Nginx Alpine)\nHost Port: 16000"]
            Site2["Site 2 (Nginx Alpine)\nHost Port: 16001"]
        end
        subgraph PHPContainers["PHP Projects"]
            Site3["Site 3 (PHP 8.2 FPM)\nHost Port: 16002"]
            Site4["Site 4 (PHP 8.2 FPM)\nHost Port: 16003"]
        end
    end

    subgraph ManagedDatabases["Database Engine Layer"]
        PGServer[("PostgreSQL 16 Server\n(Dedicated DBs & Scoped Users)")]
        MariaServer[("MariaDB 11.2 Server\n(Dedicated DBs & Scoped Users)")]
    end

    UI -->|HTTP / WebSocket| NginxGateway
    NginxGateway -->|/api/*| API
    NginxGateway -->|/*| UI
    
    API --> SQLiteDB
    API --> PortEngine
    API --> DockerAdapter
    API --> DBProvisioner
    API --> FileManager

    DockerAdapter -->|Spawns| Site1
    DockerAdapter -->|Spawns| Site2
    DockerAdapter -->|Spawns| Site3
    DockerAdapter -->|Spawns| Site4

    DBProvisioner -->|Provisions scoped users| PGServer
    DBProvisioner -->|Provisions scoped users| MariaServer

    Site3 -.->|Scoped TCP Connection| PGServer
    Site4 -.->|Scoped TCP Connection| MariaServer
```

---

## 2. Core Subsystems

### 🔌 Port Management System
1. **Allocation Range**: Configurable lower (`16000`) and upper (`20000`) bounds.
2. **Dual-Check Verification**:
   - **Database State**: Verifies port is not marked `ALLOCATED` or `RESERVED`.
   - **Host Socket Probe**: Actively tests TCP socket binding on `0.0.0.0:port` to ensure no host process occupies the port.
3. **Concurrency Locking**: Utilizes in-memory serialization mutexes and SQLite immediate transactions to guarantee that simultaneous website provisioning never receives duplicate ports.
4. **Lifecycle Synchronization**: Ports remain assigned while websites are running, stopped, or suspended. A port is released and made available for reallocation only when a project is deleted.

### 🗄️ Database Provisioning & Scoping
1. **Dedicated Database & User**: For every requested database, unique database names (e.g. `db_site_a_7f2b`) and usernames (`u_site_a_7f2b`) are generated.
2. **Strict Privilege Scoping**:
   - `REVOKE ALL ON DATABASE ... FROM PUBLIC`
   - `REVOKE ALL ON SCHEMA public FROM PUBLIC`
   - Scoped user is granted privileges ONLY to their assigned database and schema.
   - Users cannot connect to or list other tenant databases.
3. **Encryption at Rest**: Passwords are encrypted with **AES-256-GCM** using unique 96-bit initialization vectors and authentication tags.

### 📁 File Isolation & Zip-Slip Protection
1. **Sandboxed Root**: Each project is assigned an isolated directory `/data/projects/:id`.
2. **Path Sanitization**: Canonical path resolution strictly enforces that any read, write, upload, or deletion request resides strictly within the project directory.
3. **Zip-Slip Attack Prevention**: The archive extractor inspects all zip entry headers before extraction, rejecting any entry containing `..`, absolute paths, or null bytes.
