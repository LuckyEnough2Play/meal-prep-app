package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/LuckyEnough2Play/meal-prep-app/meal-prep-backend/models"
)

// ProfileRequest is the payload for updating a user profile.
type ProfileRequest struct {
	Diet        string   `json:"diet"`
	Allergies   string   `json:"allergies"`
	Budget      int      `json:"budget"`
	PortionSize int      `json:"portionSize"`
	Vendors     []string `json:"vendors"`
}

// GetProfileHandler returns the user's profile and selected vendors.
func GetProfileHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetUint("userID")

		var profile models.Profile
		if err := db.Where("user_id = ?", userID).First(&profile).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				// No profile yet, return empty
				c.JSON(http.StatusOK, gin.H{"profile": nil, "vendors": []string{}})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		var selections []models.VendorSelection
		if err := db.Where("user_id = ?", userID).Find(&selections).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		vendors := make([]string, len(selections))
		for i, sel := range selections {
			vendors[i] = sel.VendorName
		}

		c.JSON(http.StatusOK, gin.H{"profile": profile, "vendors": vendors})
	}
}

// UpdateProfileHandler creates or updates the user's profile and vendor selections.
func UpdateProfileHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetUint("userID")
		var req ProfileRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Upsert profile
		profile := models.Profile{UserID: userID}
		if err := db.Where("user_id = ?", userID).FirstOrCreate(&profile).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		profile.Diet = req.Diet
		profile.Allergies = req.Allergies
		profile.Budget = req.Budget
		profile.PortionSize = req.PortionSize
		if err := db.Save(&profile).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Replace vendor selections
		if err := db.Where("user_id = ?", userID).Delete(&models.VendorSelection{}).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		for _, name := range req.Vendors {
			vs := models.VendorSelection{UserID: userID, VendorName: name}
			if err := db.Create(&vs).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		}

		c.JSON(http.StatusOK, gin.H{"message": "Profile updated"})
	}
}
