[**Tenor API Documentation**](../../README.md)

***

# Variable: getIssueProcedure

> `const` **getIssueProcedure**: `QueryProcedure`\<\{ `input`: \{ `issueId`: `string`; `projectId`: `string`; \}; `output`: \{ `id`: `string`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/issues.ts:288](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/issues.ts#L288)

Retrieves a specific issue by ID.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project containing the issue
- issueId — ID of the issue to retrieve

## Returns

Issue object with its details.

## Http

GET /api/trpc/issues.getIssue
