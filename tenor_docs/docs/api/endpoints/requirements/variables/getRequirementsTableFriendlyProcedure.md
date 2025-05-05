[**Tenor API Documentation**](../../README.md)

***

# Variable: getRequirementsTableFriendlyProcedure

> `const` **getRequirementsTableFriendlyProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: \{ `allRequirementFocusTags`: `Tag`[]; `allRequirementTypeTags`: `Tag`[]; `allTags`: `Tag`[]; `fixedData`: [`RequirementCol`](../interfaces/RequirementCol.md)[]; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/requirements.ts:563](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/requirements.ts#L563)

Retrieves requirements for a project in a table-friendly format.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to fetch requirements for

## Returns

Object containing formatted requirement data and all tag collections:
- fixedData — Array of requirements in a table-friendly format
- allTags — Array of all priority tags
- allRequirementTypeTags — Array of all requirement type tags
- allRequirementFocusTags — Array of all requirement focus tags

## Http

GET /api/trpc/requirements.getRequirementsTableFriendly
