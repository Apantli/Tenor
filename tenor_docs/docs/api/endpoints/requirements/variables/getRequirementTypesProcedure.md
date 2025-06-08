[**Tenor API Documentation**](../../README.md)

***

# Variable: getRequirementTypesProcedure

> `const` **getRequirementTypesProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `WithId`\<`Tag`\>[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/requirements.ts:58](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/requirements.ts#L58)

Retrieves all requirement types for a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project

## Returns

Array of requirement types for the specified project

## Http

GET /api/trpc/requirements.getRequirementTypes
