[**Tenor API Documentation**](../../README.md)

***

# Variable: getIssueDetailProcedure

> `const` **getIssueDetailProcedure**: `QueryProcedure`\<\{ `input`: \{ `issueId`: `string`; `projectId`: `string`; \}; `output`: `IssueDetail`; \}\>

Defined in: [tenor\_web/src/server/api/routers/issues.ts:363](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/issues.ts#L363)

Retrieves detailed information about a specific issue.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project containing the issue
- issueId — ID of the issue to retrieve details for

## Returns

Detailed issue object, including tasks, tags, priority, status, and related user story.

## Http

GET /api/trpc/issues.getIssueDetail
