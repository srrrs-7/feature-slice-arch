# Cognito PKCE認証 統合実装計画

## Overview

3層（IaC, API, Web）にわたるAmazon Cognito PKCE認証機能の実装計画です。

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Architecture                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────┐         ┌──────────────┐         ┌──────────────┐        │
│   │    Web SPA   │ ──────► │   Cognito    │ ◄────── │     API      │        │
│   │   (Svelte)   │  PKCE   │  User Pool   │   JWT   │    (Hono)    │        │
│   └──────┬───────┘         └──────────────┘         └──────┬───────┘        │
│          │                                                  │                │
│          │                                                  │                │
│          └──────────────────────────────────────────────────┘                │
│                         Bearer Token (JWT)                                   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      Aurora Serverless v2                            │   │
│   │                          (User Table)                                │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Layer 1: Infrastructure (apps/iac)

### 1.1 Cognito Module

**Location**: `apps/iac/modules/cognito/`

```
modules/cognito/
├── main.tf           # User Pool, App Client, Domain
├── variables.tf      # Configuration inputs
└── outputs.tf        # Exported values
```

### 1.2 Terraform Resources

```hcl
# =============================================================================
# Cognito User Pool
# =============================================================================
resource "aws_cognito_user_pool" "main" {
  name = "${var.name_prefix}-user-pool"

  # ユーザー名設定
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  # パスワードポリシー
  password_policy {
    minimum_length                   = 8
    require_lowercase                = true
    require_numbers                  = true
    require_symbols                  = true
    require_uppercase                = true
    temporary_password_validity_days = 7
  }

  # MFA設定（オプション）
  mfa_configuration = var.mfa_configuration  # "OFF", "ON", "OPTIONAL"

  # スキーマ属性
  schema {
    name                     = "email"
    attribute_data_type      = "String"
    required                 = true
    mutable                  = true
    developer_only_attribute = false

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  schema {
    name                     = "name"
    attribute_data_type      = "String"
    required                 = false
    mutable                  = true
    developer_only_attribute = false

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  # アカウント復旧設定
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # Lambda トリガー（将来用）
  # lambda_config {
  #   pre_sign_up    = aws_lambda_function.pre_signup.arn
  #   post_confirmation = aws_lambda_function.post_confirmation.arn
  # }

  tags = var.tags
}

# =============================================================================
# Cognito User Pool Client (SPA用 - PKCE)
# =============================================================================
resource "aws_cognito_user_pool_client" "spa" {
  name         = "${var.name_prefix}-spa-client"
  user_pool_id = aws_cognito_user_pool.main.id

  # PKCE用設定（クライアントシークレットなし）
  generate_secret = false

  # OAuth2設定
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]

  # コールバックURL
  callback_urls = var.callback_urls
  logout_urls   = var.logout_urls

  # サポートするIDプロバイダー
  supported_identity_providers = ["COGNITO"]

  # トークン有効期限
  access_token_validity  = var.access_token_validity   # 分
  id_token_validity      = var.id_token_validity       # 分
  refresh_token_validity = var.refresh_token_validity  # 日

  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }

  # 明示的な認証フロー
  explicit_auth_flows = [
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH",
  ]

  # リフレッシュトークンローテーション
  enable_token_revocation = true

  # PKCE必須
  prevent_user_existence_errors = "ENABLED"
}

# =============================================================================
# Cognito User Pool Domain (Hosted UI用)
# =============================================================================
resource "aws_cognito_user_pool_domain" "main" {
  domain       = var.cognito_domain_prefix  # e.g., "workflow-dev"
  user_pool_id = aws_cognito_user_pool.main.id
}

# =============================================================================
# (Optional) Custom Domain with Certificate
# =============================================================================
# resource "aws_cognito_user_pool_domain" "custom" {
#   domain          = "auth.example.com"
#   certificate_arn = aws_acm_certificate.auth.arn
#   user_pool_id    = aws_cognito_user_pool.main.id
# }
```

### 1.3 Variables

