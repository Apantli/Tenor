[**Tenor API Documentation**](../../README.md)

***

# Variable: addTaskDependenciesProcedure

> `const` **addTaskDependenciesProcedure**: `MutationProcedure`\<\{ `input`: \{ `dependencyTaskId`: `string`; `parentTaskId`: `string`; `projectId`: `string`; \}; `output`: \{ `success`: `boolean`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/tasks.ts:816](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/tasks.ts#L816)

Creates a dependency relationship between two tasks, where one task becomes a prerequisite for another.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project to which the tasks belong
- dependencyTaskId - String ID of the task that will be a prerequisite (dependency)
- parentTaskId - String ID of the task that will depend on the prerequisite task

## Returns

Object with success status

## Throws

If adding the dependency would create a cycle

## Http

POST /api/trpc/tasks.addTaskDependencies
