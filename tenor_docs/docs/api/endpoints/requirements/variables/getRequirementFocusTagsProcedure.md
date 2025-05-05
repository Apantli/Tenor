[**Tenor API Documentation**](../../README.md)

***

# Variable: getRequirementFocusTagsProcedure

> `const` **getRequirementFocusTagsProcedure**: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `Tag`[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/requirements.ts:408](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/requirements.ts#L408)

Retrieves all non-deleted requirement focus tags for a project.

## Param

Object containing procedure parameters
Input object structure:
- projectId — ID of the project to fetch requirement focus tags from

## Returns

Array of requirement focus tags.

## Http

GET /api/trpc/requirements.getRequirementFocusTags
