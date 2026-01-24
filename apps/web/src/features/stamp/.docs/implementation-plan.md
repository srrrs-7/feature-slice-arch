# Stamp Web UI 実装計画

## 概要

`apps/web/src/features/todo-detail` の実装パターンを参考に、Stamp (勤怠打刻) 機能のWeb UIを実装する。

## 参考実装パターン (todo-detail)

### ディレクトリ構造
```
features/todo-detail/
├── api/
│   └── index.ts          # API関数を再エクスポート
├── stores/
│   ├── task-detail.ts    # Store実装 (writable + store object pattern)
│   └── index.ts          # Store再エクスポート
├── types/
│   └── index.ts          # 型を再エクスポート
├── components/
│   ├── TaskDetailHeader.svelte
│   ├── TaskDetailDescription.svelte
│   ├── TaskDetailMetadata.svelte
│   └── DeleteConfirmDialog.svelte
└── pages/
    └── TaskDetailPage.svelte
```

### Store パターン
- `writable` storeで状態管理 (currentTask, isLoading, error)
- Store object pattern で非同期メソッドを提供
- オプティミスティック更新 + エラー時ロールバック
- `clear()` メソッドでリセット

### コンポーネントパターン
- ページはstoreをインポートして `$` 記法でリアクティブに参照
- `onMount` でデータ取得、`onDestroy` でクリーンアップ
- 子コンポーネントはpropsでコールバックを受け取る

---

## Stamp 実装計画

### ディレクトリ構造
```
features/stamp/
├── .docs/
│   ├── design.md              # UI設計ドキュメント (作成済み)
│   └── implementation-plan.md # この計画書
├── api/
│   ├── client.ts              # Hono RPC client (stampsApi)
│   └── index.ts               # API wrapper関数
├── stores/
│   ├── stamp.ts               # Store実装
│   └── index.ts               # Store再エクスポート
├── types/
│   └── index.ts               # 型定義 (API型を再エクスポート)
├── components/
│   ├── StampClock.svelte      # 現在時刻表示
│   ├── StampStatusCard.svelte # ステータス表示カード
│   ├── StampActionButton.svelte # アクションボタン
│   └── StampHistory.svelte    # 本日の打刻履歴
└── pages/
    └── StampPage.svelte       # メインページ
```

---

## TODO リスト (TDD方式)

### Phase 1: 基盤 (API, Types, Store)

#### 1.1 Types定義
- [ ] `types/index.ts` - API型を再エクスポート
  - `Stamp`, `StampId`, `WorkStatus`, `StampType`, `CurrentStatusResponse`
  - クライアント専用型: `StampAction` (= StampType)

#### 1.2 API Client
- [ ] `api/client.ts` - Hono RPC client設定
  - `stampsApi` をエクスポート
- [ ] `api/index.ts` - API wrapper関数
  - `getStatus()`: GET /api/stamps/status
  - `recordStamp(action)`: POST /api/stamps

#### 1.3 Store実装
- [ ] `stores/stamp.ts` - 状態管理
  - `currentStatus`: writable<WorkStatus>
  - `currentStamp`: writable<Stamp | null>
  - `isLoading`: writable<boolean>
  - `error`: writable<string | null>
  - `stampStore` object:
    - `fetchStatus()`: ステータス取得
    - `clockIn()`: 出勤
    - `clockOut()`: 退勤
    - `breakStart()`: 休憩開始
    - `breakEnd()`: 休憩終了
    - `clear()`: リセット
- [ ] `stores/index.ts` - 再エクスポート

### Phase 2: コンポーネント実装

#### 2.1 StampClock.svelte
- [ ] 現在時刻をリアルタイム表示 (HH:MM:SS)
- [ ] 現在日付を表示 (YYYY年MM月DD日 (曜日))
- [ ] 1秒ごとに更新
- [ ] アクセシビリティ: `aria-live="polite"`

#### 2.2 StampStatusCard.svelte
- [ ] WorkStatusに応じた表示
  - `not_working`: 未出勤 (グレー)
  - `working`: 勤務中 (グリーン)
  - `on_break`: 休憩中 (オレンジ)
  - `clocked_out`: 退勤済み (ブルー)
- [ ] 打刻時刻の表示 (出勤時刻、休憩開始時刻など)
- [ ] アクセシビリティ: 状態変化を `role="status"` で通知

#### 2.3 StampActionButton.svelte
- [ ] WorkStatusに応じたボタン表示
  - `not_working`: 「出勤」ボタン
  - `working`: 「休憩開始」「退勤」ボタン
  - `on_break`: 「休憩終了」ボタン
  - `clocked_out`: ボタンなし（または再出勤不可メッセージ）
- [ ] ローディング状態表示
- [ ] エラー時のフィードバック
- [ ] タッチターゲット: 最小48×48px
- [ ] キーボード操作対応

#### 2.4 StampHistory.svelte
- [ ] 本日の打刻履歴表示
  - 出勤時刻
  - 休憩開始・終了時刻
  - 退勤時刻
- [ ] 時刻はローカルタイムで表示
- [ ] 空状態: 「本日の打刻はありません」

### Phase 3: ページ実装

#### 3.1 StampPage.svelte
- [ ] レイアウト構成
  - StampClock (上部)
  - StampStatusCard (中央)
  - StampActionButton (下部)
  - StampHistory (最下部、折りたたみ可能)
- [ ] `onMount` でステータス取得
- [ ] `onDestroy` でクリーンアップ
- [ ] エラー表示
- [ ] ローディング状態

### Phase 4: 統合・仕上げ

#### 4.1 App.svelte への統合
- [ ] ルーティング追加 (または todo-list との切り替え)

