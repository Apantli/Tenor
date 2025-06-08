[**Tenor API Documentation**](../../README.md)

***

# Variable: getGeneralConfigProcedure

> `const` **getGeneralConfigProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: \{ `activities`: `object`[]; `currentSprintId`: `string`; `deleted`: `boolean`; `description`: `string`; `id`: `string`; `logo`: `string`; `name`: `string`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/projects.ts:369](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/projects.ts#L369)

Gets the general configuration of a specific project.

## Param

Object containing projectId

## Returns

Project configuration data

## Http

GET /api/trpc/projects.getGeneralConfig
