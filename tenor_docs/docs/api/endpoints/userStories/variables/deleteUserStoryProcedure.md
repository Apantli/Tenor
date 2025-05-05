[**Tenor API Documentation**](../../README.md)

***

# Variable: deleteUserStoryProcedure

> `const` **deleteUserStoryProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `userStoryId`: `string`; \}; `output`: \{ `success`: `boolean`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/userStories.ts:667](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/userStories.ts#L667)

Deletes a specific user story from a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project containing the user story
- userStoryId — ID of the user story to delete

## Returns

Object containing success status.

## Http

DELETE /api/trpc/userStories.deleteUserStory
