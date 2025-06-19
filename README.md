# Meal Prep App

This project is deployed on Vercel. Use the live app at:

https://meals.luckandloot.gg

## Deployment

All environment variables (including the OpenAI API key) are configured in Vercel’s dashboard. Vercel serves the static export from the `dist/` directory.

Local build:
```bash
npm install
npm run build
npx serve dist
```

PowerShell:
```powershell
# In PowerShell, chaining with `&&` is not supported.
# Run each command separately:
git add vercel.json package.json
git commit -m "chore: configure Vercel static-build to use 'dist' output directory"
git push origin meal-prep-app
```

## Source

Frontend and backend code are hosted in this repository. Pull requests and issues are welcome via GitHub.
