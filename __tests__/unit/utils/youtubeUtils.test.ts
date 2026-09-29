import {
  extractYouTubeVideoId,
  isValidYouTubeUrl,
  getYouTubeThumbnailUrl,
} from '../../../src/utils/youtubeUtils';

describe('youtubeUtils (PF-248)', () => {
  describe('extractYouTubeVideoId', () => {
    it('extracts ID from standard watch URL', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
        'dQw4w9WgXcQ'
      );
    });

    it('extracts ID from standard watch URL with extra parameters', () => {
      expect(
        extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s&feature=shared')
      ).toBe('dQw4w9WgXcQ');
      expect(
        extractYouTubeVideoId('https://www.youtube.com/watch?feature=shared&v=dQw4w9WgXcQ')
      ).toBe('dQw4w9WgXcQ');
    });

    it('extracts ID from short youtu.be URL', () => {
      expect(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ?si=12345')).toBe('dQw4w9WgXcQ');
    });

    it('extracts ID from embed URL', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(
        'dQw4w9WgXcQ'
      );
    });

    it('extracts ID from shorts URL', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe(
        'dQw4w9WgXcQ'
      );
    });

    it('extracts ID from mobile youtube URL', () => {
      expect(extractYouTubeVideoId('https://m.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
        'dQw4w9WgXcQ'
      );
    });

    it('accepts a direct 11-character video ID', () => {
      expect(extractYouTubeVideoId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('handles whitespace cleanly', () => {
      expect(extractYouTubeVideoId('   https://youtu.be/dQw4w9WgXcQ   ')).toBe('dQw4w9WgXcQ');
    });

    it('returns null for invalid or non-YouTube URLs', () => {
      expect(extractYouTubeVideoId(null)).toBeNull();
      expect(extractYouTubeVideoId(undefined)).toBeNull();
      expect(extractYouTubeVideoId('')).toBeNull();
      expect(extractYouTubeVideoId('   ')).toBeNull();
      expect(extractYouTubeVideoId('https://vimeo.com/12345678')).toBeNull();
      expect(extractYouTubeVideoId('https://google.com')).toBeNull();
      expect(extractYouTubeVideoId('not a url')).toBeNull();
      expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=too_short')).toBeNull();
    });
  });

  describe('isValidYouTubeUrl', () => {
    it('returns true for valid YouTube URLs and IDs', () => {
      expect(isValidYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
      expect(isValidYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
      expect(isValidYouTubeUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe(true);
      expect(isValidYouTubeUrl('dQw4w9WgXcQ')).toBe(true);
    });

    it('returns false for invalid URLs, empty strings, null and undefined', () => {
      expect(isValidYouTubeUrl('')).toBe(false);
      expect(isValidYouTubeUrl(null)).toBe(false);
      expect(isValidYouTubeUrl(undefined)).toBe(false);
      expect(isValidYouTubeUrl('https://example.com/video')).toBe(false);
      expect(isValidYouTubeUrl('https://www.youtube.com/watch?v=123')).toBe(false);
    });
  });

  describe('getYouTubeThumbnailUrl', () => {
    it('returns correct thumbnail URL with default hqdefault quality', () => {
      expect(getYouTubeThumbnailUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(
        'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg'
      );
    });

    it('returns correct thumbnail URL for custom quality', () => {
      expect(getYouTubeThumbnailUrl('dQw4w9WgXcQ', 'mqdefault')).toBe(
        'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg'
      );
      expect(getYouTubeThumbnailUrl('dQw4w9WgXcQ', 'maxresdefault')).toBe(
        'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
      );
    });

    it('returns null if video ID or URL is invalid', () => {
      expect(getYouTubeThumbnailUrl(null)).toBeNull();
      expect(getYouTubeThumbnailUrl('')).toBeNull();
      expect(getYouTubeThumbnailUrl('invalid')).toBeNull();
    });
  });
});
