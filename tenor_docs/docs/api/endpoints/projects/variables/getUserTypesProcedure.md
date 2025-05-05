[**Tenor API Documentation**](../../README.md)

***

# Variable: getUserTypesProcedure

> `const` **getUserTypesProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `object`[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/projects.ts:508](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/projects.ts#L508)

Retrieves user types (roles) for a specific project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to fetch user types for

## Returns

Array of user types with their labels.

## Http

GET /api/trpc/projects.getUserTypes
