"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

// A front-end-only stand-in for a real group until the database is wired up.
// Everything lives in sessionStorage. The other members are pretend people
// who "finish" on timers, so the whole flow can be tried out by one person.

export type Preferences = {
  minPrice: number;
  maxPrice: number;
  minDistance: number;
  maxDistance: number;
  startTime: string;
  endTime: string;
  cuisines: string[];
  dietaryRestrictions: string[];
  otherDietary: string;
  needsRide: boolean;
};

// Every detail except the name is optional. Anything left blank is
// skipped when checking whether a restaurant fits someone's preferences.
export type Restaurant = {
  id: string;
  name: string;
  cuisine?: string;
  price?: number;
  distance?: number;
  dietary?: string[];
};

export type Member = {
  id: string;
  name: string;
  isHost: boolean;
  preferences: Preferences;
  suggestion: Restaurant | null;
  vote: string | null;
  // Pretend members only: how long after each step starts they finish.
  delayMs: number;
  skipped: boolean;
};

// Matches the stages in contract.prisma's GroupStatus, roughly:
// suggesting = COLLECTING, voting/spinning = DECIDING/TIE_BREAK, done = COMPLETE.
export type Stage = "suggesting" | "voting" | "spinning" | "done";

// Matches ResultMethod in contract.prisma.
export type ResultMethod = "VOTE" | "RANDOM" | "TIE_RANDOM";

export type DemoGroup = {
  meId: string;
  viewAsGuest: boolean;
  stage: Stage;
  members: Member[];
  suggestStartedAt: number;
  voteStartedAt: number | null;
  options: string[];
  optionsNote: string;
  wheelOptions: string[];
  isTieBreak: boolean;
  result: { restaurantId: string; method: ResultMethod } | null;
};

export const popularCuisines = [
  "Italian",
  "Indian",
  "Mexican",
  "Japanese",
  "Chinese",
  "Thai",
  "American",
  "Mediterranean",
  "Korean",
  "Greek",
  "Vietnamese",
  "Middle Eastern",
];

// Same list as the preferences page, minus "Other" (free text can't be matched).
export const dietaryOptions = [
  "Vegetarian",
  "Vegan",
  "Halal",
  "Kosher",
  "Gluten-Free",
  "Dairy-Free",
  "Nut Allergy",
  "Shellfish Allergy",
];

const GROUP_KEY = "where2eat-demo-group";
const PREFERENCES_KEY = "where2eat-preferences";
const ME = "me";

function anyPreferences(overrides: Partial<Preferences>): Preferences {
  return {
    minPrice: 0,
    maxPrice: 100,
    minDistance: 0,
    maxDistance: 50,
    startTime: "18:00",
    endTime: "21:00",
    cuisines: [],
    dietaryRestrictions: [],
    otherDietary: "",
    needsRide: false,
    ...overrides,
  };
}

function pretendMembers(): Member[] {
  return [
    {
      id: "alex",
      name: "Alex",
      isHost: false,
      preferences: anyPreferences({
        minPrice: 10,
        maxPrice: 30,
        maxDistance: 10,
        cuisines: ["Italian", "Mexican"],
        dietaryRestrictions: ["Vegetarian"],
      }),
      suggestion: {
        id: "alex-pick",
        name: "Luigi's Trattoria",
        cuisine: "Italian",
        price: 22,
        distance: 3,
        dietary: ["Vegetarian", "Gluten-Free"],
      },
      vote: null,
      delayMs: 3000,
      skipped: false,
    },
    {
      id: "jordan",
      name: "Jordan",
      isHost: false,
      preferences: anyPreferences({ minPrice: 15, maxPrice: 40, maxDistance: 15 }),
      // No dietary info given, so dietary checks are skipped for this one.
      suggestion: {
        id: "jordan-pick",
        name: "Taco Haus",
        cuisine: "Mexican",
        price: 16,
        distance: 2,
      },
      vote: null,
      delayMs: 7000,
      skipped: false,
    },
    {
      // Deliberately slow, so the host's "continue without them" can be tried.
      id: "sam",
      name: "Sam",
      isHost: false,
      preferences: anyPreferences({
        maxDistance: 20,
        cuisines: ["Japanese", "Italian", "Mexican"],
        dietaryRestrictions: ["Gluten-Free"],
      }),
      // No distance given, so distance is skipped for this one.
      suggestion: {
        id: "sam-pick",
        name: "Sakura Ramen",
        cuisine: "Japanese",
        price: 18,
      },
      vote: null,
      delayMs: 30000,
      skipped: false,
    },
  ];
}

// ---------- storage ----------

// sessionStorage, plus a copy in memory in case storage is blocked.
const memory = new Map<string, string | null>();
const listeners = new Set<() => void>();

function readStored(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return memory.get(key) ?? null;
  }
}

