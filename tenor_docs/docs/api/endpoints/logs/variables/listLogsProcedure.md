[**Tenor API Documentation**](../../README.md)

***

# Variable: listLogsProcedure

> `const` **listLogsProcedure**: `QueryProcedure`\<\{ `input`: `void`; `output`: `Log`[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/logs.ts:43](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/logs.ts#L43)

Retrieves a list of logs associated with the current user.

## Param

None

## Returns

Array of logs with their details, including emotion and timestamp.

## Http

GET /api/trpc/logs.listLogs
