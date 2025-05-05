[**Tenor API Documentation**](../../README.md)

***

# Variable: changeSizeProcedure

> `const` **changeSizeProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `size`: `number`[]; \}; `output`: `void`; \}\>

Defined in: [tenor\_web/src/server/api/routers/settings.ts:647](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/settings.ts#L647)

Updates the size types for a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to update size types in
- size — Array of size values

## Returns

Void.

## Http

PUT /api/trpc/settings.changeSize
