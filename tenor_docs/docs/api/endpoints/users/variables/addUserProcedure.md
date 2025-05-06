[**Tenor API Documentation**](../../README.md)

***

# Variable: addUserProcedure

> `const` **addUserProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `userId`: `string`; \}; `output`: `void`; \}\>

Defined in: [tenor\_web/src/server/api/routers/users.ts:252](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/users.ts#L252)

Adds a user to a specific project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to add the user to
- userId — ID of the user to be added

## Returns

Void.

## Http

POST /api/trpc/users.addUser
