import {
  getRowsByIds,
  sortTableRows,
  isTableRows,
  isFilterView,
  isSortView,
  isGroupView,
  getFilteredRows,
  getGroupRows,
  getColumnByKey,
} from '../_basic';
import { username } from '../../../utils/constants';
import { OPERATION_TYPE } from './operations';

// const DEFAULT_COMPUTER_PROPERTIES_CONTROLLER = {
//   isUpdateSummaries: true,
//   isUpdateColumnColors: true,
// };

// generate formula_rows
// get rendered rows depend on filters/sorts etc.
class DataProcessor {

  static getFilteredRows(table, rows, filterConjunction, filters) {
    const tableRows = isTableRows(rows) ? rows : getRowsByIds(table, rows);
    const { row_ids } = getFilteredRows(table, tableRows, filterConjunction, filters, { username });
    return row_ids;
  }

  static getSortedRows(table, rows, sorts) {
    const tableRows = isTableRows(rows) ? rows : getRowsByIds(table, rows);
    return sortTableRows(table, tableRows, sorts);
  }

  static getGroupedRows(table, rows, groupbys) {
    const tableRows = isTableRows(rows) ? rows : getRowsByIds(table, rows);
    const groups = getGroupRows(table, tableRows, groupbys);
    // todo update summaries
    return groups;
  }

  static updateSummaries(table, rows) {
    // const tableRows = isTableRows(rows) ? rows : getRowsByIds(table, rows);
    // todo
  }

  static hasRelatedGroupby(groupbys, updatedColumnKeyMap) {
    return groupbys.some(groupby => updatedColumnKeyMap[groupby.column_key]);
  }

  static deleteGroupRows(groups, idDeletedRecordMap) {
    groups.forEach(group => {
      const { subgroups, row_ids } = group;
      if (Array.isArray(subgroups) && subgroups.length > 0) {
        this.deleteGroupRows(subgroups, idDeletedRecordMap);
      } else if (row_ids) {
        group.row_ids = row_ids.filter(rowId => !idDeletedRecordMap[rowId]);
      }
    });
  }

  static deleteEmptyGroups = (groups) => {
    return groups.filter(group => {
      const { subgroups, row_ids } = group;
      if (subgroups && subgroups.length > 0) {
        const validSubGroups = this.deleteEmptyGroups(subgroups);
        if (validSubGroups.length === 0) {
          return false;
        }
        return true;
      }
      if (!row_ids || row_ids.length === 0) {
        return false;
      }
      return true;
    });
  };

  static run(table) {
    const rows = table.rows;
    const { filters, filter_conjunction, sorts, groupbys } = table.view;
    const availableColumns = table.view.available_columns || table.columns;
    const _isFilterView = isFilterView({ filters }, availableColumns);
    const _isSortView = isSortView({ sorts }, availableColumns);
    const _isGroupView = isGroupView({ groupbys }, availableColumns);
    if (!_isFilterView && !_isSortView && !_isGroupView) {
      table.view.rows = table.rows.map(row => row._id);
      return;
    }
    let renderedRows = rows;
    if (_isFilterView) {
      renderedRows = this.getFilteredRows(table, renderedRows, filter_conjunction, filters);
    }
    if (_isSortView) {
      renderedRows = this.getSortedRows(table, renderedRows, sorts);
    }
    const groups = _isGroupView ? this.getGroupedRows(table, renderedRows, groupbys) : [];
    const row_ids = isTableRows(renderedRows) ? renderedRows.map(row => row._id) : renderedRows;
    table.view.rows = row_ids;
    table.view.groups = groups;
  }

  static updateDataWithModifyRecords(table, relatedColumnKeyMap, ) {
    // todo
  }

  static handleReloadedRecords(table, reloadedRecords, relatedColumnKeyMap) {
    const idReloadedRecordMap = reloadedRecords.reduce((map, record) => {
      map[record._id] = record;
      return map;
    }, {});
    table.rows.forEach((row, index) => {
      const rowId = row._id;
      const reloadedRecord = idReloadedRecordMap[rowId];
      const newRecord = Object.assign({}, table.rows[index], reloadedRecord);
      if (reloadedRecord) {
        table.rows[index] = newRecord;
        table.id_row_map[rowId] = newRecord;
      }
    });

    this.updateDataWithModifyRecords();
    this.updateSummaries();
  }

