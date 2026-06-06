// Automated backend tests for:
//   - add_savings_funds RPC
//   - block_savings_amount_writes trigger
//   - process_companion_xp daily caps (count / FXP / BXP)
//   - daily cap reset window (Europe/Rome midnight)
//
// Run with:  supabase--test_edge_functions { "functions": ["security-tests"] }
//
// Requires env: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY,
//               SUPABASE_SERVICE_ROLE_KEY (auto-injected in edge runtime).

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import {
  assertEquals,
  assertExists,
  assert,
  assertRejects,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL =
  Deno.env.get("VITE_SUPABASE_URL") || Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY =
  Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ||
  Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_KEY) {
  throw new Error(
    "Missing env: need VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SERVICE_ROLE_KEY",
  );
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type TestUser = {
  id: string;
  email: string;
  password: string;
  client: SupabaseClient;
};

async function createTestUser(label: string): Promise<TestUser> {
  const email = `wm-test-${label}-${crypto.randomUUID()}@example.invalid`;
  const password = `Pw!${crypto.randomUUID()}`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: `T-${label}` },
  });
  if (error || !data.user) throw error ?? new Error("createUser failed");
  const id = data.user.id;

  // Ensure profile + companion bootstrap exists (handle_new_user trigger should do it)
  await admin.from("profiles").upsert(
    { user_id: id, display_name: `T-${label}` },
    { onConflict: "user_id" },
  );
  await admin.from("companion_animals").upsert(
    { user_id: id, name: "Pippo" },
    { onConflict: "user_id" },
  );

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: signInErr } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (signInErr) throw signInErr;
  return { id, email, password, client };
}

async function deleteTestUser(u: TestUser) {
  try {
    await admin.auth.admin.deleteUser(u.id);
  } catch {
    /* best-effort */
  }
}

