[**Tenor API Documentation**](../../README.md)

***

# Variable: deleteStatusTypeProcedure

> `const` **deleteStatusTypeProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `statusId`: `string`; \}; `output`: \{ `id`: `string`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/settings.ts:383](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/settings.ts#L383)

Deletes a status type from a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project containing the status type
- statusId — ID of the status type to delete

## Returns

Object containing the ID of the deleted status type.

## Http

DELETE /api/trpc/settings.deleteStatusType
