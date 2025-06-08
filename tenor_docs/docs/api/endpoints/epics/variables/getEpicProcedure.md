[**Tenor API Documentation**](../../README.md)

***

# Variable: getEpicProcedure

> `const` **getEpicProcedure**: `QueryProcedure`\<\{ `input`: \{ `epicId`: `string`; `projectId`: `string`; \}; `output`: `WithId`\<`BasicInfo`\>; \}\>

Defined in: [tenor\_web/src/server/api/routers/epics.ts:52](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/epics.ts#L52)

Retrieves a specific epic by its ID within a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project
- epicId - String ID of the epic to retrieve

## Returns

Epic object containing details or null if not found

## Http

GET /api/trpc/epics.getEpic
