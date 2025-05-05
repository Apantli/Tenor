[**Tenor API Documentation**](../../README.md)

***

# Variable: getPriorityTypesProcedure

> `const` **getPriorityTypesProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `object`[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/settings.ts:176](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/settings.ts#L176)

Retrieves all priority types for a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to fetch priority types from

## Returns

Array of priority type tags.

## Http

GET /api/trpc/settings.getPriorityTypes
