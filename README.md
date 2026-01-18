<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1YV77jUp0npg-oe28tXvtfUK0ZeETMIqj
  
## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deployment

This project is configured to deploy to GitHub Pages automatically using GitHub Actions.

1.  Push your changes to the `main` branch.
2.  The "Deploy to GitHub Pages" action will trigger automatically.
3.  Once completed, your app will be live at the URL provided in the GitHub Action run summary.

### Manual Deployment

To build the project locally:

```bash
npm run build
```

The output will be in the `dist` directory.
