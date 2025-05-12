[**Tenor API Documentation**](../../README.md)

***

# Variable: getEpicProcedure

> `const` **getEpicProcedure**: `QueryProcedure`\<\{ `input`: \{ `epicId`: `number`; `projectId`: `string`; \}; `output`: \{ `deleted`: `boolean`; `description`: `string`; `name`: `string`; `scrumId`: `number`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/epics.ts:81](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/epics.ts#L81)

Retrieves a specific epic by its scrum ID.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project containing the epic
- epicId — Scrum ID of the epic to retrieve

## Returns

Epic object with its details.

## Http

GET /api/trpc/epics.getEpic
