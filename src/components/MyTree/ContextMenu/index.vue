<template>
  <div @contextmenu.prevent="openContextMenu">
    <context-menu v-model:show="menuVisible" :options="optionsComponent">
      <context-menu-item
        v-for="(item, index) in menuList"
        :key="index"
        :label="item.label"
        @click="handleMenuClick(item.action)"
      />
    </context-menu>
  </div>
</template>

<script>
import { nextTick, ref } from "vue";
import {
  ContextMenu,
  ContextMenuGroup,
  ContextMenuItem,
} from "@imengyu/vue3-context-menu";

export default {
  components: {
    ContextMenu,
    ContextMenuGroup,
    ContextMenuItem,
  },
  props: {
    copiedNode: {
      type: Object,
      required: false,
    },
  },
  setup(props, { emit }) {
    let menuVisible = ref(false);
    let menuList = ref([])
    let optionsComponent = ref({
      zIndex: 3,
      x: 500,
      y: 200,
    });
    const handleVisibleChange = (val) => {
      menuVisible.value = val;
    };

    const handleMenuClick = (action) => {
      emit("onMenuClick", action);
      handleVisibleChange(false); // 关闭菜单
    };
    const openContextMenu = (event, list, zindex = 3) => {
      optionsComponent.value.x = event.clientX;
      optionsComponent.value.y = event.clientY;
      optionsComponent.value.zIndex = zindex;
      menuList.value = list;
      nextTick(() => {
        menuVisible.value = true;
      })
    };
    return {
      menuVisible,
      menuList,
      optionsComponent,
      handleVisibleChange,
      handleMenuClick,
      openContextMenu,
    };
  },
};
</script>