```hcl
# variables.tf
variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "cognito_domain_prefix" {
  description = "Cognito Hosted UI domain prefix (must be globally unique)"
  type        = string
}

variable "callback_urls" {
  description = "List of allowed callback URLs for OAuth"
  type        = list(string)
  default     = ["http://localhost:5173/auth/callback"]
}

variable "logout_urls" {
  description = "List of allowed logout URLs"
  type        = list(string)
  default     = ["http://localhost:5173/login"]
}

variable "mfa_configuration" {
  description = "MFA configuration: OFF, ON, OPTIONAL"
  type        = string
  default     = "OFF"

  validation {
    condition     = contains(["OFF", "ON", "OPTIONAL"], var.mfa_configuration)
    error_message = "mfa_configuration must be OFF, ON, or OPTIONAL."
  }
}

variable "access_token_validity" {
  description = "Access token validity in minutes"
  type        = number
  default     = 60  # 1 hour
}

variable "id_token_validity" {
  description = "ID token validity in minutes"
  type        = number
  default     = 60  # 1 hour
}

variable "refresh_token_validity" {
  description = "Refresh token validity in days"
  type        = number
  default     = 30
}

variable "tags" {
  description = "Tags for resources"
  type        = map(string)
  default     = {}
}
```

### 1.4 Outputs

```hcl
# outputs.tf
output "user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "user_pool_arn" {
  description = "Cognito User Pool ARN"
  value       = aws_cognito_user_pool.main.arn
}

output "client_id" {
  description = "Cognito App Client ID"
  value       = aws_cognito_user_pool_client.spa.id
}

output "domain" {
  description = "Cognito Hosted UI domain"
  value       = "${aws_cognito_user_pool_domain.main.domain}.auth.${data.aws_region.current.name}.amazoncognito.com"
}

output "issuer" {
  description = "Cognito Issuer URL (for JWT validation)"
  value       = "https://cognito-idp.${data.aws_region.current.name}.amazonaws.com/${aws_cognito_user_pool.main.id}"
}

output "jwks_uri" {
  description = "JWKS URI for JWT verification"
  value       = "https://cognito-idp.${data.aws_region.current.name}.amazonaws.com/${aws_cognito_user_pool.main.id}/.well-known/jwks.json"
}
```

### 1.5 Base Infrastructure 統合

```hcl
# modules/base-infrastructure/main.tf に追加

module "cognito" {
  source = "../cognito"

  name_prefix           = var.name_prefix
  cognito_domain_prefix = var.cognito_domain_prefix

  callback_urls = [
    "https://${module.cloudfront.distribution_domain_name}/auth/callback",
    "http://localhost:5173/auth/callback"
  ]

  logout_urls = [
    "https://${module.cloudfront.distribution_domain_name}/login",
    "http://localhost:5173/login"
  ]

  mfa_configuration      = var.mfa_configuration
  access_token_validity  = var.cognito_access_token_validity
  id_token_validity      = var.cognito_id_token_validity
  refresh_token_validity = var.cognito_refresh_token_validity

  tags = var.tags
}
```

---

## Layer 2: API (apps/api)

### 2.1 User Feature Structure

**Location**: `apps/api/src/features/master/user/`

```
features/master/user/
├── index.ts                    # Public API
├── domain/
│   └── user.ts                 # User domain types, errors
├── service/
│   ├── service.ts              # Business logic
│   └── service.test.ts         # Unit tests
├── repository/
│   └── repository.ts           # Data access
├── handler.ts                  # HTTP handlers
├── validator.ts                # Zod schemas
└── .test/
    ├── setup.ts
    ├── handler.get-all.test.ts
    ├── handler.get-by-id.test.ts
    ├── handler.post.test.ts
    ├── handler.put.test.ts
    └── handler.delete.test.ts
```

### 2.2 Prisma Schema

```prisma
# schema.prisma に追加

enum UserRole {
  admin
  member
  viewer
}

enum UserStatus {
  active
  inactive
  pending
}

model User {
  id              String     @id @default(uuid())
  cognitoSub      String     @unique          // Cognito User ID
  email           String     @unique
  name            String?
  picture         String?                     // Profile picture URL
  role            UserRole   @default(member)
  status          UserStatus @default(pending)
  emailVerified   Boolean    @default(false)
  lastLoginAt     DateTime?
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  // Relations (future)
  // tasks         Task[]
  // stamps        Stamp[]

  @@index([cognitoSub])
  @@index([email])
  @@map("users")
}
```

### 2.3 Domain Layer

