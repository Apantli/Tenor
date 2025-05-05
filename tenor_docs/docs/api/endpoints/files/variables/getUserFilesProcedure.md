[**Tenor API Documentation**](../../README.md)

***

# Variable: getUserFilesProcedure

> `const` **getUserFilesProcedure**: `QueryProcedure`\<\{ `input`: `void`; `output`: `object`[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/files.ts:35](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/files.ts#L35)

Retrieves the list of files associated with the current user.

## Param

None

## Returns

Array of files with their URLs and names.

## Http

GET /api/trpc/files.getUserFiles
