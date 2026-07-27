import { useState, useCallback } from "react";
import type { UppyFile } from "@uppy/core";

interface UploadMetadata {
  name: string;
  size: number;
  contentType: string;
}

interface UploadResponse {
  uploadURL: string;
  objectPath: string;
  metadata: UploadMetadata;
}

interface UseUploadOptions {
  /** Base path where object storage routes are mounted (default: "/api/storage") */
  basePath?: string;
  /**
   * Returns an auth token (e.g. Clerk session JWT) to attach as a
   * `Authorization: Bearer <token>` header on the request-url call.
   * Required whenever the upload route is behind `requireAuth` — cookies
   * alone are not forwarded through Replit's dev proxy across ports.
   */
  getAuthToken?: () => Promise<string | null> | string | null;
  /** Maximum accepted file size in bytes. Files larger than this are rejected client-side with a clear message. */
  maxSizeBytes?: number;
  /** Accepted MIME type prefixes/values, e.g. ["image/"] or ["image/png", "image/jpeg"]. */
  acceptedTypes?: string[];
  onSuccess?: (response: UploadResponse) => void;
  onError?: (error: Error) => void;
}

function humanFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

/**
 * React hook for handling file uploads with presigned URLs.
 *
 * This hook implements the two-step presigned URL upload flow:
 * 1. Request a presigned URL from your backend (sends JSON metadata, NOT the file)
 * 2. Upload the file directly to the presigned URL
 *
 * @example
 * ```tsx
 * function FileUploader() {
 *   const { uploadFile, isUploading, error } = useUpload({
 *     onSuccess: (response) => {
 *       console.log("Uploaded to:", response.objectPath);
 *     },
 *   });
 *
 *   const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
 *     const file = e.target.files?.[0];
 *     if (file) {
 *       await uploadFile(file);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <input type="file" onChange={handleFileChange} disabled={isUploading} />
 *       {isUploading && <p>Uploading...</p>}
 *       {error && <p>Error: {error.message}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useUpload(options: UseUploadOptions = {}) {
  const basePath = options.basePath ?? "/api/storage";
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);

  const requestUploadUrl = useCallback(
    async (file: File): Promise<UploadResponse> => {
      const token = (await options.getAuthToken?.()) ?? null;
      let response: globalThis.Response;
      try {
        response = await fetch(`${basePath}/uploads/request-url`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
          body: JSON.stringify({
            name: file.name,
            size: file.size,
            contentType: file.type || "application/octet-stream",
          }),
        });
      } catch {
        throw new Error("Couldn't reach the server. Check your connection and try again.");
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({} as { error?: string }));
        if (response.status === 401) {
          throw new Error("You're signed out. Please sign in again and retry the upload.");
        }
        if (response.status === 403) {
          throw new Error("You don't have permission to upload this file.");
        }
        if (response.status === 429) {
          throw new Error("Too many uploads right now. Please wait a moment and try again.");
        }
        if (response.status >= 500) {
          throw new Error(errorData.error || "The server couldn't process the upload. Please try again shortly.");
        }
        throw new Error(errorData.error || `Upload request failed (error ${response.status}).`);
      }

      return response.json();
    },
    [basePath, options]
  );

  const uploadToPresignedUrl = useCallback(
    async (file: File, uploadURL: string): Promise<void> => {
      let response: globalThis.Response;
      try {
        response = await fetch(uploadURL, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type || "application/octet-stream",
          },
        });
      } catch {
        throw new Error("Upload was interrupted. Check your connection and try again.");
      }

      if (!response.ok) {
        if (response.status === 413) {
          throw new Error(`File is too large (${humanFileSize(file.size)}). Please choose a smaller file.`);
        }
        if (response.status === 403 || response.status === 400) {
          throw new Error("The upload link expired or was invalid. Please try again.");
        }
        throw new Error(`Failed to upload file to storage (error ${response.status}).`);
      }
    },
    []
  );

  const uploadFile = useCallback(
    async (file: File): Promise<UploadResponse | null> => {
      setIsUploading(true);
      setError(null);
      setProgress(0);

      try {
        if (options.acceptedTypes && options.acceptedTypes.length > 0) {
          const type = file.type || "";
          const matches = options.acceptedTypes.some(t => (t.endsWith("/") ? type.startsWith(t) : type === t));
          if (!matches) {
            throw new Error(`"${file.name}" isn't a supported file type. Please choose ${options.acceptedTypes.join(", ")}.`);
          }
        }
        if (options.maxSizeBytes && file.size > options.maxSizeBytes) {
          throw new Error(`"${file.name}" is ${humanFileSize(file.size)}, which is over the ${humanFileSize(options.maxSizeBytes)} limit. Please choose a smaller file.`);
        }

        setProgress(10);
        const uploadResponse = await requestUploadUrl(file);

        setProgress(30);
        await uploadToPresignedUrl(file, uploadResponse.uploadURL);

        setProgress(100);
        options.onSuccess?.(uploadResponse);
        return uploadResponse;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Upload failed. Please try again.");
        setError(error);
        options.onError?.(error);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [requestUploadUrl, uploadToPresignedUrl, options]
  );

  const getUploadParameters = useCallback(
    async (
      file: UppyFile<Record<string, unknown>, Record<string, unknown>>
    ): Promise<{
      method: "PUT";
      url: string;
      headers?: Record<string, string>;
    }> => {
      const token = (await options.getAuthToken?.()) ?? null;
      const response = await fetch(`${basePath}/uploads/request-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: file.type || "application/octet-stream",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get upload URL");
      }

      const data = await response.json();
      return {
        method: "PUT",
        url: data.uploadURL,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      };
    },
    [basePath, options]
  );

  return {
    uploadFile,
    getUploadParameters,
    isUploading,
    error,
    progress,
  };
}