```typescript
// domain/user.ts

// Branded Types
export type UserId = string & { readonly _brand: unique symbol };
export type CognitoSub = string & { readonly _brand: unique symbol };

// Enums
export const UserRole = {
  ADMIN: "admin",
  MEMBER: "member",
  VIEWER: "viewer",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending",
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

// Domain Entity
export interface User {
  readonly id: UserId;
  readonly cognitoSub: CognitoSub;
  readonly email: string;
  readonly name: string | null;
  readonly picture: string | null;
  readonly role: UserRole;
  readonly status: UserStatus;
  readonly emailVerified: boolean;
  readonly lastLoginAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// Smart Constructors
export const createUserId = (id: string): UserId => id as UserId;
export const createCognitoSub = (sub: string): CognitoSub => sub as CognitoSub;

export const createUser = (params: UserParams): User => Object.freeze({
  id: params.id,
  cognitoSub: params.cognitoSub,
  email: params.email,
  name: params.name,
  picture: params.picture,
  role: params.role,
  status: params.status,
  emailVerified: params.emailVerified,
  lastLoginAt: params.lastLoginAt,
  createdAt: params.createdAt,
  updatedAt: params.updatedAt,
});

// Error Types
export type UserNotFoundError = {
  readonly type: "NOT_FOUND";
  readonly userId?: UserId;
  readonly cognitoSub?: CognitoSub;
};

export type UserAlreadyExistsError = {
  readonly type: "ALREADY_EXISTS";
  readonly email: string;
};

export type UserError =
  | DatabaseError
  | ValidationError
  | UserNotFoundError
  | UserAlreadyExistsError;

// Error Constructors
export const UserErrors = {
  notFound: (id?: UserId, cognitoSub?: CognitoSub): UserNotFoundError => ({
    type: "NOT_FOUND",
    userId: id,
    cognitoSub,
  }),
  alreadyExists: (email: string): UserAlreadyExistsError => ({
    type: "ALREADY_EXISTS",
    email,
  }),
  validation: Errors.validation,
  database: Errors.database,
} as const;
```

### 2.4 JWT Middleware

```typescript
// middleware/jwt.ts

import { createMiddleware } from "hono/factory";
import { verify, decode } from "hono/jwt";
import type { Context } from "hono";

interface JWTPayload {
  sub: string;
  email: string;
  email_verified: boolean;
  "cognito:username": string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

declare module "hono" {
  interface ContextVariableMap {
    jwtPayload: JWTPayload;
    cognitoSub: string;
  }
}

// JWKS取得とキャッシュ
let jwksCache: { keys: JsonWebKey[]; expiry: number } | null = null;

async function getJWKS(): Promise<JsonWebKey[]> {
  const now = Date.now();
  if (jwksCache && jwksCache.expiry > now) {
    return jwksCache.keys;
  }

  const jwksUri = process.env.COGNITO_JWKS_URI;
  if (!jwksUri) throw new Error("COGNITO_JWKS_URI not configured");

  const response = await fetch(jwksUri);
  const data = await response.json();

  jwksCache = {
    keys: data.keys,
    expiry: now + 3600000, // 1時間キャッシュ
  };

  return data.keys;
}

export const jwtMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "UNAUTHORIZED", message: "Missing or invalid Authorization header" }, 401);
  }

  const token = authHeader.slice(7);

  try {
    // JWTデコード（検証なし、kid取得のため）
    const decoded = decode(token);
    const kid = decoded.header.kid;

    // JWKS取得
    const keys = await getJWKS();
    const key = keys.find((k) => k.kid === kid);

    if (!key) {
      return c.json({ error: "UNAUTHORIZED", message: "Invalid token key" }, 401);
    }

    // JWT検証
    const payload = await verify(token, key, "RS256") as JWTPayload;

    // Issuer検証
    const issuer = process.env.COGNITO_ISSUER;
    if (payload.iss !== issuer) {
      return c.json({ error: "UNAUTHORIZED", message: "Invalid issuer" }, 401);
    }

    // 有効期限検証
    if (payload.exp < Date.now() / 1000) {
      return c.json({ error: "UNAUTHORIZED", message: "Token expired" }, 401);
    }

    // コンテキストに保存
    c.set("jwtPayload", payload);
    c.set("cognitoSub", payload.sub);

    await next();
  } catch (error) {
    return c.json({ error: "UNAUTHORIZED", message: "Invalid token" }, 401);
  }
});
```

