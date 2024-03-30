## large-file-upload
大文件上传例子

参考：[https://juejin.cn/post/6844904046436843527](https://juejin.cn/post/6844904046436843527)

### 本地调试
```bash
npm ci 

npm run dev

npm run server
```

## 思路
### 前端
1. File 接口基于 Blob 接口，利于 Blob 接口的 slice 方法对大文件进行切片
2. 通过 spark-md5 计算 file 的 hash
3. 通过 filename 和 hash 请求后台，检查已经上传了哪些切片
4. 过滤已经上传过的切片，上传未上传的切片
5. 每次上传完成检查 **已上传** 和 **本次上传** 的切片是否和总切片数一样，是的话调用合并接口
### 后端
1. 提供切片文件上传接口，通过 multiparty 包
2. 提供检查接口，返回已上传切片的列表
3. 提供合并接口，通过 stream 的 pipe 方法实现