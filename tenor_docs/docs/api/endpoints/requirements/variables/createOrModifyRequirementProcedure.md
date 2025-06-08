[**Tenor API Documentation**](../../README.md)

***

# Variable: createOrModifyRequirementProcedure

> `const` **createOrModifyRequirementProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `requirementData`: \{ `createdAt?`: `Timestamp`; `deleted?`: `boolean`; `description`: `string`; `name`: `string`; `priorityId`: `string`; `requirementFocusId`: `string`; `requirementTypeId`: `string`; `scrumId`: `number`; \}; `requirementId?`: `string`; \}; `output`: \{ `id`: `string`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/requirements.ts:364](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/requirements.ts#L364)

Creates or modifies a requirement.

## Param

Object containing procedure parameters
Input object structure:
- requirementData - Object with requirement data
- projectId - String ID of the project
- requirementId - Optional string ID of the requirement (for updates)

## Returns

Object containing the ID of the created or updated requirement

## Http

POST /api/trpc/requirements.createOrModifyRequirement
