[**Tenor API Documentation**](../../README.md)

***

# Variable: createOrModifySprintProcedure

> `const` **createOrModifySprintProcedure**: `MutationProcedure`\<\{ `input`: \{ `deleted?`: `boolean`; `description`: `string`; `endDate`: `Timestamp`; `genericItemIds`: `string`[]; `issueIds`: `string`[]; `number`: `number`; `projectId`: `string`; `startDate`: `Timestamp`; `userStoryIds`: `string`[]; \}; `output`: `"Sprint updated successfully"` \| `"Sprint created successfully"`; \}\>

Defined in: [tenor\_web/src/server/api/routers/sprints.ts:141](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/sprints.ts#L141)

Creates or modifies a sprint in a specific project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to create or modify the sprint in
- number — Sprint number (-1 for new sprint)
- description — Description of the sprint
- startDate — Start date of the sprint
- endDate — End date of the sprint
- userStoryIds — Array of user story IDs associated with the sprint
- issueIds — Array of issue IDs associated with the sprint
- genericItemIds — Array of generic item IDs associated with the sprint

## Returns

Success message indicating whether the sprint was created or updated.

## Http

POST /api/trpc/sprints.createOrModifySprint
