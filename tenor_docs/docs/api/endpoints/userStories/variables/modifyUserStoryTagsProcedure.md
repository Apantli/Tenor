[**Tenor API Documentation**](../../README.md)

***

# Variable: modifyUserStoryTagsProcedure

> `const` **modifyUserStoryTagsProcedure**: `MutationProcedure`\<\{ `input`: \{ `priorityId?`: `string`; `projectId`: `string`; `size?`: `string`; `statusId?`: `string`; `userStoryId`: `string`; \}; `output`: `undefined` \| \{ `success`: `boolean`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/userStories.ts:616](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/userStories.ts#L616)

Modifies tags for a specific user story.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project containing the user story
- userStoryId — ID of the user story to modify
- priorityId — (Optional) New priority tag ID
- size — (Optional) New size tag
- statusId — (Optional) New status tag ID

## Returns

Object containing success status.

## Http

PUT /api/trpc/userStories.modifyUserStoryTags