async function createGoal(u: TestUser, target: number): Promise<string> {
  // Use service role to bypass tier limits for tests
  const { data, error } = await admin
    .from("savings_goals")
    .insert({
      user_id: u.id,
      name: `Goal-${crypto.randomUUID().slice(0, 8)}`,
      emoji: "🎯",
      target_amount: target,
      current_amount: 0,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

// =========================================================
// add_savings_funds — RPC behavior
// =========================================================
Deno.test("add_savings_funds: happy path increments and persists", async () => {
  const u = await createTestUser("add-happy");
  try {
    const goalId = await createGoal(u, 100);
    const { data, error } = await u.client.rpc("add_savings_funds", {
      p_goal_id: goalId,
      p_amount: 25,
    });
    assertEquals(error, null);
    assertEquals((data as any).status, "ok");
    assertEquals(Number((data as any).new_amount), 25);
    assertEquals((data as any).is_completed, false);

    const { data: row } = await admin
      .from("savings_goals")
      .select("current_amount, is_completed")
      .eq("id", goalId)
      .single();
    assertEquals(Number(row?.current_amount), 25);
    assertEquals(row?.is_completed, false);
  } finally {
    await deleteTestUser(u);
  }
});

Deno.test("add_savings_funds: fractional amounts accumulate exactly", async () => {
  const u = await createTestUser("add-frac");
  try {
    const goalId = await createGoal(u, 10);
    for (const v of [0.5, 1.25, 0.01]) {
      const { error } = await u.client.rpc("add_savings_funds", {
        p_goal_id: goalId,
        p_amount: v,
      });
      assertEquals(error, null);
    }
    const { data: row } = await admin
      .from("savings_goals")
      .select("current_amount")
      .eq("id", goalId)
      .single();
    assertEquals(Number(row?.current_amount), 1.76);
  } finally {
    await deleteTestUser(u);
  }
});

Deno.test("add_savings_funds: marks completed when target reached", async () => {
  const u = await createTestUser("add-complete");
  try {
    const goalId = await createGoal(u, 50);
    const { data } = await u.client.rpc("add_savings_funds", {
      p_goal_id: goalId,
      p_amount: 75,
    });
    assertEquals((data as any).is_completed, true);
    assertEquals(Number((data as any).new_amount), 75);
  } finally {
    await deleteTestUser(u);
  }
});

Deno.test("add_savings_funds: rejects zero, negative and > 1,000,000", async () => {
  const u = await createTestUser("add-bounds");
  try {
    const goalId = await createGoal(u, 100);
    for (const bad of [0, -1, -0.01, 1_000_001]) {
      const { error } = await u.client.rpc("add_savings_funds", {
        p_goal_id: goalId,
        p_amount: bad,
      });
      assertExists(error, `expected rejection for amount=${bad}`);
    }
  } finally {
    await deleteTestUser(u);
  }
});

Deno.test("add_savings_funds: rejects another user's goal", async () => {
  const a = await createTestUser("add-owner-a");
  const b = await createTestUser("add-owner-b");
  try {
    const goalA = await createGoal(a, 100);
    const { error } = await b.client.rpc("add_savings_funds", {
      p_goal_id: goalA,
      p_amount: 10,
    });
    assertExists(error);
  } finally {
    await deleteTestUser(a);
    await deleteTestUser(b);
  }
});

// =========================================================
// block_savings_amount_writes — trigger
// =========================================================
Deno.test("trigger: direct UPDATE of current_amount is blocked for authenticated", async () => {
  const u = await createTestUser("trg-amount");
  try {
    const goalId = await createGoal(u, 100);
    const { error } = await u.client
      .from("savings_goals")
      .update({ current_amount: 9999 })
      .eq("id", goalId);
    assertExists(error);
  } finally {
    await deleteTestUser(u);
  }
});

Deno.test("trigger: direct UPDATE of is_completed is blocked for authenticated", async () => {
  const u = await createTestUser("trg-complete");
  try {
    const goalId = await createGoal(u, 100);
    const { error } = await u.client
      .from("savings_goals")
      .update({ is_completed: true })
      .eq("id", goalId);
    assertExists(error);
  } finally {
    await deleteTestUser(u);
  }
});

Deno.test("trigger: cosmetic UPDATEs (name/emoji) still allowed", async () => {
  const u = await createTestUser("trg-cosmetic");
  try {
    const goalId = await createGoal(u, 100);
    const { error } = await u.client
      .from("savings_goals")
      .update({ name: "Renamed", emoji: "🚀" })
      .eq("id", goalId);
    assertEquals(error, null);
  } finally {
    await deleteTestUser(u);
  }
});

// =========================================================
// process_companion_xp — daily caps
// =========================================================
async function seedXpAuditEvents(
  userId: string,
  count: number,
  fxpEach: number,
  bxpEach: number,
  whenISO?: string,
) {
  const rows = Array.from({ length: count }, () => ({
    user_id: userId,
    action: "xp_granted",
    payload: { fxp_delta: fxpEach, bxp_delta: bxpEach },
    ...(whenISO ? { created_at: whenISO } : {}),
  }));
  const { error } = await admin.from("security_audit_log").insert(rows);
  if (error) throw error;
}

Deno.test("xp cap: under daily call/FXP/BXP caps succeeds", async () => {
  const u = await createTestUser("xp-under");
  try {
    const { data, error } = await u.client.rpc("process_companion_xp", {
      p_fxp_delta: 10,
      p_bxp_delta: 5,
    });
    assertEquals(error, null);
    assertEquals((data as any).status, "ok");
  } finally {
    await deleteTestUser(u);
  }
});

Deno.test("xp cap: 60-calls/day cap rejects the 61st call", async () => {
  const u = await createTestUser("xp-calls");
  try {
    // Pre-seed 60 events so cap is exactly hit
    await seedXpAuditEvents(u.id, 60, 0, 0);
    const { error } = await u.client.rpc("process_companion_xp", {
      p_fxp_delta: 1,
      p_bxp_delta: 0,
    });
    assertExists(error);
    assert(/Limite giornaliero XP/i.test(error!.message));
  } finally {
    await deleteTestUser(u);
  }
});

Deno.test("xp cap: FXP sum cap (1500) rejects the request that would exceed it", async () => {
  const u = await createTestUser("xp-fxp-sum");
  try {
    // Seed 1490 FXP across a few events (well under 60 calls)
    await seedXpAuditEvents(u.id, 3, 500, 0); // 1500 already
    const { error } = await u.client.rpc("process_companion_xp", {
      p_fxp_delta: 1,
      p_bxp_delta: 0,
    });
    assertExists(error);
    assert(/FXP|XP/i.test(error!.message));
  } finally {
    await deleteTestUser(u);
  }
});

Deno.test("xp cap: BXP sum cap (600) rejects the request that would exceed it", async () => {
  const u = await createTestUser("xp-bxp-sum");
  try {
    await seedXpAuditEvents(u.id, 3, 0, 200); // 600 already
    const { error } = await u.client.rpc("process_companion_xp", {
      p_fxp_delta: 0,
      p_bxp_delta: 1,
    });
    assertExists(error);
    assert(/BXP|XP/i.test(error!.message));
  } finally {
    await deleteTestUser(u);
  }
});

Deno.test("xp cap: input range validation (fxp>500 / bxp>200) still enforced", async () => {
  const u = await createTestUser("xp-range");
  try {
    let r = await u.client.rpc("process_companion_xp", {
      p_fxp_delta: 501,
      p_bxp_delta: 0,
    });
    assertExists(r.error);
    r = await u.client.rpc("process_companion_xp", {
      p_fxp_delta: 0,
      p_bxp_delta: 201,
    });
    assertExists(r.error);
    r = await u.client.rpc("process_companion_xp", {
      p_fxp_delta: -1,
      p_bxp_delta: 0,
    });
    assertExists(r.error);
  } finally {
    await deleteTestUser(u);
  }
});

// =========================================================
// Daily cap reset window (Europe/Rome midnight)
// =========================================================
Deno.test("xp cap reset: events from BEFORE today's Europe/Rome midnight are not counted", async () => {
  const u = await createTestUser("xp-reset-before");
  try {
    // Compute "yesterday 23:59 Europe/Rome" as timestamptz
    const { data: tsBefore } = await admin.rpc("noop_marker" as any).then(
      () => ({ data: null }),
      () => ({ data: null }),
    );
    // Use SQL to compute the boundary minus 1 second
    const { data: rows } = await admin
      .from("security_audit_log")
      .select("id")
      .limit(1); // warm up
    void rows;

    // Insert via raw SQL via a service-role rpc isn't available; use a direct
    // insert with a computed created_at from the client side using "yesterday".
    // We compute (today Rome midnight - 1 second) in JS:
    const nowRome = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" }),
    );
    const todayMidnightRomeLocal = new Date(
      nowRome.getFullYear(),
      nowRome.getMonth(),
      nowRome.getDate(),
      0,
      0,
      0,
      0,
    );
    // Convert that local Rome timestamp to absolute UTC by reusing the offset
    const offsetMin =
      (new Date().getTime() -
        new Date(
          new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" }),
        ).getTime()) /
      60000;
    const todayMidnightRomeUTC = new Date(
      todayMidnightRomeLocal.getTime() + offsetMin * 60_000,
    );
    const justBefore = new Date(todayMidnightRomeUTC.getTime() - 1_000);

    // Seed 100 huge xp_granted events BEFORE today's Rome midnight — should not count
    await seedXpAuditEvents(u.id, 100, 500, 200, justBefore.toISOString());

    const { data, error } = await u.client.rpc("process_companion_xp", {
      p_fxp_delta: 1,
      p_bxp_delta: 1,
    });
    assertEquals(error, null, `unexpected: ${error?.message}`);
    assertEquals((data as any).status, "ok");
  } finally {
    await deleteTestUser(u);
  }
});

Deno.test("xp cap reset: events from AFTER today's Europe/Rome midnight are counted", async () => {
  const u = await createTestUser("xp-reset-after");
  try {
    // Use "now" — guaranteed to be after today's Rome midnight
    await seedXpAuditEvents(u.id, 60, 0, 0); // exactly fills call cap (today)
    const { error } = await u.client.rpc("process_companion_xp", {
      p_fxp_delta: 1,
      p_bxp_delta: 0,
    });
    assertExists(error);
    assert(/Limite giornaliero/i.test(error!.message));
  } finally {
    await deleteTestUser(u);
  }
});
