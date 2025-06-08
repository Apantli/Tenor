[**Tenor API Documentation**](../../README.md)

***

# Variable: getUsersSentimentProcedure

> `const` **getUsersSentimentProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `object`[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/performance.ts:196](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/performance.ts#L196)

Retrieves the most recent sentiment/happiness data for all team members in a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project

## Returns

An array of user IDs and their corresponding happiness metrics

## Http

GET /api/trpc/performance.getUsersSentiment
