[**Tenor API Documentation**](../../README.md)

***

# Variable: checkVerificationProcedure

> `const` **checkVerificationProcedure**: `QueryProcedure`\<\{ `input`: `void`; `output`: \{ `verified`: `boolean`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/auth.ts:134](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/auth.ts#L134)

Checks if the current user's email is verified.

## Param

None

## Returns

Object indicating whether the user's email is verified.

## Http

GET /api/trpc/auth.checkVerification
