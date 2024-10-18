<template>
  <div class="my-table">
    <el-button type="primary" @click="addLastColumn">增加列</el-button>
    <el-button type="primary" @click="addLastRow">增加行</el-button>
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
          :props="item.label"
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
          <!-- <template #default="{ row }">
            <span>{{ row[item.label] }}</span>
          </template> -->
        </el-table-column>
        <!-- 可编辑表头 -->
        <el-table-column v-else align="center" width="150">
          <template #header>
            <el-input
              ref="headerInputRef"
              v-model="item.label"
              :autofocus="true"
              @focus="columnFocus(item, index)"
              @blur="saveColumnLabel(index)"
            />
          </template>
        </el-table-column>
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
    let contextMenuRef = ref(null);
    let menuVisible = ref(false); // 右键菜单显示状态
    let tableProps = ref([]); // 列配置
    let tableData = ref([]); // 表格数据
    const editColumnRecover = ref(null); // 编辑前的列数据
    const editingColumn = ref({}); // 控制编辑状态的列
    const contextColumnLabel = ref(null); // 右键编辑状态的列索引
    const editingRow = ref(null); // 控制编辑状态的行
    let headerCellStyle = ref({
      background: "#f5f7fa",
      color: "#000",
      fontWeight: "400",
      fontSize: "0.8rem",
      height: "1rem",
    });

    // 添加新列
    const addLastColumn = () => {
      createOrUpdateColumnRef.value.init(null);
    };

    // 添加新行
    const addLastRow = () => {
      const props = tableProps.value.filter((item) => item.type !== "index");
      const row = props.reduce((acc, cur) => {
        acc[cur.label] = "";
        return acc;
      }, {});
      tableData.value.push(row);
    };

    // 更新表格数据
    const updateTableData = (id) => {
      init(id);
    };

    // 初始化表格
    const init = async (id, needIndex = true) => {
      const path = readFromLocalStorage("currentProjectPath");
      const data = await readJsonFilesFromFolder(path, "table");
      if (data.table && data.table.list) {
        const tableObj = data.table.list.find((item) => item.menuId === id);
        if (!tableObj) {
          tableProps.value = [];
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
          let menuList = [{ label: "删除", action: "column_delete" }];
          contextMenuRef.value.openContextMenu(event, menuList);
        }
      });
    };
    // 当某一行被双击时会触发该事件
    const rowDbClickHandle = (row, column, event) => {
      console.log("rowDbClickHandle", row, column, event);
    };
    // 列单元格聚焦
    const columnFocus = (item, index) => {
      editColumnRecover.value = {
        index,
        label: item.label,
      };
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
        ElMessage.success("操作成功");
      }
    };
    // 保存表头新名称
    const saveColumnLabel = async (index) => {
      try {
        editingColumn.value = { [index]: false };
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
      if(action === "column_delete") {
        tableProps.value = tableProps.value.filter((item, index) => {
          return item.label !== contextColumnLabel.value;
        });
        saveAllData();
      }
      menuVisible.value = false;
    };
    return {
      createOrUpdateColumnRef,
      headerInputRef,
      contextMenuRef,
      menuVisible,
      tableProps,
      tableData,
      headerCellStyle,
      addLastColumn,
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
    };
  },
};
</script>
