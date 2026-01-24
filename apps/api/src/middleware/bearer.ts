import { responseUnauthorized } from "@api/lib/http";
import { logger } from "@api/lib/logger";
import type { MiddlewareHandler } from "hono";
import { createRemoteJWKSet, type JWTPayload, jwtVerify } from "jose";

// =============================================================================
// Types
// =============================================================================

/**
 * Cognito JWT payload structure.
 */
export interface CognitoJWTPayload extends JWTPayload {
  sub: string;
  email?: string;
  email_verified?: boolean;
  "cognito:username"?: string;
  "cognito:groups"?: string[];
  token_use?: "access" | "id";
}

/**
 * User context extracted from JWT and attached to Hono context.
 */
export interface AuthUser {
  cognitoSub: string;
  email: string | null;
  emailVerified: boolean;
  username: string | null;
  groups: string[];
  tokenUse: "access" | "id" | undefined;
}

// =============================================================================
// Module State
// =============================================================================

// JWKS cache (Remote JWK Set handles caching internally)
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

// =============================================================================
// Configuration
// =============================================================================

/**
 * Get Cognito configuration from environment variables.
 */
function getCognitoConfig() {
  const issuer = process.env.COGNITO_ISSUER;
  const clientId = process.env.COGNITO_CLIENT_ID;
  const jwksUri = process.env.COGNITO_JWKS_URI;

  if (!issuer || !clientId || !jwksUri) {
    logger.warn(
      "Cognito environment variables not configured - authentication disabled",
    );
    return null;
  }

  return { issuer, clientId, jwksUri };
}

/**
 * Get or create JWKS for Cognito.
 */
function getJWKS(jwksUri: string) {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(jwksUri), {
      cacheMaxAge: 3600000, // 1 hour cache
    });
  }
  return jwks;
}

// =============================================================================
// Middleware
// =============================================================================

/**
 * Bearer authentication middleware with Cognito JWT verification.
 *
 * Required environment variables:
 * - COGNITO_ISSUER: Cognito User Pool issuer URL
 *   Example: https://cognito-idp.ap-northeast-1.amazonaws.com/ap-northeast-1_XXXXXXXXX
 * - COGNITO_CLIENT_ID: Cognito App Client ID
 * - COGNITO_JWKS_URI: JWKS endpoint for JWT verification
 *   Example: https://cognito-idp.ap-northeast-1.amazonaws.com/ap-northeast-1_XXXXXXXXX/.well-known/jwks.json
 *
 * Usage:
 * ```typescript
 * import { bearerAuthMiddleware } from "@api/middleware/bearer";
 *
 * const app = new Hono()
 *   .use("/api/*", bearerAuthMiddleware)
 *   .get("/api/me", (c) => {
 *     const user = c.get("user");
 *     return c.json({ user });
 *   });
 * ```
 */
export const bearerAuthMiddleware: MiddlewareHandler = async (c, next) => {
  const config = getCognitoConfig();

  // Development mode: skip authentication if Cognito is not configured
  if (!config) {
    logger.debug("Authentication skipped - Cognito not configured");
    await next();
    return;
  }

  // Extract Authorization header
  const authHeader = c.req.header("Authorization");

  if (!authHeader) {
    return responseUnauthorized(c, {
      message: "Authorization header required",
    });
  }

  if (!authHeader.startsWith("Bearer ")) {
    return responseUnauthorized(c, {
      message: "Invalid authorization format. Use: Bearer <token>",
    });
  }

  const token = authHeader.slice(7);

  if (!token) {
    return responseUnauthorized(c, { message: "Token required" });
  }

  try {
    // Verify JWT with Cognito JWKS
    const jwksSet = getJWKS(config.jwksUri);

    const { payload } = await jwtVerify(token, jwksSet, {
      issuer: config.issuer,
      audience: config.clientId,
    });

    const cognitoPayload = payload as CognitoJWTPayload;

    // Validate required claims
    if (!cognitoPayload.sub) {
      return responseUnauthorized(c, {
        message: "Invalid token: missing sub claim",
      });
    }

    // Extract user information from JWT
    const user: AuthUser = {
      cognitoSub: cognitoPayload.sub,
      email: cognitoPayload.email ?? null,
      emailVerified: cognitoPayload.email_verified ?? false,
      username: cognitoPayload["cognito:username"] ?? null,
      groups: cognitoPayload["cognito:groups"] ?? [],
      tokenUse: cognitoPayload.token_use,
    };

    // Attach user to context
    c.set("user", user);
    c.set("cognitoSub", user.cognitoSub);

    logger.debug(
      { cognitoSub: user.cognitoSub, email: user.email },
      "User authenticated",
    );

    await next();
  } catch (error) {
    logger.warn({ error }, "JWT verification failed");

    if (error instanceof Error) {
      // Specific error messages for common issues
      if (error.message.includes("expired")) {
        return responseUnauthorized(c, { message: "Token expired" });
      }
      if (error.message.includes("signature")) {
        return responseUnauthorized(c, { message: "Invalid token signature" });
      }
      if (error.message.includes("issuer")) {
        return responseUnauthorized(c, { message: "Invalid token issuer" });
      }
      if (error.message.includes("audience")) {
        return responseUnauthorized(c, { message: "Invalid token audience" });
      }
    }

    return responseUnauthorized(c, { message: "Invalid token" });
  }
};

/**
 * Optional authentication middleware.
 * Allows requests without authentication, but validates token if provided.
 */
export const optionalBearerAuthMiddleware: MiddlewareHandler = async (
  c,
  next,
) => {
  const authHeader = c.req.header("Authorization");

  // No auth header - continue without user context
  if (!authHeader) {
    await next();
    return;
  }

  // Auth header present - validate it
  return bearerAuthMiddleware(c, next);
};

/**
 * Role-based authorization middleware.
 * Must be used after bearerAuthMiddleware.
 *
 * Usage:
 * ```typescript
 * app.use("/api/admin/*", bearerAuthMiddleware)
 *    .use("/api/admin/*", requireRoles(["admin"]))
 * ```
 */
export const requireRoles = (allowedRoles: string[]): MiddlewareHandler => {
  return async (c, next) => {
    const user = c.get("user") as AuthUser | undefined;

    if (!user) {
      return responseUnauthorized(c, { message: "Authentication required" });
    }

    const hasRole = user.groups.some((group) => allowedRoles.includes(group));

    if (!hasRole) {
      return c.json(
        {
          error: "FORBIDDEN",
          message: `Required role: ${allowedRoles.join(" or ")}`,
        },
        403,
      );
    }

    await next();
  };
};

// =============================================================================
// Hono Context Type Extension
// =============================================================================

declare module "hono" {
  interface ContextVariableMap {
    user: AuthUser;
    cognitoSub: string;
  }
}
