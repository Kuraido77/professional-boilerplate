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
<<<<<<< HEAD
=======



### 1. Authentication vs. Authorization

* **Authentication (AuthN)** verifies **who** a user is by validating proof of identity (such as an email and password at `/api/auth/login`, biometrics, or a valid JWT). It always happens first.
* **Authorization (AuthZ)** determines **what** an authenticated user is permitted to access or do based on their roles, ownership, or permissions. It happens after identity is established.
* **Real-World Example:** At an airport, showing your passport at security proves your identity (**authentication**). Scanning your boarding pass at the gate or lounge determines whether you are allowed to enter First Class or board that specific flight (**authorization**).

---

### 2. Why JWT Is "Stateless" and How That Benefits Scalability

* **Stateless architecture:** A JWT carries all the identity and session metadata the server needs (`userId`, `email`, expiration timestamp `exp`) inside the token itself, protected by a cryptographic signature. The server does not store active session IDs in RAM or look up a session row in MySQL/Redis on every request—it simply verifies the signature math using `JWT_SECRET`.
* **Scalability benefits:** Because individual Node.js servers hold zero local session state, you can run multiple backend instances behind a load balancer without needing "sticky sessions" (routing a user back to the exact same server) or hitting a shared session database on every API call. Any server instance with the same `JWT_SECRET` can validate any user's token independently.

---

### 3. The Three Parts of a JWT Token

A JWT consists of three Base64URL-encoded JSON strings separated by dots (`header.payload.signature`):

1. **Header:** Describes the token metadata—specifically the token type (`"typ": "JWT"`) and the cryptographic signing algorithm used (e.g., `"alg": "HS256"`).
2. **Payload:** Contains the **claims**—statements about the user and token lifecycle, including custom application fields (`userId`, `email`) and standard registered claims (`iat` for issued-at time, `exp` for expiration time).
3. **Signature:** Computed by hashing the encoded Header and Payload together with the server's secret key (`config.jwt.secret`). It guarantees **integrity and authenticity**—if someone edits a single character in the payload (such as changing `userId: 4` to `userId: 1`), the signature verification fails immediately.

---

### 4. Why You Should Never Put Sensitive Data in the JWT Payload

Base64URL encoding is **encoding, not encryption**. Anyone who intercepts or inspects a JWT—via browser DevTools, network logs, proxies, or a decoder like `jwt.io`—can decode the header and payload back into readable plain-text JSON without knowing your `JWT_SECRET`. The secret key only prevents someone from *forging or modifying* the token; it does not hide its contents. Storing passwords, API keys, or personal identification numbers in the payload exposes them directly to anyone who views the token.

---

### 5. How `bcrypt` Protects Passwords (and the Role of "Salt" and "Rounds")

* **One-way adaptive hashing:** `bcrypt` transforms a plain-text password into an irreversible fixed-length hash using the Blowfish cipher. Passwords cannot be decrypted back to plain text; during login (`bcrypt.compare`), `bcrypt` hashes the submitted password using the same salt and checks whether the resulting hash matches the database record.
* **Salt:** A cryptographically random string generated uniquely for each user and embedded directly into the stored hash string. Even if two users choose the exact same password (`"Password123"`), their stored hashes look completely different, defeating precomputed **rainbow table** lookups and preventing attackers from spotting duplicate passwords.
* **Rounds (Cost Factor):** Determines how many internal key-stretching iterations ($2^{\text{rounds}}$, e.g., $2^{10} = 1,024$ iterations) `bcrypt` executes. Increasing the rounds makes hashing intentionally slow—barely noticeable for one legitimate login (~60–100 ms), but computationally expensive for an attacker trying to brute-force millions of password guesses per second.

---

### 6. What Happens If a JWT Is Stolen and How to Mitigate the Risk

* **The risk:** JWTs are bearer tokens—whoever possesses the token is treated as that user. Because stateless JWTs are trusted until their `exp` timestamp passes, an attacker with a stolen token can impersonate the victim and call protected routes (`/api/users`, `/api/auth/me`) without knowing their password.
* **Mitigations:**
1. **Short expiration times:** Set a short `expiresIn` (e.g., 15 minutes) so a stolen token quickly becomes useless, paired with a refresh token flow.
2. **Secure client storage:** Store tokens in `HttpOnly`, `Secure`, `SameSite=Strict` cookies rather than `localStorage` so malicious JavaScript (XSS attacks) cannot read the token.
3. **Token revocation / versioning:** Maintain a Redis deny-list of revoked token IDs (`jti`) on logout/password change, or store a `tokenVersion` integer on the `User` entity and reject tokens whose embedded version no longer matches.
4. **Enforce HTTPS:** Prevent attackers from sniffing tokens off the network.



