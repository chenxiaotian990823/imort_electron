<template>
  <div class="container">
    <el-container>
      <el-header>
        <my-header @update:project:menu="updateProjectMenu" />
      </el-header>
      <el-container>
        <el-aside>
          <my-tree ref="myTree" @menu:table:sel="menuTableSelHandle" />
        </el-aside>
        <el-container>
          <el-main>
            <div v-show="isHaveTableId">
              <my-table ref="myTable" />
              <!-- <el-backtop :right="100" :bottom="100" /> -->
            </div>
          </el-main>
        </el-container>
      </el-container>
      <el-footer>Footer</el-footer>
    </el-container>
  </div>
</template>

<script>
import { ref, onMounted, nextTick, computed } from "vue";
import MyTable from "@/components/MyTable/index.vue";
import MyTree from "@/components/MyTree/index.vue";
import MyHeader from "@/components/MyHeader/index.vue";
import { readFromLocalStorage, writeToLocalStorage } from "@/utils"
export default {
  components: {
    MyTree,
    MyTable,
    MyHeader,
  },
  setup() {
    const myTree = ref(null);
    const myTable = ref(null);
    const currentTableId = ref(readFromLocalStorage("currentTableId")); // 初始化为 localStorage 中的值
    // 菜单更新
    const updateProjectMenu = (menu) => {
      nextTick(() => {
        let list = [];
        if (menu && menu.list) {
          list = menu.list;
        }
        myTree.value.init(list);
      });
    };
    // 菜单末节点点击处理表格
    const menuTableSelHandle = ({ id }) => {
      writeToLocalStorage("currentTableId", id)
      currentTableId.value = id;
      myTable.value.init(id);
    };
    const isHaveTableId = computed(() => {
      return currentTableId.value;
    });
    onMounted(() => {});
    return {
      myTree,
      myTable,
      updateProjectMenu,
      menuTableSelHandle,
      isHaveTableId,
    };
  },
};
</script>
