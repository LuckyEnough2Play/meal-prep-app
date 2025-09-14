import type { Recipe } from '@/models/types';

export const STARTER_RECIPES: Recipe[] = [
  {
    id: 'r-chicken-broccoli-rice',
    name: 'Chicken, Broccoli & Rice Bowl',
    ingredients: [
      { name: 'Chicken breast', qty: 1, unit: 'lb' },
      { name: 'Broccoli', qty: 2, unit: 'heads' },
      { name: 'Rice', qty: 1, unit: 'lb' },
      { name: 'Olive oil', qty: 2, unit: 'tbsp' },
      { name: 'Salt', qty: 1, unit: 'tsp' }
    ],
    instructions: 'Cook rice. Sauté chicken. Steam broccoli. Combine and season.',
    tags: ['quick'],
    dietTypes: [],
    allergens: []
  },
  {
    id: 'r-veggie-stirfry',
    name: 'Veggie Stir-fry',
    ingredients: [
      { name: 'Mixed vegetables', qty: 4, unit: 'cups' },
      { name: 'Soy sauce (gluten-free optional)', qty: 3, unit: 'tbsp' },
      { name: 'Tofu', qty: 14, unit: 'oz' },
      { name: 'Garlic', qty: 3, unit: 'cloves' }
    ],
    instructions: 'Stir-fry veggies and tofu; add sauce; serve over rice.',
    tags: ['vegan'],
    dietTypes: ['vegan'],
    allergens: ['soy']
  },
  {
    id: 'r-beef-taco-salad',
    name: 'Beef Taco Salad',
    ingredients: [
      { name: 'Ground beef', qty: 1, unit: 'lb' },
      { name: 'Lettuce', qty: 1, unit: 'head' },
      { name: 'Tomato', qty: 2, unit: 'pc' },
      { name: 'Cheddar cheese', qty: 1, unit: 'cup' },
      { name: 'Taco seasoning', qty: 1, unit: 'pkt' }
    ],
    instructions: 'Brown beef with seasoning. Assemble salad and top with cheese.',
    tags: ['low-carb'],
    dietTypes: [],
    allergens: ['dairy']
  }
];

