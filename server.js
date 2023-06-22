const express = require("express");
const mime = require("mime");
const app = express();
const port = 3000;

app.use(
  express.static("public", {
    setHeaders: (res, filePath) => {
      const mimeType = mime.getType(filePath);
      if (mimeType) {
        res.setHeader("Content-Type", mimeType);
      }
    },
  })
);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