  static handleNotExistRecords(table, idRecordNotExistMap) {
    let notExistRecords = [];
    let existRecords = [];
    table.rows.forEach((record) => {
      const recordId = record._id;
      if (idRecordNotExistMap[recordId]) {
        notExistRecords.push(record);
        delete table.id_row_map[recordId];
      } else {
        existRecords.push(record);
      }
    });
    table.rows = table.rows.filter((record) => !idRecordNotExistMap[record._id]);
    table.view.rows = table.rows.filter((recordId) => !idRecordNotExistMap[recordId]);

    this.updateSummaries();
  }

  static updatePageDataWithCommonOperations(table, value) {
    // todo
  }

  static syncOperationOnData(table, operation) {

    switch (operation.op_type) {
      case OPERATION_TYPE.MODIFY_RECORD:
      case OPERATION_TYPE.MODIFY_RECORDS: {
        const { available_columns } = table.view;
        const { id_original_row_updates, row_ids } = operation;
        let relatedColumnKeyMap = {};
        let relatedColumnKeys = [];
        row_ids.forEach(rowId => {
          const id_original_row_update = id_original_row_updates[rowId];
          if (id_original_row_update) {
            relatedColumnKeys.push(...Object.keys(id_original_row_update));
          }
        });
        relatedColumnKeys.forEach(columnKey => {
          if (!relatedColumnKeyMap[columnKey]) {
            const column = getColumnByKey(available_columns, columnKey);
            if (column) {
              relatedColumnKeyMap[columnKey] = true;
            }
          }
        });
        this.updateDataWithModifyRecords();
        this.updateSummaries();
        break;
      }
      case OPERATION_TYPE.MODIFY_RECORD_VIA_BUTTON: {
        const { available_columns } = table.view;
        const { original_updates } = operation;
        const relatedColumnKeyMap = {};
        for (let columnKey in original_updates) {
          const column = getColumnByKey(available_columns, columnKey);
          if (column) {
            relatedColumnKeyMap[columnKey] = true;
          }
        }
        this.updateDataWithModifyRecords();
        this.updateSummaries();
        break;
      }

      case OPERATION_TYPE.RESTORE_RECORDS: {
        const { rows_data, upper_row_ids } = operation;
        const { rows } = table.view;
        const insertRowIds = rows_data.map(rowData => rowData._id);
        let updatedRowIds = [...rows];
        if (!Array.isArray(upper_row_ids) || upper_row_ids.length === 0) {
          updatedRowIds.push(...insertRowIds);
        } else {
          upper_row_ids.forEach((upperRowId, index) => {
            const insertRowId = insertRowIds[index];
            const upperRowIndex = updatedRowIds.indexOf(upperRowId);
            if (upperRowIndex < 0) {
              updatedRowIds.push(insertRowId);
            } else {
              updatedRowIds.splice(upperRowIndex + 1, 0, insertRowId);
            }
          });
        }
        table.view.rows = updatedRowIds;
        this.updatePageDataWithCommonOperations();
        this.updateSummaries();
        break;
      }
      case OPERATION_TYPE.MODIFY_HIDDEN_COLUMNS:
      case OPERATION_TYPE.MODIFY_FILTERS: {
        this.run(table);
        break;
      }

      case OPERATION_TYPE.MODIFY_SORTS: {
        const { sorts, rows } = table.view;
        const availableColumns = table.view.available_columns || table.columns;
        if (!isSortView({ sorts }, availableColumns)) {
          this.run(table);
          break;
        }
        table.view.rows = this.getSortedRows(table, rows, sorts);
        this.updatePageDataWithCommonOperations();
        break;
      }
      case OPERATION_TYPE.MODIFY_GROUPBYS: {
        const { available_columns, groupbys, rows } = table.view;
        if (!isGroupView({ groupbys }, available_columns)) {
          table.view.groups = [];
          break;
        }
        table.view.groups = this.getGroupedRows(table, rows, groupbys);
        break;
      }
      default: {
        break;
      }
    }
  }

}

export default DataProcessor;