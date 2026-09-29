/**
 * Utility functions for YouTube URL parsing, validation and thumbnail generation.
 * Supports standard watch URLs, short URLs, embeds, shorts, and mobile URLs.
 */

const YOUTUBE_REGEX =
  /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/;

/**
 * Extracts the 11-character YouTube video ID from a URL or raw ID string.
 * Returns null if the URL is invalid or no video ID could be found.
 */
export const extractYouTubeVideoId = (url: string | null | undefined): string | null => {
  if (!url || typeof url !== 'string') return null;

  const trimmed = url.trim();
  if (!trimmed) return null;

  // If the input is already an exact 11-character ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  const match = trimmed.match(YOUTUBE_REGEX);
  return match && match[1] && match[1].length === 11 ? match[1] : null;
};

/**
 * Validates whether the given string is a valid YouTube video URL or ID.
 */
export const isValidYouTubeUrl = (url: string | null | undefined): boolean => {
  if (!url || typeof url !== 'string') return false;
  return extractYouTubeVideoId(url) !== null;
};

export type YouTubeThumbnailQuality = 'default' | 'mqdefault' | 'hqdefault' | 'maxresdefault';

/**
 * Returns the URL for a YouTube video thumbnail based on video ID or URL.
 */
export const getYouTubeThumbnailUrl = (
  videoIdOrUrl: string | null | undefined,
  quality: YouTubeThumbnailQuality = 'hqdefault'
): string | null => {
  const videoId = extractYouTubeVideoId(videoIdOrUrl);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
};
