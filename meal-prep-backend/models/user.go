package models

import "gorm.io/gorm"

// User represents an application user.
type User struct {
	gorm.Model
	Email        string `gorm:"uniqueIndex;not null"`
	PasswordHash string `gorm:"not null"`
}
