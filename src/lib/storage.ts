import "server-only";
import ImageKit, { toFile } from "@imagekit/nodejs";

/**
 * Image storage — ImageKit only.
 *
 * The app never stores image bytes in its data store; it only ever stores the
 * resulting CDN URL returned by ImageKit. There is no local-disk fallback:
 * IMAGEKIT_PRIVATE_KEY must be configured for uploads to work.
 *
 * Callers get back a single string URL to store. Server-only.
 */

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB

/** Root folder inside the ImageKit media library for this site's uploads. */
const IK_ROOT = process.env.IMAGEKIT_FOLDER || "manga-site";

// Lazily construct the client so the SDK isn't initialized at import time.
let _client: ImageKit | null = null;
function client(): ImageKit {
  if (!process.env.IMAGEKIT_PRIVATE_KEY) {
    throw new Error(
      "IMAGEKIT_PRIVATE_KEY is not configured — image uploads are disabled.",
    );
  }
  if (!_client) {
    _client = new ImageKit({ privateKey: process.env.IMAGEKIT_PRIVATE_KEY });
  }
  return _client;
}

function safeExt(fileName: string): string {
  return (
    (fileName.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") ||
    "jpg"
  );
}

function validate(file: File): void {
  if (!file.type.startsWith("image/")) {
    throw new Error("يجب أن تكون جميع الملفات صورًا.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("حجم إحدى الصور يتجاوز ٨ ميغابايت.");
  }
}

/**
 * Upload an image to ImageKit and return the CDN URL to store.
 *
 * @param file the uploaded image
 * @param dir  logical sub-folder, e.g. "covers" or "chapters/<mangaId>/<n>"
 * @param name base file name (without extension), e.g. "001"
 */
export async function saveImage(
  file: File,
  dir: string,
  name: string,
): Promise<string> {
  validate(file);
  const ext = safeExt(file.name);
  const buffer = Buffer.from(await file.arrayBuffer());

  const res = await client().files.upload({
    file: await toFile(buffer, `${name}.${ext}`),
    fileName: `${name}.${ext}`,
    folder: `${IK_ROOT}/${dir}`,
    useUniqueFileName: false, // deterministic path; re-upload overwrites
  });
  if (!res.url) throw new Error("تعذّر رفع الصورة إلى التخزين الخارجي.");
  return res.url;
}

/**
 * Remove a previously stored image from ImageKit.
 *
 * Looks the file up by its URL path and deletes every matching object.
 * Best-effort: any failure is swallowed so deletes never block the caller.
 * Legacy local "/uploads/..." URLs are ignored (no remote object exists).
 */
export async function deleteImage(url?: string | null): Promise<void> {
  if (!url || !url.startsWith("http")) return;
  try {
    const c = client();
    // Derive the media-library path from the URL, e.g.
    // https://ik.imagekit.io/<id>/manga-site/covers/x.jpg -> /manga-site/covers/x.jpg
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    // Drop the leading ImageKit id segment.
    const libPath = "/" + parts.slice(1).join("/");
    const folder = libPath.replace(/\/[^/]+$/, "");

    const assets = await c.assets.list({ path: folder, type: "file" });
    const target = assets.find(
      (a) => "fileId" in a && (a.url === url || a.filePath === libPath),
    ) as { fileId?: string } | undefined;
    if (target?.fileId) {
      await c.files.delete(target.fileId);
    }
  } catch {
    /* best-effort — ignore */
  }
}
