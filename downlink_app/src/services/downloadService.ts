/**
* Downlink Download Service
*
* Full download flow:
*  1. Call /api/formats on the Downlink backend (cheap — just JSON metadata)
*  2. For merged files (video + audio):
*     - Call /api/merge with the two stream URLs, backend handles FFmpeg
*     - Save merged file to device gallery
*  3. For single stream (video or audio only):
*     - Download directly from YouTube CDN to app cache
*     - Save to device gallery
*  4. Notify subscribers so the UI updates in real-time
*/

import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FORMAT_PRESETS } from '../types/index';
import { DownlinkFileSystem } from './fileSystem';
import { ClientDownloader } from './clientDownloader';
import { API_BASE } from '../config/api';

// ─── Config ──────────────────────────────────────────────────────────────────
export const STORAGE_KEY = '@downlink_downloads';

// ─── Types ───────────────────────────────────────────────────────────────────
export type DownloadStatus =
  | 'pending'
  | 'fetching_info'
  | 'downloading'
  | 'merging'
  | 'saving'
  | 'completed'
  | 'failed'
  | 'paused'
  | 'cancelled';

export interface DownloadItem {
  id: string;
  url: string;
  title: string;
  thumbnail?: string;
  progress: number;       // 0–100
  status: DownloadStatus;
  preset: typeof FORMAT_PRESETS[keyof typeof FORMAT_PRESETS];
  speed?: string;
  eta?: string;
  size?: string;
  error?: string;
  localUri?: string;      // Final gallery URI once completed
  needsMerge?: boolean;
  createdAt: number;
}

type Listener = (items: DownloadItem[]) => void;

// ─── In-memory store ─────────────────────────────────────────────────────────
let _downloads: DownloadItem[] = [];
let _listeners: Listener[] = [];

const notify = () => {
  _listeners.forEach((l) => l([..._downloads]));
  // Persist to storage
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(_downloads)).catch(err => {
    console.error('[DownloadService] Failed to save downloads:', err);
  });
};

const update = (id: string, patch: Partial<DownloadItem>) => {
  _downloads = _downloads.map((d) => (d.id === id ? { ...d, ...patch } : d));
  notify();
};

// ─── Active download callbacks map (for pause/cancel) ────────────────────────
const _activeDownloads = new Map<string, FileSystem.DownloadResumable>();

// ─── Public API ──────────────────────────────────────────────────────────────
export const DownloadService = {
  async init() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        _downloads = JSON.parse(stored);
        // Reset any stuck states on boot
        _downloads = _downloads.map(d =>
          (d.status === 'downloading' || d.status === 'merging' || d.status === 'fetching_info' || d.status === 'saving')
            ? { ...d, status: 'failed', error: 'Interrupted' }
            : d
        );
      }
      notify();
    } catch (err) {
      console.error('[DownloadService] Init failed:', err);
    }
  },

  subscribe(listener: Listener) {
    _listeners.push(listener);
    listener([..._downloads]);
    return () => {
      _listeners = _listeners.filter((l) => l !== listener);
    };
  },

  getDownloads() {
    return [..._downloads];
  },

  async addDownload(url: string, presetId: string) {
    const id = Date.now().toString();
    const preset = FORMAT_PRESETS[presetId as keyof typeof FORMAT_PRESETS] ?? FORMAT_PRESETS.mp4_720p;

    const item: DownloadItem = {
      id,
      url,
      title: 'Fetching info…',
      progress: 0,
      status: 'pending',
      preset,
      createdAt: Date.now(),
    };

    _downloads = [item, ..._downloads];
    notify();

    // Kick off async — don't await so the UI stays responsive
    _runDownload(id, url, presetId).catch((err) => {
      console.error('[DownloadService] Unhandled error:', err);
      update(id, { status: 'failed', error: String(err) });
    });

    return id;
  },

  async pauseDownload(id: string) {
    const resumable = _activeDownloads.get(id);
    if (resumable) {
      await resumable.pauseAsync();
      update(id, { status: 'paused', speed: undefined });
    }
  },

  async resumeDownload(id: string) {
    const resumable = _activeDownloads.get(id);
    if (resumable) {
      update(id, { status: 'downloading' });
      resumable.resumeAsync();
    }
  },

  removeDownload(id: string) {
    const item = _downloads.find(d => d.id === id);
    if (item?.localUri) {
      FileSystem.deleteAsync(item.localUri, { idempotent: true }).catch(err => {
        console.warn('[DownloadService] Failed to delete local file:', err);
      });
    }

    const resumable = _activeDownloads.get(id);
    if (resumable) resumable.cancelAsync();
    _activeDownloads.delete(id);
    _downloads = _downloads.filter((d) => d.id !== id);
    notify();
  },
};

