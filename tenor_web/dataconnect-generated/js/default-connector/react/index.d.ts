import { ListLogsData } from '../';
import { FlattenedQueryResult, useDataConnectQueryOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useListLogs(options?: useDataConnectQueryOptions<ListLogsData>): UseQueryResult<FlattenedQueryResult<ListLogsData, undefined>, FirebaseError>;
export function useListLogs(dc: DataConnect, options?: useDataConnectQueryOptions<ListLogsData>): UseQueryResult<FlattenedQueryResult<ListLogsData, undefined>, FirebaseError>;
