[**Tenor API Documentation**](../../README.md)

***

# Variable: getGraphBurndownDataProcedure

> `const` **getGraphBurndownDataProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `null` \| `BurndownChartData`; \}\>

Defined in: [tenor\_web/src/server/api/routers/projects.ts:613](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/projects.ts#L613)

Gets burndown chart data for the current sprint of a project.

## Param

Object containing projectId

## Returns

Burndown data or null if no current sprint exists

## Http

GET /api/trpc/projects.getGraphBurndownData