### 2.5 API Endpoints

```typescript
// handler.ts

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { jwtMiddleware } from "@api/middleware/jwt";
import { userService } from "./service/service";
import {
  createUserSchema,
  updateUserSchema,
  idParamSchema,
} from "./validator";

export default new Hono()
  // 全エンドポイントにJWT認証を適用
  .use("/*", jwtMiddleware)

  // GET /api/users - 全ユーザー取得（管理者のみ）
  .get("/", async (c) => {
    return userService.getAll().match(
      (users) => responseOk(c, { users }),
      (error) => handleError(c, error)
    );
  })

  // GET /api/users/me - 現在のユーザー取得
  .get("/me", async (c) => {
    const cognitoSub = c.get("cognitoSub");
    return userService.getByCognitoSub(cognitoSub).match(
      (user) => responseOk(c, { user }),
      (error) => handleError(c, error)
    );
  })

  // GET /api/users/:id - ID指定でユーザー取得
  .get("/:id", zValidator("param", idParamSchema), async (c) => {
    const { id } = c.req.valid("param");
    return userService.getById(id).match(
      (user) => responseOk(c, { user }),
      (error) => handleError(c, error)
    );
  })

  // POST /api/users - ユーザー作成（初回ログイン時）
  .post("/", zValidator("json", createUserSchema), async (c) => {
    const input = c.req.valid("json");
    const jwtPayload = c.get("jwtPayload");

    return userService.create({
      cognitoSub: jwtPayload.sub,
      email: jwtPayload.email,
      emailVerified: jwtPayload.email_verified,
      ...input,
    }).match(
      (user) => responseCreated(c, { user }),
      (error) => handleError(c, error)
    );
  })

  // PUT /api/users/:id - ユーザー更新
  .put("/:id", zValidator("param", idParamSchema), zValidator("json", updateUserSchema), async (c) => {
    const { id } = c.req.valid("param");
    const input = c.req.valid("json");

    return userService.update(id, input).match(
      (user) => responseOk(c, { user }),
      (error) => handleError(c, error)
    );
  })

  // DELETE /api/users/:id - ユーザー削除（論理削除）
  .delete("/:id", zValidator("param", idParamSchema), async (c) => {
    const { id } = c.req.valid("param");

    return userService.deactivate(id).match(
      () => responseNoContent(c),
      (error) => handleError(c, error)
    );
  })

  // POST /api/users/sync - Cognitoユーザー同期
  .post("/sync", async (c) => {
    const jwtPayload = c.get("jwtPayload");

    return userService.syncFromCognito({
      cognitoSub: jwtPayload.sub,
      email: jwtPayload.email,
      emailVerified: jwtPayload.email_verified,
    }).match(
      (user) => responseOk(c, { user }),
      (error) => handleError(c, error)
    );
  });
```

---

## Layer 3: Web (apps/web)

### 3.1 認証フロー

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           PKCE Authentication Flow                        │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  1. ログインボタンクリック                                                   │
│     ↓                                                                     │
│  2. PKCE パラメータ生成                                                     │
│     - code_verifier (ランダム文字列)                                        │
│     - code_challenge (SHA-256ハッシュ)                                     │
│     - state (CSRF対策)                                                    │
│     ↓                                                                     │
│  3. sessionStorage に保存                                                  │
│     - pkce_code_verifier                                                  │
│     - pkce_state                                                          │
│     ↓                                                                     │
│  4. Cognito Hosted UI へリダイレクト                                        │
│     /oauth2/authorize?                                                    │
│       response_type=code&                                                 │
│       client_id=xxx&                                                      │
│       redirect_uri=xxx&                                                   │
│       scope=openid+email+profile&                                         │
│       code_challenge=xxx&                                                 │
│       code_challenge_method=S256&                                         │
│       state=xxx                                                           │
│     ↓                                                                     │
│  5. ユーザーがログイン（Cognito Hosted UI）                                  │
│     ↓                                                                     │
│  6. コールバック受信                                                        │
│     /auth/callback?code=xxx&state=xxx                                     │
│     ↓                                                                     │
│  7. state 検証                                                            │
│     sessionStorage の pkce_state と比較                                    │
│     ↓                                                                     │
│  8. トークン交換                                                           │
│     POST /oauth2/token                                                    │
│       grant_type=authorization_code&                                      │
│       client_id=xxx&                                                      │
│       code=xxx&                                                           │
│       redirect_uri=xxx&                                                   │
│       code_verifier=xxx                                                   │
│     ↓                                                                     │
│  9. トークン受信                                                           │
│     - access_token                                                        │
│     - id_token                                                            │
│     - refresh_token                                                       │
│     ↓                                                                     │
│ 10. トークン保存                                                           │
│     - メモリ (Svelte store): access_token, id_token                        │
│     - localStorage: refresh_token (暗号化推奨)                              │
│     ↓                                                                     │
│ 11. ユーザー同期                                                           │
│     POST /api/users/sync (Bearer token)                                   │
│     ↓                                                                     │
│ 12. ホームへリダイレクト                                                    │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

