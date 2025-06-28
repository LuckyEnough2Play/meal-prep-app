'use client';

import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';

interface Nutrition {
  calories?: number;
  [key: string]: number | undefined;
}

interface CartItem {
  id: string;
  name: string;
  nutrition?: Nutrition;
}

export default function CartPage() {
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/signin');
      return;
    }
    fetch(`/api/cart?userId=${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setItems(data.items || []);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [user, router]);

  if (loading) {
    return <div className="p-8 text-center">Loading cart...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-600">Error: {error}</div>;
  }
  if (!items.length) {
    return <div className="p-8 text-center">Your cart is empty.</div>;
  }

  return (
    <div className="max-w-lg mx-auto p-8">
      <h1 className="text-2xl font-semibold mb-4">Your Cart</h1>
      <ul className="space-y-4">
        {items.map(item => (
          <li key={item.id} className="border rounded p-4">
            <h2 className="text-lg font-medium">{item.name}</h2>
            {item.nutrition?.calories != null && (
              <p className="text-sm text-gray-600">
                Calories: {item.nutrition.calories}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

