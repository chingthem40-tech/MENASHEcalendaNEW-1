import { db } from "@workspace/db";
import {
  memorialFamiliesTable,
  memorialFamilyMembersTable,
  type MemorialFamily,
  type MemorialFamilyMember,
} from "@workspace/db";
import { eq, and, isNull, sql } from "drizzle-orm";

export class FamilyRepository {
  async findById(id: string): Promise<MemorialFamily | null> {
    const [row] = await db
      .select()
      .from(memorialFamiliesTable)
      .where(
        and(
          eq(memorialFamiliesTable.id, id),
          isNull(memorialFamiliesTable.deletedAt),
        ),
      );
    return row ?? null;
  }

  async findByUser(userId: string): Promise<MemorialFamily[]> {
    const memberships = await db
      .select({ familyId: memorialFamilyMembersTable.familyId })
      .from(memorialFamilyMembersTable)
      .where(eq(memorialFamilyMembersTable.userId, userId));

    if (memberships.length === 0) return [];

    const familyIds = memberships.map((m) => m.familyId);
    const rows = await db
      .select()
      .from(memorialFamiliesTable)
      .where(isNull(memorialFamiliesTable.deletedAt));

    return rows.filter((f) => familyIds.includes(f.id));
  }

  async create(
    name: string,
    primaryContactId: string,
  ): Promise<MemorialFamily> {
    const [family] = await db
      .insert(memorialFamiliesTable)
      .values({ name, primaryContactId })
      .returning();
    return family!;
  }

  async addMember(
    familyId: string,
    userId: string,
    role: "admin" | "member" | "viewer" = "member",
    invitedBy?: string,
  ): Promise<MemorialFamilyMember> {
    const existing = await db
      .select()
      .from(memorialFamilyMembersTable)
      .where(
        and(
          eq(memorialFamilyMembersTable.familyId, familyId),
          eq(memorialFamilyMembersTable.userId, userId),
        ),
      );

    if (existing.length > 0) return existing[0]!;

    const [member] = await db
      .insert(memorialFamilyMembersTable)
      .values({ familyId, userId, role, invitedBy: invitedBy ?? null })
      .returning();

    await db
      .update(memorialFamiliesTable)
      .set({
        memberCount: sql`(SELECT COUNT(*) FROM ${memorialFamilyMembersTable} WHERE family_id = ${familyId})`,
        updatedAt: new Date(),
      })
      .where(eq(memorialFamiliesTable.id, familyId));

    return member!;
  }

  async removeMember(familyId: string, userId: string): Promise<void> {
    await db
      .delete(memorialFamilyMembersTable)
      .where(
        and(
          eq(memorialFamilyMembersTable.familyId, familyId),
          eq(memorialFamilyMembersTable.userId, userId),
        ),
      );
  }

  async getMembers(familyId: string): Promise<MemorialFamilyMember[]> {
    return db
      .select()
      .from(memorialFamilyMembersTable)
      .where(eq(memorialFamilyMembersTable.familyId, familyId));
  }

  async isMember(familyId: string, userId: string): Promise<boolean> {
    const [row] = await db
      .select({ id: memorialFamilyMembersTable.id })
      .from(memorialFamilyMembersTable)
      .where(
        and(
          eq(memorialFamilyMembersTable.familyId, familyId),
          eq(memorialFamilyMembersTable.userId, userId),
        ),
      );
    return !!row;
  }

  async isAdmin(familyId: string, userId: string): Promise<boolean> {
    const [row] = await db
      .select({ role: memorialFamilyMembersTable.role })
      .from(memorialFamilyMembersTable)
      .where(
        and(
          eq(memorialFamilyMembersTable.familyId, familyId),
          eq(memorialFamilyMembersTable.userId, userId),
          eq(memorialFamilyMembersTable.role, "admin"),
        ),
      );
    return !!row;
  }

  async transferOwnership(
    familyId: string,
    newPrimaryContactId: string,
  ): Promise<MemorialFamily> {
    const isMember = await this.isMember(familyId, newPrimaryContactId);
    if (!isMember) {
      throw new Error("New primary contact must be a family member");
    }

    const [updated] = await db
      .update(memorialFamiliesTable)
      .set({ primaryContactId: newPrimaryContactId, updatedAt: new Date() })
      .where(
        and(
          eq(memorialFamiliesTable.id, familyId),
          isNull(memorialFamiliesTable.deletedAt),
        ),
      )
      .returning();

    if (!updated) throw new Error("Family not found");
    return updated;
  }

  async updateMemberRole(
    familyId: string,
    memberId: string,
    role: "admin" | "member" | "viewer",
  ): Promise<MemorialFamilyMember | null> {
    const [updated] = await db
      .update(memorialFamilyMembersTable)
      .set({ role })
      .where(
        and(
          eq(memorialFamilyMembersTable.id, memberId),
          eq(memorialFamilyMembersTable.familyId, familyId),
        ),
      )
      .returning();
    return updated ?? null;
  }
}

export const familyRepository = new FamilyRepository();
