[**Tenor API Documentation**](../../README.md)

***

# Variable: addLinkProcedure

> `const` **addLinkProcedure**: `MutationProcedure`\<\{ `input`: \{ `link`: `string`; `projectId`: `string`; \}; `output`: `void`; \}\>

Defined in: [tenor\_web/src/server/api/routers/settings.ts:1163](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/settings.ts#L1163)

Adds a new link to the context of a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to add the link to
- link — URL of the link to add

## Returns

Void.

## Http

POST /api/trpc/settings.addLink
