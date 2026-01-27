# Init Command

プロジェクトのCLAUDE.mdファイルを一括更新するコマンド。

## 概要

各ディレクトリ配下のCLAUDE.mdファイルを最新のプロジェクト構成に合わせて更新します。

---

## 対象ファイル

| ファイル | 内容 |
|---------|------|
| `/workspace/main/CLAUDE.md` | プロジェクト全体の概要、コマンド、アーキテクチャ |
| `/workspace/main/apps/api/CLAUDE.md` | API層の詳細（Hono, Prisma, neverthrow） |
| `/workspace/main/apps/web/CLAUDE.md` | Web層の詳細（Svelte 5, Tailwind, i18n） |
| `/workspace/main/apps/iac/CLAUDE.md` | Infrastructure as Code（Terraform, AWS） |
| `/workspace/main/.github/workflows/CLAUDE.md` | CI/CDパイプライン（GitHub Actions） |
| `/workspace/main/.devcontainer/CLAUDE.md` | 開発環境設定（Dev Container） |

---

## 更新手順

### Step 1: 現状確認

各CLAUDE.mdファイルを読み込み、最新の構成と比較:

```bash
# ファイル一覧確認
find . -name "CLAUDE.md" -type f

# 各ファイルの更新日時
ls -la */CLAUDE.md .github/workflows/CLAUDE.md .devcontainer/CLAUDE.md
```

### Step 2: 更新内容の特定

以下の観点で更新が必要か確認:

1. **コマンド**: 新しいコマンドが追加されていないか
2. **依存関係**: バージョンが更新されていないか
3. **アーキテクチャ**: 構造が変更されていないか
4. **ルール参照**: `.claude/rules/`の変更が反映されているか
5. **新機能**: 新しいfeatureが追加されていないか

### Step 3: 各ファイルの更新

#### ルートCLAUDE.md (`/workspace/main/CLAUDE.md`)

**更新すべき内容:**
- プロジェクト構成の変更
- 新しいworkspaceの追加
- コマンドの追加・変更
- アーキテクチャの変更
- ドキュメントリンクの更新

#### API CLAUDE.md (`apps/api/CLAUDE.md`)

**更新すべき内容:**
- 新しいfeatureの追加
- 依存ライブラリのバージョン
- アーキテクチャパターンの変更
- テストパターンの変更
- ルール参照の更新

#### Web CLAUDE.md (`apps/web/CLAUDE.md`)

**更新すべき内容:**
- 新しいfeatureの追加
- Svelte/Viteのバージョン
- UIコンポーネントの追加
- i18nの追加言語
- ルール参照の更新

#### IaC CLAUDE.md (`apps/iac/CLAUDE.md`)

**更新すべき内容:**
- Terraformモジュールの追加・変更
- AWSリソースの変更
- 環境変数の追加
- デプロイメント手順の変更

#### Workflows CLAUDE.md (`.github/workflows/CLAUDE.md`)

**更新すべき内容:**
- 新しいワークフローの追加
- ジョブの変更
- シークレットの追加
- トリガー条件の変更

#### DevContainer CLAUDE.md (`.devcontainer/CLAUDE.md`)

**更新すべき内容:**
- Dockerイメージの変更
- VS Code拡張機能の追加
- ポートフォワードの変更
- 環境変数の追加

---

## 更新テンプレート

### 構成変更の反映

```markdown
## Architecture

```
src/
├── features/           # Feature modules
│   ├── {既存feature}/
│   └── {新規feature}/  # ← 新規追加
```
```

### バージョン更新の反映

```markdown
| Technology | Version |
|------------|---------|
| Runtime | Bun X.X.X |
| Framework | Hono X.X |
```

### ルール参照の更新

```markdown
## Related Documentation

- [Root CLAUDE.md](/workspace/main/CLAUDE.md) - Project overview
- [.claude/rules/coding-rules.md](/workspace/main/.claude/rules/coding-rules.md) - Coding rules
- [.claude/rules/testing.md](/workspace/main/.claude/rules/testing.md) - Test patterns and TDD
- [.claude/rules/security.md](/workspace/main/.claude/rules/security.md) - Security guidelines
```

---

## 更新後の確認

### チェックリスト

- [ ] すべてのCLAUDE.mdファイルが一貫性を保っている
- [ ] `.claude/rules/`への参照が正しい
- [ ] 削除されたファイルへの参照がない
- [ ] 新機能が適切に文書化されている
- [ ] コマンド例が最新
- [ ] バージョン情報が正確

### 検証コマンド

```bash
# スペルチェック
bun run check:spell

# リンク切れ確認（任意）
# 各CLAUDE.mdの参照パスが存在するか確認
```

---

## 使用例

```bash
# 全CLAUDE.mdを更新
/init

# 特定のディレクトリのみ更新
/init apps/api

# 更新内容をプレビュー（変更なし）
/init --dry-run
```

---

## 関連ルール

- `.claude/rules/README.md` - ルールファイル一覧
- `.claude/rules/coding-rules.md` - コーディング規約
- `.claude/rules/testing.md` - テスト規約
- `.claude/rules/planning.md` - 計画規約
