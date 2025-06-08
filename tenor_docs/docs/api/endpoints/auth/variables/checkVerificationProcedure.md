[**Tenor API Documentation**](../../README.md)

***

# Variable: checkVerificationProcedure

> `const` **checkVerificationProcedure**: `QueryProcedure`\<\{ `input`: `void`; `output`: \{ `verified`: `boolean`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/auth.ts:133](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/auth.ts#L133)

Checks if the current user's email is verified.

## Param

None

## Returns

Object indicating whether the user's email is verified.

## Http

GET /api/trpc/auth.checkVerification
