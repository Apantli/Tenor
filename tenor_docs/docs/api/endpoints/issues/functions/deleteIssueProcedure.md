---
sidebar_label: "DeleteIssueProcedure"
---

# Function: DeleteIssueProcedure

[**Tenor API Documentation**](../../README.md)

***

# Function: deleteIssueProcedure()

> **deleteIssueProcedure**(`opts`): `Promise`\<\{ `modifiedTaskIds`: `string`[]; `success`: `boolean`; \}\>

Defined in: [tenor\_web/src/server/api/routers/issues.ts:201](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/issues.ts#L201)

**`Internal`**

deleteIssueProcedure

## Parameters

### opts

`ProcedureCallOptions`\<`unknown`\>

## Returns

`Promise`\<\{ `modifiedTaskIds`: `string`[]; `success`: `boolean`; \}\>

## Description

Deletes an issue within a project.

## Param

The ID of the project.

## Param

The ID of the issue to delete.
