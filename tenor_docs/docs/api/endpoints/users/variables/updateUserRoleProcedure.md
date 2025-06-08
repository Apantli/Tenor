[**Tenor API Documentation**](../../README.md)

***

# Variable: updateUserRoleProcedure

> `const` **updateUserRoleProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `roleId`: `string`; `userId`: `string`; \}; `output`: `void`; \}\>

Defined in: [tenor\_web/src/server/api/routers/users.ts:232](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/users.ts#L232)

Updates the role of a user in a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project
- userId - String ID of the user to update
- roleId - String ID of the new role to assign

## Returns

None

## Http

POST /api/trpc/users.updateUserRole
