<template>
  <div id="app">
    <input type="file" @change="handleFileChange" />
    <el-button @click="handleUpload">上传</el-button>
  </div>
</template>

<script>
import createFileChunk from './utils/createFileChunk';
import { post } from './utils/request';
// 定义文件切块大小
// chrome 保存在内存中最大的尺寸是 10M，超出后无法显示
const CHUNK_SIZE = 2 * 1024 * 1024;

export default {
  name: 'App',
  data() {
    return {
      file: null,
    };
  },
  methods: {
    handleFileChange(e) {
      const [file] = e.target.files;
      if (!file) return;
      this.file = file;
    },
    async handleUpload() {
      if (!this.file) return;
      const fileChunkList = createFileChunk(this.file, CHUNK_SIZE);

      const requestList = fileChunkList.map(async ({ chunk, hash }) => {
        const formData = new FormData();

        formData.append('chunk', chunk);
        formData.append('hash', hash);
        formData.append('filename', this.file.name);

        return await post('http://localhost:3000', formData);
      });

      await Promise.all(requestList);

      // 发送合并请求
      await post('http://localhost:3000/merge', {
        size: CHUNK_SIZE,
        filename: this.file.name
      });
    }
  }
};
</script>

<style>
</style>
