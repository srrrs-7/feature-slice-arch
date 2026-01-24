# Local Auth Environment - Cognito認証セットアップガイド

ローカル開発環境でCognito PKCE認証をテストするための最小限のインフラ環境です。

## 概要

このTerraform環境は以下のAWSリソースのみをプロビジョニングします：

- **Cognito User Pool** - ユーザー管理
- **Cognito App Client** - PKCE対応のOAuth2クライアント
- **Cognito Domain** - Hosted UI用のドメイン
- **User Groups** - admin, member, viewer

## 前提条件

- [Terraform](https://www.terraform.io/downloads.html) >= 1.0
- [AWS CLI](https://aws.amazon.com/cli/) (設定済み)
- AWSアカウントへのアクセス権限

## セットアップ手順

### 1. Terraformの初期化

```bash
cd apps/iac/envs/local-auth
terraform init -backend=false
```

### 2. 変数の設定

`terraform.tfvars` を編集して、`cognito_domain_prefix` をグローバルでユニークな値に変更します：

```hcl
# IMPORTANT: この値はAWS全体でユニークである必要があります
# 例: your-name-workflow-local, company-project-dev など
cognito_domain_prefix = "your-unique-prefix-here"
```

### 3. プランの確認

```bash
terraform plan
```

### 4. デプロイ

```bash
terraform apply
```

確認プロンプトで `yes` を入力します。

### 5. 出力値の確認

デプロイ完了後、以下のコマンドで環境変数を確認できます：

```bash
# フロントエンド用
terraform output frontend_env_vars

# バックエンド用
terraform output backend_env_vars
```

## 環境変数の設定

### フロントエンド (apps/web/.env)

```bash
# =============================================================================
# Cognito Authentication (PKCE)
# =============================================================================
VITE_COGNITO_USER_POOL_ID=ap-northeast-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_COGNITO_DOMAIN=your-prefix.auth.ap-northeast-1.amazoncognito.com
VITE_COGNITO_REDIRECT_URI=http://localhost:3000/auth/callback
VITE_COGNITO_LOGOUT_URI=http://localhost:3000/login
VITE_COGNITO_SCOPE=openid email profile
```

| 変数名 | 説明 | 取得方法 |
|--------|------|----------|
| `VITE_COGNITO_USER_POOL_ID` | User Pool ID | `terraform output cognito_user_pool_id` |
| `VITE_COGNITO_CLIENT_ID` | App Client ID | `terraform output cognito_client_id` |
| `VITE_COGNITO_DOMAIN` | Hosted UI ドメイン | `terraform output cognito_domain` |
| `VITE_COGNITO_REDIRECT_URI` | OAuth コールバックURL | 固定: `http://localhost:3000/auth/callback` |
| `VITE_COGNITO_LOGOUT_URI` | ログアウト後のリダイレクトURL | 固定: `http://localhost:3000/login` |
| `VITE_COGNITO_SCOPE` | OAuth スコープ | 固定: `openid email profile` |

### バックエンド (apps/api/.env)

```bash
# =============================================================================
# Cognito JWT Verification
# =============================================================================
COGNITO_USER_POOL_ID=ap-northeast-1_XXXXXXXXX
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
COGNITO_ISSUER=https://cognito-idp.ap-northeast-1.amazonaws.com/ap-northeast-1_XXXXXXXXX
COGNITO_JWKS_URI=https://cognito-idp.ap-northeast-1.amazonaws.com/ap-northeast-1_XXXXXXXXX/.well-known/jwks.json
```

| 変数名 | 説明 | 取得方法 |
|--------|------|----------|
| `COGNITO_USER_POOL_ID` | User Pool ID | `terraform output cognito_user_pool_id` |
| `COGNITO_CLIENT_ID` | App Client ID | `terraform output cognito_client_id` |
| `COGNITO_ISSUER` | JWT発行者URL | `terraform output cognito_issuer` |
| `COGNITO_JWKS_URI` | JWT検証用公開鍵URL | `terraform output cognito_jwks_uri` |

## 動作確認

### 1. アプリケーションの起動

```bash
# プロジェクトルートから
bun run dev
```

### 2. ログインテスト

1. http://localhost:3000 にアクセス
2. ヘッダーの「Login」ボタンをクリック
3. Cognito Hosted UIにリダイレクト
4. 「Sign up」でアカウント作成、または既存アカウントでログイン
5. メール確認（必要な場合）
6. コールバック後、アプリにリダイレクト
7. ヘッダーにUserMenuが表示されれば成功

### 3. JWT検証テスト

ログイン後、APIリクエストにAuthorizationヘッダーが付与されます：

```bash
# ブラウザの開発者ツールでネットワークタブを確認
# Authorization: Bearer <token>
```

## ユーザーグループ

以下のグループが自動作成されます：

| グループ名 | 説明 |
|-----------|------|
| `admin` | 管理者権限 |
| `member` | 一般メンバー権限 |
| `viewer` | 閲覧のみ権限 |

AWSコンソールまたはCLIでユーザーをグループに追加できます：

```bash
aws cognito-idp admin-add-user-to-group \
  --user-pool-id ap-northeast-1_XXXXXXXXX \
  --username user@example.com \
  --group-name admin
```

## トラブルシューティング

### ログイン後にコールバックエラー

**原因**: コールバックURLが一致しない

**解決策**:
1. `terraform.tfvars` の `callback_urls` を確認
2. `apps/web/.env` の `VITE_COGNITO_REDIRECT_URI` を確認
3. 両方が `http://localhost:3000/auth/callback` であることを確認

### JWT検証エラー (401 Unauthorized)

**原因**: バックエンドのCognito設定が不正

**解決策**:
1. `apps/api/.env` の値が正しいか確認
2. `COGNITO_ISSUER` のURLが正しいか確認
3. APIサーバーを再起動

### "Domain already exists" エラー

**原因**: `cognito_domain_prefix` が既に使用されている

**解決策**:
1. `terraform.tfvars` の `cognito_domain_prefix` を別の値に変更
2. `terraform apply` を再実行

### Hosted UIが表示されない

**原因**: ドメインの設定が反映されていない

**解決策**:
1. 数分待ってから再試行
2. AWSコンソールでCognito User Poolのドメイン設定を確認

## クリーンアップ

リソースを削除する場合：

```bash
terraform destroy
```

**注意**: User Poolを削除すると、全てのユーザーデータも削除されます。

## 認証フロー図

```
┌──────────┐     1. Login Click      ┌──────────────┐
│  Frontend │ ──────────────────────> │ Cognito      │
│  (Web)    │                         │ Hosted UI    │
└──────────┘                         └──────────────┘
     │                                      │
     │                                      │ 2. User Login
     │                                      ▼
     │                               ┌──────────────┐
     │                               │ Cognito      │
     │                               │ User Pool    │
     │                               └──────────────┘
     │                                      │
     │     3. Redirect with code            │
     │ <────────────────────────────────────┘
     │
     │ 4. Exchange code for tokens (PKCE)
     │ ─────────────────────────────────────>
     │
     │     5. Access Token, ID Token, Refresh Token
     │ <─────────────────────────────────────
     │
     │ 6. API Request with Bearer Token
     ▼
┌──────────┐                         ┌──────────────┐
│  Backend │ ───────────────────────>│ Cognito JWKS │
│  (API)   │  7. Verify JWT          │ Endpoint     │
└──────────┘ <───────────────────────└──────────────┘
                8. Valid/Invalid
```

## 関連ファイル

- [Cognito Module](../../modules/cognito/) - Terraformモジュール
- [Bearer Middleware](../../../api/src/middleware/bearer.ts) - JWT検証ミドルウェア
- [Auth Feature](../../../web/src/features/common/auth/) - フロントエンド認証機能
