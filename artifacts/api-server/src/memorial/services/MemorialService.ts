import { memorialRepository } from "../repositories/MemorialRepository";
import { familyRepository } from "../repositories/FamilyRepository";
import type { InsertMemorialPerson, InsertMemorial } from "@workspace/db";
import type { CollectionSort } from "../repositories/MemorialRepository";

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

    const canView = await this._checkVisibility(
      memorial.familyId,
      memorial.privacy?.visibilityLevel ?? "family",
      viewerUserId,
    );

    if (!canView) return null;

    await memorialRepository.incrementCounter(id, "viewCount");

    return memorial;
  }

  async getBySlug(slug: string, viewerUserId: string | null) {
    const memorial = await memorialRepository.findBySlug(slug);
    if (!memorial) return null;

    const canView = await this._checkVisibility(
      memorial.familyId,
      memorial.privacy?.visibilityLevel ?? "family",
      viewerUserId,
    );

    if (!canView) return null;

    await memorialRepository.incrementCounter(memorial.id, "viewCount");

    return memorial;
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

  private async _checkVisibility(
    familyId: string,
    level: string,
    viewerUserId: string | null,
  ): Promise<boolean> {
    if (level === "public") return true;
    if (!viewerUserId) return false;
    if (level === "community") return true;
    if (level === "family" || level === "private") {
      return familyRepository.isMember(familyId, viewerUserId);
    }
    return false;
  }
}

export const memorialService = new MemorialService();
