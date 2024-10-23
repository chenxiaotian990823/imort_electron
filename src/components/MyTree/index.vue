<template>
  <div class="my-tree">
    <div class="my-tree-operate" v-if="isHaveProject()">
      <el-icon title="添加一级节点" @click="handleAddRootNode"
        ><FolderAdd
      /></el-icon>
    </div>
    <el-tree
      :data="treeData"
      :props="defaultProps"
      empty-text="暂无数据"
      default-expand-all
      :check-on-click-node="true"
      :expand-on-click-node="false"
      highthlight-current
      @node-click="handleNodeClick"
      @node-contextmenu="handleRightClick"
      icon="el-icon-caret-right"
    >
      <template #default="{ data }">
        <span class="custom-tree-node">
          <el-icon v-if="data.children && data.children.length"><FolderOpened /></el-icon>
          <el-icon v-else><Document /></el-icon>
          <span>{{ data.label }}</span>
        </span>
      </template>
    </el-tree>
    <context-menu
      v-if="menuVisible"
      ref="contextMenuRef"
      @onMenuClick="handleMenuClick"
    />
    <create-or-update-node
      ref="createOrUpdateNodeRef"
      @update:menu:data="updateMenuData"
    />
  </div>
</template>

<script>
import { ref, nextTick, computed, h } from "vue";
import ContextMenu from "@/components/MyTree/ContextMenu/index.vue";
import CreateOrUpdateNode from "@/components/MyTree/CreateOrUpdateNode/index.vue";
import { FolderAdd, FolderOpened, Document } from "@element-plus/icons-vue";
import { buildTree, readFromLocalStorage } from "@/utils/index";
import { readJsonFilesFromFolder, deleteItemFromJson, copyMenu } from "@/utils/fsOperate";
import { CustomError } from "@/utils/fsOperate";

export default {
  components: {
    ContextMenu,
    FolderAdd,
    FolderOpened,
    Document,
    CreateOrUpdateNode,
  },
  setup(props, { emit }) {
    let contextMenuRef = ref(null);
    let createOrUpdateNodeRef = ref(null);
    let defaultProps = ref({
      children: "children",
      label: "label",
    });
    let treeData = ref([]);
    let menuVisible = ref(false);
    let currentNodeData = ref(null);
    let copiedNode = ref(null); // 保存复制的节点

    // 鼠标左键点击
    const handleNodeClick = (data, node) => {
      if (!data.children || data.children.length === 0) {
        emit("menu:table:sel", data);
      }
    };
    // 右键点击
    const handleRightClick = (event, data, node) => {
      event.preventDefault(); // 阻止默认右键菜单
      currentNodeData.value = data;
      menuVisible.value = true;
      nextTick(() => {
        if (contextMenuRef.value) {
          let menuList = [
            { label: "复制", action: "copy" },
            { label: "添加子节点", action: "add" },
            { label: "编辑", action: "edit" },
            { label: "删除", action: "delete" },
          ];
          if (copiedNode.value) {
            menuList.push({ label: "粘贴", action: "paste" });
          }
          contextMenuRef.value.openContextMenu(event, menuList);
        }
      });
    };
    // 菜单点击事件
    const handleMenuClick = async (action) => {
      // 根据操作执行相应逻辑
      if (action === "copy") {
        copiedNode.value = JSON.parse(JSON.stringify(currentNodeData.value));
      } else if (action === "add") {
        createOrUpdateNodeRef.value.init(null, currentNodeData.value.id);
      } else if (action === "edit") {
        createOrUpdateNodeRef.value.init(currentNodeData.value.id);
      } else if (action === "delete") {
        deleteConfirm();
      } else if(action == "paste") {
        try {
          const path = readFromLocalStorage("currentProjectPath");
          const copyId = copiedNode.value.id
          const targetId = currentNodeData.value.id
          await copyMenu(path, "menu", copyId, targetId)
          updateMenuData()
        } catch (error) {
          ElMessage.error(`${error}, 请稍后重试`);
        }
      }
      // 添加其他操作逻辑...
      menuVisible.value = false;
    };
    // 删除节点
    const deleteConfirm = (deteleChildren = false) => {
      let msg = "确定删除该节点吗？";
      let title = "提示";
      if (deteleChildren) {
        msg = "该节点有子节点，确定删除吗？";
        title = "注意";
      }
      ElMessageBox.confirm(msg, title, {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }).then(async () => {
        try {
          const proPath = readFromLocalStorage("currentProjectPath");
          await deleteItemFromJson(
            proPath,
            "menu.json",
            currentNodeData.value.id,
            deteleChildren
          );
          ElMessage.success("节点已删除");
          updateMenuData(currentNodeData.value.parentId);
        } catch (error) {
          if (error instanceof CustomError) {
            if (error.code === "HAS_CHILDREN") {
              deleteConfirm(true);
            } else {
              ElMessage.error(`${error.code}, 请稍后重试`);
            }
          } else {
            ElMessage.error("操作失败，请稍后重试");
          }
        }
      });
    };
    // 添加根节点
    const handleAddRootNode = () => {
      createOrUpdateNodeRef.value.init(null, 0);
    };
    /**
     * 更新节点信息，增删改查造成的
     */
    const updateMenuData = async () => {
      const path = readFromLocalStorage("currentProjectPath");
      const data = await readJsonFilesFromFolder(path, "menu");
      if (data.menu && data.menu.list) {
        init(data.menu.list || []);
      }
    };
    const isHaveProject = computed(() => {
      return () => {
        return !!readFromLocalStorage("currentProjectPath");
      };
    });
    // 初始化，扁平数组
    const init = (list) => {
      treeData.value = buildTree(list || []);
    };
    return {
      contextMenuRef,
      createOrUpdateNodeRef,
      defaultProps,
      treeData,
      menuVisible,
      copiedNode,
      init,
      handleNodeClick,
      handleRightClick,
      handleMenuClick,
      handleAddRootNode,
      updateMenuData,
      isHaveProject,
    };
  },
};
</script>
