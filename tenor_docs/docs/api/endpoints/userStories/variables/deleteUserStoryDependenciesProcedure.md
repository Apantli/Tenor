[**Tenor API Documentation**](../../README.md)

***

# Variable: deleteUserStoryDependenciesProcedure

> `const` **deleteUserStoryDependenciesProcedure**: `MutationProcedure`\<\{ `input`: \{ `dependencyUsId`: `string`; `parentUsId`: `string`; `projectId`: `string`; \}; `output`: \{ `success`: `boolean`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/userStories.ts:775](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/userStories.ts#L775)

Updates the dependency relationship by removing a dependency between two user stories.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project to which the user stories belong
- parentUsId - String ID of the user story that will no longer depend on the target
- dependencyUsId - String ID of the user story that will no longer be a dependency

## Returns

Object indicating success

## Http

DELETE /api/trpc/userStories.deleteUserStoryDependencies
