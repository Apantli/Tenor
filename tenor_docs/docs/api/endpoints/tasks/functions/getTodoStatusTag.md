---
sidebar_label: "GetTodoStatusTag"
---

# Function: GetTodoStatusTag

[**Tenor API Documentation**](../../README.md)

***

# Function: getTodoStatusTag()

> **getTodoStatusTag**(`settingsRef`): `Promise`\<\{ `color`: `string`; `deleted`: `boolean`; `id`: `string`; `marksTaskAsDone`: `boolean`; `name`: `string`; `orderIndex`: `number`; \}\>

Defined in: [tenor\_web/src/server/api/routers/tasks.ts:159](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/tasks.ts#L159)

getTodoStatusTag

## Parameters

### settingsRef

`DocumentReference`

Reference to the settings document

## Returns

`Promise`\<\{ `color`: `string`; `deleted`: `boolean`; `id`: `string`; `marksTaskAsDone`: `boolean`; `name`: `string`; `orderIndex`: `number`; \}\>

The Todo status tag object

## Description

Retrieves the "Todo" status tag from the settings collection

## Throws

If the Todo status tag is not found
