import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import * as cheerio from "cheerio";

class ProxyManager {
  constructor(options = {}) {
    this.proxies = [];
    this.currentIndex = 0;
    this.failedProxies = new Set();
    this.proxyStats = new Map();
    this.autoRefreshInterval = options.autoRefreshInterval || 3600000; // 1 hour
    this.maxFailures = options.maxFailures || 3;
    this.testTimeout = options.testTimeout || 3000;

    // Start auto-refresh
    if (options.autoRefresh) {
      this.startAutoRefresh();
    }
  }

  /**
   * Fetch free proxies from multiple sources
   */
  async fetchFreeProxies() {
    console.log("🔄 Fetching proxies from online sources...");
    const allProxies = [];

    try {
      const proxies1 = await this.fetchFromProxyListDownload();
      allProxies.push(...proxies1);
      console.log(`✅ Got ${proxies1.length} from proxy-list.download`);
    } catch (err) {
      console.warn("⚠️ proxy-list.download failed:", err.message);
    }

    try {
      const proxies2 = await this.fetchFromFreeProxyList();
      allProxies.push(...proxies2);
      console.log(`✅ Got ${proxies2.length} from free-proxy-list.net`);
    } catch (err) {
      console.warn("⚠️ free-proxy-list.net failed:", err.message);
    }

    const unique = this.removeDuplicates(allProxies);
    console.log(`📊 Total unique proxies: ${unique.length}`);
    return unique;
  }

