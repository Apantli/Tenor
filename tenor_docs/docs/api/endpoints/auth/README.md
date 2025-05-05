---
sidebar_label: "Auth API"
sidebar_position: 1
---

[**Tenor API Documentation**](../README.md)

***

# auth

Auth Router - Tenor API Endpoints for Authentication Management

This file defines the TRPC router and procedures for authentication in the Tenor application.
It provides endpoints to handle user login, logout, session management, and verification.

The router includes procedures for:
- User login with Firebase authentication and optional GitHub integration
- User logout and token revocation
- Email verification status checking
- Session refresh and management

Authentication is primarily implemented using Firebase Auth with additional integration
for GitHub OAuth verification.

## Variables

- [authRouter](variables/authRouter.md)
- [checkVerificationProcedure](variables/checkVerificationProcedure.md)
- [loginProcedure](variables/loginProcedure.md)
- [logoutProcedure](variables/logoutProcedure.md)
- [refreshSessionProcedure](variables/refreshSessionProcedure.md)
