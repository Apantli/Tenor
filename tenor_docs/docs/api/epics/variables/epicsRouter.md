[**Tenor API Documentation**](../../README.md)

***

# Variable: epicsRouter

> `const` **epicsRouter**: `BuiltRouter`\<\{ `ctx`: \{ `firebaseAdmin`: `__module`; `firestore`: `Firestore`; `headers`: `Headers`; `session`: `null` \| `UserRecord`; `supabase`: `SupabaseClient`\<`any`, `"public"`, `any`\>; \}; `errorShape`: \{ `code`: `TRPC_ERROR_CODE_NUMBER`; `data`: \{ `code`: `"PARSE_ERROR"` \| `"BAD_REQUEST"` \| `"INTERNAL_SERVER_ERROR"` \| `"NOT_IMPLEMENTED"` \| `"BAD_GATEWAY"` \| `"SERVICE_UNAVAILABLE"` \| `"GATEWAY_TIMEOUT"` \| `"UNAUTHORIZED"` \| `"FORBIDDEN"` \| `"NOT_FOUND"` \| `"METHOD_NOT_SUPPORTED"` \| `"TIMEOUT"` \| `"CONFLICT"` \| `"PRECONDITION_FAILED"` \| `"PAYLOAD_TOO_LARGE"` \| `"UNSUPPORTED_MEDIA_TYPE"` \| `"UNPROCESSABLE_CONTENT"` \| `"TOO_MANY_REQUESTS"` \| `"CLIENT_CLOSED_REQUEST"`; `httpStatus`: `number`; `path?`: `string`; `stack?`: `string`; `zodError`: `null` \| `typeToFlattenedError`\<`any`, `string`\>; \}; `message`: `string`; \}; `meta`: `object`; `transformer`: `true`; \}, `DecorateCreateRouterOptions`\<\{ `createOrModifyEpic`: `MutationProcedure`\<\{ `input`: \{ `deleted?`: `boolean`; `description`: `string`; `name`: `string`; `projectId`: `string`; `scrumId`: `number`; \}; `output`: `"Epic updated successfully"` \| `"Epic created successfully"`; \}\>; `getEpic`: `QueryProcedure`\<\{ `input`: \{ `epicId`: `number`; `projectId`: `string`; \}; `output`: \{ `deleted`: `boolean`; `description`: `string`; `name`: `string`; `scrumId`: `number`; \}; \}\>; `getProjectEpicsOverview`: `QueryProcedure`\<\{ `input`: \{ `projectId`: `string`; \}; `output`: `object`[]; \}\>; \}\>\>

Defined in: [src/server/api/routers/epics.ts:38](https://github.com/Apantli/Tenor/blob/b645dd7f4e4de25285aef45710556dc56954d32f/tenor_web/src/server/api/routers/epics.ts#L38)
