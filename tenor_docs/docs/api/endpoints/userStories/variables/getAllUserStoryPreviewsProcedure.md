[**Tenor API Documentation**](../../README.md)

***

# Variable: getAllUserStoryPreviewsProcedure

> `const` **getAllUserStoryPreviewsProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `object`[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/userStories.ts:453](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/userStories.ts#L453)

Retrieves previews of all user stories in a specific project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to fetch user story previews from

## Returns

Array of user story previews with their ID, scrumId, and name.

## Http

GET /api/trpc/userStories.getAllUserStoryPreviews
