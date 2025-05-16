export default function Compressor(Syn) {
    const worker = Syn.WorkerCreation(`
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

    return class Compression {
        constructor() {
            this.files = {};
            this.tasks = [];
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

        // 估計壓縮耗時
        estimateCompression() {

            // 計算單個文件的估計壓縮時間(秒)
            const calculateFileTime = (fileSize) => {
                const baseBytesPerSecond = 30 * 1024 ** 2; // 估計每秒壓縮：30MB/s
                let fileTime = fileSize / baseBytesPerSecond;

                // 檔案大小調整因子(MB)
                const fileSizeMB = fileSize / (1024 * 1024);
                if (fileSizeMB > 10) {
                    // 較大的單個文件壓縮效率會降低
                    fileTime *= (1 + Math.log10(fileSizeMB / 10) * 0.15);
                }

                return fileTime;
            };

            // 計算曲線參數
            const calculateCurveParameter = (totalSizeMB) => {
                let param = 5; // 基準參數
                if (totalSizeMB > 50) {
                    const reduction = Math.min(Math.floor(totalSizeMB / 50) * 0.7, 3);
                    param = Math.max(5 - reduction, 1.5);
                }
                return param;
            };

            // 計算每個文件的壓縮時間並累加
            let totalEstimatedTime = 0;
            let totalSize = 0;

            Object.values(this.files).forEach(file => {
                totalEstimatedTime += calculateFileTime(file.length);
                totalSize += file.length;
            });

            // 根據總大小進行微調
            const totalSizeMB = totalSize / (1024 * 1024);

            // 文件數量調整因子
            const fileCount = Object.keys(this.files).length;
            if (fileCount > 5) { // 多文件壓縮有額外開銷
                totalEstimatedTime *= (1 + Math.min(fileCount / 100, 0.2));
            }

            // 總大小調整因子
            if (totalSizeMB > 50) {
                const intervals = Math.floor(totalSizeMB / 50);
                totalEstimatedTime *= (1 + intervals * 0.08); // 輕微調整，因為已經在單文件層面考慮了大小
            }

            // 計算進度曲線參數
            const curveParameter = calculateCurveParameter(totalSizeMB);

            return {
                estimatedInMs: totalEstimatedTime * 1000,
                progressCurve: (ratio) => 100 * (1 - Math.exp(-curveParameter * ratio)) / (1 - Math.exp(-curveParameter))
            };
        }

        // 生成壓縮
        async generateZip(options = {}, progressCallback) {
            await Promise.all(this.tasks); // 等待所有檔案加入

            const startTime = performance.now();

            const updateInterval = 30; // 更新頻率
            const estimationData = this.estimateCompression();
            const totalTime = estimationData.estimatedInMs;

            // 假進度模擬, 檔案越大誤差越大
            const progressInterval = setInterval(() => {
                const elapsedTime = performance.now() - startTime;
                const ratio = Math.min(elapsedTime / totalTime, 0.99); // 限制在99%以內
                const fakeProgress = estimationData.progressCurve(ratio);

                if (progressCallback) progressCallback(fakeProgress);

                if (ratio >= 0.99) {
                    clearInterval(progressInterval);
                }
            }, updateInterval);

            return new Promise((resolve, reject) => {
                if (Object.keys(this.files).length === 0) return reject("Empty Data Error");

                worker.postMessage({
                    files: this.files,
                    level: options.level || 5
                }, Object.values(this.files).map(buf => buf.buffer));

                worker.onmessage = (e) => {
                    clearInterval(progressInterval);
                    if (progressCallback) progressCallback(100);

                    const { error, data } = e.data;
                    error ? reject(error) : resolve(new Blob([data], { type: "application/zip" }));
                };
            })
        }
    }
}