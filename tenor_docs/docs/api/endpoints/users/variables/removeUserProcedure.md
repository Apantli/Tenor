[**Tenor API Documentation**](../../README.md)

***

# Variable: removeUserProcedure

> `const` **removeUserProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `userId`: `string`; \}; `output`: `void`; \}\>

Defined in: [tenor\_web/src/server/api/routers/users.ts:199](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/users.ts#L199)

Removes a user from a specific project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to remove the user from
- userId — ID of the user to be removed

## Returns

Void.

## Http

DELETE /api/trpc/users.removeUser
