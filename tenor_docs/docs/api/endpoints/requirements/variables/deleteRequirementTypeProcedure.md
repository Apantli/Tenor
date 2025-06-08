[**Tenor API Documentation**](../../README.md)

***

# Variable: deleteRequirementTypeProcedure

> `const` **deleteRequirementTypeProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `tagId`: `string`; \}; `output`: `void`; \}\>

Defined in: [tenor\_web/src/server/api/routers/requirements.ts:167](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/requirements.ts#L167)

Marks a requirement type as deleted.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project
- tagId - String ID of the requirement type to delete

## Returns

void

## Http

POST /api/trpc/requirements.deleteRequirementType
