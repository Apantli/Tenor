[**Tenor API Documentation**](../../README.md)

***

# Variable: getRequirementTypeProcedure

> `const` **getRequirementTypeProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; `requirementTypeId`: `string`; \}; `output`: `WithId`\<`Tag`\>; \}\>

Defined in: [tenor\_web/src/server/api/routers/requirements.ts:80](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/requirements.ts#L80)

Retrieves a specific requirement type by ID.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project
- requirementTypeId - String ID of the requirement type

## Returns

Requirement type object or null if not found

## Http

GET /api/trpc/requirements.getRequirementType
