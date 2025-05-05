[**Tenor API Documentation**](../../README.md)

***

# Variable: getUserListEditBoxProcedure

> `const` **getUserListEditBoxProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `object`[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/users.ts:77](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/users.ts#L77)

Retrieves a list of users with their roles for a specific project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to fetch users from

## Returns

Array of users with their roles and activity status.

## Http

GET /api/trpc/users.getUserListEditBox