---

### 7. Why HTTPS Is Essential When Transmitting JWT Tokens

On every authenticated request, the client transmits the JWT in plain text inside the `Authorization: Bearer <token>` header. Over unencrypted HTTP, any observer on the network path—such as someone on public Wi-Fi, a compromised router, or an ISP performing a man-in-the-middle (MITM) attack—can read the `Authorization` header in transit, copy the token, and immediately replay it to hijack the user's account. HTTPS wraps the entire HTTP exchange (including headers and JSON bodies) in TLS encryption so third parties cannot read or tamper with the token.

---

### 8. Short-Lived Access Tokens vs. Long-Lived Refresh Tokens

* **Access Token:** A short-lived JWT (e.g., 15 minutes) sent in the `Authorization` header on regular API requests. It is verified statelessly by `authMiddleware` for fast authorization and carries a small window of exposure if leaked.
* **Refresh Token:** A long-lived credential (e.g., 7 to 30 days) stored securely (typically in an `HttpOnly` cookie and tracked/hashed in the database) whose only job is to obtain a new access token when the old one expires—keeping users signed in without re-entering their password.
* **When to use each:** Use the **access token** for normal resource requests (`GET /api/users`, `GET /api/auth/me`). When the access token expires and returns `401 TokenExpiredError`, the client sends the **refresh token** to a dedicated `POST /api/auth/refresh` endpoint, where the server checks the database to confirm the token hasn't been revoked and the user's `isActive` flag is still `true` before issuing a fresh access token.

---

### 9. How `authMiddleware` Knows Which User Is Making the Request

In your `src/middleware/auth.ts` implementation, identity flows through four steps without needing a database query on every request:

1. **Header extraction:** `authMiddleware` reads `req.headers.authorization`, confirms it starts with `'Bearer '`, and extracts the raw token string.
2. **Cryptographic verification:** It calls `AuthService.verifyToken(token)`, which runs `jwt.verify(token, config.jwt.secret)`. If the signature matches your secret and `exp` hasn't passed, `jwt.verify` returns the trusted payload (`{ userId, email }`) that was signed during `AuthService.login`.
3. **Request attachment:** The middleware assigns that decoded object to `req.user = decoded`.
4. **Downstream access:** When `next()` hands control to a route handler or controller, `req.user.userId` and `req.user.email` are already available on the `Request` object to identify the caller.

---

### 10. Modifying Your Current Setup for Role-Based Authorization (RBAC)

To enforce roles (such as `admin` vs. `user`) in your boilerplate, you would update four layers:

1. **Database & Entity (`src/entities/User.ts` + Migration):**
Add a `role` column (defaulting to `'user'`) and generate/run a TypeORM migration:
```typescript
export enum UserRole {
    USER = 'user',
    ADMIN = 'admin',
}

@Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
role: UserRole;

```


2. **JWT Payload & Request Types (`src/services/authService.ts` & `src/middleware/auth.ts`):**
* Include `role: true` in `AuthService.login`'s `select` block and embed `role: user.role` inside `TokenPayload` when signing the token.
* Extend Express's `Request['user']` interface in `src/middleware/auth.ts` to include `role: UserRole`.


3. **Role-Check Middleware (`src/middleware/authorize.ts`):**
Create a middleware factory that runs *after* `authMiddleware` and throws a `ForbiddenError` (`403 Forbidden`) if the user's role is not permitted:
```typescript
export const authorize = (...allowedRoles: UserRole[]) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            throw new ForbiddenError('Insufficient permissions');
        }
        next();
    };
};

```


4. **Route Rules (`src/routes/userRoutes.ts`):**
Apply `authorize(UserRole.ADMIN)` to privileged endpoints while keeping general routes open to any authenticated user:
```typescript
userRoutes.use(authMiddleware); // All routes require login

userRoutes.get('/', asyncHandler(UserController.getAll)); // Any logged-in user
userRoutes.delete('/:id', authorize(UserRole.ADMIN), asyncHandler(UserController.delete)); // Admins only

```
>>>>>>> 1c9608a (feat: add JWT authentication with login and protected routes)
