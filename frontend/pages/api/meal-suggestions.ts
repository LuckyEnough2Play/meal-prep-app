/**
 * GET /api/meal-suggestions?userId={userId}
 * Returns sorted list of meal suggestions filtered by user profile:
 *  - Excludes meals conflicting with dietary restrictions.
 *  - Placeholder savings calculation (to be enhanced with deals).
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../services/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;
  if (!userId || Array.isArray(userId)) {
    return res.status(400).json({ error: 'Missing or invalid userId' });
  }

  // Fetch user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (profileError || !profile) {
    return res.status(500).json({ error: profileError?.message || 'Unable to fetch profile' });
  }

  // Fetch all meals
  const { data: meals, error: mealsError } = await supabase
    .from('meals')
    .select('*');

  if (mealsError) {
    return res.status(500).json({ error: mealsError.message });
  }

  // Filter meals by dietary restrictions
  const filteredMeals = (meals || []).filter(meal => {
    const tags: string[] = meal.tags || [];
    if (profile.dietary_restrictions?.length) {
      if (profile.dietary_restrictions.some((dr: string) => !tags.includes(dr))) {
        return false;
      }
    }
    return true;
  });

  // Compute placeholder savings (integrate deals next)
  const suggestions = filteredMeals.map(meal => ({
    ...meal,
    savings: 0
  }));

  // Sort by savings descending
  suggestions.sort((a, b) => (b.savings || 0) - (a.savings || 0));

  res.status(200).json(suggestions);
}
