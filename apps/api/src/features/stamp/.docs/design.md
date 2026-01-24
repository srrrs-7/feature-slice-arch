# Stamp (勤怠打刻) Feature Design Document

## Overview

勤怠管理のための打刻機能API。出勤・退勤・休憩開始・休憩終了の4種類の打刻と、現在の勤務状況を取得する機能を提供する。

## Requirements

### 必須要件
- 出勤打刻ができる（1日1回のみ）
- 退勤打刻ができる（出勤後のみ）
- 休憩開始打刻ができる（出勤中のみ）
- 休憩終了打刻ができる（休憩中のみ）
- 現在の勤務状況を取得できる
- すべての時刻はUTCで保存

### オプション要件
- 日付指定での勤怠記録取得（将来対応）
- 月間の勤怠レポート（将来対応）

## Domain Model

### Stamp (勤怠記録)

```typescript
interface Stamp {
  readonly id: StampId;
  readonly date: string;         // YYYY-MM-DD形式（勤務日）
  readonly clockInAt: Date;      // 出勤時刻
  readonly clockOutAt: Date | null;  // 退勤時刻
  readonly breakStartAt: Date | null; // 休憩開始時刻
  readonly breakEndAt: Date | null;   // 休憩終了時刻
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
```

### WorkStatus (勤務状況)

```typescript
type WorkStatus =
  | "not_working"  // 未出勤（本日の打刻なし）
  | "working"      // 勤務中（出勤済み、休憩中でない）
  | "on_break"     // 休憩中
  | "clocked_out"; // 退勤済み
```

### StampAction (打刻アクション)

```typescript
type StampAction =
  | "clock_in"     // 出勤
  | "clock_out"    // 退勤
  | "break_start"  // 休憩開始
  | "break_end";   // 休憩終了
```

## API Endpoints

### GET /api/stamps/status
現在の勤務状況を取得

**Response (200)**:
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

**Response (200) - 未出勤**:
```json
{
  "status": "not_working",
  "stamp": null
}
```

### POST /api/stamps
打刻を記録（出勤・退勤・休憩開始・休憩終了）

**Request Body**:
```json
{
  "action": "clock_in" | "clock_out" | "break_start" | "break_end"
}
```

**Response (200)**:
```json
{
  "stamp": {
    "id": "uuid",
    "date": "2026-01-24",
    "clockInAt": "2026-01-24T09:00:00.000Z",
    "clockOutAt": null,
    "breakStartAt": null,
    "breakEndAt": null,
    "createdAt": "2026-01-24T09:00:00.000Z",
    "updatedAt": "2026-01-24T09:00:00.000Z"
  }
}
```

**Error (400)**:
- `action: "clock_in"`: すでに出勤済み
- `action: "clock_out"`: 未出勤 / すでに退勤済み / まだ休憩中
- `action: "break_start"`: 未出勤 / 退勤済み / すでに休憩中
- `action: "break_end"`: 休憩中でない

## Business Rules

1. **出勤 (clock_in)**
   - 同一日に2回以上の出勤は不可
   - 出勤時刻は現在時刻を自動記録

2. **退勤 (clock_out)**
   - 出勤済みでないと退勤不可
   - すでに退勤済みの場合は不可
   - 休憩中の場合は先に休憩終了が必要

3. **休憩開始 (break_start)**
   - 出勤済みでないと休憩開始不可
   - すでに休憩中の場合は不可
   - 退勤済みの場合は不可

4. **休憩終了 (break_end)**
   - 休憩中でないと休憩終了不可

5. **日付の判定**
   - サーバーのタイムゾーン（Asia/Tokyo）で日付を判定
   - 深夜0時を跨ぐ勤務は翌日の出勤として扱わない

## Error Types

```typescript
type StampError =
  | DatabaseError
  | ValidationError
  | StampNotFoundError       // 本日の打刻記録がない
  | AlreadyClockedInError    // すでに出勤済み
  | AlreadyClockedOutError   // すでに退勤済み
  | AlreadyOnBreakError      // すでに休憩中
  | NotClockedInError        // 未出勤
  | NotOnBreakError          // 休憩中でない
  | StillOnBreakError;       // まだ休憩中（退勤時）
```

## Database Schema

```prisma
model Stamp {
  id           String    @id @default(uuid())
  date         String    // YYYY-MM-DD形式
  clockInAt    DateTime
  clockOutAt   DateTime?
  breakStartAt DateTime?
  breakEndAt   DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@unique([date])  // 1日1レコード
  @@map("stamps")
}
```

