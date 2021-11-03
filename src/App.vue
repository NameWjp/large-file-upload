<template>
  <div id="app">
    <input type="file" @change="handleFileChange" />
    <el-button @click="handleUpload">上传</el-button>
  </div>
</template>

<script>
import createFileChunk from './utils/createFileChunk';
import { post } from './utils/request';

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
    handleUpload() {
      if (!this.file) return;
      const fileChunkList = createFileChunk(this.file);

      fileChunkList.map(({ chunk, hash }) => {
        const formData = new FormData();

        formData.append('chunk', chunk);
        formData.append('hash', hash);
        formData.append('filename', this.file.name);

        return formData;
      }).forEach(formData => {
        post('http://localhost:3000', formData);
      });
    }
  }
};
</script>

<style>
</style>
