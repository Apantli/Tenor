[**Tenor API Documentation**](../../README.md)

***

# Variable: getRequirementProcedure

> `const` **getRequirementProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; `requirementId`: `string`; \}; `output`: `RequirementCol`; \}\>

Defined in: [tenor\_web/src/server/api/routers/requirements.ts:341](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/requirements.ts#L341)

Retrieves a specific requirement by ID.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project
- requirementId - String ID of the requirement

## Returns

Requirement object or null if not found

## Http

GET /api/trpc/requirements.getRequirement
