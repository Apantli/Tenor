[**Tenor API Documentation**](../../README.md)

***

# Variable: createOrModifyRequirementTypeProcedure

> `const` **createOrModifyRequirementTypeProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `requirementTypeId?`: `string`; `tagData`: \{ `color`: `string`; `deleted`: `boolean`; `name`: `string`; \}; \}; `output`: \{ `color`: `string`; `deleted`: `boolean`; `id`: `string`; `name`: `string`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/requirements.ts:107](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/requirements.ts#L107)

Creates or modifies a requirement type.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project
- requirementTypeId - Optional string ID of the requirement type (for updates)
- tagData - Tag object with the requirement type data

## Returns

Object containing the created or updated requirement type with its ID

## Http

POST /api/trpc/requirements.createOrModifyRequirementType
