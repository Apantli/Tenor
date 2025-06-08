[**Tenor API Documentation**](../../README.md)

***

# Variable: getEpicsProcedure

> `const` **getEpicsProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `WithId`\<`BasicInfo`\>[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/epics.ts:33](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/epics.ts#L33)

Retrieves all epics for a given project.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project to retrieve epics for

## Returns

Array of epic objects containing epic details

## Http

GET /api/trpc/epics.getEpics
