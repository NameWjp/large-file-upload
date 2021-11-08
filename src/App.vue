<template>
  <div id="app">
    <div class="top">
      <input type="file" @change="handleFileChange" />
      <el-button @click="handleUpload">上传</el-button>
      <el-button type="danger" @click="handleClear">清空</el-button>
    </div>
    <div>
      <div>计算文件 hash</div>
      <el-progress :percentage="hashPercentage"></el-progress>
      <div>总进度</div>
      <el-progress :percentage="uploadPercentage"></el-progress>
    </div>
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
      container: {
        file: null,
        hash: null,
        worker: null,
      },
      hashPercentage: 0,
      chunkList: [],
    };
  },
  computed: {
    uploadPercentage() {
      if (!this.container.file || !this.chunkList.length) return 0;
      const loaded = this.chunkList
        .map(chunk => chunk.size * (chunk.percentage / 100))
        .reduce((total, cur) => total + cur, 0);
      return parseInt((loaded / this.container.file.size) * 100);
    }
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
      this.container.file = file;
    },
    createProgressHandle(item) {
      return e => {
        item.percentage = parseInt((e.loaded / e.total) * 100);
      };
    },
    // 通过 web-worker 计算 hash
    calculateHash(fileChunkList) {
      return new Promise(resolve => {
        this.container.worker = new Worker("/hash.js");
        this.container.worker.postMessage({ fileChunkList });
        this.container.worker.onmessage = e => {
          const { percentage, hash } = e.data;
          this.hashPercentage = percentage;
          if (hash) {
            resolve(hash);
          }
        };
      });
    },
    async handleUpload() {
      if (!this.container.file) return;

      const fileChunkList = createFileChunk(this.container.file, CHUNK_SIZE);
      const fileHash = await this.calculateHash(fileChunkList);

      this.chunkList = fileChunkList.map(({ chunk, index }) => ({
        hash: `${fileHash}-${index}`,
        index,
        size: chunk.size,
        percentage: 0,
        chunk,
      }));
      this.container.hash = fileHash;

      const requestList = this.chunkList.map(async ({ chunk, hash, index }) => {
        const formData = new FormData();

        formData.append('chunk', chunk);
        formData.append('hash', hash);
        formData.append('fileHash', this.container.hash);

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
        filename: this.container.file.name,
        fileHash: this.container.hash,
      });
    },
    handleClear() {
      post('http://localhost:3000/clear');
    }
  }
};
</script>

<style>
#app {
  padding: 20px;
}
.top {
  text-align: center;
  margin: 20px 0;
}
</style>
