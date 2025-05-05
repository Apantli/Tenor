[**Tenor API Documentation**](../../README.md)

***

# Variable: getStatusTypesProcedure

> `const` **getStatusTypesProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `object`[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/settings.ts:206](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/settings.ts#L206)

Retrieves all status types for a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to fetch status types from

## Returns

Array of status type tags.

## Http

GET /api/trpc/settings.getStatusTypes
