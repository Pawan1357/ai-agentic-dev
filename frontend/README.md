# Assessment Frontend (Angular)

## Overview

Angular UI for the versioned property underwriting assessment.

Main goals:

- preserve cross-tab draft state
- support main save + save-as workflows
- support row-level broker/tenant actions
- show backend errors clearly

## Tech Stack

- Angular 18
- RxJS
- Karma + Jasmine

## Project Structure

- `src/app/core`: API service, global store, validators, guard, models, error parsing
- `src/app/features/shell`: top header, version selector, save/save-as actions, banners
- `src/app/features/property-details`: property fields + broker table + lease abstract
- `src/app/features/underwriting`: underwriting inputs + tenant table
- `src/app/shared`: shared module imports

## How the Frontend Works

State is centralized in `PropertyStoreService`.

The store manages:

- loaded version snapshot
- editable draft
- dirty state
- client-side validation messages
- server field-level errors

Both tabs read/write the same store state, so unsaved edits persist while switching tabs.

## API Contract Used

Base path: `/api/properties`

Version APIs:

1. `GET /:propertyId/versions`
2. `GET /:propertyId/versions/:version`
3. `PUT /:propertyId/versions/:version`
4. `POST /:propertyId/versions/:version/save-as`
5. `GET /:propertyId/versions/:version/audit-logs`

Broker APIs:

1. `POST /:propertyId/versions/:version/brokers?expectedRevision={n}`
2. `PUT /:propertyId/versions/:version/brokers/:brokerId?expectedRevision={n}`
3. `DELETE /:propertyId/versions/:version/brokers/:brokerId?expectedRevision={n}`

Tenant APIs:

1. `POST /:propertyId/versions/:version/tenants?expectedRevision={n}`
2. `PUT /:propertyId/versions/:version/tenants/:tenantId?expectedRevision={n}`
3. `DELETE /:propertyId/versions/:version/tenants/:tenantId?expectedRevision={n}`

## Frontend Flow

### Load Flow

1. Fetch version list.
2. Auto-select latest editable version.
3. Fetch selected version snapshot.
4. Render Property Details and Underwriting tabs from same draft state.

### Main Save Flow

1. Validate draft client-side.
2. Build one combined payload:
   - `propertyDetails`
   - `underwritingInputs`
   - `brokers`
   - `tenants`
   - `expectedRevision`
3. Call `PUT /versions/:version`.
4. Replace draft with backend response and reset dirty state.

### Save As Flow

1. Use current draft snapshot (not forced pre-save on current version).
2. Call `POST /versions/:version/save-as`.
3. Backend creates next semantic version.
4. UI reloads to returned version snapshot and refreshes version list.

### Broker/Tenant Row Flow

1. Add row creates client-side draft row.
2. Row save decides create vs update using persisted identity checks.
3. Calls broker/tenant row API with `expectedRevision`.
4. Store merges backend row result while preserving unsaved fields in other sections.
5. Row delete performs soft delete via backend.

## Validation and UX Rules

- historical versions are non-editable
- main save/save-as disabled when no changes
- unsaved change warning on version switch cancel/confirm
- unsaved change warning on browser reload/close
- vacant row cannot be edited/deleted
- success/error banners shown at shell level

## Running Locally

1. Start backend first on `http://localhost:3000`.
2. Install dependencies:
   - `npm install`
3. Start frontend:
   - `npm start`
4. Open:
   - `http://localhost:4200`

## API Proxy

- `src/environments/environment.ts` uses `apiBaseUrl: ''`
- `proxy.conf.json` forwards `/api` to `http://localhost:3000`

## Testing and Build

- Unit tests + coverage: `npm test`
- Production build: `npm run build`

## Assumptions

- single-user assessment mode
- authentication and RBAC out of scope
- backend remains source of truth for final validation and persistence
