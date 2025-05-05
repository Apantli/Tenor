[**Tenor API Documentation**](../../README.md)

***

# Variable: getContextLinksProcedure

> `const` **getContextLinksProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `string`[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/settings.ts:1051](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/settings.ts#L1051)

Retrieves all context links for a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to fetch context links from

## Returns

Array of context links.

## Http

GET /api/trpc/settings.getContextLinks
