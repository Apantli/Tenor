[**Tenor API Documentation**](../../README.md)

***

# Variable: createUserStoryProcedure

> `const` **createUserStoryProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `userStoryData`: \{ `acceptanceCriteria`: `string`; `complete?`: `boolean`; `deleted?`: `boolean`; `dependencyIds`: `string`[]; `description`: `string`; `epicId`: `string`; `name`: `string`; `priorityId?`: `string`; `requiredByIds`: `string`[]; `size?`: `"XS"` \| `"S"` \| `"M"` \| `"L"` \| `"XL"` \| `"XXL"`; `sprintId?`: `string`; `statusId?`: `string`; `tagIds`: `string`[]; `taskIds?`: `string`[]; \}; \}; `output`: \{ `success`: `boolean`; `userStoryId`: `string`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/userStories.ts:156](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/userStories.ts#L156)

Creates a new user story in the specified project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project where the user story will be created
- userStoryData — Data for the new user story, excluding the scrumId field

## Returns

Object containing success status and the ID of the created user story.

## Http

POST /api/trpc/userStories.createUserStory
