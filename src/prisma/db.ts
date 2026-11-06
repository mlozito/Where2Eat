import 'dotenv/config';
import postgres from '@prisma/orm-postgres/runtime';
import { contractFromJson } from '@prisma/orm-postgres/static';
import type { Contract } from './contract.d';
import contractJson from './contract.json' with { type: 'json' };

export const contract = contractFromJson<Contract>(contractJson);

// reuse one client across Next.js dev hot reloads so connection doesn't time out
const globalForDb = globalThis as unknown as {
    db?: ReturnType<typeof postgres<Contract>>;
};

export const db =
  globalForDb.db ??           
  postgres({
    contract,
    url: process.env['DATABASE_URL']!,
  });

if (process.env.NODE_ENV !== 'production') globalForDb.db = db;  