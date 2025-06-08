[**Tenor API Documentation**](../../README.md)

***

# Variable: modifyUserStoryProcedure

> `const` **modifyUserStoryProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `userStoryData`: \{ `acceptanceCriteria`: `string`; `complete?`: `boolean`; `createdAt?`: `Timestamp`; `dependencyIds?`: `string`[]; `description`: `string`; `epicId`: `string`; `name`: `string`; `priorityId?`: `string`; `requiredByIds?`: `string`[]; `size?`: `""` \| `"XS"` \| `"S"` \| `"M"` \| `"L"` \| `"XL"` \| `"XXL"`; `sprintId?`: `string`; `statusId?`: `string`; `tagIds`: `string`[]; `taskIds?`: `string`[]; \}; `userStoryId`: `string`; \}; `output`: \{ `updatedUserStoryIds`: `string`[]; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/userStories.ts:247](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/userStories.ts#L247)

Modifies an existing user story.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project to which the user story belongs
- userStoryId - String ID of the user story to modify
- userStoryData - UserStorySchema object containing the data for the user story

## Returns

Object indicating success and the IDs of updated user stories

## Http

PATCH /api/trpc/userStories.modifyUserStory
