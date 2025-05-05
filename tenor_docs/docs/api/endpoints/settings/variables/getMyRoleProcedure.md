[**Tenor API Documentation**](../../README.md)

***

# Variable: getMyRoleProcedure

> `const` **getMyRoleProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: \{ `backlog`: `number`; `id`: `string`; `issues`: `number`; `label`: `string`; `performance`: `number`; `scrumboard`: `number`; `settings`: `number`; `sprints`: `number`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/settings.ts:882](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/settings.ts#L882)

Retrieves the current user's role for a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to fetch the role from

## Returns

Role object with its details.

## Http

GET /api/trpc/settings.getMyRole
