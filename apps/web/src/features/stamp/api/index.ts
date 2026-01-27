import type { CurrentStatusResponse, Stamp, StampAction } from "../types";
import { stampsApi } from "./client";

function isStamp(value: unknown): value is Stamp {
  if (!value || typeof value !== "object") return false;
  const stamp = value;
  return (
    "id" in stamp &&
    "date" in stamp &&
    "clockInAt" in stamp &&
    "clockOutAt" in stamp &&
    "breakStartAt" in stamp &&
    "breakEndAt" in stamp &&
    "createdAt" in stamp &&
    "updatedAt" in stamp
  );
}

function isCurrentStatusResponse(value: unknown): value is CurrentStatusResponse {
  if (!value || typeof value !== "object") return false;
  const data = value;
  if (!("status" in data) || !("stamp" in data)) return false;
  if (data.stamp === null) return true;
  return isStamp(data.stamp);
}

function isStampResponse(value: unknown): value is { stamp: Stamp } {
  if (!value || typeof value !== "object") return false;
  const data = value;
  return "stamp" in data && isStamp(data.stamp);
}

async function readErrorMessage(res: Response): Promise<string> {
  const fallback = res.statusText || "Request failed";
  const data: unknown = await res.json().catch(() => null);
  if (!data || typeof data !== "object") return fallback;
  const message = "message" in data ? data.message : null;
  return typeof message === "string" && message.length > 0 ? message : fallback;
}

async function throwForStatus(res: Response, context: string): Promise<never> {
  const message = await readErrorMessage(res);

  switch (res.status) {
    case 400:
      throw new Error(message);
    case 401:
      throw new Error("認証に失敗しました。再ログインしてください。");
    case 403:
      throw new Error("この操作を実行する権限がありません。");
    case 404:
      throw new Error("対象の打刻情報が見つかりませんでした。");
    case 409:
      throw new Error(
        message || "状態が競合しました。再読み込みしてください。",
      );
    case 500:
    case 502:
    case 503:
    case 504:
      throw new Error(
        "サーバーエラーが発生しました。時間をおいて再試行してください。",
      );
    default:
      throw new Error(`${context}: ${message}`);
  }
}

/**
 * Get current work status
 */
export async function getStatus(): Promise<CurrentStatusResponse> {
  const res = await stampsApi.status.$get();
  if (!res.ok) {
    await throwForStatus(res, "Failed to fetch status");
  }
  const data: unknown = await res.json();
  if (!isCurrentStatusResponse(data)) {
    throw new Error("ステータス応答の形式が不正です。");
  }
  return data;
}

/**
 * Record a stamp action (clock_in, clock_out, break_start, break_end)
 */
export async function recordStamp(
  action: StampAction,
): Promise<{ stamp: Stamp }> {
  const res = await stampsApi.$post({ json: { action } });
  if (!res.ok) {
    await throwForStatus(res, "Failed to record stamp");
  }
  const data: unknown = await res.json();
  if (!isStampResponse(data)) {
    throw new Error("打刻応答の形式が不正です。");
  }
  return data;
}
