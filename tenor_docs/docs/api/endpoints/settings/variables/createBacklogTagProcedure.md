[**Tenor API Documentation**](../../README.md)

***

# Variable: createBacklogTagProcedure

> `const` **createBacklogTagProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `tag`: \{ `color`: `string`; `deleted`: `boolean`; `name`: `string`; \}; \}; `output`: \{ `color`: `string`; `deleted`: `boolean`; `id`: `string`; `name`: `string`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/settings.ts:485](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/settings.ts#L485)

Creates a new backlog tag for a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to create the backlog tag in
- tag — Tag data conforming to TagSchema

## Returns

Object containing the created backlog tag with its ID.

## Http

POST /api/trpc/settings.createBacklogTag
