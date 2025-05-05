[**Tenor API Documentation**](../../README.md)

***

# Variable: createOrModifyRequirementProcedure

> `const` **createOrModifyRequirementProcedure**: `MutationProcedure`\<\{ `input`: \{ `deleted?`: `boolean`; `description`: `string`; `name`: `string`; `priorityId`: `string`; `projectId`: `string`; `requirementFocusId`: `string`; `requirementTypeId`: `string`; `scrumId`: `number`; \}; `output`: `"Requirement updated successfully"` \| `"Requirement created successfully"`; \}\>

Defined in: [tenor\_web/src/server/api/routers/requirements.ts:648](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/requirements.ts#L648)

Creates a new requirement or updates an existing one.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to create or update the requirement in
- scrumId — Scrum ID of the requirement (use -1 for new requirements)
- name — Name of the requirement
- description — Description of the requirement
- priorityId — ID of the priority tag
- requirementTypeId — ID of the requirement type tag
- requirementFocusId — ID of the requirement focus tag
- size — Size of the requirement

## Returns

Success message indicating whether the requirement was created or updated.

## Http

POST /api/trpc/requirements.createOrModifyRequirement
