---
sidebar_label: "GetSprint"
---

# Function: GetSprint

[**Tenor API Documentation**](../../README.md)

***

# Function: getSprint()

> **getSprint**(`dbAdmin`, `projectId`, `sprintId`): `Promise`\<`undefined` \| \{ `deleted`: `boolean`; `description`: `string`; `endDate`: `Timestamp`; `genericItemIds`: `string`[]; `id`: `string`; `issueIds`: `string`[]; `number`: `number`; `startDate`: `Timestamp`; `userStoryIds`: `string`[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/sprints.ts:21](https://github.com/Apantli/Tenor/blob/13fa9fcda7db4a7cf51b72ac1fe195cb0c47631e/tenor_web/src/server/api/routers/sprints.ts#L21)

## Parameters

### dbAdmin

`Firestore`

### projectId

`string`

### sprintId

`string`

## Returns

`Promise`\<`undefined` \| \{ `deleted`: `boolean`; `description`: `string`; `endDate`: `Timestamp`; `genericItemIds`: `string`[]; `id`: `string`; `issueIds`: `string`[]; `number`: `number`; `startDate`: `Timestamp`; `userStoryIds`: `string`[]; \}\>
