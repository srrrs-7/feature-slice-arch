// =============================================================================
// Auth Types
// =============================================================================

/**
 * User information extracted from Cognito ID token.
 */
export interface AuthUser {
  cognitoSub: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
  picture: string | null;
  groups: string[];
}

/**
 * Token set received from Cognito.
 */
export interface TokenSet {
  accessToken: string;
  idToken: string;
  refreshToken: string | null;
  expiresIn: number;
  tokenType: string;
}

/**
 * Authentication state.
 */
export type AuthState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "authenticated"; user: AuthUser; tokens: TokenSet }
  | { status: "unauthenticated" }
  | { status: "error"; error: string };

/**
 * PKCE parameters for OAuth2 flow.
 */
export interface PKCEParams {
  codeVerifier: string;
  codeChallenge: string;
  state: string;
}

/**
 * Cognito configuration from environment variables.
 */
export interface CognitoConfig {
  userPoolId: string;
  clientId: string;
  domain: string;
  redirectUri: string;
  logoutUri: string;
  scope: string;
}

/**
 * ID Token payload structure.
 */
export interface IdTokenPayload {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  "cognito:username"?: string;
  "cognito:groups"?: string[];
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  token_use: "id";
}

/**
 * Access Token payload structure.
 */
export interface AccessTokenPayload {
  sub: string;
  iss: string;
  exp: number;
  iat: number;
  token_use: "access";
  scope: string;
  "cognito:groups"?: string[];
}
