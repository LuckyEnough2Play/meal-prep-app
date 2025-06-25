package models

import (
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// Recipe represents a recipe with ingredients and instructions.
type Recipe struct {
	gorm.Model
	Name         string         `gorm:"type:varchar(255);not null"`
	Ingredients  datatypes.JSON `gorm:"type:jsonb;not null"`
	Instructions string         `gorm:"type:text"`
}
