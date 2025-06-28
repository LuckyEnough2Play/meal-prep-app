import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../services/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;
  if (!userId || Array.isArray(userId)) {
    return res.status(400).json({ error: 'Missing or invalid userId' });
  }

  // Fetch user's past carts
  const { data: carts, error: cartError } = await supabase
    .from('carts')
    .select('meals, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (cartError) {
    return res.status(500).json({ error: cartError.message });
  }

  // For each cart, fetch meal details including instructions
  const history = await Promise.all(
    (carts || []).map(async cart => {
      const mealIds: string[] = cart.meals || [];
      const { data: items, error: mealsError } = await supabase
        .from('meals')
        .select('id, name, instructions')
        .in('id', mealIds);
      if (mealsError) {
        throw new Error(mealsError.message);
      }
      return {
        created_at: cart.created_at,
        meals: items || []
      };
    })
  );

  res.status(200).json(history);
}
