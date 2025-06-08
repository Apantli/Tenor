[**Tenor API Documentation**](../../README.md)

***

# Variable: getRetrospectiveTeamProgressProcedure

> `const` **getRetrospectiveTeamProgressProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; `sprintId`: `string`; \}; `output`: \{ `completedBacklogItems`: `number`; `completedIssues`: `number`; `completedStoryPoints`: `number`; `completedUserStories`: `number`; `totalBacklogItems`: `number`; `totalIssues`: `number`; `totalStoryPoints`: `number`; `totalUserStories`: `number`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/sprintRetrospectives.ts:335](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/sprintRetrospectives.ts#L335)

Retrieves team progress metrics for a sprint retrospective.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project
- sprintId - String ID of the sprint

## Returns

Team progress metrics for the specified sprint

## Http

GET /api/trpc/sprintRetrospectives.getRetrospectiveTeamProgress
