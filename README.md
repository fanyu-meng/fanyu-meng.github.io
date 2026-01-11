# Personal Portfolio Website

A modern personal portfolio website built with React, TypeScript, and Vite.

## How can I edit this code?

There are several ways of editing your application.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will automatically trigger deployments on GitHub Pages.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

This project is configured for deployment on [GitHub Pages](https://pages.github.com/) with automatic deployments via GitHub Actions.

### Deploying to GitHub Pages

1. **Enable GitHub Pages:**
   - Go to your repository settings on GitHub
   - Navigate to "Pages" in the left sidebar
   - Under "Source", select "GitHub Actions" as the source
   - The workflow will automatically deploy when you push to the `main` branch

2. **Automatic deployments:**
   - Every push to your `main` branch will trigger a production deployment
   - The GitHub Actions workflow (`.github/workflows/deploy.yml`) will:
     - Install dependencies
     - Build the project
     - Deploy to GitHub Pages

3. **Manual deployment:**
   - You can also trigger a manual deployment:
     - Go to the "Actions" tab in your repository
     - Select "Deploy to GitHub Pages" workflow
     - Click "Run workflow"

4. **Access your site:**
   - Your site will be available at: `https://fanyu-meng.github.io/`
   - (Replace `fanyu-meng` with your GitHub username if different)

### Custom Domain

Yes, you can connect a custom domain to your GitHub Pages site!

- In your repository settings, go to "Pages"
- Under "Custom domain", enter your domain name
- Follow the DNS configuration instructions provided by GitHub
- GitHub will automatically create a `CNAME` file in your repository

Read more: [GitHub Pages Custom Domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)
