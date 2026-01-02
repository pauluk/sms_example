# Gov SMS Web App

A Next.js application with Better Auth, Neon PostgreSQL, and GOV.UK Notify integration.

## Features

- **Authentication**: Secure login and signup using Better Auth.
- **Admin System**: The first user to sign up is automatically assigned the role of `admin`.
- **Database**: PostgreSQL hosted on Neon, managed via Drizzle ORM.
- **Notifications**: Integration with GOV.UK Notify for sending SMS.

## Setup

1.  **Environment Variables**:
    Ensure your `.env` file is set up (created automatically during setup):
    ```env
    DATABASE_URL="postgresql://..."
    BETTER_AUTH_SECRET="..."
    BETTER_AUTH_URL="http://localhost:3000"
    NOTIFY_API_KEY="..."
    SMTP_... (Email settings)
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Database Migration**:
    If you need to push schema changes:
    ```bash
    npx drizzle-kit push --config=drizzle.config.ts
    ```

## Running the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

-   `app/`: Next.js App Router pages and API routes.
-   `lib/`: Shared utilities (Auth, DB, Schema).
-   `drizzle/`: Database migration artifacts.

## Deployment

### 1. Push to GitHub

1.  Create a new repository on GitHub (e.g., `gov-sms-app`).
2.  Push your code:
    ```bash
    git remote add origin https://github.com/YOUR_USERNAME/gov-sms-app.git
    git branch -M main
    git push -u origin main
    ```

### 2. Deploy to Vercel

1.  Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New..." -> "Project"**.
2.  Import your `gov-sms-app` repository.
3.  In the **Environment Variables** section, add:
    *   `DATABASE_URL`: Connection string from Neon Console.
    *   `BETTER_AUTH_SECRET`: Generate one (or use existing).
    *   `BETTER_AUTH_URL`: Set to your Vercel URL (e.g., `https://your-app.vercel.app`).
    *   `NOTIFY_API_KEY`: Your GOV.UK Notify Key.
    *   `SMTP_SERVER`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`: For email sending.
4.  Click **Deploy**.

### 3. Post-Deployment

1.  **Database Migration**: Vercel usually doesn't run migrations automatically. You can run them locally against the prod DB:
    ```bash
    # Update .env to point to PROD database, then:
    npx drizzle-kit push
    ```
    OR add a build command in `package.json` to run migrations (advanced).

2.  **Add Domain**:
    *   Go to Vercel Project Settings -> Domains.
    *   Add your custom domain (e.g., `sms.nhsbsa.nhs.uk`).

