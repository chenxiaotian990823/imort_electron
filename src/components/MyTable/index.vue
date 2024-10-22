<template>
  <div class="my-table">
    <el-table
      :data="tableData"
      style="width: 100%"
      border
      empty-text="暂无数据"
      :header-cell-style="headerCellStyle"
      @cell-dblclick="cellDbClickHandle"
      @row-dblclick="rowDbClickHandle"
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
            <div v-else>
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
import { nextTick, ref } from "vue";
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
      rowIndex: 0,
      columnIndex: 0,
      value: "",
    });
    const editingRow = ref({}); // 控制编辑状态的行
    let headerCellStyle = ref({
      background: "#f5f7fa",
      color: "#000",
      fontWeight: "400",
      fontSize: "0.8rem",
      height: "1rem",
    });
    // 添加新行
    const addLastRow = () => {
      const props = tableProps.value.filter((item) => item.type !== "index");
      const row = props.reduce((acc, cur) => {
        // 检查这里生成的 key 是否与表头字段一致
        acc[cur.propField] = ""; // 初始化每个字段为空字符串
        return acc;
      }, {});
      tableData.value.push(row);
    };

    // 更新表格数据
    const updateTableData = (id) => {
      init(id);
    };

    // 初始化表格
    const init = async (id, needIndex = false) => {
      const path = readFromLocalStorage("currentProjectPath");
      const data = await readJsonFilesFromFolder(path, "table");
      if (data.table && data.table.list) {
        const tableObj = data.table.list.find((item) => item.menuId === id);
        if (!tableObj) {
          // tableProps.value = [{
          //   label: "序号",
          //   type: "index"
          // }];
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
    };
    // 当某个单元格被双击击时会触发该事件
    const cellDbClickHandle = (row, column, cell) => {
      // console.log("cellDbClickHandle", row, column ,cell)
    };
    // 当某一列的表头被点击时会触发该事件
    const headerClickHandle = (column, event) => {
      console.log("headerClickHandle", column, event);
    };
    // 当某一列的表头被双击时会触发该事件
    const headerDblClickHandle = (item, index, event) => {
      editingColumn.value = { [index]: true };
      nextTick(() => {
        headerInputRef.value[0].focus();
      });
    };
    // 当某一列的表头被鼠标右键点击时触发该事件
    const headerContextmenuHandle = (column, event) => {
      contextColumnLabel.value = column.label;
      menuVisible.value = true;
      nextTick(() => {
        if (contextMenuRef.value) {
          let menuList = [
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
        if (editColumnRecover.value) {
          tableProps.value[editColumnRecover.value.index].label =
            editColumnRecover.value.label;
        }
      }
    };
    const handleMenuClick = (action) => {
      console.log("handleMenuClick", action);
      if (action === "column_add_init") {
        tableProps.value.push({
          label: "",
        });
        editingColumn.value = { [tableProps.value.length - 1]: true };
      }
      if (action === "column_add_right") {
        const preIndex = tableProps.value.findIndex((item) => {
          return item.label == contextColumnLabel.value;
        });
        tableProps.value.splice(preIndex + 1, 0, {
          label: "",
        });
        editingColumn.value = { [preIndex + 1]: true };
      } else if (action === "column_delete") {
        tableProps.value = tableProps.value.filter((item, index) => {
          return item.label !== contextColumnLabel.value;
        });
        saveAllData();
      } else if (action === "row_add_init") {
        addLastRow();
      }
      menuVisible.value = false;
    };
    // 暂无数据的时候右键菜单
    const nodataContextHandle = (event) => {
      console.log("nodataContextHandle", event);
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
    return {
      createOrUpdateColumnRef,
      headerInputRef,
      rowInputRef,
      contextMenuRef,
      menuVisible,
      tableProps,
      tableData,
      headerCellStyle,
      addLastRow,
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
      rowDbClickHandle,
      headerDblClickHandle,
      handleMenuClick,
      saveRowData,
      rowFocus,
      nodataContextHandle,
    };
  },
};
</script>
