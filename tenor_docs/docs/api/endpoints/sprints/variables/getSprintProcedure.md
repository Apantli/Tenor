[**Tenor API Documentation**](../../README.md)

***

# Variable: getSprintProcedure

> `const` **getSprintProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; `sprintNumber`: `number`; \}; `output`: \{ `deleted`: `boolean`; `description`: `string`; `endDate`: `Timestamp`; `genericItemIds`: `string`[]; `issueIds`: `string`[]; `number`: `number`; `startDate`: `Timestamp`; `userStoryIds`: `string`[]; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/sprints.ts:103](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/sprints.ts#L103)

Retrieves a specific sprint by its number in a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project containing the sprint
- sprintNumber — Number of the sprint to fetch

## Returns

Sprint object with its details.

## Http

GET /api/trpc/sprints.getSprint
