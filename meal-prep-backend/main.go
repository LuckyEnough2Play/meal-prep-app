package main

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"strconv"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

type ProfileData struct {
	GroceryStore  string `json:"groceryStore"`
	MealsPerWeek  int    `json:"mealsPerWeek"`
	PeoplePerMeal int    `json:"peoplePerMeal"`
	Allergies     string `json:"allergies"`
	PriceLimit    int    `json:"priceLimit"`
}

type OpenAIRequest struct {
	Model       string          `json:"model"`
	Messages    []OpenAIMessage `json:"messages"`
	Temperature float64         `json:"temperature"`
}

type OpenAIMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type OpenAIResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

func main() {
	// Load environment variables
	_ = godotenv.Load()
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		panic("OPENAI_API_KEY not set in environment")
	}

	r := gin.Default()
	// Configure CORS (development default; allow all)
	r.Use(cors.Default())

	r.POST("/api/mealplan", func(c *gin.Context) {
		var profile ProfileData
		if err := c.ShouldBindJSON(&profile); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
			return
		}

		prompt := formatPrompt(profile)
		mealPlan, err := callOpenAI(apiKey, prompt)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		// Return the raw JSON from GPT (as string)
		c.Data(http.StatusOK, "application/json", mealPlan)
	})

	r.Run(":8080")
}

func formatPrompt(profile ProfileData) string {
	return `
You are a meal planning assistant. Create a weekly meal plan for a household with these preferences:
- Grocery store: ` + profile.GroceryStore + `
- Meals per week: ` + itoa(profile.MealsPerWeek) + `
- People per meal: ` + itoa(profile.PeoplePerMeal) + `
- Allergies: ` + ifEmpty(profile.Allergies, "None") + `
- Price limit per person: $` + itoa(profile.PriceLimit) + `

Return the plan as a JSON object with days, meal names, ingredients, instructions, and estimated cost per meal.
`
}

func itoa(i int) string {
	return strconv.Itoa(i)
}

func ifEmpty(s, fallback string) string {
	if s == "" {
		return fallback
	}
	return s
}

func callOpenAI(apiKey, prompt string) ([]byte, error) {
	reqBody := OpenAIRequest{
		Model:       "gpt-3.5-turbo",
		Messages:    []OpenAIMessage{{Role: "user", Content: prompt}},
		Temperature: 0.7,
	}
	bodyBytes, _ := json.Marshal(reqBody)

	req, err := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(bodyBytes))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(resp.Body)
		return nil, &OpenAIError{Status: resp.StatusCode, Body: string(b)}
	}

	var openaiResp OpenAIResponse
	if err := json.NewDecoder(resp.Body).Decode(&openaiResp); err != nil {
		return nil, err
	}
	if len(openaiResp.Choices) == 0 {
		return nil, &OpenAIError{Status: http.StatusInternalServerError, Body: "No choices returned"}
	}
	// The content is a JSON string, return as []byte
	return []byte(openaiResp.Choices[0].Message.Content), nil
}

type OpenAIError struct {
	Status int
	Body   string
}

func (e *OpenAIError) Error() string {
	return "OpenAI API error: " + e.Body
}
