# Downlink Hybrid MovieBox Pivot Design

## Overview
Downlink is pivoting from a pure utility video downloader into a high-retention hybrid entertainment app. The app will feature a Netflix-style streaming catalog (similar to MovieBox) combined with a robust, dedicated client-side downloader tool for extracting videos from social platforms via direct URLs.

## Core Purpose & Philosophy
To bypass draconian App Store reviews and data-center IP blocks while providing a seamless, highly engaging media consumption experience.
- **App Store Stealth (The Extension Strategy):** The app ships completely devoid of copyrighted media. Users must "connect a provider URL" during onboarding to populate the movie catalog.
- **Downloader Reliability (Client-side JS):** The YouTube/Social downloader component no longer relies on a backend proxy, shifting execution to the client-side to utilize residential IPs.

## Architecture

### 1. Frontend: Expo / React Native
- **Framework:** Expo Router (Bottom Tabs navigation).
- **Styling:** NativeWind v4 (Tailwind CSS) enforcing the existing ultra-premium, dark, glassmorphic aesthetic.
- **Tab Structure:**
  - `Home`: Curated feeds (Trending Movies, Popular Shows, New Releases).
  - `Search`: Real-time query search against the aggregated catalog.
  - `Downloader`: The legacy utility tool. Users paste a link here to download media using a client-side JS implementation (e.g., `react-native-ytdl`).
  - `Library`: Watch history, saved movies, and downloaded local files.
- **State & Storage:** Zustand or Context for state. Expo File System for local storage.

### 2. Backend: Golang API
- **Framework:** Go standard library or Gin/Fiber.
- **Primary Function:** A high-concurrency scraping and metadata aggregation engine.
- **Scraping Engine:** Scrapes target streaming sites on-the-fly to extract raw `.mp4` or `.m3u8` video stream URLs when requested by the client.
- **Metadata Integration:** Connects to the TMDB API to fetch high-resolution posters, backdrops, cast information, and episode lists.
- **Caching:** Redis (or in-memory Go maps) to cache TMDB responses and scraped stream URLs to ensure the mobile app feels instantaneous.

## Data Flow & User Journey
1. **Onboarding:** User downloads the "Media Hub" from the App Store. The app is empty. The user is prompted to paste a Content Provider URL (which points to our Go backend).
2. **Catalog Load:** The app fetches the home feed JSON from the Go API. The UI renders the glassmorphic MovieBox interface.
3. **Playback:** User taps a movie. The app requests the stream URL from the Go API. The Go API concurrently scrapes the target source and returns the `.m3u8` link. The app plays the video using `expo-av` or `react-native-video`.
4. **Standalone Download:** User pastes a TikTok/YouTube link into the Downloader tab. The client-side JS library resolves the link and downloads the file locally via `expo-file-system`.

## Constraints & Trade-offs
- **JS Extractor Maintenance:** The client-side downloader relies on open-source libraries that must be updated via EAS OTA when platforms change their signatures.
- **Scraper Fragility:** The Go backend must actively maintain its scraping logic if the target source sites change their DOM structures.

## Verification & Testing
- Deploy the Go API and verify successful `.m3u8` extraction.
- Compile an iOS simulator build and ensure the TMDB metadata renders correctly in the new UI.
- Test the App Store "Empty State" without providing the API URL.
