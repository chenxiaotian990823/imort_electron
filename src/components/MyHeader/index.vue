<template>
  <div class="my-header">
    <div class="my-header-title">title</div>
    <div class="my-header-menu">
      <!-- 导入项目按钮 -->
      <div class="my-header-menu-item">
        <el-dropdown @command="projectCommandHandle">
          <el-button type="primary"> 项目管理 </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="addPro" style="display: flex;justify-content: space-around;">新增项目</el-dropdown-item>
              <el-dropdown-item command="freshPro" style="display: flex;justify-content: space-around;"
                >刷新项目列表</el-dropdown-item
              >
              <el-dropdown-item
                v-for="(item, index) in projectList"
                :key="index"
                :divided="index === 0"
                :command="item.path"
                @mouseenter="item.showDelete = true"
                @mouseleave="item.showDelete = false"
                style="display: flex;justify-content: space-around;"
              >
                {{ item.name }}
                <el-text
                  v-if="isCurrentPro(item.path)"
                  type="primary"
                  size="small"
                  >(当前项目)</el-text
                >
                <el-text
                  v-if="item.showDelete"
                  type="danger"
                  @click.stop="deleteProject(item)"
                  style="margin-left: 10px; padding: 0"
                  size="small"
                  >删除</el-text
                >
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <!-- 用户管理 -->
      <div class="my-header-menu-item">
        <el-dropdown>
          <el-button type="primary"> 用户管理 </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="userList">用户列表</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <!-- 用户头像和个人信息 -->
      <div class="my-header-menu-item">
        <el-dropdown>
          <el-avatar> user </el-avatar>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>个人信息</el-dropdown-item>
              <el-dropdown-item @click="logoutHandle"
                >退出登录</el-dropdown-item
              >
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, nextTick } from "vue";
import { useRouter } from "vue-router";
import {
  fetchFolder,
  readJsonFilesFromFolder,
  createProjectFolder,
  deleteFolderRecursive,
} from "@/utils/fsOperate.js";
import {
  writeToLocalStorage,
  readFromLocalStorage,
  removeFromLocalStorage,
} from "@/utils/index.js";

export default {
  setup(props, { emit }) {
    const router = useRouter();
    let projectList = ref([]);
    let contextMenuRef = ref(null);
    let menuVisible = ref(false);

    // 新增项目处理逻辑
    const addProjectHandle = () => {
      // 添加项目的逻辑，比如打开一个对话框让用户输入项目名称
      ElMessageBox.prompt("请输入你的项目名称:", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputPattern: /.+/, // 可以使用正则表达式进行输入验证
        inputErrorMessage: "内容不能为空", // 输入错误时显示的提示
      })
        .then(async ({ value }) => {
          // 用户点击了确定，value 是输入的内容
          try {
            const newPath = await createProjectFolder(value);
            ElMessage.success(`"${value}"项目创建成功`);
            getProjects();
            nextTick(() => {
              writeToLocalStorage("currentProjectPath", newPath);
              fetchProInfo(newPath);
            });
          } catch (error) {
            ElMessage.error("创建项目失败，请稍后重试");
          }
        })
        .catch(() => {});
    };

    // 获取项目列表
    const getProjects = async () => {
      try {
        const res = await fetchFolder();
        if (res) {
          res.forEach((item) => {
            item.showDelete = false;
          });
          projectList.value = res;
        } else {
          projectList.value = [];
        }
      } catch (error) {
        // 可以添加一些错误提示给用户
        ElMessage.error("获取项目列表失败，请稍后重试");
      }
    };
    // 项目列表点击
    const projectCommandHandle = (e) => {
      if (e === "addPro") {
        addProjectHandle();
      } else if (e === "freshPro") {
        getProjects();
      } else {
        writeToLocalStorage("currentProjectPath", e);
        fetchProInfo(e);
      }
    };
    // 读取项目信息
    const fetchProInfo = async (path) => {
      const data = await readJsonFilesFromFolder(path, "menu");
      if (data.menu) {
        emit("update:project:menu", data.menu);
      }
    };

    // 删除项目
    const deleteProject = ({ name, path }) => {
      ElMessageBox.confirm(`确定要删除"${name}"项目及其所有文件吗？`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(async () => {
          await deleteFolderRecursive(path);
          ElMessage.success(`"${name}"项目及其所有文件已删除`);
          getProjects();
          const proPath = readFromLocalStorage("currentProjectPath");
          if (path == proPath) {
            emit("update:project:menu");
            removeFromLocalStorage("currentProjectPath");
          }
        })
        .catch(() => {
          // 用户取消操作
        });
    };

    // 退出处理逻辑
    const logoutHandle = () => {
      ElMessageBox.confirm("确定要退出吗？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          removeFromLocalStorage("currentProjectPath");
          removeFromLocalStorage("currentTableId");
          router.push("/login");
        })
        .catch(() => {
          // 用户取消操作
        });
    };
    const isCurrentPro = computed(() => {
      return (path) => {
        const currentProPath = readFromLocalStorage("currentProjectPath");
        return currentProPath == path;
      };
    });
    // 组件挂载后获取项目列表
    onMounted(() => {
      getProjects();
    });

    return {
      projectList,
      contextMenuRef,
      menuVisible,
      addProjectHandle,
      projectCommandHandle,
      deleteProject,
      logoutHandle,
      isCurrentPro,
    };
  },
};
</script>
