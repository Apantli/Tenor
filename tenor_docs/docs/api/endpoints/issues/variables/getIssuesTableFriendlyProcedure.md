[**Tenor API Documentation**](../../README.md)

***

# Variable: getIssuesTableFriendlyProcedure

> `const` **getIssuesTableFriendlyProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: [`IssueCol`](../interfaces/IssueCol.md)[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/issues.ts:217](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/issues.ts#L217)

Retrieves issues for a project in a table-friendly format.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to fetch issues for

## Returns

Array of issues with their details, including priority, related user story, and assigned users.

## Http

GET /api/trpc/issues.getIssuesTableFriendly
