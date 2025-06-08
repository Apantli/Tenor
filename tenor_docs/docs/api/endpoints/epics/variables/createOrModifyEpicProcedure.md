[**Tenor API Documentation**](../../README.md)

***

# Variable: createOrModifyEpicProcedure

> `const` **createOrModifyEpicProcedure**: `MutationProcedure`\<\{ `input`: \{ `epicData`: \{ `createdAt?`: `Timestamp`; `deleted?`: `boolean`; `description`: `string`; `name`: `string`; `scrumId`: `number`; \}; `epicId?`: `string`; `projectId`: `string`; \}; `output`: `void`; \}\>

Defined in: [tenor\_web/src/server/api/routers/epics.ts:72](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/epics.ts#L72)

Creates a new epic or modifies an existing one.

## Param

Object containing procedure parameters
Input object structure:
- epicData - Object containing epic details conforming to EpicSchema
- projectId - String ID of the project
- epicId - Optional string ID of the epic to modify (when updating)

## Returns

None

## Http

POST /api/trpc/epics.createOrModifyEpic
