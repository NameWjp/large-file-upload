const multiparty = require('multiparty');
const path = require('path');
const fse = require('fs-extra');

const UPLOAD_DIR = path.resolve(__dirname, "..", "target");

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

      const filename = fields.filename[0];
      const hash = fields.hash[0];
      const chunk = files.chunk[0];
      const chunkDir = path.resolve(UPLOAD_DIR, filename);
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
};
