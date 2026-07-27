import crypto from "node:crypto";
import { candleRepository } from "../repositories/CandleRepository";
import { memorialRepository } from "../repositories/MemorialRepository";
import { familyRepository } from "../repositories/FamilyRepository";
import type { InsertCandle } from "@workspace/db";

export class CandleService {
  async lightCandle(
    memorialId: string,
    input: InsertCandle,
    userId: string | null,
    ipAddress?: string,
  ) {
    const memorial = await memorialRepository.findById(memorialId);
    if (!memorial) throw new Error("Memorial not found");
    if (memorial.status !== "published")
      throw new Error("This memorial is not published");

    const privacy = memorial.privacy;

    const canInteract = await this._checkPermission(
      privacy?.canLightCandles ?? "family",
      privacy?.allowGuestInteraction ?? false,
      memorial.familyId,
      userId,
    );

    if (!canInteract) {
      throw new Error("You do not have permission to light a candle here");
    }

    if (!userId && !input.guestName?.trim()) {
      throw new Error("Guest name is required when not signed in");
    }

    const ipHash = ipAddress
      ? crypto.createHash("sha256").update(ipAddress).digest("hex")
      : null;

    const allowed = await candleRepository.checkRateLimit(
      memorialId,
      userId,
      ipHash,
    );

    if (!allowed) {
      throw new Error(
        "You have already lit a candle recently — please wait before lighting another",
      );
    }

    const candle = await candleRepository.create(
      memorialId,
      input,
      userId,
      ipAddress,
    );

    await memorialRepository.incrementCounter(memorialId, "candleCount");

    return candle;
  }

  private async _checkPermission(
    permission: string,
    allowGuests: boolean,
    familyId: string,
    userId: string | null,
  ): Promise<boolean> {
    if (permission === "public") return true;
    if (permission === "community" && userId) return true;
    if (permission === "community" && allowGuests) return true;
    if (permission === "family" && userId) {
      return familyRepository.isMember(familyId, userId);
    }
    if (permission === "nobody") return false;
    return false;
  }
}

export const candleService = new CandleService();
