[**Tenor API Documentation**](../../README.md)

***

# Variable: getRequirementProcedure

> `const` **getRequirementProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; `requirementId`: `string`; \}; `output`: \{ `deleted`: `boolean`; `description`: `string`; `id`: `string`; `name`: `string`; `priorityId`: `string`; `requirementFocusId`: `string`; `requirementTypeId`: `string`; `scrumId`: `number`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/requirements.ts:605](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/requirements.ts#L605)

Retrieves a specific requirement by ID.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project containing the requirement
- requirementId — ID of the requirement to retrieve

## Returns

Requirement object with its details.

## Http

GET /api/trpc/requirements.getRequirement
