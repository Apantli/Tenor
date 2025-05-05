[**Tenor API Documentation**](../../README.md)

***

# Variable: getStatusTypeByIdProcedure

> `const` **getStatusTypeByIdProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; `statusId`: `string`; \}; `output`: \{ `color`: `string`; `deleted`: `boolean`; `id`: `string`; `marksTaskAsDone`: `boolean`; `name`: `string`; `orderIndex`: `number`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/settings.ts:239](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/settings.ts#L239)

Retrieves a specific status type by its ID.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project containing the status type
- statusId — ID of the status type to fetch

## Returns

Status type object with its details.

## Http

GET /api/trpc/settings.getStatusTypeById
