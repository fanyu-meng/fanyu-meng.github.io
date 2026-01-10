# Personal Portfolio Website

A modern personal portfolio website built with React, TypeScript, and Vite.

## How can I edit this code?

There are several ways of editing your application.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will automatically trigger deployments on Vercel.

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

This project is configured for deployment on [Vercel](https://vercel.com) with automatic deployments via Git integration.

### Deploying to Vercel

1. **Connect your repository to Vercel:**
   - Sign in to [Vercel](https://vercel.com)
   - Click "Add New Project" in your dashboard
   - Import your GitHub repository
   - Vercel will automatically detect the Vite framework

2. **Automatic deployments:**
   - Every push to your main/master branch will trigger a production deployment
   - Pull requests will get preview deployments automatically
   - Builds use the configuration in `vercel.json`

3. **Manual deployment:**
   - You can also deploy manually using the Vercel CLI:
     ```sh
     npm i -g vercel
     vercel
     ```

### Custom Domain

Yes, you can connect a custom domain to your Vercel project!

- Navigate to your project settings in Vercel dashboard
- Go to the "Domains" section
- Add your custom domain and follow the DNS configuration instructions

Read more: [Vercel Custom Domains](https://vercel.com/docs/concepts/projects/domains)
