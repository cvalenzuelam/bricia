const IMAGE_MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  jfif: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  heic: "image/heic",
  heif: "image/heif",
  bmp: "image/bmp",
  svg: "image/svg+xml",
};

const GENERIC_MIME_TYPES = new Set([
  "",
  "application/octet-stream",
  "binary/octet-stream",
  "application/binary",
]);

/** MIME de imagen válido para Storage; infiere por extensión si el browser no la reporta. */
export function resolveCmsImageMime(
  file: Pick<File, "type" | "name">
): string {
  const reported = file.type?.trim().toLowerCase() ?? "";
  if (
    reported.startsWith("image/") &&
    !GENERIC_MIME_TYPES.has(reported)
  ) {
    return reported;
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return IMAGE_MIME_BY_EXT[ext] ?? "image/jpeg";
}

export function isAllowedCmsImageMime(mime: string): boolean {
  return mime.startsWith("image/");
}
