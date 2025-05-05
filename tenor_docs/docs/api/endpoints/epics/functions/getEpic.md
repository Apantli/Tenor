---
sidebar_label: "GetEpic"
---

# Function: GetEpic

[**Tenor API Documentation**](../../README.md)

***

# Function: getEpic()

> **getEpic**(`dbAdmin`, `projectId`, `epicId`): `Promise`\<`undefined` \| \{ `deleted`: `boolean`; `description`: `string`; `id`: `string`; `name`: `string`; `scrumId`: `number`; \}\>

Defined in: [tenor\_web/src/server/api/routers/epics.ts:17](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/epics.ts#L17)

## Parameters

### dbAdmin

`Firestore`

### projectId

`string`

### epicId

`string`

## Returns

`Promise`\<`undefined` \| \{ `deleted`: `boolean`; `description`: `string`; `id`: `string`; `name`: `string`; `scrumId`: `number`; \}\>
