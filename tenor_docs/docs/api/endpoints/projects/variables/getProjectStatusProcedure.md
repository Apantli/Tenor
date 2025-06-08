[**Tenor API Documentation**](../../README.md)

***

# Variable: getProjectStatusProcedure

> `const` **getProjectStatusProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: \{ `assignedUssers`: `never`[]; `completedCount`: `number`; `currentSprintDescription`: `string`; `currentSprintEndDate`: `string`; `currentSprintId`: `string`; `currentSprintNumber`: `string`; `currentSprintStartDate`: `string`; `projectId`: `string`; `taskCount`: `number`; \} \| \{ `assignedUssers`: `object`[]; `completedCount`: `number`; `currentSprintDescription`: `string`; `currentSprintEndDate`: `Date`; `currentSprintId`: `string`; `currentSprintNumber`: `number`; `currentSprintStartDate`: `Date`; `projectId`: `string`; `taskCount`: `number`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/projects.ts:510](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/projects.ts#L510)

Gets the current status of a specific project.

## Param

Object containing projectId

## Returns

Project status data

## Http

GET /api/trpc/projects.getProjectStatus
