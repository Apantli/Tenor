[**Tenor API Documentation**](../../README.md)

***

# Variable: createStatusListProcedure

> `const` **createStatusListProcedure**: `MutationProcedure`\<\{ `input`: \{ `color`: `string`; `marksTaskAsDone`: `boolean`; `name`: `string`; `projectId`: `string`; \}; `output`: \{ `color`: `string`; `deleted`: `boolean`; `id`: `string`; `marksTaskAsDone`: `boolean`; `name`: `string`; `orderIndex`: `number`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/kanban.ts:387](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/kanban.ts#L387)

Creates a new status list for a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to create the status list in
- name — Name of the status list
- color — Color of the status list
- marksTaskAsDone — Boolean indicating if the status marks tasks as done

## Returns

Object containing the details of the created status list.

## Http

POST /api/trpc/kanban.createStatusList
