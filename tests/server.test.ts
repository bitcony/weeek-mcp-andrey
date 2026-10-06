import { describe, it, expect } from "vitest";
import { buildServer } from "../src/server.js";

describe("buildServer", () => {
  it("builds a server without throwing given a valid config", () => {
    const server = buildServer({ token: "t".repeat(24), baseUrl: "https://api.weeek.net/public/v1", timeoutMs: 30000 });
    expect(server).toBeTruthy();
    const tools = (server as any)._registeredTools;
    expect(tools).toHaveProperty('weeek_set_task_parent');
    expect(tools).toHaveProperty('weeek_set_deal_status');
  });
});
