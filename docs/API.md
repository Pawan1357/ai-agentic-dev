# API Document

## Base URL

- `http://localhost:3000/api`

## Headers

- `Content-Type: application/json`
- `X-User-Role: admin | analyst | viewer` (defaults to `viewer` if omitted/invalid)

## Property Version APIs

1. `GET /properties/:propertyId/versions`  
Response: available versions for a property.

2. `GET /properties/:propertyId/versions/:version`  
Response: full property snapshot (`propertyDetails`, `underwritingInputs`, `brokers`, `tenants`).

3. `PUT /properties/:propertyId/versions/:version`  
Updates the current editable version.  
Body:

```json
{
  "expectedRevision": 2,
  "propertyDetails": {},
  "underwritingInputs": {},
  "brokers": [],
  "tenants": []
}
```

4. `POST /properties/:propertyId/versions/:version/save-as`  
Creates next semantic version (`1.1 -> 1.2`) and marks previous latest as historical.  
Body:

```json
{
  "expectedRevision": 2,
  "propertyDetails": {},
  "underwritingInputs": {},
  "brokers": [],
  "tenants": []
}
```

5. `GET /properties/:propertyId/versions/:version/audit-logs`  
Response: array of audit entries with field-level old/new values and `changedFieldCount`.

## Broker APIs

1. `POST /properties/:propertyId/versions/:version/brokers?expectedRevision={n}`
2. `PUT /properties/:propertyId/versions/:version/brokers/:brokerId?expectedRevision={n}`
3. `DELETE /properties/:propertyId/versions/:version/brokers/:brokerId?expectedRevision={n}`

## Tenant APIs

1. `POST /properties/:propertyId/versions/:version/tenants?expectedRevision={n}`
2. `PUT /properties/:propertyId/versions/:version/tenants/:tenantId?expectedRevision={n}`
3. `DELETE /properties/:propertyId/versions/:version/tenants/:tenantId?expectedRevision={n}`

## Success Envelope

```json
{
  "success": true,
  "message": "Request processed successfully",
  "path": "/api/properties/property-1/versions/1.1",
  "timestamp": "2026-02-20T00:00:00.000Z",
  "data": {}
}
```

## Error Envelope

```json
{
  "success": false,
  "message": "Revision mismatch detected. Reload latest data.",
  "errorCode": "CONFLICT",
  "statusCode": 409,
  "path": "/api/properties/property-1/versions/1.1",
  "timestamp": "2026-02-20T00:00:00.000Z",
  "details": {}
}
```
