[**Tenor API Documentation**](../../README.md)

***

# Variable: logoutProcedure

> `const` **logoutProcedure**: `MutationProcedure`\<\{ `input`: `void`; `output`: \{ `success`: `boolean`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/auth.ts:107](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/auth.ts#L107)

Logs out the current user by revoking refresh tokens and clearing the auth cookie.

## Param

None

## Returns

Object indicating success status.

## Http

POST /api/trpc/auth.logout
