[**Tenor API Documentation**](../../README.md)

***

# Variable: analyzeAndCreateLogProcedure

> `const` **analyzeAndCreateLogProcedure**: `MutationProcedure`\<\{ `input`: `void`; `output`: `PostgrestSingleResponse`\<`any`\>; \}\>

Defined in: [tenor\_web/src/server/api/routers/logs.ts:59](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/logs.ts#L59)

Analyzes the user's emotion and creates a new log entry.

## Param

None

## Returns

Object indicating the result of the log creation.

## Http

POST /api/trpc/logs.analyzeAndCreateLog
