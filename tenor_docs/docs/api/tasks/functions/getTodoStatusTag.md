---
sidebar_label: "GetTodoStatusTag"
---

# Function: GetTodoStatusTag

[**Tenor API Documentation**](../../README.md)

***

# Function: getTodoStatusTag()

> **getTodoStatusTag**(`settingsRef`): `Promise`\<\{ `color`: `string`; `deleted`: `boolean`; `id`: `string`; `marksTaskAsDone`: `boolean`; `name`: `string`; `orderIndex`: `number`; \}\>

Defined in: [tenor\_web/src/server/api/routers/tasks.ts:139](https://github.com/Apantli/Tenor/blob/13fa9fcda7db4a7cf51b72ac1fe195cb0c47631e/tenor_web/src/server/api/routers/tasks.ts#L139)

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
