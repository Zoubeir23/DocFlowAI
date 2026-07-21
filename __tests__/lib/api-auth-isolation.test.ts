import { describe, it, expect, vi, beforeEach } from "vitest";

// Table api_keys simulée en mémoire : deux cliniques distinctes, une clé
// expirée et une clé désactivée pour vérifier chaque garde-fou de
// validateApiKey() sans dépendre d'une instance Supabase réelle.
interface FakeApiKeyRow {
  id: string;
  clinic_id: string;
  key_hash: string;
  is_active: boolean;
  expires_at: string | null;
}

let fakeRows: FakeApiKeyRow[] = [];

function createFakeAdminClient() {
  const state: { filters: Record<string, unknown> } = { filters: {} };

  // Chaîne dédiée à update(...).eq(...).then(...) (fire-and-forget dans le
  // code de production) : distincte du builder principal pour ne jamais le
  // rendre "thenable" lui-même, sinon `await createAdminClient()` le
  // déballerait automatiquement (piège classique du thenable) au lieu de
  // renvoyer l'objet requêtable.
  const updateChain = {
    eq() {
      return { then: (resolve: (value: { data: null; error: null }) => void) => resolve({ data: null, error: null }) };
    },
  };

  const builder: any = {
    from() {
      state.filters = {};
      return builder;
    },
    select() {
      return builder;
    },
    update() {
      return updateChain;
    },
    eq(key: string, value: unknown) {
      state.filters[key] = value;
      return builder;
    },
    maybeSingle() {
      const match = fakeRows.find((row) =>
        Object.entries(state.filters).every(([key, value]) => (row as unknown as Record<string, unknown>)[key] === value)
      );
      return Promise.resolve({ data: match ?? null, error: null });
    },
  };

  return builder;
}

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: vi.fn(async () => createFakeAdminClient()),
}));

import { validateApiKey, hashApiKey } from "@/lib/api-auth";

const RAW_KEY_CLINIC_A = "dfk_clinic_a_raw_key";
const RAW_KEY_CLINIC_B = "dfk_clinic_b_raw_key";
const RAW_KEY_EXPIRED = "dfk_expired_raw_key";
const RAW_KEY_REVOKED = "dfk_revoked_raw_key";

describe("validateApiKey — isolation multi-tenant", () => {
  beforeEach(() => {
    fakeRows = [
      {
        id: "key-a",
        clinic_id: "clinic-a",
        key_hash: hashApiKey(RAW_KEY_CLINIC_A),
        is_active: true,
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
      },
      {
        id: "key-b",
        clinic_id: "clinic-b",
        key_hash: hashApiKey(RAW_KEY_CLINIC_B),
        is_active: true,
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
      },
      {
        id: "key-expired",
        clinic_id: "clinic-a",
        key_hash: hashApiKey(RAW_KEY_EXPIRED),
        is_active: true,
        expires_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      },
      {
        id: "key-revoked",
        clinic_id: "clinic-a",
        key_hash: hashApiKey(RAW_KEY_REVOKED),
        is_active: false,
        expires_at: null,
      },
    ];
  });

  it("résout la clé de la clinique A vers clinic-a, jamais vers une autre clinique", async () => {
    const ctx = await validateApiKey(RAW_KEY_CLINIC_A);
    expect(ctx).not.toBeNull();
    expect(ctx?.clinicId).toBe("clinic-a");
  });

  it("résout la clé de la clinique B vers clinic-b, jamais vers clinic-a", async () => {
    const ctx = await validateApiKey(RAW_KEY_CLINIC_B);
    expect(ctx).not.toBeNull();
    expect(ctx?.clinicId).toBe("clinic-b");
    expect(ctx?.clinicId).not.toBe("clinic-a");
  });

  it("rejette une clé qui ne correspond à aucun hash connu", async () => {
    const ctx = await validateApiKey("dfk_totally_unknown_key");
    expect(ctx).toBeNull();
  });

  it("rejette une clé expirée même si is_active=true", async () => {
    const ctx = await validateApiKey(RAW_KEY_EXPIRED);
    expect(ctx).toBeNull();
  });

  it("rejette une clé révoquée (is_active=false)", async () => {
    const ctx = await validateApiKey(RAW_KEY_REVOKED);
    expect(ctx).toBeNull();
  });

  it("rejette une entrée vide/nulle sans interroger la base", async () => {
    expect(await validateApiKey(null)).toBeNull();
    expect(await validateApiKey("")).toBeNull();
  });

  it("deux clés de deux cliniques différentes ne produisent jamais le même clinicId", async () => {
    const ctxA = await validateApiKey(RAW_KEY_CLINIC_A);
    const ctxB = await validateApiKey(RAW_KEY_CLINIC_B);
    expect(ctxA?.clinicId).not.toBe(ctxB?.clinicId);
  });
});
