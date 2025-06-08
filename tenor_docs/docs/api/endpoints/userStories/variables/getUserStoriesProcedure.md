[**Tenor API Documentation**](../../README.md)

***

# Variable: getUserStoriesProcedure

> `const` **getUserStoriesProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `WithId`\<`UserStory`\>[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/userStories.ts:64](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/userStories.ts#L64)

Retrieves all user stories for a given project.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project to retrieve user stories for

## Returns

Array of user story objects

## Http

GET /api/trpc/userStories.getUserStories
