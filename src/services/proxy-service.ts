import type net from "net";

import { Platform } from "obsidian"
import { fetchWithRequestUrl, requestToObject } from "#/lib/fetch";

// Shout out to https://github.com/luixaviles/cors-proxy-server-koa

export class ProxyService {
  private started = false;
  private address: string;
  private server?: net.Server;

  fetchWithRequestUrl = fetchWithRequestUrl;

  get isSupported() {
    return Platform.isDesktop
  }

  constructor() {
    this.address = "localhost";
  }

  async getProxiedUrl(proxyingTo: string): Promise<`http://${string}`> {
    if (!this.started) await this.start();

    return `http://${this.address}/${encodeURIComponent(proxyingTo)}`;
  }

  /** Function that starts the server */
  async start() {
    await this.stop();

    const { default: Koa } = await import("koa");
    const { default: cors } = await import("@koa/cors");
    const { default: proxy } = await import("koa-proxies");

    // Create a new Koa application
    const app = new Koa();

    app.use(
      cors({
        origin: "*",
        allowHeaders: "*",
        allowMethods: "*",
      })
    );

    // Create and apply the proxy middleware
    app.use(
      proxy("/:targetURL/", (_, ctx) => {
        const target = _.targetURL;
        console.log({ target, path: target + ctx.path });
        return {
          // Target URL
          target,
          rewrite(path) {
            return path.slice(`/${encodeURIComponent(target)}`.length);
          },
          changeOrigin: true,
        };
      })
    );

    this.server = app.listen();

    if (!this.server) throw "couldn't create proxy server";

    return new Promise((s, r) => {
      // Access the dynamically assigned port
      this.server?.once("listening", () => {
        const address = this.server?.address() as net.AddressInfo | null;
        this.address = `localhost:${address?.port}`;
        console.log("address", address);
        s(true);
      });

      this.started = true;
    });
  }

  /** Function that stops the server */
  async stop() {
    this.server?.close();
    this.started = false;
  }





  getFetch(corsBypass = false) {
    return async (urlOrrequest: RequestInfo, init?: RequestInit) => {
      let request = new Request(urlOrrequest, init);

      if (corsBypass) {
        if (this.isSupported) {
          const newURL = new URL(await this.getProxiedUrl(request.url));
          console.log({ newURL });
          request = new Request(newURL, await requestToObject(request));
          console.log("step 2222", request)
        } else {
          console.log("fallback to using requestUrl");
          return this.fetchWithRequestUrl(request);
        }
      }

      try {
        console.log("the request", { request })
        return await fetch(request);
      } catch (e: any) {
        console.log("FALLBACK: ", this.isSupported ? "proxied" : "requestUrl");
        if (this.isSupported) {
          const newURL = new URL(await this.getProxiedUrl(request.url));
          request = new Request(newURL, request);
          return await fetch(request);
        } else {
          return this.fetchWithRequestUrl(request);
        }
      }
    };
  }
}
