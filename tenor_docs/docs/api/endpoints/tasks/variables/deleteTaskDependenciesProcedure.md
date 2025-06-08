[**Tenor API Documentation**](../../README.md)

***

# Variable: deleteTaskDependenciesProcedure

> `const` **deleteTaskDependenciesProcedure**: `MutationProcedure`\<\{ `input`: \{ `dependencyTaskId`: `string`; `parentTaskId`: `string`; `projectId`: `string`; \}; `output`: \{ `success`: `boolean`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/tasks.ts:881](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/tasks.ts#L881)

Removes a dependency relationship between two tasks.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project to which the tasks belong
- parentTaskId - String ID of the dependent task that will no longer require the prerequisite
- dependencyTaskId - String ID of the prerequisite task that will no longer be required

## Returns

Object with success status

## Http

POST /api/trpc/tasks.deleteTaskDependencies
