package api

import (
	"github.com/LuckyEnough2Play/meal-prep-app/meal-prep-backend/db"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

// SetupRouter initializes the Gin router, routes, middleware, and returns the engine.
func SetupRouter() *gin.Engine {
	// Load environment variables
	godotenv.Load()

	// Initialize DB
	dbConn := db.InitDB()

	// Create router
	r := gin.Default()
	r.Use(cors.Default())

	// Public routes
	r.POST("/api/signup", SignupHandler)
	r.POST("/api/login", LoginHandler)

	// Protected routes
	protected := r.Group("/api")
	protected.Use(AuthMiddleware())
	{
		protected.GET("/profile", GetProfileHandler(dbConn))
		protected.POST("/profile", UpdateProfileHandler(dbConn))
		protected.GET("/deals", GetDealsHandler(dbConn))
	}

	return r
}
