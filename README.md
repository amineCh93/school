# project

A minimal JavaScript REST API for school management.

## Endpoint

- `GET /api/schools` returns a sample list of schools.
- `GET /` returns a basic API status message.
- `POST /auth/register` creates a user account.
- `POST /auth/login` returns a JWT token.
- `GET /auth/me` returns authenticated user profile (requires `Authorization: Bearer <token>`).

## Environment

- `AUTH_SECRET` is required and sets the JWT signing secret.
- `AUTH_ISSUER` sets JWT issuer (default: `school-management-api`).
- `AUTH_AUDIENCE` sets JWT audience (default: `school-management-clients`).
- `BCRYPT_ROUNDS` configures bcrypt cost factor (default: `12`, allowed range `10-14`).
- `CORS_ORIGIN` sets allowed origins as comma-separated values.
- `PUBLIC_RATE_LIMIT_WINDOW_MS` sets non-auth rate-limit window in ms (default: `900000`).
- `PUBLIC_RATE_LIMIT_MAX` sets non-auth max requests per window (default: `200`).

## Password Policy

- Passwords must be at least 10 characters and include uppercase, lowercase, number, and symbol.

## Error Format

- Errors follow a consistent shape: `{ "error": { "code": "...", "message": "..." } }`.
- Login throttling returns HTTP `429` and includes the `Retry-After` header.
- Public non-auth rate limiting returns HTTP `429` with `RATE_LIMIT_EXCEEDED`.
- Auth request bodies are schema-validated and return `VALIDATION_ERROR` with `error.details.issues` when invalid.
- Non-object JSON bodies return `INVALID_BODY_TYPE`.
- Malformed JSON returns HTTP `400` with `INVALID_JSON`.
- Oversized payloads return HTTP `413` with `PAYLOAD_TOO_LARGE`.

## Built-In Security

- `helmet` sets secure HTTP headers.
- CORS is allowlisted and only returns CORS headers for trusted origins.
- `x-powered-by` is disabled.
- JWT verification enforces algorithm, issuer, and audience.
- Non-auth routes are protected by request rate limiting with standard `RateLimit` headers.

## Validation Limits

- Auth schemas are strict and reject unknown fields.
- `name` max length is `100`.
- `email` max length is `254` and must be valid.
- `password` max length is `128`.
- JSON request bodies are limited to `16kb`.

## Run

1. Install dependencies with `npm install`
2. Start the API with `npm start`

The server runs locally on port `3000`.

## Test

- Run `npm test` to execute the API tests.

## Structure

- `app.js` starts the Express app.
- `routes/api.js` contains the school management routes.
- `tests/api.test.js` verifies the API responses.