// ─── Core download orchestration ──────────────────────────────────────────────
async function _runDownload(id: string, url: string, presetId: string) {
  // Step 1: Resolve stream URLs locally via ClientDownloader
  update(id, { status: 'fetching_info' });

  let streamInfo;
  let cdnUrl: string;

  try {
    console.log('[DownloadService] Extracting formats client-side...');
    const info = await ClientDownloader.getInfo(url);
    if (!info) throw new Error('Failed to extract media info');

    const isAudio = presetId.includes('audio');
    streamInfo = { 
      title: info.title, 
      thumbnail: info.thumbnail, 
      ext: isAudio ? 'mp3' : 'mp4' 
    };

    const resolvedUrl = await ClientDownloader.getDownloadUrl(url, isAudio ? 'audio' : 'video');
    if (!resolvedUrl) throw new Error('Failed to resolve direct CDN URL');
    cdnUrl = resolvedUrl;
    
    console.log('[DownloadService] Successfully resolved stream');
  } catch (err: any) {
    const errorMsg = err.message ?? 'Network error';
    console.log('[DownloadService] Error:', errorMsg);
    update(id, { status: 'failed', error: `Failed: ${errorMsg}` });
    return;
  }

  update(id, {
    title: streamInfo.title,
    thumbnail: streamInfo.thumbnail,
    needsMerge: false,
    status: 'downloading',
    progress: 0,
  });

  const cacheDir = FileSystem.cacheDirectory + `downlink_${id}/`;
  await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });

  try {
    let finalUri: string;

    // Step 2: Download directly from CDN to local cache
    const filePath = cacheDir + `media.${streamInfo.ext}`;
    await _downloadFile(id, cdnUrl, filePath, 0, 95);
    finalUri = filePath;

    // Step 3: Save to permanent storage AND gallery
    update(id, { status: 'saving', progress: 97 });

    const downlinkDir = await DownlinkFileSystem.initialize();
    const fileName = `${id}_${streamInfo.title.replace(/[^a-z0-9]/gi, '_').substring(0, 50)}.${streamInfo.ext}`;
    const permanentPath = downlinkDir + fileName;

    // Copy from cache to permanent storage
    await FileSystem.copyAsync({ from: finalUri, to: permanentPath });

    // Also save to gallery for user convenience
    const { status: permStatus } = await MediaLibrary.requestPermissionsAsync();
    if (permStatus === 'granted') {
      try {
        await MediaLibrary.createAssetAsync(permanentPath);
      } catch (galleryErr) {
        console.warn('[DownloadService] Failed to save to gallery:', galleryErr);
      }
    }

    // Clean up cache
    await FileSystem.deleteAsync(cacheDir, { idempotent: true });

    update(id, {
      status: 'completed',
      progress: 100,
      localUri: permanentPath, // Use the stable file:// URI
      speed: undefined,
      eta: undefined,
    });
  } catch (err: any) {
    await FileSystem.deleteAsync(cacheDir, { idempotent: true }).catch(() => { });
    update(id, { status: 'failed', error: err.message ?? 'Download failed' });
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function _downloadFile(
  id: string,
  cdnUrl: string,
  localPath: string,
  progressStart: number,
  progressEnd: number,
) {
  const range = progressEnd - progressStart;

  const resumable = FileSystem.createDownloadResumable(
    cdnUrl,
    localPath,
    {},
    (downloadProgress) => {
      const { totalBytesWritten, totalBytesExpectedToWrite } = downloadProgress;
      if (totalBytesExpectedToWrite > 0) {
        const pct =
          progressStart + (totalBytesWritten / totalBytesExpectedToWrite) * range;
        const speed = _formatBytes(totalBytesWritten) + '/s'; // rough approximation
        update(id, {
          progress: Math.min(pct, progressEnd),
          speed,
          eta: undefined,
        });
      }
    },
  );

  _activeDownloads.set(id, resumable);
  const result = await resumable.downloadAsync();
  _activeDownloads.delete(id);

  if (!result?.uri) throw new Error('Download returned no URI');
  return result.uri;
}

function _formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
