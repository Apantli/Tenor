[**Tenor API Documentation**](../../README.md)

***

# Variable: loginProcedure

> `const` **loginProcedure**: `MutationProcedure`\<\{ `input`: \{ `githubAccessToken?`: `string`; `token`: `string`; \}; `output`: \{ `success`: `boolean`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/auth.ts:41](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/auth.ts#L41)

Logs in a user using a token and optional GitHub access token.

## Param

Object containing procedure parameters
Input object structure:
- token — Firebase authentication token
- githubAccessToken — Optional GitHub access token for email verification

## Returns

Object indicating success status.

## Http

POST /api/trpc/auth.login