function writeStored(key: string, value: string | null) {
  memory.set(key, value);
  try {
    if (value === null) {
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.setItem(key, value);
    }
  } catch {
    // Storage blocked: the in-memory copy keeps the demo going until a reload.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Undefined while the page renders on the server, where sessionStorage doesn't exist.
function useStored(key: string) {
  return useSyncExternalStore(subscribe, () => readStored(key), () => undefined);
}

function parse<T>(text: string | null | undefined): T | null {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// What the preferences page saved.
export function useMyPreferences() {
  const saved = useStored(PREFERENCES_KEY);
  const preferences = useMemo(() => {
    const parsed = parse<Partial<Preferences>>(saved);
    return parsed ? anyPreferences(parsed) : null;
  }, [saved]);
  return { preferences, loaded: saved !== undefined };
}

// The group, plus a clock that ticks every half second so pretend members
// "finish" while you watch.
export function useDemoGroup() {
  const saved = useStored(GROUP_KEY);
  const group = useMemo(() => parse<DemoGroup>(saved), [saved]);
  const [now, setNow] = useState(0);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 500);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, []);

  function update(change: (current: DemoGroup) => DemoGroup) {
    if (!group) return;
    writeStored(GROUP_KEY, JSON.stringify(change(group)));
  }

  function replace(next: DemoGroup | null) {
    writeStored(GROUP_KEY, next ? JSON.stringify(next) : null);
  }

  return { group, loaded: saved !== undefined, now, update, replace };
}

export function createGroup(preferences: Preferences, suggestion: Restaurant): DemoGroup {
  return {
    meId: ME,
    viewAsGuest: false,
    stage: "suggesting",
    members: [
      {
        id: ME,
        name: "You",
        isHost: true,
        preferences,
        suggestion,
        vote: null,
        delayMs: 0,
        skipped: false,
      },
      ...pretendMembers(),
    ],
    suggestStartedAt: Date.now(),
    voteStartedAt: null,
    options: [],
    optionsNote: "",
    wheelOptions: [],
    isTieBreak: false,
    result: null,
  };
}

// ---------- who's finished ----------

export function activeMembers(group: DemoGroup) {
  return group.members.filter((member) => !member.skipped);
}

export function hasSuggested(group: DemoGroup, member: Member, now: number) {
  if (member.id === group.meId) return member.suggestion !== null;
  return now >= group.suggestStartedAt + member.delayMs;
}

export function hasVoted(group: DemoGroup, member: Member, now: number) {
  if (member.id === group.meId) return member.vote !== null;
  if (group.voteStartedAt === null) return false;
  // Pretend members vote a bit faster than they suggest.
  return now >= group.voteStartedAt + member.delayMs * 0.6;
}

export function allRestaurants(group: DemoGroup): Restaurant[] {
  return activeMembers(group)
    .map((member) => member.suggestion)
    .filter((restaurant): restaurant is Restaurant => restaurant !== null);
}

export function findRestaurant(group: DemoGroup, id: string) {
  return group.members.find((member) => member.suggestion?.id === id)?.suggestion ?? null;
}

// ---------- matching ----------

// Price, distance and cuisine. Blank restaurant details are skipped.
function fitsMember(restaurant: Restaurant, preferences: Preferences) {
  if (
    restaurant.price !== undefined &&
    (restaurant.price < preferences.minPrice || restaurant.price > preferences.maxPrice)
  ) {
    return false;
  }

  if (
    restaurant.distance !== undefined &&
    (restaurant.distance < preferences.minDistance ||
      restaurant.distance > preferences.maxDistance)
  ) {
    return false;
  }

  if (restaurant.cuisine && preferences.cuisines.length > 0) {
    const cuisine = restaurant.cuisine.toLowerCase();
    if (!preferences.cuisines.some((item) => item.toLowerCase() === cuisine)) {
      return false;
    }
  }

  return true;
}

// Dietary needs are a hard rule. If nobody said which diets the restaurant
// handles, it's skipped (treated as safe), like any other blank detail.
function isDietSafe(restaurant: Restaurant, members: Member[]) {
  if (!restaurant.dietary || restaurant.dietary.length === 0) return true;
  return members.every((member) =>
    member.preferences.dietaryRestrictions
      .filter((restriction) => restriction !== "Other")
      .every((restriction) => restaurant.dietary!.includes(restriction)),
  );
}

export function fitCount(group: DemoGroup, restaurant: Restaurant) {
  return activeMembers(group).filter((member) => fitsMember(restaurant, member.preferences))
    .length;
}

// Restaurants that fit everyone. If none do, every diet-safe restaurant,
// ranked by how many people it fits. If none are diet-safe either,
// every restaurant goes out there.
export function pickOptions(group: DemoGroup): { options: string[]; note: string } {
  const members = activeMembers(group);
  const restaurants = allRestaurants(group);
  const ranked = (list: Restaurant[]) =>
    [...list].sort((a, b) => fitCount(group, b) - fitCount(group, a)).map((r) => r.id);

  const safe = restaurants.filter((restaurant) => isDietSafe(restaurant, members));
  const fitsEveryone = safe.filter((restaurant) => fitCount(group, restaurant) === members.length);

  if (fitsEveryone.length > 0) {
    return { options: fitsEveryone.map((r) => r.id), note: "These fit everyone's preferences." };
  }
  if (safe.length > 0) {
    return {
      options: ranked(safe),
      note: "Nothing fits everyone, so here's every option that works with everyone's dietary needs, best fit first.",
    };
  }
  return {
    options: ranked(restaurants),
    note: "Nothing fits everyone, so all the restaurants are in. Double-check dietary needs before you go!",
  };
}

// The pretend members' votes: their own pick if it's in the running,
// otherwise the first option that fits them.
export function pretendVote(group: DemoGroup, member: Member) {
  if (member.suggestion && group.options.includes(member.suggestion.id)) {
    return member.suggestion.id;
  }
  const fitting = group.options.find((id) => {
    const restaurant = findRestaurant(group, id);
    return restaurant && fitsMember(restaurant, member.preferences);
  });
  return fitting ?? group.options[0];
}

export function tallyVotes(group: DemoGroup) {
  const counts = new Map<string, number>(group.options.map((id) => [id, 0]));
  for (const member of activeMembers(group)) {
    if (member.vote) counts.set(member.vote, (counts.get(member.vote) ?? 0) + 1);
  }
  return counts;
}
