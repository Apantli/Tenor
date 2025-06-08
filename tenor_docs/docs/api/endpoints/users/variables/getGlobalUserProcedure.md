[**Tenor API Documentation**](../../README.md)

***

# Variable: getGlobalUserProcedure

> `const` **getGlobalUserProcedure**: `QueryProcedure`\<\{ `input`: \{ `userId`: `string`; \}; `output`: `undefined` \| `WithId`\<`UserPreview`\>; \}\>

Defined in: [tenor\_web/src/server/api/routers/users.ts:76](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/users.ts#L76)

Retrieves a specific global user by their user ID.

## Param

Object containing procedure parameters
Input object structure:
- userId - String ID of the user to retrieve

## Returns

User object for the specified user

## Http

GET /api/trpc/users.getGlobalUser
