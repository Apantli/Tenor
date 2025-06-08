[**Tenor API Documentation**](../../README.md)

***

# Variable: getEpicCountProcedure

> `const` **getEpicCountProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `number`; \}\>

Defined in: [tenor\_web/src/server/api/routers/epics.ts:137](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/epics.ts#L137)

Retrieves the number of epics inside a given project.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project

## Returns

Number of epics in the project regardless of deleted status

## Http

GET /api/trpc/epics.getEpicCount
