[**Tenor API Documentation**](../../README.md)

***

# Variable: removeUserProcedure

> `const` **removeUserProcedure**: `MutationProcedure`\<\{ `input`: \{ `projectId`: `string`; `userId`: `string`; \}; `output`: `void`; \}\>

Defined in: [tenor\_web/src/server/api/routers/users.ts:184](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/users.ts#L184)

Removes a user from a project by marking them as inactive.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project to remove the user from
- userId - String ID of the user to remove

## Returns

None

## Throws

- If the user is not found or is the project owner

## Http

POST /api/trpc/users.removeUser
