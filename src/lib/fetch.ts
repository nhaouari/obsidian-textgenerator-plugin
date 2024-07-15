import { requestUrl, RequestUrlParam, RequestUrlResponse } from "obsidian"

// feel free to use this function in your obsidian plugin.
// Original: https://github.com/nhaouari/obsidian-textgenerator-plugin
// Credit: https://github.com/haouarihk

// Polyfill for fetch using requestUrl with simulated streaming
export async function fetchWithRequestUrl(input: RequestInfo, init?: RequestInit & { throw?: boolean }): Promise<Response> {
    const url = typeof input === 'string' ? input : input.url;

    let options = init as any;

    if (typeof input === "object") {
        options = {
            ...init,
            ...(input ? await requestToObject(input) : {}),
        }
    }


    const params: RequestUrlParam = {
        url,
        method: options?.method || 'GET',
        headers: options?.headers as Record<string, string>,
        body: options?.body as string | ArrayBuffer,
        throw: false,
    };

    if (options?.headers && (options.headers as any)['Content-Type']) {
        params.contentType = (options.headers as any)['Content-Type'];
    }

    console.log("requesting using requestUrl", { url, options, params });

    return requestUrl(params).then((response: RequestUrlResponse) => {
        const fetchResponse: Response = {
            ok: response.status >= 200 && response.status < 300,
            status: response.status,
            statusText: getStatusText(response.status),
            headers: new Headers(response.headers),
            url,
            type: 'basic',
            redirected: false,
            bodyUsed: false,

            arrayBuffer: () => Promise.resolve(response.arrayBuffer),
            blob: () => Promise.reject(new Error('Blob responses are not supported in this polyfill')),
            formData: () => Promise.reject(new Error('FormData responses are not supported in this polyfill')),
            json: () => Promise.resolve(response.json),
            text: () => Promise.resolve(response.text),
            clone: () => {
                throw new Error('Response cloning is not supported in this polyfill');
            },

            body: new ReadableStream({
                start(controller) {
                    // Simulate chunked data by splitting the response text
                    const chunkSize = 1024; // Size of each chunk in bytes
                    const text = response.text;
                    let offset = 0;

                    function pushChunk() {
                        if (offset < text.length) {
                            const chunk = text.slice(offset, offset + chunkSize);
                            controller.enqueue(new TextEncoder().encode(chunk));
                            offset += chunkSize;
                            setTimeout(pushChunk, 10); // Simulate delay between chunks
                        } else {
                            controller.close();
                        }
                    }

                    pushChunk();
                }
            })
        };


        console.log("response", { fetchResponse, response });

        if (!fetchResponse.ok && options?.throw !== false) {
            return Promise.reject(new Error(`HTTP error! status: ${response.status}`));
        }

        return fetchResponse;
    });
}

// Helper function to get status text
function getStatusText(status: number): string {
    const statusTexts: { [key: number]: string } = {
        200: 'OK',
        201: 'Created',
        204: 'No Content',
        400: 'Bad Request',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Not Found',
        500: 'Internal Server Error',
        // Add more status texts as needed
    };
    return statusTexts[status] || '';
}

export async function requestToObject(request: Request): Promise<Record<string, any>> {
    const obj: Record<string, any> = {
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers as any),
    };

    // Handle different content types
    const contentType = request.headers.get('content-type');
    if (contentType) {
        if (contentType.includes('application/json')) {
            obj.body = JSON.stringify(await request.json());
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
            obj.body = await request.formData();
        } else if (contentType.includes('multipart/form-data')) {
            obj.body = await request.formData();
        } else {
            obj.body = await request.text();
        }
    }

    return obj;
}