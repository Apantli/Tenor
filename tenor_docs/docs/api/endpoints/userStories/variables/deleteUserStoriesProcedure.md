[**Tenor API Documentation**](../../README.md)

***

# Variable: deleteUserStoriesProcedure

> `const` **deleteUserStoriesProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `userStoryIds`: `string`[]; \}; `output`: \{ `modifiedTaskIds`: `string`[]; `success`: `boolean`; `updatedUserStoryIds`: `string`[]; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/userStories.ts:439](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/userStories.ts#L439)

Deletes multiple user stories by marking them as deleted.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project
- userStoryIds - Array of String IDs of the user stories to delete

## Returns

Object indicating success and the IDs of updated user stories

## Http

DELETE /api/trpc/userStories.deleteUserStories
