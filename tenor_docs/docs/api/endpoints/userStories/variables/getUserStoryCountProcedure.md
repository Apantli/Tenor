[**Tenor API Documentation**](../../README.md)

***

# Variable: getUserStoryCountProcedure

> `const` **getUserStoryCountProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `number`; \}\>

Defined in: [tenor\_web/src/server/api/routers/userStories.ts:921](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/userStories.ts#L921)

Retrieves the count of user stories in a specific project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to count user stories in

## Returns

Number of user stories in the project.

## Http

GET /api/trpc/userStories.getUserStoryCount
