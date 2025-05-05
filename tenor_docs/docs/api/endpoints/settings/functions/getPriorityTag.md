---
sidebar_label: "GetPriorityTag"
---

# Function: GetPriorityTag

[**Tenor API Documentation**](../../README.md)

***

# Function: getPriorityTag()

> **getPriorityTag**(`settingsRef`, `priorityId`): `Promise`\<`undefined` \| `Tag`\>

Defined in: [tenor\_web/src/server/api/routers/settings.ts:116](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/settings.ts#L116)

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
