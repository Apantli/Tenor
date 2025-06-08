[**Tenor API Documentation**](../../README.md)

***

# Variable: getRequirementFocusProcedure

> `const` **getRequirementFocusProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; `requirementFocusId`: `string`; \}; `output`: `WithId`\<`Tag`\>; \}\>

Defined in: [tenor\_web/src/server/api/routers/requirements.ts:225](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/requirements.ts#L225)

Retrieves a specific requirement focus by ID.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project
- requirementFocusId - String ID of the requirement focus

## Returns

Requirement focus object or null if not found

## Http

GET /api/trpc/requirements.getRequirementFocus
