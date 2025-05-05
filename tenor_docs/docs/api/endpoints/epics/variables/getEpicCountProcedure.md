[**Tenor API Documentation**](../../README.md)

***

# Variable: getEpicCountProcedure

> `const` **getEpicCountProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `number`; \}\>

Defined in: [tenor\_web/src/server/api/routers/epics.ts:167](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/epics.ts#L167)

Retrieves the count of epics in a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to count epics for

## Returns

Number of epics in the project.

## Http

GET /api/trpc/epics.getEpicCount
