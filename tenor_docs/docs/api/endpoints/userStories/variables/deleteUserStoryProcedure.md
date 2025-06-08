[**Tenor API Documentation**](../../README.md)

***

# Variable: deleteUserStoryProcedure

> `const` **deleteUserStoryProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `userStoryId`: `string`; \}; `output`: \{ `modifiedTaskIds`: `string`[]; `success`: `boolean`; `updatedUserStoryIds`: `string`[]; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/userStories.ts:392](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/userStories.ts#L392)

Deletes a user story by marking it as deleted.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project to which the user story belongs
- userStoryId - String ID of the user story to delete

## Returns

Object indicating success and the IDs of updated user stories

## Http

DELETE /api/trpc/userStories.deleteUserStory
