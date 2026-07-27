import { tributeRepository } from "../repositories/TributeRepository";
import { memorialRepository } from "../repositories/MemorialRepository";
import { familyRepository } from "../repositories/FamilyRepository";
import type { InsertTribute } from "@workspace/db";

export class TributeService {
  async submit(
    memorialId: string,
    input: InsertTribute,
    userId: string | null,
  ) {
    const memorial = await memorialRepository.findById(memorialId);
    if (!memorial) throw new Error("Memorial not found");
    if (memorial.status !== "published")
      throw new Error("This memorial is not published");

    const privacy = memorial.privacy;
    const permission = privacy?.canLeaveTributes ?? "family";
    const allowGuests = privacy?.allowGuestInteraction ?? false;

    if (permission === "nobody") {
      throw new Error("Tributes are not allowed on this memorial");
    }

    if (!userId && !allowGuests) {
      throw new Error("You must be signed in to leave a tribute");
    }

    if (!userId && !input.guestName?.trim()) {
      throw new Error("Guest name is required when not signed in");
    }

    if (permission === "family" && userId) {
      const isMember = await familyRepository.isMember(
        memorial.familyId,
        userId,
      );
      if (!isMember) throw new Error("Only family members can leave a tribute here");
    }

    const tribute = await tributeRepository.create(memorialId, input, userId);

    const autoApprove =
      !(privacy?.requireModeration ?? true) ||
      (userId
        ? await familyRepository.isMember(memorial.familyId, userId)
        : false);

    if (autoApprove) {
      await tributeRepository.approve(tribute.id, "system");
      await memorialRepository.incrementCounter(memorialId, "tributeCount");
      return { ...tribute, status: "approved" as const };
    }

    return tribute;
  }

  async approve(tributeId: string, moderatorId: string) {
    const tribute = await tributeRepository.findById(tributeId);
    if (!tribute) throw new Error("Tribute not found");

    const memorial = await memorialRepository.findById(tribute.memorialId);
    if (!memorial) throw new Error("Memorial not found");

    const isAdmin = await familyRepository.isAdmin(
      memorial.familyId,
      moderatorId,
    );
    if (!isAdmin) throw new Error("Only a family admin can moderate tributes");

    const updated = await tributeRepository.approve(tributeId, moderatorId);

    if (updated?.status === "approved") {
      await memorialRepository.incrementCounter(tribute.memorialId, "tributeCount");
    }

    return updated;
  }

  async reject(tributeId: string, moderatorId: string, reason?: string) {
    const tribute = await tributeRepository.findById(tributeId);
    if (!tribute) throw new Error("Tribute not found");

    const memorial = await memorialRepository.findById(tribute.memorialId);
    if (!memorial) throw new Error("Memorial not found");

    const isAdmin = await familyRepository.isAdmin(
      memorial.familyId,
      moderatorId,
    );
    if (!isAdmin) throw new Error("Only a family admin can moderate tributes");

    return tributeRepository.reject(tributeId, moderatorId, reason);
  }

  async getTributes(
    memorialId: string,
    viewerUserId: string | null,
    familyId: string,
  ) {
    const isFamilyMember = viewerUserId
      ? await familyRepository.isMember(familyId, viewerUserId)
      : false;

    const status = isFamilyMember ? "all" : "approved";
    return tributeRepository.findByMemorial(memorialId, status as "all" | "approved");
  }
}

export const tributeService = new TributeService();
