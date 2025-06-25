package api

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"os/exec"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/LuckyEnough2Play/meal-prep-app/meal-prep-backend/models"
)

// GetDealsHandler scrapes grocery deals based on client IP and selected vendors.
func GetDealsHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Determine client IP for geolocation
		ip := c.ClientIP()

		// Geolocation lookup
		apiKey := os.Getenv("GEO_API_KEY")
		geoURL := fmt.Sprintf("https://api.freegeoip.app/json/%s?apikey=%s", ip, apiKey)
		resp, err := http.Get(geoURL)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to geolocate IP"})
			return
		}
		defer resp.Body.Close()

		body, _ := ioutil.ReadAll(resp.Body)
		var geoData struct {
			Postal string `json:"postal_code"`
		}
		json.Unmarshal(body, &geoData)
		zip := geoData.Postal

		// Retrieve vendor selections for the user
		userID := c.GetUint("userID")
		var selections []models.VendorSelection
		if err := db.Where("user_id = ?", userID).Find(&selections).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Aggregate deals
		allDeals := []map[string]interface{}{}
		for _, sel := range selections {
			// Determine scraper script path from environment variable
			envVar := strings.ToUpper(strings.ReplaceAll(sel.VendorName, " ", "_")) + "_SCRAPER_PATH"
			script := os.Getenv(envVar)
			if script == "" {
				continue
			}

			// Execute Python scraper
			output, err := exec.Command("python", script, zip).Output()
			if err != nil {
				continue
			}

			var deals []map[string]interface{}
			if err := json.Unmarshal(output, &deals); err != nil {
				continue
			}
			allDeals = append(allDeals, deals...)
		}

		c.JSON(http.StatusOK, gin.H{"deals": allDeals})
	}
}
