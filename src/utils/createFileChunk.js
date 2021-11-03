// 定义文件切块大小
// chrome 保存在内存中最大的尺寸是 10M，超出后无法显示
const CHUNK_SIZE = 2 * 1024 * 1024;

export default function createFileChunk(file, size = CHUNK_SIZE) {
  const fileChunkList = [];
  let cur = 0;
  let index = 0;

  while (cur < file.size) {
    // File 接口基于 Blob 接口，利于 Blob 接口的 slice 方法实现切片
    fileChunkList.push({
      chunk: file.slice(cur, cur + size),
      hash: file.name + '-' + index,
    });

    cur += size;
    index += 1;
  }

  return fileChunkList;
}
