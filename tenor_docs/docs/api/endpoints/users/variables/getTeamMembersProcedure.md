[**Tenor API Documentation**](../../README.md)

***

# Variable: getTeamMembersProcedure

> `const` **getTeamMembersProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `UserCol`[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/users.ts:301](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/users.ts#L301)

Retrieves team members (users with write access) for a specific project.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project

## Returns

Array of user objects with write access to the project

## Http

GET /api/trpc/users.getTeamMembers
