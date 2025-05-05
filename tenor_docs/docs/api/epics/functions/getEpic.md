---
sidebar_label: "GetEpic"
---

# Function: GetEpic

[**Tenor API Documentation**](../../README.md)

***

# Function: getEpic()

> **getEpic**(`dbAdmin`, `projectId`, `epicId`): `Promise`\<`undefined` \| \{ `deleted`: `boolean`; `description`: `string`; `id`: `string`; `name`: `string`; `scrumId`: `number`; \}\>

Defined in: [src/server/api/routers/epics.ts:17](https://github.com/Apantli/Tenor/blob/b645dd7f4e4de25285aef45710556dc56954d32f/tenor_web/src/server/api/routers/epics.ts#L17)

## Parameters

### dbAdmin

`Firestore`

### projectId

`string`

### epicId

`string`

## Returns

`Promise`\<`undefined` \| \{ `deleted`: `boolean`; `description`: `string`; `id`: `string`; `name`: `string`; `scrumId`: `number`; \}\>
