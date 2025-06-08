[**Tenor API Documentation**](../../README.md)

***

# Variable: modifySprintProcedure

> `const` **modifySprintProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `sprintData`: \{ `description`: `string`; `endDate`: `Timestamp`; `startDate`: `Timestamp`; \}; `sprintId`: `string`; \}; `output`: \{ `reorderedSprints`: `boolean`; `success`: `boolean`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/sprints.ts:174](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/sprints.ts#L174)

Modifies an existing sprint's details.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project
- sprintId - String ID of the sprint to modify
- sprintData - Object containing updated sprint details

## Returns

Object with success status and whether sprints were reordered

## Throws

- If the sprint is not found

## Http

POST /api/trpc/sprints.modifySprint
