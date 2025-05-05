[**Tenor API Documentation**](../../README.md)

***

# Variable: modifyBacklogTagProcedure

> `const` **modifyBacklogTagProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `tag`: \{ `color`: `string`; `deleted`: `boolean`; `name`: `string`; \}; `tagId`: `string`; \}; `output`: \{ `color`: `string`; `deleted`: `boolean`; `id`: `string`; `name`: `string`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/settings.ts:512](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/settings.ts#L512)

Modifies an existing backlog tag in a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project containing the backlog tag
- tagId — ID of the backlog tag to modify
- tag — Updated tag data conforming to TagSchema

## Returns

Object containing the updated backlog tag with its ID.

## Http

PUT /api/trpc/settings.modifyBacklogTag
