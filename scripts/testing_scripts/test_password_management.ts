import assert from "node:assert";
import { db } from "../../src/prisma/db";
import { cookies } from "next/headers";
import { createGroupRecord, sha256 } from "./nonserver_password_management";

async function main() {
  console.log("script started");
  const { groupId, joinCode, token } = await createGroupRecord("Test Host");

  const group = await db.orm.public.Group.where({ id: groupId }).first();
  assert(group, "group row missing");
  assert.equal(group.password, joinCode);

  const host = await db.orm.public.Member
    .where({ sessionTokenHash: sha256(token) }).first();
  assert(host, "host member missing");
  assert.equal(host.isHost, true);
  assert.equal(host.groupId, groupId);

  console.log("✅ createGroup works", { groupId, joinCode });

  // cleanup: members should cascade-delete with the group
  await db.orm.public.Group.where({ id: groupId }).delete();
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error("❌", e); process.exit(1); });