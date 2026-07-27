import { db } from "@workspace/db";
import {
  memorialPhotosTable,
  type MemorialPhoto,
  type InsertPhoto,
} from "@workspace/db";
import { eq, and, isNull, sql } from "drizzle-orm";

export class PhotoRepository {
  async findByMemorial(
    memorialId: string,
    approvedOnly = true,
  ): Promise<MemorialPhoto[]> {
    const conditions = [
      eq(memorialPhotosTable.memorialId, memorialId),
      isNull(memorialPhotosTable.deletedAt),
    ];

    if (approvedOnly) {
      conditions.push(eq(memorialPhotosTable.isApproved, true));
    }

    return db
      .select()
      .from(memorialPhotosTable)
      .where(and(...conditions))
      .orderBy(sql`${memorialPhotosTable.isFeatured} DESC, ${memorialPhotosTable.createdAt} DESC`);
  }

  async findById(id: string): Promise<MemorialPhoto | null> {
    const [row] = await db
      .select()
      .from(memorialPhotosTable)
      .where(
        and(
          eq(memorialPhotosTable.id, id),
          isNull(memorialPhotosTable.deletedAt),
        ),
      );
    return row ?? null;
  }

  async create(
    memorialId: string,
    input: InsertPhoto,
    uploadedBy: string,
    autoApprove: boolean,
  ): Promise<MemorialPhoto> {
    const [photo] = await db
      .insert(memorialPhotosTable)
      .values({
        memorialId,
        uploadedBy,
        photoUrl: input.photoUrl,
        caption: input.caption ?? null,
        takenYear: input.takenYear ?? null,
        takenLocation: input.takenLocation ?? null,
        isFeatured: false,
        isApproved: autoApprove,
      })
      .returning();

    return photo!;
  }

  async approve(id: string): Promise<MemorialPhoto | null> {
    const [row] = await db
      .update(memorialPhotosTable)
      .set({ isApproved: true })
      .where(
        and(
          eq(memorialPhotosTable.id, id),
          isNull(memorialPhotosTable.deletedAt),
        ),
      )
      .returning();

    return row ?? null;
  }

  async setFeatured(
    memorialId: string,
    photoId: string,
  ): Promise<void> {
    await db
      .update(memorialPhotosTable)
      .set({ isFeatured: false })
      .where(eq(memorialPhotosTable.memorialId, memorialId));

    await db
      .update(memorialPhotosTable)
      .set({ isFeatured: true })
      .where(
        and(
          eq(memorialPhotosTable.id, photoId),
          eq(memorialPhotosTable.memorialId, memorialId),
        ),
      );
  }

  async softDelete(id: string): Promise<void> {
    await db
      .update(memorialPhotosTable)
      .set({ deletedAt: new Date() })
      .where(eq(memorialPhotosTable.id, id));
  }
}

export const photoRepository = new PhotoRepository();
