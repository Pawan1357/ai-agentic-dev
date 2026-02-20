# Assessment Backend (NestJS + MongoDB)

## Overview

Backend API for versioned property underwriting.

Core capabilities:

- strict REST resources
- semantic versioning (`Save As`: `1.1 -> 1.2`)
- immutable historical versions
- optimistic locking (`expectedRevision`)
- soft delete for brokers and tenants
- field-level audit logging
- standardized success/error response envelopes

## Tech Stack

- NestJS 10
- Mongoose 8
- MongoDB
- class-validator + class-transformer

## Project Structure

- `src/app.module.ts`: app composition and Mongo connection
- `src/main.ts`: global prefix, CORS, validation pipe, interceptors, exception filter
- `src/properties`: version lifecycle, save/save-as workflows, audit, seed, property persistence
- `src/brokers`: broker row APIs and business logic
- `src/tenants`: tenant row APIs and business logic
- `src/common`: shared exception model, response interfaces, logging/response interceptors, exception filter

## Database Design

This backend stores each concern in its own collection.

Collections:

- `property_versions`
- `brokers`
- `tenants`
- `audit_logs`

Relationship model:

- `property_versions` row is the parent snapshot for one `(propertyId, version)`
- `brokers.propertyVersionId -> property_versions._id`
- `tenants.propertyVersionId -> property_versions._id`
- broker/tenant rows also keep `propertyId` and `version` for traceability

Important indexes:

- `property_versions`: unique `{ propertyId, version }`
- `brokers`: unique `{ propertyVersionId, id }`
- `tenants`: unique `{ propertyVersionId, id }`

## API Base URL

- Local: `http://localhost:3000/api`
- Resource root: `/properties`

## Response Contract

Success shape:

```json
{
  "success": true,
  "message": "Request processed successfully",
  "path": "/api/properties/property-1/versions/1.1",
  "timestamp": "2026-02-19T10:00:00.000Z",
  "data": {}
}
```

Error shape:

```json
{
  "success": false,
  "message": "Revision mismatch detected. Reload latest data.",
  "errorCode": "CONFLICT",
  "statusCode": 409,
  "path": "/api/properties/property-1/versions/1.1",
  "timestamp": "2026-02-19T10:00:00.000Z",
  "details": {}
}
```

## APIs

### Property Version APIs

1. `GET /properties/:propertyId/versions`
2. `GET /properties/:propertyId/versions/:version`
3. `PUT /properties/:propertyId/versions/:version`
4. `POST /properties/:propertyId/versions/:version/save-as`
5. `GET /properties/:propertyId/versions/:version/audit-logs`

### Broker Row APIs

1. `POST /properties/:propertyId/versions/:version/brokers?expectedRevision={n}`
2. `PUT /properties/:propertyId/versions/:version/brokers/:brokerId?expectedRevision={n}`
3. `DELETE /properties/:propertyId/versions/:version/brokers/:brokerId?expectedRevision={n}`

### Tenant Row APIs

1. `POST /properties/:propertyId/versions/:version/tenants?expectedRevision={n}`
2. `PUT /properties/:propertyId/versions/:version/tenants/:tenantId?expectedRevision={n}`
3. `DELETE /properties/:propertyId/versions/:version/tenants/:tenantId?expectedRevision={n}`

Detailed API examples:

- `../docs/API.md`

## Business Flow

### Initial Load

1. Client calls `GET /versions` to get available versions.
2. Client loads selected version with `GET /versions/:version`.
3. API returns one merged snapshot containing `propertyDetails`, `underwritingInputs`, `brokers`, `tenants`.

### Main Save

1. Client sends full payload to `PUT /versions/:version`.
2. Backend validates DTO and business rules atomically.
3. Backend applies optimistic lock with `expectedRevision`.
4. Backend updates property version and replaces broker/tenant rows for that version.
5. Backend computes field diffs and writes audit log.

### Save As

1. Client posts current form snapshot to `POST /save-as`.
2. Backend verifies source revision.
3. Backend marks current latest as historical.
4. Backend creates next semantic version and persists related brokers/tenants.
5. Backend writes `SAVE_AS` audit entry.

### Row Save/Delete (Broker/Tenant)

1. Client calls row API with `expectedRevision`.
2. Backend validates target version is editable (non-historical).
3. Backend updates/soft-deletes row collection record(s).
4. Backend bumps revision on property version and logs audit diff.

## Key Rules Enforced

- historical versions are read-only
- property address is read-only
- save-as uses form snapshot and creates new version
- delete is soft delete only
- vacant tenant row is system-managed
- tenant/business lease rules validated server-side
- payloads rejected on any validation failure

## Local Setup

1. Start MongoDB.
2. Install deps:
   - `npm install`
3. Start backend:
   - `npm run start:dev`

Default env:

- `MONGODB_URI=mongodb://localhost:27017/assessment`
- `PORT=3000`

## Seed Data

- On startup, `PropertySeedService` seeds `property-1` version `1.1` if missing.
- Seed includes property details, underwriting inputs, initial broker, tenants, and vacant row.

## Test Commands

- Build: `npm run build`
- Unit tests + coverage: `npm test`
- E2E tests: `npm run test:e2e`

## Assumptions

- single-user mock mode with fixed actor: `mock.user@assessment.local`
- authentication/authorization is out of scope for assessment
- frontend is expected to still send full payload on main save
