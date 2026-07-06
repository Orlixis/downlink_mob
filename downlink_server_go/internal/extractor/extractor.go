package extractor

import (
	"context"
	"encoding/json"
	"fmt"
	"os/exec"
	"time"
)

type ExtractedInfo struct {
	Title     string `json:"title"`
	Thumbnail string `json:"thumbnail"`
	VideoURL  string `json:"video_url"`
	AudioURL  string `json:"audio_url"`
}

type ytdlpFormat struct {
	Ext      string `json:"ext"`
	Vcodec   string `json:"vcodec"`
	Acodec   string `json:"acodec"`
	Protocol string `json:"protocol"`
	URL      string `json:"url"`
}

type ytdlpInfo struct {
	Title     string        `json:"title"`
	Thumbnail string        `json:"thumbnail"`
	Formats   []ytdlpFormat `json:"formats"`
}

// ExtractInfo extracts the best video and audio direct URLs from a given generic link using yt-dlp
func ExtractInfo(url string) (*ExtractedInfo, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, "yt-dlp", "-J", "--no-warnings", url)
	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("yt-dlp failed: %w", err)
	}

	var parsed ytdlpInfo
	if err := json.Unmarshal(output, &parsed); err != nil {
		return nil, fmt.Errorf("failed to parse yt-dlp output: %w", err)
	}

	info := &ExtractedInfo{
		Title:     parsed.Title,
		Thumbnail: parsed.Thumbnail,
	}

	for _, format := range parsed.Formats {
		isHttp := format.Protocol == "https" || format.Protocol == "http"
		if format.Ext == "mp4" && format.Vcodec != "none" && format.Acodec != "none" && isHttp {
			info.VideoURL = format.URL
			// Do not break, allow later (higher quality) formats to overwrite
		}
	}

	if info.VideoURL == "" {
		for _, format := range parsed.Formats {
			isHttp := format.Protocol == "https" || format.Protocol == "http"
			if !isHttp {
				continue
			}
			if format.Vcodec != "none" && format.Ext == "mp4" {
				info.VideoURL = format.URL
			}
			if format.Acodec != "none" && (format.Ext == "m4a" || format.Ext == "mp4") {
				info.AudioURL = format.URL
			}
		}
	}

	if info.VideoURL == "" {
		return nil, fmt.Errorf("could not find a valid direct video URL for this site")
	}

	return info, nil
}
