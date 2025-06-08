[**Tenor API Documentation**](../../README.md)

***

# Variable: getContributionOverviewProcedure

> `const` **getContributionOverviewProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; `time`: `string`; `userId`: `string`; \}; `output`: \{ `Issues`: `number`; `Tasks`: `number`; `User Stories`: `number`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/performance.ts:133](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/performance.ts#L133)

Retrieves an overview of a user's contributions to a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project
- userId - String ID of the user
- time - Time period for contribution overview calculation

## Returns

Contribution overview metrics for the specified user and time period

## Http

GET /api/trpc/performance.getContributionOverview
