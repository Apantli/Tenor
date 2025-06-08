[**Tenor API Documentation**](../../README.md)

***

# Variable: refreshSessionProcedure

> `const` **refreshSessionProcedure**: `MutationProcedure`\<\{ `input`: \{ `token`: `string`; \}; `output`: \{ `success`: `boolean`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/auth.ts:155](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/auth.ts#L155)

Refreshes the user's session by verifying and updating the auth token.

## Param

Object containing procedure parameters
Input object structure:
- token — Firebase authentication token

## Returns

Object indicating success status.

## Http

POST /api/trpc/auth.refreshSession
