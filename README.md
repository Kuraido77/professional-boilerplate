# Professional Node.js, TypeScript & MySQL Boilerplate

A production-ready REST API boilerplate built with **Node.js**, **Express**, **TypeScript**, **TypeORM**, and **MySQL**. Designed with a clean layered architecture, this foundation implements centralized error handling, Joi request and environment validation, structured logging with request tracing, security hardening, versioned database migrations, and a complete **User CRUD** vertical slice.

---

## Features

- **Layered Architecture:** Clean separation of concerns across Routes, Middleware, Controllers, Services, DTOs, and TypeORM Entities.
- **Strict TypeScript Configuration:** Enforced type safety (`strict: true`), decorator support for TypeORM, and fast development reloads via `ts-node-dev`.
- **Environment Validation:** Fail-fast startup validation using **Joi** (`src/config/env.ts`) to ensure required database and server variables are properly configured.
- **Centralized Error Handling:** Custom operational error hierarchy (`AppError`, `NotFoundError`, `ValidationError`, `ConflictError`, `UnauthorizedError`, `ForbiddenError`, `InternalError`) paired with an `asyncHandler` wrapper and global error middleware.
- **Request Validation:** Schema-based validation middleware for `body`, `params`, and `query` payloads with automatic type conversion and unknown field stripping.
- **Structured Logging & Request Tracing:** **Winston** logger configured with rotating JSON file transports (`logs/combined.log`, `logs/error.log`), colorized development console output, and UUID-based `X-Request-ID` tracking.
- **Security Hardening:** Configured with **Helmet** HTTP security headers, **CORS** origin restrictions, JSON payload size limits (`10kb`), and **Express Rate Limit** protection.
- **Database Migrations & Seeding:** Controlled schema evolution via TypeORM CLI migrations (`synchronize: false`) and idempotent database seeders using `bcrypt` password hashing.
- **Standardized API Responses:** Consistent JSON envelopes for single resources, paginated collections, created resources, and structured error payloads.

---

## Project Structure

