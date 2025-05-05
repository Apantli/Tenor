[**Tenor API Documentation**](../../README.md)

***

# Variable: modifyRequirementTypeTagProcedure

> `const` **modifyRequirementTypeTagProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `tag`: \{ `color`: `string`; `deleted`: `boolean`; `name`: `string`; \}; `tagId`: `string`; \}; `output`: \{ `id`: `string`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/requirements.ts:347](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/requirements.ts#L347)

Modifies an existing requirement type tag in a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project containing the requirement type tag
- tagId — ID of the requirement type tag to modify
- tag — Updated tag data conforming to TagSchema

## Returns

Object containing the ID of the modified requirement type tag.

## Http

PUT /api/trpc/requirements.modifyRequirementTypeTag
