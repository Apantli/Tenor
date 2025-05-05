[**Tenor API Documentation**](../../README.md)

***

# Variable: reorderStatusTypesProcedure

> `const` **reorderStatusTypesProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `statusIds`: `string`[]; \}; `output`: `void`; \}\>

Defined in: [tenor\_web/src/server/api/routers/settings.ts:321](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/settings.ts#L321)

Reorders status types for a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to reorder status types in
- statusIds — Array of status type IDs in the desired order

## Returns

Void.

## Http

PUT /api/trpc/settings.reorderStatusTypes
