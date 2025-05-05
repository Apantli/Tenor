[**Tenor API Documentation**](../../README.md)

***

# Variable: getContextFilesProcedure

> `const` **getContextFilesProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `object`[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/settings.ts:1077](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/settings.ts#L1077)

Retrieves all context files for a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to fetch context files from

## Returns

Array of context files with their name, type, and size.

## Http

GET /api/trpc/settings.getContextFiles
