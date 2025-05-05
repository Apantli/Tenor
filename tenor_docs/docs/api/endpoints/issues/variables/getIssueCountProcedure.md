[**Tenor API Documentation**](../../README.md)

***

# Variable: getIssueCountProcedure

> `const` **getIssueCountProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `number`; \}\>

Defined in: [tenor\_web/src/server/api/routers/issues.ts:672](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/issues.ts#L672)

Retrieves the count of issues in a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to count issues for

## Returns

Number of issues in the project.

## Http

GET /api/trpc/issues.getIssueCount
