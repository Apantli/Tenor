[**Tenor API Documentation**](../../README.md)

***

# Variable: getSizeTypesProcedure

> `const` **getSizeTypesProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `number`[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/settings.ts:619](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/settings.ts#L619)

Retrieves all size types for a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to fetch size types from

## Returns

Array of size types.

## Http

GET /api/trpc/settings.getSizeTypes
