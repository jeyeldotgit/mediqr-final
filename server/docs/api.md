## MediQR Server API – Overview

This document will describe the HTTP API exposed by the MediQR backend.

Planned categories (see `docs/FinalPlan.md` in the project root for full context):

- **Identity**
  - `POST /auth/init`
- **Vault**
  - `POST /vault/sync`
  - `GET /vault/:id`
  - `POST /record/access`
- **Social Recovery**
  - `POST /recovery/shards`
  - `POST /social/shard`
- **QR & Emergency**
  - `POST /qr/rotate`
  - `POST /emergency/break-glass`


