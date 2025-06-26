const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

async function extractText() {
  const pdfPath = path.resolve(__dirname, '../Gravity_Transformation_Recipe_Book.pdf');
  const dataBuffer = fs.readFileSync(pdfPath);
  try {
    const data = await pdf(dataBuffer);
    const outDir = path.resolve(__dirname, '../data');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir);
    }
    fs.writeFileSync(path.join(outDir, 'recipeBook.txt'), data.text, 'utf8');
    console.log('Recipe text extracted to data/recipeBook.txt');
  } catch (err) {
    console.error('Error parsing PDF:', err);
    process.exit(1);
  }
}

extractText();
