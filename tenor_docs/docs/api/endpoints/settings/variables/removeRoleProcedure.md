[**Tenor API Documentation**](../../README.md)

***

# Variable: removeRoleProcedure

> `const` **removeRoleProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `roleId`: `string`; \}; `output`: `void`; \}\>

Defined in: [tenor\_web/src/server/api/routers/settings.ts:742](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/settings.ts#L742)

Removes a role from a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project containing the role
- roleId — ID of the role to remove

## Returns

Void.

## Http

DELETE /api/trpc/settings.removeRole
