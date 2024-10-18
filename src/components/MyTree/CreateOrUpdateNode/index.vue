<template>
  <div class="create-or-update-node">
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
        <el-form-item label="节点名称" prop="label">
          <el-input v-model="ruleForm.label" />
        </el-form-item>
        <el-form-item label="父节点" prop="parentId">
          <el-select-v2
            v-model="ruleForm.parentId"
            filterable
            :options="parentNodeOptions"
            placeholder="父节点"
            :disabled="ruleForm.id"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogFormVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, nextTick } from 'vue'
import { readFromLocalStorage } from "@/utils/index"
import { readJsonFilesFromFolder, upsertItemInJsonFile } from "@/utils/fsOperate"
export default {
  setup (props, { emit }) {
    let ruleFormRef = ref(null)
    let dialogFormVisible = ref(false)
    let ruleForm = ref({
      id: null,
      label: '',
      parentId: '',
    })
    let rules = ref({
      label: [
        { required: true, message: '请输入节点名称', trigger: 'blur' },
      ],
      parentId: [
        { required: true, message: '请选择父节点', trigger: 'change' },
      ],
    })
    let parentNodeOptions = ref([])

    // 查找菜单文件内容
    const fetchMenuFileContent = async () => {
      const path = readFromLocalStorage('currentProjectPath')
      const data = await readJsonFilesFromFolder(path, "menu")
      return data
    }

    const getParentNodeOptions = async () => {
      const data = await fetchMenuFileContent()
      if(data.menu && data.menu.list) {
        let flatMenuList = data.menu.list.map(({ id, label }) => {
          return {
            value: id,
            label
          }
        })
        parentNodeOptions.value = [
          {
            value: 0,
            label: "一级节点"
          },
          ...flatMenuList
        ]
      }
    }

    // 提交表单
    const submitForm = () => {
      ruleFormRef.value.validate(async valid => {
        if(valid) {
          confirmHandle()
        }
      })
    }

    // 确认提交
    const confirmHandle = async () => {
      try {
        const proPath = readFromLocalStorage('currentProjectPath')
        let newData = {
          label: ruleForm.value.label,
          parentId: ruleForm.value.parentId,
        }
        const res = await upsertItemInJsonFile(proPath, "menu.json", ruleForm.value.id || null, newData)
        ElMessage.success("操作成功")
        dialogFormVisible.value = false
        if(ruleForm.value.id) {
          emit("update:menu:data", ruleForm.value.id)
        } else {
          emit("update:menu:data", ruleForm.value.parentId)
        }
      } catch (error) {
        ElMessage.error("操作失败，请稍后重试")
      }
    }

    const init = async (id, parentId) => {
      ruleForm.value.id = id || null
      getParentNodeOptions()
      if(id) {
        // 详情
        const data = await fetchMenuFileContent()
        if(data.menu && data.menu.list) {
          const obj = data.menu.list.find(item => item.id === id)
          if(obj) {
            ruleForm.value = obj
          }
        }
      }
      if(parentId !== null && parentId !== undefined) {
        ruleForm.value.parentId = parentId
      }
      nextTick(() => {
        dialogFormVisible.value = true
      })
    }
    return {
      ruleFormRef,
      dialogFormVisible,
      ruleForm,
      rules,
      parentNodeOptions,
      init,
      submitForm
    };
  }
}
</script>
