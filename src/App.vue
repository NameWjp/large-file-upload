<template>
  <div id="app">
    <input type="file" @change="handleFileChange" />
    <el-button @click="handleUpload">上传</el-button>
    <el-table :data="chunkList">
      <el-table-column
        prop="hash"
        label="切片hash"
        align="center"
      />
      <el-table-column label="大小(KB)" align="center" width="120">
        <template v-slot="{ row }">
          {{ row.size | transformByte }}
        </template>
      </el-table-column>
      <el-table-column label="进度" align="center">
        <template v-slot="{ row }">
          <el-progress
            :percentage="row.percentage"
            color="#909399"
          ></el-progress>
        </template>
      </el-table-column>
    </el-table>
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
      chunkList: [],
    };
  },
  filters: {
    transformByte(val) {
      return Number((val / 1024).toFixed(0));
    }
  },
  methods: {
    handleFileChange(e) {
      const [file] = e.target.files;
      if (!file) return;
      this.file = file;
    },
    createProgressHandle(item) {
      return e => {
        item.percentage = parseInt((e.loaded / e.total) * 100);
      };
    },
    async handleUpload() {
      if (!this.file) return;
      const fileChunkList = createFileChunk(this.file, CHUNK_SIZE);

      this.chunkList = fileChunkList.map(({ chunk, hash }, index) => ({
        hash,
        index,
        size: chunk.size,
        percentage: 0,
      }));

      const requestList = fileChunkList.map(async ({ chunk, hash }, index) => {
        const formData = new FormData();

        formData.append('chunk', chunk);
        formData.append('hash', hash);
        formData.append('filename', this.file.name);

        return await post(
          'http://localhost:3000',
          formData,
          {},
          this.createProgressHandle(this.chunkList[index])
        );
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
