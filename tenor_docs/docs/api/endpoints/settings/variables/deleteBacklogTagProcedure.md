[**Tenor API Documentation**](../../README.md)

***

# Variable: deleteBacklogTagProcedure

> `const` **deleteBacklogTagProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `tagId`: `string`; \}; `output`: \{ `id`: `string`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/settings.ts:541](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/settings.ts#L541)

Deletes a backlog tag from a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project containing the backlog tag
- tagId — ID of the backlog tag to delete

## Returns

Object containing the ID of the deleted backlog tag.

## Http

DELETE /api/trpc/settings.deleteBacklogTag
