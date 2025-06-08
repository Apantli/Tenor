[**Tenor API Documentation**](../../README.md)

***

# Variable: getRequirementFocusesProcedure

> `const` **getRequirementFocusesProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `WithId`\<`Tag`\>[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/requirements.ts:203](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/requirements.ts#L203)

Retrieves all requirement focuses for a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project

## Returns

Array of requirement focuses for the specified project

## Http

GET /api/trpc/requirements.getRequirementFocuses