## Implementation Status

### Phase 1: Foundation
1. [x] Prismaスキーマ作成・マイグレーション
2. [x] Domain層実装 (types, errors, constructors)
3. [x] Prisma Fabbricaファクトリー作成

### Phase 2: Core Logic
4. [x] Repository層実装
5. [x] Service層実装
6. [x] Validator実装

### Phase 3: HTTP Layer
7. [x] Handler層実装
8. [x] 公開APIエクスポート (index.ts)
9. [x] メインアプリにルート追加

### Phase 4: Testing
10. [x] Service unit tests (26 tests)
11. [x] Handler E2E tests (22 tests)
12. [x] すべてのテストがパス

## Test Cases

### Service Tests (Unit) - 26 tests
- [x] getStatus returns "not_working" when no stamp exists
- [x] getStatus returns "working" when clocked in
- [x] getStatus returns "on_break" when on break
- [x] getStatus returns "clocked_out" when clocked out
- [x] getStatus returns database error on repository failure
- [x] clockIn creates new stamp
- [x] clockIn returns ALREADY_CLOCKED_IN when stamp exists
- [x] clockIn returns database error on repository failure
- [x] clockOut updates stamp with clock out time
- [x] clockOut returns NOT_CLOCKED_IN when no stamp exists
- [x] clockOut returns ALREADY_CLOCKED_OUT when already clocked out
- [x] clockOut returns STILL_ON_BREAK when on break
- [x] breakStart updates stamp with break start time
- [x] breakStart returns NOT_CLOCKED_IN when no stamp exists
- [x] breakStart returns ALREADY_CLOCKED_OUT when already clocked out
- [x] breakStart returns ALREADY_ON_BREAK when already on break
- [x] breakStart allows starting break after previous break ended
- [x] breakEnd updates stamp with break end time
- [x] breakEnd returns NOT_CLOCKED_IN when no stamp exists
- [x] breakEnd returns NOT_ON_BREAK when not on break (no break started)
- [x] breakEnd returns NOT_ON_BREAK when break already ended
- [x] getWorkStatus returns not_working for null stamp
- [x] getWorkStatus returns working for clocked in stamp
- [x] getWorkStatus returns on_break for stamp on break
- [x] getWorkStatus returns clocked_out for clocked out stamp
- [x] getWorkStatus returns working for stamp with completed break

### Handler Tests (E2E) - 22 tests

#### GET /api/stamps/status (5 tests)
- [x] returns not_working status when no stamp exists
- [x] returns working status when clocked in
- [x] returns on_break status when on break
- [x] returns clocked_out status when clocked out
- [x] returns working status after break ended

#### POST /api/stamps - clock_in (2 tests)
- [x] creates stamp with clock-in time
- [x] returns 400 when already clocked in today

#### POST /api/stamps - clock_out (5 tests)
- [x] updates stamp with clock-out time
- [x] allows clock-out after break ended
- [x] returns 400 when not clocked in
- [x] returns 400 when already clocked out
- [x] returns 400 when still on break

#### POST /api/stamps - break_start (4 tests)
- [x] updates stamp with break-start time
- [x] returns 400 when not clocked in
- [x] returns 400 when already clocked out
- [x] returns 400 when already on break

#### POST /api/stamps - break_end (4 tests)
- [x] updates stamp with break-end time
- [x] returns 400 when not clocked in
- [x] returns 400 when not on break (no break started)
- [x] returns 400 when break already ended

#### Validation (2 tests)
- [x] returns 400 for missing action
- [x] returns 400 for invalid action type

## Usage Examples

```bash
# ステータス取得
curl http://localhost:3000/api/stamps/status

# 出勤
curl -X POST http://localhost:3000/api/stamps \
  -H "Content-Type: application/json" \
  -d '{"action": "clock_in"}'

# 休憩開始
curl -X POST http://localhost:3000/api/stamps \
  -H "Content-Type: application/json" \
  -d '{"action": "break_start"}'

# 休憩終了
curl -X POST http://localhost:3000/api/stamps \
  -H "Content-Type: application/json" \
  -d '{"action": "break_end"}'

# 退勤
curl -X POST http://localhost:3000/api/stamps \
  -H "Content-Type: application/json" \
  -d '{"action": "clock_out"}'
```
