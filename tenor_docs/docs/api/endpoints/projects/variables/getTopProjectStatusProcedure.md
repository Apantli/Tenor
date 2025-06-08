[**Tenor API Documentation**](../../README.md)

***

# Variable: getTopProjectStatusProcedure

> `const` **getTopProjectStatusProcedure**: `QueryProcedure`\<\{ `input`: `void`; `output`: `WithName`\<`TopProjects`\>[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/projects.ts:528](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/projects.ts#L528)

Gets the status of top projects for the current user.

## Returns

Array of top project status data with names

## Http

GET /api/trpc/projects.getTopProjectStatus
