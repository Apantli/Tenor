[**Tenor API Documentation**](../../README.md)

***

# Variable: getActivityDetailsProcedure

> `const` **getActivityDetailsProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `WithId`\<`ProjectActivityDetail`\>[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/projects.ts:562](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/projects.ts#L562)

Gets activity details for a specific project.

## Param

Object containing projectId

## Returns

Activity details for the specified project

## Http

GET /api/trpc/projects.getActivityDetails
