[**Tenor API Documentation**](../../README.md)

***

# Variable: getUserStoryCountProcedure

> `const` **getUserStoryCountProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `number`; \}\>

Defined in: [tenor\_web/src/server/api/routers/userStories.ts:687](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/userStories.ts#L687)

Retrieves the number of user stories inside a given project, regardless of their deleted status.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project

## Returns

Number of user stories in the project

## Http

GET /api/trpc/userStories.getUserStoryCount
