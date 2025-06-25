package models

import "gorm.io/gorm"

// Profile stores dietary preferences for a user.
type Profile struct {
	gorm.Model
	UserID      uint   `gorm:"not null;index"`
	Diet        string `gorm:"type:varchar(100)"`
	Allergies   string `gorm:"type:text"`
	Budget      int    `gorm:"not null"`
	PortionSize int    `gorm:"not null"`
}
