[**Tenor API Documentation**](../../README.md)

***

# Variable: modifyIssuesRelatedUserStoryProcedure

> `const` **modifyIssuesRelatedUserStoryProcedure**: `MutationProcedure`\<\{ `input`: \{ `issueId`: `string`; `projectId`: `string`; `relatedUserStoryId?`: `string`; \}; `output`: `undefined` \| \{ `issueId`: `string`; `success`: `boolean`; `updatedIssueData`: \{ `complete`: `boolean`; `deleted`: `boolean`; `description`: `string`; `name?`: `string`; `priorityId`: `string`; `relatedUserStoryId`: `string`; `scrumId`: `number`; `size`: `Size`; `sprintId`: `string`; `statusId`: `string`; `stepsToRecreate`: `string`; `tagIds`: `string`[]; `taskIds`: `string`[]; \}; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/issues.ts:626](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/issues.ts#L626)

Modifies the related user story for an issue in a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project containing the issue
- issueId — ID of the issue to modify
- relatedUserStoryId — ID of the related user story (optional)

## Returns

Object containing the updated issue data.

## Http

PUT /api/trpc/issues.modifyIssuesRelatedUserStory