### 3.2 コンポーネント構成

```
features/common/auth/
├── .docs/
│   ├── design.md               # UI/UX設計
│   └── implementation-plan.md  # この文書
├── api/
│   ├── cognito.ts              # Cognito API クライアント
│   ├── user.ts                 # User API クライアント
│   └── index.ts
├── components/
│   ├── AuthGuard.svelte        # 認証ガード
│   ├── UserMenu.svelte         # ヘッダー用ユーザーメニュー
│   ├── LoginButton.svelte      # ログインボタン
│   ├── LogoutButton.svelte     # ログアウトボタン
│   └── index.ts
├── pages/
│   ├── LoginPage.svelte        # ログインページ
│   ├── CallbackPage.svelte     # コールバックページ
│   └── index.ts
├── store/
│   ├── auth.ts                 # 認証状態ストア
│   ├── pkce.ts                 # PKCE ヘルパー
│   ├── token.ts                # トークン管理
│   └── index.ts
├── types/
│   └── index.ts                # 型定義
└── index.ts                    # 公開API
```

### 3.3 環境変数

```bash
# .env.development
VITE_COGNITO_USER_POOL_ID=ap-northeast-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_COGNITO_DOMAIN=workflow-dev.auth.ap-northeast-1.amazoncognito.com
VITE_COGNITO_REDIRECT_URI=http://localhost:5173/auth/callback
VITE_COGNITO_LOGOUT_URI=http://localhost:5173/login
VITE_COGNITO_SCOPE=openid email profile
VITE_API_URL=http://localhost:8080

# .env.production
VITE_COGNITO_USER_POOL_ID=ap-northeast-1_YYYYYYYYY
VITE_COGNITO_CLIENT_ID=yyyyyyyyyyyyyyyyyyyyyyyyyy
VITE_COGNITO_DOMAIN=workflow-prod.auth.ap-northeast-1.amazoncognito.com
VITE_COGNITO_REDIRECT_URI=https://app.example.com/auth/callback
VITE_COGNITO_LOGOUT_URI=https://app.example.com/login
VITE_COGNITO_SCOPE=openid email profile
VITE_API_URL=https://app.example.com/api
```

---

## Implementation Checklist

### Phase 1: Infrastructure (IaC)

```
[ ] 1.1 Cognito モジュール作成
    [ ] modules/cognito/main.tf
    [ ] modules/cognito/variables.tf
    [ ] modules/cognito/outputs.tf

[ ] 1.2 Base Infrastructure 統合
    [ ] modules/base-infrastructure/main.tf に追加
    [ ] modules/base-infrastructure/variables.tf に追加
    [ ] modules/base-infrastructure/outputs.tf に追加

[ ] 1.3 環境変数追加
    [ ] envs/dev/terraform.tfvars
    [ ] envs/prod/terraform.tfvars

[ ] 1.4 デプロイ
    [ ] make plan ENV=dev
    [ ] make apply ENV=dev
    [ ] 出力値を確認
```

### Phase 2: API (Backend)

```
[ ] 2.1 Database
    [ ] Prisma schema に User モデル追加
    [ ] マイグレーション作成・適用
    [ ] Fabbrica factory 作成

[ ] 2.2 Domain Layer
    [ ] domain/user.ts (types, errors, constructors)

[ ] 2.3 Repository Layer
    [ ] repository/repository.ts

[ ] 2.4 Service Layer
    [ ] service/service.ts
    [ ] service/service.test.ts

[ ] 2.5 Validator
    [ ] validator.ts

[ ] 2.6 Handler Layer
    [ ] handler.ts

[ ] 2.7 JWT Middleware
    [ ] middleware/jwt.ts

[ ] 2.8 Integration
    [ ] index.ts (exports)
    [ ] src/index.ts にルート追加
    [ ] 環境変数設定

[ ] 2.9 Testing
    [ ] .test/setup.ts
    [ ] .test/handler.*.test.ts
    [ ] カバレッジ確認
```

