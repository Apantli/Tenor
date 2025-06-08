[**Tenor API Documentation**](../../README.md)

***

# Variable: getUserFilesProcedure

> `const` **getUserFilesProcedure**: `QueryProcedure`\<\{ `input`: `void`; `output`: `object`[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/files.ts:36](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/files.ts#L36)

Retrieves files associated with the current user.

## Param

None

## Returns

Array of file objects containing URL and name information.

## Http

GET /api/trpc/files.getUserFiles
