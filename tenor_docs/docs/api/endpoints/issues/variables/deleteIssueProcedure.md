[**Tenor API Documentation**](../../README.md)

***

# Variable: deleteIssueProcedure

> `const` **deleteIssueProcedure**: `MutationProcedure`\<\{ `input`: \{ `issueId`: `string`; `projectId`: `string`; \}; `output`: \{ `success`: `boolean`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/issues.ts:522](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/issues.ts#L522)

Deletes an issue from a project (soft delete).

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project containing the issue
- issueId — ID of the issue to delete

## Returns

Object indicating success status.

## Http

DELETE /api/trpc/issues.deleteIssue
