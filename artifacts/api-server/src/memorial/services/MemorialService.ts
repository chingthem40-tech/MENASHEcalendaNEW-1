import { memorialRepository } from "../repositories/MemorialRepository";
import { familyRepository } from "../repositories/FamilyRepository";
import type {
  InsertMemorialPerson,
  InsertMemorial,
  MemorialWithPerson,
} from "@workspace/db";
import type { CollectionSort } from "../repositories/MemorialRepository";

export type MemorialPrivacyLevel = "private" | "family" | "community" | "public";
export type MemorialInteractionPermission =
  | "nobody"
  | "family"
  | "community"
  | "public";

export function isMemorialVisibilityAllowed(
  level: MemorialPrivacyLevel,
  isAuthenticated: boolean,
  isFamilyMember: boolean,
): boolean {
  if (level === "public") return true;
  if (level === "community") return isAuthenticated;
  return isAuthenticated && isFamilyMember;
}

export function isMemorialInteractionAllowed(
  permission: MemorialInteractionPermission,
  isAuthenticated: boolean,
  isFamilyMember: boolean,
  allowGuests = false,
): boolean {
  if (permission === "public") return true;
  if (permission === "community") return isAuthenticated || allowGuests;
  if (permission === "family") return isAuthenticated && isFamilyMember;
  return false;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function uniqueSlug(base: string): Promise<string> {
  let candidate = base;
  let attempt = 0;

  while (true) {
    const existing = await memorialRepository.findBySlug(candidate);
    if (!existing) return candidate;
    attempt++;
    candidate = `${base}-${attempt}`;
  }
}

export interface CreateMemorialInput {
  person: InsertMemorialPerson;
  familyId?: string;
  familyName?: string;
}

export class MemorialService {
  async create(input: CreateMemorialInput, createdBy: string) {
    let familyId: string;

    if (input.familyId) {
      const family = await familyRepository.findById(input.familyId);
      if (!family) throw new Error("Family not found");

      const isMember = await familyRepository.isMember(
        input.familyId,
        createdBy,
      );
      if (!isMember) throw new Error("Not a member of this family");

      familyId = input.familyId;
    } else {
      const name = input.familyName?.trim() || `${input.person.fullName} Family`;
      const family = await familyRepository.create(name, createdBy);
      await familyRepository.addMember(family.id, createdBy, "admin");
      familyId = family.id;
    }

    const base = slugify(input.person.fullName);
    const slug = await uniqueSlug(base);

    const memorial = await memorialRepository.create(
      input.person,
      {} as InsertMemorial,
      slug,
      createdBy,
      familyId,
    );

    return memorial;
  }

  async getById(id: string, viewerUserId: string | null) {
    const memorial = await memorialRepository.findById(id);
    if (!memorial) return null;

    const canView = await this.canViewMemorial(memorial, viewerUserId);

    if (!canView) return null;

    await memorialRepository.incrementCounter(id, "viewCount");

    return memorial;
  }

  async getBySlug(slug: string, viewerUserId: string | null) {
    const memorial = await memorialRepository.findBySlug(slug);
    if (!memorial) return null;

    const canView = await this.canViewMemorial(memorial, viewerUserId);

    if (!canView) return null;

    await memorialRepository.incrementCounter(memorial.id, "viewCount");

    return memorial;
  }

  async findVisibleById(id: string, viewerUserId: string | null) {
    const memorial = await memorialRepository.findById(id);
    if (!memorial) return null;
    return (await this.canViewMemorial(memorial, viewerUserId))
      ? memorial
      : null;
  }

  async canViewMemorial(
    memorial: MemorialWithPerson,
    viewerUserId: string | null,
  ): Promise<boolean> {
    const isFamilyMember = viewerUserId
      ? await familyRepository.isMember(memorial.familyId, viewerUserId)
      : false;
    return isMemorialVisibilityAllowed(
      (memorial.privacy?.visibilityLevel ?? "family") as MemorialPrivacyLevel,
      Boolean(viewerUserId),
      isFamilyMember,
    );
  }

  async canUseMemorialPermission(
    memorial: MemorialWithPerson,
    permission: MemorialInteractionPermission,
    viewerUserId: string | null,
    allowGuests = false,
  ): Promise<boolean> {
    if (!(await this.canViewMemorial(memorial, viewerUserId))) return false;
    const isFamilyMember = viewerUserId
      ? await familyRepository.isMember(memorial.familyId, viewerUserId)
      : false;
    return isMemorialInteractionAllowed(
      permission,
      Boolean(viewerUserId),
      isFamilyMember,
      allowGuests,
    );
  }

  async update(
    id: string,
    data: { status?: "draft" | "published" | "archived" },
    actorId: string,
  ) {
    const memorial = await memorialRepository.findById(id);
    if (!memorial) throw new Error("Memorial not found");

    const isAdmin = await familyRepository.isAdmin(memorial.familyId, actorId);
    if (!isAdmin) throw new Error("Only a family admin can update this memorial");

    return memorialRepository.update(id, data);
  }

  async search(
    query: string,
    viewerUserId: string | null,
    opts: { sort?: CollectionSort; page?: number; limit?: number } = {},
  ) {
    const result = await memorialRepository.search({
      query,
      sort: opts.sort,
      page: opts.page ?? 1,
      limit: opts.limit ?? 20,
    });

    const accessible = result.data.filter((m) =>
      ["public", "community"].includes(m.privacy?.visibilityLevel ?? "private"),
    );

    return {
      data: accessible,
      total: accessible.length,
      page: result.page,
      limit: result.limit,
      hasMore: result.hasMore,
    };
  }

}

export const memorialService = new MemorialService();
