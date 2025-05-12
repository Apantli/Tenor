[**Tenor API Documentation**](../../README.md)

***

# Variable: getProjectEpicsOverviewProcedure

> `const` **getProjectEpicsOverviewProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `object`[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/epics.ts:49](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/epics.ts#L49)

Retrieves an overview of epics for a specific project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to fetch epics for

## Returns

Array of epics with their scrum IDs and names.

## Http

GET /api/trpc/epics.getProjectEpicsOverview
