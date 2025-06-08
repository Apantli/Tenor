[**Tenor API Documentation**](../../README.md)

***

# Variable: assignItemsToSprintProcedure

> `const` **assignItemsToSprintProcedure**: `MutationProcedure`\<\{ `input`: \{ `items`: `object`[]; `projectId`: `string`; `sprintId?`: `string`; \}; `output`: `void`; \}\>

Defined in: [tenor\_web/src/server/api/routers/sprints.ts:402](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/sprints.ts#L402)

Assigns backlog items to a sprint or removes them from sprints.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project
- sprintId - Optional string ID of the sprint to assign items to (empty to unassign)
- items - Array of objects containing item IDs and types to assign

## Returns

None

## Http

POST /api/trpc/sprints.assignItemsToSprint
