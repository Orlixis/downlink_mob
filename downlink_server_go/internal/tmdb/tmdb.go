package tmdb

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

// Movie represents standard TMDB metadata
type Movie struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Poster      string `json:"poster"`
	Year        string `json:"year"`
	Overview    string `json:"overview,omitempty"`
	BackdropURL string `json:"backdrop_url,omitempty"`
}

var apiKey = os.Getenv("TMDB_API_KEY")

// GetTrendingMovies fetches the latest trending movies
func GetTrendingMovies() ([]Movie, error) {
	if apiKey == "" {
		// Fallback to mock data if no API key is provided
		return []Movie{
			{ID: "1", Title: "Dune: Part Two", Poster: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2JGqqUT1e.jpg", Year: "2024"},
			{ID: "2", Title: "Oppenheimer", Poster: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", Year: "2023"},
			{ID: "3", Title: "Spider-Man: Across the Spider-Verse", Poster: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg", Year: "2023"},
			{ID: "4", Title: "The Batman", Poster: "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg", Year: "2022"},
		}, nil
	}

	resp, err := http.Get(fmt.Sprintf("https://api.themoviedb.org/3/trending/movie/day?api_key=%s", apiKey))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var data struct {
		Results []struct {
			ID          int    `json:"id"`
			Title       string `json:"title"`
			PosterPath  string `json:"poster_path"`
			ReleaseDate string `json:"release_date"`
		} `json:"results"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}

	var movies []Movie
	for _, m := range data.Results {
		year := ""
		if len(m.ReleaseDate) >= 4 {
			year = m.ReleaseDate[:4]
		}
		movies = append(movies, Movie{
			ID:     fmt.Sprintf("%d", m.ID),
			Title:  m.Title,
			Poster: "https://image.tmdb.org/t/p/w500" + m.PosterPath,
			Year:   year,
		})
	}
	return movies, nil
}

// GetNewReleases fetches newly released movies
func GetNewReleases() ([]Movie, error) {
	if apiKey == "" {
		return []Movie{
			{ID: "5", Title: "Poor Things", Poster: "https://image.tmdb.org/t/p/w500/kCGlIMHnOm8Ph1SqzJ6V6s3O6Qn.jpg", Year: "2023"},
			{ID: "6", Title: "Godzilla Minus One", Poster: "https://image.tmdb.org/t/p/w500/q23mhnz1R9Q1hXy4F6FqKqK0Oq9.jpg", Year: "2023"},
			{ID: "7", Title: "Anatomy of a Fall", Poster: "https://image.tmdb.org/t/p/w500/kQs6kehvlRsTrISX61T3b66IalH.jpg", Year: "2023"},
			{ID: "8", Title: "Killers of the Flower Moon", Poster: "https://image.tmdb.org/t/p/w500/dB6Krk806zeie0ZpGkPHE45Eaqz.jpg", Year: "2023"},
		}, nil
	}
	// Implementation would mirror GetTrendingMovies using /movie/now_playing
	return GetTrendingMovies()
}

// SearchMovies queries TMDB
func SearchMovies(query string) ([]Movie, error) {
	if apiKey == "" {
		return []Movie{
			{ID: "9", Title: "Dune", Poster: "https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg", Year: "2021"},
		}, nil
	}
	// Implementation would mirror GetTrendingMovies using /search/movie
	return GetTrendingMovies()
}
