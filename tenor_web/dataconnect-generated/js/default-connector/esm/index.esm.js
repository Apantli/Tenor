import { queryRef, executeQuery, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'default',
  service: 'tenor',
  location: 'us-central1'
};

export function listLogsRef(dc) {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListLogs');
}

export function listLogs(dc) {
  return executeQuery(listLogsRef(dc));
}

