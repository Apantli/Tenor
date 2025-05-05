[**Tenor API Documentation**](../../README.md)

***

# Variable: getBacklogItemPreviewsBySprintProcedure

> `const` **getBacklogItemPreviewsBySprintProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: \{ `backlogItems`: \{[`k`: `string`]: `object`; \}; `sprints`: `object`[]; `unassignedItemIds`: `string`[]; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/sprints.ts:193](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/sprints.ts#L193)

Retrieves backlog item previews grouped by sprint in a specific project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to fetch backlog items from

## Returns

Object containing sprints with their associated backlog items and unassigned items.

## Http

GET /api/trpc/sprints.getBacklogItemPreviewsBySprint
