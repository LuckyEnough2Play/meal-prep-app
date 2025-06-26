import fs from 'fs';
import path from 'path';
import { supabase } from '../services/supabaseClient';

interface Ingredient {
  code: string;
  name: string;
}

async function seedIngredients() {
  try {
    const dataPath = path.resolve(process.cwd(), 'data', 'ingredients.json');
    if (!fs.existsSync(dataPath)) {
      console.error('ingredients.json not found in data/. Run extract and parse scripts first.');
      process.exit(1);
    }
    const raw = fs.readFileSync(dataPath, 'utf8');
    const ingredients = JSON.parse(raw);

    const { data, error } = await supabase
      .from('ingredients')
      .insert<Ingredient>(ingredients);

    if (error) {
      console.error('Error seeding ingredients:', error);
      process.exit(1);
    }
    console.log(`Seeded ${ingredients.length} ingredients successfully.`);
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

seedIngredients();
