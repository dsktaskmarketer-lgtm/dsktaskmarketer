/**
 * DSK TaskMarketer Traffic & Session Optimizer
 * 
 * Manages client-side traffic efficiency, prevents unnecessary polling,
 * pauses background operations when the page or tab is inactive/idle,
 * deduplicates in-flight API requests, and ensures clean cleanup
 * without altering Supabase Authentication or forcing unwanted logouts.
 */

type ListenerCallback = (isActive: boolean) => void;

class TrafficOptimizer {
  private isVisible: boolean = typeof document !== 'undefined' ? !document.hidden : true;
  private isIdle: boolean = false;
  private lastActivity: number = Date.now();
  private idleTimeoutMs: number = 5 * 60 * 1000; // 5 minutes inactivity threshold
  private idleCheckInterval: any = null;
  private listeners: Set<ListenerCallback> = new Set();
  private inFlightRequests: Map<string, Promise<any>> = new Map();
  private responseCache: Map<string, { data: any; expiry: number }> = new Map();

  constructor() {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      this.initVisibilityListener();
      this.initActivityListeners();
    }
  }

  private initVisibilityListener() {
    document.addEventListener('visibilitychange', () => {
      const previouslyActive = this.isActive();
      this.isVisible = !document.hidden;
      const currentlyActive = this.isActive();

      if (previouslyActive !== currentlyActive) {
        this.notifyListeners(currentlyActive);
      }
    });

    // Clean up on page unload
    window.addEventListener('pagehide', () => {
      this.isVisible = false;
      this.notifyListeners(false);
      this.clearAllPending();
    });
  }

  private initActivityListeners() {
    const onActivity = () => {
      this.lastActivity = Date.now();
      if (this.isIdle) {
        this.isIdle = false;
        if (this.isVisible) {
          this.notifyListeners(true);
        }
      }
    };

    // Passive, non-blocking activity listeners
    const options = { passive: true };
    window.addEventListener('pointerdown', onActivity, options);
    window.addEventListener('keydown', onActivity, options);
    window.addEventListener('touchstart', onActivity, options);
    window.addEventListener('scroll', onActivity, options);

    // Check for idle state periodically without creating heavy CPU load
    this.idleCheckInterval = setInterval(() => {
      if (!this.isIdle && Date.now() - this.lastActivity > this.idleTimeoutMs) {
        this.isIdle = true;
        this.notifyListeners(false);
      }
    }, 60000);
  }

  /**
   * Returns true only when the document is currently visible and user is not idle.
   */
  public isActive(): boolean {
    return this.isVisible && !this.isIdle;
  }

  /**
   * Subscribe to active/pause state changes.
   * Useful for components to pause/resume requests or intervals.
   */
  public subscribe(callback: ListenerCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(active: boolean) {
    this.listeners.forEach((fn) => {
      try {
        fn(active);
      } catch (err) {
        console.warn('[TrafficOptimizer] Error in listener callback:', err);
      }
    });
  }

  /**
   * Deduplicates concurrent in-flight GET requests and provides optional short TTL in-memory caching.
   */
  public async deduplicateRequest<T>(
    cacheKey: string,
    fetcher: () => Promise<T>,
    ttlMs: number = 0
  ): Promise<T> {
    const now = Date.now();

    // Check valid cache entry if TTL > 0
    if (ttlMs > 0) {
      const cached = this.responseCache.get(cacheKey);
      if (cached && cached.expiry > now) {
        return cached.data as T;
      }
    }

    // Check if identical request is currently in-flight
    if (this.inFlightRequests.has(cacheKey)) {
      return this.inFlightRequests.get(cacheKey)! as Promise<T>;
    }

    // Create request promise
    const promise = (async () => {
      try {
        const result = await fetcher();
        if (ttlMs > 0 && result !== undefined && result !== null) {
          this.responseCache.set(cacheKey, { data: result, expiry: Date.now() + ttlMs });
        }
        return result;
      } finally {
        this.inFlightRequests.delete(cacheKey);
      }
    })();

    this.inFlightRequests.set(cacheKey, promise);
    return promise;
  }

  /**
   * Invalidate specific cache keys or all cache entries (e.g. after mutations).
   */
  public invalidateCache(prefix?: string) {
    if (!prefix) {
      this.responseCache.clear();
      return;
    }
    for (const key of this.responseCache.keys()) {
      if (key.startsWith(prefix)) {
        this.responseCache.delete(key);
      }
    }
  }

  public clearAllPending() {
    this.inFlightRequests.clear();
  }
}

export const trafficOptimizer = new TrafficOptimizer();
