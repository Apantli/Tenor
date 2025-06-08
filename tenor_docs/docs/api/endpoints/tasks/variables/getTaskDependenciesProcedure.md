[**Tenor API Documentation**](../../README.md)

***

# Variable: getTaskDependenciesProcedure

> `const` **getTaskDependenciesProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: \{ `edges`: `Edge`[]; `nodes`: `Node`[]; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/tasks.ts:934](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/tasks.ts#L934)

Retrieves all tasks and their dependency relationships in a format suitable for visualization.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project to get task dependencies from

## Returns

Object containing:
- nodes: Array of task nodes with position and display data
- edges: Array of dependency relationships between tasks

## Http

GET /api/trpc/tasks.getTaskDependencies
