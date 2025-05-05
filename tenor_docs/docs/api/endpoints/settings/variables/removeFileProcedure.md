[**Tenor API Documentation**](../../README.md)

***

# Variable: removeFileProcedure

> `const` **removeFileProcedure**: `MutationProcedure`\<\{ `input`: \{ `file`: `string`; `projectId`: `string`; \}; `output`: `void`; \}\>

Defined in: [tenor\_web/src/server/api/routers/settings.ts:1294](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/settings.ts#L1294)

Removes a file from the context of a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to remove the file from
- file — Name of the file to remove

## Returns

Void.

## Http

DELETE /api/trpc/settings.removeFile
