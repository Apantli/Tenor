[**Tenor API Documentation**](../../README.md)

***

# Variable: sendReportProcedure

> `const` **sendReportProcedure**: `MutationProcedure`\<\{ `input`: \{ `data`: \{ `textAnswers`: `string`[]; \}; `projectId`: `string`; `reviewId`: `number`; `summarize?`: `boolean`; \}; `output`: \{ `success`: `boolean`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/sprintRetrospectives.ts:272](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/sprintRetrospectives.ts#L272)

Sends a retrospective report, optionally summarizing text answers with AI assistance.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project
- reviewId - Numeric ID of the retrospective review
- data - Object containing text answers array
- summarize - Boolean flag to determine if answers should be summarized by AI

## Returns

Object indicating success status

## Throws

- If not enough answers are provided

## Http

POST /api/trpc/sprintRetrospectives.sendReport
