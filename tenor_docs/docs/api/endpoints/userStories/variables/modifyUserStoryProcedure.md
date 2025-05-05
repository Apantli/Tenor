[**Tenor API Documentation**](../../README.md)

***

# Variable: modifyUserStoryProcedure

> `const` **modifyUserStoryProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `userStoryData`: \{ `acceptanceCriteria`: `string`; `complete?`: `boolean`; `dependencyIds`: `string`[]; `description`: `string`; `epicId`: `string`; `name`: `string`; `priorityId?`: `string`; `requiredByIds`: `string`[]; `size?`: `"XS"` \| `"S"` \| `"M"` \| `"L"` \| `"XL"` \| `"XXL"`; `sprintId?`: `string`; `statusId?`: `string`; `tagIds`: `string`[]; `taskIds?`: `string`[]; \}; `userStoryId`: `string`; \}; `output`: \{ `success`: `boolean`; `updatedUserStoryIds`: `string`[]; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/userStories.ts:491](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/userStories.ts#L491)

Modifies an existing user story in a specific project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project containing the user story
- userStoryId — ID of the user story to modify
- userStoryData — Updated data for the user story, excluding scrumId and deleted fields

## Returns

Object containing success status and updated user story IDs.

## Http

PUT /api/trpc/userStories.modifyUserStory
