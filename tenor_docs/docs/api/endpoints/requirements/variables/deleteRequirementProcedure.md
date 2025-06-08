[**Tenor API Documentation**](../../README.md)

***

# Variable: deleteRequirementProcedure

> `const` **deleteRequirementProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `requirementId`: `string`; \}; `output`: `void`; \}\>

Defined in: [tenor\_web/src/server/api/routers/requirements.ts:442](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/requirements.ts#L442)

Marks a requirement as deleted.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project
- requirementId - String ID of the requirement to delete

## Returns

void

## Http

POST /api/trpc/requirements.deleteRequirement
