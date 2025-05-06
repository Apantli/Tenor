[**Tenor API Documentation**](../../README.md)

***

# Variable: refreshSessionProcedure

> `const` **refreshSessionProcedure**: `MutationProcedure`\<\{ `input`: \{ `token`: `string`; \}; `output`: \{ `success`: `boolean`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/auth.ts:156](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/auth.ts#L156)

Refreshes the user's session by verifying and updating the auth token.

## Param

Object containing procedure parameters
Input object structure:
- token — Firebase authentication token

## Returns

Object indicating success status.

## Http

POST /api/trpc/auth.refreshSession
