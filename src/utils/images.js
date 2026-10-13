export function chooseImageData() {
  return new Promise((resolve, reject) =>
    uni.chooseImage({
      count: 1,
      sizeType: ["compressed"],
      success: async (result) => {
        try {
          // #ifdef H5
          const blob = await (await fetch(result.tempFilePaths[0])).blob();
          if (blob.size > 3 * 1024 * 1024) throw new Error("图片请小于3MB");
          if (!["image/png", "image/jpeg", "image/webp"].includes(blob.type))
            throw new Error("请选择PNG、JPG或WebP图片");
          const data = await new Promise((done) => {
            const reader = new FileReader();
            reader.onload = () => done(reader.result);
            reader.onerror = () => reject(new Error("图片读取失败"));
            reader.readAsDataURL(blob);
          });
          resolve(data);
          // #endif
          // #ifndef H5
          uni
            .getFileSystemManager()
            .readFile({
              filePath: result.tempFilePaths[0],
              encoding: "base64",
              success: (r) => resolve("data:image/jpeg;base64," + r.data),
              fail: () => reject(new Error("图片读取失败")),
            });
          // #endif
        } catch (e) {
          reject(e);
        }
      },
      fail: () => reject(new Error("未选择图片")),
    }),
  );
}
