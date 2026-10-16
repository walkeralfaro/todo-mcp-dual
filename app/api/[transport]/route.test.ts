import { describe, expect, it } from "vitest";
import { GET, POST } from "./route";

async function rpc(method: string, params: unknown = {}) {
  const req = new Request("http://localhost/api/mcp", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const res = await POST(req);
  const text = await res.text();
  const json = text
    .split("\n")
    .map((l) => l.replace(/^data:\s*/, "").trim())
    .filter((l) => l.startsWith("{"))
    .map((l) => JSON.parse(l));
  return { status: res.status, events: json };
}

describe("MCP route handler", () => {
  it("tools/list descubre las 5 tools", async () => {
    const { status, events } = await rpc("tools/list");
    expect(status).toBe(200);
    const names = events
      .flatMap((e) => e.result?.tools ?? [])
      .map((t: { name: string }) => t.name)
      .sort();
    expect(names).toEqual(["create_task", "delete_task", "get_task", "list_tasks", "update_task"]);
  });

  it("GET responde sin error de método", async () => {
    const res = await GET(new Request("http://localhost/api/mcp", { method: "GET" }));
    expect([200, 400, 405]).toContain(res.status);
  });
});
