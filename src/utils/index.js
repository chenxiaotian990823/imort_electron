/**
 * 将扁平的树形数据转换为嵌套的树形结构
 * @param {Array} flatArray 扁平的树形数据
 * @returns {Array} 嵌套的树形结构
 */
export const buildTree = (flatArray) => {
  const tree = [];
  const map = {};

  // 将每个节点按 ID 存入 map
  flatArray.forEach((item) => {
    map[item.id] = { ...item, children: [] }; // 初始化每个节点并添加 children 属性
  });

  // 构建树形结构
  flatArray.forEach((item) => {
    if (item.parentId === 0) {
      // 如果是根节点，直接推入树
      tree.push(map[item.id]);
    } else {
      // 如果不是根节点，找到其父节点并添加到父节点的 children 中
      if (map[item.parentId]) {
        map[item.parentId].children.push(map[item.id]);
      }
    }
  });

  return tree;
};

/**
 * 将数据写入 localStorage
 * @param {string} key 存储的键名
 * @param {any} value 要存储的值，可以是对象或数组
 */
export const writeToLocalStorage = (key, value) => {
  try {
    const serializedValue = JSON.stringify(value); // 将值序列化为 JSON 字符串
    localStorage.setItem(key, serializedValue); // 存储到 localStorage
  } catch (error) {
  }
};

/**
 * 从 localStorage 读取数据
 * @param {string} key 要读取的键名
 * @returns {any} 读取的值，若不存在则返回 null
 */
export const readFromLocalStorage = (key) => {
  try {
    const serializedValue = localStorage.getItem(key); // 从 localStorage 中获取数据
    return serializedValue === null ? null : JSON.parse(serializedValue); // 解析 JSON 字符串
  } catch (error) {
    return null; // 读取出错时返回 null
  }
};

/**
 * 从 localStorage 删除指定的键
 * @param {string} key 要删除的键名
 */
export const removeFromLocalStorage = (key) => {
  try {
    localStorage.removeItem(key); // 删除 localStorage 中指定的键
  } catch (error) {
    console.error(`Error removing key "${key}" from localStorage:`, error);
  }
};