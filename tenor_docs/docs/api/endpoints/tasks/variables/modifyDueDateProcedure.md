[**Tenor API Documentation**](../../README.md)

***

# Variable: modifyDueDateProcedure

> `const` **modifyDueDateProcedure**: `MutationProcedure`\<\{ `input`: \{ `dueDate`: `Timestamp`; `projectId`: `string`; `taskId`: `string`; \}; `output`: `void`; \}\>

Defined in: [tenor\_web/src/server/api/routers/tasks.ts:277](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/tasks.ts#L277)

Updates the due date of a task.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project
- taskId - String ID of the task
- dueDate - Timestamp for the new due date

## Returns

void

## Http

POST /api/trpc/tasks.modifyDueDate
