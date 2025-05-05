[**Tenor API Documentation**](../../README.md)

***

# Variable: modifyIssuesTagsProcedure

> `const` **modifyIssuesTagsProcedure**: `MutationProcedure`\<\{ `input`: \{ `issueId`: `string`; `priorityId?`: `string`; `projectId`: `string`; `size?`: `string`; `statusId?`: `string`; \}; `output`: `undefined` \| \{ `issueId`: `string`; `success`: `boolean`; `updatedIssueData`: \{ `complete`: `boolean`; `deleted`: `boolean`; `description`: `string`; `name?`: `string`; `priorityId`: `string`; `relatedUserStoryId`: `string`; `scrumId`: `number`; `size`: `string`; `sprintId`: `string`; `statusId`: `string`; `stepsToRecreate`: `string`; `tagIds`: `string`[]; `taskIds`: `string`[]; \}; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/issues.ts:569](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/issues.ts#L569)

Modifies tags for an issue in a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project containing the issue
- issueId — ID of the issue to modify tags for
- size — New size for the issue (optional)
- priorityId — New priority ID for the issue (optional)
- statusId — New status ID for the issue (optional)

## Returns

Object containing the updated issue data.

## Http

PUT /api/trpc/issues.modifyIssuesTags
