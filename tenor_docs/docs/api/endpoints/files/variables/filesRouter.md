[**Tenor API Documentation**](../../README.md)

***

# Variable: filesRouter

> `const` **filesRouter**: `BuiltRouter`\<\{ `ctx`: \{ `firebaseAdmin`: `__module`; `firestore`: `Firestore`; `headers`: `Headers`; `session`: `null` \| `UserRecord`; `supabase`: `SupabaseClient`\<`any`, `"public"`, `any`\>; \}; `errorShape`: \{ `code`: `TRPC_ERROR_CODE_NUMBER`; `data`: \{ `code`: `"PARSE_ERROR"` \| `"BAD_REQUEST"` \| `"INTERNAL_SERVER_ERROR"` \| `"NOT_IMPLEMENTED"` \| `"BAD_GATEWAY"` \| `"SERVICE_UNAVAILABLE"` \| `"GATEWAY_TIMEOUT"` \| `"UNAUTHORIZED"` \| `"FORBIDDEN"` \| `"NOT_FOUND"` \| `"METHOD_NOT_SUPPORTED"` \| `"TIMEOUT"` \| `"CONFLICT"` \| `"PRECONDITION_FAILED"` \| `"PAYLOAD_TOO_LARGE"` \| `"UNSUPPORTED_MEDIA_TYPE"` \| `"UNPROCESSABLE_CONTENT"` \| `"TOO_MANY_REQUESTS"` \| `"CLIENT_CLOSED_REQUEST"`; `httpStatus`: `number`; `path?`: `string`; `stack?`: `string`; `zodError`: `null` \| `typeToFlattenedError`\<`any`, `string`\>; \}; `message`: `string`; \}; `meta`: `object`; `transformer`: `true`; \}, `DecorateCreateRouterOptions`\<\{ `getUserFiles`: `QueryProcedure`\<\{ `input`: `void`; `output`: `object`[]; \}\>; \}\>\>

Defined in: [tenor\_web/src/server/api/routers/files.ts:46](https://github.com/Apantli/Tenor/blob/293d0ddb2d5307c4150fcd161249995fd5278c7d/tenor_web/src/server/api/routers/files.ts#L46)
