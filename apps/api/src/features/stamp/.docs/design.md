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

### StampType (打刻種別)

```typescript
type StampType =
  | "clock_in"     // 出勤
  | "clock_out"    // 退勤
  | "break_start"  // 休憩開始
  | "break_end";   // 休憩終了
```

## API Endpoints

### GET /api/stamps/current
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

### POST /api/stamps/clock-in
出勤打刻

**Response (201)**:
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

**Error (400)**: すでに出勤済み

### PUT /api/stamps/clock-out
退勤打刻

**Response (200)**:
```json
{
  "stamp": { ... }
}
```

**Error (400)**: 未出勤 or すでに退勤済み

### PUT /api/stamps/break-start
休憩開始打刻

**Response (200)**:
```json
{
  "stamp": { ... }
}
```

**Error (400)**: 未出勤 or 退勤済み or すでに休憩中

### PUT /api/stamps/break-end
休憩終了打刻

**Response (200)**:
```json
{
  "stamp": { ... }
}
```

**Error (400)**: 休憩中でない

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

## Implementation Order

### Phase 1: Foundation
1. [x] Prismaスキーマ作成・マイグレーション
2. [ ] Domain層実装 (types, errors, constructors)
3. [ ] Prisma Fabbricaファクトリー作成

### Phase 2: Core Logic
4. [ ] Repository層実装
5. [ ] Service層実装
6. [ ] Validator実装

### Phase 3: HTTP Layer
7. [ ] Handler層実装
8. [ ] 公開APIエクスポート (index.ts)
9. [ ] メインアプリにルート追加

### Phase 4: Testing
10. [ ] Service unit tests
11. [ ] Handler E2E tests
12. [ ] すべてのテストがパス

## Test Cases

### Service Tests (Unit)
- [ ] getCurrentStatus returns "not_working" when no stamp exists
- [ ] getCurrentStatus returns "working" when clocked in
- [ ] getCurrentStatus returns "on_break" when on break
- [ ] getCurrentStatus returns "clocked_out" when clocked out
- [ ] clockIn creates new stamp
- [ ] clockIn returns error when already clocked in
- [ ] clockOut updates stamp with clock out time
- [ ] clockOut returns error when not clocked in
- [ ] clockOut returns error when already clocked out
- [ ] clockOut returns error when still on break
- [ ] breakStart updates stamp with break start time
- [ ] breakStart returns error when not clocked in
- [ ] breakStart returns error when already on break
- [ ] breakEnd updates stamp with break end time
- [ ] breakEnd returns error when not on break

### Handler Tests (E2E)
- [ ] GET /api/stamps/current returns 200 with not_working status
- [ ] GET /api/stamps/current returns 200 with working status
- [ ] POST /api/stamps/clock-in returns 201 with new stamp
- [ ] POST /api/stamps/clock-in returns 400 when already clocked in
- [ ] PUT /api/stamps/clock-out returns 200 with updated stamp
- [ ] PUT /api/stamps/clock-out returns 400 when not clocked in
- [ ] PUT /api/stamps/break-start returns 200 with updated stamp
- [ ] PUT /api/stamps/break-end returns 200 with updated stamp
