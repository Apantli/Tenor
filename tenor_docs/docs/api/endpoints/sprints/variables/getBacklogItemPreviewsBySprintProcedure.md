[**Tenor API Documentation**](../../README.md)

***

# Variable: getBacklogItemPreviewsBySprintProcedure

> `const` **getBacklogItemPreviewsBySprintProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: \{ `backlogItems`: \{[`k`: `string`]: `BacklogItemDetail`; \}; `sprints`: `object`[]; `unassignedItemIds`: `string`[]; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/sprints.ts:292](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/sprints.ts#L292)

Retrieves backlog item previews organized by sprints for a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project

## Returns

Object containing sprints with associated backlog items and unassigned items

## Http

GET /api/trpc/sprints.getBacklogItemPreviewsBySprint
