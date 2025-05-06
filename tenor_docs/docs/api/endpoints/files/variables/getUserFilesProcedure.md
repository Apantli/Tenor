[**Tenor API Documentation**](../../README.md)

***

# Variable: getUserFilesProcedure

> `const` **getUserFilesProcedure**: `QueryProcedure`\<\{ `input`: `void`; `output`: `object`[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/files.ts:35](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/files.ts#L35)

Retrieves the list of files associated with the current user.

## Param

None

## Returns

Array of files with their URLs and names.

## Http

GET /api/trpc/files.getUserFiles
