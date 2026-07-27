import { db } from "@workspace/db";
import {
  memorialCandlesTable,
  type MemorialCandle,
  type InsertCandle,
} from "@workspace/db";
import { eq, and, isNull, gte, isNotNull, sql } from "drizzle-orm";
import crypto from "node:crypto";

export type CandleFilter = "recent" | "today" | "community";

export interface PaginatedCandles {
  data: MemorialCandle[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  filter: CandleFilter;
}

export class CandleRepository {
  async findByMemorial(
    memorialId: string,
    page = 1,
    limit = 20,
    filter: CandleFilter = "recent",
  ): Promise<PaginatedCandles> {
    const offset = (page - 1) * limit;

    const conditions = [
      eq(memorialCandlesTable.memorialId, memorialId),
      isNull(memorialCandlesTable.deletedAt),
    ];

    if (filter === "today") {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      conditions.push(gte(memorialCandlesTable.litAt, startOfToday));
    } else if (filter === "community") {
      conditions.push(isNotNull(memorialCandlesTable.community));
      conditions.push(sql`${memorialCandlesTable.community} <> ''`);
    }

    const whereClause = and(...conditions);

    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(memorialCandlesTable)
      .where(whereClause);

    const total = countRow?.count ?? 0;

    const data = await db
      .select()
      .from(memorialCandlesTable)
      .where(whereClause)
      .orderBy(sql`${memorialCandlesTable.litAt} DESC`)
      .limit(limit)
      .offset(offset);

    return {
      data,
      total,
      page,
      limit,
      hasMore: offset + data.length < total,
      filter,
    };
  }

  async create(
    memorialId: string,
    input: InsertCandle,
    userId: string | null,
    ipAddress?: string,
  ): Promise<MemorialCandle> {
    const ipHash = ipAddress
      ? crypto.createHash("sha256").update(ipAddress).digest("hex")
      : null;

    const [candle] = await db
      .insert(memorialCandlesTable)
      .values({
        memorialId,
        userId,
        guestName: input.guestName ?? null,
        message: input.message ?? null,
        candleType: input.candleType ?? "memorial",
        relationship: input.relationship ?? null,
        community: input.community ?? null,
        isAnonymous: input.isAnonymous ?? false,
        ipHash,
      })
      .returning();

    return candle!;
  }

  async remove(id: string): Promise<boolean> {
    const [result] = await db
      .update(memorialCandlesTable)
      .set({ deletedAt: new Date() })
      .where(eq(memorialCandlesTable.id, id))
      .returning({ id: memorialCandlesTable.id });

    return !!result;
  }

  async checkRateLimit(
    memorialId: string,
    userId: string | null,
    ipHash: string | null,
    windowMinutes = 60,
  ): Promise<boolean> {
    const since = new Date(Date.now() - windowMinutes * 60 * 1000);

    if (userId) {
      const [row] = await db
        .select({ id: memorialCandlesTable.id })
        .from(memorialCandlesTable)
        .where(
          and(
            eq(memorialCandlesTable.memorialId, memorialId),
            eq(memorialCandlesTable.userId, userId),
            gte(memorialCandlesTable.litAt, since),
            isNull(memorialCandlesTable.deletedAt),
          ),
        )
        .limit(1);
      if (row) return false;
    }

    if (!userId && ipHash) {
      const [row] = await db
        .select({ id: memorialCandlesTable.id })
        .from(memorialCandlesTable)
        .where(
          and(
            eq(memorialCandlesTable.memorialId, memorialId),
            eq(memorialCandlesTable.ipHash, ipHash),
            gte(memorialCandlesTable.litAt, since),
            isNull(memorialCandlesTable.deletedAt),
          ),
        )
        .limit(1);
      if (row) return false;
    }

    return true;
  }

  static hashIp(ip: string): string {
    return crypto.createHash("sha256").update(ip).digest("hex");
  }
}

export const candleRepository = new CandleRepository();
