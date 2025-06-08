[**Tenor API Documentation**](../../README.md)

***

# Variable: getGlobalUsersProcedure

> `const` **getGlobalUsersProcedure**: `QueryProcedure`\<\{ `input`: \{ `filter?`: `string`; \}; `output`: `WithId`\<`UserPreview`\>[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/users.ts:51](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/users.ts#L51)

Retrieves a list of users from Firebase Auth and filters them based on the input filter.

## Param

Object containing procedure parameters
Input object structure:
- filter - Optional string to search for in user emails and display names

## Returns

Array of filtered user objects

## Http

GET /api/trpc/users.getGlobalUsers
