package api

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/provleon/downlink-api/internal/extractor"
	"github.com/provleon/downlink-api/internal/scraper"
	"github.com/provleon/downlink-api/internal/tmdb"
)

// RegisterRoutes sets up the routing for the API
func RegisterRoutes(g *echo.Group) {
	g.GET("/catalog", getCatalog)
	g.GET("/search", searchCatalog)
	g.GET("/stream", getStream)
	g.GET("/extract", extractMedia)
}

func extractMedia(c echo.Context) error {
	url := c.QueryParam("url")
	if url == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "url parameter is required"})
	}

	info, err := extractor.ExtractInfo(url)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, info)
}

func getCatalog(c echo.Context) error {
	trending, err := tmdb.GetTrendingMovies()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	newReleases, err := tmdb.GetNewReleases()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"trending":     trending,
		"new_releases": newReleases,
	})
}

func searchCatalog(c echo.Context) error {
	query := c.QueryParam("q")
	if query == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "query parameter 'q' is required"})
	}

	results, err := tmdb.SearchMovies(query)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"query":   query,
		"results": results,
	})
}

func getStream(c echo.Context) error {
	id := c.QueryParam("id")
	if id == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "movie 'id' is required"})
	}

	sources, err := scraper.ScrapeMovie(id)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"id":      id,
		"sources": sources,
	})
}
