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

            const IO_THRESHOLD = 50 * 1024 * 1024; // 50MB，IO密集型任務的閾值
            const UNCOMPRESSIBLE_EXTENSIONS = new Set([
                '.mp4', '.mov', '.avi', '.mkv', '.zip', '.rar',
                '.jpg', '.jpeg', '.png', '.gif', '.webp'
            ]);

            // 為不同任務類型設定不同的基礎速度
            const IO_BYTES_PER_SECOND = 100 * 1024 * 1024; // 假設為 100MB/s 的內存吞吐率
            const CPU_BYTES_PER_SECOND = 25 * 1024 * 1024; // 假設為 25MB/s 的基礎壓縮速度

            let totalEstimatedTime = 0;
            let totalSize = 0;

            Object.entries(this.files).forEach(([name, file]) => {
                const fileSize = file.length;
                totalSize += fileSize;
                const extension = ('.' + name.split('.').pop()).toLowerCase();

                // 判斷任務類型
                if (fileSize > IO_THRESHOLD && UNCOMPRESSIBLE_EXTENSIONS.has(extension)) {
                    // I/O 密集型任務
                    totalEstimatedTime += fileSize / IO_BYTES_PER_SECOND;
                } else {
                    // CPU 密集型任務
                    let cpuTime = fileSize / CPU_BYTES_PER_SECOND;

                    // 對於 CPU 任務，可以保留一些基於大小的微調
                    const fileSizeMB = fileSize / (1024 * 1024);
                    if (fileSizeMB > 10) {
                        cpuTime *= (1 + Math.log10(fileSizeMB / 10) * 0.1);
                    }
                    totalEstimatedTime += cpuTime;
                }
            });

            // 檔案數量的影響 (少量檔案的固定開銷)
            const fileCount = Object.keys(this.files).length;
            if (fileCount > 1) {
                totalEstimatedTime += fileCount * 0.01; // 為每個額外檔案增加 10ms 的基礎開銷
            }

            // 總大小的影響 (輕微)
            const totalSizeMB = totalSize / (1024 * 1024);
            if (totalSizeMB > 100) {
                totalEstimatedTime *= (1 + Math.log10(totalSizeMB / 100) * 0.05);
            }

            // 進度條視覺平滑化 (這部分不影響總時長預測，純粹是UI體驗)
            const calculateCurveParameter = (totalSizeMB) => {
                if (totalSizeMB < 50) return 5;
                if (totalSizeMB < 500) return 4;
                return 3;
            };
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