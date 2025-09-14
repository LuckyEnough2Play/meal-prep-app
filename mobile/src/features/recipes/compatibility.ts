import type { Recipe, UserProfile } from '@/models/types';

export type Compatibility = {
  hardExcluded: boolean;
  reasons: string[];
  score: number; // 0..100
};

export function evaluateCompatibility(r: Recipe, p: UserProfile | null): Compatibility {
  if (!p) return { hardExcluded: false, reasons: [], score: 50 };
  const reasons: string[] = [];
  const allergies = new Set((p.allergies || []).map((s) => s.toLowerCase()));
  const dislikes = new Set((p.dislikes || []).map((s) => s.toLowerCase()));

  // Hard exclude if allergens overlap recipe allergens keywords
  const recipeAllergens = (r.allergens || []).map((s) => s.toLowerCase());
  for (const a of recipeAllergens) {
    if (allergies.has(a)) {
      reasons.push(`Allergen: ${a}`);
      return { hardExcluded: true, reasons, score: 0 };
    }
  }

  // Deduct points for dislikes appearing in ingredients or tags
  let score = 90;
  const ingNames = (r.ingredients || []).map((i) => (i.name || '').toLowerCase());
  for (const d of dislikes) {
    if (ingNames.some((n) => n.includes(d)) || (r.tags || []).some((t) => t.toLowerCase().includes(d))) {
      reasons.push(`Dislike: ${d}`);
      score -= 20;
    }
  }

  // If dietTypes are set, lightly penalize mismatch
  const userDiets = new Set((p.dietTypes || []).map((s: any) => String(s).toLowerCase()));
  const recipeDiets = new Set((r.dietTypes || []).map((s) => s.toLowerCase()));
  if (userDiets.size > 0 && recipeDiets.size > 0) {
    let overlap = false;
    for (const d of userDiets) if (recipeDiets.has(d)) overlap = true;
    if (!overlap) {
      reasons.push('Diet mismatch');
      score -= 15;
    }
  }

  score = Math.max(0, Math.min(100, score));
  return { hardExcluded: false, reasons, score };
}