#### 4.2 デザイン調整
- [ ] レスポンシブ対応 (モバイルファースト)
- [ ] アクセシビリティ確認 (WCAG 2.1 AA)
- [ ] アニメーション追加 (状態遷移時)

---

## 実装順序

```
1. types/index.ts          (5分)
2. api/client.ts           (5分)
3. api/index.ts            (10分)
4. stores/stamp.ts         (20分)
5. stores/index.ts         (2分)
6. StampClock.svelte       (15分)
7. StampStatusCard.svelte  (20分)
8. StampActionButton.svelte (20分)
9. StampHistory.svelte     (15分)
10. StampPage.svelte       (20分)
11. App.svelte 統合        (10分)
12. デザイン調整           (20分)
```

---

## API仕様 (参照)

### GET /api/stamps/status
**Response (200):**
```json
{
  "status": "working",
  "stamp": {
    "id": "uuid",
    "date": "2026-01-24",
    "clockInAt": "2026-01-24T00:00:00.000Z",
    "clockOutAt": null,
    "breakStartAt": null,
    "breakEndAt": null,
    "createdAt": "2026-01-24T00:00:00.000Z",
    "updatedAt": "2026-01-24T00:00:00.000Z"
  }
}
```

### POST /api/stamps
**Request:**
```json
{
  "action": "clock_in" | "clock_out" | "break_start" | "break_end"
}
```

**Response (200):**
```json
{
  "stamp": { ... }
}
```

**Error (400):**
- `Already clocked in for YYYY-MM-DD`
- `Already clocked out for YYYY-MM-DD`
- `Not clocked in for YYYY-MM-DD`
- etc.

---

## 型定義 (参照)

```typescript
// API側からエクスポート
type StampId = string & { readonly _brand: unique symbol };
type WorkStatus = "not_working" | "working" | "on_break" | "clocked_out";
type StampType = "clock_in" | "clock_out" | "break_start" | "break_end";

interface Stamp {
  readonly id: StampId;
  readonly date: string;
  readonly clockInAt: Date;
  readonly clockOutAt: Date | null;
  readonly breakStartAt: Date | null;
  readonly breakEndAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

interface CurrentStatusResponse {
  readonly status: WorkStatus;
  readonly stamp: Stamp | null;
}
```

---

## Store設計

```typescript
// stores/stamp.ts
import { writable } from "svelte/store";
import * as api from "../api";
import type { Stamp, WorkStatus } from "../types";

export const currentStatus = writable<WorkStatus>("not_working");
export const currentStamp = writable<Stamp | null>(null);
export const isLoading = writable<boolean>(false);
export const error = writable<string | null>(null);

export const stampStore = {
  async fetchStatus(): Promise<void> {
    isLoading.set(true);
    error.set(null);
    try {
      const data = await api.getStatus();
      currentStatus.set(data.status);
      currentStamp.set(data.stamp);
    } catch (err) {
      error.set(err instanceof Error ? err.message : "Failed to fetch status");
    } finally {
      isLoading.set(false);
    }
  },

  async clockIn(): Promise<void> {
    isLoading.set(true);
    error.set(null);
    try {
      const data = await api.recordStamp("clock_in");
      currentStamp.set(data.stamp);
      currentStatus.set("working");
    } catch (err) {
      error.set(err instanceof Error ? err.message : "Failed to clock in");
      throw err;
    } finally {
      isLoading.set(false);
    }
  },

  async clockOut(): Promise<void> { /* 同様 */ },
  async breakStart(): Promise<void> { /* 同様 */ },
  async breakEnd(): Promise<void> { /* 同様 */ },

  clear(): void {
    currentStatus.set("not_working");
    currentStamp.set(null);
    error.set(null);
    isLoading.set(false);
  },
};
```

---

## コンポーネント設計

### StampClock.svelte
```svelte
<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  let currentTime = new Date();
  let interval: ReturnType<typeof setInterval>;

  onMount(() => {
    interval = setInterval(() => {
      currentTime = new Date();
    }, 1000);
  });

  onDestroy(() => {
    if (interval) clearInterval(interval);
  });

  $: timeString = currentTime.toLocaleTimeString("ja-JP");
  $: dateString = currentTime.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
</script>

<div class="text-center" aria-live="polite">
  <div class="text-6xl font-mono font-bold">{timeString}</div>
  <div class="text-xl text-muted-foreground mt-2">{dateString}</div>
</div>
```

### StampStatusCard.svelte
```svelte
<script lang="ts">
  import type { WorkStatus, Stamp } from "../types";

  export let status: WorkStatus;
  export let stamp: Stamp | null;

  const statusConfig = {
    not_working: { label: "未出勤", color: "bg-gray-100", icon: "🏠" },
    working: { label: "勤務中", color: "bg-green-100", icon: "💼" },
    on_break: { label: "休憩中", color: "bg-orange-100", icon: "☕" },
    clocked_out: { label: "退勤済み", color: "bg-blue-100", icon: "🌙" },
  };

  $: config = statusConfig[status];
</script>

<div class={`p-6 rounded-xl ${config.color}`} role="status">
  <div class="text-4xl mb-2">{config.icon}</div>
  <div class="text-2xl font-bold">{config.label}</div>
  <!-- 打刻時刻表示 -->
</div>
```

---

## チェックリスト

### 実装完了条件
- [ ] すべてのTODO項目が完了
- [ ] TypeScript型エラーなし (`bun run check:type`)
- [ ] Biomeエラーなし (`bun run check:biome`)
- [ ] 手動テスト完了
  - [ ] 出勤打刻
  - [ ] 休憩開始/終了
  - [ ] 退勤打刻
  - [ ] エラー表示
  - [ ] ローディング表示
- [ ] レスポンシブ確認 (モバイル/タブレット/デスクトップ)
- [ ] アクセシビリティ確認 (キーボード操作、スクリーンリーダー)
