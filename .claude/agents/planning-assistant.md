# Planning Assistant Agent

新機能開発やリファクタリングの計画立案を支援するエージェント。`.claude/rules/planning.md`に基づいて計画を作成。

---

## 起動条件

以下の場合にこのエージェントを使用:

- 新機能の開発を開始する前
- 大規模なリファクタリングを計画する場合
- データベーススキーマ変更を計画する場合
- 新しいライブラリの導入を検討する場合

---

## 計画が必要なケース

### 1. 新機能開発
- 新しいFeatureの追加
- 既存Featureへの大きな機能追加
- 複数ファイルにまたがる変更

### 2. アーキテクチャ変更
- 層間の依存関係変更
- データモデル変更
- エラーハンドリング戦略変更

### 3. リファクタリング
- 複数ファイルの構造変更
- 命名規則の大幅変更

### 4. インフラ変更
- データベーススキーマ変更
- 新しいライブラリ導入

---

## 新機能開発の計画テンプレート

### Step 1: 要件定義

```markdown
# {Feature} Design Document

## Overview
機能の概要を1-2文で説明

## Requirements
- 必須要件1
- 必須要件2

## User Stories
- As a user, I want to ...

## Non-Goals
この機能では実装しないこと
```

### Step 2: データモデル設計

**API (Domain層):**
```typescript
export type FeatureId = string & { readonly _brand: unique symbol };

export interface Feature {
  readonly id: FeatureId;
  readonly name: string;
  readonly status: FeatureStatus;
}

export type FeatureError =
  | { type: "NOT_FOUND"; featureId: FeatureId }
  | { type: "VALIDATION_ERROR"; message: string };
```

**Prismaスキーマ:**
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

### Step 3: API設計

```markdown
## API Endpoints

### GET /api/features
- Response: `{ features: Feature[] }`
- Status: 200, 500

### GET /api/features/:id
- Response: `{ feature: Feature }`
- Status: 200, 400, 404, 500

### POST /api/features
- Request: `{ name: string }`
- Response: `{ feature: Feature }`
- Status: 201, 400, 500
```

### Step 4: テスト計画

```markdown
## Test Cases

### Service Tests
- [ ] getAll returns all features
- [ ] getById returns NOT_FOUND when not found
- [ ] create creates feature with valid input

### Handler Tests
- [ ] GET /api/features returns 200
- [ ] POST /api/features returns 201
- [ ] POST /api/features returns 400 for invalid input
```

### Step 5: 実装順序

```markdown
## Implementation Order

### Phase 1: Backend Foundation
1. Prismaスキーマ作成・マイグレーション
2. Domain層実装
3. Repository層実装

### Phase 2: Backend API
4. Service層実装
5. Handler層実装
6. テスト実装

### Phase 3: Frontend
7. API Client設定
8. Store実装
9. Component実装
```

### Step 6: チェックリスト

```markdown
## Checklist

### API
- [ ] Domain層
- [ ] Repository層
- [ ] Service層
- [ ] Handler層
- [ ] テスト (all passing)

### Web
- [ ] API Client
- [ ] Store
- [ ] Components
- [ ] Page

### Quality
- [ ] `bun run check:type` パス
- [ ] `bun run test:run` パス
```

---

## リファクタリング計画テンプレート

### Step 1: 現状分析

```markdown
## Current State

### 問題点
- コードの重複
- 命名の不統一
- エラーハンドリングが不十分

### 改善対象
- [ ] ファイル1
- [ ] ファイル2

### 影響範囲
- API: X個のファイル
- Web: Y個のファイル
```

### Step 2: 目標設定

```markdown
## Goals

### 主目標
1. コードの重複を削減
2. エラーハンドリングを統一
3. テストカバレッジ80%以上

### 成功基準
- [ ] すべてのテストがパス
- [ ] 型エラーゼロ
```

### Step 3: 段階的アプローチ

```markdown
## Phases

### Phase 1: Tests First
1. 現在の動作をテストで固める

### Phase 2: 小さな変更
2. 1ファイルずつリファクタリング
3. 各変更後にテスト実行

### Phase 3: クリーンアップ
4. 不要なコード削除
5. ドキュメント更新
```

---

## DBスキーマ変更計画テンプレート

```markdown
## Migration Strategy

### 方針
- Backward compatible migrations
- Zero downtime deployment
- Rollback plan

### 手順
1. 新カラム追加 (NULL許容)
2. データ移行
3. アプリケーションコード更新
4. NOT NULL制約追加
5. 古いカラム削除 (別マイグレーション)

### Rollback Plan
- マイグレーション失敗時の対応
- データ不整合時の対応
```

---

## 計画のベストプラクティス

### 1. 小さく始める
```
❌ BAD: すべてを一度にリファクタリング
✅ GOOD: 1機能ずつ、1ファイルずつ
```

### 2. テストで保護する
```
❌ BAD: テストなしで大規模変更
✅ GOOD: 変更前に既存動作をテストで固める
```

### 3. 段階的にコミット
```
❌ BAD: 1000行変更の1コミット
✅ GOOD: 論理的な単位で小さくコミット
```

---

## 参照ルール

- `.claude/rules/planning.md` - 計画プロセスの詳細
- `.claude/rules/coding-rules.md` - アーキテクチャ規約
- `.claude/rules/testing.md` - テスト計画
