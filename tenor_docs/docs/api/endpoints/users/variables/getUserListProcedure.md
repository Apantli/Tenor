[**Tenor API Documentation**](../../README.md)

***

# Variable: getUserListProcedure

> `const` **getUserListProcedure**: `QueryProcedure`\<\{ `input`: \{ `filter`: `string`; \}; `output`: `TeamMember`[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/users.ts:45](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/users.ts#L45)

Retrieves a list of users filtered by a search term.

## Param

Object containing procedure parameters
Input object structure:
- filter — Search term to filter users by email or display name

## Returns

Array of users matching the filter criteria.

## Http

GET /api/trpc/users.getUserList
