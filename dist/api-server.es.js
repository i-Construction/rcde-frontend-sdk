var T = Object.defineProperty;
var w = (o, e, t) => e in o ? T(o, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : o[e] = t;
var s = (o, e, t) => w(o, typeof e != "symbol" ? e + "" : e, t);
let v = class {
  constructor(e = {}) {
    s(this, "baseUrl", "https://api.rcde.jp");
    s(this, "securityData", null);
    s(this, "securityWorker");
    s(this, "abortControllers", /* @__PURE__ */ new Map());
    s(this, "customFetch", (...e) => fetch(...e));
    s(this, "baseApiParams", {
      credentials: "same-origin",
      headers: {},
      redirect: "follow",
      referrerPolicy: "no-referrer"
    });
    s(this, "setSecurityData", (e) => {
      this.securityData = e;
    });
    s(this, "contentFormatters", {
      "application/json": (e) => e !== null && (typeof e == "object" || typeof e == "string") ? JSON.stringify(e) : e,
      "application/vnd.api+json": (e) => e !== null && (typeof e == "object" || typeof e == "string") ? JSON.stringify(e) : e,
      "text/plain": (e) => e !== null && typeof e != "string" ? JSON.stringify(e) : e,
      "multipart/form-data": (e) => e instanceof FormData ? e : Object.keys(e || {}).reduce((t, a) => {
        const r = e[a];
        return t.append(
          a,
          r instanceof Blob ? r : typeof r == "object" && r !== null ? JSON.stringify(r) : `${r}`
        ), t;
      }, new FormData()),
      "application/x-www-form-urlencoded": (e) => this.toQueryString(e)
    });
    s(this, "createAbortSignal", (e) => {
      if (this.abortControllers.has(e)) {
        const a = this.abortControllers.get(e);
        return a ? a.signal : void 0;
      }
      const t = new AbortController();
      return this.abortControllers.set(e, t), t.signal;
    });
    s(this, "abortRequest", (e) => {
      const t = this.abortControllers.get(e);
      t && (t.abort(), this.abortControllers.delete(e));
    });
    s(this, "request", async ({
      body: e,
      secure: t,
      path: a,
      type: r,
      query: n,
      format: h,
      baseUrl: d,
      cancelToken: i,
      ...m
    }) => {
      const A = (typeof t == "boolean" ? t : this.baseApiParams.secure) && this.securityWorker && await this.securityWorker(this.securityData) || {}, u = this.mergeRequestParams(m, A), p = n && this.toQueryString(n), x = this.contentFormatters[
        r || "application/json"
        /* Json */
      ], y = h || u.format;
      return this.customFetch(
        `${d || this.baseUrl || ""}${a}${p ? `?${p}` : ""}`,
        {
          ...u,
          headers: {
            ...u.headers || {},
            ...r && r !== "multipart/form-data" ? { "Content-Type": r } : {}
          },
          signal: (i ? this.createAbortSignal(i) : u.signal) || null,
          body: typeof e > "u" || e === null ? null : x(e)
        }
      ).then(async (g) => {
        const c = g;
        c.data = null, c.error = null;
        const b = y ? g.clone() : g, f = y ? await b[y]().then((l) => (c.ok ? c.data = l : c.error = l, c)).catch((l) => (c.error = l, c)) : c;
        if (i && this.abortControllers.delete(i), !g.ok) throw f;
        return f;
      });
    });
    Object.assign(this, e);
  }
  encodeQueryParam(e, t) {
    return `${encodeURIComponent(e)}=${encodeURIComponent(typeof t == "number" ? t : `${t}`)}`;
  }
  addQueryParam(e, t) {
    return this.encodeQueryParam(t, e[t]);
  }
  addArrayQueryParam(e, t) {
    return e[t].map((r) => this.encodeQueryParam(t, r)).join("&");
  }
  toQueryString(e) {
    const t = e || {};
    return Object.keys(t).filter(
      (r) => typeof t[r] < "u"
    ).map(
      (r) => Array.isArray(t[r]) ? this.addArrayQueryParam(t, r) : this.addQueryParam(t, r)
    ).join("&");
  }
  addQueryParams(e) {
    const t = this.toQueryString(e);
    return t ? `?${t}` : "";
  }
  mergeRequestParams(e, t) {
    return {
      ...this.baseApiParams,
      ...e,
      ...t || {},
      headers: {
        ...this.baseApiParams.headers || {},
        ...e.headers || {},
        ...t && t.headers || {}
      }
    };
  }
}, k = class extends v {
  constructor() {
    super(...arguments);
    s(this, "ext", {
      /**
       * @description アクセストークン、リフレッシュトークン生成
       *
       * @name PostExtV2AuthToken
       * @summary Create Token
       * @request POST:/ext/v2/auth/token
       */
      postExtV2AuthToken: (t, a = {}) => this.request({
        path: "/ext/v2/auth/token",
        method: "POST",
        body: t,
        type: "application/json",
        format: "json",
        ...a
      }),
      /**
       * @description アクセストークン、リフレッシュトークンの再生成
       *
       * @name PostExtV2AuthenticatedRefresh
       * @summary Refresh Token
       * @request POST:/ext/v2/authenticated/refresh
       */
      postExtV2AuthenticatedRefresh: (t, a = {}) => this.request({
        path: "/ext/v2/authenticated/refresh",
        method: "POST",
        body: t,
        type: "application/json",
        format: "json",
        ...a
      }),
      /**
       * @description pub用のトークンを作成
       *
       * @name PostExtV2AuthenticatedEquipmentToken
       * @summary Create Equipment Token
       * @request POST:/ext/v2/authenticated/equipmentToken
       */
      postExtV2AuthenticatedEquipmentToken: (t, a = {}) => this.request({
        path: "/ext/v2/authenticated/equipmentToken",
        method: "POST",
        body: t,
        type: "application/json",
        format: "json",
        ...a
      }),
      /**
       * @description 現場一覧取得
       *
       * @name GetExtV2AuthenticatedConstructionList
       * @summary Get Construction List
       * @request GET:/ext/v2/authenticated/construction
       */
      getExtV2AuthenticatedConstructionList: (t = {}) => this.request({
        path: "/ext/v2/authenticated/construction",
        method: "GET",
        format: "json",
        ...t
      }),
      /**
       * @description 現場作成
       *
       * @name PostExtV2AuthenticatedConstruction
       * @summary Create Construction
       * @request POST:/ext/v2/authenticated/construction
       */
      postExtV2AuthenticatedConstruction: (t, a = {}) => this.request({
        path: "/ext/v2/authenticated/construction",
        method: "POST",
        body: t,
        type: "application/json",
        format: "json",
        ...a
      }),
      /**
       * @description 現場詳細取得
       *
       * @name GetExtV2AuthenticatedConstruction
       * @summary Get Construction
       * @request GET:/ext/v2/authenticated/construction/{constructionId}
       */
      getExtV2AuthenticatedConstruction: (t, a = {}) => this.request({
        path: `/ext/v2/authenticated/construction/${t}`,
        method: "GET",
        format: "json",
        ...a
      }),
      /**
       * @description 現場編集
       *
       * @name PutExtV2AuthenticatedConstruction
       * @summary Update Construction
       * @request PUT:/ext/v2/authenticated/construction/{constructionId}
       */
      putExtV2AuthenticatedConstruction: (t, a, r = {}) => this.request({
        path: `/ext/v2/authenticated/construction/${t}`,
        method: "PUT",
        body: a,
        type: "application/json",
        format: "json",
        ...r
      }),
      /**
       * @description 現場削除
       *
       * @name DeleteExtV2AuthenticatedConstruction
       * @summary Delete Construction
       * @request DELETE:/ext/v2/authenticated/construction/{constructionId}
       */
      deleteExtV2AuthenticatedConstruction: (t, a, r = {}) => this.request({
        path: `/ext/v2/authenticated/construction/${t}`,
        method: "DELETE",
        body: a,
        ...r
      }),
      /**
       * @description 契約項目一覧取得
       *
       * @name GetExtV2AuthenticatedContractList
       * @summary Get Contract List
       * @request GET:/ext/v2/authenticated/contract
       */
      getExtV2AuthenticatedContractList: (t, a = {}) => this.request({
        path: "/ext/v2/authenticated/contract",
        method: "GET",
        query: t,
        format: "json",
        ...a
      }),
      /**
       * @description 契約項目作成
       *
       * @name PostExtV2AuthenticatedContract
       * @summary Create Contract
       * @request POST:/ext/v2/authenticated/contract
       */
      postExtV2AuthenticatedContract: (t, a = {}) => this.request({
        path: "/ext/v2/authenticated/contract",
        method: "POST",
        body: t,
        type: "application/json",
        format: "json",
        ...a
      }),
      /**
       * @description 契約項目詳細取得
       *
       * @name GetExtV2AuthenticatedContract
       * @summary Get Contract
       * @request GET:/ext/v2/authenticated/contract/{contractId}
       */
      getExtV2AuthenticatedContract: (t, a = {}) => this.request({
        path: `/ext/v2/authenticated/contract/${t}`,
        method: "GET",
        format: "json",
        ...a
      }),
      /**
       * @description 契約項目編集
       *
       * @name PutExtV2AuthenticatedContract
       * @summary Update Contract
       * @request PUT:/ext/v2/authenticated/contract/{contractId}
       */
      putExtV2AuthenticatedContract: (t, a, r = {}) => this.request({
        path: `/ext/v2/authenticated/contract/${t}`,
        method: "PUT",
        body: a,
        type: "application/json",
        format: "json",
        ...r
      }),
      /**
       * @description 契約項目削除
       *
       * @name DeleteExtV2AuthenticatedContract
       * @summary Delete Contract
       * @request DELETE:/ext/v2/authenticated/contract/{contractId}
       */
      deleteExtV2AuthenticatedContract: (t, a, r = {}) => this.request({
        path: `/ext/v2/authenticated/contract/${t}`,
        method: "DELETE",
        body: a,
        ...r
      }),
      /**
       * @description 契約項目ファイル一覧取得
       *
       * @name GetExtV2AuthenticatedContractFileList
       * @summary Get Contract File List
       * @request GET:/ext/v2/authenticated/contractFile
       */
      getExtV2AuthenticatedContractFileList: (t, a = {}) => this.request({
        path: "/ext/v2/authenticated/contractFile",
        method: "GET",
        query: t,
        format: "json",
        ...a
      }),
      /**
       * @description 契約項目ファイル編集
       *
       * @name PutExtV2AuthenticatedContractFile
       * @summary Put Contract File
       * @request PUT:/ext/v2/authenticated/contractFile/{contractFileId}
       */
      putExtV2AuthenticatedContractFile: (t, a, r = {}) => this.request({
        path: `/ext/v2/authenticated/contractFile/${t}`,
        method: "PUT",
        body: a,
        type: "application/json",
        format: "json",
        ...r
      }),
      /**
       * @description 契約項目ファイル削除
       *
       * @name DeleteExtV2AuthenticatedContractFile
       * @summary Delete Contract File
       * @request DELETE:/ext/v2/authenticated/contractFile/{contractFileId}
       */
      deleteExtV2AuthenticatedContractFile: (t, a = {}) => this.request({
        path: `/ext/v2/authenticated/contractFile/${t}`,
        method: "DELETE",
        ...a
      }),
      /**
       * @description 点群アップロード
       *
       * @name PostExtV2AuthenticatedContractFilePointCloud
       * @summary Upload Point Cloud
       * @request POST:/ext/v2/authenticated/contractFile/pointCloud
       */
      postExtV2AuthenticatedContractFilePointCloud: (t, a = {}) => this.request({
        path: "/ext/v2/authenticated/contractFile/pointCloud",
        method: "POST",
        body: t,
        type: "application/json",
        format: "json",
        ...a
      }),
      /**
       * @description ファイルアップロード完了API
       *
       * @name PutExtV2AuthenticatedContractFileUploaded
       * @summary Complete Contract File Upload
       * @request PUT:/ext/v2/authenticated/contractFile/uploaded/{contractFileId}
       */
      putExtV2AuthenticatedContractFileUploaded: (t, a, r = {}) => this.request({
        path: `/ext/v2/authenticated/contractFile/uploaded/${t}`,
        method: "PUT",
        body: a,
        type: "application/json",
        format: "json",
        ...r
      }),
      /**
       * @description 点群マルチパートアップロード(2種類のアップロードURLが返るのでそれぞれにアップロードする)
       *
       * @name PostExtV2AuthenticatedContractFilePointCloudMultipartUpload
       * @summary Multipart Upload Point Cloud
       * @request POST:/ext/v2/authenticated/contractFile/pointCloud/multipartUpload
       */
      postExtV2AuthenticatedContractFilePointCloudMultipartUpload: (t, a = {}) => this.request({
        path: "/ext/v2/authenticated/contractFile/pointCloud/multipartUpload",
        method: "POST",
        body: t,
        type: "application/json",
        format: "json",
        ...a
      }),
      /**
       * @description 点群マルチパートアップロード完了
       *
       * @name PostExtV2AuthenticatedContractFilePointCloudCompleteMultipartUpload
       * @summary Complete Multipart Upload Point Cloud
       * @request PUT:/ext/v2/authenticated/contractFile/pointCloud/completeMultipartUpload
       */
      postExtV2AuthenticatedContractFilePointCloudCompleteMultipartUpload: (t, a = {}) => this.request({
        path: "/ext/v2/authenticated/contractFile/pointCloud/completeMultipartUpload",
        method: "PUT",
        body: t,
        type: "application/json",
        ...a
      }),
      /**
       * @description 点群マルチパートアップロード削除
       *
       * @name PostExtV2AuthenticatedContractFilePointCloudDeleteMultipartUpload
       * @summary Delete Multipart Upload Point Cloud
       * @request DELETE:/ext/v2/authenticated/contractFile/pointCloud/deleteMultipartUpload
       */
      postExtV2AuthenticatedContractFilePointCloudDeleteMultipartUpload: (t, a = {}) => this.request({
        path: "/ext/v2/authenticated/contractFile/pointCloud/deleteMultipartUpload",
        method: "DELETE",
        body: t,
        type: "application/json",
        ...a
      }),
      /**
       * @description ファイルダウンロードURL取得
       *
       * @name GetExtV2AuthenticatedContractFileDownloadUrl
       * @summary Download Contract File
       * @request GET:/ext/v2/authenticated/contractFile/downloadURL/{contractFileId}
       */
      getExtV2AuthenticatedContractFileDownloadUrl: (t, a, r = {}) => this.request({
        path: `/ext/v2/authenticated/contractFile/downloadURL/${t}`,
        method: "GET",
        query: a,
        format: "json",
        ...r
      }),
      /**
       * @description 処理ステータス取得
       *
       * @name GetExtV2AuthenticatedContractFileProcessingStatus
       * @summary Get Processing Status
       * @request GET:/ext/v2/authenticated/contractFile/processingStatus/{contractFileId}
       */
      getExtV2AuthenticatedContractFileProcessingStatus: (t, a, r = {}) => this.request({
        path: `/ext/v2/authenticated/contractFile/processingStatus/${t}`,
        method: "GET",
        query: a,
        format: "json",
        ...r
      }),
      /**
       * @description meta取得
       *
       * @name GetExtV2AuthenticatedPclodMeta
       * @summary Get Pclod Meta
       * @request GET:/ext/v2/authenticated/pclod/meta
       */
      getExtV2AuthenticatedPclodMeta: (t, a = {}) => this.request({
        path: "/ext/v2/authenticated/pclod/meta",
        method: "GET",
        query: t,
        ...a
      }),
      /**
       * @description imagePosition取得
       *
       * @name GetExtV2AuthenticatedPclodImagePosition
       * @summary Get Pclod Image Position
       * @request GET:/ext/v2/authenticated/pclod/imagePosition
       */
      getExtV2AuthenticatedPclodImagePosition: (t, a = {}) => this.request({
        path: "/ext/v2/authenticated/pclod/imagePosition",
        method: "GET",
        query: t,
        ...a
      }),
      /**
       * @description imageColor取得
       *
       * @name GetExtV2AuthenticatedPclodImageColor
       * @summary Get Pclod Image Color
       * @request GET:/ext/v2/authenticated/pclod/imageColor
       */
      getExtV2AuthenticatedPclodImageColor: (t, a = {}) => this.request({
        path: "/ext/v2/authenticated/pclod/imageColor",
        method: "GET",
        query: t,
        ...a
      })
    });
  }
};
class O {
  constructor(e) {
    s(this, "baseUrl");
    s(this, "clientId");
    s(this, "clientSecret");
    s(this, "api");
    s(this, "origin");
    s(this, "token");
    const { domain: t, baseUrl: a, clientId: r, clientSecret: n } = e;
    this.baseUrl = a, this.clientId = r, this.clientSecret = n, this.origin = t ?? "", this.api = new k({ baseUrl: this.baseUrl });
  }
  get headers() {
    const e = { "Content-Type": "application/json" };
    return this.origin && (e.Origin = this.origin), e;
  }
  get authHeaders() {
    return { ...this.headers, Authorization: `Bearer ${this.accessToken}` };
  }
  get accessToken() {
    var e;
    if (!((e = this.token) != null && e.accessToken)) throw new Error("Token is not available");
    return this.token.accessToken;
  }
  isTokenAvailable() {
    if (!this.token) throw new Error("Token is not available");
  }
  async authenticate() {
    const e = await this.api.ext.postExtV2AuthToken(
      { clientId: this.clientId, clientSecret: this.clientSecret },
      { headers: this.headers }
    );
    this.token = e.data;
  }
  async refreshToken() {
    if (this.isTokenAvailable(), !this.token.refreshToken) throw new Error("No refresh token");
    const e = await this.api.ext.postExtV2AuthenticatedRefresh(
      { clientId: this.clientId, clientSecret: this.clientSecret },
      { headers: { ...this.headers, Authorization: `Bearer ${this.token.refreshToken}` } }
    ), { accessToken: t, refreshToken: a, expiresAt: r } = e.data ?? {};
    if (!t || !a || !r)
      throw new Error("Invalid token response for 2-legged refresh");
    this.token = { accessToken: t, refreshToken: a, expiresAt: r };
  }
  async createEquipmentToken(e) {
    return this.isTokenAvailable(), (await this.api.ext.postExtV2AuthenticatedEquipmentToken(e, {
      headers: this.authHeaders
    })).data;
  }
  async getConstructionList() {
    return this.isTokenAvailable(), (await this.api.ext.getExtV2AuthenticatedConstructionList({
      headers: this.authHeaders
    })).data;
  }
  async createConstruction(e) {
    return this.isTokenAvailable(), (await this.api.ext.postExtV2AuthenticatedConstruction(
      { ...e, period: e.period.toISOString(), contractedAt: e.contractedAt.toISOString() },
      { headers: this.authHeaders }
    )).data;
  }
  async getConstruction(e) {
    return this.isTokenAvailable(), (await this.api.ext.getExtV2AuthenticatedConstruction(e, {
      headers: this.authHeaders
    })).data;
  }
  async updateConstruction(e, t) {
    return this.isTokenAvailable(), (await this.api.ext.putExtV2AuthenticatedConstruction(e, t, {
      headers: this.authHeaders
    })).data;
  }
  async deleteConstruction(e) {
    return this.isTokenAvailable(), (await this.api.ext.deleteExtV2AuthenticatedConstruction(e, {
      headers: this.authHeaders
    })).data;
  }
  async getContractList(e) {
    return this.isTokenAvailable(), (await this.api.ext.getExtV2AuthenticatedContractList(e, {
      headers: this.authHeaders
    })).data;
  }
  async createContract(e) {
    return this.isTokenAvailable(), (await this.api.ext.postExtV2AuthenticatedContract(
      { ...e, contractedAt: e.contractedAt.toISOString() },
      { headers: this.authHeaders }
    )).data;
  }
  async getContract(e) {
    return this.isTokenAvailable(), (await this.api.ext.getExtV2AuthenticatedContract(e, {
      headers: this.authHeaders
    })).data;
  }
  async updateContract(e, t) {
    return this.isTokenAvailable(), (await this.api.ext.putExtV2AuthenticatedContract(e, t, {
      headers: this.authHeaders
    })).data;
  }
  async deleteContract(e) {
    return this.isTokenAvailable(), (await this.api.ext.deleteExtV2AuthenticatedContract(e, {
      headers: this.authHeaders
    })).data;
  }
  async getContractFileList(e) {
    return this.isTokenAvailable(), (await this.api.ext.getExtV2AuthenticatedContractFileList(e, {
      headers: this.authHeaders
    })).data;
  }
  async getContractFileMetadata(e) {
    return this.isTokenAvailable(), (await this.api.ext.getExtV2AuthenticatedPclodMeta(e, {
      headers: this.authHeaders
    })).data;
  }
  async getContractFileImagePosition(e) {
    return this.isTokenAvailable(), (await this.api.ext.getExtV2AuthenticatedPclodImagePosition(e, {
      headers: this.authHeaders,
      format: "arrayBuffer"
    })).data;
  }
  async getContractFileImageColor(e) {
    return this.isTokenAvailable(), (await this.api.ext.getExtV2AuthenticatedPclodImageColor(e, {
      headers: this.authHeaders,
      format: "arrayBuffer"
    })).data;
  }
  async createContractFileUploadUrl(e) {
    return this.isTokenAvailable(), (await this.api.ext.postExtV2AuthenticatedContractFilePointCloud(e, {
      headers: this.authHeaders
    })).data;
  }
  async completeContractFileUpload(e, t) {
    return this.isTokenAvailable(), (await this.api.ext.putExtV2AuthenticatedContractFileUploaded(
      e,
      t,
      { headers: this.authHeaders }
    )).data;
  }
  async uploadContractFile(e) {
    const { buffer: t, size: a, ...r } = e;
    let n = a ?? 0;
    if (t instanceof ArrayBuffer && (n = t.byteLength), t instanceof Blob && (n = t.size), n === 0) throw new Error("size field is required");
    const h = await this.createContractFileUploadUrl({ ...r, size: n }), d = h.presignedURL, i = h.contractFileId;
    if (!d) throw new Error("presignedURL が取得できませんでした");
    if (i === void 0) throw new Error("contractFileId が取得できませんでした");
    return await fetch(d, {
      method: "PUT",
      body: t,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": n.toString()
      }
    }), await this.completeContractFileUpload(i, {
      contractId: r.contractId
    });
  }
  async getContractFileDownloadUrl(e, t) {
    return this.isTokenAvailable(), (await this.api.ext.getExtV2AuthenticatedContractFileDownloadUrl(
      t,
      { contractId: e },
      { headers: this.authHeaders }
    )).data;
  }
  async getContractFileProcessingStatus(e, t) {
    return this.isTokenAvailable(), (await this.api.ext.getExtV2AuthenticatedContractFileProcessingStatus(
      t,
      { contractId: e },
      { headers: this.authHeaders }
    )).data;
  }
}
class P {
  constructor(e = {}) {
    s(this, "baseUrl", "https://api.rcde.jp");
    s(this, "securityData", null);
    s(this, "securityWorker");
    s(this, "abortControllers", /* @__PURE__ */ new Map());
    s(this, "customFetch", (...e) => fetch(...e));
    s(this, "baseApiParams", {
      credentials: "same-origin",
      headers: {},
      redirect: "follow",
      referrerPolicy: "no-referrer"
    });
    s(this, "setSecurityData", (e) => {
      this.securityData = e;
    });
    s(this, "contentFormatters", {
      "application/json": (e) => e !== null && (typeof e == "object" || typeof e == "string") ? JSON.stringify(e) : e,
      "application/vnd.api+json": (e) => e !== null && (typeof e == "object" || typeof e == "string") ? JSON.stringify(e) : e,
      "text/plain": (e) => e !== null && typeof e != "string" ? JSON.stringify(e) : e,
      "multipart/form-data": (e) => e instanceof FormData ? e : Object.keys(e || {}).reduce((t, a) => {
        const r = e[a];
        return t.append(
          a,
          r instanceof Blob ? r : typeof r == "object" && r !== null ? JSON.stringify(r) : `${r}`
        ), t;
      }, new FormData()),
      "application/x-www-form-urlencoded": (e) => this.toQueryString(e)
    });
    s(this, "createAbortSignal", (e) => {
      if (this.abortControllers.has(e)) {
        const a = this.abortControllers.get(e);
        return a ? a.signal : void 0;
      }
      const t = new AbortController();
      return this.abortControllers.set(e, t), t.signal;
    });
    s(this, "abortRequest", (e) => {
      const t = this.abortControllers.get(e);
      t && (t.abort(), this.abortControllers.delete(e));
    });
    s(this, "request", async ({
      body: e,
      secure: t,
      path: a,
      type: r,
      query: n,
      format: h,
      baseUrl: d,
      cancelToken: i,
      ...m
    }) => {
      const A = (typeof t == "boolean" ? t : this.baseApiParams.secure) && this.securityWorker && await this.securityWorker(this.securityData) || {}, u = this.mergeRequestParams(m, A), p = n && this.toQueryString(n), x = this.contentFormatters[
        r || "application/json"
        /* Json */
      ], y = h || u.format;
      return this.customFetch(
        `${d || this.baseUrl || ""}${a}${p ? `?${p}` : ""}`,
        {
          ...u,
          headers: {
            ...u.headers || {},
            ...r && r !== "multipart/form-data" ? { "Content-Type": r } : {}
          },
          signal: (i ? this.createAbortSignal(i) : u.signal) || null,
          body: typeof e > "u" || e === null ? null : x(e)
        }
      ).then(async (g) => {
        const c = g;
        c.data = null, c.error = null;
        const b = y ? g.clone() : g, f = y ? await b[y]().then((l) => (c.ok ? c.data = l : c.error = l, c)).catch((l) => (c.error = l, c)) : c;
        if (i && this.abortControllers.delete(i), !g.ok) throw f;
        return f;
      });
    });
    Object.assign(this, e);
  }
  encodeQueryParam(e, t) {
    return `${encodeURIComponent(e)}=${encodeURIComponent(typeof t == "number" ? t : `${t}`)}`;
  }
  addQueryParam(e, t) {
    return this.encodeQueryParam(t, e[t]);
  }
  addArrayQueryParam(e, t) {
    return e[t].map((r) => this.encodeQueryParam(t, r)).join("&");
  }
  toQueryString(e) {
    const t = e || {};
    return Object.keys(t).filter(
      (r) => typeof t[r] < "u"
    ).map(
      (r) => Array.isArray(t[r]) ? this.addArrayQueryParam(t, r) : this.addQueryParam(t, r)
    ).join("&");
  }
  addQueryParams(e) {
    const t = this.toQueryString(e);
    return t ? `?${t}` : "";
  }
  mergeRequestParams(e, t) {
    return {
      ...this.baseApiParams,
      ...e,
      ...t || {},
      headers: {
        ...this.baseApiParams.headers || {},
        ...e.headers || {},
        ...t && t.headers || {}
      }
    };
  }
}
class j extends P {
  constructor() {
    super(...arguments);
    s(this, "ext", {
      /**
       * @description アクセストークン、リフレッシュトークン生成
       *
       * @name PostExt3LeggedV2AuthToken
       * @summary Create Token
       * @request POST:/ext/v2/oauth/token
       */
      postExt3LeggedV2AuthToken: (t, a = {}) => this.request({
        path: "/ext/v2/oauth/token",
        method: "POST",
        body: t,
        type: "application/json",
        format: "json",
        ...a
      }),
      /**
       * @description メンバー一覧取得
       *
       * @name GetExt3LeggedV2AuthenticatedUserList
       * @summary Get User List
       * @request GET:/ext/v2/userAuthenticated/user
       */
      getExt3LeggedV2AuthenticatedUserList: (t, a = {}) => this.request({
        path: "/ext/v2/userAuthenticated/user",
        method: "GET",
        query: t,
        format: "json",
        ...a
      }),
      /**
       * @description 現場一覧取得
       *
       * @name GetExt3LeggedV2AuthenticatedConstructionList
       * @summary Get Construction List
       * @request GET:/ext/v2/userAuthenticated/construction
       */
      getExt3LeggedV2AuthenticatedConstructionList: (t, a = {}) => this.request({
        path: "/ext/v2/userAuthenticated/construction",
        method: "GET",
        query: t,
        format: "json",
        ...a
      }),
      /**
       * @description 現場作成
       *
       * @name PostExt3LeggedV2AuthenticatedConstruction
       * @summary Create Construction
       * @request POST:/ext/v2/userAuthenticated/construction
       */
      postExt3LeggedV2AuthenticatedConstruction: (t, a = {}) => this.request({
        path: "/ext/v2/userAuthenticated/construction",
        method: "POST",
        body: t,
        type: "application/json",
        format: "json",
        ...a
      }),
      /**
       * @description 現場詳細取得
       *
       * @name GetExt3LeggedV2AuthenticatedConstruction
       * @summary Get Construction
       * @request GET:/ext/v2/userAuthenticated/construction/{constructionId}
       */
      getExt3LeggedV2AuthenticatedConstruction: (t, a, r = {}) => this.request({
        path: `/ext/v2/userAuthenticated/construction/${t}`,
        method: "GET",
        query: a,
        format: "json",
        ...r
      }),
      /**
       * @description 現場編集
       *
       * @name PutExt3LeggedV2AuthenticatedConstruction
       * @summary Update Construction
       * @request PUT:/ext/v2/userAuthenticated/construction/{constructionId}
       */
      putExt3LeggedV2AuthenticatedConstruction: (t, a, r = {}) => this.request({
        path: `/ext/v2/userAuthenticated/construction/${t}`,
        method: "PUT",
        body: a,
        type: "application/json",
        format: "json",
        ...r
      }),
      /**
       * @description 現場削除
       *
       * @name DeleteExt3LeggedV2AuthenticatedConstruction
       * @summary Delete Construction
       * @request DELETE:/ext/v2/userAuthenticated/construction/{constructionId}
       */
      deleteExt3LeggedV2AuthenticatedConstruction: (t, a, r = {}) => this.request({
        path: `/ext/v2/userAuthenticated/construction/${t}`,
        method: "DELETE",
        body: a,
        ...r
      }),
      /**
       * @description 現場へのメンバー招待
       *
       * @name PostExt3LeggedV2AuthenticatedConstructionUser
       * @summary Create Construction User
       * @request POST:/ext/v2/userAuthenticated/construction/{constructionId}/user
       */
      postExt3LeggedV2AuthenticatedConstructionUser: (t, a, r = {}) => this.request({
        path: `/ext/v2/userAuthenticated/construction/${t}/user`,
        method: "POST",
        body: a,
        type: "application/json",
        ...r
      }),
      /**
       * @description 契約項目一覧取得
       *
       * @name GetExt3LeggedV2AuthenticatedContractList
       * @summary Get Contract List
       * @request GET:/ext/v2/userAuthenticated/contract
       */
      getExt3LeggedV2AuthenticatedContractList: (t, a = {}) => this.request({
        path: "/ext/v2/userAuthenticated/contract",
        method: "GET",
        query: t,
        format: "json",
        ...a
      }),
      /**
       * @description 契約項目作成
       *
       * @name PostExt3LeggedV2AuthenticatedContract
       * @summary Create Contract
       * @request POST:/ext/v2/userAuthenticated/contract
       */
      postExt3LeggedV2AuthenticatedContract: (t, a = {}) => this.request({
        path: "/ext/v2/userAuthenticated/contract",
        method: "POST",
        body: t,
        type: "application/json",
        format: "json",
        ...a
      }),
      /**
       * @description 契約項目承認
       *
       * @name PutExt3LeggedV2AuthenticatedContractApproved
       * @summary Update Contract Approval
       * @request PUT:/ext/v2/userAuthenticated/contract/{contractId}/approved
       */
      putExt3LeggedV2AuthenticatedContractApproved: (t, a = {}) => this.request({
        path: `/ext/v2/userAuthenticated/contract/${t}/approved`,
        method: "PUT",
        format: "json",
        ...a
      }),
      /**
       * @description 契約項目取り下げ(削除)
       *
       * @name DeleteExt3LeggedV2AuthenticatedContractDrop
       * @summary Delete Contract
       * @request DELETE:/ext/v2/userAuthenticated/contract/{contractId}/drop
       */
      deleteExt3LeggedV2AuthenticatedContractDrop: (t, a = {}) => this.request({
        path: `/ext/v2/userAuthenticated/contract/${t}/drop`,
        method: "DELETE",
        format: "json",
        ...a
      }),
      /**
       * @description 契約項目詳細取得
       *
       * @name GetExt3LeggedV2AuthenticatedContract
       * @summary Get Contract
       * @request GET:/ext/v2/userAuthenticated/contract/{contractId}
       */
      getExt3LeggedV2AuthenticatedContract: (t, a = {}) => this.request({
        path: `/ext/v2/userAuthenticated/contract/${t}`,
        method: "GET",
        format: "json",
        ...a
      }),
      /**
       * @description 契約項目編集
       *
       * @name PutExt3LeggedV2AuthenticatedContract
       * @summary Update Contract
       * @request PUT:/ext/v2/userAuthenticated/contract/{contractId}
       */
      putExt3LeggedV2AuthenticatedContract: (t, a, r = {}) => this.request({
        path: `/ext/v2/userAuthenticated/contract/${t}`,
        method: "PUT",
        body: a,
        type: "application/json",
        format: "json",
        ...r
      }),
      /**
       * @description 契約項目削除
       *
       * @name DeleteExt3LeggedV2AuthenticatedContract
       * @summary Delete Contract
       * @request DELETE:/ext/v2/userAuthenticated/contract/{contractId}
       */
      deleteExt3LeggedV2AuthenticatedContract: (t, a = {}) => this.request({
        path: `/ext/v2/userAuthenticated/contract/${t}`,
        method: "DELETE",
        ...a
      }),
      /**
       * @description 点群マルチパートアップロード(2種類のアップロードURLが返るのでそれぞれにアップロードする)
       *
       * @name PostExt3LeggedV2AuthenticatedContractFilePointCloudMultipartUpload
       * @summary Multipart Upload Point Cloud
       * @request POST:/ext/v2/userAuthenticated/contractFile/pointCloud/multipartUpload
       */
      postExt3LeggedV2AuthenticatedContractFilePointCloudMultipartUpload: (t, a = {}) => this.request({
        path: "/ext/v2/userAuthenticated/contractFile/pointCloud/multipartUpload",
        method: "POST",
        body: t,
        type: "application/json",
        format: "json",
        ...a
      }),
      /**
       * @description 点群マルチパートアップロード完了
       *
       * @name PutExt3LeggedV2AuthenticatedContractFilePointCloudCompleteMultipartUpload
       * @summary Complete Multipart Upload Point Cloud
       * @request PUT:/ext/v2/userAuthenticated/contractFile/pointCloud/completeMultipartUpload
       */
      putExt3LeggedV2AuthenticatedContractFilePointCloudCompleteMultipartUpload: (t, a = {}) => this.request({
        path: "/ext/v2/userAuthenticated/contractFile/pointCloud/completeMultipartUpload",
        method: "PUT",
        body: t,
        type: "application/json",
        ...a
      }),
      /**
       * @description 点群マルチパートアップロード削除
       *
       * @name DeleteExt3LeggedV2AuthenticatedContractFilePointCloudMultipartUpload
       * @summary Delete Multipart Upload Point Cloud
       * @request DELETE:/ext/v2/userAuthenticated/contractFile/pointCloud/deleteMultipartUpload
       */
      deleteExt3LeggedV2AuthenticatedContractFilePointCloudMultipartUpload: (t, a = {}) => this.request({
        path: "/ext/v2/userAuthenticated/contractFile/pointCloud/deleteMultipartUpload",
        method: "DELETE",
        body: t,
        type: "application/json",
        ...a
      }),
      /**
       * @description 契約項目ファイル一覧取得
       *
       * @name GetExt3LeggedV2AuthenticatedContractFileList
       * @summary Get Contract File List
       * @request GET:/ext/v2/userAuthenticated/contractFile
       */
      getExt3LeggedV2AuthenticatedContractFileList: (t, a = {}) => this.request({
        path: "/ext/v2/userAuthenticated/contractFile",
        method: "GET",
        query: t,
        format: "json",
        ...a
      }),
      /**
       * @description 契約項目ファイルのダウンロードURL取得
       *
       * @name GetExt3LeggedV2AuthenticatedContractFileDownloadUrl
       * @summary Get Contract File Download URL
       * @request GET:/ext/v2/userAuthenticated/contractFile/downloadURL/{contractFileId}
       */
      getExt3LeggedV2AuthenticatedContractFileDownloadUrl: (t, a = {}) => this.request({
        path: `/ext/v2/userAuthenticated/contractFile/downloadURL/${t}`,
        method: "GET",
        format: "json",
        ...a
      }),
      /**
       * @description 契約項目ファイルの処理ステータス取得
       *
       * @name GetExt3LeggedV2AuthenticatedContractFileProcessingStatus
       * @summary Get Contract File Processing Status
       * @request GET:/ext/v2/userAuthenticated/contractFile/processingStatus/{contractFileId}
       */
      getExt3LeggedV2AuthenticatedContractFileProcessingStatus: (t, a = {}) => this.request({
        path: `/ext/v2/userAuthenticated/contractFile/processingStatus/${t}`,
        method: "GET",
        format: "json",
        ...a
      }),
      /**
       * @description 契約項目ファイル更新
       *
       * @name PutExt3LeggedV2AuthenticatedContractFile
       * @summary Update Contract File
       * @request PUT:/ext/v2/userAuthenticated/contractFile/{contractFileId}
       */
      putExt3LeggedV2AuthenticatedContractFile: (t, a, r = {}) => this.request({
        path: `/ext/v2/userAuthenticated/contractFile/${t}`,
        method: "PUT",
        body: a,
        type: "application/json",
        format: "json",
        ...r
      }),
      /**
       * @description 契約項目ファイル削除
       *
       * @name DeleteExt3LeggedV2AuthenticatedContractFile
       * @summary Delete Contract File
       * @request DELETE:/ext/v2/userAuthenticated/contractFile/{contractFileId}
       */
      deleteExt3LeggedV2AuthenticatedContractFile: (t, a = {}) => this.request({
        path: `/ext/v2/userAuthenticated/contractFile/${t}`,
        method: "DELETE",
        ...a
      }),
      /**
       * @description メタ情報取得
       *
       * @name GetExt3LeggedV2AuthenticatedPclodMeta
       * @summary Get Pclod Meta
       * @request GET:/ext/v2/userAuthenticated/pclod/meta
       */
      getExt3LeggedV2AuthenticatedPclodMeta: (t, a = {}) => this.request({
        path: "/ext/v2/userAuthenticated/pclod/meta",
        method: "GET",
        query: t,
        ...a
      }),
      /**
       * @description Position画像取得
       *
       * @name GetExt3LeggedV2AuthenticatedPclodImagePosition
       * @summary Get Pclod Image Position
       * @request GET:/ext/v2/userAuthenticated/pclod/imagePosition
       */
      getExt3LeggedV2AuthenticatedPclodImagePosition: (t, a = {}) => this.request({
        path: "/ext/v2/userAuthenticated/pclod/imagePosition",
        method: "GET",
        query: t,
        ...a
      }),
      /**
       * @description Color画像取得
       *
       * @name GetExt3LeggedV2AuthenticatedPclodImageColor
       * @summary Get PCLOD Image Color
       * @request GET:/ext/v2/userAuthenticated/pclod/imageColor
       */
      getExt3LeggedV2AuthenticatedPclodImageColor: (t, a = {}) => this.request({
        path: "/ext/v2/userAuthenticated/pclod/imageColor",
        method: "GET",
        query: t,
        ...a
      }),
      /**
       * @description pub APIトークン作成
       *
       * @name PostExt3LeggedV2AuthenticatedEquipmentToken
       * @summary Create Equipment Token
       * @request POST:/ext/v2/userAuthenticated/equipmentToken
       */
      postExt3LeggedV2AuthenticatedEquipmentToken: (t, a = {}) => this.request({
        path: "/ext/v2/userAuthenticated/equipmentToken",
        method: "POST",
        body: t,
        type: "application/json",
        format: "json",
        ...a
      })
    });
  }
}
const V = 5 * 1024 * 1024;
async function C(o) {
  if (o instanceof Blob)
    return o.size;
  if (o instanceof ArrayBuffer || ArrayBuffer.isView(o))
    return o.byteLength;
  if (o instanceof ReadableStream) {
    const e = o.getReader();
    let t = 0;
    for (; ; ) {
      const { value: a, done: r } = await e.read();
      if (r) break;
      t += a.byteLength;
    }
    return t;
  }
  return null;
}
async function* F(o, e) {
  if (o instanceof Blob) {
    for (let t = 0; t < o.size; t += e)
      yield new Uint8Array(await o.slice(t, t + e).arrayBuffer());
    return;
  }
  if (o instanceof ArrayBuffer || ArrayBuffer.isView(o)) {
    const t = o instanceof ArrayBuffer ? new Uint8Array(o) : o;
    for (let a = 0; a < t.byteLength; a += e)
      yield t.subarray(a, a + e);
    return;
  }
  if (typeof ReadableStream < "u" && o instanceof ReadableStream) {
    const t = o.getReader();
    let a = new Uint8Array(0);
    for (; ; ) {
      const { value: r, done: n } = await t.read();
      if (n) break;
      for (a = S(a, r); a.byteLength >= e; )
        yield a.subarray(0, e), a = a.subarray(e);
    }
    a.byteLength && (yield a);
    return;
  }
}
async function q(o, { upload: e, chunkSize: t = V, onProgress: a }) {
  const r = await C(o);
  let n = 0, h = 0, d = 0;
  for await (const i of F(o, t))
    await e(i, n, h, r), n++, d += i.byteLength, a == null || a(d, r), h += i.byteLength;
}
function S(o, e) {
  const t = new Uint8Array(o.byteLength + e.byteLength);
  return t.set(o), t.set(e, o.byteLength), t;
}
class R {
  constructor(e) {
    s(this, "baseUrl");
    s(this, "clientId");
    s(this, "clientSecret");
    s(this, "api");
    s(this, "origin");
    s(this, "token");
    const { baseUrl: t, clientId: a, clientSecret: r, domain: n } = e;
    this.baseUrl = t, this.clientId = a, this.clientSecret = r, this.origin = n ?? "", this.api = new j({ baseUrl: t });
  }
  get headers() {
    const e = { "Content-Type": "application/json" };
    return this.origin && (e.Origin = this.origin), e;
  }
  setToken(e) {
    this.token = e;
  }
  getToken() {
    return this.isTokenAvailable(), { ...this.token };
  }
  async authenticate(e) {
    const a = await (await fetch(`${this.baseUrl}/ext/v2/oauth/token`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        clientId: this.clientId,
        clientSecret: this.clientSecret,
        grantType: "authorization_code",
        authCode: e
      })
    })).json(), { accessToken: r, refreshToken: n, expiresAt: h } = a ?? {};
    if (!r || !n || !h)
      throw new Error("Invalid token response for authorization_code");
    this.token = { accessToken: r, refreshToken: n, expiresAt: h };
  }
  needsRefresh(e = 60) {
    var a;
    if (!((a = this.token) != null && a.expiresAt)) return !1;
    const t = Math.floor(Date.now() / 1e3);
    return this.token.expiresAt - t <= e;
  }
  async refreshToken() {
    if (this.isTokenAvailable(), !this.token.refreshToken) throw new Error("No refresh token");
    const t = await (await fetch(`${this.baseUrl}/ext/v2/oauth/token`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        clientId: this.clientId,
        clientSecret: this.clientSecret,
        grantType: "refresh_token",
        refreshToken: this.token.refreshToken
      })
    })).json(), { accessToken: a, refreshToken: r, expiresAt: n } = t ?? {};
    if (!a || !r || !n)
      throw new Error("Invalid token response for refresh_token");
    this.token = { accessToken: a, refreshToken: r, expiresAt: n };
  }
  async ensureValidAccessToken() {
    var e;
    if (this.needsRefresh() && await this.refreshToken(), !((e = this.token) != null && e.accessToken)) throw new Error("No access token");
    return this.token.accessToken;
  }
  async getAuthHeaders() {
    const e = await this.ensureValidAccessToken();
    return { ...this.headers, Authorization: `Bearer ${e}` };
  }
  isTokenAvailable() {
    if (!this.token) throw new Error("Token is not available");
  }
  async getContractFileProcessingStatus(e) {
    this.isTokenAvailable();
    const t = await this.getAuthHeaders();
    return (await this.api.ext.getExt3LeggedV2AuthenticatedContractFileProcessingStatus(
      e,
      { headers: t }
    )).data;
  }
  async uploadContractFileMultipart(e) {
    this.isTokenAvailable();
    const t = await this.getAuthHeaders(), a = e.chunkSize ?? 5 * 1024 * 1024, r = await C(e.file), n = r ? Math.ceil(r / a) : 1, h = await this.api.ext.postExt3LeggedV2AuthenticatedContractFilePointCloudMultipartUpload(
      {
        contractId: e.contractId,
        name: e.filename,
        size: r ?? 0,
        partTotal: n
      },
      { headers: t }
    ), { s3UploadId: d, presignedUploadParts: i, blockChainUploadId: m, contractFileId: A } = h.data, u = [];
    let p = 0;
    if (await q(e.file, {
      chunkSize: a,
      upload: async (y, g, c, b) => {
        const f = i == null ? void 0 : i[p], l = f == null ? void 0 : f.presignedURL;
        if (!l)
          throw new Error(`パート ${p} の presignedURL が取得できませんでした`);
        const E = (await fetch(l, {
          method: "PUT",
          body: y,
          headers: { "Content-Type": "application/octet-stream" }
        })).headers.get("etag") ?? "";
        u.push({
          partNumber: f.partNumber ?? p + 1,
          etag: E
        }), p++;
      },
      onProgress: e.onProgress
    }), !A || !d || !m)
      throw new Error("マルチパートアップロードの完了に必要な情報が不足しています");
    return (await this.api.ext.putExt3LeggedV2AuthenticatedContractFilePointCloudCompleteMultipartUpload(
      {
        contractFileId: A,
        s3UploadId: d,
        s3Parts: u,
        blockChainUploadId: m
      },
      { headers: t }
    )).data;
  }
}
export {
  O as RCDEClient2Legged,
  R as RCDEClient3Legged,
  q as chunkedUpload
};
