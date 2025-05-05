[**Tenor API Documentation**](../../README.md)

***

# Variable: createIssueProcedure

> `const` **createIssueProcedure**: `MutationProcedure`\<\{ `input`: \{ `issueData`: \{ `complete?`: `boolean`; `deleted?`: `boolean`; `description`: `string`; `name`: `string`; `priorityId?`: `string`; `relatedUserStoryId`: `string`; `size?`: `"XS"` \| `"S"` \| `"M"` \| `"L"` \| `"XL"` \| `"XXL"`; `sprintId?`: `string`; `statusId?`: `string`; `stepsToRecreate`: `string`; `tagIds`: `string`[]; `taskIds?`: `string`[]; \}; `projectId`: `string`; \}; `output`: \{ `issueId`: `string`; `success`: `boolean`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/issues.ts:322](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/issues.ts#L322)

Creates a new issue in a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to create the issue in
- issueData — Data for the new issue, excluding the scrum ID

## Returns

Object containing the ID of the created issue.

## Http

POST /api/trpc/issues.createIssue
