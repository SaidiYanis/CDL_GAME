import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";

const ASSET_CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".m4a": "audio/mp4",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".wav": "audio/wav",
  ".webp": "image/webp",
};

const resourceRootPath = path.resolve(
  /* turbopackIgnore: true */ process.cwd(),
  "ressource",
);

async function resolveAssetPath(assetPath: string[]): Promise<string> {
  const requestedPath = path.resolve(resourceRootPath, ...assetPath);

  if (
    requestedPath !== resourceRootPath &&
    !requestedPath.startsWith(`${resourceRootPath}${path.sep}`)
  ) {
    notFound();
  }

  try {
    await readFile(requestedPath);
    return requestedPath;
  } catch {
    const directoryPath = path.dirname(requestedPath);
    const fileName = path.basename(requestedPath).toLowerCase();
    const directoryEntries = await readdir(directoryPath);
    const matchingEntry = directoryEntries.find(
      (entry) => entry.toLowerCase() === fileName,
    );

    if (!matchingEntry) {
      notFound();
    }

    return path.join(directoryPath, matchingEntry);
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ assetPath: string[] }> },
) {
  const { assetPath } = await context.params;
  const resolvedAssetPath = await resolveAssetPath(assetPath);
  const fileExtension = path.extname(resolvedAssetPath).toLowerCase();
  const contentType = ASSET_CONTENT_TYPES[fileExtension];

  if (!contentType) {
    notFound();
  }

  const fileBuffer = await readFile(resolvedAssetPath);

  return new Response(new Uint8Array(fileBuffer), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
