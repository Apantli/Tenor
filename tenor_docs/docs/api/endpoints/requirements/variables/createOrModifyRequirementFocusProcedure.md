[**Tenor API Documentation**](../../README.md)

***

# Variable: createOrModifyRequirementFocusProcedure

> `const` **createOrModifyRequirementFocusProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `requirementFocusId?`: `string`; `tagData`: \{ `color`: `string`; `deleted`: `boolean`; `name`: `string`; \}; \}; `output`: `WithId`\<`Tag`\>; \}\>

Defined in: [tenor\_web/src/server/api/routers/requirements.ts:252](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/requirements.ts#L252)

Creates or modifies a requirement focus.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project
- requirementFocusId - Optional string ID of the requirement focus (for updates)
- tagData - Tag object with the requirement focus data

## Returns

Object containing the created or updated requirement focus with its ID

## Http

POST /api/trpc/requirements.createOrModifyRequirementFocus
