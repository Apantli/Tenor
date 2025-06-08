[**Tenor API Documentation**](../../README.md)

***

# Variable: getPreviousSprintProcedure

> `const` **getPreviousSprintProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `null` \| `WithId`\<`Sprint`\>; \}\>

Defined in: [tenor\_web/src/server/api/routers/sprintRetrospectives.ts:200](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/sprintRetrospectives.ts#L200)

Retrieves the previous sprint for a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project

## Returns

Previous sprint object or null if none exists

## Http

GET /api/trpc/sprintRetrospectives.getPreviousSprint
