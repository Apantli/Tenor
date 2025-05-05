[**Tenor API Documentation**](../../README.md)

***

# Variable: getContextDialogProcedure

> `const` **getContextDialogProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `string`; \}\>

Defined in: [tenor\_web/src/server/api/routers/settings.ts:1106](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/settings.ts#L1106)

Retrieves the context dialog text for a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to fetch context dialog text from

## Returns

Context dialog text.

## Http

GET /api/trpc/settings.getContextDialog
