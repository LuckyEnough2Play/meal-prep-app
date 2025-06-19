# Meal Prep App

This project is deployed on Vercel. Use the live app at:

https://meals.luckandloot.gg

## Deployment

All environment variables (including the OpenAI API key) are configured in Vercel’s dashboard. Vercel serves the static export from the `dist/` directory.

To deploy changes, commit and push to the main branch and Vercel will rebuild and publish automatically.


### PowerShell
```powershell
git add .
git commit -m "Update vercel config for correct outputDirectory"
git push origin meal-prep-app
```


## Source

Frontend code is hosted in this repository. Pull requests and issues are welcome via GitHub.
