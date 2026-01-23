# Planning Rules

このドキュメントでは新機能開発やリファクタリングの計画フェーズに関するルールを定義します。

## 計画フェーズの必要性

以下の場合は実装前に**必ず計画を作成**:

### 1. 新機能開発
- 新しいFeatureの追加 (`features/{feature}/`)
- 既存Featureへの大きな機能追加
- 複数ファイルにまたがる変更

### 2. アーキテクチャ変更
- 層間の依存関係変更
- データモデル変更
- エラーハンドリング戦略変更

### 3. リファクタリング
- 複数ファイルの構造変更
- 命名規則の大幅変更
- パフォーマンス最適化

### 4. インフラ変更
- データベーススキーマ変更
- 新しいライブラリ導入
- ビルドプロセス変更

---

## 新機能開発の計画プロセス

### Step 1: 要件定義

**ドキュメント作成:** `apps/web/src/features/{feature}/.docs/design.md`

```markdown
# {Feature} Design Document

## Overview
機能の概要を1-2文で説明

## Requirements
- 必須要件1
- 必須要件2
- オプション要件1

## User Stories
- As a user, I want to ...
- As an admin, I want to ...

## Non-Goals
この機能では実装しないこと
```

### Step 2: データモデル設計

**APIの場合:**

1. **Domain層の設計**
```typescript
// domain/{name}.ts の構造を計画

// 1. 型定義
export type FeatureId = string & { readonly _brand: unique symbol };

export interface Feature {
  readonly id: FeatureId;
  readonly name: string;
  readonly status: FeatureStatus;
  // ...
}

// 2. エラー型
export type FeatureError =
  | DatabaseError
  | ValidationError
  | FeatureNotFoundError;

// 3. Smart Constructors
export const createFeature = (params: CreateFeatureParams): Feature => { ... };

// 4. Error Constructors
export const FeatureErrors = {
  notFound: (id: FeatureId): FeatureNotFoundError => { ... },
  // ...
};
```

2. **Prismaスキーマ設計**
```prisma
model Feature {
  id        String   @id @default(uuid())
  name      String
  status    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("features")
}
```

3. **マイグレーション計画**
```bash
# 既存データへの影響を確認
# NULL許容カラムから始める
# データ移行スクリプトが必要か確認
```

**Webの場合:**

1. **Store設計**
```typescript
// stores/features.ts の構造を計画

export const features = writable<Feature[]>([]);
export const currentFeature = writable<Feature | null>(null);
export const isLoading = writable<boolean>(false);
export const error = writable<string | null>(null);

export const featureStore = {
  async fetchAll() { ... },
  async fetchById(id: string) { ... },
  async create(input: CreateFeatureInput) { ... },
  async update(id: string, input: UpdateFeatureInput) { ... },
  async delete(id: string) { ... },
};
```

2. **Component設計**
```
components/
├── FeatureList.svelte      # 一覧
├── FeatureCard.svelte      # カード表示
├── FeatureForm.svelte      # 作成・編集フォーム
├── FeatureDetail.svelte    # 詳細表示
└── FeatureActions.svelte   # アクション（編集・削除）
```

### Step 3: API設計

**エンドポイント一覧:**

```markdown
## API Endpoints

### GET /api/features
- **説明**: 全Feature取得
- **Response**: `{ features: Feature[] }`
- **Status**: 200, 500

### GET /api/features/:id
- **説明**: ID指定でFeature取得
- **Request**: `id` (path parameter)
- **Response**: `{ feature: Feature }`
- **Status**: 200, 400, 404, 500

### POST /api/features
- **説明**: Feature作成
- **Request**: `{ name: string, status?: string }`
- **Response**: `{ feature: Feature }`
- **Status**: 201, 400, 500

### PUT /api/features/:id
- **説明**: Feature更新
- **Request**: `{ name?: string, status?: string }`
- **Response**: `{ feature: Feature }`
- **Status**: 200, 400, 404, 500

### DELETE /api/features/:id
- **説明**: Feature削除
- **Request**: `id` (path parameter)
- **Response**: No Content
- **Status**: 204, 400, 404, 500
```

### Step 4: バリデーション設計

```typescript
// validator.ts の設計

export const idParamSchema = z.object({
  id: z.string().trim().min(1, "Feature ID is required"),
});

export const createFeatureSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  status: z.enum(["active", "inactive"]).optional().default("active"),
});

export const updateFeatureSchema = createFeatureSchema.partial();
```

### Step 5: テスト計画

**テストケース一覧:**

