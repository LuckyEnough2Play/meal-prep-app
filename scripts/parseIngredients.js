const fs = require('fs');
const path = require('path');

function parseIngredients() {
  const txtPath = path.resolve(__dirname, '../data/recipeBook.txt');
  if (!fs.existsSync(txtPath)) {
    console.error('Recipe text not found. Run extractRecipeText.js first.');
    process.exit(1);
  }
  const text = fs.readFileSync(txtPath, 'utf8');
  const lines = text.split('\n');

  const ingredients = [];
  let inSection = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (/^Ingredients$/i.test(line)) {
      inSection = true;
      continue;
    }
    if (/^Directions$/i.test(line)) {
      inSection = false;
      break;
    }
    if (inSection && line) {
      // Split on first numeric marker like "1." or "2)"
      const firstCol = line.split(/[0-9]+[).]/)[0].trim();
      if (firstCol) {
        ingredients.push(firstCol);
      }
    }
  }

  const outDir = path.resolve(__dirname, '../data');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir);
  }
  const outPath = path.join(outDir, 'ingredients.json');
  fs.writeFileSync(outPath, JSON.stringify(ingredients, null, 2), 'utf8');
  console.log(`Parsed ${ingredients.length} ingredients.`);
}

parseIngredients();
