[**Tenor API Documentation**](../../README.md)

***

# Variable: getUserTypesProcedure

> `const` **getUserTypesProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `WithId`\<`Role`\>[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/projects.ts:492](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/projects.ts#L492)

Gets the user types/roles defined in a project.

## Param

Object containing projectId

## Returns

Array of project roles

## Http

GET /api/trpc/projects.getUserTypes
