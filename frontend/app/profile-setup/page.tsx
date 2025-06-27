'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useRouter } from 'next/navigation';

export default function ProfileSetupPage() {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [allergies, setAllergies] = useState('');
  const [dietary, setDietary] = useState('');
  const [budget, setBudget] = useState<number | ''>('');
  const [mealSizes, setMealSizes] = useState('');
  const [dietTypes, setDietTypes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Redirect if not signed in
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/signin');
      }
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    const profile = {
      user_id: user.id,
      name,
      location,
      allergies: allergies.split(',').map(s => s.trim()),
      dietary_restrictions: dietary.split(',').map(s => s.trim()),
      budget: typeof budget === 'number' ? budget : parseFloat(budget),
      meal_sizes: mealSizes,
      diet_types: dietTypes.split(',').map(s => s.trim())
    };

    const { error: dbError } = await supabase
      .from('profiles')
      .upsert(profile);

    setLoading(false);
    if (dbError) {
      setError(dbError.message);
    } else {
      router.push('/vendor-selection');
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6">
      <h1 className="text-2xl font-bold mb-4">Complete Your Profile</h1>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full border p-2"
          required
        />
        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={e => setLocation(e.target.value)}
          className="w-full border p-2"
          required
        />
        <input
          type="text"
          placeholder="Allergies (comma-separated)"
          value={allergies}
          onChange={e => setAllergies(e.target.value)}
          className="w-full border p-2"
        />
        <input
          type="text"
          placeholder="Dietary Restrictions (comma-separated)"
          value={dietary}
          onChange={e => setDietary(e.target.value)}
          className="w-full border p-2"
        />
        <input
          type="number"
          placeholder="Budget"
          value={budget}
          onChange={e =>
            setBudget(e.target.value === '' ? '' : Number(e.target.value))
          }
          className="w-full border p-2"
        />
        <input
          type="text"
          placeholder="Meal Sizes"
          value={mealSizes}
          onChange={e => setMealSizes(e.target.value)}
          className="w-full border p-2"
        />
        <input
          type="text"
          placeholder="Diet Types (comma-separated)"
          value={dietTypes}
          onChange={e => setDietTypes(e.target.value)}
          className="w-full border p-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded"
        >
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}