```markdown
## Test Cases

### Service Tests (Unit)
- [ ] getAll returns all features
- [ ] getById returns feature when found
- [ ] getById returns NOT_FOUND when not found
- [ ] getById returns VALIDATION_ERROR for empty ID
- [ ] create creates feature with valid input
- [ ] create returns VALIDATION_ERROR for invalid input
- [ ] update updates feature with valid input
- [ ] delete deletes existing feature

### Handler Tests (E2E)
- [ ] GET /api/features returns 200 with empty array
- [ ] GET /api/features returns 200 with features
- [ ] GET /api/features/:id returns 200 with feature
- [ ] GET /api/features/:id returns 404 for non-existent ID
- [ ] POST /api/features returns 201 with created feature
- [ ] POST /api/features returns 400 for invalid input
- [ ] PUT /api/features/:id returns 200 with updated feature
- [ ] DELETE /api/features/:id returns 204
```

### Step 6: 実装順序の決定

```markdown
## Implementation Order

### Phase 1: Backend Foundation (Day 1)
1. Prismaスキーマ作成・マイグレーション
2. Prisma Fabbricaファクトリー作成
3. Domain層実装 (types, errors, constructors)

### Phase 2: Backend Logic (Day 1-2)
4. Repository層実装
5. Service層実装
6. Validator実装

### Phase 3: Backend API (Day 2)
7. Handler層実装
8. 公開APIエクスポート (index.ts)
9. メインアプリにルート追加

### Phase 4: Backend Testing (Day 2-3)
10. Service unit tests
11. Handler E2E tests
12. すべてのテストがパス

### Phase 5: Frontend Foundation (Day 3)
13. Type definitions
14. Hono RPC client setup
15. API wrapper functions

### Phase 6: Frontend State (Day 3-4)
16. Stores実装 (features, isLoading, error)
17. Store actions (fetchAll, create, update, delete)
18. Derived stores (filtered, stats)

### Phase 7: Frontend UI (Day 4-5)
19. Component実装 (List, Card, Form, Detail, Actions)
20. Page実装
21. Routing設定

### Phase 8: Frontend Testing (Day 5)
22. Store tests
23. Component tests
24. E2E tests (optional)

### Phase 9: Integration & Polish (Day 5)
25. 統合テスト
26. エラーハンドリング改善
27. ローディング状態改善
28. UX調整
```

### Step 7: リスク評価

```markdown
## Risks & Mitigation

### Risk 1: データベーススキーマ変更で既存データが壊れる
- **Likelihood**: Medium
- **Impact**: High
- **Mitigation**:
  - マイグレーション前にバックアップ
  - NULL許容カラムから開始
  - データ移行スクリプトを用意
  - ローカルで十分テスト

### Risk 2: 型の不一致でHono RPCが動作しない
- **Likelihood**: Low
- **Impact**: High
- **Mitigation**:
  - AppTypeを正しくエクスポート
  - 型チェックを実行
  - 簡単なAPIコールでテスト

### Risk 3: オプティミスティック更新でUI不整合
- **Likelihood**: Medium
- **Impact**: Medium
- **Mitigation**:
  - ロールバックロジックを実装
  - エラー時に明確なメッセージ
  - テストでロールバックを確認
```

### Step 8: チェックリスト

```markdown
## Implementation Checklist

### API
- [ ] Prismaスキーマ作成
- [ ] マイグレーション実行
- [ ] Domain層実装
- [ ] Repository層実装
- [ ] Service層実装
- [ ] Handler層実装
- [ ] Validator実装
- [ ] 公開APIエクスポート
- [ ] Service unit tests (all passing)
- [ ] Handler E2E tests (all passing)
- [ ] AppType正しくエクスポート

### Web
- [ ] Type definitions
- [ ] Hono RPC client
- [ ] API wrapper functions
- [ ] Stores実装
- [ ] Component実装
- [ ] Page実装
- [ ] Store tests
- [ ] Component tests
- [ ] E2E tests (optional)

### Documentation
- [ ] design.md作成
- [ ] CLAUDE.md更新 (必要に応じて)
- [ ] APIエンドポイント文書化
- [ ] 環境変数追加 (必要に応じて)

### Quality
- [ ] `bun run check:type` パス
- [ ] `bun run check:biome` パス
- [ ] すべてのテストパス
- [ ] 手動で機能確認
- [ ] エラーハンドリング確認
- [ ] ローディング状態確認
```

---

## リファクタリングの計画プロセス

### Step 1: 現状分析

```markdown
## Current State Analysis

### 問題点
- コードの重複が多い
- 命名が不統一
- エラーハンドリングが不十分
- テストカバレッジ低い

### 改善対象
- [ ] ファイル1
- [ ] ファイル2
- [ ] ファイル3

### 影響範囲
- API: X個のファイル
- Web: Y個のファイル
- Tests: Z個のファイル
```

### Step 2: 目標設定

```markdown
## Refactoring Goals

### 主目標
1. コードの重複を50%削減
2. エラーハンドリングを統一
3. テストカバレッジを80%以上に

### 成功基準
- [ ] すべてのテストがパス
- [ ] 型エラーゼロ
- [ ] Biomeエラーゼロ
- [ ] パフォーマンス劣化なし
```

