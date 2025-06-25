package models

import "gorm.io/gorm"

// VendorSelection represents a user’s selected grocery vendor.
type VendorSelection struct {
	gorm.Model
	UserID     uint   `gorm:"not null;index"`
	VendorName string `gorm:"type:varchar(100);not null"`
}
