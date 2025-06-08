[**Tenor API Documentation**](../../README.md)

***

# Variable: getProjectNameProcedure

> `const` **getProjectNameProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `string`; \}\>

Defined in: [tenor\_web/src/server/api/routers/projects.ts:477](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/projects.ts#L477)

Gets the name of a specific project.

## Param

Object containing projectId

## Returns

Project name string

## Http

GET /api/trpc/projects.getProjectName
