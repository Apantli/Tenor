[**Tenor API Documentation**](../../README.md)

***

# Variable: getTeamMembersProcedure

> `const` **getTeamMembersProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `TeamMember`[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/users.ts:148](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/users.ts#L148)

Retrieves team members for a specific project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to fetch team members from

## Returns

Array of team members with their roles and activity status.

## Http

GET /api/trpc/users.getTeamMembers
