
import https from "https";
import { URL } from "url";
import { TranslationError, TranslationErrorCode } from "@/core/translator/errors";
import { AdapterConfig } from "@/core/translator/types";

/**
 * 基础适配器抽象类
 * 实现了通用的 HTTP 请求、重试机制和限流功能
 */
export abstract class BaseAdapter {
    /** 静态属性：记录每个主机名的最后请求时间，用于限流 */
    private static lastRequestTimes: Map<string, number> = new Map();

    /**
     * 构造函数
     * @param config 适配器配置
     */
    constructor(protected config: AdapterConfig) { }

    /**
     * 发送 POST 请求
     * @param fullUrl 完整请求 URL
     * @param body 请求体数据
     * @param headers 自定义请求头
     * @returns 响应数据 Promise
     * @throws {TranslationError} 当请求失败或超时时抛出
     */
    protected async post<T>(fullUrl: string, body: any, headers: Record<string, string> = {}): Promise<T> {
        // 限流检查
        await this.checkRateLimit(fullUrl);

        // 重试逻辑
        let lastError: Error | null = null;
        const maxRetries = this.config.maxRetries ?? 3;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    // 指数退避: 200ms, 400ms, 800ms...
                    const delay = 200 * Math.pow(2, attempt - 1);
                    await new Promise(r => setTimeout(r, delay));
                }
                return await this.doRequest<T>(fullUrl, body, headers);
            } catch (err: any) {
                lastError = err;
                // 仅对网络错误或 5xx 状态码进行重试
                if (err instanceof TranslationError) {
                    if (err.code === TranslationErrorCode.NETWORK_ERROR ||
                        err.code === TranslationErrorCode.NETWORK_TIMEOUT) {
                        continue;
                    }
                    // 检查 HTTP 状态码是否为 5xx
                    if (err.message.includes("HTTP Error 5")) {
                        continue;
                    }
                }
                throw err; // 不可重试的错误
            }
        }
        throw lastError || new TranslationError("重试多次后请求失败", TranslationErrorCode.NETWORK_ERROR);
    }

    /**
     * 检查并执行限流策略
     * @param urlStr 请求 URL 字符串
     */
    private async checkRateLimit(urlStr: string): Promise<void> {
        const qps = this.config.qps ?? 5; // 默认为 5 QPS 以保证稳定性
        const interval = 1000 / qps;

        let hostname = "unknown";
        try {
            hostname = new URL(urlStr).hostname;
        } catch {
            // 忽略 URL 解析错误
        }

        const now = Date.now();
        const lastTime = BaseAdapter.lastRequestTimes.get(hostname) || 0;
        const timeSinceLast = now - lastTime;

        if (timeSinceLast < interval) {
            const waitTime = interval - timeSinceLast;
            // 将时间更新为未来的"完成"时间（即开始请求的时间）
            BaseAdapter.lastRequestTimes.set(hostname, now + waitTime);
            await new Promise(r => setTimeout(r, waitTime));
        } else {
            BaseAdapter.lastRequestTimes.set(hostname, now);
        }
    }

    /**
     * 执行底层 HTTP 请求
     * @param fullUrl 完整 URL
     * @param body 请求体
     * @param headers 请求头
     * @returns 响应 Promise
     */
    private doRequest<T>(fullUrl: string, body: any, headers: Record<string, string>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            let urlObj: URL;
            try {
                urlObj = new URL(fullUrl);
            } catch (e) {
                return reject(new TranslationError(`无效的 URL: ${fullUrl}`, TranslationErrorCode.VALIDATION_ERROR));
            }

            const payload = JSON.stringify(body);
            const headersToSend: Record<string, string> = {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(payload).toString(),
                ...headers
            };

            if (this.config.customApiKey) {
                headersToSend["x-custom-api-key"] = this.config.customApiKey;
            }

            const requestOptions: https.RequestOptions = {
                method: "POST",
                hostname: urlObj.hostname,
                path: `${urlObj.pathname}${urlObj.search}`,
                port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
                headers: headersToSend,
                timeout: this.config.timeout // 如果配置了超时，则应用
            };

            const req = https.request(requestOptions, (res) => {
                const chunks: Buffer[] = [];
                res.on("data", (d) => chunks.push(d));
                res.on("end", () => {
                    const raw = Buffer.concat(chunks).toString("utf-8");
                    if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
                        return reject(new TranslationError(
                            `HTTP 错误 ${res.statusCode}: ${raw}`,
                            TranslationErrorCode.NETWORK_ERROR
                        ));
                    }
                    try {
                        const json = JSON.parse(raw);
                        resolve(json);
                    } catch (e) {
                        reject(new TranslationError(
                            "响应解析失败",
                            TranslationErrorCode.VENDOR_ERROR,
                            e
                        ));
                    }
                });
            });

            req.on("error", (err) => {
                reject(new TranslationError(
                    err.message,
                    TranslationErrorCode.NETWORK_ERROR,
                    err
                ));
            });

            req.on("timeout", () => {
                req.destroy();
                reject(new TranslationError(
                    "请求超时",
                    TranslationErrorCode.NETWORK_TIMEOUT
                ));
            });

            req.write(payload);
            req.end();
        });
    }
}
