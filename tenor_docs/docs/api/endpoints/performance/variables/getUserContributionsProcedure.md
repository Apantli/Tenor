[**Tenor API Documentation**](../../README.md)

***

# Variable: getUserContributionsProcedure

> `const` **getUserContributionsProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; `time`: `string`; `timezone?`: `string`; `userId`: `string`; \}; `output`: `null` \| `object`[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/performance.ts:83](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/performance.ts#L83)

Retrieves contribution metrics for a specific user in a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project
- userId - String ID of the user
- time - Time period for contribution calculation
- timezone - Optional timezone for date calculations

## Returns

User contribution metrics for the specified time period

## Http

GET /api/trpc/performance.getUserContributions
