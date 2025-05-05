[**Tenor API Documentation**](../../README.md)

***

# Variable: removeLinkProcedure

> `const` **removeLinkProcedure**: `MutationProcedure`\<\{ `input`: \{ `link`: `string`; `projectId`: `string`; \}; `output`: `void`; \}\>

Defined in: [tenor\_web/src/server/api/routers/settings.ts:1203](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/settings.ts#L1203)

Removes a link from the context of a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to remove the link from
- link — URL of the link to remove

## Returns

Void.

## Http

DELETE /api/trpc/settings.removeLink
