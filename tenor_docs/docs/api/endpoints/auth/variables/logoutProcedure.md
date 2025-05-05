[**Tenor API Documentation**](../../README.md)

***

# Variable: logoutProcedure

> `const` **logoutProcedure**: `MutationProcedure`\<\{ `input`: `void`; `output`: \{ `success`: `boolean`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/auth.ts:108](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/auth.ts#L108)

Logs out the current user by revoking refresh tokens and clearing the auth cookie.

## Param

None

## Returns

Object indicating success status.

## Http

POST /api/trpc/auth.logout