### Phase 3: Web (Frontend)

```
[ ] 3.1 Types
    [ ] types/index.ts

[ ] 3.2 Store
    [ ] store/pkce.ts
    [ ] store/token.ts
    [ ] store/auth.ts
    [ ] store/index.ts

[ ] 3.3 API Client
    [ ] api/cognito.ts
    [ ] api/user.ts
    [ ] api/index.ts

[ ] 3.4 Components
    [ ] components/AuthGuard.svelte
    [ ] components/UserMenu.svelte
    [ ] components/LoginButton.svelte
    [ ] components/LogoutButton.svelte
    [ ] components/index.ts

[ ] 3.5 Pages
    [ ] pages/LoginPage.svelte
    [ ] pages/CallbackPage.svelte
    [ ] pages/index.ts

[ ] 3.6 Header Integration
    [ ] features/common/header/components/AppHeader.svelte 更新

[ ] 3.7 Routing
    [ ] App.svelte 更新

[ ] 3.8 i18n
    [ ] lib/i18n/types.ts に auth セクション追加
    [ ] lib/i18n/locales/ja.ts
    [ ] lib/i18n/locales/en.ts

[ ] 3.9 Environment
    [ ] .env.development
    [ ] .env.production
```

### Phase 4: Integration Testing

```
[ ] 4.1 E2E テスト
    [ ] ログインフロー
    [ ] ログアウトフロー
    [ ] トークンリフレッシュ
    [ ] 認証ガード

[ ] 4.2 セキュリティ確認
    [ ] PKCE検証
    [ ] State検証
    [ ] トークン有効期限
    [ ] CORS設定
```

---

## 依存関係図

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Implementation Order                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────────┐                                                        │
│   │    IaC      │ ────────────────────────────────┐                     │
│   │  (Cognito)  │                                 │                     │
│   └──────┬──────┘                                 │                     │
│          │                                        │                     │
│          │ User Pool ID, Client ID,              │                     │
│          │ Domain, JWKS URI                      │                     │
│          ▼                                        ▼                     │
│   ┌─────────────┐                         ┌─────────────┐              │
│   │    API      │                         │    Web      │              │
│   │   (User)    │ ◄───────────────────────│   (Auth)    │              │
│   └──────┬──────┘    Bearer Token (JWT)   └──────┬──────┘              │
│          │                                        │                     │
│          │                                        │                     │
│          └────────────────┬───────────────────────┘                     │
│                           │                                              │
│                           ▼                                              │
│                    ┌─────────────┐                                       │
│                    │   Header    │                                       │
│                    │ (UserMenu)  │                                       │
│                    └─────────────┘                                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## セキュリティ考慮事項

### トークン管理

| トークン | 保存場所 | 有効期限 | リフレッシュ |
|----------|----------|----------|--------------|
| Access Token | メモリ (Svelte store) | 60分 | 自動 |
| ID Token | メモリ (Svelte store) | 60分 | 自動 |
| Refresh Token | localStorage | 30日 | 手動 |

### PKCE パラメータ

| パラメータ | 保存場所 | 削除タイミング |
|------------|----------|----------------|
| code_verifier | sessionStorage | コールバック処理後 |
| state | sessionStorage | コールバック処理後 |

### JWT検証

1. **署名検証**: Cognito JWKS を使用
2. **Issuer検証**: Cognito User Pool URL と一致
3. **有効期限検証**: exp クレーム確認
4. **Audience検証**: Client ID と一致

---

## 参考資料

- [Amazon Cognito Developer Guide](https://docs.aws.amazon.com/cognito/latest/developerguide/)
- [OAuth 2.0 PKCE RFC 7636](https://tools.ietf.org/html/rfc7636)
- [OpenID Connect Specification](https://openid.net/connect/)
- [Hono JWT Middleware](https://hono.dev/middleware/builtin/jwt)
