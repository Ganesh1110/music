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
    this.testTimeout = options.testTimeout || 5000;

    // Start auto-refresh
    if (options.autoRefresh) {
      this.startAutoRefresh();
    }
  }

  /**
   * Fetch free proxies from multiple sources
   */
  async fetchFreeProxies() {
    console.log("🔄 Fetching fresh proxy list...");
    const allProxies = [];

    try {
      // Source 1: free-proxy-list.net
      const proxies1 = await this.fetchFromFreeProxyList();
      allProxies.push(...proxies1);
      console.log(`✅ Got ${proxies1.length} proxies from free-proxy-list.net`);
    } catch (error) {
      console.warn(
        "⚠️ Failed to fetch from free-proxy-list.net:",
        error.message
      );
    }

    try {
      // Source 2: sslproxies.org
      const proxies2 = await this.fetchFromSSLProxies();
      allProxies.push(...proxies2);
      console.log(`✅ Got ${proxies2.length} proxies from sslproxies.org`);
    } catch (error) {
      console.warn("⚠️ Failed to fetch from sslproxies.org:", error.message);
    }

    try {
      // Source 3: proxy-list.download
      const proxies3 = await this.fetchFromProxyListDownload();
      allProxies.push(...proxies3);
      console.log(`✅ Got ${proxies3.length} proxies from proxy-list.download`);
    } catch (error) {
      console.warn(
        "⚠️ Failed to fetch from proxy-list.download:",
        error.message
      );
    }

    // Remove duplicates
    const uniqueProxies = this.removeDuplicates(allProxies);
    console.log(`📊 Total unique proxies: ${uniqueProxies.length}`);

    return uniqueProxies;
  }

  /**
   * Fetch from free-proxy-list.net
   */
  async fetchFromFreeProxyList() {
    const url = "https://free-proxy-list.net/";
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
      if (cols.length >= 7) {
        const ip = $(cols[0]).text().trim();
        const port = $(cols[1]).text().trim();
        const https = $(cols[6]).text().trim().toLowerCase();

        if (ip && port && https === "yes") {
          proxies.push({
            host: ip,
            port: parseInt(port),
            protocol: "https",
            source: "free-proxy-list.net",
          });
        }
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
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    const proxies = [];
    const lines = response.data.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && trimmed.includes(":")) {
        const [ip, port] = trimmed.split(":");
        if (ip && port) {
          proxies.push({
            host: ip.trim(),
            port: parseInt(port.trim()),
            protocol: "https",
            source: "proxy-list.download",
          });
        }
      }
    }

    return proxies;
  }

  /**
   * Remove duplicate proxies
   */
  removeDuplicates(proxies) {
    const seen = new Set();
    return proxies.filter((proxy) => {
      const key = `${proxy.host}:${proxy.port}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Test if a proxy is working
   */
  async testProxy(proxy, testUrl = "https://www.google.com") {
    const proxyUrl = `${proxy.protocol}://${proxy.host}:${proxy.port}`;
    const agent = new HttpsProxyAgent(proxyUrl);

    try {
      const response = await axios.get(testUrl, {
        httpsAgent: agent,
        timeout: this.testTimeout,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Test and validate all proxies
   */
  async validateProxies(proxies, maxConcurrent = 10) {
    console.log(`🔍 Testing ${proxies.length} proxies...`);
    const validProxies = [];

    // Test in batches
    for (let i = 0; i < proxies.length; i += maxConcurrent) {
      const batch = proxies.slice(i, i + maxConcurrent);

      const results = await Promise.allSettled(
        batch.map((proxy) => this.testProxy(proxy))
      );

      results.forEach((result, index) => {
        if (result.status === "fulfilled" && result.value === true) {
          validProxies.push(batch[index]);
        }
      });

      console.log(
        `📊 Tested ${Math.min(i + maxConcurrent, proxies.length)}/${
          proxies.length
        } proxies...`
      );
    }

    console.log(`✅ ${validProxies.length} working proxies found`);
    return validProxies;
  }

  /**
   * Initialize proxy list
   */
  async initialize(validateAll = false) {
    try {
      // Fetch proxies from multiple sources
      const fetchedProxies = await this.fetchFreeProxies();

      if (fetchedProxies.length === 0) {
        console.warn("⚠️ No proxies fetched, using fallback list");
        this.proxies = this.getFallbackProxies();
        return;
      }

      if (validateAll) {
        // Test all proxies (slower but more reliable)
        this.proxies = await this.validateProxies(fetchedProxies);
      } else {
        // Quick test: only validate a sample
        const sample = fetchedProxies.slice(0, 50);
        const validSample = await this.validateProxies(sample, 20);

        // Use validated sample + rest of proxies
        this.proxies = [...validSample, ...fetchedProxies.slice(50)];
      }

      if (this.proxies.length === 0) {
        console.warn("⚠️ All proxies failed, using fallback list");
        this.proxies = this.getFallbackProxies();
      }

      console.log(
        `✅ Proxy manager initialized with ${this.proxies.length} proxies`
      );
    } catch (error) {
      console.error("❌ Proxy initialization failed:", error.message);
      this.proxies = this.getFallbackProxies();
    }
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
    if (this.proxies.length === 0) {
      return null;
    }

    // Try to find a working proxy
    let attempts = 0;
    while (attempts < this.proxies.length) {
      const proxy = this.proxies[this.currentIndex];
      this.currentIndex = (this.currentIndex + 1) % this.proxies.length;

      const proxyKey = `${proxy.host}:${proxy.port}`;

      // Skip if marked as failed
      if (this.failedProxies.has(proxyKey)) {
        attempts++;
        continue;
      }

      return proxy;
    }

    // All proxies failed, reset and try again
    console.warn("⚠️ All proxies exhausted, resetting failed list");
    this.failedProxies.clear();
    return this.proxies[0];
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
