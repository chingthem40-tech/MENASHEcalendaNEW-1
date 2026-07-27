import { useState, useCallback } from "react";
import { uploadPhoto } from "../api/memorialApi";
import type { MemorialPhoto, UploadPhotoInput, MemorialLoadingState } from "../types";
import { photoStorageKey } from "../utils";

// ── useUploadPhoto ────────────────────────────────────────────────────────────
// Manages photo upload to Replit Object Storage, then registers the URL with
// the API. Progress is simulated since the object-storage-web lib doesn't
// expose XHR progress events.
//
// Upload flow:
//   1. Get presigned upload URL from /api/memorials/:id/photos/upload-url
//   2. PUT file to object storage
//   3. POST photo metadata (URL + caption) to /api/memorials/:id/photos
//
// NOTE: Step 1 requires a backend route that returns a signed URL.
// The architecture reserves this interface; implement with object-storage-web
// when the backend route is built.

interface UseUploadPhoto {
  status: MemorialLoadingState;
  progress: number;
  error: Error | null;
  upload: (
    memorialId: string,
    file: File,
    meta?: Pick<UploadPhotoInput, "caption" | "takenYear" | "takenLocation">,
  ) => Promise<MemorialPhoto | null>;
  reset: () => void;
}

export function useUploadPhoto(): UseUploadPhoto {
  const [status, setStatus] = useState<MemorialLoadingState>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const upload = useCallback(
    async (
      memorialId: string,
      file: File,
      meta: Pick<UploadPhotoInput, "caption" | "takenYear" | "takenLocation"> = {},
    ): Promise<MemorialPhoto | null> => {
      setStatus("loading");
      setProgress(0);
      setError(null);

      try {
        // Step 1 — Get a presigned upload URL from the API
        const token: string | null =
          await (window as any).Clerk?.session?.getToken() ?? null;

        const storageKey = photoStorageKey(memorialId, file.name);

        const urlRes = await fetch(
          `/api/memorials/${memorialId}/photos/upload-url`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            credentials: "include",
            body: JSON.stringify({ key: storageKey, contentType: file.type }),
          },
        );

        if (!urlRes.ok) throw new Error(`Failed to get upload URL: ${urlRes.status}`);
        const { uploadUrl, publicUrl } = await urlRes.json();

        setProgress(20);

        // Step 2 — Upload binary to object storage
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        if (!uploadRes.ok)
          throw new Error(`Object storage upload failed: ${uploadRes.status}`);

        setProgress(80);

        // Step 3 — Register with the API
        const photo = await uploadPhoto(memorialId, {
          photoUrl: publicUrl,
          ...meta,
        });

        setProgress(100);
        setStatus("success");
        return photo;
      } catch (err) {
        const wrapped = err instanceof Error ? err : new Error(String(err));
        setError(wrapped);
        setStatus("error");
        return null;
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setProgress(0);
    setError(null);
  }, []);

  return { status, progress, error, upload, reset };
}
