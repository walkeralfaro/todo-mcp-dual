import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrisma(): PrismaClient {
  if (process.env.TURSO_DATABASE_URL) {
    // PrismaLibSQL recibe la config libsql, no un cliente ya creado.
    const adapter = new PrismaLibSQL({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return new PrismaClient({ adapter });
  }
  const url = process.env.DATABASE_URL ?? "file:../dev.db";
  return new PrismaClient({ datasourceUrl: url });
}

export const db = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export type DbClient = PrismaClient;
