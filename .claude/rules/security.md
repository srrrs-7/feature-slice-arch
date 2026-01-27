# Security Rules

このドキュメントではセキュリティに関するルールを定義します。

---

## OWASP Top 10 対策

### 1. インジェクション防止

```typescript
// ✅ GOOD: Prismaのパラメータ化クエリを使用
const task = await prisma.task.findUnique({
  where: { id: userInput },
});

// ❌ BAD: 生SQLの文字列連結
const task = await prisma.$queryRaw`
  SELECT * FROM tasks WHERE id = '${userInput}'
`;
```

### 2. 認証・セッション管理

```typescript
// ✅ GOOD: セキュアなセッション設定
const sessionOptions = {
  httpOnly: true,      // XSS対策
  secure: true,        // HTTPS必須
  sameSite: "strict",  // CSRF対策
  maxAge: 3600,        // 1時間で期限切れ
};

// ❌ BAD: 平文パスワード保存
await prisma.user.create({
  data: { password: plainPassword },
});
```

### 3. XSS (Cross-Site Scripting) 防止

```svelte
<!-- ✅ GOOD: Svelteの自動エスケープ -->
<p>{userInput}</p>

<!-- ❌ BAD: @html の不用意な使用 -->
<p>{@html userInput}</p>
```

### 4. CSRF (Cross-Site Request Forgery) 防止

```typescript
// ✅ GOOD: CSRFトークン検証
app.post("/api/tasks", csrfProtection, async (c) => { ... });

// SameSite Cookie設定
Set-Cookie: session=abc; SameSite=Strict; HttpOnly; Secure
```

### 5. セキュアな設定

```typescript
// ✅ GOOD: 本番環境でのセキュリティヘッダー
app.use(secureHeaders({
  contentSecurityPolicy: true,
  xFrameOptions: "DENY",
  xContentTypeOptions: "nosniff",
}));
```

---

## API セキュリティ

### 入力バリデーション

```typescript
// ✅ GOOD: Zodで厳密なバリデーション
const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(1000).nullable(),
});

// すべてのエンドポイントでバリデーション
app.post("/api/tasks", zValidator("json", createTaskSchema), handler);
```

### エラーメッセージ

```typescript
// ✅ GOOD: 本番環境では詳細を隠す
if (process.env.NODE_ENV === "production") {
  return c.json({ error: "Internal Server Error" }, 500);
}

// ❌ BAD: スタックトレースを露出
return c.json({ error: error.stack }, 500);
```

### レート制限

```typescript
// ✅ GOOD: レート制限を実装
app.use(rateLimiter({
  windowMs: 15 * 60 * 1000,  // 15分
  max: 100,                   // 100リクエストまで
}));
```

---

## データベース セキュリティ

### 接続情報の管理

```bash
# ✅ GOOD: 環境変数を使用
DATABASE_URL=${DATABASE_URL}

# ❌ BAD: ハードコード
DATABASE_URL=postgresql://user:password@host:5432/db
```

### 最小権限の原則

```sql
-- ✅ GOOD: アプリ用ユーザーは必要な権限のみ
GRANT SELECT, INSERT, UPDATE, DELETE ON tasks TO app_user;

-- ❌ BAD: SUPERUSERを使用
GRANT ALL PRIVILEGES ON DATABASE mydb TO app_user;
```

---

## フロントエンド セキュリティ

### 機密情報の扱い

```typescript
// ✅ GOOD: 環境変数はVITE_プレフィックス
const apiUrl = import.meta.env.VITE_API_URL;

// ❌ BAD: シークレットをフロントエンドに含める
const apiKey = "sk-secret-key";  // 絶対NG
```

### ローカルストレージ

```typescript
// ✅ GOOD: 機密性の低いデータのみ
localStorage.setItem("theme", "dark");
localStorage.setItem("locale", "ja");

// ❌ BAD: トークンをローカルストレージに保存
localStorage.setItem("authToken", token);  // XSSで漏洩リスク
```

---

## セキュリティチェックリスト

### コードレビュー時

- [ ] 入力値はすべてバリデーションされているか
- [ ] SQLインジェクションの脆弱性はないか
- [ ] XSSの脆弱性はないか（@html使用箇所）
- [ ] 機密情報がハードコードされていないか
- [ ] エラーメッセージで内部情報が漏洩しないか
- [ ] 認証・認可が適切に実装されているか

### デプロイ前

- [ ] 環境変数が正しく設定されているか
- [ ] HTTPSが有効か
- [ ] セキュリティヘッダーが設定されているか
- [ ] 依存パッケージに既知の脆弱性がないか（`bun audit`）
- [ ] ログに機密情報が含まれていないか

---

## 参考資料

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
