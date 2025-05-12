---
sidebar_position: 1
title: "Technologies"
---

# Technologies Used in Tenor

Tenor is built using a modern tech stack that combines robust frontend and backend technologies for a comprehensive project management solution. The stack was chosen for its compatibility with TypeScript, which ensures that the entire codebase is type-safe and maintainable.

## Core Technologies

### Programming Languages

- **TypeScript**: The primary language used throughout the project, providing type safety for both frontend and backend code

### Frontend Framework

- **Next.js**: React framework with built-in features like server-side rendering and routing
- **React**: Library for building user interfaces with component-based architecture
- **Tailwind CSS**: Utility-first CSS framework for styling

### Backend & API

- **tRPC**: End-to-end type-safe API layer connecting frontend and backend
- **Node.js**: JavaScript runtime for server-side code execution

### Authentication

- **Firebase Authentication**: Manages user authentication and session management
- **GitHub OAuth**: Allows users to sign in with GitHub accounts

## Database & Storage

### Primary Database

- **Firebase Firestore**: NoSQL document database for storing project data, user stories, tasks, etc.
- **Firebase Storage**: Object storage service for storing files like project logos and documents

### Secondary Storage

- **Supabase**: Used for specific storage operations (for the project's additional functionality, i.e. muse headset, STT).

## AI Integration

- **Generative AI**: Integration with AI services through environment configurations
  - Support for different AI providers (Frida AI, Gemini)
  - Used for generating project requirements, tasks, and other content

## Development & Deployment Tools

- **ESLint**: Linting tool for code quality
- **Prettier**: Code formatter
- **Cypress**: Testing framework for end-to-end tests
- **Vercel**: Deployment platform for hosting the Next.js application
- **GitHub Actions**: CI/CD for automated build, testing and deployment

## Libraries & Utilities

- **Zod**: Schema validation library
- **Firebase Admin SDK**: Server-side Firebase operations
- **MUI Icons**: Material UI icons library
- **DND Kit**: Drag and drop functionality for Kanban boards
- **React Markdown**: For rendering markdown content
