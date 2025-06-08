[**Tenor API Documentation**](../../README.md)

***

# Variable: updateUserProcedure

> `const` **updateUserProcedure**: `MutationProcedure`\<\{ `input`: \{ `displayName?`: `string`; `photoBase64?`: `string`; \}; `output`: `void`; \}\>

Defined in: [tenor\_web/src/server/api/routers/users.ts:262](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/users.ts#L262)

Updates a user's profile information including display name and profile photo.

## Param

Object containing procedure parameters
Input object structure:
- displayName - Optional string for the user's display name
- photoBase64 - Optional base64-encoded string of the user's profile photo

## Returns

None

## Http

POST /api/trpc/users.updateUser
