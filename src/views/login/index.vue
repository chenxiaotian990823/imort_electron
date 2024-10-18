<template>
  <div class="login-container">
    <el-card class="login-card" shadow="never">
      <h2 class="login-title">登录</h2>
      <el-form
        :model="form"
        :rules="rules"
        :hide-required-asterisk="true"
        ref="formRef"
        status-icon
        label-position="right"
        label-width="70"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
      </el-form>
      <div class="button-container">
        <el-button type="primary" class="login-button" @click="handleLogin"
          >登录</el-button
        >
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref } from "vue";
import { useRouter } from "vue-router";
export default {
  setup() {
    const router = useRouter();
    const formRef = ref(null);
    const form = ref({
      username: "",
      password: "",
    });
    const rules = ref({
      username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
      password: [{ required: true, message: "请输入密码", trigger: "blur" }],
    });
    const handleLogin = () => {
      formRef.value.validate((valid) => {
        if (valid) {
          // 用户名和密码都已填写
          router.push({
            path: "/index",
          })
        } else {
          return false;
        }
      });
    };
    return {
      form,
      rules,
      formRef,
      handleLogin,
    };
  },
};
</script>

<style lang="scss" scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: var(--el-color-primary); // 使用 Element Plus 的主色

  .login-card {
    width: 25rem;
    padding: 1.5rem;

    .login-title {
      text-align: center;
      margin-bottom: 1.5rem;
    }
  }
  .el-form-item {
    margin-bottom: 1rem;
  }

  .button-container {
    display: flex;
    justify-content: center; // 居中按钮
    margin-top: 1.5rem; // 可选：与表单之间的间距
  }

  // 设置登录按钮的样式
  .login-button {
    width: 100%; // 按钮宽度为100%
  }
}
</style>
