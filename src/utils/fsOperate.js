const fs = require("fs");
const path = require("path");

// 异步读取文件夹
const getFoldersAsync = async (directory) => {
  const folders = [];

  try {
    const items = await fs.promises.readdir(directory, { withFileTypes: true });

    items.forEach((item) => {
      if (item.isDirectory()) {
        folders.push({
          name: item.name,
          path: path.join(directory, item.name),
        });
      }
    });
  } catch (error) {}

  return folders;
};

/**
 * 异步获取指定文件夹下的所有子文件夹
 * @param {string|string[]} folderName - 文件夹名称，可以是字符串或字符串数组
 * @returns {Promise<string[]>} - 返回子文件夹的路径数组
 */
export const fetchFolder = async (folderName = ["localData", "projects"]) => {
  // 确保 folderName 是一个数组
  if (!Array.isArray(folderName)) {
    folderName = [folderName];
  }

  // 将 folderName 连接成路径
  const projectsDirectory = path.join(process.cwd(), ...folderName);

  // 使用异步函数获取文件夹
  const folders = await getFoldersAsync(projectsDirectory);
  return folders;
};
/**
 * 读取指定文件夹中的 JSON 文件
 * @param {string} folderPath - 文件夹的路径
 * @param {string} [fileName] - 可选，指定的 JSON 文件名（不带扩展名）
 * @returns {Object} - 以 JSON 文件名为 key，文件内容为 value 的对象，若无法读取内容则为 null
 */
export const readJsonFilesFromFolder = (folderPath, fileName = null) => {
  const result = {};

  try {
    // 如果指定了文件名，构造单个文件的路径
    if (fileName) {
      const filePath = path.join(folderPath, `${fileName}.json`);
      if (fs.existsSync(filePath)) {
        try {
          const fileContent = fs.readFileSync(filePath, "utf-8");
          result[fileName] = JSON.parse(fileContent);
        } catch (error) {
          result[fileName] = null; // 无法读取或解析时返回 null
        }
      } else {
        result[fileName] = null;
      }
    } else {
      // 读取文件夹中的所有文件
      const files = fs.readdirSync(folderPath);

      files.forEach((file) => {
        if (path.extname(file) === ".json") {
          const filePath = path.join(folderPath, file);

          try {
            const fileContent = fs.readFileSync(filePath, "utf-8");
            result[path.basename(file, ".json")] = JSON.parse(fileContent);
          } catch (error) {
            result[path.basename(file, ".json")] = null;
          }
        }
      });
    }
  } catch (error) {}

  return result;
};

/**
 * 创建项目文件夹及其子文件
 * @param {string} folderName 文件夹名称
 * @returns {string} 返回新创建的文件夹路径
 */
export const createProjectFolder = (folderName) => {
  const localDataDir = path.join(process.cwd(), "localData"); // 根目录下的 localData 文件夹路径
  const projectsDir = path.join(localDataDir, "projects"); // 根目录下的 projects 文件夹路径
  const newFolderPath = path.join(projectsDir, folderName); // 新文件夹路径

  // 检查 localData 目录是否存在
  if (!fs.existsSync(localDataDir)) {
    fs.mkdirSync(localDataDir); // 如果不存在则创建 localData 文件夹
  }

  // 检查 projects 目录是否存在
  if (!fs.existsSync(projectsDir)) {
    fs.mkdirSync(projectsDir); // 如果不存在则创建 projects 文件夹
  }

  // 检查目标路径是否存在且是一个目录
  if (fs.existsSync(newFolderPath)) {
    if (!fs.statSync(newFolderPath).isDirectory()) {
      throw new Error(`${newFolderPath} 不是一个有效的目录`);
    }
    return newFolderPath; // 如果已存在目录，直接返回路径
  }

  // 创建新文件夹
  fs.mkdirSync(newFolderPath);

  // 创建 menu.json、user.json 和 table.json 文件
  const menuFilePath = path.join(newFolderPath, "menu.json");
  const userFilePath = path.join(newFolderPath, "user.json");
  const tableFilePath = path.join(newFolderPath, "table.json");

  fs.writeFileSync(menuFilePath, JSON.stringify({ list: [] }, null, 2)); // 创建空的 menu.json
  fs.writeFileSync(userFilePath, JSON.stringify({ list: [] }, null, 2)); // 创建空的 user.json
  fs.writeFileSync(tableFilePath, JSON.stringify({ list: [] }, null, 2)); // 创建空的 table.json

  // 返回新创建的文件夹路径
  return newFolderPath;
};

