<template>
  <div class="create-or-update-column">
    <el-dialog v-model="dialogFormVisible" title="" width="500">
      <el-form
        ref="ruleFormRef"
        style="max-width: 600px"
        :model="ruleForm"
        :rules="rules"
        label-width="auto"
        class="demo-ruleForm"
        status-icon
      >
        <el-form-item label="列名称" prop="label">
          <el-input v-model="ruleForm.label" />
        </el-form-item>
        <el-form-item label="前置字段" prop="preField">
          <el-select-v2
            v-model="ruleForm.preField"
            filterable
            :options="fieldOptions"
            placeholder="前置字段"
            :disabled="ruleForm.id"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogFormVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm"> 确定 </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, nextTick } from "vue";
import {
  readJsonFilesFromFolder,
  upsertItemInJsonFile,
  addPropToMenuItem,
} from "@/utils/fsOperate";
import { readFromLocalStorage } from "@/utils/index";
export default {
  setup(props, { emit }) {
    const validateLabel = (rule, value, callback) => {
      const havedSame = fieldOptions.value.find(
        (item) => item.value === ruleForm.value.label
      );
      if (value === "") {
        callback(new Error("请输入列名称"));
      } else if(havedSame) {
        callback(new Error("列名称重复"));
      } {
        callback();
      }
    };
    let ruleFormRef = ref(null);
    let dialogFormVisible = ref(false);
    let ruleForm = ref({
      id: null,
      label: "",
      preField: "",
    });
    let rules = ref({
      label: [{ required: true, validator: validateLabel, trigger: "blur" }],
      preField: [
        { required: true, message: "请选择前置字段", trigger: "change" },
      ],
    });
    let fieldOptions = ref([]);

    // 提交表单
    const submitForm = () => {
      ruleFormRef.value.validate(async (valid) => {
        if (valid) {
          confirmHandle();
        }
      });
    };

    // 确认提交
    const confirmHandle = async () => {
      try {
        const path = readFromLocalStorage("currentProjectPath");
        const data = await readJsonFilesFromFolder(path, "table");
        const currentTableId = readFromLocalStorage("currentTableId");
        if (data.table && data.table.list) {
          const newData = addPropToMenuItem(
            data.table,
            currentTableId,
            ruleForm.value.label,
            ruleForm.value.preField
          );
          let newItem = {
            menuId: currentTableId,
            ...newData,
          };
          const res = await upsertItemInJsonFile(
            path,
            "table.json",
            currentTableId,
            newItem,
            "menuId"
          );
          ElMessage.success("操作成功");
          dialogFormVisible.value = false;
          emit("update:table:data", currentTableId);
        }
      } catch (error) {
        ElMessage.error("操作失败，请稍后重试");
      }
    };

    // 获取所有字段
    const getFileds = async () => {
      const path = readFromLocalStorage("currentProjectPath");
      const data = await readJsonFilesFromFolder(path, "table");
      const currentTableId = readFromLocalStorage("currentTableId");
      if (data.table && data.table.list) {
        let filedList = [];
        const tableObj = data.table.list.find((item) => item.menuId === currentTableId);
        if(tableObj) {
          filedList = tableObj.props.map((item) => {
            return {
              label: item.label,
              value: item.label,
            };
          });
        }
        filedList.unshift({
          label: "无前置字段",
          value: "index",
        });
        fieldOptions.value = filedList;
      }
    };

    const init = async (id, prefixName = "") => {
      ruleForm.value.id = id || null;
      ruleForm.value.preField = prefixName;
      getFileds();
      // if (id) {
      //   const path = readFromLocalStorage("currentProjectPath");
      //   const data = await readJsonFilesFromFolder(path, "table");
      //   if (data.table && data.table.list) {
      //     const obj = data.table.list.find((item) => item.id === id);
      //     if (obj) {
      //       ruleForm.value = obj;
      //     }
      //   }
      // }
      nextTick(() => {
        dialogFormVisible.value = true;
      });
    };
    return {
      ruleFormRef,
      dialogFormVisible,
      ruleForm,
      rules,
      fieldOptions,
      init,
      submitForm,
    };
  },
};
</script>
