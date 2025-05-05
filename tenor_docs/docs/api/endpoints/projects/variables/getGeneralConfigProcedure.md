[**Tenor API Documentation**](../../README.md)

***

# Variable: getGeneralConfigProcedure

> `const` **getGeneralConfigProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: \{ `activities`: `object`[]; `currentSprintId`: `string`; `deleted`: `boolean`; `description`: `string`; `logo`: `string`; `name`: `string`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/projects.ts:373](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/projects.ts#L373)

Retrieves the general configuration of a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to fetch configuration for

## Returns

Object containing the project's general configuration.

## Http

GET /api/trpc/projects.getGeneralConfig
