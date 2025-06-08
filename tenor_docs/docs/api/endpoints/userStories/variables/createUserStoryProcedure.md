[**Tenor API Documentation**](../../README.md)

***

# Variable: createUserStoryProcedure

> `const` **createUserStoryProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `userStoryData`: \{ `acceptanceCriteria`: `string`; `complete?`: `boolean`; `createdAt?`: `Timestamp`; `deleted?`: `boolean`; `dependencyIds?`: `string`[]; `description`: `string`; `epicId`: `string`; `name`: `string`; `priorityId?`: `string`; `requiredByIds?`: `string`[]; `size?`: `""` \| `"XS"` \| `"S"` \| `"M"` \| `"L"` \| `"XL"` \| `"XXL"`; `sprintId?`: `string`; `statusId?`: `string`; `tagIds`: `string`[]; `taskIds?`: `string`[]; \}; \}; `output`: `WithId`\<`UserStory`\>; \}\>

Defined in: [tenor\_web/src/server/api/routers/userStories.ts:134](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/userStories.ts#L134)

Creates a new user story or modifies an existing one.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project to which the user story belongs
- userStoryData - UserStorySchema object containing the data for the user story

## Returns

The created or modified user story

## Http

POST /api/trpc/userStories.createUserStory
