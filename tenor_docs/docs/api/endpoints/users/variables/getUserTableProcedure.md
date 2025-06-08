[**Tenor API Documentation**](../../README.md)

***

# Variable: getUserTableProcedure

> `const` **getUserTableProcedure**: `QueryProcedure`\<\{ `input`: \{ `filter?`: `string`; `projectId`: `string`; \}; `output`: `UserCol`[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/users.ts:113](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/users.ts#L113)

Retrieves a table of users from Firestore based on the project ID.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project to get users for
- filter - Optional string to filter users

## Returns

Array of user objects formatted as a table

## Http

GET /api/trpc/users.getUserTable
