[**Tenor API Documentation**](../../README.md)

***

# Variable: getProcessedRetrospectiveAnswersProcedure

> `const` **getProcessedRetrospectiveAnswersProcedure**: `QueryProcedure`\<\{ `input`: \{ `data`: \{ `textAnswers`: `string`[]; \}; `projectId`: `string`; \}; `output`: \{ `answers`: `string`[]; `happinessAnalysis`: `string`; `happinessRating`: `number`; \}; \}\>

Defined in: [tenor\_web/src/server/api/routers/sprintRetrospectives.ts:226](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/sprintRetrospectives.ts#L226)

Processes retrospective answers and generates AI-assisted analysis.

## Param

Object containing procedure parameters
Input object structure:
- projectId - String ID of the project
- data - Object containing text answers

## Returns

Object containing processed answers, happiness rating and analysis

## Throws

- If not enough answers are provided

## Http

GET /api/trpc/sprintRetrospectives.getProcessedRetrospectiveAnswers
