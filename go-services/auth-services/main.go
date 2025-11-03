package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"auth-service/handlers"
	"auth-service/database"
)

func main() {
	// Initialize MongoDB
	database.ConnectDB()

	router := gin.Default()

	// CORS middleware
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		
		c.Next()
	})

	// Routes
	router.POST("/register", handlers.Register)
	router.POST("/login", handlers.Login)
	router.POST("/validate", handlers.ValidateToken)
	router.GET("/users", handlers.GetUsers)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8001"
	}

	log.Printf("Auth service running on port %s", port)
	log.Fatal(router.Run(":" + port))
}