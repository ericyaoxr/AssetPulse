# AssetPulse 项目规则

## 工作流程

### 自动提交代码
每次修改完代码后，必须自动执行 git add、commit 和 push，遇到网络失败需重试直到成功。无需询问用户是否提交。

### Git 命令
- git 路径：`C:\Program Files\Git\bin\git.exe`
- PowerShell 中使用 `;` 分隔命令（不支持 `&&`）
- 示例：`Set-Location "c:\workspace\AssetPulse"; & "C:\Program Files\Git\bin\git.exe" add -A; & "C:\Program Files\Git\bin\git.exe" commit -m "msg"; & "C:\Program Files\Git\bin\git.exe" push`

### Node.js 环境
- Node.js 路径：`c:\Program Files\nodejs`
- 运行 npm 命令前需设置 PATH：`$env:PATH = "c:\Program Files\nodejs;" + $env:PATH`

### 代码规范
- 不添加注释（除非用户要求）
- 优先编辑现有文件，避免创建不必要的新文件
- 不主动创建文档文件（*.md、README）

### 验证
- 修改完成后运行 `npm run lint` 和 `npm run build` 验证
- 修复所有 lint 错误后再提交
