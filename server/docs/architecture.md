## MediQR Server Architecture

The MediQR backend is an Express + TypeScript API that acts as a
Zero‑Knowledge "Blind Postman" between clients and Supabase.

Key responsibilities:

- Authenticate citizens and staff (with RBAC).
- Route encrypted blobs to and from Supabase PostgreSQL and Storage.
- Manage QR access tokens and emergency "break‑glass" flows.
- Maintain immutable audit logs of access.

See the root `docs/FinalPlan.md` for the full system architecture and
data model; this document can be expanded with sequence diagrams and
deployment details as the implementation matures.


