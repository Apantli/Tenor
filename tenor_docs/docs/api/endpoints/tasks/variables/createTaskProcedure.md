[**Tenor API Documentation**](../../README.md)

***

# Variable: createTaskProcedure

> `const` **createTaskProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `taskData`: \{ `assigneeId`: `string`; `createdAt?`: `Timestamp`; `deleted?`: `boolean`; `dependencyIds?`: `string`[]; `description`: `string`; `dueDate?`: `Timestamp`; `itemId`: `string`; `itemType`: `"US"` \| `"IS"` \| `"IT"`; `name`: `string`; `requiredByIds?`: `string`[]; `size?`: `""` \| `"XS"` \| `"S"` \| `"M"` \| `"L"` \| `"XL"` \| `"XXL"`; `statusChangeDate?`: `Timestamp`; `statusId`: `string`; \}; \}; `output`: `WithId`\<`Task`\>; \}\>

Defined in: [tenor\_web/src/server/api/routers/tasks.ts:130](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/tasks.ts#L130)

Creates a new task in the specified project and assigns it a scrumId.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project
- taskData - The task data without scrumId

## Returns

Object with the created task ID and data

## Throws

If there's an error creating the task or if it would create a dependency cycle

## Http

POST /api/trpc/tasks.createTask
