import { API_BASE } from '../config/api';

export interface MediaInfo {
  title: string;
  thumbnail: string;
  videoUrl: string;
  audioUrl: string;
}

export const ClientDownloader = {
  /**
   * Fetch basic video info (Title, Thumbnail) from backend yt-dlp API
   */
  async getInfo(url: string): Promise<MediaInfo | null> {
    try {
      const response = await fetch(`${API_BASE}/api/v1/extract?url=${encodeURIComponent(url)}`);
      if (!response.ok) throw new Error('Failed to extract media from backend');
      
      const data = await response.json();
      
      return {
        title: data.title || 'Video Download',
        thumbnail: data.thumbnail,
        videoUrl: data.video_url,
        audioUrl: data.audio_url,
      };
    } catch (e) {
      console.log('ClientDownloader getInfo expected fallback:', e);
      return null;
    }
  },

  /**
   * Get the direct download URL 
   */
  async getDownloadUrl(url: string, type: 'video' | 'audio' = 'video'): Promise<string | null> {
    try {
      const info = await this.getInfo(url);
      if (!info) return null;
      
      return type === 'audio' && info.audioUrl ? info.audioUrl : info.videoUrl;
    } catch (e) {
      console.log('ClientDownloader getDownloadUrl expected fallback:', e);
      return null;
    }
  }
};
