[**Tenor API Documentation**](../../README.md)

***

# Variable: getUsersProcedure

> `const` **getUsersProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `WithId`\<`UserPreview`\>[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/users.ts:94](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/users.ts#L94)

Retrieves a list of users from Firestore based on the project ID.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project to get users for

## Returns

Array of user objects associated with the project

## Http

GET /api/trpc/users.getUsers
