const { queryRef, executeQuery, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'default',
  service: 'tenor',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

exports.listLogsRef = function listLogsRef(dc) {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListLogs');
}
exports.listLogs = function listLogs(dc) {
  return executeQuery(listLogsRef(dc));
};
