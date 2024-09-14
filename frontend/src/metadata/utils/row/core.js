import { getTableById } from '../table';

/**
 * Check is table rows
 * @param {array} rows e.g. table rows: [{ _id, xxx }, ...] | view rows: [ row._id, ... ]
 * @returns bool
 */
const isTableRows = (rows) => (
  Array.isArray(rows) && typeof rows[0] === 'object'
);

const updateTableRowsWithRowsData = (tables, tableId, recordsData = []) => {
  let table = getTableById(tables, tableId);
  let idRowDataMap = {};
  recordsData.forEach((recordData) => idRowDataMap[recordData._id] = recordData);
  table.rows.forEach((row, index) => {
    const rowId = row._id;
    const newRowData = idRowDataMap[rowId];
    if (!newRowData) {
      return;
    }
    const newRow = Object.assign({}, row, newRowData);
    table.rows[index] = newRow;
    table.id_row_map[rowId] = newRow;
  });
};

export {
  isTableRows,
  updateTableRowsWithRowsData,
};