const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Adjusted path for standalone seed: ensure services path
async function seedIngredients() {
  try {
    const dataPath = path.resolve(__dirname, '../data/ingredients.json');
    if (!fs.existsSync(dataPath)) {
      console.error('ingredients.json not found in data/. Run extract and parse scripts first.');
      process.exit(1);
    }
    const raw = fs.readFileSync(dataPath, 'utf8');
    const ingredients = JSON.parse(raw);

    const { data, error } = await supabase
      .from('ingredients')
      .upsert(ingredients, { onConflict: 'code' })
      .select();

    if (error) {
      console.error('Error seeding ingredients:', error);
      process.exit(1);
    }
    console.log(`Seeded ${Array.isArray(data) ? data.length : 0} ingredients successfully.`);
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

seedIngredients();