```text
professional-boilerplate/
├── logs/                       # Winston log output (combined.log, error.log)
├── src/
│   ├── config/
│   │   ├── data-source.ts      # TypeORM DataSource configuration
│   │   └── env.ts              # Joi environment variable validation
│   ├── controllers/
│   │   └── userController.ts   # HTTP request/response handling for Users
│   ├── dto/
│   │   └── user.dto.ts         # Joi validation schemas (body, params, query)
│   ├── entities/
│   │   └── User.ts             # TypeORM User entity definition
│   ├── middleware/
│   │   ├── errorHandler.ts     # Global error and 404 route handlers
│   │   ├── requestLogger.ts    # HTTP request/response logger with request IDs
│   │   ├── security.ts         # Helmet, CORS, and rate-limiting middleware
│   │   └── validate.ts         # Generic Joi validation middleware
│   ├── migrations/             # TypeORM versioned database migrations
│   ├── routes/
│   │   ├── healthRoutes.ts     # Server and database health check endpoint
│   │   └── userRoutes.ts       # User CRUD route definitions
│   ├── seeds/
│   │   ├── runSeeds.ts         # Seed runner entry script
│   │   └── userSeeder.ts       # Initial user seed data
│   ├── services/
│   │   └── userService.ts      # Business logic and database operations
│   ├── utils/
│   │   ├── asyncHandler.ts     # Async route error forwarding wrapper
│   │   ├── errors.ts           # Custom AppError subclasses
│   │   ├── logger.ts           # Winston logger configuration
│   │   └── response.ts         # Standardized JSON response helpers
│   └── index.ts                # Application entry point & graceful shutdown
├── tests/
│   ├── unit/
│   └── integration/
├── .env.example                # Environment variable template
├── .gitignore
├── package.json
└── tsconfig.json

## Reflection Questions

### 1. What was the most challenging part of building this boilerplate? How did you overcome it?
The most challenging part was aligning strict TypeScript compilation rules with TypeORM's v0.3+ query APIs and database migrations. Specifically, configuring repository `select` options to exclude sensitive fields like `password` required using typed `FindOptionsSelect<User>` object syntax rather than string arrays, and avoiding duplicate index conflicts (`ER_DUP_KEYNAME`) on the `users` table required carefully reviewing how `@Index` and `unique: true` decorators translate into generated migration SQL. I overcame these issues by reading TypeORM's TypeScript type definitions closely, inspecting generated migration files before running `migration:run`, and verifying every layer end-to-end with the 10 Postman test scenarios.

---

### 2. How does this boilerplate differ from your Midterm project? What specific improvements did you make?
In my Midterm Express/TypeORM/MySQL project, the focus was primarily on getting basic CRUD endpoints working, which meant request validation, error responses, and schema updates were handled with simpler, more repetitive patterns. This boilerplate upgrades that foundation into a production-ready architecture through several key improvements:
* **Layered Separation of Concerns:** Isolates HTTP handling (`UserController`), business logic (`UserService`), validation schemas (`user.dto.ts`), and persistence (`User` entity).
* **Centralized Error & Response Pipelines:** Replaces scattered `try-catch` blocks and inconsistent `res.json()` calls with custom `AppError` subclasses, `asyncHandler`, global `errorHandler`, and standardized response helpers (`sendSuccess`, `sendCreated`, `sendPaginated`).
* **Controlled Schema Management:** Replaces automatic schema syncing with versioned TypeORM migrations and idempotent database seeders.
* **Production Middleware & Startup Guards:** Adds fail-fast Joi `.env` validation, Winston structured logging with request IDs, Helmet headers, strict CORS rules, and API rate limiting.

---

### 3. Why is centralized error handling better than `try-catch` in every controller?
Repeating `try-catch` blocks in every controller violates the DRY principle, clutters request handlers with repetitive error-formatting logic, and risks returning inconsistent status codes across routes. With `asyncHandler` and a single `errorHandler` middleware:
* **Cleaner Controllers and Services:** Methods focus strictly on the primary logic and simply throw semantic operational errors (`NotFoundError`, `ConflictError`, `ValidationError`) when something goes wrong.
* **Uniform API Contract:** Every error—including custom `AppError` instances, TypeORM `QueryFailedError` exceptions, and malformed JSON payloads—is formatted into a predictable `{ success: false, error: { code, message } }` response.
* **Environment-Aware Security:** Stack traces are automatically included in `development` for debugging but stripped in `production` to prevent leaking internal implementation details.

---

### 4. How does request validation with Joi improve security and code quality?
* **Security:** Joi validates incoming `body`, `params`, and `query` inputs before they ever reach the service or database layer. Enabling `stripUnknown: true` prevents mass-assignment attacks (such as a client injecting restricted fields like `isActive` into a `POST /api/users` payload), while strict type, length, email, and password regex constraints block malformed data early.
* **Code Quality:** Centralizing rules inside DTO schemas (`src/dto/user.dto.ts`) eliminates manual `if` checks inside controllers. Additionally, `convert: true` automatically coerces route parameters (such as `:id`) and pagination query strings (`page`, `limit`) into validated numbers, ensuring controllers and services always work with reliable types.

---

### 5. What's the difference between `synchronize: true` and migrations? Why are migrations essential for production?
* **`synchronize: true`** tells TypeORM to automatically compare entity definitions against the database schema on every server startup and execute `ALTER` or `DROP` statements immediately.
* **Migrations** are explicit, version-controlled TypeScript files containing `up()` and `down()` methods that are generated, reviewed, and executed intentionally via CLI commands (`migration:run` / `migration:revert`).
* **Why migrations are essential for production:** In production, `synchronize: true` can silently drop columns or tables during entity refactoring, causing irreversible data loss. Migrations provide an auditable history of schema changes, allow safe data transformations alongside structural updates, keep multiple environments synchronized, and offer a controlled rollback path if a deployment fails.

---

### 6. How does structured logging (Winston) help in production debugging compared to `console.log`?
`console.log` writes unstructured plain text to standard output with no severity filtering, no timestamps, no persistence once a process restarts, and no way to group logs from concurrent users. **Winston** improves production debugging by providing:
* **Severity Levels (`debug`, `info`, `warn`, `error`):** Allows filtering out verbose debug logs in production while isolating warnings and failures.
* **Structured JSON & Request Correlation:** Outputs machine-readable JSON enriched with timestamps, module context (`HTTP`, `UserService`), status codes, response latency, and a unique `requestId` (`X-Request-ID`) so engineers can trace a single failing request across logs.
* **Persistent Log Rotation:** Writes logs to `logs/combined.log` and `logs/error.log` with file size and count limits (`maxsize`, `maxFiles`) so diagnostic history survives server restarts without exhausting disk space.

---

### 7. If you had to add a new feature (e.g., Product CRUD), how would you use this boilerplate? What would you need to add?
Because all cross-cutting infrastructure (environment config, security middleware, logging, validation, error handling, and response helpers) is already built, adding **Product CRUD** only requires creating a new vertical slice following the exact pattern established for Users:
1. **Entity (`src/entities/Product.ts`):** Define the `Product` entity (`id`, `name`, `description`, `price`, `stock`, timestamps) and register it in `src/config/data-source.ts`.
2. **Migration:** Generate and apply the schema migration using `npm run migration:generate -- -n AddProductsTable` and `npm run migration:run`.
3. **DTOs (`src/dto/product.dto.ts`):** Create Joi validation schemas (`createProductSchema`, `updateProductSchema`, `productQuerySchema`).
4. **Service (`src/services/productService.ts`):** Implement `findAll`, `findById`, `create`, `update`, and `delete`, throwing `NotFoundError` or `ConflictError` for business rule violations.
5. **Controller (`src/controllers/productController.ts`):** Handle requests and return standardized responses via `sendSuccess`, `sendCreated`, `sendPaginated`, and `sendNoContent`.
6. **Routes (`src/routes/productRoutes.ts` & `src/index.ts`):** Attach `validate()` and `asyncHandler()` to each endpoint and mount `app.use('/api/products', productRoutes)` in `src/index.ts`.

---

### 8. What additional features would you add to make this boilerplate even more production-ready?
To prepare this boilerplate for full-scale production deployment and the Final Project, I would add:
1. **JWT Authentication & Role-Based Access Control (RBAC):** Login/registration endpoints (`/api/auth/login`, `/api/auth/register`), an `authenticate` middleware to verify access tokens, and an `authorize` middleware to restrict administrative routes.
2. **Automated Testing Suite:** Unit tests for services and utilities alongside integration tests using **Jest** and **Supertest** against an isolated test database (`NODE_ENV=test`) inside the `tests/` folder.
3. **Interactive API Documentation:** OpenAPI/Swagger specification served at `/api/docs` using `swagger-ui-express` so frontend developers can inspect and test endpoints directly.
4. **Docker & CI/CD Automation:** A `Dockerfile` and `docker-compose.yml` (orchestrating the Node.js API and MySQL container) paired with a GitHub Actions pipeline to automatically build and run tests on every push.
