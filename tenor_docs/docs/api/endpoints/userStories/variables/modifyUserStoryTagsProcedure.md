[**Tenor API Documentation**](../../README.md)

***

# Variable: modifyUserStoryTagsProcedure

> `const` **modifyUserStoryTagsProcedure**: `MutationProcedure`\<\{ `input`: \{ `priorityId?`: `string`; `projectId`: `string`; `size?`: `string`; `statusId?`: `string`; `userStoryId`: `string`; \}; `output`: `void`; \}\>

Defined in: [tenor\_web/src/server/api/routers/userStories.ts:488](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/userStories.ts#L488)

Modifies the tags of an existing user story.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project to which the user story belongs
- userStoryId - String ID of the user story to modify
- priorityId - String ID of the priority tag to set (optional)
- size - String size of the user story (optional)
- statusId - String ID of the status tag to set (optional)

## Http

PATCH /api/trpc/userStories.modifyUserStoryTags