  /**
   * Fetch from free-proxy-list.net
   */
  async fetchFromFreeProxyList() {
    const url = "https://free-proxy-list.net/";
    const res = await axios.get(url, {
      timeout: 10000,
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const $ = cheerio.load(res.data);
    const proxies = [];

    $("table.table tbody tr").each((_, row) => {
      const cols = $(row).find("td");
      if (cols.length >= 7) {
        const ip = $(cols[0]).text().trim();
        const port = $(cols[1]).text().trim();
        const https = $(cols[6]).text().trim().toLowerCase();
        if (https === "yes")
          proxies.push({
            host: ip,
            port: parseInt(port),
            protocol: "https",
            source: "free-proxy-list.net",
          });
      }
    });

    return proxies;
  }

  /**
   * Fetch from sslproxies.org
   */
  async fetchFromSSLProxies() {
    const url = "https://www.sslproxies.org/";
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    const $ = cheerio.load(response.data);
    const proxies = [];

    $("table.table tbody tr").each((i, row) => {
      const cols = $(row).find("td");
      if (cols.length >= 2) {
        const ip = $(cols[0]).text().trim();
        const port = $(cols[1]).text().trim();

        if (ip && port) {
          proxies.push({
            host: ip,
            port: parseInt(port),
            protocol: "https",
            source: "sslproxies.org",
          });
        }
      }
    });

    return proxies;
  }

  /**
   * Fetch from proxy-list.download
   */
  async fetchFromProxyListDownload() {
    const url = "https://www.proxy-list.download/api/v1/get?type=https";
    const res = await axios.get(url, {
      timeout: 10000,
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    return res.data
      .split("\n")
      .filter((line) => line.includes(":"))
      .map((line) => {
        const [ip, port] = line.trim().split(":");
        return {
          host: ip,
          port: parseInt(port),
          protocol: "https",
          source: "proxy-list.download",
        };
      });
  }

  /**
   * Remove duplicate proxies
   */
  removeDuplicates(list) {
    const seen = new Set();
    return list.filter((p) => {
      const key = `${p.host}:${p.port}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /** ✅ Local static proxy pool */
  getStaticProxies() {
    return [
      "41.34.67.171:8080",
      "103.140.122.138:8080",
      "103.214.202.46:8080",
      "103.135.133.182:8080",
      "103.144.193.66:8080",
      "103.240.240.123:8080",
      "103.28.249.11:8080",
      "103.5.254.120:8080",
      "103.122.35.145:3128",
      "103.9.50.154:8080",
      "159.223.63.244:3128",
      "103.52.111.178:8080",
      "103.95.248.126:8080",
      "103.154.215.251:8080",
      "103.194.51.126:8080",
      "103.25.139.250:8080",
      "103.54.34.76:8080",
      "103.222.6.218:8080",
      "103.161.146.183:8080",
      "103.194.202.242:8080",
    ].map((p) => {
      const [host, port] = p.split(":");
      return { host, port: parseInt(port), protocol: "http", source: "static" };
    });
  }

  /**
   * Test if a proxy is working
   */
  async testProxy(proxy, testUrl = "https://www.google.com") {
    const proxyUrl = `${proxy.protocol}://${proxy.host}:${proxy.port}`;
    const agent = new HttpsProxyAgent(proxyUrl);

    try {
      const res = await axios.get(testUrl, {
        httpsAgent: agent,
        timeout: this.testTimeout,
        headers: { "User-Agent": "Mozilla/5.0" },
        validateStatus: () => true,
      });
      return res.status === 200;
    } catch (err) {
      if (
        err.code === "ECONNRESET" ||
        err.code === "ETIMEDOUT" ||
        err.message.includes("TLS") ||
        err.message.includes("socket")
      ) {
        return false;
      }
      return false;
    }
  }

  /**
   * Test and validate all proxies
   */
  async validateProxies(proxies, maxConcurrent = 10) {
    console.log(`🔍 Validating ${proxies.length} proxies...`);
    const working = [];

    for (let i = 0; i < proxies.length; i += maxConcurrent) {
      const batch = proxies.slice(i, i + maxConcurrent);
      const results = await Promise.allSettled(
        batch.map((p) => this.testProxy(p))
      );

      results.forEach((r, j) => {
        if (r.status === "fulfilled" && r.value) working.push(batch[j]);
      });

      console.log(
        `📊 Checked ${Math.min(i + maxConcurrent, proxies.length)} / ${
          proxies.length
        }`
      );
      await new Promise((r) => setTimeout(r, 200)); // small delay
    }

    console.log(`✅ ${working.length} working proxies found`);
    return working;
  }

  /**
   * Initialize proxy list
   */
  async initialize(validateAll = false) {
    console.log("🚀 Initializing ProxyManager...");

    let allProxies = [...this.getStaticProxies()];
    try {
      const fetched = await this.fetchFreeProxies();
      if (fetched.length > 0) allProxies.push(...fetched);
    } catch {
      console.warn("⚠️ Using static list only (fetch failed)");
    }

    const unique = this.removeDuplicates(allProxies);
    const sample = unique.slice(0, 10);
    const valid = sample;

    this.proxies = valid.length > 0 ? valid : this.getStaticProxies();

    console.log(`✅ ProxyManager ready with ${this.proxies.length} proxies`);
  }

  /**
   * Fallback proxy list
   */
  getFallbackProxies() {
    return [
      { host: "8.219.97.248", port: 80, protocol: "http", source: "fallback" },
      { host: "20.111.54.16", port: 80, protocol: "http", source: "fallback" },
      { host: "47.91.45.235", port: 80, protocol: "http", source: "fallback" },
      { host: "43.134.234.74", port: 80, protocol: "http", source: "fallback" },
      {
        host: "138.197.148.215",
        port: 80,
        protocol: "http",
        source: "fallback",
      },
    ];
  }

  /**
   * Get next working proxy
   */
  getNextProxy() {
    if (!this.proxies.length) return null;
    const proxy = this.proxies[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
    return proxy;
  }

  /**
   * Mark proxy as failed
   */
  markProxyFailed(proxy) {
    const proxyKey = `${proxy.host}:${proxy.port}`;

    if (!this.proxyStats.has(proxyKey)) {
      this.proxyStats.set(proxyKey, { failures: 0, successes: 0 });
    }

    const stats = this.proxyStats.get(proxyKey);
    stats.failures++;

    if (stats.failures >= this.maxFailures) {
      this.failedProxies.add(proxyKey);
      console.warn(
        `⚠️ Proxy ${proxyKey} marked as failed (${stats.failures} failures)`
      );
    }
  }

  /**
   * Mark proxy as successful
   */
  markProxySuccess(proxy) {
    const proxyKey = `${proxy.host}:${proxy.port}`;

    if (!this.proxyStats.has(proxyKey)) {
      this.proxyStats.set(proxyKey, { failures: 0, successes: 0 });
    }

    const stats = this.proxyStats.get(proxyKey);
    stats.successes++;

    // Reset failure count on success
    if (this.failedProxies.has(proxyKey) && stats.successes >= 3) {
      this.failedProxies.delete(proxyKey);
      console.log(
        `✅ Proxy ${proxyKey} restored (${stats.successes} successes)`
      );
    }
  }

  /**
   * Get proxy agent for axios
   */
  getProxyAgent(proxy) {
    if (!proxy) return null;

    const proxyUrl = `${proxy.protocol}://${proxy.host}:${proxy.port}`;
    return new HttpsProxyAgent(proxyUrl);
  }

  /**
   * Get proxy statistics
   */
  getStats() {
    const stats = {
      total: this.proxies.length,
      failed: this.failedProxies.size,
      working: this.proxies.length - this.failedProxies.size,
      proxies: [],
    };

    for (const [key, data] of this.proxyStats.entries()) {
      stats.proxies.push({
        proxy: key,
        ...data,
        status: this.failedProxies.has(key) ? "failed" : "working",
      });
    }

    return stats;
  }

  /**
   * Start auto-refresh
   */
  startAutoRefresh() {
    setInterval(async () => {
      console.log("🔄 Auto-refreshing proxy list...");
      await this.initialize(false);
    }, this.autoRefreshInterval);
  }

  /**
   * Refresh proxy list manually
   */
  async refresh() {
    await this.initialize(true);
  }
}

export default ProxyManager;