### Step 3: 段階的アプローチ

```markdown
## Refactoring Phases

### Phase 1: Tests First
1. 現在の動作をテストで固める
2. すべてのテストがパス

### Phase 2: 小さな変更
3. 1ファイルずつリファクタリング
4. 各変更後にテスト実行
5. コミット

### Phase 3: 統合
6. すべての変更を統合
7. 統合テスト実行
8. 手動確認

### Phase 4: クリーンアップ
9. 不要なコード削除
10. ドキュメント更新
11. 最終確認
```

---

## データベーススキーマ変更の計画

### 1. マイグレーション戦略

```markdown
## Migration Strategy

### 方針
- Backward compatible migrations (可能な限り)
- Zero downtime deployment
- Rollback plan

### 手順
1. **Step 1**: 新カラム追加 (NULL許容)
2. **Step 2**: データ移行
3. **Step 3**: アプリケーションコード更新
4. **Step 4**: NOT NULL制約追加
5. **Step 5**: 古いカラム削除 (別マイグレーション)
```

### 2. データ移行スクリプト

```typescript
// migrations/scripts/migrate-data.ts

import { prisma } from "@api/lib/db";

async function migrateData() {
  console.log("Starting data migration...");

  // 1. 対象データ取得
  const records = await prisma.oldTable.findMany({
    where: { newColumn: null },
  });

  console.log(`Found ${records.length} records to migrate`);

  // 2. バッチ処理
  const batchSize = 100;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    await prisma.$transaction(
      batch.map((record) =>
        prisma.oldTable.update({
          where: { id: record.id },
          data: { newColumn: transformData(record) },
        }),
      ),
    );

    console.log(`Migrated ${Math.min(i + batchSize, records.length)}/${records.length}`);
  }

  console.log("Data migration completed");
}

migrateData()
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

### 3. ロールバック計画

```markdown
## Rollback Plan

### シナリオ1: マイグレーション失敗
```bash
# 前のマイグレーションに戻す
bun run db:migrate:reset
git checkout <previous-commit>
bun run db:migrate:deploy
```

### シナリオ2: データ不整合
```sql
-- 手動SQLでデータ修復
UPDATE tasks SET new_column = NULL WHERE ...;
```

### シナリオ3: アプリケーションエラー
```bash
# コードをロールバック
git revert <commit-hash>
bun run build
# デプロイ
```
```

---

## 新ライブラリ導入の計画

### 1. 評価基準

```markdown
## Library Evaluation

### ライブラリ: {library-name}

#### 導入理由
- 現在の課題: ...
- このライブラリで解決できること: ...

#### 評価項目
- [ ] **メンテナンス**: 最終更新日、Issue数、PR対応速度
- [ ] **人気度**: GitHub Stars, npm weekly downloads
- [ ] **ドキュメント**: 充実度、サンプルコード
- [ ] **TypeScript対応**: 型定義の質
- [ ] **バンドルサイズ**: 許容範囲内か
- [ ] **依存関係**: 他ライブラリとの競合なし
- [ ] **ライセンス**: プロジェクトと互換性あり
- [ ] **セキュリティ**: 既知の脆弱性なし

#### 代替案との比較
| 項目 | {library} | 代替A | 代替B |
|------|-----------|-------|-------|
| メンテナンス | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| TypeScript | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| バンドルサイズ | 50KB | 100KB | 30KB |
| 学習コスト | 低 | 中 | 高 |

#### 結論
{library}を採用。理由: ...
```

### 2. 導入計画

```markdown
## Integration Plan

### Phase 1: POC (1-2日)
1. 小規模な機能で試験導入
2. パフォーマンス測定
3. チームレビュー

### Phase 2: 段階的導入 (3-5日)
4. 1機能ずつ置き換え
5. テスト追加
6. ドキュメント更新

### Phase 3: 全面適用 (1-2日)
7. すべての該当箇所を置き換え
8. 旧ライブラリ削除
9. 依存関係クリーンアップ
```

---

## 計画のベストプラクティス

### 1. 小さく始める
```markdown
❌ BAD: すべてを一度にリファクタリング
✅ GOOD: 1機能ずつ、1ファイルずつ
```

### 2. テストで保護する
```markdown
❌ BAD: テストなしで大規模変更
✅ GOOD: 変更前に既存動作をテストで固める
```

### 3. 段階的にコミット
```markdown
❌ BAD: 1000行変更の1コミット
✅ GOOD: 論理的な単位で小さくコミット
```

### 4. ドキュメント更新を忘れない
```markdown
❌ BAD: コードだけ変更
✅ GOOD: CLAUDE.md, design.md も更新
```

### 5. レビューしやすくする
```markdown
❌ BAD: 巨大なPR
✅ GOOD: 機能単位で分割したPR
```
