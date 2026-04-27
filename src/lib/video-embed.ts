export type VideoEmbedKind = "youtube" | "vimeo" | "file" | "external";

export interface VideoEmbedInfo {
  kind: VideoEmbedKind;
  /** URL for iframe src (youtube/vimeo) or <video src> */
  src: string;
  /** For external links, open in new tab */
  href?: string;
}

/**
 * Resolve a user-pasted video URL into something we can embed or open.
 */
export function getVideoEmbedInfo(rawUrl: string): VideoEmbedInfo | null {
  const url = rawUrl.trim();
  if (!url) return null;

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
