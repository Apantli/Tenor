[**Tenor API Documentation**](../../README.md)

***

# Variable: getRetrospectiveIdProcedure

> `const` **getRetrospectiveIdProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; `sprintId`: `string`; \}; `output`: `number`; \}\>

Defined in: [tenor\_web/src/server/api/routers/sprintRetrospectives.ts:42](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/sprintRetrospectives.ts#L42)

Retrieves the ID of a retrospective associated with a given sprint.
If the retrospective does not exist, it is created automatically.

## Param

Object containing the `sprintId` (string).

## Returns

The ID of the existing or newly created retrospective (number).

## Http

GET /api/trpc/sprintRetrospectives.getRetrospectiveId
