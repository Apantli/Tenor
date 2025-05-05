---
sidebar_label: "GetTasksFromItem"
---

# Function: GetTasksFromItem

[**Tenor API Documentation**](../../README.md)

***

# Function: getTasksFromItem()

> **getTasksFromItem**(`dbAdmin`, `projectId`, `itemId`): `Promise`\<`WithId`\<`Task`\>[]\>

Defined in: [tenor\_web/src/server/api/routers/tasks.ts:85](https://github.com/Apantli/Tenor/blob/13fa9fcda7db4a7cf51b72ac1fe195cb0c47631e/tenor_web/src/server/api/routers/tasks.ts#L85)

getTasksFromItem

## Parameters

### dbAdmin

`Firestore`

The Firestore database instance

### projectId

`string`

The ID of the project to retrieve tasks from

### itemId

`string`

The ID of the item (user story, issue) to retrieve tasks for

## Returns

`Promise`\<`WithId`\<`Task`\>[]\>

An array of task objects with their IDs

## Description

Retrieves all non-deleted tasks associated with a specific item (user story, issue, etc.)
