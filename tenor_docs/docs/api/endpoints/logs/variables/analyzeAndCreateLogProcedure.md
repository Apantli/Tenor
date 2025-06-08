[**Tenor API Documentation**](../../README.md)

***

# Variable: analyzeAndCreateLogProcedure

> `const` **analyzeAndCreateLogProcedure**: `MutationProcedure`\<\{ `input`: `void`; `output`: `PostgrestSingleResponse`\<`any`\>; \}\>

Defined in: [tenor\_web/src/server/api/routers/logs.ts:59](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/logs.ts#L59)

Analyzes the user's emotion and creates a new log entry.

## Param

None

## Returns

Object indicating the result of the log creation.

## Http

POST /api/trpc/logs.analyzeAndCreateLog
