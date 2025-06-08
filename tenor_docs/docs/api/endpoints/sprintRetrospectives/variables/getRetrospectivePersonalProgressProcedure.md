[**Tenor API Documentation**](../../README.md)

***

# Variable: getRetrospectivePersonalProgressProcedure

> `const` **getRetrospectivePersonalProgressProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; `sprintId`: `string`; `userId`: `string`; \}; `output`: \{ `completedAssignedStoryPoints`: `number`; `completedAssignedTasks`: `number`; `totalAssignedStoryPoints`: `number`; `totalAssignedTasks`: `number`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/sprintRetrospectives.ts:366](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/sprintRetrospectives.ts#L366)

Retrieves personal progress metrics for an individual in a sprint.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project
- sprintId - String ID of the sprint
- userId - String ID of the user

## Returns

Personal progress metrics for the specified user and sprint

## Http

GET /api/trpc/sprintRetrospectives.getRetrospectivePersonalProgress
