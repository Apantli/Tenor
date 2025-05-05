[**Tenor API Documentation**](../../README.md)

***

# Variable: getEpicProcedure

> `const` **getEpicProcedure**: `QueryProcedure`\<\{ `input`: \{ `epicId`: `number`; `projectId`: `string`; \}; `output`: \{ `deleted`: `boolean`; `description`: `string`; `name`: `string`; `scrumId`: `number`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/epics.ts:81](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/epics.ts#L81)

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
