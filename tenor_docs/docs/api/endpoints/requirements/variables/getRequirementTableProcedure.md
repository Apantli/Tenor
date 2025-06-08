[**Tenor API Documentation**](../../README.md)

***

# Variable: getRequirementTableProcedure

> `const` **getRequirementTableProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `RequirementCol`[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/requirements.ts:320](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/requirements.ts#L320)

Retrieves a table of requirements for a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project

## Returns

Requirement table data for the project

## Http

GET /api/trpc/requirements.getRequirementTable
