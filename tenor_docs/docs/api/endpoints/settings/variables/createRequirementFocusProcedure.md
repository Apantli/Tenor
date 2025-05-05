[**Tenor API Documentation**](../../README.md)

***

# Variable: createRequirementFocusProcedure

> `const` **createRequirementFocusProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `tag`: \{ `color`: `string`; `deleted`: `boolean`; `name`: `string`; \}; \}; `output`: \{ `color`: `string`; `deleted`: `boolean`; `id`: `string`; `name`: `string`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/settings.ts:594](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/settings.ts#L594)

Creates a new requirement focus tag for a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to create the requirement focus tag in
- tag — Tag data conforming to TagSchema

## Returns

Object containing the created requirement focus tag with its ID.

## Http

POST /api/trpc/settings.createRequirementFocus
