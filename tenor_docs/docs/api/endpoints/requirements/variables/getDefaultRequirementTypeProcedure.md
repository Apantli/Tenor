[**Tenor API Documentation**](../../README.md)

***

# Variable: getDefaultRequirementTypeProcedure

> `const` **getDefaultRequirementTypeProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `undefined` \| `WithId`\<`Tag`\>; \}\>

Defined in: [tenor\_web/src/server/api/routers/requirements.ts:588](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/requirements.ts#L588)

Retrieves the default requirement type for a project.
Returns "Functional" if it exists, otherwise the first type alphabetically.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project

## Returns

Default requirement type object

## Http

GET /api/trpc/requirements.getDefaultRequirementType
