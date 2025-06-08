[**Tenor API Documentation**](../../README.md)

***

# Variable: getProductivityProcedure

> `const` **getProductivityProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; `time`: `"Sprint"` \| `"Week"` \| `"Month"`; \}; `output`: `null` \| \{ `issueCompleted`: `number`; `issueTotal`: `number`; `time`: `"Sprint"` \| `"Week"` \| `"Month"`; `userStoryCompleted`: `number`; `userStoryTotal`: `number`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/performance.ts:55](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/performance.ts#L55)

Retrieves productivity metrics for a project over a specified time period.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project
- time - Time period for performance calculation

## Returns

Performance metrics for the specified time period

## Http

GET /api/trpc/performance.getProductivity
