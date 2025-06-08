[**Tenor API Documentation**](../../README.md)

***

# Variable: getRequirementsCountProcedure

> `const` **getRequirementsCountProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `number`; \}\>

Defined in: [tenor\_web/src/server/api/routers/requirements.ts:624](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/requirements.ts#L624)

Gets the count of requirements in a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project

## Returns

Number indicating the count of requirements

## Http

GET /api/trpc/requirements.getRequirementsCount
