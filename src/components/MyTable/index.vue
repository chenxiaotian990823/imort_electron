<template>
  <div class="my-table">
    <el-table
      ref="tableRef"
      :data="tableData"
      style="width: 100%"
      border
      empty-text="暂无数据"
      :header-cell-style="headerCellStyle"
      :cell-style="cellStyle"
      :row-class-name="getRowClass"
      @header-click="headerClickHandle"
      @cell-dblclick="cellDbClickHandle"
      @row-dblclick="rowDbClickHandle"
      @mousedown="startSelect"
      @mouseup="endSelect"
      @mousemove="selecting"
    >
      <!-- 正常表头 -->
      <template v-for="(item, index) in tableProps" :key="index">
        <el-table-column
          v-if="!editingColumn[index]"
          :type="item.type"
          :prop="item.propField"
          :width="item.width"
          align="center"
        >
          <template #header>
            <!-- 这里给表头单元格添加双击事件 -->
            <div
              class="table-cell-header"
              @dblclick="headerDblClickHandle(item, index, $event)"
              @contextmenu="headerContextmenuHandle(item, $event)"
            >
              {{ item.label }}
            </div>
          </template>
          <template #default="{ row, $index }">
            <!-- 可编辑表格 -->
            <div
              v-if="
                editingRow.rowIndex == $index && editingRow.columnIndex == index
              "
            >
              <span v-if="item.type">{{ $index + 1 }}</span>
              <span v-else>
                <el-input
                  ref="rowInputRef"
                  v-model="row[item.propField]"
                  :autofocus="true"
                  @focus="rowFocus(row[item.propField], $index, index)"
                  @blur="
                    saveRowData(
                      row[item.propField],
                      item.propField,
                      $index,
                      index
                    )
                  "
                />
              </span>
            </div>
            <!-- 只读表格 -->
            <div
              v-else
              class="table-cell-content"
              @contextmenu="rowCellContextHandle(row, $index, $event)"
            >
              <span v-if="item.type">{{ $index + 1 }}</span>
              <span v-else>{{ row[item.propField] || "--" }}</span>
            </div>
          </template>
        </el-table-column>
        <!-- 可编辑表头 -->
        <el-table-column v-else align="center">
          <template #header>
            <el-input
              ref="headerInputRef"
              v-model="item.label"
              :autofocus="true"
              @focus="columnFocus(item, index)"
              @blur="saveColumnLabel(index)"
            />
          </template>
          <template #default="{ row, $index }">
            <span v-if="item.type">{{ $index + 1 }}</span>
            <span v-else>{{ row[item.propField] }}</span>
          </template>
        </el-table-column>
      </template>
      <template #empty>
        <div
          style="width: 100%; height: 100%"
          @contextmenu="nodataContextHandle"
        >
          暂无数据
        </div>
      </template>
    </el-table>
    <create-or-update-column
      ref="createOrUpdateColumnRef"
      @update:table:data="updateTableData"
    />
    <context-menu
      v-if="menuVisible"
      ref="contextMenuRef"
      @onMenuClick="handleMenuClick"
    />
  </div>
</template>

<script>
import { nextTick, ref, onMounted, onBeforeUnmount } from "vue";
import {
  readJsonFilesFromFolder,
  upsertItemInJsonFile,
} from "@/utils/fsOperate.js";
import { readFromLocalStorage } from "@/utils/index";
import CreateOrUpdateColumn from "@/components/MyTable/CreateOrUpdateColumn/index.vue";

