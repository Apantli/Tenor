[**Tenor API Documentation**](../../README.md)

***

# Variable: addRoleProcedure

> `const` **addRoleProcedure**: `MutationProcedure`\<\{ `input`: \{ `label`: `string`; `projectId`: `string`; \}; `output`: `void`; \}\>

Defined in: [tenor\_web/src/server/api/routers/settings.ts:712](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/settings.ts#L712)

Adds a new role to a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to add the role to
- label — Label of the new role

## Returns

Void.

## Http

POST /api/trpc/settings.addRole
