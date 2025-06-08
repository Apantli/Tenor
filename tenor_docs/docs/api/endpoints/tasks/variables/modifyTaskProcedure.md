[**Tenor API Documentation**](../../README.md)

***

# Variable: modifyTaskProcedure

> `const` **modifyTaskProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `taskData`: \{ `assigneeId`: `string`; `createdAt?`: `Timestamp`; `dependencyIds?`: `string`[]; `description`: `string`; `dueDate?`: `Timestamp`; `name`: `string`; `requiredByIds?`: `string`[]; `size?`: `""` \| `"XS"` \| `"S"` \| `"M"` \| `"L"` \| `"XL"` \| `"XXL"`; `statusChangeDate?`: `Timestamp`; `statusId`: `string`; \}; `taskId`: `string`; \}; `output`: \{ `updatedTaskds`: `string`[]; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/tasks.ts:315](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/tasks.ts#L315)

Updates a task with new data.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project
- taskId - String ID of the task to modify
- taskData - The new task data

## Returns

Object with IDs of updated tasks

## Throws

If modification would create a dependency cycle

## Http

POST /api/trpc/tasks.modifyTask