export default {
  components: {
    CreateOrUpdateColumn,
  },
  setup() {
    let tableRef = ref(null);
    let createOrUpdateColumnRef = ref(null);
    let headerInputRef = ref(null);
    let rowInputRef = ref(null);
    let contextMenuRef = ref(null);
    let menuVisible = ref(false); // 右键菜单显示状态
    let tableProps = ref([]); // 列配置
    let tableData = ref([]); // 表格数据
    const editColumnRecover = ref(null); // 编辑前的列数据
    const editingColumn = ref({}); // 控制编辑状态的列
    const contextColumnLabel = ref(null); // 右键编辑状态的列索引
    const editRowRecover = ref({
      // 编辑前的行数据
      rowIndex: 0,
      columnIndex: 0,
      value: "",
    });
    const editingRow = ref({}); // 控制编辑状态的行
    const contextMenuRowIndex = ref(null); // 右键操作行索引
    const selectedRows = ref(new Set()); // 用于存储选中的行索引
    let headerCellStyle = ref({
      background: "#f5f7fa",
      color: "#101010",
      fontWeight: "400",
      fontSize: "1rem",
      height: "2rem",
      "padding-top": "0.1rem",
      "padding-bottom": "0.1rem",
    });
    let cellStyle = ref({
      fontSize: "0.8rem",
      height: "1.5rem",
      "padding-top": "0.1rem",
      "padding-bottom": "0.1rem",
    });
    // 更新表格数据
    const updateTableData = (id) => {
      init(id);
    };
    // 重置表格列宽
    const resetTableColumnWidths = () => {
      if (tableRef.value) {
      }
    };
    // 初始化表格
    const init = async (id, needIndex = false) => {
      editColumnRecover.value = null;
      editingColumn.value = {};
      editRowRecover.value = { rowIndex: 0, columnIndex: 0, value: "" };
      contextColumnLabel.value = null;
      editingRow.value = {};
      selectedRows.value.clear();
      const path = readFromLocalStorage("currentProjectPath");
      const data = await readJsonFilesFromFolder(path, "table");
      if (data.table && data.table.list) {
        const tableObj = data.table.list.find((item) => item.menuId === id);
        if (!tableObj) {
          tableData.value = [];
        } else {
          if (needIndex) {
            tableObj.props.unshift({
              label: "序号",
              type: "index",
              width: "100",
            });
          }
          tableProps.value = tableObj.props;
          tableData.value = tableObj.data;
        }
      }
      nextTick(() => {
        resetTableColumnWidths();
      });
    };

    // 当某一列的表头被点击时会触发该事件
    const headerClickHandle = (column, event) => {
      selectedRows.value.clear()
    };
    // 当某一行被双击时会触发该事件
    const rowDbClickHandle = (row, column, event) => {
      const index = tableData.value.findIndex((data) => data === row);
      const columnIndex = column.getColumnIndex();
      if (
        editingRow.value.rowIndex == index &&
        editingRow.value.columnIndex == columnIndex
      ) {
        return;
      }
      editingRow.value = {
        rowIndex: index,
        columnIndex: columnIndex,
      };
      nextTick(() => {
        rowInputRef.value[0].focus();
      });
    };
    // 当某一列的表头被双击时会触发该事件
    const headerDblClickHandle = (item, index, event) => {
      editingColumn.value = { [index]: true };
      nextTick(() => {
        headerInputRef.value[0].focus();
      });
    };
    // 当某个单元格被双击击时会触发该事件
    const cellDbClickHandle = (row, column, cell) => {
      // console.log("cellDbClickHandle", row, column ,cell)
    };
    // 列单元格聚焦
    const columnFocus = (item, index) => {
      editColumnRecover.value = {
        index,
        label: item.label,
      };
    };
    // 行单元格聚焦
    const rowFocus = (rowValue, rowIndex, columnIndex) => {
      editRowRecover.value = {
        rowIndex,
        columnIndex,
        value: rowValue,
      };
    };
    // 保存表头新名称
    const saveColumnLabel = async (index) => {
      try {
        editingColumn.value = { [index]: false };
        if (!tableProps.value[editColumnRecover.value.index].label) {
          throw new Error("列名不能为空");
        }
        await saveAllData();
      } catch (error) {
        ElMessage.error(`操作失败, ${error}`);
        if (editColumnRecover.value.label) {
          tableProps.value[editColumnRecover.value.index].label =
            editColumnRecover.value.label;
        } else {
          tableProps.value = tableProps.value.filter((item) => {
            return item.propField;
          });
        }
      }
    };
    // 保存行数据
    const saveRowData = async (value, propField, rowIndex, columnIndex) => {
      try {
        editingRow.value = {};
        await saveAllData();
      } catch (error) {
        ElMessage.error(`操作失败, ${error}`);
        if (editRowRecover.value) {
          tableData.value[editRowRecover.value.rowIndex][propField] =
            editRowRecover.value.value;
        }
      }
    };
    const saveAllData = async () => {
      const path = readFromLocalStorage("currentProjectPath");
      const data = await readJsonFilesFromFolder(path, "table");
      const currentTableId = readFromLocalStorage("currentTableId");
      if (data.table && data.table.list) {
        const labels = tableProps.value.map((item) => item.label);
        const uniqueLabels = new Set(labels);
        // 判断是否有重复的 label
        const hasDuplicates = uniqueLabels.size < labels.length;
        if (hasDuplicates) {
          throw new Error("列名重复");
        }
        let props = tableProps.value.filter((item) => {
          return !item.type;
        });
        props.forEach((item) => {
          if (!item.propField) {
            item.propField = item.label;
          }
        });
        let newItem = {
          menuId: currentTableId,
          props,
          data: tableData.value,
        };
        const res = await upsertItemInJsonFile(
          path,
          "table.json",
          currentTableId,
          newItem,
          "menuId"
        );
      }
    };
    // 暂无数据的时候右键菜单
    const nodataContextHandle = (event) => {
      menuVisible.value = true;
      nextTick(() => {
        if (contextMenuRef.value) {
          let menuList = [{ label: "增加一列", action: "column_add_init" }];
          console.log("tableProps.value.length", tableProps.value.length);
          if (tableProps.value.length) {
            menuList.push({
              label: "增加一行",
              action: "row_add_init",
            });
          }
          contextMenuRef.value.openContextMenu(event, menuList);
        }
      });
    };
    // 当某一列的表头被鼠标右键点击时触发该事件
    const headerContextmenuHandle = (column, event) => {
      const isEditing = Object.values(editingColumn.value).some(
        (isEditing) => isEditing === true
      );
      // 如果有列正在编辑，则不进行后续操作
      if (isEditing) {
        return;
      }
      contextColumnLabel.value = column.label;
      menuVisible.value = true;
      nextTick(() => {
        if (contextMenuRef.value) {
          let menuList = [
            { label: "向左增加一列", action: "column_add_left" },
            { label: "向右增加一列", action: "column_add_right" },
            { label: "删除", action: "column_delete" },
          ];
          if (column.type) {
            menuList = menuList.filter(
              (item) => item.action !== "column_delete"
            );
          }
          contextMenuRef.value.openContextMenu(event, menuList);
        }
      });
    };
    // 单元格右键菜单点击事件
    const rowCellContextHandle = (row, rowIndex, event) => {
      contextMenuRowIndex.value = rowIndex;
      menuVisible.value = true;
      nextTick(() => {
        if (contextMenuRef.value) {
          let menuList = [
            { label: "向上插入空白行", action: "up_null_row" },
            { label: "向下插入空白行", action: "down_null_row" },
            { label: "向上插入当前行", action: "up_paste_row" },
            { label: "向下插入当前行", action: "down_paste_row" },
          ];
          if (selectedRows.value.size > 0) {
            let arr = [
              { label: "向上插入选中行", action: "batch_up_paste_row" },
              { label: "向下插入选中行", action: "batch_down_paste_row" },
              { label: "删除选中行", action: "delete_sel_row" },
            ];
            menuList.push(...arr);
          }
          menuList.push({ label: "删除当前行", action: "delete_row" });
          contextMenuRef.value.openContextMenu(event, menuList);
        }
      });
    };
    // 右键菜单点击
    const handleMenuClick = (action) => {
      const confirmDelete = (message) => {
        return ElMessageBox.confirm(message, "删除确认", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        });
      };

      const addColumn = (index, insertAfter = true) => {
        const newColumn = { label: "" };
        const insertIndex = insertAfter ? index + 1 : index;

        if (index === -1) {
          tableProps.value.push(newColumn);
          editingColumn.value = { [tableProps.value.length - 1]: true };
        } else {
          tableProps.value.splice(insertIndex, 0, newColumn);
          editingColumn.value = { [insertIndex]: true };
        }
      };

      const deleteColumn = async () => {
        try {
          await confirmDelete("确定要删除这一列吗？");
          tableProps.value = tableProps.value.filter(
            (item) => item.label !== contextColumnLabel.value
          );
          saveAllData();
        } catch {
          // 用户取消删除
        }
      };

      const addRow = (rowIndex, insertAfter = true, data = null) => {
        const props = tableProps.value.filter((item) => item.type !== "index");
        const insertIndex = insertAfter ? rowIndex + 1 : rowIndex;

        const newRow =
          data && Array.isArray(data)
            ? data.map((rowData) => {
                return props.reduce((acc, cur) => {
                  acc[cur.propField] = rowData[cur.propField] || "";
                  return acc;
                }, {});
              })
            : props.reduce((acc, cur) => {
                acc[cur.propField] = "";
                return acc;
              }, {});

        if (Array.isArray(newRow)) {
          newRow.forEach((row, i) => {
            tableData.value.splice(insertIndex + i, 0, row);
          });
        } else {
          if (rowIndex === -1) {
            tableData.value.push(newRow);
          } else {
            tableData.value.splice(insertIndex, 0, newRow);
          }
        }

        saveAllData();
      };

      const deleteRow = async (rowIndices) => {
        try {
          await confirmDelete("确定要删除吗？");
          rowIndices.sort((a, b) => b - a);
          rowIndices.forEach((rowIndex) => {
            tableData.value.splice(rowIndex, 1);
          });
          saveAllData();
        } catch {
          // 用户取消删除
        }
      };

      const actions = {
        column_add_init: () => addColumn(-1),
        column_add_left: () => {
          const currentIndex = tableProps.value.findIndex(
            (item) => item.label === contextColumnLabel.value
          );
          addColumn(currentIndex, false);
        },
        column_add_right: () => {
          const preIndex = tableProps.value.findIndex(
            (item) => item.label === contextColumnLabel.value
          );
          addColumn(preIndex);
        },
        column_delete: deleteColumn,
        row_add_init: () => addRow(-1),
        up_null_row: () => addRow(contextMenuRowIndex.value, false),
        down_null_row: () => addRow(contextMenuRowIndex.value),
        up_paste_row: () => {
          const upPasteRowData = tableData.value[contextMenuRowIndex.value];
          addRow(contextMenuRowIndex.value, false, [upPasteRowData]);
        },
        down_paste_row: () => {
          const downPasteRowData = tableData.value[contextMenuRowIndex.value];
          addRow(contextMenuRowIndex.value, true, [downPasteRowData]);
        },
        batch_up_paste_row: () => {
          const upPasteSelRowData = [...selectedRows.value].map(
            (item) => tableData.value[item]
          );
          addRow(contextMenuRowIndex.value, false, upPasteSelRowData);
        },
        batch_down_paste_row: () => {
          const downPasteSelRowData = [...selectedRows.value].map(
            (item) => tableData.value[item]
          );
          addRow(contextMenuRowIndex.value, true, downPasteSelRowData);
        },
        delete_row: () => deleteRow([contextMenuRowIndex.value]),
        delete_sel_row: () => deleteRow([...selectedRows.value]),
      };

      if (actions[action]) {
        actions[action]();
        selectedRows.value.clear();
      }

      menuVisible.value = false;
    };

    // 处理 Esc 键的按下
    const handleEscKey = (event) => {
      const clearColumnEdit = () => {
        editingColumn.value = {};
        tableProps.value = tableProps.value.filter((item) => {
          return item.label;
        });
      };
      if (event.key === "Escape" || event.keyCode === 27) {
        // 当按下 Esc 键时，清空编辑状态
        clearColumnEdit();
      }
    };
    // 开始选择行
    const startSelect = (event) => {
      const rowIndex = getRowIndexFromEvent(event);
      if (rowIndex !== -1 && event.buttons === 1) {
        selectedRows.value.clear(); // 清除之前的选中行
        selectedRows.value.add(rowIndex); // 添加当前行
      }
    };

    // 结束选择行
    const endSelect = (event) => {
      if (event.button === 2) {
        // 右键点击，不执行选择操作
        return;
      }
      const arr = [...selectedRows.value];
      console.log("endSelect", arr);
    };

    // 进行行选择
    const selecting = (event) => {
      const rowIndex = getRowIndexFromEvent(event);
      if (rowIndex !== -1 && event.buttons === 1) {
        // 鼠标左键按下时
        selectedRows.value.add(rowIndex); // 添加当前行到选中行
      }
    };

    // 获取行索引
    const getRowIndexFromEvent = (event) => {
      const target = event.target.closest(".el-table__row");
      if (target) {
        return Array.from(target.parentNode.children).indexOf(target);
      }
      return -1;
    };

    // 判断当前行是否被选中
    const isSelected = (index) => {
      return selectedRows.value.has(index);
    };
    const getRowClass = ({ rowIndex }) => {
      return isSelected(rowIndex) ? "selected-row" : "";
    };
    const handleClickOutside = (event) => {
      if (!tableRef.value.$el.contains(event.target)) {
        selectedRows.value.clear(); // 清空选中行
      }
    };
    // 挂载时添加监听器
    onMounted(() => {
      window.addEventListener("keydown", handleEscKey);
      document.addEventListener('click', handleClickOutside);
    });

    // 组件销毁前移除监听器
    onBeforeUnmount(() => {
      window.removeEventListener("keydown", handleEscKey);
      document.removeEventListener('click', handleClickOutside);
    });
    return {
      tableRef,
      createOrUpdateColumnRef,
      headerInputRef,
      rowInputRef,
      contextMenuRef,
      menuVisible,
      tableProps,
      tableData,
      headerCellStyle,
      cellStyle,
      updateTableData,
      init,
      columnFocus,
      saveColumnLabel,
      editingColumn,
      contextColumnLabel,
      editingRow,
      cellDbClickHandle,
      headerClickHandle,
      headerContextmenuHandle,
      rowCellContextHandle,
      rowDbClickHandle,
      headerDblClickHandle,
      handleMenuClick,
      saveRowData,
      rowFocus,
      nodataContextHandle,
      startSelect,
      endSelect,
      selecting,
      getRowIndexFromEvent,
      getRowClass,
    };
  },
};
</script>
