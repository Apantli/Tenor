[**Tenor API Documentation**](../../README.md)

***

# Variable: createSprintProcedure

> `const` **createSprintProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `sprintData`: \{ `deleted?`: `boolean`; `description`: `string`; `endDate`: `Timestamp`; `genericItemIds`: `string`[]; `issueIds`: `string`[]; `number`: `number`; `startDate`: `Timestamp`; `userStoryIds`: `string`[]; \}; \}; `output`: \{ `reorderedSprints`: `boolean`; `success`: `boolean`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/sprints.ts:108](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/sprints.ts#L108)

Creates a new sprint in the project.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project
- sprintData - Object containing sprint details conforming to SprintSchema

## Returns

Object with success status and whether sprints were reordered

## Http

POST /api/trpc/sprints.createSprint
