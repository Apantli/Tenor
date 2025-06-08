[**Tenor API Documentation**](../../README.md)

***

# Variable: getUserStoryDetailProcedure

> `const` **getUserStoryDetailProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; `userStoryId`: `string`; \}; `output`: `UserStoryDetail` & `object`; \}\>

Defined in: [tenor\_web/src/server/api/routers/userStories.ts:107](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/userStories.ts#L107)

Retrieves detailed information about a specific user story.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project to which the user story belongs
- userStoryId - String ID of the user story to retrieve

## Returns

Detailed user story information

## Http

GET /api/trpc/userStories.getUserStoryDetail
