import { ConnectorConfig, DataConnect, QueryRef, QueryPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;


export interface ListLogsData {
  logs: ({
    userID: string;
    emotion: string;
    date: DateString;
  })[];
}

export interface Log_Key {
  id: UUIDString;
  __typename?: 'Log_Key';
}

/* Allow users to create refs without passing in DataConnect */
export function listLogsRef(): QueryRef<ListLogsData, undefined>;
/* Allow users to pass in custom DataConnect instances */
export function listLogsRef(dc: DataConnect): QueryRef<ListLogsData, undefined>;

export function listLogs(): QueryPromise<ListLogsData, undefined>;
export function listLogs(dc: DataConnect): QueryPromise<ListLogsData, undefined>;