/**
 * 递归删除文件夹及其内容
 * @param {string} dirPath 要删除的文件夹路径
 */
export const deleteFolderRecursive = (dirPath) => {
  // 检查目录是否存在
  if (fs.existsSync(dirPath)) {
    // 获取目录中的文件和子目录
    const files = fs.readdirSync(dirPath);

    // 遍历每个文件/子目录
    files.forEach((file) => {
      const filePath = path.join(dirPath, file);
      // 如果是目录，则递归调用删除
      if (fs.statSync(filePath).isDirectory()) {
        deleteFolderRecursive(filePath);
      } else {
        // 否则删除文件
        fs.unlinkSync(filePath);
      }
    });

    // 删除空目录
    fs.rmdirSync(dirPath);
  } else {
  }
};

/**
 * 向 JSON 文件中新增或更新一条数据
 * @param {string} proPath 项目路径
 * @param {string} fileName 文件名
 * @param {number|null} itemId 要新增或更新的项目的 ID。如果为 null，则表示新增一条数据
 * @param {Object} newData 要新增或更新的数据对象
 * @param {Object} keyName 索引值
 * @returns {Promise<void>}
 */
export const upsertItemInJsonFile = async (
  proPath,
  fileName,
  itemId,
  newData,
  keyName = "id"
) => {
  try {
    const filePath = path.join(proPath, fileName);
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      // 如果文件不存在，创建一个新的文件并写入空的结构
      const initialData = { list: [] };
      fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2), "utf8");
    }

    // 读取文件
    const data = fs.readFileSync(filePath, "utf8");
    const jsonData = JSON.parse(data); // 解析 JSON 数据

    if (itemId !== null) {
      // 如果 itemId 不为 null，更新现有项目
      const itemIndex = jsonData.list.findIndex((item) => item[keyName] === itemId);
      if (itemIndex === -1) {
        upsertItemInJsonFile(proPath, fileName, null, newData, keyName)
        return
      }
      // 更新项目数据
      jsonData.list[itemIndex] = { ...jsonData.list[itemIndex], ...newData };
    } else {
      let newItem;
      if (newData[keyName] !== undefined) {
        // 如果 newData 中包含 keyName，直接使用该 ID
        newItem = { ...newData };
      } else {
        // 生成新的自增 ID
        const maxId =
          jsonData.list.length > 0
            ? Math.max(...jsonData.list.map((item) => item[keyName]))
            : 0;
        const newId = maxId + 1; // 生成新的自增 ID
        newItem = { [keyName]: newId, ...newData }; // 创建新项目对象
      }

      jsonData.list.push(newItem);
    }
    // 写回更新后的数据
    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), "utf8");
  } catch (error) {
    console.error("Error:", error);
  }
};

// 自定义错误类，确保包含 message 和 code
export class CustomError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code; // 设置错误代码
  }
}

/**
 * 检查某一项是否有子节点
 * @param {Array} list - JSON 列表
 * @param {number} id - 要检查的项的 ID
 * @returns {boolean} - 如果有子节点，返回 true；否则返回 false
 */
const hasChildren = (list, id) => {
  return list.some((item) => item.parentId === id);
};

/**
 * 递归删除某项及其所有子节点
 * @param {Array} list - JSON 列表
 * @param {number} id - 要删除的项的 ID
 * @returns {Array} - 返回删除后的列表
 */
