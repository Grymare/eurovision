import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import type { PartyState } from "@/lib/party/constants";

export const appMeta = sqliteTable("app_meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const parties = sqliteTable(
  "parties",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    title: text("title"),
    state: text("state").$type<PartyState>().notNull().default("draft"),
    hostSessionToken: text("host_session_token").notNull(),
    hostParticipantId: text("host_participant_id"),
    revealOrderJson: text("reveal_order_json"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    uniqueIndex("parties_code_unique").on(table.code),
    uniqueIndex("parties_host_session_token_unique").on(table.hostSessionToken),
    index("parties_state_idx").on(table.state),
  ],
);

export const partyEntries = sqliteTable(
  "party_entries",
  {
    id: text("id").primaryKey(),
    partyId: text("party_id")
      .notNull()
      .references(() => parties.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    flagEmoji: text("flag_emoji").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [index("party_entries_party_id_idx").on(table.partyId)],
);

export const participants = sqliteTable(
  "participants",
  {
    id: text("id").primaryKey(),
    partyId: text("party_id")
      .notNull()
      .references(() => parties.id, { onDelete: "cascade" }),
    nickname: text("nickname").notNull(),
    sessionToken: text("session_token").notNull(),
    isHost: integer("is_host", { mode: "boolean" }).notNull().default(false),
    hasVoted: integer("has_voted", { mode: "boolean" }).notNull().default(false),
    joinedAt: text("joined_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    uniqueIndex("participants_session_token_unique").on(table.sessionToken),
    uniqueIndex("participants_party_nickname_unique").on(
      table.partyId,
      table.nickname,
    ),
    index("participants_party_id_idx").on(table.partyId),
  ],
);

export type VoteAllocations = Record<string, number>;

export const votes = sqliteTable(
  "votes",
  {
    id: text("id").primaryKey(),
    partyId: text("party_id")
      .notNull()
      .references(() => parties.id, { onDelete: "cascade" }),
    participantId: text("participant_id")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    allocationsJson: text("allocations_json").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    uniqueIndex("votes_party_participant_unique").on(
      table.partyId,
      table.participantId,
    ),
    index("votes_party_id_idx").on(table.partyId),
  ],
);

export const partyResults = sqliteTable(
  "party_results",
  {
    id: text("id").primaryKey(),
    partyId: text("party_id")
      .notNull()
      .references(() => parties.id, { onDelete: "cascade" }),
    scoreboardJson: text("scoreboard_json").notNull(),
    computedAt: text("computed_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [uniqueIndex("party_results_party_id_unique").on(table.partyId)],
);

export type Party = typeof parties.$inferSelect;
export type PartyEntry = typeof partyEntries.$inferSelect;
export type Participant = typeof participants.$inferSelect;
export type Vote = typeof votes.$inferSelect;
export type PartyResult = typeof partyResults.$inferSelect;
export type AppMeta = typeof appMeta.$inferSelect;
