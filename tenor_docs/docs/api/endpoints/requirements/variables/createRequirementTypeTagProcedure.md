[**Tenor API Documentation**](../../README.md)

***

# Variable: createRequirementTypeTagProcedure

> `const` **createRequirementTypeTagProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `tag`: \{ `color`: `string`; `deleted`: `boolean`; `name`: `string`; \}; \}; `output`: \{ `id`: `string`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/requirements.ts:320](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/requirements.ts#L320)

Creates a new requirement type tag for a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to create the requirement type tag in
- tag — Tag data conforming to TagSchema

## Returns

Object containing the ID of the created requirement type tag.

## Http

POST /api/trpc/requirements.createRequirementTypeTag
