[**Tenor API Documentation**](../../README.md)

***

# Variable: getBacklogTagsProcedure

> `const` **getBacklogTagsProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `object`[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/settings.ts:426](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/settings.ts#L426)

Retrieves all backlog tags for a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to fetch backlog tags from

## Returns

Array of backlog tags.

## Http

GET /api/trpc/settings.getBacklogTags
