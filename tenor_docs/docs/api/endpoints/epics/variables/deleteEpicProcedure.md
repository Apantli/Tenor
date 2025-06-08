[**Tenor API Documentation**](../../README.md)

***

# Variable: deleteEpicProcedure

> `const` **deleteEpicProcedure**: `MutationProcedure`\<\{ `input`: \{ `epicId`: `string`; `projectId`: `string`; \}; `output`: `void`; \}\>

Defined in: [tenor\_web/src/server/api/routers/epics.ts:158](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/epics.ts#L158)

Marks an epic as deleted in the database.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project
- epicId - String ID of the epic to delete

## Returns

None

## Http

POST /api/trpc/epics.deleteEpic
