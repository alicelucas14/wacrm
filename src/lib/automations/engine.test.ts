import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runStep } from "./engine";
import { supabaseAdmin } from "./admin-client";
import type { Automation, AutomationStep } from "@/types";

vi.mock("./admin-client", () => {
  return {
    supabaseAdmin: vi.fn(),
  };
});

describe("runStep - assign_conversation with round_robin", () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    };
    vi.mocked(supabaseAdmin).mockReturnValue(mockDb);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const baseAutomation = {
    id: "auto-1",
    user_id: "owner-id",
  } as Automation;

  const baseArgs = {
    automation: baseAutomation,
    contactId: "contact-1",
    context: {},
    parentStepId: null,
    branch: null,
    startPosition: 0,
    logId: "log-1",
    triggerEvent: "test",
  };

  it("assigns to the online agent with the fewest open/pending conversations", async () => {
    const mockProfiles = [
      { user_id: "agent-1" },
      { user_id: "agent-2" },
    ];

    mockDb.from.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockImplementation((col: string, val: any) => {
            if (col === "is_online" && val === true) {
              return Promise.resolve({ data: mockProfiles, error: null });
            }
            return Promise.resolve({ data: [], error: null });
          }),
        };
      }
      if (table === "conversations") {
        return {
          select: vi.fn().mockImplementation((fields: string, opts?: any) => {
            if (opts?.count === "exact" && opts?.head === true) {
              return {
                eq: vi.fn().mockImplementation((col: string, val: any) => {
                  return {
                    in: vi.fn().mockImplementation((inCol: string, inVals: any) => {
                      const count = val === "agent-1" ? 5 : 2;
                      return Promise.resolve({ count, error: null });
                    }),
                  };
                }),
              };
            }
            return {
              update: vi.fn().mockReturnThis(),
            };
          }),
          update: vi.fn().mockImplementation((updateData: any) => {
            return {
              eq: vi.fn().mockImplementation((col1: string, val1: any) => {
                return {
                  eq: vi.fn().mockImplementation((col2: string, val2: any) => {
                    return Promise.resolve({ error: null });
                  }),
                };
              }),
            };
          }),
        };
      }
      return mockDb;
    });

    const step = {
      step_type: "assign_conversation",
      step_config: { mode: "round_robin" },
    } as AutomationStep;

    const result = await runStep(step, baseArgs);

    expect(result).toBe("assigned to agent-2");
  });

  it("falls back to the automation owner if no profiles are online", async () => {
    mockDb.from.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockImplementation((col: string, val: any) => {
            if (col === "is_online" && val === true) {
              return Promise.resolve({ data: [], error: null });
            }
            if (col === "user_id" && val === "owner-id") {
              return {
                limit: vi.fn().mockResolvedValue({ data: [{ user_id: "owner-id" }], error: null }),
              };
            }
            return Promise.resolve({ data: [], error: null });
          }),
        };
      }
      if (table === "conversations") {
        return {
          update: vi.fn().mockImplementation(() => {
            return {
              eq: vi.fn().mockImplementation(() => {
                return {
                  eq: vi.fn().mockResolvedValue({ error: null }),
                };
              }),
            };
          }),
        };
      }
      return mockDb;
    });

    const step = {
      step_type: "assign_conversation",
      step_config: { mode: "round_robin" },
    } as AutomationStep;

    const result = await runStep(step, baseArgs);

    expect(result).toBe("assigned to owner-id");
  });
});
