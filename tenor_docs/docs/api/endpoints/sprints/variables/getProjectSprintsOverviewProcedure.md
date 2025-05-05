[**Tenor API Documentation**](../../README.md)

***

# Variable: getProjectSprintsOverviewProcedure

> `const` **getProjectSprintsOverviewProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `object`[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/sprints.ts:72](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/sprints.ts#L72)

Retrieves an overview of all sprints in a specific project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to fetch sprints from

## Returns

Array of sprints with their number, description, start date, and end date.

## Http

GET /api/trpc/sprints.getProjectSprintsOverview
