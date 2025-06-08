[**Tenor API Documentation**](../../README.md)

***

# Variable: addUserProcedure

> `const` **addUserProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `userId`: `string`; \}; `output`: `void`; \}\>

Defined in: [tenor\_web/src/server/api/routers/users.ts:138](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/users.ts#L138)

Adds a user to a project or reactivates them if they were previously deactivated.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project to add the user to
- userId - String ID of the user to add

## Returns

None

## Http

POST /api/trpc/users.addUser