const deleteItemAndChildren = (list, id) => {
  // 找到该项的所有子节点
  const children = list.filter((item) => item.parentId === id);

  // 递归删除子节点
  children.forEach((child) => {
    list = deleteItemAndChildren(list, child.id);
  });

  // 删除当前项
  return list.filter((item) => item.id !== id);
};

/**
 * 删除 JSON 文件中的某一项
 * @param {string} proPath - 项目的根路径
 * @param {string} fileName - JSON 文件名
 * @param {number} id - 要删除的项的 ID
 * @param {boolean} deleteChildren - 是否删除所有子节点，默认值为 false
 * @throws Will throw an error with a code if the file does not exist, cannot be parsed, or the item has children.
 */
export const deleteItemFromJson = (
  proPath,
  fileName,
  id,
  deleteChildren = false
) => {
  const filePath = path.join(proPath, fileName); // 构造文件路径

  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    throw new CustomError(`文件 ${filePath} 不存在`, "FILE_NOT_FOUND");
  }

  // 读取文件内容
  const fileContent = fs.readFileSync(filePath, "utf-8");

  // 解析 JSON
  let jsonData;
  try {
    jsonData = JSON.parse(fileContent);
  } catch (error) {
    throw new CustomError(
      `无法解析 JSON 文件 ${fileName}: ${error.message}`,
      "JSON_PARSE_ERROR"
    );
  }

  // 查找要删除的项
  const itemToDelete = jsonData.list.find((item) => item.id === id);

  if (!itemToDelete) {
    throw new CustomError(`ID 为 ${id} 的项不存在`, "ITEM_NOT_FOUND");
  }

  // 检查该项是否有子节点
  if (hasChildren(jsonData.list, id)) {
    if (!deleteChildren) {
      throw new CustomError(
        `无法删除 ID 为 ${id} 的项，因为它有子节点`,
        "HAS_CHILDREN"
      );
    }

    // 删除当前项及其所有子节点
    jsonData.list = deleteItemAndChildren(jsonData.list, id);
  } else {
    // 没有子节点，直接删除当前项
    jsonData.list = jsonData.list.filter((item) => item.id !== id);
  }

  // 将更新后的数据写回文件
  try {
    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), "utf-8");
  } catch (error) {
    throw new CustomError(
      `无法写入更新后的 JSON 数据到文件 ${fileName}: ${error.message}`,
      "WRITE_ERROR"
    );
  }
};

/**
 * 增加 props 到指定 menuId 的项目
 * @param {Object} jsonData 原始 JSON 数据
 * @param {number} menuId 目标项目的 menuId
 * @param {string} label 新的 prop 的 label
 * @param {string} prefix 新的 prop 的 prefix
 * @returns {Object} 返回更新后的数据结构
 */
export const addPropToMenuItem = (jsonData, menuId, label, prefix) => {
  // 查找指定 menuId 的项目
  let menuItem = jsonData.list.find(item => item.menuId == menuId);

  // 如果未找到，创建新的项目
  if (!menuItem) {
    menuItem = { menuId, props: [], data: [] };
    jsonData.list.push(menuItem); // 将新项目添加到 list 中
  }

  // 创建新的 prop 对象
  const newProp = { label };

  // 根据 prefix 字段决定插入位置
  if (prefix === "index") {
    // 在开头插入
    menuItem.props.unshift(newProp);
  } else {
    // 找到 prefix 对应的 propField
    const prefixIndex = menuItem.props.findIndex(prop => prop.propField === prefix);
    
    if (prefixIndex !== -1) {
      // 在找到的 prefix 后插入新的 prop
      menuItem.props.splice(prefixIndex + 1, 0, newProp);
    } else {
      // 如果未找到，直接添加到末尾
      menuItem.props.push(newProp);
    }
  }

  // 返回新的数据结构
  return {
    props: menuItem.props,
    data: menuItem.data // 保持原有的 data 数据不变
  };
};