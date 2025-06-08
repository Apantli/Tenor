[**Tenor API Documentation**](../../README.md)

***

# Variable: getLastUserSentimentProcedure

> `const` **getLastUserSentimentProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; `userId`: `string`; \}; `output`: `null` \| \{ `happiness`: `number`; `user_id`: `string`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/performance.ts:170](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/performance.ts#L170)

Retrieves the most recent sentiment/happiness data for a specific user in a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project
- userId - String ID of the user

## Returns

The most recent happiness record for the specified user, or null if none exists

## Http

GET /api/trpc/performance.getLastUserSentiment
