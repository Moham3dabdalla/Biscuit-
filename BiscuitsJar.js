const { parse, stringify } = require('url');
const querystring = require('querystring');

class BiscuitsJar {
  constructor() {
    this.rateLimitStore = new Map(); // تخزين بيانات rate limit
    this.memoizedURL = null; // لتخزين URL م解析
  }

  /**
   * Middleware لتطبيق rate limiting
   * @param {number} max - الحد الأقصى للطلبات المسموح بها
   * @param {number} windowMs - النافذة الزمنية بالمللي ثانية
   * @returns {Function} middleware
   */
  rateLimit(max = 100, windowMs = 60 * 1000) {
    return (req, res, next) => {
      const ip = req.socket.remoteAddress; // الحصول على عنوان IP
      const current = this.rateLimitStore.get(ip) || { count: 0, start: Date.now() };

      // إعادة تعيين العد إذا انتهت النافذة الزمنية
      if (Date.now() - current.start > windowMs) {
        current.count = 0;
        current.start = Date.now();
      }

      // زيادة العد ورفع خطأ إذا تجاوز الحد
      if (++current.count > max) {
        throw new Error('Too many requests');
      }

      // تحديث البيانات في الـ store
      this.rateLimitStore.set(ip, current);
      next();
    };
  }

  /**
   * Middleware لتطبيق timeout على الطلبات
   * @param {number} delay - الوقت بالمللي ثانية قبل انتهاء المهلة
   * @returns {Function} middleware
   */
  timeout(delay = 5000) {
    return (req, res, next) => {
      const timer = setTimeout(() => {
        res.status(408).send('Request timeout'); // إرسال رد بانتهاء المهلة
        req.destroy(); // إنهاء الطلب
      }, delay);

      // إلغاء المهلة إذا تم إكمال الطلب
      res.on('finish', () => clearTimeout(timer));
      next();
    };
  }

  /**
   * Return request header.
   * @return {Object}
   */
  get header() {
    return this.req.headers;
  }

  /**
   * Set request header.
   * @param {Object} val
   */
  set header(val) {
    this.req.headers = val;
  }

  /**
   * Return request header, alias as request.header
   * @return {Object}
   */
  get headers() {
    return this.req.headers;
  }

  /**
   * Set request header, alias as request.header
   * @param {Object} val
   */
  set headers(val) {
    this.req.headers = val;
  }

  /**
   * Get request URL.
   * @return {String}
   */
  get url() {
    return this.req.url;
  }

  /**
   * Set request URL.
   * @param {String} val
   */
  set url(val) {
    this.req.url = val;
  }

  /**
   * Get origin of URL.
   * @return {String}
   */
  get origin() {
    return `${this.protocol}://${this.host}`;
  }

  /**
   * Get full request URL.
   * @return {String}
   */
  get href() {
    // support: `GET http://example.com/foo`
    if (/^https?:\/\//i.test(this.originalUrl)) return this.originalUrl;
    return this.origin + this.originalUrl;
  }

  /**
   * Get request method.
   * @return {String}
   */
  get method() {
    return this.req.method;
  }

  /**
   * Set request method.
   * @param {String} val
   */
  set method(val) {
    this.req.method = val;
  }

  /**
   * Get request pathname.
   * @return {String}
   */
  get path() {
    return parse(this.req.url).pathname;
  }

  /**
   * Set pathname, retaining the query string when present.
   * @param {String} path
   */
  set path(path) {
    const url = parse(this.req.url);
    if (url.pathname === path) return;

    url.pathname = path;
    url.path = null;

    this.url = stringify(url);
  }

  /**
   * Get parsed query string.
   * @return {Object}
   */
  get query() {
    const str = this.querystring;
    const c = this._querycache = this._querycache || {};
    return c[str] || (c[str] = querystring.parse(str));
  }

  /**
   * Set query string as an object.
   * @param {Object} obj
   */
  set query(obj) {
    this.querystring = querystring.stringify(obj);
  }

  /**
   * Get query string.
   * @return {String}
   */
  get querystring() {
    if (!this.req) return '';
    return parse(this.req.url).query || '';
  }

  /**
   * Set query string.
   * @param {String} str
   */
  set querystring(str) {
    const url = parse(this.req.url);
    if (url.search === `?${str}`) return;

    url.search = str;
    url.path = null;
    this.url = stringify(url);
  }

  /**
   * Get the search string. Same as the query string
   * except it includes the leading ?.
   * @return {String}
   */
  get search() {
    if (!this.querystring) return '';
    return `?${this.querystring}`;
  }

  /**
   * Set the search string. Same as
   * request.querystring= but included for ubiquity.
   * @param {String} str
   */
  set search(str) {
    this.querystring = str;
  }

  /**
   * Parse the "Host" header field host
   * and support X-Forwarded-Host when a
   * proxy is enabled.
   * @return {String} hostname:port
   */
  get host() {
    const proxy = this.app.proxy;
    let host = proxy && this.get('X-Forwarded-Host');
    if (!host) {
      if (this.req.httpVersionMajor >= 2) host = this.get(':authority');
      if (!host) host = this.get('Host');
    }
    if (!host) return '';
    return host.split(/\s*,\s*/, 1)[0];
  }

  /**
   * Parse the "Host" header field hostname
   * and support X-Forwarded-Host when a
   * proxy is enabled.
   * @return {String} hostname
   */
  get hostname() {
    const host = this.host;
    if (!host) return '';
    if (host[0] === '[') return this.URL.hostname || ''; // IPv6
    return host.split(':', 1)[0];
  }

  /**
   * Get WHATWG parsed URL.
   * Lazily memoized.
   * @return {URL|Object}
   */
  get URL() {
    if (!this.memoizedURL) {
      const originalUrl = this.originalUrl || ''; // avoid undefined in template string
      try {
        this.memoizedURL = new URL(`${this.origin}${originalUrl}`);
      } catch (err) {
        this.memoizedURL = Object.create(null);
      }
    }
    return this.memoizedURL;
  }
}

// تصدير الكلاس لاستخدامه في مكان آخر
module.exports = new BiscuitsJar();