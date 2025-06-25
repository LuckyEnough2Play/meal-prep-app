package db

import (
	"os"

	"github.com/LuckyEnough2Play/meal-prep-app/meal-prep-backend/models"

	"github.com/joho/godotenv"
	log "github.com/sirupsen/logrus"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// InitDB loads environment variables, connects to PostgreSQL via GORM,
// performs automigrations, and returns the *gorm.DB instance.
func InitDB() *gorm.DB {
	if err := godotenv.Load(); err != nil {
		log.Warn("No .env file found, reading environment variables directly")
	}

	dsn := os.Getenv("DB_URL")
	if dsn == "" {
		log.Fatal("DB_URL not set in environment")
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}

	// Automigrate models
	if err := db.AutoMigrate(
		&models.User{},
		&models.Profile{},
		&models.VendorSelection{},
		&models.Recipe{},
	); err != nil {
		log.Fatalf("failed to auto-migrate models: %v", err)
	}

	return db
}
