/**
 * Handles user's cart operations.
 *
 * GET  /api/cart?userId={userId}
 *   - Retrieves current cart items for the user.
 * POST /api/cart
 *   - Body: { userId: string, mealId: string }
 *   - Adds the specified meal to the user's cart (creates cart if none).
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../services/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId, mealId } = req.method === 'GET' ? req.query : req.body;
  if (!userId || Array.isArray(userId)) {
    return res.status(400).json({ error: 'Missing or invalid userId' });
  }

  if (req.method === 'POST') {
    if (!mealId || typeof mealId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid mealId' });
    }
    // Fetch or create cart
    const { data: existing, error: fetchError } = await supabase
      .from('carts')
      .select('id, meals')
      .eq('user_id', userId)
      .single();
    if (fetchError && fetchError.code !== 'PGRST116') {
      return res.status(500).json({ error: fetchError.message });
    }
    if (existing) {
      const updatedMeals = Array.from(new Set([...(existing.meals || []), mealId]));
      const { error: updateError } = await supabase
        .from('carts')
        .update({ meals: updatedMeals })
        .eq('id', existing.id);
      if (updateError) {
        return res.status(500).json({ error: updateError.message });
      }
    } else {
      const { error: insertError } = await supabase
        .from('carts')
        .insert({ user_id: userId, meals: [mealId] });
      if (insertError) {
        return res.status(500).json({ error: insertError.message });
      }
    }
    return res.status(200).json({ success: true });
  }

  if (req.method === 'GET') {
    // Fetch user's cart
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('meals')
      .eq('user_id', userId)
      .single();
    if (cartError && cartError.code !== 'PGRST116') {
      return res.status(500).json({ error: cartError.message });
    }
    const mealIds: string[] = cart?.meals || [];
    // Fetch meal details
    const { data: items, error: mealsError } = await supabase
      .from('meals')
      .select('id, name, nutrition')
      .in('id', mealIds);
    if (mealsError) {
      return res.status(500).json({ error: mealsError.message });
    }
    return res.status(200).json({ items });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
