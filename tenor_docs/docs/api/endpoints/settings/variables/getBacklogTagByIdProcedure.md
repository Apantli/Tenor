[**Tenor API Documentation**](../../README.md)

***

# Variable: getBacklogTagByIdProcedure

> `const` **getBacklogTagByIdProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; `tagId`: `string`; \}; `output`: \{ `color`: `string`; `deleted`: `boolean`; `id`: `string`; `name`: `string`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/settings.ts:457](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/settings.ts#L457)

Retrieves a specific backlog tag by its ID.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project containing the backlog tag
- tagId — ID of the backlog tag to fetch

## Returns

Backlog tag object with its details.

## Http

GET /api/trpc/settings.getBacklogTagById
