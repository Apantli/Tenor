[**Tenor API Documentation**](../../README.md)

***

# Variable: getUserStoryDetailProcedure

> `const` **getUserStoryDetailProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; `userStoryId`: `string`; \}; `output`: `UserStoryDetail`; \}\>

Defined in: [tenor\_web/src/server/api/routers/userStories.ts:301](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/userStories.ts#L301)

Retrieves detailed information about a specific user story.

## Param

Object containing procedure parameters
Input object structure:
- userStoryId — ID of the user story to fetch details for
- projectId — ID of the project containing the user story

## Returns

Detailed information about the user story.

## Http

GET /api/trpc/userStories.getUserStoryDetail
