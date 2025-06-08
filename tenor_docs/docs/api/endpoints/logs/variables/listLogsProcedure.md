[**Tenor API Documentation**](../../README.md)

***

# Variable: listLogsProcedure

> `const` **listLogsProcedure**: `QueryProcedure`\<\{ `input`: `void`; `output`: `Log`[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/logs.ts:43](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/logs.ts#L43)

Retrieves a list of logs associated with the current user.

## Param

None

## Returns

Array of logs with their details, including emotion and timestamp.

## Http

GET /api/trpc/logs.listLogs
