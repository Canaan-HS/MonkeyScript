export function Compressor(WorkerCreation) {

    class Compression {
        constructor() {
            this.files = {};
            this.tasks = [];
            this.worker = WorkerCreation(`
                importScripts('https://cdn.jsdelivr.net/npm/fflate@0.8.2/umd/index.min.js');
                onmessage = function(e) {
                    const { files, level } = e.data;
                    try {
                        const zipped = fflate.zipSync(files, { level });
                        postMessage({ data: zipped }, [zipped.buffer]);
                    } catch (err) {
                        postMessage({ error: err.message });
                    }
                }
            `);
        }

        // 存入 blob 進行壓縮
        async file(name, blob) {
            const task = new Promise(async resolve => {
                const buffer = await blob.arrayBuffer();
                this.files[name] = new Uint8Array(buffer);
                resolve();
            });

            this.tasks.push(task);
            return task;
        }

        // 估算壓縮耗時
        estimateCompressionTime() {
            let totalSize = 0;

            Object.values(this.files).forEach(file => {
                totalSize += file.length;
            });

            const bytesPerSecond = 60 * 1024 ** 2; // 預估每秒壓縮 60MB/s
            const estimatedTime = totalSize / bytesPerSecond;
            return estimatedTime;
        }

        // 生成壓縮
        async generateZip(options = {}, progressCallback) {
            const updateInterval = 30; // 更新頻率
            const totalTime = this.estimateCompressionTime();
            const progressUpdate = 100 / (totalTime * 1000 / updateInterval); // 每次更新的進度

            let fakeProgress = 0; // 假進度模擬
            const progressInterval = setInterval(() => {
                if (fakeProgress < 99.99) {
                    fakeProgress = Math.min(fakeProgress + progressUpdate, 99.99);
                    if (progressCallback) progressCallback(fakeProgress);
                } else {
                    clearInterval(progressInterval);
                }
            }, updateInterval);

            await Promise.all(this.tasks); // 等待所有檔案加入
            return new Promise((resolve, reject) => {
                if (Object.keys(this.files).length === 0) return reject("Empty Data Error");

                this.worker.postMessage({
                    files: this.files,
                    level: options.level || 5 
                }, Object.values(this.files).map(buf => buf.buffer));

                this.worker.onmessage = (e) => {
                    clearInterval(progressInterval);
                    const { error, data } = e.data;
                    error ? reject(error) : resolve(new Blob([data], { type: "application/zip" }));
                };
            })
        }
    };

    return Compression;
}