# 项目名

## 运行环境

- Node.js v20.18.0

## 运行步骤

- ``` js
  npm install
  ```

- ```js
  npm run dev:electron
  ```

## 项目结构

```
.
├── README.md
├── electron  // electron 配置
├── localData // 本地数据
    ├── projects  // 本地项目文件
├── src
    ├── assets    // 静态资源
    ├── components  // 组件
    ├── pages      // 页面
    ├── router    // 路由
    ├── utils     // 工具
    ├── styles    // 样式
        ├── common.scss  // 基础样式
        ├── element-plus-override.scss  // 自定义 element-plus 样式
        ├── index.scss  // 样式入口文件
        ├── rem.scss  // rem 适配
        ├── reset.scss  // 重置样式
├── App.vue  // 入口文件
├── main.js  // 主进程入口文件
├── index.html  // html 模板文件
├── package.json  // 项目依赖包版本信息
├── vite.config.js  // vite 配置文件