[**Tenor API Documentation**](../../README.md)

***

# Variable: modifyRequirementFocusTagProcedure

> `const` **modifyRequirementFocusTagProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `tag`: \{ `color`: `string`; `deleted`: `boolean`; `name`: `string`; \}; `tagId`: `string`; \}; `output`: \{ `id`: `string`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/requirements.ts:498](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/requirements.ts#L498)

Modifies an existing requirement focus tag in a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project containing the requirement focus tag
- tagId — ID of the requirement focus tag to modify
- tag — Updated tag data conforming to TagSchema

## Returns

Object containing the ID of the modified requirement focus tag.

## Http

PUT /api/trpc/requirements.modifyRequirementFocusTag
