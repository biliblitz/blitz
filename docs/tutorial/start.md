# 开始

首先选择一份模板，可以是 [`minimal`][minimal]，[`recommend`][recommend] 或者 [`full`][full] 中的一个。点击连接可以查看每个版本的特性列表。选择好之后就将下面指令中的 `recommend` 替换为你希望的分支。

```bash
# 将项目拷贝到 blitz-example 文件夹
git clone -b recommend --depth 1 https://github.com/biliblitz/blitz-template blitz-example
```

接着进入 `blitz-example` 文件夹，做一些初始操作。

1. 删除旧版本 lock 文件，确保安装最新版本的依赖（可选）

   ```bash
   rm -rf pnpm-lock.yaml
   ```

2. 安装依赖

   ```bash
   pnpm install # or npm, yarn
   ```

3. 重新初始化 git 项目（可选）

   ```bash
   rm -rf .git && git init
   ```

[full]: https://github.com/biliblitz/blitz-template/tree/full
[minimal]: https://github.com/biliblitz/blitz-template/tree/minimal
[recommend]: https://github.com/biliblitz/blitz-template/tree/recommend
