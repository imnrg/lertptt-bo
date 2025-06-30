# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a full-stack Next.js application with App Router, TypeScript, Tailwind CSS, Prisma ORM, PostgreSQL, and NextAuth authentication.

## Key Technologies
- Next.js 14+ with App Router
- TypeScript
- Tailwind CSS
- Prisma ORM with PostgreSQL
- NextAuth.js for authentication
- Zod for validation
- Thai language as base language

## Project Structure Guidelines
- Use server components by default, client components only when necessary
- Implement server actions for form submissions
- Use Zod schemas for validation
- Follow Thai naming conventions in UI
- Use responsive design with Tailwind CSS
- Implement middleware for route protection
- Use proper error handling and loading states

## Authentication Features
- User registration with email verification
- Login/Logout functionality
- Password reset via email
- Profile editing and account deletion
- Middleware-based route protection

## Main Features
- Dashboard with summary cards and charts
- User & Authentication System
- Fuel Management (types, tanks, dispensers)
- Product Management
- Shift Management
- Debtors Management
- Settings (profile, password, theme)

## Code Style
- Use TypeScript strict mode
- Implement proper error boundaries
- Use server-side validation with Zod
- Follow NextJS 14+ best practices
- Use Thai language for user-facing text