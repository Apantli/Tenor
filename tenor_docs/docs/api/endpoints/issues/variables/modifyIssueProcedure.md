[**Tenor API Documentation**](../../README.md)

***

# Variable: modifyIssueProcedure

> `const` **modifyIssueProcedure**: `MutationProcedure`\<\{ `input`: \{ `issueData`: \{ `complete?`: `boolean`; `description`: `string`; `name`: `string`; `priorityId?`: `string`; `relatedUserStoryId`: `string`; `size?`: `"XS"` \| `"S"` \| `"M"` \| `"L"` \| `"XL"` \| `"XXL"`; `sprintId?`: `string`; `statusId?`: `string`; `stepsToRecreate`: `string`; `tagIds`: `string`[]; `taskIds?`: `string`[]; \}; `issueId`: `string`; `projectId`: `string`; \}; `output`: \{ `success`: `boolean`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/issues.ts:491](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/issues.ts#L491)

Modifies an existing issue in a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project containing the issue
- issueId — ID of the issue to modify
- issueData — Updated data for the issue

## Returns

Object indicating success status.

## Http

PUT /api/trpc/issues.modifyIssue
