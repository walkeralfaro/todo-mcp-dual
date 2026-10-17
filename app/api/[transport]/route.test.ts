import { createHash } from "node:crypto";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { POST } from "./route";
import { db } from "@/lib/db";

const TEST_TOKEN = "token-de-prueba-mcp-12345";
const TEST_TOKEN_HASH = createHash("sha256").update(TEST_TOKEN).digest("hex");
let testUserId: string;

async function authenticate(request: Request): Promise<Response> {
  const headers = new Headers(request.headers);
  headers.set("authorization", `Bearer ${TEST_TOKEN}`);
  if (request.method === "POST") {
    const body = await request.clone().json();
    return POST(new Request(request.url, {
      method: request.method,
      headers,
      body: JSON.stringify(body),
    }));
  }
  return POST(new Request(request.url, { method: request.method, headers }));
}

async function rpc(method: string, params: unknown = {}) {
  const req = new Request("http://localhost/api/mcp", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const res = await authenticate(req);
  const text = await res.text();
  const json = text
    .split("\n")
    .map((l) => l.replace(/^data:\s*/, "").trim())
    .filter((l) => l.startsWith("{"))
    .map((l) => JSON.parse(l));
  return { status: res.status, events: json };
}

beforeEach(async () => {
  await db.mcpToken.deleteMany();
  await db.task.deleteMany();
  await db.session.deleteMany();
  await db.account.deleteMany();
  await db.verification.deleteMany();
  await db.user.deleteMany();
  const user = await db.user.create({ data: { email: "usuario@prueba.test" } });
  testUserId = user.id;
  await db.mcpToken.create({
    data: { token: TEST_TOKEN_HASH, userId: testUserId, scopes: "mcp:read,mcp:write" },
  });
});

afterEach(async () => {
  await db.mcpToken.deleteMany();
  await db.task.deleteMany();
  await db.session.deleteMany();
  await db.account.deleteMany();
  await db.verification.deleteMany();
  await db.user.deleteMany();
});

describe("MCP route handler", () => {
  it("tools/list descubre las 5 tools con token válido", async () => {
    const { status, events } = await rpc("tools/list");
    expect(status).toBe(200);
    const names = events
      .flatMap((e) => e.result?.tools ?? [])
      .map((t: { name: string }) => t.name)
      .sort();
    expect(names).toEqual(["create_task", "delete_task", "get_task", "list_tasks", "update_task"]);
  });

  it("sin token devuelve 401", async () => {
    const req = new Request("http://localhost/api/mcp", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("GET responde sin error de método", async () => {
    const res = await authenticate(new Request("http://localhost/api/mcp", { method: "GET" }));
    expect([200, 400, 405]).toContain(res.status);
  });
});
