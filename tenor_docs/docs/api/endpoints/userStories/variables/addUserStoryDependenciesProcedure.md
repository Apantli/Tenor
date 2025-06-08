[**Tenor API Documentation**](../../README.md)

***

# Variable: addUserStoryDependenciesProcedure

> `const` **addUserStoryDependenciesProcedure**: `MutationProcedure`\<\{ `input`: \{ `dependencyUsId`: `string`; `parentUsId`: `string`; `projectId`: `string`; \}; `output`: \{ `success`: `boolean`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/userStories.ts:709](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/userStories.ts#L709)

Updates the dependency relationship between two user stories.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project to which the user stories belong
- dependencyUsId - String ID of the user story that will be a dependency
- parentUsId - String ID of the user story that will depend on the target

## Returns

Object indicating success

## Http

POST /api/trpc/userStories.addUserStoryDependencies
