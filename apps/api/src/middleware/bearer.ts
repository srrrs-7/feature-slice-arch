import { responseUnauthorized } from "@api/lib/http";
import type { MiddlewareHandler } from "hono";

/**
 * Bearer authentication middleware.
 *
 * TODO: SECURITY - This is a DEVELOPMENT-ONLY implementation!
 * Before production deployment, implement proper authentication:
 *
 * 1. JWT Verification:
 *    - Verify token signature with secret key (e.g., using `hono/jwt` or `jsonwebtoken`)
 *    - Check token expiration (`exp` claim)
 *    - Validate issuer (`iss`) and audience (`aud`) claims
 *
 * 2. User Context:
 *    - Extract user identity from token payload
 *    - Attach user to Hono context: `c.set("user", decoded)`
 *
 * 3. Token Revocation:
 *    - Check if token has been revoked (blacklist or Redis)
 *
 * 4. Rate Limiting:
 *    - Add rate limiting to prevent brute force attacks
 *
 * Example implementation:
 * ```typescript
 * import { jwt } from "hono/jwt";
 *
 * export const bearerAuthMiddleware = jwt({
 *   secret: process.env.JWT_SECRET!,
 * });
 * ```
 */
export const bearerAuthMiddleware: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader) {
    return responseUnauthorized(c, {
      message: "Authorization header required",
    });
  }

  if (!authHeader.startsWith("Bearer ")) {
    return responseUnauthorized(c, { message: "Invalid authorization format" });
  }

  const token = authHeader.slice(7);

  if (!token) {
    return responseUnauthorized(c, { message: "Token required" });
  }

  // TODO: SECURITY - Implement actual token verification here!
  // Currently, any non-empty token is accepted (development only).

  await next();
};
