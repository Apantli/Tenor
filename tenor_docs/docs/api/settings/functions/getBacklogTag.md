---
sidebar_label: "GetBacklogTag"
---

# Function: GetBacklogTag

[**Tenor API Documentation**](../../README.md)

***

# Function: getBacklogTag()

> **getBacklogTag**(`settingsRef`, `taskId`): `Promise`\<`undefined` \| `WithId`\<`Tag`\>\>

Defined in: [tenor\_web/src/server/api/routers/settings.ts:120](https://github.com/Apantli/Tenor/blob/13fa9fcda7db4a7cf51b72ac1fe195cb0c47631e/tenor_web/src/server/api/routers/settings.ts#L120)

getBacklogTag

## Parameters

### settingsRef

`DocumentReference`

Reference to the settings document

### taskId

`string`

The ID of the backlog tag to retrieve

## Returns

`Promise`\<`undefined` \| `WithId`\<`Tag`\>\>

The backlog tag object or undefined if not found

## Description

Retrieves a backlog tag from the backlogTags collection based on its ID
