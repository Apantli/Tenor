[**Tenor API Documentation**](../../README.md)

***

# Variable: assignItemsToSprintProcedure

> `const` **assignItemsToSprintProcedure**: `MutationProcedure`\<\{ `input`: \{ `items`: `object`[]; `projectId`: `string`; `sprintId?`: `string`; \}; `output`: `void`; \}\>

Defined in: [tenor\_web/src/server/api/routers/sprints.ts:335](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/sprints.ts#L335)

Assigns backlog items to a specific sprint in a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to assign items in
- sprintId — (Optional) ID of the sprint to assign items to
- items — Array of items to assign, each containing:
  - id — ID of the item
  - itemType — Type of the item ("US" for user story, "IS" for issue)

## Returns

Void.

## Http

PUT /api/trpc/sprints.assignItemsToSprint
