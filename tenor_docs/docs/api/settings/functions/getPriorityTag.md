---
sidebar_label: "GetPriorityTag"
---

# Function: GetPriorityTag

[**Tenor API Documentation**](../../README.md)

***

# Function: getPriorityTag()

> **getPriorityTag**(`settingsRef`, `priorityId`): `Promise`\<`undefined` \| `Tag`\>

Defined in: [tenor\_web/src/server/api/routers/settings.ts:96](https://github.com/Apantli/Tenor/blob/13fa9fcda7db4a7cf51b72ac1fe195cb0c47631e/tenor_web/src/server/api/routers/settings.ts#L96)

getPriorityTag

## Parameters

### settingsRef

`DocumentReference`

Reference to the settings document

### priorityId

`string`

The ID of the priority tag to retrieve

## Returns

`Promise`\<`undefined` \| `Tag`\>

The priority tag object or undefined if not found

## Description

Retrieves a priority tag from the priorityTypes collection based on its ID
