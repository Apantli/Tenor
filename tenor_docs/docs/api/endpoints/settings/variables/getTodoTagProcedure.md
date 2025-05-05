[**Tenor API Documentation**](../../README.md)

***

# Variable: getTodoTagProcedure

> `const` **getTodoTagProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: \{ `color`: `string`; `deleted`: `boolean`; `id`: `string`; `marksTaskAsDone`: `boolean`; `name`: `string`; `orderIndex`: `number`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/settings.ts:940](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/settings.ts#L940)

Retrieves the "to do" status tag for a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to fetch the todo tag from

## Returns

Todo status tag object with its details.

## Http

GET /api/trpc/settings.getTodoTag
