---
sidebar_label: "GetSprint"
---

# Function: GetSprint

[**Tenor API Documentation**](../../README.md)

***

# Function: getSprint()

> **getSprint**(`dbAdmin`, `projectId`, `sprintId`): `Promise`\<`undefined` \| \{ `deleted`: `boolean`; `description`: `string`; `endDate`: `Timestamp`; `genericItemIds`: `string`[]; `id`: `string`; `issueIds`: `string`[]; `number`: `number`; `startDate`: `Timestamp`; `userStoryIds`: `string`[]; \}\>

Defined in: [tenor\_web/src/server/api/routers/sprints.ts:40](https://github.com/Apantli/Tenor/blob/551fcec623199ab0ac9668d926e7d67c9012d18e/tenor_web/src/server/api/routers/sprints.ts#L40)

## Parameters

### dbAdmin

`Firestore`

### projectId

`string`

### sprintId

`string`

## Returns

`Promise`\<`undefined` \| \{ `deleted`: `boolean`; `description`: `string`; `endDate`: `Timestamp`; `genericItemIds`: `string`[]; `id`: `string`; `issueIds`: `string`[]; `number`: `number`; `startDate`: `Timestamp`; `userStoryIds`: `string`[]; \}\>
