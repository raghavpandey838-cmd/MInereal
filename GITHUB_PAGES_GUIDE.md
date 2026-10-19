# Deploying Minecraft Web Edition to GitHub Pages

If your website previously showed a **blank white page** on GitHub Pages, this happens because GitHub Pages was serving uncompiled TypeScript/JSX source code or asset paths without the built `dist/` directory.

We have fully fixed and prepared the repository with:
1. **Automated GitHub Actions workflow** (`.github/workflows/deploy.yml`): Builds and publishes the compiled app automatically whenever you push code.
2. **Relative asset paths (`base: './'`)** in `vite.config.ts`: Ensures all scripts and stylesheets load properly on `https://<username>.github.io/<repo-name>/`.
3. **`.nojekyll` file in `public/`**: Prevents GitHub Pages' Jekyll generator from blocking asset files.
4. **`404.html` SPA routing support in `public/`**: Prevents 404 errors when reloading pages.
5. **Dark theme inline fallback & ErrorBoundary**: Ensures the screen never goes blank white.

---

## Method 1: Automatic Deployment with GitHub Actions (Recommended)

This is the easiest and most modern method. No command-line deployment needed.

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "Configure GitHub Pages deployment"
   git push origin main
   ```
2. On GitHub, navigate to your repository:
   - Click on **Settings** (top navigation tab).
   - In the left sidebar, click on **Pages**.
   - Under **Build and deployment** &rarr; **Source**, select **GitHub Actions** from the dropdown menu (instead of "Deploy from a branch").
3. That's it! GitHub will now automatically run the workflow in `.github/workflows/deploy.yml`, build the game, and publish it to:
   `https://<your-username>.github.io/<your-repo-name>/`
4. You can see the live deployment progress anytime under the **Actions** tab of your repository.

---

## Method 2: One-Command CLI Deployment (`gh-pages`)

If you prefer to deploy directly from your local terminal:

1. Run the deploy command:
   ```bash
   npm run deploy
   ```
   *(This automatically builds the project into `dist/` and pushes it to a `gh-pages` branch).*
2. Go to **Settings** &rarr; **Pages** in your GitHub repository.
3. Under **Source**, select **Deploy from a branch**.
4. Choose the **gh-pages** branch and **/ (root)** folder, then click **Save**.
5. Your game will be live within 1–2 minutes!
