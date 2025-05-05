[**Tenor API Documentation**](../../README.md)

***

# Variable: updateUserRoleProcedure

> `const` **updateUserRoleProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `roleId`: `string`; `userId`: `string`; \}; `output`: `void`; \}\>

Defined in: [tenor\_web/src/server/api/routers/users.ts:298](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/users.ts#L298)

Updates the role of a user in a specific project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project where the user role will be updated
- userId — ID of the user whose role will be updated
- roleId — New role ID to assign to the user

## Returns

Void.

## Http

PUT /api/trpc/users.updateUserRole
