import { createClient } from "@/lib/supabase/client";
import type { SessionRecord } from "@/lib/types";

// 면담 이력 저장소.
// useSyncExternalStore가 요구하는 "동기 스냅샷" 계약은 그대로 두고, 뒤에서 Supabase와 동기화한다.
// 덕분에 이 파일을 쓰는 컴포넌트들은 수정할 필요가 없다.
const LEGACY_KEY = "leader-1on1-copilot/sessions";
const MIGRATED_KEY = "leader-1on1-copilot/migrated-v1";
const LEADER_KEY = "leader-1on1-copilot/leader-name";
const MAX_RECORDS = 10;
const EMPTY: SessionRecord[] = [];

let cache: SessionRecord[] = EMPTY;
let loadPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

type SessionRow = {
  id: string;
  track: SessionRecord["track"];
  member_name: string;
  role: string;
  closed_at: string;
  grade: SessionRecord["grade"];
  payload: Record<string, unknown>;
};

function rowToRecord(row: SessionRow): SessionRecord {
  const payload = row.payload ?? {};
  return {
    id: row.id,
    track: row.track,
    memberName: row.member_name,
    role: row.role,
    closedAt: row.closed_at,
    grade: row.grade,
    employeeActions: (payload.employeeActions as string[]) ?? [],
    managerActions: (payload.managerActions as string[]) ?? [],
    followUpTiming: (payload.followUpTiming as string) ?? "",
    metrics: (payload.metrics as string[]) ?? [],
    unresolved: (payload.unresolved as string[]) ?? [],
    goals: (payload.goals as SessionRecord["goals"]) ?? [],
    topics: (payload.topics as string[]) ?? [],
    gradeReason: (payload.gradeReason as string) ?? "",
    developmentPlan: (payload.developmentPlan as SessionRecord["developmentPlan"]) ?? null,
  };
}

function recordToRow(record: SessionRecord, userId: string) {
  return {
    id: record.id,
    user_id: userId,
    track: record.track,
    member_name: record.memberName,
    role: record.role,
    closed_at: record.closedAt,
    grade: record.grade,
    payload: {
      employeeActions: record.employeeActions,
      managerActions: record.managerActions,
      followUpTiming: record.followUpTiming,
      metrics: record.metrics,
      unresolved: record.unresolved,
      goals: record.goals,
      topics: record.topics,
      gradeReason: record.gradeReason,
      developmentPlan: record.developmentPlan,
    },
  };
}

// 예전에 브라우저에만 있던 기록을 한 번만 서버로 옮긴다.
// 원본 localStorage 키는 롤백을 위해 지우지 않는다.
async function migrateLegacyRecords(userId: string) {
  try {
    if (window.localStorage.getItem(MIGRATED_KEY)) return;

    const raw = window.localStorage.getItem(LEGACY_KEY);
    if (!raw) {
      window.localStorage.setItem(MIGRATED_KEY, "done");
      return;
    }

    const legacy = JSON.parse(raw) as SessionRecord[];
    if (!Array.isArray(legacy) || legacy.length === 0) {
      window.localStorage.setItem(MIGRATED_KEY, "done");
      return;
    }

    const supabase = createClient();
    const rows = legacy.map((record) =>
      recordToRow(
        // 예전 기록의 id는 UUID가 아닐 수 있어 새로 발급한다.
        { ...record, id: crypto.randomUUID() },
        userId,
      ),
    );

    const { error } = await supabase.from("sessions").upsert(rows, { onConflict: "id" });
    if (!error) {
      window.localStorage.setItem(MIGRATED_KEY, "done");
    }
  } catch {
    // 이전에 실패해도 앱 사용은 막지 않는다.
  }
}

async function load() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await migrateLegacyRecords(user.id);

  const { data, error } = await supabase
    .from("sessions")
    .select("id, track, member_name, role, closed_at, grade, payload")
    .order("closed_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(MAX_RECORDS);

  if (error || !data) return;

  cache = (data as SessionRow[]).map(rowToRecord);
  emit();
}

function ensureLoaded() {
  if (!loadPromise) loadPromise = load();
  return loadPromise;
}

export function subscribeSessions(listener: () => void) {
  listeners.add(listener);
  void ensureLoaded();
  return () => {
    listeners.delete(listener);
  };
}

export function getSessions(): SessionRecord[] {
  return cache;
}

// 서버 렌더링 시점에는 브라우저 저장소도 세션도 없으므로 항상 같은 빈 배열을 돌려준다.
export function getSessionsOnServer(): SessionRecord[] {
  return EMPTY;
}

export async function saveSession(record: SessionRecord) {
  const previous = cache;
  // 저장 결과를 기다리지 않고 먼저 화면에 반영한다.
  cache = [record, ...cache.filter((item) => item.id !== record.id)].slice(0, MAX_RECORDS);
  emit();

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("no session");

    const { error } = await supabase
      .from("sessions")
      .upsert(recordToRow(record, user.id), { onConflict: "id" });
    if (error) throw error;
  } catch {
    cache = previous;
    emit();
  }
}

export async function removeSession(id: string) {
  const previous = cache;
  cache = cache.filter((item) => item.id !== id);
  emit();

  try {
    const supabase = createClient();
    const { error } = await supabase.from("sessions").delete().eq("id", id);
    if (error) throw error;
  } catch {
    cache = previous;
    emit();
  }
}

// 리더 이름은 로그인 정보에서 가져오지만, 비어 있을 때를 위해 브라우저 값도 유지한다.
export function getLeaderName(): string {
  try {
    return window.localStorage.getItem(LEADER_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveLeaderName(name: string) {
  try {
    if (name.trim()) window.localStorage.setItem(LEADER_KEY, name.trim());
  } catch {
    // 무시
  }
}
