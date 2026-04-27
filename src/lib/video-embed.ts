export type VideoEmbedKind =
  | "youtube"
  | "vimeo"
  | "instagram"
  | "file"
  | "external";

export interface VideoEmbedInfo {
  kind: VideoEmbedKind;
  /** URL for iframe src (youtube/vimeo/instagram) or <video src> */
  src: string;
  /** Original permalink (Instagram, etc.) or external URL */
  href?: string;
}

/**
 * Instagram reel / post / TV — embed iframe + link to open in app.
 */
function parseInstagram(rawUrl: string): VideoEmbedInfo | null {
  const trimmed = rawUrl.trim();
  let u: URL;
  try {
    u = new URL(trimmed);
  } catch {
    return null;
  }

  const host = u.hostname.replace(/^www\./, "").toLowerCase();
  if (host !== "instagram.com" && host !== "instagr.am") return null;

  const segments = u.pathname.split("/").filter(Boolean);
  let kind = segments[0]?.toLowerCase();
  let id = segments[1]?.split("?")[0];

  // /usuario/reel/REEL_ID/
  if (
    segments.length >= 3 &&
    segments[1]?.toLowerCase() === "reel" &&
    segments[2]
  ) {
    kind = "reel";
    id = segments[2].split("?")[0];
  }

  if (!id) return null;

  if (kind === "reel" || kind === "reels") {
    const permalink = `https://www.instagram.com/reel/${id}`;
    return {
      kind: "instagram",
      src: `https://www.instagram.com/reel/${id}/embed/`,
      href: permalink,
    };
  }

  if (kind === "p" || kind === "tv") {
    const pathKey = kind === "tv" ? "tv" : "p";
    const permalink = `https://www.instagram.com/${pathKey}/${id}`;
    return {
      kind: "instagram",
      src: `https://www.instagram.com/${pathKey}/${id}/embed/`,
      href: permalink,
    };
  }

  return null;
}

/**
 * Resolve a user-pasted video URL into something we can embed or open.
 */
export function getVideoEmbedInfo(rawUrl: string): VideoEmbedInfo | null {
  const url = rawUrl.trim();
  if (!url) return null;

  const ig = parseInstagram(url);
  if (ig) return ig;

  const yt =
    url.match(
      /(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    )?.[1];
  if (yt) {
    return {
      kind: "youtube",
      src: `https://www.youtube-nocookie.com/embed/${yt}?rel=0`,
    };
  }

  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1];
  if (vm) {
    return {
      kind: "vimeo",
      src: `https://player.vimeo.com/video/${vm}`,
    };
  }

  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) {
    return { kind: "file", src: url };
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return { kind: "external", src: url, href: url };
    }
  } catch {
    return null;
  }

  return { kind: "external", src: url, href: url };
}
