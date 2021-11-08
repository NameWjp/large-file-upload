const multiparty = require('multiparty');
const path = require('path');
const fse = require('fs-extra');

const UPLOAD_DIR = path.resolve(__dirname, "..", "target");

const resolvePost = req => {
  return new Promise(resolve => {
    let chunk = "";
    req.on("data", data => {
      chunk += data;
    });
    req.on("end", () => {
      resolve(JSON.parse(chunk));
    });
  });
};

const pipeStream = (path, writeStream) => {
  return new Promise(resolve => {
    const readStream = fse.createReadStream(path);
    readStream.on('end', () => {
      resolve();
    });
    readStream.pipe(writeStream);
  });
};

const mergeFileChunk = async (filename, fileHash, size) => {
  const chunkDir = path.resolve(UPLOAD_DIR, fileHash);
  const chunkPaths = await fse.readdir(chunkDir);
  const filePath = path.resolve(UPLOAD_DIR, filename);
  // 升序排列文件
  chunkPaths.sort((a, b) => a.split('-')[1] - b.split('-')[1]);
  // 生成合并文件
  await Promise.all(
    chunkPaths.map(async (chunkPath, index) => {
      const readPath = path.resolve(chunkDir, chunkPath);
      const writeStream = fse.createWriteStream(filePath, {
        start: index * size,
        end: (index + 1) * size
      });

      await pipeStream(readPath, writeStream);
      // 传输完成删除文件
      fse.unlinkSync(readPath);
    })
  );
  // 删除文件夹
  fse.rmdirSync(chunkDir);
};

module.exports = class {
  // 处理切片
  async handleFormData(req, res) {
    const form = new multiparty.Form();

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error(err);
        res.status = 500;
        res.end("文件上传失败");
        return;
      }

      const fileHash = fields.fileHash[0];
      const hash = fields.hash[0];
      const chunk = files.chunk[0];
      const chunkDir = path.resolve(UPLOAD_DIR, fileHash);
      const filePath = `${chunkDir}/${hash}`;

      if (!fse.existsSync(chunkDir)) {
        await fse.mkdir(chunkDir);
      }

      if (fse.existsSync(filePath)) {
        res.end("文件已经存在");
        return;
      }

      await fse.move(chunk.path, filePath);

      res.end("文件上传成功");
    });
  }

  async handleMerge(req, res) {
    const data = await resolvePost(req);
    const { filename, fileHash, size } = data;
    await mergeFileChunk(filename, fileHash, size);
    res.end("文件合并成功");
  }

  async handleClear(req, res) {
    fse.emptyDirSync(UPLOAD_DIR);
    res.end("清除成功");
  }
};
