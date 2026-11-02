#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/1b9fa98a270c16300982e9bf13e9795385b51b253b67ecac94f716b2f99a6974/contract';
import endContract from '../../snapshots/1b9fa98a270c16300982e9bf13e9795385b51b253b67ecac94f716b2f99a6974/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/a51b4833fdaffe730572670ccc27dd89af7e0726ab3de7f428d21702d687cc15/contract';
import startContract from '../../snapshots/a51b4833fdaffe730572670ccc27dd89af7e0726ab3de7f428d21702d687cc15/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
  sql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropTable({ schema: 'public', table: 'Post' }),
      this.dropTable({ schema: 'public', table: 'User' }),
      this.createTable({
        schema: 'public',
        table: 'Candidate',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('groupId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('rank', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('snapshot', 'json', { notNull: true, codecRef: { codecId: 'pg/json@1' } }),
          col('source', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('suggestedByMemberId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('yelpBusinessId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'Candidate_source_check_838ca6e8',
            sql`"source" IN ('YELP', 'USER_SUGGESTED')`,
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'Group',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('decisionType', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('inviteCode', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('location', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('model', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('LOBBY'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'Group_decisionType_check_d22c67fc',
            sql`"decisionType" IN ('VOTE', 'RANDOM', 'BEST_FIT')`,
          ),
          checkExpression(
            'Group_model_check_62a39fcd',
            sql`"model" IN ('SUGGESTION', 'PREFERENCE')`,
          ),
          checkExpression(
            'Group_status_check_8b0fd461',
            sql`"status" IN ('LOBBY', 'COLLECTING', 'DECIDING', 'TIE_BREAK', 'COMPLETE')`,
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'Member',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('displayName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('groupId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('isHost', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('sessionTokenHash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Preference',
        columns: [
          col('cuisines', 'json', { codecRef: { codecId: 'pg/json@1' } }),
          col('dietaryRestrictions', 'json', { codecRef: { codecId: 'pg/json@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('maxDistanceMeters', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('memberId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('priceLevels', 'json', { codecRef: { codecId: 'pg/json@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Result',
        columns: [
          col('candidateId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('chosenAt', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('groupId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('method', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'Result_method_check_0d01645a',
            sql`"method" IN ('VOTE', 'RANDOM', 'BEST_FIT', 'TIE_RANDOM')`,
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'Round',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('groupId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('number', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('OPEN'),
            codecRef: { codecId: 'pg/text@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('Round_status_check_32214e16', sql`"status" IN ('OPEN', 'CLOSED')`),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'RoundCandidate',
        columns: [
          col('candidateId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('roundId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['roundId', 'candidateId'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Vote',
        columns: [
          col('candidateId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('memberId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('roundId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Group',
        constraint: 'Group_inviteCode_key',
        columns: ['inviteCode'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Member',
        constraint: 'Member_sessionTokenHash_key',
        columns: ['sessionTokenHash'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Member',
        constraint: 'Member_groupId_displayName_key',
        columns: ['groupId', 'displayName'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Preference',
        constraint: 'Preference_memberId_key',
        columns: ['memberId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Result',
        constraint: 'Result_groupId_key',
        columns: ['groupId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Round',
        constraint: 'Round_groupId_number_key',
        columns: ['groupId', 'number'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Vote',
        constraint: 'Vote_roundId_memberId_key',
        columns: ['roundId', 'memberId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Candidate',
        index: 'Candidate_groupId_idx_e2fb5578',
        columns: ['groupId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Candidate',
        index: 'Candidate_suggestedByMemberId_idx_876a7f90',
        columns: ['suggestedByMemberId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Member',
        index: 'Member_groupId_idx_e2fb5578',
        columns: ['groupId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Result',
        index: 'Result_candidateId_idx_462b5869',
        columns: ['candidateId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Round',
        index: 'Round_groupId_idx_e2fb5578',
        columns: ['groupId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'RoundCandidate',
        index: 'RoundCandidate_candidateId_idx_462b5869',
        columns: ['candidateId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'RoundCandidate',
        index: 'RoundCandidate_roundId_idx_b7564116',
        columns: ['roundId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Vote',
        index: 'Vote_candidateId_idx_462b5869',
        columns: ['candidateId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Vote',
        index: 'Vote_memberId_idx_76b3c263',
        columns: ['memberId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Vote',
        index: 'Vote_roundId_idx_b7564116',
        columns: ['roundId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Candidate',
        foreignKey: {
          name: 'Candidate_groupId_fkey',
          columns: ['groupId'],
          references: { schema: 'public', table: 'Group', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Candidate',
        foreignKey: {
          name: 'Candidate_suggestedByMemberId_fkey',
          columns: ['suggestedByMemberId'],
          references: { schema: 'public', table: 'Member', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Member',
        foreignKey: {
          name: 'Member_groupId_fkey',
          columns: ['groupId'],
          references: { schema: 'public', table: 'Group', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Preference',
        foreignKey: {
          name: 'Preference_memberId_fkey',
          columns: ['memberId'],
          references: { schema: 'public', table: 'Member', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Result',
        foreignKey: {
          name: 'Result_groupId_fkey',
          columns: ['groupId'],
          references: { schema: 'public', table: 'Group', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Result',
        foreignKey: {
          name: 'Result_candidateId_fkey',
          columns: ['candidateId'],
          references: { schema: 'public', table: 'Candidate', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Round',
        foreignKey: {
          name: 'Round_groupId_fkey',
          columns: ['groupId'],
          references: { schema: 'public', table: 'Group', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'RoundCandidate',
        foreignKey: {
          name: 'RoundCandidate_roundId_fkey',
          columns: ['roundId'],
          references: { schema: 'public', table: 'Round', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'RoundCandidate',
        foreignKey: {
          name: 'RoundCandidate_candidateId_fkey',
          columns: ['candidateId'],
          references: { schema: 'public', table: 'Candidate', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Vote',
        foreignKey: {
          name: 'Vote_roundId_fkey',
          columns: ['roundId'],
          references: { schema: 'public', table: 'Round', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Vote',
        foreignKey: {
          name: 'Vote_memberId_fkey',
          columns: ['memberId'],
          references: { schema: 'public', table: 'Member', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Vote',
        foreignKey: {
          name: 'Vote_candidateId_fkey',
          columns: ['candidateId'],
          references: { schema: 'public', table: 'Candidate', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
