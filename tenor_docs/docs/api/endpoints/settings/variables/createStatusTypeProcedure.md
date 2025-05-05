[**Tenor API Documentation**](../../README.md)

***

# Variable: createStatusTypeProcedure

> `const` **createStatusTypeProcedure**: `MutationProcedure`\<\{ `input`: \{ `color`: `string`; `marksTaskAsDone`: `boolean`; `name`: `string`; `projectId`: `string`; \}; `output`: \{ `color`: `string`; `deleted`: `boolean`; `id`: `string`; `marksTaskAsDone`: `boolean`; `name`: `string`; `orderIndex`: `number`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/settings.ts:269](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/settings.ts#L269)

Creates a new status type for a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to create the status type in
- name — Name of the status type
- color — Color of the status type
- marksTaskAsDone — Whether the status marks a task as done

## Returns

Object containing the created status type with its ID.

## Http

POST /api/trpc/settings.createStatusType
