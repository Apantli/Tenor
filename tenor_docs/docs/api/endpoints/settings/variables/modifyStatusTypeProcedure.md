[**Tenor API Documentation**](../../README.md)

***

# Variable: modifyStatusTypeProcedure

> `const` **modifyStatusTypeProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `status`: \{ `color`: `string`; `deleted`: `boolean`; `marksTaskAsDone`: `boolean`; `name`: `string`; `orderIndex`: `number`; \}; `statusId`: `string`; \}; `output`: \{ `color`: `string`; `deleted`: `boolean`; `id`: `string`; `marksTaskAsDone`: `boolean`; `name`: `string`; `orderIndex`: `number`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/settings.ts:354](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/settings.ts#L354)

Modifies an existing status type in a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project containing the status type
- statusId — ID of the status type to modify
- status — Updated status type data

## Returns

Object containing the updated status type with its ID.

## Http

PUT /api/trpc/settings.modifyStatusType
