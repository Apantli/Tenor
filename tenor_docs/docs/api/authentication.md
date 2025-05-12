# Authentication

This document details the authentication mechanisms used in Tenor and how they work.

## Overview

Tenor uses Firebase Authentication for managing user accounts and access control. Firebase handles the authentication flow, while our backend services verify and manage user sessions. The tokens provided by Firebase (for both Email/Password and OAuth login) are stored in sessions and used to authenticate API requests.

The authentication system supports:

- Email/password authentication
- GitHub OAuth authentication
- Email verification
- Session management via secure cookies

## Authentication Flow

### Email/Password Registration

1. User provides name, email, and password
2. Firebase creates a new user account
3. User receives a verification email
4. User must verify email before accessing the application
5. Upon verification, the user can log in and access Tenor features

### GitHub Authentication

1. User clicks "Continue with GitHub"
2. User is redirected to GitHub login
3. User grants permissions to Tenor
4. GitHub returns an access token to Tenor
5. Tenor creates or links a user account
6. If the GitHub email is verified, the user's Tenor email is automatically verified

### Token and Session Management

After successful authentication:

1. Firebase generates an ID token for the user
2. The token is stored in an HTTP-only cookie for secure storage
3. Server-side API calls verify the token for each request
4. Session refresh happens automatically using Firebase's token refresh mechanism
5. Access control is implemented for various routes and API endpoints

## API Authentication

### Client-Side

When making API requests from the client, authentication is handled automatically via the HTTP-only cookie containing the Firebase ID token. This provides security against XSS attacks.

```tsx
// Authentication is handled via server-side cookies
const { data } = api.userStories.getUserStoriesTableFriendly.useQuery({
  projectId: projectId,
});
```

### Server-Side

For server-side components, authentication is accessed using the `auth()` function:

```tsx
import { auth } from "~/server/auth";

export default async function ProtectedPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // User is authenticated, render protected content
  return <div>Protected content</div>;
}
```

## Authorization

In addition to authentication, Tenor implements fine-grained authorization controls:

### Role-Based Access

Routes and API endpoints can require specific roles (see roles in [depth](../roles-permissions.md)):

```typescript
// Example of role-required procedure
export const roleRequiredProcedure = (
  flags: FlagsRequired,
  access: "none" | "read" | "write"
) =>
  protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .use(async ({ ctx, next, input }) => {
      // Permission checks occur here
      // ...
      return next({ ctx });
    });
```

### Permission Levels

Tenor uses granular permission levels for different project areas:

- Read access
- Write access
- Administrative access
