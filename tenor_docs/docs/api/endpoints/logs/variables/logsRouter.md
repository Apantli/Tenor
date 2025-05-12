[**Tenor API Documentation**](../../README.md)

***

# Variable: logsRouter

> `const` **logsRouter**: `BuiltRouter`\<\{ `ctx`: \{ `firebaseAdmin`: `__module`; `firestore`: `Firestore`; `headers`: `Headers`; `session`: `null` \| `UserRecord`; `supabase`: `SupabaseClient`\<`any`, `"public"`, `any`\>; \}; `errorShape`: \{ `code`: `TRPC_ERROR_CODE_NUMBER`; `data`: \{ `code`: `"PARSE_ERROR"` \| `"BAD_REQUEST"` \| `"INTERNAL_SERVER_ERROR"` \| `"NOT_IMPLEMENTED"` \| `"BAD_GATEWAY"` \| `"SERVICE_UNAVAILABLE"` \| `"GATEWAY_TIMEOUT"` \| `"UNAUTHORIZED"` \| `"FORBIDDEN"` \| `"NOT_FOUND"` \| `"METHOD_NOT_SUPPORTED"` \| `"TIMEOUT"` \| `"CONFLICT"` \| `"PRECONDITION_FAILED"` \| `"PAYLOAD_TOO_LARGE"` \| `"UNSUPPORTED_MEDIA_TYPE"` \| `"UNPROCESSABLE_CONTENT"` \| `"TOO_MANY_REQUESTS"` \| `"CLIENT_CLOSED_REQUEST"`; `httpStatus`: `number`; `path?`: `string`; `stack?`: `string`; `zodError`: `null` \| `typeToFlattenedError`\<`any`, `string`\>; \}; `message`: `string`; \}; `meta`: `object`; `transformer`: `true`; \}, `DecorateCreateRouterOptions`\<\{ `analyzeAndCreateLog`: `MutationProcedure`\<\{ `input`: `void`; `output`: `PostgrestSingleResponse`\<`any`\>; \}\>; `listLogs`: `QueryProcedure`\<\{ `input`: `void`; `output`: `Log`[]; \}\>; \}\>\>

Defined in: [tenor\_web/src/server/api/routers/logs.ts:75](https://github.com/Apantli/Tenor/blob/b33873959b5093fc3e3d66ac4f230a78a6395bbd/tenor_web/src/server/api/routers/logs.ts#L75)
