---
sidebar_label: "GetStatusTag"
---

# Function: GetStatusTag

[**Tenor API Documentation**](../../README.md)

***

# Function: getStatusTag()

> **getStatusTag**(`settingsRef`, `statusId`): `Promise`\<`undefined` \| `StatusTag`\>

Defined in: [tenor\_web/src/server/api/routers/tasks.ts:118](https://github.com/Apantli/Tenor/blob/13fa9fcda7db4a7cf51b72ac1fe195cb0c47631e/tenor_web/src/server/api/routers/tasks.ts#L118)

getStatusTag

## Parameters

### settingsRef

`DocumentReference`

Reference to the settings document

### statusId

`string`

The ID of the status tag to retrieve

## Returns

`Promise`\<`undefined` \| `StatusTag`\>

The status tag object or undefined if not found

## Description

Retrieves a status tag from the settings collection based on its ID
