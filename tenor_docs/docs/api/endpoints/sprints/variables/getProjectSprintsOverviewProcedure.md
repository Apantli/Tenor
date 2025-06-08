[**Tenor API Documentation**](../../README.md)

***

# Variable: getProjectSprintsOverviewProcedure

> `const` **getProjectSprintsOverviewProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `WithId`\<`Sprint`\>[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/sprints.ts:64](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/sprints.ts#L64)

Retrieves an overview of all sprints for a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project

## Returns

Array of sprint objects containing sprint details

## Http

GET /api/trpc/sprints.getProjectSprintsOverview
