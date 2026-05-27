# CakeShop Pro - Multi-Tenant Order Management System

A production-ready SaaS platform built for Cake Shops to manage their orders, customers, menu, and payments.

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Styling:** Tailwind CSS + Custom Dark Theme UI
- **Authentication:** Custom JWT-based Auth (Edge-compatible with `jose`)
- **Validation:** Zod

## Architecture Highlights
- **Full Multi-Tenancy:** Single database, scoped data filtering using `shopId` injection via middleware.
- **RBAC:** Super Admin vs Shop Admin roles.
- **No Foreign Keys:** Referential integrity managed purely at the application layer as per requirements.
- **WhatsApp Webhook Ready:** Includes a webhook endpoint for Meta Business API integration.

## Local Setup Instructions

1. **Prerequisites**
   - Node.js 18+
   - Running PostgreSQL database

2. **Environment Variables**
   Create a `.env` file in the root based on `.env.example`:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/cakeshop?schema=public"
   JWT_SECRET="your-super-secret-jwt-key-change-in-production-min-32-chars!!"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   WHATSAPP_VERIFY_TOKEN="cakeshop-webhook-verify"
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Database Setup**
   Run Prisma migrations to create tables and indexes:
   ```bash
   npx prisma db push
   ```
   *(We use `db push` instead of `migrate dev` to rapidly prototype without migration history, but you can use `migrate dev` if preferred)*

5. **Seed the Database**
   Populate the database with test shops, users, and orders:
   ```bash
   npm run prisma db seed
   ```

   **Demo Credentials:**
   - **Super Admin:** admin@cakeshop.com / admin123
   - **Shop Admin 1:** sweet@cakeshop.com / shop123
   - **Shop Admin 2:** royal@cakeshop.com / shop123

6. **Start Development Server**
   ```bash
   npm run dev
   ```
   The app will be available at [http://localhost:3000](http://localhost:3000)

## Production Deployment Guide

We recommend deploying to Vercel with a managed PostgreSQL database (e.g., Supabase, Neon, or Railway).

1. **Database:**
   - Provision a PostgreSQL database.
   - Get the connection string (ensure it uses `pgbouncer` or connection pooling if using serverless).

2. **Vercel Deployment:**
   - Push this repo to GitHub.
   - Import project in Vercel.
   - Set the following Environment Variables in Vercel:
     - `DATABASE_URL`
     - `JWT_SECRET` (generate a strong random string)
     - `NEXT_PUBLIC_APP_URL` (your production domain)

3. **Build Command Override (Optional):**
   - Ensure Prisma client is generated during build:
     `npx prisma generate && next build`

4. **Post-Deployment:**
   - Run migrations on the production DB: `npx prisma db push` (or `npx prisma migrate deploy` if using migrations).
   - Run the seed script once to create the initial Super Admin account: `npx prisma db seed`.

## Project Structure

```text
/shop-app
├── prisma/               # Database schema and seed script
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── admin/        # Super Admin routes
│   │   ├── api/          # Internal and Webhook APIs
│   │   ├── login/        # Public login page
│   │   └── shop/         # Shop Admin routes
│   ├── components/       # Shared UI components
│   ├── lib/              # Core business logic
│   │   ├── auth.ts       # JWT & password hashing
│   │   ├── errors.ts     # Standard API responses
│   │   ├── prisma.ts     # DB Client singleton
│   │   ├── tenant.ts     # Multi-tenancy middleware logic
│   │   ├── utils.ts      # Helpers
│   │   └── validations.ts# Zod schemas
│   └── middleware.ts     # Edge middleware for RBAC routing
```
