[**Tenor API Documentation**](../../README.md)

***

# Variable: updateTextContextProcedure

> `const` **updateTextContextProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `text`: `string`; \}; `output`: `void`; \}\>

Defined in: [tenor\_web/src/server/api/routers/settings.ts:1131](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/settings.ts#L1131)

Updates the context dialog text for a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to update context dialog text in
- text — New context dialog text

## Returns

Void.

## Http

PUT /api/trpc/settings.updateTextContext
