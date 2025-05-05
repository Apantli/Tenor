[**Tenor API Documentation**](../../README.md)

***

# Variable: addFilesProcedure

> `const` **addFilesProcedure**: `MutationProcedure`\<\{ `input`: \{ `files`: `object`[]; `projectId`: `string`; \}; `output`: `void`; \}\>

Defined in: [tenor\_web/src/server/api/routers/settings.ts:1243](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/settings.ts#L1243)

Adds new files to the context of a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to add files to
- files — Array of files to add, each containing:
  - name — Name of the file
  - type — Type of the file
  - content — Base64-encoded content of the file
  - size — Size of the file in bytes

## Returns

Void.

## Http

POST /api/trpc/settings.addFiles
