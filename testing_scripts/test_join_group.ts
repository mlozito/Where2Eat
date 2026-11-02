import assert from "node:assert";
import { db } from "../src/prisma/db";
import {
  createGroupRecord,
  joinGroupRecord,
  findMemberByToken,
  sha256,
} from "../src/prisma/server/group";

console.log("file loaded")

async function main() {
  console.log("script started");

  const created = await createGroupRecord("Test Host");
  const { groupId, inviteCode } = created;

  try {
    // 1. Valid join works
    const joined = await joinGroupRecord(inviteCode, "Alice");
    assert(joined.ok, "valid join should succeed");
    assert.equal(joined.groupId, groupId);

    const alice = await db.orm.public.Member
      .where({ sessionTokenHash: sha256(joined.token) }).first();
    assert(alice, "member row missing");
    assert.equal(alice.displayName, "Alice");
    assert.equal(alice.isHost, false);
    assert.equal(alice.groupId, groupId);

    // 2. Lowercase and padded codes are normalized
    const sloppy = await joinGroupRecord(`  ${inviteCode.toLowerCase()} `, "Bob");
    assert(sloppy.ok, "lowercase/padded code should still work");

    // 3. Wrong code is rejected
    const wrong = await joinGroupRecord("ZZZZZZ", "Carol");
    assert(!wrong.ok && wrong.error === "NOT_FOUND", "wrong code should be NOT_FOUND");

    // 4. Duplicate name in the same group is rejected
    const dup = await joinGroupRecord(inviteCode, "Alice");
    assert(!dup.ok && dup.error === "NAME_TAKEN", "duplicate name should be NAME_TAKEN");

    // 5. Host's token resolves to the host; garbage token resolves to nothing
    const host = await findMemberByToken(created.token);
    assert(host?.isHost === true, "host token should resolve to the host");
    const nobody = await findMemberByToken("not-a-real-token");
    assert(!nobody, "garbage token should not resolve");

    console.log("✅ create + join all checks passed", { groupId, inviteCode });
  } finally {
    // Cleanup: members should cascade-delete with the group
    await db.orm.public.Group.where({ id: groupId }).delete();
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error("❌", e); process.exit(1); });