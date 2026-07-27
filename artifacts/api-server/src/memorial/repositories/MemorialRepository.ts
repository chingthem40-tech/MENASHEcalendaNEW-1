import { db } from "@workspace/db";
import {
  memorialsTable,
  memorialPersonsTable,
  memorialPrivacyTable,
  type Memorial,
  type MemorialWithPerson,
  type InsertMemorial,
  type InsertMemorialPerson,
} from "@workspace/db";
import { eq, and, isNull, ilike, or, sql, desc, inArray } from "drizzle-orm";

export type CollectionSort =
  | "recent_activity"
  | "most_visited"
  | "recently_lit"
  | "upcoming_yahrzeit"
  | "community_picks";

export interface SearchOptions {
  query?: string;
  sort?: CollectionSort;
  limit?: number;
  page?: number;
}

export interface PaginatedMemorials {
  data: MemorialWithPerson[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export class MemorialRepository {
  async findById(id: string): Promise<MemorialWithPerson | null> {
    const [memorial] = await db
      .select()
      .from(memorialsTable)
      .where(and(eq(memorialsTable.id, id), isNull(memorialsTable.deletedAt)));

    if (!memorial) return null;
    return this._hydrate(memorial);
  }

  async findBySlug(slug: string): Promise<MemorialWithPerson | null> {
    const [memorial] = await db
      .select()
      .from(memorialsTable)
      .where(
        and(eq(memorialsTable.slug, slug), isNull(memorialsTable.deletedAt)),
      );

    if (!memorial) return null;
    return this._hydrate(memorial);
  }

  async findByFamily(familyId: string): Promise<MemorialWithPerson[]> {
    const rows = await db
      .select()
      .from(memorialsTable)
      .where(
        and(
          eq(memorialsTable.familyId, familyId),
          isNull(memorialsTable.deletedAt),
        ),
      );

    return this._hydrateMany(rows);
  }

  async search(options: SearchOptions): Promise<PaginatedMemorials> {
    const { query = "", sort, limit = 20, page = 1 } = options;
    const offset = (page - 1) * limit;

    // Build base filter conditions
    const baseConditions: ReturnType<typeof eq>[] = [
      eq(memorialsTable.status, "published"),
      isNull(memorialsTable.deletedAt) as any,
    ];

    if (query.trim().length >= 2) {
      const pattern = `%${query.trim().slice(0, 100)}%`;

      const matchedPersons = await db
        .select({ id: memorialPersonsTable.id })
        .from(memorialPersonsTable)
        .where(
          and(
            or(
              ilike(memorialPersonsTable.fullName, pattern),
              ilike(memorialPersonsTable.hebrewName, pattern),
            ),
            isNull(memorialPersonsTable.deletedAt),
          ),
        )
        .limit(500);

      if (matchedPersons.length === 0) {
        return { data: [], total: 0, page, limit, hasMore: false };
      }

      (baseConditions as any[]).push(
        inArray(memorialsTable.personId, matchedPersons.map((p) => p.id)),
      );
    }

    const whereClause = and(...(baseConditions as any[]));

    // upcoming_yahrzeit requires person deathDate — load all, sort in JS
    if (sort === "upcoming_yahrzeit") {
      const all = await db
        .select()
        .from(memorialsTable)
        .where(whereClause);

      const hydrated = await this._hydrateMany(all);
      const sorted = this._sortByUpcomingYahrzeit(hydrated);
      const sliced = sorted.slice(offset, offset + limit);
      return {
        data: sliced,
        total: hydrated.length,
        page,
        limit,
        hasMore: offset + sliced.length < hydrated.length,
      };
    }

    // SQL-sorted paginated query for all other sorts
    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(memorialsTable)
      .where(whereClause);

    const total = countRow?.count ?? 0;
    if (total === 0) return { data: [], total: 0, page, limit, hasMore: false };

    const orderExpr = this._sqlOrderExpr(sort);
    const rows = await db
      .select()
      .from(memorialsTable)
      .where(whereClause)
      .orderBy(orderExpr as any)
      .limit(limit)
      .offset(offset);

    const data = await this._hydrateMany(rows);
    return { data, total, page, limit, hasMore: offset + rows.length < total };
  }

  // ── Sort helpers ─────────────────────────────────────────────────────────────

  private _sqlOrderExpr(sort?: CollectionSort) {
    switch (sort) {
      case "most_visited":
        return desc(memorialsTable.viewCount);
      case "community_picks":
        return sql`${memorialsTable.candleCount} + ${memorialsTable.tributeCount} DESC`;
      case "recently_lit":
      case "recent_activity":
      default:
        return desc(memorialsTable.lastActivityAt);
    }
  }

  private _sortByUpcomingYahrzeit(memorials: MemorialWithPerson[]): MemorialWithPerson[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();
    const msPerDay = 86400000;

    return [...memorials].sort((a, b) => {
      const aNext = this._daysUntilAnniversary(a.person.deathDate, todayMs, msPerDay);
      const bNext = this._daysUntilAnniversary(b.person.deathDate, todayMs, msPerDay);
      return aNext - bNext;
    });
  }

  private _daysUntilAnniversary(dateStr: string, todayMs: number, msPerDay: number): number {
    try {
      const d = new Date(dateStr);
      const thisYear = new Date(todayMs).getFullYear();
      let candidate = new Date(thisYear, d.getMonth(), d.getDate()).getTime();
      if (candidate < todayMs) candidate += 365 * msPerDay;
      return Math.round((candidate - todayMs) / msPerDay);
    } catch {
      return 9999;
    }
  }

  // ── Hydration ────────────────────────────────────────────────────────────────

  private async _hydrate(memorial: Memorial): Promise<MemorialWithPerson> {
    const [person] = await db
      .select()
      .from(memorialPersonsTable)
      .where(eq(memorialPersonsTable.id, memorial.personId));

    const [privacy] = await db
      .select()
      .from(memorialPrivacyTable)
      .where(eq(memorialPrivacyTable.memorialId, memorial.id));

    return {
      ...memorial,
      person: person!,
      privacy: privacy!,
    };
  }

  // Batch hydration — 2 queries instead of 2N. Use for collections / search results.
  private async _hydrateMany(memorials: Memorial[]): Promise<MemorialWithPerson[]> {
    if (memorials.length === 0) return [];

    const personIds = [...new Set(memorials.map((m) => m.personId))];
    const memorialIds = memorials.map((m) => m.id);

    const [persons, privacies] = await Promise.all([
      db
        .select()
        .from(memorialPersonsTable)
        .where(inArray(memorialPersonsTable.id, personIds)),
      db
        .select()
        .from(memorialPrivacyTable)
        .where(inArray(memorialPrivacyTable.memorialId, memorialIds)),
    ]);

    const personMap = new Map(persons.map((p) => [p.id, p]));
    const privacyMap = new Map(privacies.map((p) => [p.memorialId, p]));

    return memorials
      .filter((m) => personMap.has(m.personId))
      .map((m) => ({
        ...m,
        person: personMap.get(m.personId)!,
        privacy: privacyMap.get(m.id)!,
      }));
  }

  // ── Write operations ──────────────────────────────────────────────────────────

  async create(
    personData: InsertMemorialPerson,
    memorialData: InsertMemorial,
    slug: string,
    createdBy: string,
    familyId: string,
  ): Promise<MemorialWithPerson> {
    return db.transaction(async (tx) => {
      const [person] = await tx
        .insert(memorialPersonsTable)
        .values(personData)
        .returning();

      const [memorial] = await tx
        .insert(memorialsTable)
        .values({
          slug,
          personId: person!.id,
          familyId,
          createdBy,
          status: "draft",
        })
        .returning();

      await tx.insert(memorialPrivacyTable).values({
        memorialId: memorial!.id,
      });

      return {
        ...memorial!,
        person: person!,
        privacy: {
          id: "",
          memorialId: memorial!.id,
          visibilityLevel: "family",
          canLightCandles: "community",
          canLeaveTributes: "family",
          canViewPhotos: "family",
          requireModeration: true,
          allowGuestInteraction: false,
          updatedAt: new Date(),
        },
      };
    });
  }

  async update(
    id: string,
    data: Partial<Pick<Memorial, "status">>,
  ): Promise<Memorial | null> {
    const [updated] = await db
      .update(memorialsTable)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(memorialsTable.id, id), isNull(memorialsTable.deletedAt)))
      .returning();

    return updated ?? null;
  }

  async softDelete(id: string): Promise<void> {
    await db
      .update(memorialsTable)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(memorialsTable.id, id));
  }

  async incrementCounter(
    id: string,
    field: "candleCount" | "tributeCount" | "prayerCount" | "viewCount",
    by = 1,
  ): Promise<void> {
    await db
      .update(memorialsTable)
      .set({
        [field]: sql`${memorialsTable[field]} + ${by}`,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(memorialsTable.id, id));
  }
}

export const memorialRepository = new MemorialRepository();
