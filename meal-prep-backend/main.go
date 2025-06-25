package main

import (
	"log"

	"github.com/LuckyEnough2Play/meal-prep-app/meal-prep-backend/api"
)

func main() {
	// Set up router with all routes and middleware
	router := api.SetupRouter()

	// Start server
	if err := router.Run(":8080"); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}
