import { db } from "../../../prisma/db";
import type { PreferenceInput } from "../../shared/preferenceSchemas";
import { isUniqueViolation } from "../../lib/dbErrors";
import { ConflictError, NotFoundError } from "../../lib/errors";
import type { MemberPreference } from "./matching";

async function getGroup(groupId: string) {
  const group = await db.orm.public.Group.where({ id: groupId }).first();
  if (!group) throw new NotFoundError("Group not found");
  return group;
}

function toStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}
function toNumbers(value: unknown): number[] {
  return Array.isArray(value) ? value.filter((v): v is number => typeof v === "number") : [];
}

// The host picks where to search.
export async function setGroupLocation(groupId: string, location: string) {
  const group = await getGroup(groupId);
  if (group.status !== "LOBBY" && group.status !== "COLLECTING") {
    throw new ConflictError("The location can no longer be changed");
  }
  await db.orm.public.Group.where({ id: groupId }).update({ location });
  return { location };
}

// A member saves (or replaces) their own preferences.
export async function savePreference(groupId: string, memberId: string, input: PreferenceInput) {
  const group = await getGroup(groupId);
  if (group.model !== "PREFERENCE") {
    throw new ConflictError("This group is not using preference mode");
  }
  if (group.status !== "LOBBY" && group.status !== "COLLECTING") {
    throw new ConflictError("Preferences can no longer be changed");
  }

    const values = {
    cuisines: input.cuisines ?? [],
    dietaryRestrictions: input.dietaryRestrictions ?? [],
    // "up to $$" becomes [1, 2]; no choice means no price limit
    priceLevels: input.maxPriceLevel
      ? Array.from({ length: input.maxPriceLevel }, (_, i) => i + 1)
      : [],
    maxDistanceMeters: input.maxDistanceMeters ?? null,
  };

  const update = async (id: string) => {
    await db.orm.public.Preference.where({ id }).update(values);
  };

  const existing = await db.orm.public.Preference.where({ memberId }).first();
  if (existing) {
    await update(existing.id);
    return values;
  }

  try {
    await db.orm.public.Preference.create({ memberId, ...values });
  } catch (error) {
    // Two quick submits at once: the second one finds the row and updates it.
    if (!isUniqueViolation(error)) throw error;
    const created = await db.orm.public.Preference.where({ memberId }).first();
    if (!created) throw error;
    await update(created.id);
  }
  return values;
}

// Everyone's preferences, for matching. Never sent to the browser.
export async function loadGroupPreferences(groupId: string): Promise<MemberPreference[]> {
  const members = await db.orm.public.Member.where({ groupId }).all();
  const rows = await Promise.all(
    members.map((m) => db.orm.public.Preference.where({ memberId: m.id }).first()),
  );
  return rows.flatMap((row) =>
    row
      ? [{
          cuisines: toStrings(row.cuisines),
          dietaryRestrictions: toStrings(row.dietaryRestrictions),
          priceLevels: toNumbers(row.priceLevels),
          maxDistanceMeters: row.maxDistanceMeters ?? null,
        }]
      : [],
  );
}