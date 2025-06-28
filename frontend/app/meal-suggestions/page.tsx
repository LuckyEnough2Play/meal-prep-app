'use client';

import React, { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../../context/AuthContext';
import { SwipableMealTicket } from '../../components/SwipableMealTicket';

interface MealSuggestion {
  id: string;
  name: string;
  tags?: string[];
  savings?: number;
}

export default function MealSuggestionsPage() {
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/signin');
      return;
    }
    fetch(`/api/meal-suggestions?userId=${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setSuggestions(data);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [user, router]);

  const handleSwipeRight = async (mealId: string) => {
    if (!user) return;
    try {
      await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, mealId }),
      });
    } catch (err) {
      console.error('Cart add error', err);
    }
    setSuggestions(prev => prev.filter(m => m.id !== mealId));
  };

  const handleSwipeLeft = (mealId: string) => {
    // skip meal
    setSuggestions(prev => prev.filter(m => m.id !== mealId));
  };

  if (loading) {
    return <div className="p-8 text-center">Loading suggestions...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-600">Error: {error}</div>;
  }

  if (!suggestions.length) {
    return <div className="p-8 text-center">No more meal suggestions.</div>;
  }

  return (
    <div className="flex flex-col items-center p-8">
      {suggestions.map(meal => (
        <SwipableMealTicket
          key={meal.id}
          meal={meal}
          onSwipeRight={handleSwipeRight}
          onSwipeLeft={handleSwipeLeft}
        />
      ))}
    </div>
  );
}
