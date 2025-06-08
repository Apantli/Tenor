[**Tenor API Documentation**](../../README.md)

***

# Variable: deleteSprintProcedure

> `const` **deleteSprintProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `sprintId`: `string`; \}; `output`: \{ `reorderedSprints`: `boolean`; `success`: `boolean`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/sprints.ts:231](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/sprints.ts#L231)

Deletes a sprint by marking it as deleted and removing associated backlog items.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project
- sprintId - String ID of the sprint to delete

## Returns

Object with success status and whether sprints were reordered

## Http

POST /api/trpc/sprints.deleteSprint
