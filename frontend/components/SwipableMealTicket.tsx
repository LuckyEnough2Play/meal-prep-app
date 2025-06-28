'use client';

import React from 'react';
import { useSwipeable } from 'react-swipeable';

export interface SwipableMealTicketProps {
  meal: {
    id: string;
    name: string;
    instructions?: string;
    nutrition?: Record<string, any>;
    tags?: string[];
    savings?: number;
  };
  onSwipeRight: (mealId: string) => void;
  onSwipeLeft: (mealId: string) => void;
}

export const SwipableMealTicket: React.FC<SwipableMealTicketProps> = ({
  meal,
  onSwipeRight,
  onSwipeLeft,
}) => {
    const handlers = useSwipeable({
      onSwipedLeft: () => onSwipeLeft(meal.id),
      onSwipedRight: () => onSwipeRight(meal.id),
      preventScrollOnSwipe: true,
      trackMouse: true,
    });

  return (
    <div
      {...handlers}
      className="max-w-sm w-full bg-white rounded-lg shadow-md p-4 m-2 touch-pan-y"
    >
      <h2 className="text-xl font-semibold mb-2">{meal.name}</h2>
      {meal.tags && meal.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {meal.tags.map(tag => (
            <span key={tag} className="text-xs bg-gray-200 rounded px-2 py-1">
              {tag}
            </span>
          ))}
        </div>
      )}
      <p className="text-sm mb-2">
        Estimated savings: <strong>${meal.savings?.toFixed(2)}</strong>
      </p>
      <p className="text-sm text-gray-600">
        Swipe right to add to cart, left to skip.
      </p>
    </div>
  );
};
