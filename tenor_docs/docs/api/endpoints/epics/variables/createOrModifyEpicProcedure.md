[**Tenor API Documentation**](../../README.md)

***

# Variable: createOrModifyEpicProcedure

> `const` **createOrModifyEpicProcedure**: `MutationProcedure`\<\{ `input`: \{ `deleted?`: `boolean`; `description`: `string`; `name`: `string`; `projectId`: `string`; `scrumId`: `number`; \}; `output`: `"Epic updated successfully"` \| `"Epic created successfully"`; \}\>

Defined in: [tenor\_web/src/server/api/routers/epics.ts:116](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/epics.ts#L116)

Creates a new epic or updates an existing one in a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to create or update the epic in
- scrumId — Scrum ID of the epic (use -1 for new epics)
- name — Name of the epic
- description — Description of the epic
- deleted — Boolean indicating if the epic is deleted

## Returns

Success message indicating whether the epic was created or updated.

## Http

POST /api/trpc/epics.createOrModifyEpic
