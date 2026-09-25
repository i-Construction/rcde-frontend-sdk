var Cs = Object.defineProperty;
var Os = (e, t, r) => t in e ? Cs(e, t, { enumerable: !0, configurable: !0, writable: !0, value: r }) : e[t] = r;
var kr = (e, t, r) => Os(e, typeof t != "symbol" ? t + "" : t, r);
import { jsx as Le, jsxs as Ht } from "react/jsx-runtime";
import * as _t from "react";
import { useState as vt, useRef as Ce, useCallback as Ze, useMemo as st, useContext as En, createContext as wi, forwardRef as Ps, useEffect as et, useLayoutEffect as Sn } from "react";
import { Vector3 as nt, Box3 as Qo, Vector2 as ea, Euler as Is, DoubleSide as Ls, Color as Ms, Quaternion as Ns, Raycaster as ta, Matrix4 as ra, Points as Bs } from "three";
import { MapControls as Fs, Grid as Ds, GizmoHelper as Us, GizmoViewport as js, Html as zs } from "@react-three/drei";
import { Canvas as Hs, useThree as $r, useFrame as na } from "@react-three/fiber";
import { pngParser as $s, PointCloud as Ws } from "@i-con/pcd-viewer";
const Pr = {
  /** 開始 */
  start: 1,
  /** 進行中 */
  inProgress: 2,
  /** 完了 */
  finish: 3,
  /** 失敗（PCLOD ジョブが error.json を出力した） */
  failed: 4
}, Zs = Object.values(Pr);
function Gs(e) {
  return typeof e == "number" && Zs.includes(e);
}
function ia(e) {
  const { contractId: t, name: r, buffer: i, pointCloudAttribute: n } = e;
  return {
    contractId: t,
    name: r,
    size: i.byteLength,
    pointCloudAttribute: n ?? {}
  };
}
function Ys(e) {
  return {
    method: "PUT",
    body: e
  };
}
function Vs(e) {
  return { contractId: e };
}
function Ks(e, t) {
  return {
    method: "POST",
    headers: t,
    body: JSON.stringify(e)
  };
}
function qs(e, t) {
  return {
    method: "PUT",
    headers: t,
    body: JSON.stringify(Vs(e))
  };
}
const Xs = 100 * 1024 * 1024;
function Js(e, t) {
  return Math.ceil(e / t);
}
function Qs(e, t, r) {
  const i = t * r, n = Math.min(i + r, e.byteLength);
  return e.slice(i, n);
}
function el(e) {
  const { contractId: t, name: r, buffer: i, chunkSize: n, pointCloudAttribute: o } = e;
  return {
    ...ia({ contractId: t, name: r, buffer: i, pointCloudAttribute: o }),
    partTotal: Js(i.byteLength, n)
  };
}
function tl(e) {
  return e.map(({ partNumber: t, etag: r }) => ({ partNumber: t, etag: r }));
}
function rl(e) {
  return {
    contractFileId: e.contractFileId,
    s3UploadId: e.s3UploadId,
    s3Parts: e.s3Parts,
    blockChainUploadId: e.blockChainUploadId
  };
}
function nl(e) {
  return {
    contractFileId: e.contractFileId,
    s3UploadId: e.s3UploadId,
    blockChainUploadId: e.blockChainUploadId
  };
}
function il(e, t) {
  return {
    method: "POST",
    headers: t,
    body: JSON.stringify(e)
  };
}
function ol(e, t) {
  return {
    method: "PUT",
    headers: t,
    body: JSON.stringify(e)
  };
}
function al(e, t) {
  return {
    method: "DELETE",
    headers: t,
    body: JSON.stringify(e)
  };
}
function sl(e, t) {
  if (e.length !== t.length)
    throw new Error(
      `Invalid multipart upload start response: presignedUploadParts length (${e.length}) does not match blockChainUploadURLs length (${t.length})`
    );
}
async function ll(e, t) {
  const { getApiPath: r, fetchImpl: i, getAuthHeaders: n } = e, o = r("/contractFile/pointCloud/deleteMultipartUpload"), a = nl(t);
  await i(o, al(a, n()));
}
async function fl(e, t) {
  const { contractId: r, name: i, buffer: n, pointCloudAttribute: o, chunkSize: a, onUploadProgress: l } = t, { getApiPath: f, fetchImpl: h, getAuthHeaders: s } = e, u = a ?? Xs, c = f("/contractFile/pointCloud/multipartUpload"), p = el({
    contractId: r,
    name: i,
    buffer: n,
    chunkSize: u,
    pointCloudAttribute: o
  }), m = await h(
    c,
    il(p, s())
  );
  if (!m.ok) throw new Error(`HTTP ${m.status}`);
  const d = await m.json(), {
    contractFileId: _,
    s3UploadId: v,
    presignedUploadParts: k,
    blockChainUploadId: E,
    blockChainUploadURLs: T
  } = d;
  sl(k, T), t.onContractFileCreated !== void 0 && t.onContractFileCreated(_);
  let x = 0;
  try {
    const A = await Promise.all(
      k.map(async (N, j) => {
        const $ = Qs(n, j, u), re = await h(N.presignedURL, {
          method: "PUT",
          body: $
        });
        if (!re.ok) throw new Error(`Upload failed: HTTP ${re.status}`);
        const ne = re.headers.get("etag");
        if (ne === null || ne === "")
          throw new Error("Upload failed: missing ETag in S3 response");
        const U = T[j], P = new FormData();
        P.append("file", new Blob([$]));
        const D = await h(U, {
          method: "PUT",
          body: P
        });
        if (!D.ok) throw new Error(`Upload failed: HTTP ${D.status}`);
        return x += 1, l !== void 0 && l(x, k.length), { partNumber: N.partNumber, etag: ne };
      })
    ), I = tl(A), R = f("/contractFile/pointCloud/completeMultipartUpload"), M = rl({
      contractFileId: _,
      s3UploadId: v,
      s3Parts: I,
      blockChainUploadId: E
    }), b = await h(
      R,
      ol(M, s())
    );
    if (!b.ok)
      throw new Error(`Complete multipart upload failed: HTTP ${b.status}`);
    return { contractFileId: _ };
  } catch (A) {
    try {
      await ll(e, { contractFileId: _, s3UploadId: v, blockChainUploadId: E });
    } catch {
    }
    throw A;
  }
}
async function cl(e, t) {
  const { contractId: r, name: i, buffer: n, pointCloudAttribute: o } = t, { getApiPath: a, fetchImpl: l, getAuthHeaders: f } = e, h = a("/contractFile/pointCloud"), s = ia({
    contractId: r,
    name: i,
    buffer: n,
    pointCloudAttribute: o
  }), u = await l(
    h,
    Ks(s, f())
  );
  if (!u.ok) throw new Error(`HTTP ${u.status}`);
  const c = await u.json();
  t.onContractFileCreated !== void 0 && t.onContractFileCreated(c.contractFileId);
  const p = Ys(n), m = await l(c.presignedURL, p);
  if (!m.ok) throw new Error(`Upload failed: HTTP ${m.status}`);
  const d = a(`/contractFile/uploaded/${c.contractFileId}`), _ = await l(
    d,
    qs(r, f())
  );
  if (!_.ok) throw new Error(`Complete upload failed: HTTP ${_.status}`);
  return await _.json();
}
const ul = {
  "2legged": "/ext/v2/authenticated",
  "3legged": "/ext/v2/userAuthenticated"
};
async function Yi(e, t, r, i = {}) {
  const n = await e(t, { ...i, headers: r });
  if (!n.ok) throw new Error(`HTTP ${n.status}`);
  return n;
}
function Ir(e, t) {
  const r = t.toString();
  return r ? `${e}?${r}` : e;
}
function ci(e, t, r) {
  t === "2legged" && e.append("contractId", String(r));
}
function Vi(e, t, r) {
  const { contractId: i, contractFileId: n, level: o = 0, addr: a = "0-0-0" } = r, l = new URLSearchParams({
    contractFileId: String(n),
    level: String(o),
    addr: a
  });
  return ci(l, t, i), Ir(e, l);
}
class dl {
  constructor(t = {}) {
    kr(this, "baseUrl");
    kr(this, "token");
    kr(this, "authType");
    kr(this, "fetchImpl");
    this.baseUrl = t.baseUrl ?? "", this.token = t.accessToken, this.authType = t.authType ?? "2legged", this.fetchImpl = t.fetchImpl ?? fetch.bind(globalThis);
  }
  headers() {
    const t = { "Content-Type": "application/json" };
    return this.token && (t.Authorization = `Bearer ${this.token}`), t;
  }
  getApiPath(t) {
    return `${this.baseUrl}${ul[this.authType]}${t}`;
  }
  /** R-CDE の応答を JSON として読む。失敗は sendRcdeRequest 側。T は検証せず信じた形。parse は呼び出し側 */
  async requestJson(t, r = {}) {
    return await (await Yi(this.fetchImpl, t, this.headers(), r)).json();
  }
  /** R-CDE の応答をバイナリのまま読む。点群タイル画像はここを通す（JSON へ寄せると読めなくなる） */
  async requestArrayBuffer(t) {
    return await (await Yi(this.fetchImpl, t, this.headers())).arrayBuffer();
  }
  // ---- 既存で使われている想定のAPI ----
  // Viewer などで使用
  async getContractFileList(t) {
    const { contractId: r } = t, i = new URLSearchParams({ contractId: String(r) }), n = Ir(this.getApiPath("/contractFile"), i);
    return { contractFiles: ((await this.requestJson(n)).contractFiles ?? []).map(yl) };
  }
  async getContractFileMetadata(t) {
    const { contractId: r, contractFileId: i } = t, n = new URLSearchParams({
      contractFileId: String(i)
    });
    ci(n, this.authType, r);
    const o = Ir(this.getApiPath("/pclod/meta"), n);
    return this.requestJson(o);
  }
  // 画像（位置）バッファ
  async getContractFileImagePosition(t) {
    const r = Vi(this.getApiPath("/pclod/imagePosition"), this.authType, t);
    return this.requestArrayBuffer(r);
  }
  // 画像（色）バッファ
  async getContractFileImageColor(t) {
    const r = Vi(this.getApiPath("/pclod/imageColor"), this.authType, t);
    return this.requestArrayBuffer(r);
  }
  // ダウンロードURL
  async getContractFileDownloadUrl(t, r) {
    const i = new URLSearchParams();
    ci(i, this.authType, t);
    const n = Ir(
      this.getApiPath(`/contractFile/downloadURL/${r}`),
      i
    ), o = await this.requestJson(n), a = o.presignedURL ?? o.url ?? "";
    return { url: a, presignedURL: a };
  }
  // アップロード開始（点群アップロードAPIを使用）
  async uploadContractFile(t) {
    return cl(
      {
        getApiPath: (r) => this.getApiPath(r),
        fetchImpl: this.fetchImpl,
        getAuthHeaders: () => this.headers()
      },
      t
    );
  }
  // チャンク分割アップロード（点群マルチパートアップロードAPIを使用）
  async uploadContractFileMultipart(t) {
    return fl(
      {
        getApiPath: (r) => this.getApiPath(r),
        fetchImpl: this.fetchImpl,
        getAuthHeaders: () => this.headers()
      },
      t
    );
  }
  // Construction関連のAPI
  async getConstructionList() {
    const t = this.getApiPath("/construction");
    return { constructions: ((await this.requestJson(t)).constructions ?? []).map(Ki) };
  }
  async getConstruction(t) {
    const r = this.getApiPath(`/construction/${t}`);
    return Ki(await this.requestJson(r));
  }
  async createConstruction(t) {
    const r = this.getApiPath("/construction");
    return this.requestJson(r, {
      method: "POST",
      body: JSON.stringify(t)
    });
  }
  // Contract関連のAPI
  async getContractList(t) {
    const { constructionId: r } = t, i = new URLSearchParams();
    (this.authType === "2legged" || r) && i.append("constructionId", String(r));
    const n = Ir(this.getApiPath("/contract"), i);
    return { contracts: ((await this.requestJson(n)).contracts ?? []).map(pl) };
  }
  /**
   * 契約を作成する。2legged のみ対応。
   *
   * status は受け取らない。R-CDE の契約作成 API（ContractCreateFor2LeggedParams /
   * ContractCreateFor3LeggedParams）に status フィールドが無く、送っても echo の Bind が捨てるため。
   * 作成直後の状態は R-CDE 側が決める（2-legged は受注者がダミーなので承認済みまで自動で進む）。
   *
   * 3legged はリクエストを組み立てる前に落とす。R-CDE の ContractCreateFor3LeggedParams は
   * contracteeEmail / contractorEmail のどちらか一方を必須にし（required_without の相互指定）、
   * さらにどちらを渡したかで呼び出し元が受注者か注文者かまで変わる。この分岐を表せる引数を
   * まだ持たないので、送っても必ず 400 になる。飛ばしてから失敗させると呼び出し側には
   * R-CDE 側の入力不備と区別が付かないため、SDK 側の未対応であることが分かる形で止める。
   */
  async createContract(t) {
    if (this.authType === "3legged")
      throw new Error(
        "[RCDEClient] createContract は 2legged のみ対応しています（3legged は contracteeEmail / contractorEmail が必須で、SDK が未対応です）"
      );
    const { constructionId: r, name: i, contractedAt: n, unitPrice: o, unitVolume: a } = t, l = this.getApiPath("/contract"), f = {
      name: i,
      contractedAt: n,
      constructionId: r,
      unitPrice: o,
      unitVolume: a
    };
    return this.requestJson(l, {
      method: "POST",
      body: JSON.stringify(f)
    });
  }
}
function hl(e) {
  if (e == null) return;
  const { id: t, status: r } = e;
  if (typeof t == "number" && typeof r == "number")
    return Gs(r) ? { id: t, status: r, rawStatus: r } : { id: t, rawStatus: r };
}
function Ei(e) {
  return typeof e == "number" && Number.isSafeInteger(e) ? e : void 0;
}
function Ki(e) {
  return { ...e, id: Ei(e.id) };
}
function pl(e) {
  return { ...e, id: Ei(e.id) };
}
function yl(e) {
  const t = hl(e.batchProcessingResult);
  return {
    id: Ei(e.id),
    name: e.name,
    status: e.status,
    uploadedAt: e.uploadedAt,
    batchProcessingResult: t
  };
}
const oa = wi(void 0), gl = ({ children: e }) => {
  const [t, r] = vt(), [i, n] = vt(), o = Ce(void 0), a = Ze((f) => {
    const h = JSON.stringify({
      token: f.token,
      baseUrl: f.baseUrl,
      authType: f.authType
    });
    if (h === o.current)
      return;
    o.current = h;
    const s = new dl({
      accessToken: f.token,
      baseUrl: f.baseUrl,
      authType: f.authType
    });
    r(s);
  }, []), l = st(
    () => ({ client: t, initialize: a, project: i, setProject: n }),
    [t, a, i, n]
  );
  return /* @__PURE__ */ Le(oa.Provider, { value: l, children: e });
}, Tn = () => {
  const e = En(oa);
  if (!e)
    throw new Error("useClient must be used within a ClientProvider");
  return e;
}, aa = (e, t) => t === void 0 ? !0 : e.id !== void 0 && t.has(e.id), sa = (e) => e === void 0 ? void 0 : new Set(e), ml = (e, t) => {
  const r = sa(t);
  return e.map((i) => ({
    file: i,
    visible: aa(i, r)
  }));
}, bl = (e, t, r) => {
  const i = /* @__PURE__ */ new Map();
  for (const o of e)
    o.file.id !== void 0 && i.set(o.file.id, o.visible);
  const n = sa(r);
  return t.map((o) => {
    const a = o.id === void 0 ? void 0 : i.get(o.id);
    return {
      file: o,
      visible: a ?? aa(o, n)
    };
  });
}, la = wi(void 0);
function _l(e, t) {
  const r = (i) => i === t || i.file.id !== void 0 && i.file.id === t.file.id;
  return e.map(
    (i) => r(i) ? { ...i, visible: !i.visible } : i
  );
}
const vl = ({ children: e }) => {
  const [t, r] = vt([]), i = Ce(void 0), n = Ze((f, h) => {
    i.current = h, r(ml(f, h));
  }, []), o = Ze((f) => {
    r(
      (h) => bl(h, f, i.current)
    );
  }, []), a = Ze((f) => {
    r((h) => _l(h, f));
  }, []), l = st(
    () => ({ load: n, updateFiles: o, toggleVisibility: a, containers: t }),
    [n, o, a, t]
  );
  return /* @__PURE__ */ Le(la.Provider, { value: l, children: e });
}, Si = () => {
  const e = En(la);
  if (!e)
    throw new Error("useContractFiles must be used within a ContractFilesProvider");
  return e;
};
function wl(e) {
  return e.uploadedAt !== void 0 && e.uploadedAt.length > 0;
}
function fa(e) {
  if (e === void 0) return "waiting";
  const t = e.status;
  if (t === void 0) return "unknown";
  switch (t) {
    case Pr.start:
    case Pr.inProgress:
      return "processing";
    case Pr.finish:
      return "completed";
    case Pr.failed:
      return "failed";
    default:
      return t;
  }
}
function pn(e) {
  return fa(e.batchProcessingResult) === "completed";
}
function El(e, t) {
  return t ? { upload: "uploading", pclod: "none" } : wl(e) ? { upload: "uploaded", pclod: fa(e.batchProcessingResult) } : { upload: "uploading", pclod: "waiting" };
}
function Yp(e) {
  if (e.upload === "uploading") return !0;
  switch (e.pclod) {
    case "waiting":
    case "processing":
      return !0;
    case "none":
    case "completed":
    case "failed":
    case "unknown":
      return !1;
    default:
      return e.pclod;
  }
}
const ca = wi(void 0), Sl = ({ children: e }) => {
  const [t, r] = vt(new nt(0, 0, 0)), { client: i, project: n } = Tn(), { containers: o } = Si(), a = Ze(
    (h) => {
      r(h);
    },
    [r]
  ), l = Ze(
    async (h) => {
      if (!i || !n) return !1;
      const s = o.find((u) => u.file.id === h);
      if (!s || !pn(s.file)) return !1;
      try {
        const c = await i.getContractFileMetadata({
          ...n,
          contractFileId: h
        }), { min: p, max: m } = c.bounds, _ = new Qo(new nt().fromArray(p), new nt().fromArray(m)).getCenter(new nt());
        return a(_.negate()), !0;
      } catch (u) {
        return console.error("[useReferencePoint] Failed to focus file:", u), !1;
      }
    },
    [i, n, o, a]
  ), f = st(
    () => ({ point: t, change: a, focusFileById: l }),
    [t, a, l]
  );
  return /* @__PURE__ */ Le(ca.Provider, { value: f, children: e });
}, ua = () => {
  const e = En(ca);
  if (!e)
    throw new Error("useReferencePoint must be used within a ReferencePointProvider");
  return e;
}, Dr = {
  black: "#000",
  white: "#fff"
}, sr = {
  300: "#e57373",
  400: "#ef5350",
  500: "#f44336",
  700: "#d32f2f",
  800: "#c62828"
}, lr = {
  50: "#f3e5f5",
  200: "#ce93d8",
  300: "#ba68c8",
  400: "#ab47bc",
  500: "#9c27b0",
  700: "#7b1fa2"
}, fr = {
  50: "#e3f2fd",
  200: "#90caf9",
  400: "#42a5f5",
  700: "#1976d2",
  800: "#1565c0"
}, cr = {
  300: "#4fc3f7",
  400: "#29b6f6",
  500: "#03a9f4",
  700: "#0288d1",
  900: "#01579b"
}, ur = {
  300: "#81c784",
  400: "#66bb6a",
  500: "#4caf50",
  700: "#388e3c",
  800: "#2e7d32",
  900: "#1b5e20"
}, Cr = {
  300: "#ffb74d",
  400: "#ffa726",
  500: "#ff9800",
  700: "#f57c00",
  900: "#e65100"
}, Tl = {
  50: "#fafafa",
  100: "#f5f5f5",
  200: "#eeeeee",
  300: "#e0e0e0",
  400: "#bdbdbd",
  500: "#9e9e9e",
  600: "#757575",
  700: "#616161",
  800: "#424242",
  900: "#212121",
  A100: "#f5f5f5",
  A200: "#eeeeee",
  A400: "#bdbdbd",
  A700: "#616161"
};
function Jt(e, ...t) {
  const r = new URL(`https://mui.com/production-error/?code=${e}`);
  return t.forEach((i) => r.searchParams.append("args[]", i)), `Minified MUI error #${e}; visit ${r} for the full message.`;
}
const da = "$$material";
function ui() {
  return ui = Object.assign ? Object.assign.bind() : function(e) {
    for (var t = 1; t < arguments.length; t++) {
      var r = arguments[t];
      for (var i in r) ({}).hasOwnProperty.call(r, i) && (e[i] = r[i]);
    }
    return e;
  }, ui.apply(null, arguments);
}
function Al(e) {
  if (e.sheet)
    return e.sheet;
  for (var t = 0; t < document.styleSheets.length; t++)
    if (document.styleSheets[t].ownerNode === e)
      return document.styleSheets[t];
}
function Rl(e) {
  var t = document.createElement("style");
  return t.setAttribute("data-emotion", e.key), e.nonce !== void 0 && t.setAttribute("nonce", e.nonce), t.appendChild(document.createTextNode("")), t.setAttribute("data-s", ""), t;
}
var xl = /* @__PURE__ */ (function() {
  function e(r) {
    var i = this;
    this._insertTag = function(n) {
      var o;
      i.tags.length === 0 ? i.insertionPoint ? o = i.insertionPoint.nextSibling : i.prepend ? o = i.container.firstChild : o = i.before : o = i.tags[i.tags.length - 1].nextSibling, i.container.insertBefore(n, o), i.tags.push(n);
    }, this.isSpeedy = r.speedy === void 0 ? !0 : r.speedy, this.tags = [], this.ctr = 0, this.nonce = r.nonce, this.key = r.key, this.container = r.container, this.prepend = r.prepend, this.insertionPoint = r.insertionPoint, this.before = null;
  }
  var t = e.prototype;
  return t.hydrate = function(i) {
    i.forEach(this._insertTag);
  }, t.insert = function(i) {
    this.ctr % (this.isSpeedy ? 65e3 : 1) === 0 && this._insertTag(Rl(this));
    var n = this.tags[this.tags.length - 1];
    if (this.isSpeedy) {
      var o = Al(n);
      try {
        o.insertRule(i, o.cssRules.length);
      } catch {
      }
    } else
      n.appendChild(document.createTextNode(i));
    this.ctr++;
  }, t.flush = function() {
    this.tags.forEach(function(i) {
      var n;
      return (n = i.parentNode) == null ? void 0 : n.removeChild(i);
    }), this.tags = [], this.ctr = 0;
  }, e;
})(), bt = "-ms-", yn = "-moz-", $e = "-webkit-", ha = "comm", Ti = "rule", Ai = "decl", kl = "@import", pa = "@keyframes", Cl = "@layer", Ol = Math.abs, An = String.fromCharCode, Pl = Object.assign;
function Il(e, t) {
  return yt(e, 0) ^ 45 ? (((t << 2 ^ yt(e, 0)) << 2 ^ yt(e, 1)) << 2 ^ yt(e, 2)) << 2 ^ yt(e, 3) : 0;
}
function ya(e) {
  return e.trim();
}
function Ll(e, t) {
  return (e = t.exec(e)) ? e[0] : e;
}
function We(e, t, r) {
  return e.replace(t, r);
}
function di(e, t) {
  return e.indexOf(t);
}
function yt(e, t) {
  return e.charCodeAt(t) | 0;
}
function Ur(e, t, r) {
  return e.slice(t, r);
}
function Ut(e) {
  return e.length;
}
function Ri(e) {
  return e.length;
}
function qr(e, t) {
  return t.push(e), e;
}
function Ml(e, t) {
  return e.map(t).join("");
}
var Rn = 1, _r = 1, ga = 0, Rt = 0, dt = 0, Sr = "";
function xn(e, t, r, i, n, o, a) {
  return { value: e, root: t, parent: r, type: i, props: n, children: o, line: Rn, column: _r, length: a, return: "" };
}
function Or(e, t) {
  return Pl(xn("", null, null, "", null, null, 0), e, { length: -e.length }, t);
}
function Nl() {
  return dt;
}
function Bl() {
  return dt = Rt > 0 ? yt(Sr, --Rt) : 0, _r--, dt === 10 && (_r = 1, Rn--), dt;
}
function kt() {
  return dt = Rt < ga ? yt(Sr, Rt++) : 0, _r++, dt === 10 && (_r = 1, Rn++), dt;
}
function $t() {
  return yt(Sr, Rt);
}
function fn() {
  return Rt;
}
function Wr(e, t) {
  return Ur(Sr, e, t);
}
function jr(e) {
  switch (e) {
    // \0 \t \n \r \s whitespace token
    case 0:
    case 9:
    case 10:
    case 13:
    case 32:
      return 5;
    // ! + , / > @ ~ isolate token
    case 33:
    case 43:
    case 44:
    case 47:
    case 62:
    case 64:
    case 126:
    // ; { } breakpoint token
    case 59:
    case 123:
    case 125:
      return 4;
    // : accompanied token
    case 58:
      return 3;
    // " ' ( [ opening delimit token
    case 34:
    case 39:
    case 40:
    case 91:
      return 2;
    // ) ] closing delimit token
    case 41:
    case 93:
      return 1;
  }
  return 0;
}
function ma(e) {
  return Rn = _r = 1, ga = Ut(Sr = e), Rt = 0, [];
}
function ba(e) {
  return Sr = "", e;
}
function cn(e) {
  return ya(Wr(Rt - 1, hi(e === 91 ? e + 2 : e === 40 ? e + 1 : e)));
}
function Fl(e) {
  for (; (dt = $t()) && dt < 33; )
    kt();
  return jr(e) > 2 || jr(dt) > 3 ? "" : " ";
}
function Dl(e, t) {
  for (; --t && kt() && !(dt < 48 || dt > 102 || dt > 57 && dt < 65 || dt > 70 && dt < 97); )
    ;
  return Wr(e, fn() + (t < 6 && $t() == 32 && kt() == 32));
}
function hi(e) {
  for (; kt(); )
    switch (dt) {
      // ] ) " '
      case e:
        return Rt;
      // " '
      case 34:
      case 39:
        e !== 34 && e !== 39 && hi(dt);
        break;
      // (
      case 40:
        e === 41 && hi(e);
        break;
      // \
      case 92:
        kt();
        break;
    }
  return Rt;
}
function Ul(e, t) {
  for (; kt() && e + dt !== 57; )
    if (e + dt === 84 && $t() === 47)
      break;
  return "/*" + Wr(t, Rt - 1) + "*" + An(e === 47 ? e : kt());
}
function jl(e) {
  for (; !jr($t()); )
    kt();
  return Wr(e, Rt);
}
function zl(e) {
  return ba(un("", null, null, null, [""], e = ma(e), 0, [0], e));
}
function un(e, t, r, i, n, o, a, l, f) {
  for (var h = 0, s = 0, u = a, c = 0, p = 0, m = 0, d = 1, _ = 1, v = 1, k = 0, E = "", T = n, x = o, A = i, I = E; _; )
    switch (m = k, k = kt()) {
      // (
      case 40:
        if (m != 108 && yt(I, u - 1) == 58) {
          di(I += We(cn(k), "&", "&\f"), "&\f") != -1 && (v = -1);
          break;
        }
      // " ' [
      case 34:
      case 39:
      case 91:
        I += cn(k);
        break;
      // \t \n \r \s
      case 9:
      case 10:
      case 13:
      case 32:
        I += Fl(m);
        break;
      // \
      case 92:
        I += Dl(fn() - 1, 7);
        continue;
      // /
      case 47:
        switch ($t()) {
          case 42:
          case 47:
            qr(Hl(Ul(kt(), fn()), t, r), f);
            break;
          default:
            I += "/";
        }
        break;
      // {
      case 123 * d:
        l[h++] = Ut(I) * v;
      // } ; \0
      case 125 * d:
      case 59:
      case 0:
        switch (k) {
          // \0 }
          case 0:
          case 125:
            _ = 0;
          // ;
          case 59 + s:
            v == -1 && (I = We(I, /\f/g, "")), p > 0 && Ut(I) - u && qr(p > 32 ? Xi(I + ";", i, r, u - 1) : Xi(We(I, " ", "") + ";", i, r, u - 2), f);
            break;
          // @ ;
          case 59:
            I += ";";
          // { rule/at-rule
          default:
            if (qr(A = qi(I, t, r, h, s, n, l, E, T = [], x = [], u), o), k === 123)
              if (s === 0)
                un(I, t, A, A, T, o, u, l, x);
              else
                switch (c === 99 && yt(I, 3) === 110 ? 100 : c) {
                  // d l m s
                  case 100:
                  case 108:
                  case 109:
                  case 115:
                    un(e, A, A, i && qr(qi(e, A, A, 0, 0, n, l, E, n, T = [], u), x), n, x, u, l, i ? T : x);
                    break;
                  default:
                    un(I, A, A, A, [""], x, 0, l, x);
                }
        }
        h = s = p = 0, d = v = 1, E = I = "", u = a;
        break;
      // :
      case 58:
        u = 1 + Ut(I), p = m;
      default:
        if (d < 1) {
          if (k == 123)
            --d;
          else if (k == 125 && d++ == 0 && Bl() == 125)
            continue;
        }
        switch (I += An(k), k * d) {
          // &
          case 38:
            v = s > 0 ? 1 : (I += "\f", -1);
            break;
          // ,
          case 44:
            l[h++] = (Ut(I) - 1) * v, v = 1;
            break;
          // @
          case 64:
            $t() === 45 && (I += cn(kt())), c = $t(), s = u = Ut(E = I += jl(fn())), k++;
            break;
          // -
          case 45:
            m === 45 && Ut(I) == 2 && (d = 0);
        }
    }
  return o;
}
function qi(e, t, r, i, n, o, a, l, f, h, s) {
  for (var u = n - 1, c = n === 0 ? o : [""], p = Ri(c), m = 0, d = 0, _ = 0; m < i; ++m)
    for (var v = 0, k = Ur(e, u + 1, u = Ol(d = a[m])), E = e; v < p; ++v)
      (E = ya(d > 0 ? c[v] + " " + k : We(k, /&\f/g, c[v]))) && (f[_++] = E);
  return xn(e, t, r, n === 0 ? Ti : l, f, h, s);
}
function Hl(e, t, r) {
  return xn(e, t, r, ha, An(Nl()), Ur(e, 2, -2), 0);
}
function Xi(e, t, r, i) {
  return xn(e, t, r, Ai, Ur(e, 0, i), Ur(e, i + 1, -1), i);
}
function mr(e, t) {
  for (var r = "", i = Ri(e), n = 0; n < i; n++)
    r += t(e[n], n, e, t) || "";
  return r;
}
function $l(e, t, r, i) {
  switch (e.type) {
    case Cl:
      if (e.children.length) break;
    case kl:
    case Ai:
      return e.return = e.return || e.value;
    case ha:
      return "";
    case pa:
      return e.return = e.value + "{" + mr(e.children, i) + "}";
    case Ti:
      e.value = e.props.join(",");
  }
  return Ut(r = mr(e.children, i)) ? e.return = e.value + "{" + r + "}" : "";
}
function Wl(e) {
  var t = Ri(e);
  return function(r, i, n, o) {
    for (var a = "", l = 0; l < t; l++)
      a += e[l](r, i, n, o) || "";
    return a;
  };
}
function Zl(e) {
  return function(t) {
    t.root || (t = t.return) && e(t);
  };
}
function _a(e) {
  var t = /* @__PURE__ */ Object.create(null);
  return function(r) {
    return t[r] === void 0 && (t[r] = e(r)), t[r];
  };
}
var Gl = function(t, r, i) {
  for (var n = 0, o = 0; n = o, o = $t(), n === 38 && o === 12 && (r[i] = 1), !jr(o); )
    kt();
  return Wr(t, Rt);
}, Yl = function(t, r) {
  var i = -1, n = 44;
  do
    switch (jr(n)) {
      case 0:
        n === 38 && $t() === 12 && (r[i] = 1), t[i] += Gl(Rt - 1, r, i);
        break;
      case 2:
        t[i] += cn(n);
        break;
      case 4:
        if (n === 44) {
          t[++i] = $t() === 58 ? "&\f" : "", r[i] = t[i].length;
          break;
        }
      // fallthrough
      default:
        t[i] += An(n);
    }
  while (n = kt());
  return t;
}, Vl = function(t, r) {
  return ba(Yl(ma(t), r));
}, Ji = /* @__PURE__ */ new WeakMap(), Kl = function(t) {
  if (!(t.type !== "rule" || !t.parent || // positive .length indicates that this rule contains pseudo
  // negative .length indicates that this rule has been already prefixed
  t.length < 1)) {
    for (var r = t.value, i = t.parent, n = t.column === i.column && t.line === i.line; i.type !== "rule"; )
      if (i = i.parent, !i) return;
    if (!(t.props.length === 1 && r.charCodeAt(0) !== 58 && !Ji.get(i)) && !n) {
      Ji.set(t, !0);
      for (var o = [], a = Vl(r, o), l = i.props, f = 0, h = 0; f < a.length; f++)
        for (var s = 0; s < l.length; s++, h++)
          t.props[h] = o[f] ? a[f].replace(/&\f/g, l[s]) : l[s] + " " + a[f];
    }
  }
}, ql = function(t) {
  if (t.type === "decl") {
    var r = t.value;
    // charcode for l
    r.charCodeAt(0) === 108 && // charcode for b
    r.charCodeAt(2) === 98 && (t.return = "", t.value = "");
  }
};
function va(e, t) {
  switch (Il(e, t)) {
    // color-adjust
    case 5103:
      return $e + "print-" + e + e;
    // animation, animation-(delay|direction|duration|fill-mode|iteration-count|name|play-state|timing-function)
    case 5737:
    case 4201:
    case 3177:
    case 3433:
    case 1641:
    case 4457:
    case 2921:
    // text-decoration, filter, clip-path, backface-visibility, column, box-decoration-break
    case 5572:
    case 6356:
    case 5844:
    case 3191:
    case 6645:
    case 3005:
    // mask, mask-image, mask-(mode|clip|size), mask-(repeat|origin), mask-position, mask-composite,
    case 6391:
    case 5879:
    case 5623:
    case 6135:
    case 4599:
    case 4855:
    // background-clip, columns, column-(count|fill|gap|rule|rule-color|rule-style|rule-width|span|width)
    case 4215:
    case 6389:
    case 5109:
    case 5365:
    case 5621:
    case 3829:
      return $e + e + e;
    // appearance, user-select, transform, hyphens, text-size-adjust
    case 5349:
    case 4246:
    case 4810:
    case 6968:
    case 2756:
      return $e + e + yn + e + bt + e + e;
    // flex, flex-direction
    case 6828:
    case 4268:
      return $e + e + bt + e + e;
    // order
    case 6165:
      return $e + e + bt + "flex-" + e + e;
    // align-items
    case 5187:
      return $e + e + We(e, /(\w+).+(:[^]+)/, $e + "box-$1$2" + bt + "flex-$1$2") + e;
    // align-self
    case 5443:
      return $e + e + bt + "flex-item-" + We(e, /flex-|-self/, "") + e;
    // align-content
    case 4675:
      return $e + e + bt + "flex-line-pack" + We(e, /align-content|flex-|-self/, "") + e;
    // flex-shrink
    case 5548:
      return $e + e + bt + We(e, "shrink", "negative") + e;
    // flex-basis
    case 5292:
      return $e + e + bt + We(e, "basis", "preferred-size") + e;
    // flex-grow
    case 6060:
      return $e + "box-" + We(e, "-grow", "") + $e + e + bt + We(e, "grow", "positive") + e;
    // transition
    case 4554:
      return $e + We(e, /([^-])(transform)/g, "$1" + $e + "$2") + e;
    // cursor
    case 6187:
      return We(We(We(e, /(zoom-|grab)/, $e + "$1"), /(image-set)/, $e + "$1"), e, "") + e;
    // background, background-image
    case 5495:
    case 3959:
      return We(e, /(image-set\([^]*)/, $e + "$1$`$1");
    // justify-content
    case 4968:
      return We(We(e, /(.+:)(flex-)?(.*)/, $e + "box-pack:$3" + bt + "flex-pack:$3"), /s.+-b[^;]+/, "justify") + $e + e + e;
    // (margin|padding)-inline-(start|end)
    case 4095:
    case 3583:
    case 4068:
    case 2532:
      return We(e, /(.+)-inline(.+)/, $e + "$1$2") + e;
    // (min|max)?(width|height|inline-size|block-size)
    case 8116:
    case 7059:
    case 5753:
    case 5535:
    case 5445:
    case 5701:
    case 4933:
    case 4677:
    case 5533:
    case 5789:
    case 5021:
    case 4765:
      if (Ut(e) - 1 - t > 6) switch (yt(e, t + 1)) {
        // (m)ax-content, (m)in-content
        case 109:
          if (yt(e, t + 4) !== 45) break;
        // (f)ill-available, (f)it-content
        case 102:
          return We(e, /(.+:)(.+)-([^]+)/, "$1" + $e + "$2-$3$1" + yn + (yt(e, t + 3) == 108 ? "$3" : "$2-$3")) + e;
        // (s)tretch
        case 115:
          return ~di(e, "stretch") ? va(We(e, "stretch", "fill-available"), t) + e : e;
      }
      break;
    // position: sticky
    case 4949:
      if (yt(e, t + 1) !== 115) break;
    // display: (flex|inline-flex)
    case 6444:
      switch (yt(e, Ut(e) - 3 - (~di(e, "!important") && 10))) {
        // stic(k)y
        case 107:
          return We(e, ":", ":" + $e) + e;
        // (inline-)?fl(e)x
        case 101:
          return We(e, /(.+:)([^;!]+)(;|!.+)?/, "$1" + $e + (yt(e, 14) === 45 ? "inline-" : "") + "box$3$1" + $e + "$2$3$1" + bt + "$2box$3") + e;
      }
      break;
    // writing-mode
    case 5936:
      switch (yt(e, t + 11)) {
        // vertical-l(r)
        case 114:
          return $e + e + bt + We(e, /[svh]\w+-[tblr]{2}/, "tb") + e;
        // vertical-r(l)
        case 108:
          return $e + e + bt + We(e, /[svh]\w+-[tblr]{2}/, "tb-rl") + e;
        // horizontal(-)tb
        case 45:
          return $e + e + bt + We(e, /[svh]\w+-[tblr]{2}/, "lr") + e;
      }
      return $e + e + bt + e + e;
  }
  return e;
}
var Xl = function(t, r, i, n) {
  if (t.length > -1 && !t.return) switch (t.type) {
    case Ai:
      t.return = va(t.value, t.length);
      break;
    case pa:
      return mr([Or(t, {
        value: We(t.value, "@", "@" + $e)
      })], n);
    case Ti:
      if (t.length) return Ml(t.props, function(o) {
        switch (Ll(o, /(::plac\w+|:read-\w+)/)) {
          // :read-(only|write)
          case ":read-only":
          case ":read-write":
            return mr([Or(t, {
              props: [We(o, /:(read-\w+)/, ":" + yn + "$1")]
            })], n);
          // :placeholder
          case "::placeholder":
            return mr([Or(t, {
              props: [We(o, /:(plac\w+)/, ":" + $e + "input-$1")]
            }), Or(t, {
              props: [We(o, /:(plac\w+)/, ":" + yn + "$1")]
            }), Or(t, {
              props: [We(o, /:(plac\w+)/, bt + "input-$1")]
            })], n);
        }
        return "";
      });
  }
}, Jl = [Xl], Ql = function(t) {
  var r = t.key;
  if (r === "css") {
    var i = document.querySelectorAll("style[data-emotion]:not([data-s])");
    Array.prototype.forEach.call(i, function(d) {
      var _ = d.getAttribute("data-emotion");
      _.indexOf(" ") !== -1 && (document.head.appendChild(d), d.setAttribute("data-s", ""));
    });
  }
  var n = t.stylisPlugins || Jl, o = {}, a, l = [];
  a = t.container || document.head, Array.prototype.forEach.call(
    // this means we will ignore elements which don't have a space in them which
    // means that the style elements we're looking at are only Emotion 11 server-rendered style elements
    document.querySelectorAll('style[data-emotion^="' + r + ' "]'),
    function(d) {
      for (var _ = d.getAttribute("data-emotion").split(" "), v = 1; v < _.length; v++)
        o[_[v]] = !0;
      l.push(d);
    }
  );
  var f, h = [Kl, ql];
  {
    var s, u = [$l, Zl(function(d) {
      s.insert(d);
    })], c = Wl(h.concat(n, u)), p = function(_) {
      return mr(zl(_), c);
    };
    f = function(_, v, k, E) {
      s = k, p(_ ? _ + "{" + v.styles + "}" : v.styles), E && (m.inserted[v.name] = !0);
    };
  }
  var m = {
    key: r,
    sheet: new xl({
      key: r,
      container: a,
      nonce: t.nonce,
      speedy: t.speedy,
      prepend: t.prepend,
      insertionPoint: t.insertionPoint
    }),
    nonce: t.nonce,
    inserted: o,
    registered: {},
    insert: f
  };
  return m.sheet.hydrate(l), m;
}, mt = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function ef(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var tf = !0;
function rf(e, t, r) {
  var i = "";
  return r.split(" ").forEach(function(n) {
    e[n] !== void 0 ? t.push(e[n] + ";") : n && (i += n + " ");
  }), i;
}
var wa = function(t, r, i) {
  var n = t.key + "-" + r.name;
  // we only need to add the styles to the registered cache if the
  // class name could be used further down
  // the tree but if it's a string tag, we know it won't
  // so we don't have to add it to registered cache.
  // this improves memory usage since we can avoid storing the whole style string
  (i === !1 || // we need to always store it if we're in compat mode and
  // in node since emotion-server relies on whether a style is in
  // the registered cache to know whether a style is global or not
  // also, note that this check will be dead code eliminated in the browser
  tf === !1) && t.registered[n] === void 0 && (t.registered[n] = r.styles);
}, nf = function(t, r, i) {
  wa(t, r, i);
  var n = t.key + "-" + r.name;
  if (t.inserted[r.name] === void 0) {
    var o = r;
    do
      t.insert(r === o ? "." + n : "", o, t.sheet, !0), o = o.next;
    while (o !== void 0);
  }
};
function of(e) {
  for (var t = 0, r, i = 0, n = e.length; n >= 4; ++i, n -= 4)
    r = e.charCodeAt(i) & 255 | (e.charCodeAt(++i) & 255) << 8 | (e.charCodeAt(++i) & 255) << 16 | (e.charCodeAt(++i) & 255) << 24, r = /* Math.imul(k, m): */
    (r & 65535) * 1540483477 + ((r >>> 16) * 59797 << 16), r ^= /* k >>> r: */
    r >>> 24, t = /* Math.imul(k, m): */
    (r & 65535) * 1540483477 + ((r >>> 16) * 59797 << 16) ^ /* Math.imul(h, m): */
    (t & 65535) * 1540483477 + ((t >>> 16) * 59797 << 16);
  switch (n) {
    case 3:
      t ^= (e.charCodeAt(i + 2) & 255) << 16;
    case 2:
      t ^= (e.charCodeAt(i + 1) & 255) << 8;
    case 1:
      t ^= e.charCodeAt(i) & 255, t = /* Math.imul(h, m): */
      (t & 65535) * 1540483477 + ((t >>> 16) * 59797 << 16);
  }
  return t ^= t >>> 13, t = /* Math.imul(h, m): */
  (t & 65535) * 1540483477 + ((t >>> 16) * 59797 << 16), ((t ^ t >>> 15) >>> 0).toString(36);
}
var af = {
  animationIterationCount: 1,
  aspectRatio: 1,
  borderImageOutset: 1,
  borderImageSlice: 1,
  borderImageWidth: 1,
  boxFlex: 1,
  boxFlexGroup: 1,
  boxOrdinalGroup: 1,
  columnCount: 1,
  columns: 1,
  flex: 1,
  flexGrow: 1,
  flexPositive: 1,
  flexShrink: 1,
  flexNegative: 1,
  flexOrder: 1,
  gridRow: 1,
  gridRowEnd: 1,
  gridRowSpan: 1,
  gridRowStart: 1,
  gridColumn: 1,
  gridColumnEnd: 1,
  gridColumnSpan: 1,
  gridColumnStart: 1,
  msGridRow: 1,
  msGridRowSpan: 1,
  msGridColumn: 1,
  msGridColumnSpan: 1,
  fontWeight: 1,
  lineHeight: 1,
  opacity: 1,
  order: 1,
  orphans: 1,
  scale: 1,
  tabSize: 1,
  widows: 1,
  zIndex: 1,
  zoom: 1,
  WebkitLineClamp: 1,
  // SVG-related properties
  fillOpacity: 1,
  floodOpacity: 1,
  stopOpacity: 1,
  strokeDasharray: 1,
  strokeDashoffset: 1,
  strokeMiterlimit: 1,
  strokeOpacity: 1,
  strokeWidth: 1
}, sf = /[A-Z]|^ms/g, lf = /_EMO_([^_]+?)_([^]*?)_EMO_/g, Ea = function(t) {
  return t.charCodeAt(1) === 45;
}, Qi = function(t) {
  return t != null && typeof t != "boolean";
}, jn = /* @__PURE__ */ _a(function(e) {
  return Ea(e) ? e : e.replace(sf, "-$&").toLowerCase();
}), eo = function(t, r) {
  switch (t) {
    case "animation":
    case "animationName":
      if (typeof r == "string")
        return r.replace(lf, function(i, n, o) {
          return jt = {
            name: n,
            styles: o,
            next: jt
          }, n;
        });
  }
  return af[t] !== 1 && !Ea(t) && typeof r == "number" && r !== 0 ? r + "px" : r;
};
function zr(e, t, r) {
  if (r == null)
    return "";
  var i = r;
  if (i.__emotion_styles !== void 0)
    return i;
  switch (typeof r) {
    case "boolean":
      return "";
    case "object": {
      var n = r;
      if (n.anim === 1)
        return jt = {
          name: n.name,
          styles: n.styles,
          next: jt
        }, n.name;
      var o = r;
      if (o.styles !== void 0) {
        var a = o.next;
        if (a !== void 0)
          for (; a !== void 0; )
            jt = {
              name: a.name,
              styles: a.styles,
              next: jt
            }, a = a.next;
        var l = o.styles + ";";
        return l;
      }
      return ff(e, t, r);
    }
    case "function": {
      if (e !== void 0) {
        var f = jt, h = r(e);
        return jt = f, zr(e, t, h);
      }
      break;
    }
  }
  var s = r;
  if (t == null)
    return s;
  var u = t[s];
  return u !== void 0 ? u : s;
}
function ff(e, t, r) {
  var i = "";
  if (Array.isArray(r))
    for (var n = 0; n < r.length; n++)
      i += zr(e, t, r[n]) + ";";
  else
    for (var o in r) {
      var a = r[o];
      if (typeof a != "object") {
        var l = a;
        t != null && t[l] !== void 0 ? i += o + "{" + t[l] + "}" : Qi(l) && (i += jn(o) + ":" + eo(o, l) + ";");
      } else if (Array.isArray(a) && typeof a[0] == "string" && (t == null || t[a[0]] === void 0))
        for (var f = 0; f < a.length; f++)
          Qi(a[f]) && (i += jn(o) + ":" + eo(o, a[f]) + ";");
      else {
        var h = zr(e, t, a);
        switch (o) {
          case "animation":
          case "animationName": {
            i += jn(o) + ":" + h + ";";
            break;
          }
          default:
            i += o + "{" + h + "}";
        }
      }
    }
  return i;
}
var to = /label:\s*([^\s;{]+)\s*(;|$)/g, jt;
function Sa(e, t, r) {
  if (e.length === 1 && typeof e[0] == "object" && e[0] !== null && e[0].styles !== void 0)
    return e[0];
  var i = !0, n = "";
  jt = void 0;
  var o = e[0];
  if (o == null || o.raw === void 0)
    i = !1, n += zr(r, t, o);
  else {
    var a = o;
    n += a[0];
  }
  for (var l = 1; l < e.length; l++)
    if (n += zr(r, t, e[l]), i) {
      var f = o;
      n += f[l];
    }
  to.lastIndex = 0;
  for (var h = "", s; (s = to.exec(n)) !== null; )
    h += "-" + s[1];
  var u = of(n) + h;
  return {
    name: u,
    styles: n,
    next: jt
  };
}
var cf = function(t) {
  return t();
}, uf = _t.useInsertionEffect ? _t.useInsertionEffect : !1, df = uf || cf, Ta = /* @__PURE__ */ _t.createContext(
  // we're doing this to avoid preconstruct's dead code elimination in this one case
  // because this module is primarily intended for the browser and node
  // but it's also required in react native and similar environments sometimes
  // and we could have a special build just for that
  // but this is much easier and the native packages
  // might use a different theme context in the future anyway
  typeof HTMLElement < "u" ? /* @__PURE__ */ Ql({
    key: "css"
  }) : null
);
Ta.Provider;
var hf = function(t) {
  return /* @__PURE__ */ Ps(function(r, i) {
    var n = En(Ta);
    return t(r, n, i);
  });
}, Aa = /* @__PURE__ */ _t.createContext({}), pf = /^((children|dangerouslySetInnerHTML|key|ref|autoFocus|defaultValue|defaultChecked|innerHTML|suppressContentEditableWarning|suppressHydrationWarning|valueLink|abbr|accept|acceptCharset|accessKey|action|allow|allowUserMedia|allowPaymentRequest|allowFullScreen|allowTransparency|alt|async|autoComplete|autoPlay|capture|cellPadding|cellSpacing|challenge|charSet|checked|cite|classID|className|cols|colSpan|content|contentEditable|contextMenu|controls|controlsList|coords|crossOrigin|data|dateTime|decoding|default|defer|dir|disabled|disablePictureInPicture|disableRemotePlayback|download|draggable|encType|enterKeyHint|fetchpriority|fetchPriority|form|formAction|formEncType|formMethod|formNoValidate|formTarget|frameBorder|headers|height|hidden|high|href|hrefLang|htmlFor|httpEquiv|id|inputMode|integrity|is|keyParams|keyType|kind|label|lang|list|loading|loop|low|marginHeight|marginWidth|max|maxLength|media|mediaGroup|method|min|minLength|multiple|muted|name|nonce|noValidate|open|optimum|pattern|placeholder|playsInline|popover|popoverTarget|popoverTargetAction|poster|preload|profile|radioGroup|readOnly|referrerPolicy|rel|required|reversed|role|rows|rowSpan|sandbox|scope|scoped|scrolling|seamless|selected|shape|size|sizes|slot|span|spellCheck|src|srcDoc|srcLang|srcSet|start|step|style|summary|tabIndex|target|title|translate|type|useMap|value|width|wmode|wrap|about|datatype|inlist|prefix|property|resource|typeof|vocab|autoCapitalize|autoCorrect|autoSave|color|incremental|fallback|inert|itemProp|itemScope|itemType|itemID|itemRef|on|option|results|security|unselectable|accentHeight|accumulate|additive|alignmentBaseline|allowReorder|alphabetic|amplitude|arabicForm|ascent|attributeName|attributeType|autoReverse|azimuth|baseFrequency|baselineShift|baseProfile|bbox|begin|bias|by|calcMode|capHeight|clip|clipPathUnits|clipPath|clipRule|colorInterpolation|colorInterpolationFilters|colorProfile|colorRendering|contentScriptType|contentStyleType|cursor|cx|cy|d|decelerate|descent|diffuseConstant|direction|display|divisor|dominantBaseline|dur|dx|dy|edgeMode|elevation|enableBackground|end|exponent|externalResourcesRequired|fill|fillOpacity|fillRule|filter|filterRes|filterUnits|floodColor|floodOpacity|focusable|fontFamily|fontSize|fontSizeAdjust|fontStretch|fontStyle|fontVariant|fontWeight|format|from|fr|fx|fy|g1|g2|glyphName|glyphOrientationHorizontal|glyphOrientationVertical|glyphRef|gradientTransform|gradientUnits|hanging|horizAdvX|horizOriginX|ideographic|imageRendering|in|in2|intercept|k|k1|k2|k3|k4|kernelMatrix|kernelUnitLength|kerning|keyPoints|keySplines|keyTimes|lengthAdjust|letterSpacing|lightingColor|limitingConeAngle|local|markerEnd|markerMid|markerStart|markerHeight|markerUnits|markerWidth|mask|maskContentUnits|maskUnits|mathematical|mode|numOctaves|offset|opacity|operator|order|orient|orientation|origin|overflow|overlinePosition|overlineThickness|panose1|paintOrder|pathLength|patternContentUnits|patternTransform|patternUnits|pointerEvents|points|pointsAtX|pointsAtY|pointsAtZ|preserveAlpha|preserveAspectRatio|primitiveUnits|r|radius|refX|refY|renderingIntent|repeatCount|repeatDur|requiredExtensions|requiredFeatures|restart|result|rotate|rx|ry|scale|seed|shapeRendering|slope|spacing|specularConstant|specularExponent|speed|spreadMethod|startOffset|stdDeviation|stemh|stemv|stitchTiles|stopColor|stopOpacity|strikethroughPosition|strikethroughThickness|string|stroke|strokeDasharray|strokeDashoffset|strokeLinecap|strokeLinejoin|strokeMiterlimit|strokeOpacity|strokeWidth|surfaceScale|systemLanguage|tableValues|targetX|targetY|textAnchor|textDecoration|textRendering|textLength|to|transform|u1|u2|underlinePosition|underlineThickness|unicode|unicodeBidi|unicodeRange|unitsPerEm|vAlphabetic|vHanging|vIdeographic|vMathematical|values|vectorEffect|version|vertAdvY|vertOriginX|vertOriginY|viewBox|viewTarget|visibility|widths|wordSpacing|writingMode|x|xHeight|x1|x2|xChannelSelector|xlinkActuate|xlinkArcrole|xlinkHref|xlinkRole|xlinkShow|xlinkTitle|xlinkType|xmlBase|xmlns|xmlnsXlink|xmlLang|xmlSpace|y|y1|y2|yChannelSelector|z|zoomAndPan|for|class|autofocus)|(([Dd][Aa][Tt][Aa]|[Aa][Rr][Ii][Aa]|x)-.*))$/, yf = /* @__PURE__ */ _a(
  function(e) {
    return pf.test(e) || e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && e.charCodeAt(2) < 91;
  }
  /* Z+1 */
), gf = yf, mf = function(t) {
  return t !== "theme";
}, ro = function(t) {
  return typeof t == "string" && // 96 is one less than the char code
  // for "a" so this is checking that
  // it's a lowercase character
  t.charCodeAt(0) > 96 ? gf : mf;
}, no = function(t, r, i) {
  var n;
  if (r) {
    var o = r.shouldForwardProp;
    n = t.__emotion_forwardProp && o ? function(a) {
      return t.__emotion_forwardProp(a) && o(a);
    } : o;
  }
  return typeof n != "function" && i && (n = t.__emotion_forwardProp), n;
}, bf = function(t) {
  var r = t.cache, i = t.serialized, n = t.isStringTag;
  return wa(r, i, n), df(function() {
    return nf(r, i, n);
  }), null;
}, _f = function e(t, r) {
  var i = t.__emotion_real === t, n = i && t.__emotion_base || t, o, a;
  r !== void 0 && (o = r.label, a = r.target);
  var l = no(t, r, i), f = l || ro(n), h = !f("as");
  return function() {
    var s = arguments, u = i && t.__emotion_styles !== void 0 ? t.__emotion_styles.slice(0) : [];
    if (o !== void 0 && u.push("label:" + o + ";"), s[0] == null || s[0].raw === void 0)
      u.push.apply(u, s);
    else {
      var c = s[0];
      u.push(c[0]);
      for (var p = s.length, m = 1; m < p; m++)
        u.push(s[m], c[m]);
    }
    var d = hf(function(_, v, k) {
      var E = h && _.as || n, T = "", x = [], A = _;
      if (_.theme == null) {
        A = {};
        for (var I in _)
          A[I] = _[I];
        A.theme = _t.useContext(Aa);
      }
      typeof _.className == "string" ? T = rf(v.registered, x, _.className) : _.className != null && (T = _.className + " ");
      var R = Sa(u.concat(x), v.registered, A);
      T += v.key + "-" + R.name, a !== void 0 && (T += " " + a);
      var M = h && l === void 0 ? ro(E) : f, b = {};
      for (var N in _)
        h && N === "as" || M(N) && (b[N] = _[N]);
      return b.className = T, k && (b.ref = k), /* @__PURE__ */ _t.createElement(_t.Fragment, null, /* @__PURE__ */ _t.createElement(bf, {
        cache: v,
        serialized: R,
        isStringTag: typeof E == "string"
      }), /* @__PURE__ */ _t.createElement(E, b));
    });
    return d.displayName = o !== void 0 ? o : "Styled(" + (typeof n == "string" ? n : n.displayName || n.name || "Component") + ")", d.defaultProps = t.defaultProps, d.__emotion_real = d, d.__emotion_base = n, d.__emotion_styles = u, d.__emotion_forwardProp = l, Object.defineProperty(d, "toString", {
      value: function() {
        return "." + a;
      }
    }), d.withComponent = function(_, v) {
      var k = e(_, ui({}, r, v, {
        shouldForwardProp: no(d, v, !0)
      }));
      return k.apply(void 0, u);
    }, d;
  };
}, vf = [
  "a",
  "abbr",
  "address",
  "area",
  "article",
  "aside",
  "audio",
  "b",
  "base",
  "bdi",
  "bdo",
  "big",
  "blockquote",
  "body",
  "br",
  "button",
  "canvas",
  "caption",
  "cite",
  "code",
  "col",
  "colgroup",
  "data",
  "datalist",
  "dd",
  "del",
  "details",
  "dfn",
  "dialog",
  "div",
  "dl",
  "dt",
  "em",
  "embed",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "head",
  "header",
  "hgroup",
  "hr",
  "html",
  "i",
  "iframe",
  "img",
  "input",
  "ins",
  "kbd",
  "keygen",
  "label",
  "legend",
  "li",
  "link",
  "main",
  "map",
  "mark",
  "marquee",
  "menu",
  "menuitem",
  "meta",
  "meter",
  "nav",
  "noscript",
  "object",
  "ol",
  "optgroup",
  "option",
  "output",
  "p",
  "param",
  "picture",
  "pre",
  "progress",
  "q",
  "rp",
  "rt",
  "ruby",
  "s",
  "samp",
  "script",
  "section",
  "select",
  "small",
  "source",
  "span",
  "strong",
  "style",
  "sub",
  "summary",
  "sup",
  "table",
  "tbody",
  "td",
  "textarea",
  "tfoot",
  "th",
  "thead",
  "time",
  "title",
  "tr",
  "track",
  "u",
  "ul",
  "var",
  "video",
  "wbr",
  // SVG
  "circle",
  "clipPath",
  "defs",
  "ellipse",
  "foreignObject",
  "g",
  "image",
  "line",
  "linearGradient",
  "mask",
  "path",
  "pattern",
  "polygon",
  "polyline",
  "radialGradient",
  "rect",
  "stop",
  "svg",
  "text",
  "tspan"
], pi = _f.bind(null);
vf.forEach(function(e) {
  pi[e] = pi(e);
});
var Xr = { exports: {} }, Jr = { exports: {} }, Ge = {};
/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var io;
function wf() {
  if (io) return Ge;
  io = 1;
  var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, r = e ? Symbol.for("react.portal") : 60106, i = e ? Symbol.for("react.fragment") : 60107, n = e ? Symbol.for("react.strict_mode") : 60108, o = e ? Symbol.for("react.profiler") : 60114, a = e ? Symbol.for("react.provider") : 60109, l = e ? Symbol.for("react.context") : 60110, f = e ? Symbol.for("react.async_mode") : 60111, h = e ? Symbol.for("react.concurrent_mode") : 60111, s = e ? Symbol.for("react.forward_ref") : 60112, u = e ? Symbol.for("react.suspense") : 60113, c = e ? Symbol.for("react.suspense_list") : 60120, p = e ? Symbol.for("react.memo") : 60115, m = e ? Symbol.for("react.lazy") : 60116, d = e ? Symbol.for("react.block") : 60121, _ = e ? Symbol.for("react.fundamental") : 60117, v = e ? Symbol.for("react.responder") : 60118, k = e ? Symbol.for("react.scope") : 60119;
  function E(x) {
    if (typeof x == "object" && x !== null) {
      var A = x.$$typeof;
      switch (A) {
        case t:
          switch (x = x.type, x) {
            case f:
            case h:
            case i:
            case o:
            case n:
            case u:
              return x;
            default:
              switch (x = x && x.$$typeof, x) {
                case l:
                case s:
                case m:
                case p:
                case a:
                  return x;
                default:
                  return A;
              }
          }
        case r:
          return A;
      }
    }
  }
  function T(x) {
    return E(x) === h;
  }
  return Ge.AsyncMode = f, Ge.ConcurrentMode = h, Ge.ContextConsumer = l, Ge.ContextProvider = a, Ge.Element = t, Ge.ForwardRef = s, Ge.Fragment = i, Ge.Lazy = m, Ge.Memo = p, Ge.Portal = r, Ge.Profiler = o, Ge.StrictMode = n, Ge.Suspense = u, Ge.isAsyncMode = function(x) {
    return T(x) || E(x) === f;
  }, Ge.isConcurrentMode = T, Ge.isContextConsumer = function(x) {
    return E(x) === l;
  }, Ge.isContextProvider = function(x) {
    return E(x) === a;
  }, Ge.isElement = function(x) {
    return typeof x == "object" && x !== null && x.$$typeof === t;
  }, Ge.isForwardRef = function(x) {
    return E(x) === s;
  }, Ge.isFragment = function(x) {
    return E(x) === i;
  }, Ge.isLazy = function(x) {
    return E(x) === m;
  }, Ge.isMemo = function(x) {
    return E(x) === p;
  }, Ge.isPortal = function(x) {
    return E(x) === r;
  }, Ge.isProfiler = function(x) {
    return E(x) === o;
  }, Ge.isStrictMode = function(x) {
    return E(x) === n;
  }, Ge.isSuspense = function(x) {
    return E(x) === u;
  }, Ge.isValidElementType = function(x) {
    return typeof x == "string" || typeof x == "function" || x === i || x === h || x === o || x === n || x === u || x === c || typeof x == "object" && x !== null && (x.$$typeof === m || x.$$typeof === p || x.$$typeof === a || x.$$typeof === l || x.$$typeof === s || x.$$typeof === _ || x.$$typeof === v || x.$$typeof === k || x.$$typeof === d);
  }, Ge.typeOf = E, Ge;
}
var Ye = {};
/** @license React v16.13.1
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var oo;
function Ef() {
  return oo || (oo = 1, process.env.NODE_ENV !== "production" && (function() {
    var e = typeof Symbol == "function" && Symbol.for, t = e ? Symbol.for("react.element") : 60103, r = e ? Symbol.for("react.portal") : 60106, i = e ? Symbol.for("react.fragment") : 60107, n = e ? Symbol.for("react.strict_mode") : 60108, o = e ? Symbol.for("react.profiler") : 60114, a = e ? Symbol.for("react.provider") : 60109, l = e ? Symbol.for("react.context") : 60110, f = e ? Symbol.for("react.async_mode") : 60111, h = e ? Symbol.for("react.concurrent_mode") : 60111, s = e ? Symbol.for("react.forward_ref") : 60112, u = e ? Symbol.for("react.suspense") : 60113, c = e ? Symbol.for("react.suspense_list") : 60120, p = e ? Symbol.for("react.memo") : 60115, m = e ? Symbol.for("react.lazy") : 60116, d = e ? Symbol.for("react.block") : 60121, _ = e ? Symbol.for("react.fundamental") : 60117, v = e ? Symbol.for("react.responder") : 60118, k = e ? Symbol.for("react.scope") : 60119;
    function E(ue) {
      return typeof ue == "string" || typeof ue == "function" || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
      ue === i || ue === h || ue === o || ue === n || ue === u || ue === c || typeof ue == "object" && ue !== null && (ue.$$typeof === m || ue.$$typeof === p || ue.$$typeof === a || ue.$$typeof === l || ue.$$typeof === s || ue.$$typeof === _ || ue.$$typeof === v || ue.$$typeof === k || ue.$$typeof === d);
    }
    function T(ue) {
      if (typeof ue == "object" && ue !== null) {
        var Y = ue.$$typeof;
        switch (Y) {
          case t:
            var q = ue.type;
            switch (q) {
              case f:
              case h:
              case i:
              case o:
              case n:
              case u:
                return q;
              default:
                var he = q && q.$$typeof;
                switch (he) {
                  case l:
                  case s:
                  case m:
                  case p:
                  case a:
                    return he;
                  default:
                    return Y;
                }
            }
          case r:
            return Y;
        }
      }
    }
    var x = f, A = h, I = l, R = a, M = t, b = s, N = i, j = m, $ = p, re = r, ne = o, U = n, P = u, D = !1;
    function Q(ue) {
      return D || (D = !0, console.warn("The ReactIs.isAsyncMode() alias has been deprecated, and will be removed in React 17+. Update your code to use ReactIs.isConcurrentMode() instead. It has the exact same API.")), W(ue) || T(ue) === f;
    }
    function W(ue) {
      return T(ue) === h;
    }
    function oe(ue) {
      return T(ue) === l;
    }
    function ae(ue) {
      return T(ue) === a;
    }
    function H(ue) {
      return typeof ue == "object" && ue !== null && ue.$$typeof === t;
    }
    function X(ue) {
      return T(ue) === s;
    }
    function ie(ue) {
      return T(ue) === i;
    }
    function pe(ue) {
      return T(ue) === m;
    }
    function Z(ue) {
      return T(ue) === p;
    }
    function K(ue) {
      return T(ue) === r;
    }
    function ee(ue) {
      return T(ue) === o;
    }
    function de(ue) {
      return T(ue) === n;
    }
    function ge(ue) {
      return T(ue) === u;
    }
    Ye.AsyncMode = x, Ye.ConcurrentMode = A, Ye.ContextConsumer = I, Ye.ContextProvider = R, Ye.Element = M, Ye.ForwardRef = b, Ye.Fragment = N, Ye.Lazy = j, Ye.Memo = $, Ye.Portal = re, Ye.Profiler = ne, Ye.StrictMode = U, Ye.Suspense = P, Ye.isAsyncMode = Q, Ye.isConcurrentMode = W, Ye.isContextConsumer = oe, Ye.isContextProvider = ae, Ye.isElement = H, Ye.isForwardRef = X, Ye.isFragment = ie, Ye.isLazy = pe, Ye.isMemo = Z, Ye.isPortal = K, Ye.isProfiler = ee, Ye.isStrictMode = de, Ye.isSuspense = ge, Ye.isValidElementType = E, Ye.typeOf = T;
  })()), Ye;
}
var ao;
function Ra() {
  return ao || (ao = 1, process.env.NODE_ENV === "production" ? Jr.exports = wf() : Jr.exports = Ef()), Jr.exports;
}
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
var zn, so;
function Sf() {
  if (so) return zn;
  so = 1;
  var e = Object.getOwnPropertySymbols, t = Object.prototype.hasOwnProperty, r = Object.prototype.propertyIsEnumerable;
  function i(o) {
    if (o == null)
      throw new TypeError("Object.assign cannot be called with null or undefined");
    return Object(o);
  }
  function n() {
    try {
      if (!Object.assign)
        return !1;
      var o = new String("abc");
      if (o[5] = "de", Object.getOwnPropertyNames(o)[0] === "5")
        return !1;
      for (var a = {}, l = 0; l < 10; l++)
        a["_" + String.fromCharCode(l)] = l;
      var f = Object.getOwnPropertyNames(a).map(function(s) {
        return a[s];
      });
      if (f.join("") !== "0123456789")
        return !1;
      var h = {};
      return "abcdefghijklmnopqrst".split("").forEach(function(s) {
        h[s] = s;
      }), Object.keys(Object.assign({}, h)).join("") === "abcdefghijklmnopqrst";
    } catch {
      return !1;
    }
  }
  return zn = n() ? Object.assign : function(o, a) {
    for (var l, f = i(o), h, s = 1; s < arguments.length; s++) {
      l = Object(arguments[s]);
      for (var u in l)
        t.call(l, u) && (f[u] = l[u]);
      if (e) {
        h = e(l);
        for (var c = 0; c < h.length; c++)
          r.call(l, h[c]) && (f[h[c]] = l[h[c]]);
      }
    }
    return f;
  }, zn;
}
var Hn, lo;
function xi() {
  if (lo) return Hn;
  lo = 1;
  var e = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  return Hn = e, Hn;
}
var $n, fo;
function xa() {
  return fo || (fo = 1, $n = Function.call.bind(Object.prototype.hasOwnProperty)), $n;
}
var Wn, co;
function Tf() {
  if (co) return Wn;
  co = 1;
  var e = function() {
  };
  if (process.env.NODE_ENV !== "production") {
    var t = /* @__PURE__ */ xi(), r = {}, i = /* @__PURE__ */ xa();
    e = function(o) {
      var a = "Warning: " + o;
      typeof console < "u" && console.error(a);
      try {
        throw new Error(a);
      } catch {
      }
    };
  }
  function n(o, a, l, f, h) {
    if (process.env.NODE_ENV !== "production") {
      for (var s in o)
        if (i(o, s)) {
          var u;
          try {
            if (typeof o[s] != "function") {
              var c = Error(
                (f || "React class") + ": " + l + " type `" + s + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof o[s] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`."
              );
              throw c.name = "Invariant Violation", c;
            }
            u = o[s](a, s, f, l, null, t);
          } catch (m) {
            u = m;
          }
          if (u && !(u instanceof Error) && e(
            (f || "React class") + ": type specification of " + l + " `" + s + "` is invalid; the type checker function must return `null` or an `Error` but returned a " + typeof u + ". You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument)."
          ), u instanceof Error && !(u.message in r)) {
            r[u.message] = !0;
            var p = h ? h() : "";
            e(
              "Failed " + l + " type: " + u.message + (p ?? "")
            );
          }
        }
    }
  }
  return n.resetWarningCache = function() {
    process.env.NODE_ENV !== "production" && (r = {});
  }, Wn = n, Wn;
}
var Zn, uo;
function Af() {
  if (uo) return Zn;
  uo = 1;
  var e = Ra(), t = Sf(), r = /* @__PURE__ */ xi(), i = /* @__PURE__ */ xa(), n = /* @__PURE__ */ Tf(), o = function() {
  };
  process.env.NODE_ENV !== "production" && (o = function(l) {
    var f = "Warning: " + l;
    typeof console < "u" && console.error(f);
    try {
      throw new Error(f);
    } catch {
    }
  });
  function a() {
    return null;
  }
  return Zn = function(l, f) {
    var h = typeof Symbol == "function" && Symbol.iterator, s = "@@iterator";
    function u(W) {
      var oe = W && (h && W[h] || W[s]);
      if (typeof oe == "function")
        return oe;
    }
    var c = "<<anonymous>>", p = {
      array: v("array"),
      bigint: v("bigint"),
      bool: v("boolean"),
      func: v("function"),
      number: v("number"),
      object: v("object"),
      string: v("string"),
      symbol: v("symbol"),
      any: k(),
      arrayOf: E,
      element: T(),
      elementType: x(),
      instanceOf: A,
      node: b(),
      objectOf: R,
      oneOf: I,
      oneOfType: M,
      shape: j,
      exact: $
    };
    function m(W, oe) {
      return W === oe ? W !== 0 || 1 / W === 1 / oe : W !== W && oe !== oe;
    }
    function d(W, oe) {
      this.message = W, this.data = oe && typeof oe == "object" ? oe : {}, this.stack = "";
    }
    d.prototype = Error.prototype;
    function _(W) {
      if (process.env.NODE_ENV !== "production")
        var oe = {}, ae = 0;
      function H(ie, pe, Z, K, ee, de, ge) {
        if (K = K || c, de = de || Z, ge !== r) {
          if (f) {
            var ue = new Error(
              "Calling PropTypes validators directly is not supported by the `prop-types` package. Use `PropTypes.checkPropTypes()` to call them. Read more at http://fb.me/use-check-prop-types"
            );
            throw ue.name = "Invariant Violation", ue;
          } else if (process.env.NODE_ENV !== "production" && typeof console < "u") {
            var Y = K + ":" + Z;
            !oe[Y] && // Avoid spamming the console because they are often not actionable except for lib authors
            ae < 3 && (o(
              "You are manually calling a React.PropTypes validation function for the `" + de + "` prop on `" + K + "`. This is deprecated and will throw in the standalone `prop-types` package. You may be seeing this warning due to a third-party PropTypes library. See https://fb.me/react-warning-dont-call-proptypes for details."
            ), oe[Y] = !0, ae++);
          }
        }
        return pe[Z] == null ? ie ? pe[Z] === null ? new d("The " + ee + " `" + de + "` is marked as required " + ("in `" + K + "`, but its value is `null`.")) : new d("The " + ee + " `" + de + "` is marked as required in " + ("`" + K + "`, but its value is `undefined`.")) : null : W(pe, Z, K, ee, de);
      }
      var X = H.bind(null, !1);
      return X.isRequired = H.bind(null, !0), X;
    }
    function v(W) {
      function oe(ae, H, X, ie, pe, Z) {
        var K = ae[H], ee = U(K);
        if (ee !== W) {
          var de = P(K);
          return new d(
            "Invalid " + ie + " `" + pe + "` of type " + ("`" + de + "` supplied to `" + X + "`, expected ") + ("`" + W + "`."),
            { expectedType: W }
          );
        }
        return null;
      }
      return _(oe);
    }
    function k() {
      return _(a);
    }
    function E(W) {
      function oe(ae, H, X, ie, pe) {
        if (typeof W != "function")
          return new d("Property `" + pe + "` of component `" + X + "` has invalid PropType notation inside arrayOf.");
        var Z = ae[H];
        if (!Array.isArray(Z)) {
          var K = U(Z);
          return new d("Invalid " + ie + " `" + pe + "` of type " + ("`" + K + "` supplied to `" + X + "`, expected an array."));
        }
        for (var ee = 0; ee < Z.length; ee++) {
          var de = W(Z, ee, X, ie, pe + "[" + ee + "]", r);
          if (de instanceof Error)
            return de;
        }
        return null;
      }
      return _(oe);
    }
    function T() {
      function W(oe, ae, H, X, ie) {
        var pe = oe[ae];
        if (!l(pe)) {
          var Z = U(pe);
          return new d("Invalid " + X + " `" + ie + "` of type " + ("`" + Z + "` supplied to `" + H + "`, expected a single ReactElement."));
        }
        return null;
      }
      return _(W);
    }
    function x() {
      function W(oe, ae, H, X, ie) {
        var pe = oe[ae];
        if (!e.isValidElementType(pe)) {
          var Z = U(pe);
          return new d("Invalid " + X + " `" + ie + "` of type " + ("`" + Z + "` supplied to `" + H + "`, expected a single ReactElement type."));
        }
        return null;
      }
      return _(W);
    }
    function A(W) {
      function oe(ae, H, X, ie, pe) {
        if (!(ae[H] instanceof W)) {
          var Z = W.name || c, K = Q(ae[H]);
          return new d("Invalid " + ie + " `" + pe + "` of type " + ("`" + K + "` supplied to `" + X + "`, expected ") + ("instance of `" + Z + "`."));
        }
        return null;
      }
      return _(oe);
    }
    function I(W) {
      if (!Array.isArray(W))
        return process.env.NODE_ENV !== "production" && (arguments.length > 1 ? o(
          "Invalid arguments supplied to oneOf, expected an array, got " + arguments.length + " arguments. A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z])."
        ) : o("Invalid argument supplied to oneOf, expected an array.")), a;
      function oe(ae, H, X, ie, pe) {
        for (var Z = ae[H], K = 0; K < W.length; K++)
          if (m(Z, W[K]))
            return null;
        var ee = JSON.stringify(W, function(ge, ue) {
          var Y = P(ue);
          return Y === "symbol" ? String(ue) : ue;
        });
        return new d("Invalid " + ie + " `" + pe + "` of value `" + String(Z) + "` " + ("supplied to `" + X + "`, expected one of " + ee + "."));
      }
      return _(oe);
    }
    function R(W) {
      function oe(ae, H, X, ie, pe) {
        if (typeof W != "function")
          return new d("Property `" + pe + "` of component `" + X + "` has invalid PropType notation inside objectOf.");
        var Z = ae[H], K = U(Z);
        if (K !== "object")
          return new d("Invalid " + ie + " `" + pe + "` of type " + ("`" + K + "` supplied to `" + X + "`, expected an object."));
        for (var ee in Z)
          if (i(Z, ee)) {
            var de = W(Z, ee, X, ie, pe + "." + ee, r);
            if (de instanceof Error)
              return de;
          }
        return null;
      }
      return _(oe);
    }
    function M(W) {
      if (!Array.isArray(W))
        return process.env.NODE_ENV !== "production" && o("Invalid argument supplied to oneOfType, expected an instance of array."), a;
      for (var oe = 0; oe < W.length; oe++) {
        var ae = W[oe];
        if (typeof ae != "function")
          return o(
            "Invalid argument supplied to oneOfType. Expected an array of check functions, but received " + D(ae) + " at index " + oe + "."
          ), a;
      }
      function H(X, ie, pe, Z, K) {
        for (var ee = [], de = 0; de < W.length; de++) {
          var ge = W[de], ue = ge(X, ie, pe, Z, K, r);
          if (ue == null)
            return null;
          ue.data && i(ue.data, "expectedType") && ee.push(ue.data.expectedType);
        }
        var Y = ee.length > 0 ? ", expected one of type [" + ee.join(", ") + "]" : "";
        return new d("Invalid " + Z + " `" + K + "` supplied to " + ("`" + pe + "`" + Y + "."));
      }
      return _(H);
    }
    function b() {
      function W(oe, ae, H, X, ie) {
        return re(oe[ae]) ? null : new d("Invalid " + X + " `" + ie + "` supplied to " + ("`" + H + "`, expected a ReactNode."));
      }
      return _(W);
    }
    function N(W, oe, ae, H, X) {
      return new d(
        (W || "React class") + ": " + oe + " type `" + ae + "." + H + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + X + "`."
      );
    }
    function j(W) {
      function oe(ae, H, X, ie, pe) {
        var Z = ae[H], K = U(Z);
        if (K !== "object")
          return new d("Invalid " + ie + " `" + pe + "` of type `" + K + "` " + ("supplied to `" + X + "`, expected `object`."));
        for (var ee in W) {
          var de = W[ee];
          if (typeof de != "function")
            return N(X, ie, pe, ee, P(de));
          var ge = de(Z, ee, X, ie, pe + "." + ee, r);
          if (ge)
            return ge;
        }
        return null;
      }
      return _(oe);
    }
    function $(W) {
      function oe(ae, H, X, ie, pe) {
        var Z = ae[H], K = U(Z);
        if (K !== "object")
          return new d("Invalid " + ie + " `" + pe + "` of type `" + K + "` " + ("supplied to `" + X + "`, expected `object`."));
        var ee = t({}, ae[H], W);
        for (var de in ee) {
          var ge = W[de];
          if (i(W, de) && typeof ge != "function")
            return N(X, ie, pe, de, P(ge));
          if (!ge)
            return new d(
              "Invalid " + ie + " `" + pe + "` key `" + de + "` supplied to `" + X + "`.\nBad object: " + JSON.stringify(ae[H], null, "  ") + `
Valid keys: ` + JSON.stringify(Object.keys(W), null, "  ")
            );
          var ue = ge(Z, de, X, ie, pe + "." + de, r);
          if (ue)
            return ue;
        }
        return null;
      }
      return _(oe);
    }
    function re(W) {
      switch (typeof W) {
        case "number":
        case "string":
        case "undefined":
          return !0;
        case "boolean":
          return !W;
        case "object":
          if (Array.isArray(W))
            return W.every(re);
          if (W === null || l(W))
            return !0;
          var oe = u(W);
          if (oe) {
            var ae = oe.call(W), H;
            if (oe !== W.entries) {
              for (; !(H = ae.next()).done; )
                if (!re(H.value))
                  return !1;
            } else
              for (; !(H = ae.next()).done; ) {
                var X = H.value;
                if (X && !re(X[1]))
                  return !1;
              }
          } else
            return !1;
          return !0;
        default:
          return !1;
      }
    }
    function ne(W, oe) {
      return W === "symbol" ? !0 : oe ? oe["@@toStringTag"] === "Symbol" || typeof Symbol == "function" && oe instanceof Symbol : !1;
    }
    function U(W) {
      var oe = typeof W;
      return Array.isArray(W) ? "array" : W instanceof RegExp ? "object" : ne(oe, W) ? "symbol" : oe;
    }
    function P(W) {
      if (typeof W > "u" || W === null)
        return "" + W;
      var oe = U(W);
      if (oe === "object") {
        if (W instanceof Date)
          return "date";
        if (W instanceof RegExp)
          return "regexp";
      }
      return oe;
    }
    function D(W) {
      var oe = P(W);
      switch (oe) {
        case "array":
        case "object":
          return "an " + oe;
        case "boolean":
        case "date":
        case "regexp":
          return "a " + oe;
        default:
          return oe;
      }
    }
    function Q(W) {
      return !W.constructor || !W.constructor.name ? c : W.constructor.name;
    }
    return p.checkPropTypes = n, p.resetWarningCache = n.resetWarningCache, p.PropTypes = p, p;
  }, Zn;
}
var Gn, ho;
function Rf() {
  if (ho) return Gn;
  ho = 1;
  var e = /* @__PURE__ */ xi();
  function t() {
  }
  function r() {
  }
  return r.resetWarningCache = t, Gn = function() {
    function i(a, l, f, h, s, u) {
      if (u !== e) {
        var c = new Error(
          "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types"
        );
        throw c.name = "Invariant Violation", c;
      }
    }
    i.isRequired = i;
    function n() {
      return i;
    }
    var o = {
      array: i,
      bigint: i,
      bool: i,
      func: i,
      number: i,
      object: i,
      string: i,
      symbol: i,
      any: i,
      arrayOf: n,
      element: i,
      elementType: i,
      instanceOf: n,
      node: i,
      objectOf: n,
      oneOf: n,
      oneOfType: n,
      shape: n,
      exact: n,
      checkPropTypes: r,
      resetWarningCache: t
    };
    return o.PropTypes = o, o;
  }, Gn;
}
var po;
function xf() {
  if (po) return Xr.exports;
  if (po = 1, process.env.NODE_ENV !== "production") {
    var e = Ra(), t = !0;
    Xr.exports = /* @__PURE__ */ Af()(e.isElement, t);
  } else
    Xr.exports = /* @__PURE__ */ Rf()();
  return Xr.exports;
}
var kf = /* @__PURE__ */ xf();
const Pe = /* @__PURE__ */ ef(kf);
/**
 * @mui/styled-engine v6.5.0
 *
 * @license MIT
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
function ka(e, t) {
  const r = pi(e, t);
  return process.env.NODE_ENV !== "production" ? (...i) => {
    const n = typeof e == "string" ? `"${e}"` : "component";
    return i.length === 0 ? console.error([`MUI: Seems like you called \`styled(${n})()\` without a \`style\` argument.`, 'You must provide a `styles` argument: `styled("div")(styleYouForgotToPass)`.'].join(`
`)) : i.some((o) => o === void 0) && console.error(`MUI: the styled(${n})(...args) API requires all its args to be defined.`), r(...i);
  } : r;
}
function Cf(e, t) {
  Array.isArray(e.__emotion_styles) && (e.__emotion_styles = t(e.__emotion_styles));
}
const yo = [];
function ir(e) {
  return yo[0] = e, Sa(yo);
}
var Qr = { exports: {} }, Ve = {};
/**
 * @license React
 * react-is.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var go;
function Of() {
  if (go) return Ve;
  go = 1;
  var e = Symbol.for("react.transitional.element"), t = Symbol.for("react.portal"), r = Symbol.for("react.fragment"), i = Symbol.for("react.strict_mode"), n = Symbol.for("react.profiler"), o = Symbol.for("react.consumer"), a = Symbol.for("react.context"), l = Symbol.for("react.forward_ref"), f = Symbol.for("react.suspense"), h = Symbol.for("react.suspense_list"), s = Symbol.for("react.memo"), u = Symbol.for("react.lazy"), c = Symbol.for("react.view_transition"), p = Symbol.for("react.client.reference");
  function m(d) {
    if (typeof d == "object" && d !== null) {
      var _ = d.$$typeof;
      switch (_) {
        case e:
          switch (d = d.type, d) {
            case r:
            case n:
            case i:
            case f:
            case h:
            case c:
              return d;
            default:
              switch (d = d && d.$$typeof, d) {
                case a:
                case l:
                case u:
                case s:
                  return d;
                case o:
                  return d;
                default:
                  return _;
              }
          }
        case t:
          return _;
      }
    }
  }
  return Ve.ContextConsumer = o, Ve.ContextProvider = a, Ve.Element = e, Ve.ForwardRef = l, Ve.Fragment = r, Ve.Lazy = u, Ve.Memo = s, Ve.Portal = t, Ve.Profiler = n, Ve.StrictMode = i, Ve.Suspense = f, Ve.SuspenseList = h, Ve.isContextConsumer = function(d) {
    return m(d) === o;
  }, Ve.isContextProvider = function(d) {
    return m(d) === a;
  }, Ve.isElement = function(d) {
    return typeof d == "object" && d !== null && d.$$typeof === e;
  }, Ve.isForwardRef = function(d) {
    return m(d) === l;
  }, Ve.isFragment = function(d) {
    return m(d) === r;
  }, Ve.isLazy = function(d) {
    return m(d) === u;
  }, Ve.isMemo = function(d) {
    return m(d) === s;
  }, Ve.isPortal = function(d) {
    return m(d) === t;
  }, Ve.isProfiler = function(d) {
    return m(d) === n;
  }, Ve.isStrictMode = function(d) {
    return m(d) === i;
  }, Ve.isSuspense = function(d) {
    return m(d) === f;
  }, Ve.isSuspenseList = function(d) {
    return m(d) === h;
  }, Ve.isValidElementType = function(d) {
    return typeof d == "string" || typeof d == "function" || d === r || d === n || d === i || d === f || d === h || typeof d == "object" && d !== null && (d.$$typeof === u || d.$$typeof === s || d.$$typeof === a || d.$$typeof === o || d.$$typeof === l || d.$$typeof === p || d.getModuleId !== void 0);
  }, Ve.typeOf = m, Ve;
}
var Ke = {};
/**
 * @license React
 * react-is.development.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var mo;
function Pf() {
  return mo || (mo = 1, process.env.NODE_ENV !== "production" && (function() {
    function e(d) {
      if (typeof d == "object" && d !== null) {
        var _ = d.$$typeof;
        switch (_) {
          case t:
            switch (d = d.type, d) {
              case i:
              case o:
              case n:
              case h:
              case s:
              case p:
                return d;
              default:
                switch (d = d && d.$$typeof, d) {
                  case l:
                  case f:
                  case c:
                  case u:
                    return d;
                  case a:
                    return d;
                  default:
                    return _;
                }
            }
          case r:
            return _;
        }
      }
    }
    var t = Symbol.for("react.transitional.element"), r = Symbol.for("react.portal"), i = Symbol.for("react.fragment"), n = Symbol.for("react.strict_mode"), o = Symbol.for("react.profiler"), a = Symbol.for("react.consumer"), l = Symbol.for("react.context"), f = Symbol.for("react.forward_ref"), h = Symbol.for("react.suspense"), s = Symbol.for("react.suspense_list"), u = Symbol.for("react.memo"), c = Symbol.for("react.lazy"), p = Symbol.for("react.view_transition"), m = Symbol.for("react.client.reference");
    Ke.ContextConsumer = a, Ke.ContextProvider = l, Ke.Element = t, Ke.ForwardRef = f, Ke.Fragment = i, Ke.Lazy = c, Ke.Memo = u, Ke.Portal = r, Ke.Profiler = o, Ke.StrictMode = n, Ke.Suspense = h, Ke.SuspenseList = s, Ke.isContextConsumer = function(d) {
      return e(d) === a;
    }, Ke.isContextProvider = function(d) {
      return e(d) === l;
    }, Ke.isElement = function(d) {
      return typeof d == "object" && d !== null && d.$$typeof === t;
    }, Ke.isForwardRef = function(d) {
      return e(d) === f;
    }, Ke.isFragment = function(d) {
      return e(d) === i;
    }, Ke.isLazy = function(d) {
      return e(d) === c;
    }, Ke.isMemo = function(d) {
      return e(d) === u;
    }, Ke.isPortal = function(d) {
      return e(d) === r;
    }, Ke.isProfiler = function(d) {
      return e(d) === o;
    }, Ke.isStrictMode = function(d) {
      return e(d) === n;
    }, Ke.isSuspense = function(d) {
      return e(d) === h;
    }, Ke.isSuspenseList = function(d) {
      return e(d) === s;
    }, Ke.isValidElementType = function(d) {
      return typeof d == "string" || typeof d == "function" || d === i || d === o || d === n || d === h || d === s || typeof d == "object" && d !== null && (d.$$typeof === c || d.$$typeof === u || d.$$typeof === l || d.$$typeof === a || d.$$typeof === f || d.$$typeof === m || d.getModuleId !== void 0);
    }, Ke.typeOf = e;
  })()), Ke;
}
var bo;
function If() {
  return bo || (bo = 1, process.env.NODE_ENV === "production" ? Qr.exports = /* @__PURE__ */ Of() : Qr.exports = /* @__PURE__ */ Pf()), Qr.exports;
}
var gn = /* @__PURE__ */ If();
function zt(e) {
  if (typeof e != "object" || e === null)
    return !1;
  const t = Object.getPrototypeOf(e);
  return (t === null || t === Object.prototype || Object.getPrototypeOf(t) === null) && !(Symbol.toStringTag in e) && !(Symbol.iterator in e);
}
function Ca(e) {
  if (/* @__PURE__ */ _t.isValidElement(e) || gn.isValidElementType(e) || !zt(e))
    return e;
  const t = {};
  return Object.keys(e).forEach((r) => {
    t[r] = Ca(e[r]);
  }), t;
}
function Ct(e, t, r = {
  clone: !0
}) {
  const i = r.clone ? {
    ...e
  } : e;
  return zt(e) && zt(t) && Object.keys(t).forEach((n) => {
    /* @__PURE__ */ _t.isValidElement(t[n]) || gn.isValidElementType(t[n]) ? i[n] = t[n] : zt(t[n]) && // Avoid prototype pollution
    Object.prototype.hasOwnProperty.call(e, n) && zt(e[n]) ? i[n] = Ct(e[n], t[n], r) : r.clone ? i[n] = zt(t[n]) ? Ca(t[n]) : t[n] : i[n] = t[n];
  }), i;
}
const Lf = (e) => {
  const t = Object.keys(e).map((r) => ({
    key: r,
    val: e[r]
  })) || [];
  return t.sort((r, i) => r.val - i.val), t.reduce((r, i) => ({
    ...r,
    [i.key]: i.val
  }), {});
};
function Mf(e) {
  const {
    // The breakpoint **start** at this value.
    // For instance with the first breakpoint xs: [xs, sm).
    values: t = {
      xs: 0,
      // phone
      sm: 600,
      // tablet
      md: 900,
      // small laptop
      lg: 1200,
      // desktop
      xl: 1536
      // large screen
    },
    unit: r = "px",
    step: i = 5,
    ...n
  } = e, o = Lf(t), a = Object.keys(o);
  function l(c) {
    return `@media (min-width:${typeof t[c] == "number" ? t[c] : c}${r})`;
  }
  function f(c) {
    return `@media (max-width:${(typeof t[c] == "number" ? t[c] : c) - i / 100}${r})`;
  }
  function h(c, p) {
    const m = a.indexOf(p);
    return `@media (min-width:${typeof t[c] == "number" ? t[c] : c}${r}) and (max-width:${(m !== -1 && typeof t[a[m]] == "number" ? t[a[m]] : p) - i / 100}${r})`;
  }
  function s(c) {
    return a.indexOf(c) + 1 < a.length ? h(c, a[a.indexOf(c) + 1]) : l(c);
  }
  function u(c) {
    const p = a.indexOf(c);
    return p === 0 ? l(a[1]) : p === a.length - 1 ? f(a[p]) : h(c, a[a.indexOf(c) + 1]).replace("@media", "@media not all and");
  }
  return {
    keys: a,
    values: o,
    up: l,
    down: f,
    between: h,
    only: s,
    not: u,
    unit: r,
    ...n
  };
}
function _o(e, t) {
  if (!e.containerQueries)
    return t;
  const r = Object.keys(t).filter((i) => i.startsWith("@container")).sort((i, n) => {
    var a, l;
    const o = /min-width:\s*([0-9.]+)/;
    return +(((a = i.match(o)) == null ? void 0 : a[1]) || 0) - +(((l = n.match(o)) == null ? void 0 : l[1]) || 0);
  });
  return r.length ? r.reduce((i, n) => {
    const o = t[n];
    return delete i[n], i[n] = o, i;
  }, {
    ...t
  }) : t;
}
function Nf(e, t) {
  return t === "@" || t.startsWith("@") && (e.some((r) => t.startsWith(`@${r}`)) || !!t.match(/^@\d/));
}
function Bf(e, t) {
  const r = t.match(/^@([^/]+)?\/?(.+)?$/);
  if (!r) {
    if (process.env.NODE_ENV !== "production")
      throw new Error(process.env.NODE_ENV !== "production" ? `MUI: The provided shorthand ${`(${t})`} is invalid. The format should be \`@<breakpoint | number>\` or \`@<breakpoint | number>/<container>\`.
For example, \`@sm\` or \`@600\` or \`@40rem/sidebar\`.` : Jt(18, `(${t})`));
    return null;
  }
  const [, i, n] = r, o = Number.isNaN(+i) ? i || 0 : +i;
  return e.containerQueries(n).up(o);
}
function Ff(e) {
  const t = (o, a) => o.replace("@media", a ? `@container ${a}` : "@container");
  function r(o, a) {
    o.up = (...l) => t(e.breakpoints.up(...l), a), o.down = (...l) => t(e.breakpoints.down(...l), a), o.between = (...l) => t(e.breakpoints.between(...l), a), o.only = (...l) => t(e.breakpoints.only(...l), a), o.not = (...l) => {
      const f = t(e.breakpoints.not(...l), a);
      return f.includes("not all and") ? f.replace("not all and ", "").replace("min-width:", "width<").replace("max-width:", "width>").replace("and", "or") : f;
    };
  }
  const i = {}, n = (o) => (r(i, o), i);
  return r(n), {
    ...e,
    containerQueries: n
  };
}
const Df = {
  borderRadius: 4
}, er = process.env.NODE_ENV !== "production" ? Pe.oneOfType([Pe.number, Pe.string, Pe.object, Pe.array]) : {};
function Br(e, t) {
  return t ? Ct(e, t, {
    clone: !1
    // No need to clone deep, it's way faster.
  }) : e;
}
const kn = {
  xs: 0,
  // phone
  sm: 600,
  // tablet
  md: 900,
  // small laptop
  lg: 1200,
  // desktop
  xl: 1536
  // large screen
}, vo = {
  // Sorted ASC by size. That's important.
  // It can't be configured as it's used statically for propTypes.
  keys: ["xs", "sm", "md", "lg", "xl"],
  up: (e) => `@media (min-width:${kn[e]}px)`
}, Uf = {
  containerQueries: (e) => ({
    up: (t) => {
      let r = typeof t == "number" ? t : kn[t] || t;
      return typeof r == "number" && (r = `${r}px`), e ? `@container ${e} (min-width:${r})` : `@container (min-width:${r})`;
    }
  })
};
function Xt(e, t, r) {
  const i = e.theme || {};
  if (Array.isArray(t)) {
    const o = i.breakpoints || vo;
    return t.reduce((a, l, f) => (a[o.up(o.keys[f])] = r(t[f]), a), {});
  }
  if (typeof t == "object") {
    const o = i.breakpoints || vo;
    return Object.keys(t).reduce((a, l) => {
      if (Nf(o.keys, l)) {
        const f = Bf(i.containerQueries ? i : Uf, l);
        f && (a[f] = r(t[l], l));
      } else if (Object.keys(o.values || kn).includes(l)) {
        const f = o.up(l);
        a[f] = r(t[l], l);
      } else {
        const f = l;
        a[f] = t[f];
      }
      return a;
    }, {});
  }
  return r(t);
}
function jf(e = {}) {
  var r;
  return ((r = e.keys) == null ? void 0 : r.reduce((i, n) => {
    const o = e.up(n);
    return i[o] = {}, i;
  }, {})) || {};
}
function wo(e, t) {
  return e.reduce((r, i) => {
    const n = r[i];
    return (!n || Object.keys(n).length === 0) && delete r[i], r;
  }, t);
}
function vr(e) {
  if (typeof e != "string")
    throw new Error(process.env.NODE_ENV !== "production" ? "MUI: `capitalize(string)` expects a string argument." : Jt(7));
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function Cn(e, t, r = !0) {
  if (!t || typeof t != "string")
    return null;
  if (e && e.vars && r) {
    const i = `vars.${t}`.split(".").reduce((n, o) => n && n[o] ? n[o] : null, e);
    if (i != null)
      return i;
  }
  return t.split(".").reduce((i, n) => i && i[n] != null ? i[n] : null, e);
}
function mn(e, t, r, i = r) {
  let n;
  return typeof e == "function" ? n = e(r) : Array.isArray(e) ? n = e[r] || i : n = Cn(e, r) || i, t && (n = t(n, i, e)), n;
}
function lt(e) {
  const {
    prop: t,
    cssProperty: r = e.prop,
    themeKey: i,
    transform: n
  } = e, o = (a) => {
    if (a[t] == null)
      return null;
    const l = a[t], f = a.theme, h = Cn(f, i) || {};
    return Xt(a, l, (u) => {
      let c = mn(h, n, u);
      return u === c && typeof u == "string" && (c = mn(h, n, `${t}${u === "default" ? "" : vr(u)}`, u)), r === !1 ? c : {
        [r]: c
      };
    });
  };
  return o.propTypes = process.env.NODE_ENV !== "production" ? {
    [t]: er
  } : {}, o.filterProps = [t], o;
}
function zf(e) {
  const t = {};
  return (r) => (t[r] === void 0 && (t[r] = e(r)), t[r]);
}
const Hf = {
  m: "margin",
  p: "padding"
}, $f = {
  t: "Top",
  r: "Right",
  b: "Bottom",
  l: "Left",
  x: ["Left", "Right"],
  y: ["Top", "Bottom"]
}, Eo = {
  marginX: "mx",
  marginY: "my",
  paddingX: "px",
  paddingY: "py"
}, Wf = zf((e) => {
  if (e.length > 2)
    if (Eo[e])
      e = Eo[e];
    else
      return [e];
  const [t, r] = e.split(""), i = Hf[t], n = $f[r] || "";
  return Array.isArray(n) ? n.map((o) => i + o) : [i + n];
}), On = ["m", "mt", "mr", "mb", "ml", "mx", "my", "margin", "marginTop", "marginRight", "marginBottom", "marginLeft", "marginX", "marginY", "marginInline", "marginInlineStart", "marginInlineEnd", "marginBlock", "marginBlockStart", "marginBlockEnd"], Pn = ["p", "pt", "pr", "pb", "pl", "px", "py", "padding", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "paddingX", "paddingY", "paddingInline", "paddingInlineStart", "paddingInlineEnd", "paddingBlock", "paddingBlockStart", "paddingBlockEnd"], Zf = [...On, ...Pn];
function Zr(e, t, r, i) {
  const n = Cn(e, t, !0) ?? r;
  return typeof n == "number" || typeof n == "string" ? (o) => typeof o == "string" ? o : (process.env.NODE_ENV !== "production" && typeof o != "number" && console.error(`MUI: Expected ${i} argument to be a number or a string, got ${o}.`), typeof n == "string" ? `calc(${o} * ${n})` : n * o) : Array.isArray(n) ? (o) => {
    if (typeof o == "string")
      return o;
    const a = Math.abs(o);
    process.env.NODE_ENV !== "production" && (Number.isInteger(a) ? a > n.length - 1 && console.error([`MUI: The value provided (${a}) overflows.`, `The supported values are: ${JSON.stringify(n)}.`, `${a} > ${n.length - 1}, you need to add the missing values.`].join(`
`)) : console.error([`MUI: The \`theme.${t}\` array type cannot be combined with non integer values.You should either use an integer value that can be used as index, or define the \`theme.${t}\` as a number.`].join(`
`)));
    const l = n[a];
    return o >= 0 ? l : typeof l == "number" ? -l : `-${l}`;
  } : typeof n == "function" ? n : (process.env.NODE_ENV !== "production" && console.error([`MUI: The \`theme.${t}\` value (${n}) is invalid.`, "It should be a number, an array or a function."].join(`
`)), () => {
  });
}
function ki(e) {
  return Zr(e, "spacing", 8, "spacing");
}
function Gr(e, t) {
  return typeof t == "string" || t == null ? t : e(t);
}
function Gf(e, t) {
  return (r) => e.reduce((i, n) => (i[n] = Gr(t, r), i), {});
}
function Yf(e, t, r, i) {
  if (!t.includes(r))
    return null;
  const n = Wf(r), o = Gf(n, i), a = e[r];
  return Xt(e, a, o);
}
function Oa(e, t) {
  const r = ki(e.theme);
  return Object.keys(e).map((i) => Yf(e, t, i, r)).reduce(Br, {});
}
function ot(e) {
  return Oa(e, On);
}
ot.propTypes = process.env.NODE_ENV !== "production" ? On.reduce((e, t) => (e[t] = er, e), {}) : {};
ot.filterProps = On;
function at(e) {
  return Oa(e, Pn);
}
at.propTypes = process.env.NODE_ENV !== "production" ? Pn.reduce((e, t) => (e[t] = er, e), {}) : {};
at.filterProps = Pn;
process.env.NODE_ENV !== "production" && Zf.reduce((e, t) => (e[t] = er, e), {});
function Pa(e = 8, t = ki({
  spacing: e
})) {
  if (e.mui)
    return e;
  const r = (...i) => (process.env.NODE_ENV !== "production" && (i.length <= 4 || console.error(`MUI: Too many arguments provided, expected between 0 and 4, got ${i.length}`)), (i.length === 0 ? [1] : i).map((o) => {
    const a = t(o);
    return typeof a == "number" ? `${a}px` : a;
  }).join(" "));
  return r.mui = !0, r;
}
function In(...e) {
  const t = e.reduce((i, n) => (n.filterProps.forEach((o) => {
    i[o] = n;
  }), i), {}), r = (i) => Object.keys(i).reduce((n, o) => t[o] ? Br(n, t[o](i)) : n, {});
  return r.propTypes = process.env.NODE_ENV !== "production" ? e.reduce((i, n) => Object.assign(i, n.propTypes), {}) : {}, r.filterProps = e.reduce((i, n) => i.concat(n.filterProps), []), r;
}
function Pt(e) {
  return typeof e != "number" ? e : `${e}px solid`;
}
function Mt(e, t) {
  return lt({
    prop: e,
    themeKey: "borders",
    transform: t
  });
}
const Vf = Mt("border", Pt), Kf = Mt("borderTop", Pt), qf = Mt("borderRight", Pt), Xf = Mt("borderBottom", Pt), Jf = Mt("borderLeft", Pt), Qf = Mt("borderColor"), ec = Mt("borderTopColor"), tc = Mt("borderRightColor"), rc = Mt("borderBottomColor"), nc = Mt("borderLeftColor"), ic = Mt("outline", Pt), oc = Mt("outlineColor"), Ln = (e) => {
  if (e.borderRadius !== void 0 && e.borderRadius !== null) {
    const t = Zr(e.theme, "shape.borderRadius", 4, "borderRadius"), r = (i) => ({
      borderRadius: Gr(t, i)
    });
    return Xt(e, e.borderRadius, r);
  }
  return null;
};
Ln.propTypes = process.env.NODE_ENV !== "production" ? {
  borderRadius: er
} : {};
Ln.filterProps = ["borderRadius"];
In(Vf, Kf, qf, Xf, Jf, Qf, ec, tc, rc, nc, Ln, ic, oc);
const Mn = (e) => {
  if (e.gap !== void 0 && e.gap !== null) {
    const t = Zr(e.theme, "spacing", 8, "gap"), r = (i) => ({
      gap: Gr(t, i)
    });
    return Xt(e, e.gap, r);
  }
  return null;
};
Mn.propTypes = process.env.NODE_ENV !== "production" ? {
  gap: er
} : {};
Mn.filterProps = ["gap"];
const Nn = (e) => {
  if (e.columnGap !== void 0 && e.columnGap !== null) {
    const t = Zr(e.theme, "spacing", 8, "columnGap"), r = (i) => ({
      columnGap: Gr(t, i)
    });
    return Xt(e, e.columnGap, r);
  }
  return null;
};
Nn.propTypes = process.env.NODE_ENV !== "production" ? {
  columnGap: er
} : {};
Nn.filterProps = ["columnGap"];
const Bn = (e) => {
  if (e.rowGap !== void 0 && e.rowGap !== null) {
    const t = Zr(e.theme, "spacing", 8, "rowGap"), r = (i) => ({
      rowGap: Gr(t, i)
    });
    return Xt(e, e.rowGap, r);
  }
  return null;
};
Bn.propTypes = process.env.NODE_ENV !== "production" ? {
  rowGap: er
} : {};
Bn.filterProps = ["rowGap"];
const ac = lt({
  prop: "gridColumn"
}), sc = lt({
  prop: "gridRow"
}), lc = lt({
  prop: "gridAutoFlow"
}), fc = lt({
  prop: "gridAutoColumns"
}), cc = lt({
  prop: "gridAutoRows"
}), uc = lt({
  prop: "gridTemplateColumns"
}), dc = lt({
  prop: "gridTemplateRows"
}), hc = lt({
  prop: "gridTemplateAreas"
}), pc = lt({
  prop: "gridArea"
});
In(Mn, Nn, Bn, ac, sc, lc, fc, cc, uc, dc, hc, pc);
function br(e, t) {
  return t === "grey" ? t : e;
}
const yc = lt({
  prop: "color",
  themeKey: "palette",
  transform: br
}), gc = lt({
  prop: "bgcolor",
  cssProperty: "backgroundColor",
  themeKey: "palette",
  transform: br
}), mc = lt({
  prop: "backgroundColor",
  themeKey: "palette",
  transform: br
});
In(yc, gc, mc);
function xt(e) {
  return e <= 1 && e !== 0 ? `${e * 100}%` : e;
}
const bc = lt({
  prop: "width",
  transform: xt
}), Ci = (e) => {
  if (e.maxWidth !== void 0 && e.maxWidth !== null) {
    const t = (r) => {
      var n, o, a, l, f;
      const i = ((a = (o = (n = e.theme) == null ? void 0 : n.breakpoints) == null ? void 0 : o.values) == null ? void 0 : a[r]) || kn[r];
      return i ? ((f = (l = e.theme) == null ? void 0 : l.breakpoints) == null ? void 0 : f.unit) !== "px" ? {
        maxWidth: `${i}${e.theme.breakpoints.unit}`
      } : {
        maxWidth: i
      } : {
        maxWidth: xt(r)
      };
    };
    return Xt(e, e.maxWidth, t);
  }
  return null;
};
Ci.filterProps = ["maxWidth"];
const _c = lt({
  prop: "minWidth",
  transform: xt
}), vc = lt({
  prop: "height",
  transform: xt
}), wc = lt({
  prop: "maxHeight",
  transform: xt
}), Ec = lt({
  prop: "minHeight",
  transform: xt
});
lt({
  prop: "size",
  cssProperty: "width",
  transform: xt
});
lt({
  prop: "size",
  cssProperty: "height",
  transform: xt
});
const Sc = lt({
  prop: "boxSizing"
});
In(bc, Ci, _c, vc, wc, Ec, Sc);
const Yr = {
  // borders
  border: {
    themeKey: "borders",
    transform: Pt
  },
  borderTop: {
    themeKey: "borders",
    transform: Pt
  },
  borderRight: {
    themeKey: "borders",
    transform: Pt
  },
  borderBottom: {
    themeKey: "borders",
    transform: Pt
  },
  borderLeft: {
    themeKey: "borders",
    transform: Pt
  },
  borderColor: {
    themeKey: "palette"
  },
  borderTopColor: {
    themeKey: "palette"
  },
  borderRightColor: {
    themeKey: "palette"
  },
  borderBottomColor: {
    themeKey: "palette"
  },
  borderLeftColor: {
    themeKey: "palette"
  },
  outline: {
    themeKey: "borders",
    transform: Pt
  },
  outlineColor: {
    themeKey: "palette"
  },
  borderRadius: {
    themeKey: "shape.borderRadius",
    style: Ln
  },
  // palette
  color: {
    themeKey: "palette",
    transform: br
  },
  bgcolor: {
    themeKey: "palette",
    cssProperty: "backgroundColor",
    transform: br
  },
  backgroundColor: {
    themeKey: "palette",
    transform: br
  },
  // spacing
  p: {
    style: at
  },
  pt: {
    style: at
  },
  pr: {
    style: at
  },
  pb: {
    style: at
  },
  pl: {
    style: at
  },
  px: {
    style: at
  },
  py: {
    style: at
  },
  padding: {
    style: at
  },
  paddingTop: {
    style: at
  },
  paddingRight: {
    style: at
  },
  paddingBottom: {
    style: at
  },
  paddingLeft: {
    style: at
  },
  paddingX: {
    style: at
  },
  paddingY: {
    style: at
  },
  paddingInline: {
    style: at
  },
  paddingInlineStart: {
    style: at
  },
  paddingInlineEnd: {
    style: at
  },
  paddingBlock: {
    style: at
  },
  paddingBlockStart: {
    style: at
  },
  paddingBlockEnd: {
    style: at
  },
  m: {
    style: ot
  },
  mt: {
    style: ot
  },
  mr: {
    style: ot
  },
  mb: {
    style: ot
  },
  ml: {
    style: ot
  },
  mx: {
    style: ot
  },
  my: {
    style: ot
  },
  margin: {
    style: ot
  },
  marginTop: {
    style: ot
  },
  marginRight: {
    style: ot
  },
  marginBottom: {
    style: ot
  },
  marginLeft: {
    style: ot
  },
  marginX: {
    style: ot
  },
  marginY: {
    style: ot
  },
  marginInline: {
    style: ot
  },
  marginInlineStart: {
    style: ot
  },
  marginInlineEnd: {
    style: ot
  },
  marginBlock: {
    style: ot
  },
  marginBlockStart: {
    style: ot
  },
  marginBlockEnd: {
    style: ot
  },
  // display
  displayPrint: {
    cssProperty: !1,
    transform: (e) => ({
      "@media print": {
        display: e
      }
    })
  },
  display: {},
  overflow: {},
  textOverflow: {},
  visibility: {},
  whiteSpace: {},
  // flexbox
  flexBasis: {},
  flexDirection: {},
  flexWrap: {},
  justifyContent: {},
  alignItems: {},
  alignContent: {},
  order: {},
  flex: {},
  flexGrow: {},
  flexShrink: {},
  alignSelf: {},
  justifyItems: {},
  justifySelf: {},
  // grid
  gap: {
    style: Mn
  },
  rowGap: {
    style: Bn
  },
  columnGap: {
    style: Nn
  },
  gridColumn: {},
  gridRow: {},
  gridAutoFlow: {},
  gridAutoColumns: {},
  gridAutoRows: {},
  gridTemplateColumns: {},
  gridTemplateRows: {},
  gridTemplateAreas: {},
  gridArea: {},
  // positions
  position: {},
  zIndex: {
    themeKey: "zIndex"
  },
  top: {},
  right: {},
  bottom: {},
  left: {},
  // shadows
  boxShadow: {
    themeKey: "shadows"
  },
  // sizing
  width: {
    transform: xt
  },
  maxWidth: {
    style: Ci
  },
  minWidth: {
    transform: xt
  },
  height: {
    transform: xt
  },
  maxHeight: {
    transform: xt
  },
  minHeight: {
    transform: xt
  },
  boxSizing: {},
  // typography
  font: {
    themeKey: "font"
  },
  fontFamily: {
    themeKey: "typography"
  },
  fontSize: {
    themeKey: "typography"
  },
  fontStyle: {
    themeKey: "typography"
  },
  fontWeight: {
    themeKey: "typography"
  },
  letterSpacing: {},
  textTransform: {},
  lineHeight: {},
  textAlign: {},
  typography: {
    cssProperty: !1,
    themeKey: "typography"
  }
};
function Tc(...e) {
  const t = e.reduce((i, n) => i.concat(Object.keys(n)), []), r = new Set(t);
  return e.every((i) => r.size === Object.keys(i).length);
}
function Ac(e, t) {
  return typeof e == "function" ? e(t) : e;
}
function Rc() {
  function e(r, i, n, o) {
    const a = {
      [r]: i,
      theme: n
    }, l = o[r];
    if (!l)
      return {
        [r]: i
      };
    const {
      cssProperty: f = r,
      themeKey: h,
      transform: s,
      style: u
    } = l;
    if (i == null)
      return null;
    if (h === "typography" && i === "inherit")
      return {
        [r]: i
      };
    const c = Cn(n, h) || {};
    return u ? u(a) : Xt(a, i, (m) => {
      let d = mn(c, s, m);
      return m === d && typeof m == "string" && (d = mn(c, s, `${r}${m === "default" ? "" : vr(m)}`, m)), f === !1 ? d : {
        [f]: d
      };
    });
  }
  function t(r) {
    const {
      sx: i,
      theme: n = {},
      nested: o
    } = r || {};
    if (!i)
      return null;
    const a = n.unstable_sxConfig ?? Yr;
    function l(f) {
      let h = f;
      if (typeof f == "function")
        h = f(n);
      else if (typeof f != "object")
        return f;
      if (!h)
        return null;
      const s = jf(n.breakpoints), u = Object.keys(s);
      let c = s;
      return Object.keys(h).forEach((p) => {
        const m = Ac(h[p], n);
        if (m != null)
          if (typeof m == "object")
            if (a[p])
              c = Br(c, e(p, m, n, a));
            else {
              const d = Xt({
                theme: n
              }, m, (_) => ({
                [p]: _
              }));
              Tc(d, m) ? c[p] = t({
                sx: m,
                theme: n,
                nested: !0
              }) : c = Br(c, d);
            }
          else
            c = Br(c, e(p, m, n, a));
      }), !o && n.modularCssLayers ? {
        "@layer sx": _o(n, wo(u, c))
      } : _o(n, wo(u, c));
    }
    return Array.isArray(i) ? i.map(l) : l(i);
  }
  return t;
}
const ar = Rc();
ar.filterProps = ["sx"];
function xc(e, t) {
  var i;
  const r = this;
  if (r.vars) {
    if (!((i = r.colorSchemes) != null && i[e]) || typeof r.getColorSchemeSelector != "function")
      return {};
    let n = r.getColorSchemeSelector(e);
    return n === "&" ? t : ((n.includes("data-") || n.includes(".")) && (n = `*:where(${n.replace(/\s*&$/, "")}) &`), {
      [n]: t
    });
  }
  return r.palette.mode === e ? t : {};
}
function Oi(e = {}, ...t) {
  const {
    breakpoints: r = {},
    palette: i = {},
    spacing: n,
    shape: o = {},
    ...a
  } = e, l = Mf(r), f = Pa(n);
  let h = Ct({
    breakpoints: l,
    direction: "ltr",
    components: {},
    // Inject component definitions.
    palette: {
      mode: "light",
      ...i
    },
    spacing: f,
    shape: {
      ...Df,
      ...o
    }
  }, a);
  return h = Ff(h), h.applyStyles = xc, h = t.reduce((s, u) => Ct(s, u), h), h.unstable_sxConfig = {
    ...Yr,
    ...a == null ? void 0 : a.unstable_sxConfig
  }, h.unstable_sx = function(u) {
    return ar({
      sx: u,
      theme: this
    });
  }, h;
}
function kc(e) {
  return Object.keys(e).length === 0;
}
function Cc(e = null) {
  const t = _t.useContext(Aa);
  return !t || kc(t) ? e : t;
}
const Oc = Oi();
function Pc(e = Oc) {
  return Cc(e);
}
const Ic = (e) => {
  var i;
  const t = {
    systemProps: {},
    otherProps: {}
  }, r = ((i = e == null ? void 0 : e.theme) == null ? void 0 : i.unstable_sxConfig) ?? Yr;
  return Object.keys(e).forEach((n) => {
    r[n] ? t.systemProps[n] = e[n] : t.otherProps[n] = e[n];
  }), t;
};
function Ia(e) {
  const {
    sx: t,
    ...r
  } = e, {
    systemProps: i,
    otherProps: n
  } = Ic(r);
  let o;
  return Array.isArray(t) ? o = [i, ...t] : typeof t == "function" ? o = (...a) => {
    const l = t(...a);
    return zt(l) ? {
      ...i,
      ...l
    } : i;
  } : o = {
    ...i,
    ...t
  }, {
    ...n,
    sx: o
  };
}
const So = (e) => e, Lc = () => {
  let e = So;
  return {
    configure(t) {
      e = t;
    },
    generate(t) {
      return e(t);
    },
    reset() {
      e = So;
    }
  };
}, La = Lc();
function Ma(e) {
  var t, r, i = "";
  if (typeof e == "string" || typeof e == "number") i += e;
  else if (typeof e == "object") if (Array.isArray(e)) {
    var n = e.length;
    for (t = 0; t < n; t++) e[t] && (r = Ma(e[t])) && (i && (i += " "), i += r);
  } else for (r in e) e[r] && (i && (i += " "), i += r);
  return i;
}
function Na() {
  for (var e, t, r = 0, i = "", n = arguments.length; r < n; r++) (e = arguments[r]) && (t = Ma(e)) && (i && (i += " "), i += t);
  return i;
}
function Mc(e = {}) {
  const {
    themeId: t,
    defaultTheme: r,
    defaultClassName: i = "MuiBox-root",
    generateClassName: n
  } = e, o = ka("div", {
    shouldForwardProp: (l) => l !== "theme" && l !== "sx" && l !== "as"
  })(ar);
  return /* @__PURE__ */ _t.forwardRef(function(f, h) {
    const s = Pc(r), {
      className: u,
      component: c = "div",
      ...p
    } = Ia(f);
    return /* @__PURE__ */ Le(o, {
      as: c,
      ref: h,
      className: Na(u, n ? n(i) : i),
      theme: t && s[t] || s,
      ...p
    });
  });
}
const Nc = {
  active: "active",
  checked: "checked",
  completed: "completed",
  disabled: "disabled",
  error: "error",
  expanded: "expanded",
  focused: "focused",
  focusVisible: "focusVisible",
  open: "open",
  readOnly: "readOnly",
  required: "required",
  selected: "selected"
};
function Pi(e, t, r = "Mui") {
  const i = Nc[t];
  return i ? `${r}-${i}` : `${La.generate(e)}-${t}`;
}
function Ba(e, t, r = "Mui") {
  const i = {};
  return t.forEach((n) => {
    i[n] = Pi(e, n, r);
  }), i;
}
function Fa(e, t = "") {
  return e.displayName || e.name || t;
}
function To(e, t, r) {
  const i = Fa(t);
  return e.displayName || (i !== "" ? `${r}(${i})` : r);
}
function Bc(e) {
  if (e != null) {
    if (typeof e == "string")
      return e;
    if (typeof e == "function")
      return Fa(e, "Component");
    if (typeof e == "object")
      switch (e.$$typeof) {
        case gn.ForwardRef:
          return To(e, e.render, "ForwardRef");
        case gn.Memo:
          return To(e, e.type, "memo");
        default:
          return;
      }
  }
}
function Da(e) {
  const {
    variants: t,
    ...r
  } = e, i = {
    variants: t,
    style: ir(r),
    isProcessed: !0
  };
  return i.style === r || t && t.forEach((n) => {
    typeof n.style != "function" && (n.style = ir(n.style));
  }), i;
}
const Fc = Oi();
function Yn(e) {
  return e !== "ownerState" && e !== "theme" && e !== "sx" && e !== "as";
}
function nr(e, t) {
  return t && e && typeof e == "object" && e.styles && !e.styles.startsWith("@layer") && (e.styles = `@layer ${t}{${String(e.styles)}}`), e;
}
function Dc(e) {
  return e ? (t, r) => r[e] : null;
}
function Uc(e, t, r) {
  e.theme = $c(e.theme) ? r : e.theme[t] || e.theme;
}
function dn(e, t, r) {
  const i = typeof t == "function" ? t(e) : t;
  if (Array.isArray(i))
    return i.flatMap((n) => dn(e, n, r));
  if (Array.isArray(i == null ? void 0 : i.variants)) {
    let n;
    if (i.isProcessed)
      n = r ? nr(i.style, r) : i.style;
    else {
      const {
        variants: o,
        ...a
      } = i;
      n = r ? nr(ir(a), r) : a;
    }
    return Ua(e, i.variants, [n], r);
  }
  return i != null && i.isProcessed ? r ? nr(ir(i.style), r) : i.style : r ? nr(ir(i), r) : i;
}
function Ua(e, t, r = [], i = void 0) {
  var o;
  let n;
  e: for (let a = 0; a < t.length; a += 1) {
    const l = t[a];
    if (typeof l.props == "function") {
      if (n ?? (n = {
        ...e,
        ...e.ownerState,
        ownerState: e.ownerState
      }), !l.props(n))
        continue;
    } else
      for (const f in l.props)
        if (e[f] !== l.props[f] && ((o = e.ownerState) == null ? void 0 : o[f]) !== l.props[f])
          continue e;
    typeof l.style == "function" ? (n ?? (n = {
      ...e,
      ...e.ownerState,
      ownerState: e.ownerState
    }), r.push(i ? nr(ir(l.style(n)), i) : l.style(n))) : r.push(i ? nr(ir(l.style), i) : l.style);
  }
  return r;
}
function jc(e = {}) {
  const {
    themeId: t,
    defaultTheme: r = Fc,
    rootShouldForwardProp: i = Yn,
    slotShouldForwardProp: n = Yn
  } = e;
  function o(l) {
    Uc(l, t, r);
  }
  return (l, f = {}) => {
    Cf(l, (A) => A.filter((I) => I !== ar));
    const {
      name: h,
      slot: s,
      skipVariantsResolver: u,
      skipSx: c,
      // TODO v6: remove `lowercaseFirstLetter()` in the next major release
      // For more details: https://github.com/mui/material-ui/pull/37908
      overridesResolver: p = Dc(ja(s)),
      ...m
    } = f, d = h && h.startsWith("Mui") || s ? "components" : "custom", _ = u !== void 0 ? u : (
      // TODO v6: remove `Root` in the next major release
      // For more details: https://github.com/mui/material-ui/pull/37908
      s && s !== "Root" && s !== "root" || !1
    ), v = c || !1;
    let k = Yn;
    s === "Root" || s === "root" ? k = i : s ? k = n : Wc(l) && (k = void 0);
    const E = ka(l, {
      shouldForwardProp: k,
      label: Hc(h, s),
      ...m
    }), T = (A) => {
      if (A.__emotion_real === A)
        return A;
      if (typeof A == "function")
        return function(R) {
          return dn(R, A, R.theme.modularCssLayers ? d : void 0);
        };
      if (zt(A)) {
        const I = Da(A);
        return function(M) {
          return I.variants ? dn(M, I, M.theme.modularCssLayers ? d : void 0) : M.theme.modularCssLayers ? nr(I.style, d) : I.style;
        };
      }
      return A;
    }, x = (...A) => {
      const I = [], R = A.map(T), M = [];
      if (I.push(o), h && p && M.push(function($) {
        var P, D;
        const ne = (D = (P = $.theme.components) == null ? void 0 : P[h]) == null ? void 0 : D.styleOverrides;
        if (!ne)
          return null;
        const U = {};
        for (const Q in ne)
          U[Q] = dn($, ne[Q], $.theme.modularCssLayers ? "theme" : void 0);
        return p($, U);
      }), h && !_ && M.push(function($) {
        var U, P;
        const re = $.theme, ne = (P = (U = re == null ? void 0 : re.components) == null ? void 0 : U[h]) == null ? void 0 : P.variants;
        return ne ? Ua($, ne, [], $.theme.modularCssLayers ? "theme" : void 0) : null;
      }), v || M.push(ar), Array.isArray(R[0])) {
        const j = R.shift(), $ = new Array(I.length).fill(""), re = new Array(M.length).fill("");
        let ne;
        ne = [...$, ...j, ...re], ne.raw = [...$, ...j.raw, ...re], I.unshift(ne);
      }
      const b = [...I, ...R, ...M], N = E(...b);
      return l.muiName && (N.muiName = l.muiName), process.env.NODE_ENV !== "production" && (N.displayName = zc(h, s, l)), N;
    };
    return E.withConfig && (x.withConfig = E.withConfig), x;
  };
}
function zc(e, t, r) {
  return e ? `${e}${vr(t || "")}` : `Styled(${Bc(r)})`;
}
function Hc(e, t) {
  let r;
  return process.env.NODE_ENV !== "production" && e && (r = `${e}-${ja(t || "Root")}`), r;
}
function $c(e) {
  for (const t in e)
    return !1;
  return !0;
}
function Wc(e) {
  return typeof e == "string" && // 96 is one less than the char code
  // for "a" so this is checking that
  // it's a lowercase character
  e.charCodeAt(0) > 96;
}
function ja(e) {
  return e && e.charAt(0).toLowerCase() + e.slice(1);
}
function yi(e, t) {
  const r = {
    ...t
  };
  for (const i in e)
    if (Object.prototype.hasOwnProperty.call(e, i)) {
      const n = i;
      if (n === "components" || n === "slots")
        r[n] = {
          ...e[n],
          ...r[n]
        };
      else if (n === "componentsProps" || n === "slotProps") {
        const o = e[n], a = t[n];
        if (!a)
          r[n] = o || {};
        else if (!o)
          r[n] = a;
        else {
          r[n] = {
            ...a
          };
          for (const l in o)
            if (Object.prototype.hasOwnProperty.call(o, l)) {
              const f = l;
              r[n][f] = yi(o[f], a[f]);
            }
        }
      } else r[n] === void 0 && (r[n] = e[n]);
    }
  return r;
}
function Zc(e, t = Number.MIN_SAFE_INTEGER, r = Number.MAX_SAFE_INTEGER) {
  return Math.max(t, Math.min(e, r));
}
function Ii(e, t = 0, r = 1) {
  return process.env.NODE_ENV !== "production" && (e < t || e > r) && console.error(`MUI: The value provided ${e} is out of range [${t}, ${r}].`), Zc(e, t, r);
}
function Gc(e) {
  e = e.slice(1);
  const t = new RegExp(`.{1,${e.length >= 6 ? 2 : 1}}`, "g");
  let r = e.match(t);
  return r && r[0].length === 1 && (r = r.map((i) => i + i)), process.env.NODE_ENV !== "production" && e.length !== e.trim().length && console.error(`MUI: The color: "${e}" is invalid. Make sure the color input doesn't contain leading/trailing space.`), r ? `rgb${r.length === 4 ? "a" : ""}(${r.map((i, n) => n < 3 ? parseInt(i, 16) : Math.round(parseInt(i, 16) / 255 * 1e3) / 1e3).join(", ")})` : "";
}
function Qt(e) {
  if (e.type)
    return e;
  if (e.charAt(0) === "#")
    return Qt(Gc(e));
  const t = e.indexOf("("), r = e.substring(0, t);
  if (!["rgb", "rgba", "hsl", "hsla", "color"].includes(r))
    throw new Error(process.env.NODE_ENV !== "production" ? `MUI: Unsupported \`${e}\` color.
The following formats are supported: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla(), color().` : Jt(9, e));
  let i = e.substring(t + 1, e.length - 1), n;
  if (r === "color") {
    if (i = i.split(" "), n = i.shift(), i.length === 4 && i[3].charAt(0) === "/" && (i[3] = i[3].slice(1)), !["srgb", "display-p3", "a98-rgb", "prophoto-rgb", "rec-2020"].includes(n))
      throw new Error(process.env.NODE_ENV !== "production" ? `MUI: unsupported \`${n}\` color space.
The following color spaces are supported: srgb, display-p3, a98-rgb, prophoto-rgb, rec-2020.` : Jt(10, n));
  } else
    i = i.split(",");
  return i = i.map((o) => parseFloat(o)), {
    type: r,
    values: i,
    colorSpace: n
  };
}
const Yc = (e) => {
  const t = Qt(e);
  return t.values.slice(0, 3).map((r, i) => t.type.includes("hsl") && i !== 0 ? `${r}%` : r).join(" ");
}, Lr = (e, t) => {
  try {
    return Yc(e);
  } catch {
    return t && process.env.NODE_ENV !== "production" && console.warn(t), e;
  }
};
function Fn(e) {
  const {
    type: t,
    colorSpace: r
  } = e;
  let {
    values: i
  } = e;
  return t.includes("rgb") ? i = i.map((n, o) => o < 3 ? parseInt(n, 10) : n) : t.includes("hsl") && (i[1] = `${i[1]}%`, i[2] = `${i[2]}%`), t.includes("color") ? i = `${r} ${i.join(" ")}` : i = `${i.join(", ")}`, `${t}(${i})`;
}
function za(e) {
  e = Qt(e);
  const {
    values: t
  } = e, r = t[0], i = t[1] / 100, n = t[2] / 100, o = i * Math.min(n, 1 - n), a = (h, s = (h + r / 30) % 12) => n - o * Math.max(Math.min(s - 3, 9 - s, 1), -1);
  let l = "rgb";
  const f = [Math.round(a(0) * 255), Math.round(a(8) * 255), Math.round(a(4) * 255)];
  return e.type === "hsla" && (l += "a", f.push(t[3])), Fn({
    type: l,
    values: f
  });
}
function gi(e) {
  e = Qt(e);
  let t = e.type === "hsl" || e.type === "hsla" ? Qt(za(e)).values : e.values;
  return t = t.map((r) => (e.type !== "color" && (r /= 255), r <= 0.03928 ? r / 12.92 : ((r + 0.055) / 1.055) ** 2.4)), Number((0.2126 * t[0] + 0.7152 * t[1] + 0.0722 * t[2]).toFixed(3));
}
function Ao(e, t) {
  const r = gi(e), i = gi(t);
  return (Math.max(r, i) + 0.05) / (Math.min(r, i) + 0.05);
}
function Vc(e, t) {
  return e = Qt(e), t = Ii(t), (e.type === "rgb" || e.type === "hsl") && (e.type += "a"), e.type === "color" ? e.values[3] = `/${t}` : e.values[3] = t, Fn(e);
}
function en(e, t, r) {
  try {
    return Vc(e, t);
  } catch {
    return e;
  }
}
function Li(e, t) {
  if (e = Qt(e), t = Ii(t), e.type.includes("hsl"))
    e.values[2] *= 1 - t;
  else if (e.type.includes("rgb") || e.type.includes("color"))
    for (let r = 0; r < 3; r += 1)
      e.values[r] *= 1 - t;
  return Fn(e);
}
function Je(e, t, r) {
  try {
    return Li(e, t);
  } catch {
    return e;
  }
}
function Mi(e, t) {
  if (e = Qt(e), t = Ii(t), e.type.includes("hsl"))
    e.values[2] += (100 - e.values[2]) * t;
  else if (e.type.includes("rgb"))
    for (let r = 0; r < 3; r += 1)
      e.values[r] += (255 - e.values[r]) * t;
  else if (e.type.includes("color"))
    for (let r = 0; r < 3; r += 1)
      e.values[r] += (1 - e.values[r]) * t;
  return Fn(e);
}
function Qe(e, t, r) {
  try {
    return Mi(e, t);
  } catch {
    return e;
  }
}
function Kc(e, t = 0.15) {
  return gi(e) > 0.5 ? Li(e, t) : Mi(e, t);
}
function tn(e, t, r) {
  try {
    return Kc(e, t);
  } catch {
    return e;
  }
}
function qc(e, t, r = void 0) {
  const i = {};
  for (const n in e) {
    const o = e[n];
    let a = "", l = !0;
    for (let f = 0; f < o.length; f += 1) {
      const h = o[f];
      h && (a += (l === !0 ? "" : " ") + t(h), l = !1, r && r[h] && (a += " " + r[h]));
    }
    i[n] = a;
  }
  return i;
}
const Xc = /* @__PURE__ */ _t.createContext(void 0);
process.env.NODE_ENV !== "production" && (Pe.node, Pe.object);
function Jc(e) {
  const {
    theme: t,
    name: r,
    props: i
  } = e;
  if (!t || !t.components || !t.components[r])
    return i;
  const n = t.components[r];
  return n.defaultProps ? yi(n.defaultProps, i) : !n.styleOverrides && !n.variants ? yi(n, i) : i;
}
function Qc({
  props: e,
  name: t
}) {
  const r = _t.useContext(Xc);
  return Jc({
    props: e,
    name: t,
    theme: {
      components: r
    }
  });
}
const Ro = {
  theme: void 0
};
function eu(e) {
  let t, r;
  return function(n) {
    let o = t;
    return (o === void 0 || n.theme !== r) && (Ro.theme = n.theme, o = Da(e(Ro)), t = o, r = n.theme), o;
  };
}
function tu(e = "") {
  function t(...i) {
    if (!i.length)
      return "";
    const n = i[0];
    return typeof n == "string" && !n.match(/(#|\(|\)|(-?(\d*\.)?\d+)(px|em|%|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc))|^(-?(\d*\.)?\d+)$|(\d+ \d+ \d+)/) ? `, var(--${e ? `${e}-` : ""}${n}${t(...i.slice(1))})` : `, ${n}`;
  }
  return (i, ...n) => `var(--${e ? `${e}-` : ""}${i}${t(...n)})`;
}
const xo = (e, t, r, i = []) => {
  let n = e;
  t.forEach((o, a) => {
    a === t.length - 1 ? Array.isArray(n) ? n[Number(o)] = r : n && typeof n == "object" && (n[o] = r) : n && typeof n == "object" && (n[o] || (n[o] = i.includes(o) ? [] : {}), n = n[o]);
  });
}, ru = (e, t, r) => {
  function i(n, o = [], a = []) {
    Object.entries(n).forEach(([l, f]) => {
      (!r || r && !r([...o, l])) && f != null && (typeof f == "object" && Object.keys(f).length > 0 ? i(f, [...o, l], Array.isArray(f) ? [...a, l] : a) : t([...o, l], f, a));
    });
  }
  i(e);
}, nu = (e, t) => typeof t == "number" ? ["lineHeight", "fontWeight", "opacity", "zIndex"].some((i) => e.includes(i)) || e[e.length - 1].toLowerCase().includes("opacity") ? t : `${t}px` : t;
function Vn(e, t) {
  const {
    prefix: r,
    shouldSkipGeneratingVar: i
  } = t || {}, n = {}, o = {}, a = {};
  return ru(
    e,
    (l, f, h) => {
      if ((typeof f == "string" || typeof f == "number") && (!i || !i(l, f))) {
        const s = `--${r ? `${r}-` : ""}${l.join("-")}`, u = nu(l, f);
        Object.assign(n, {
          [s]: u
        }), xo(o, l, `var(${s})`, h), xo(a, l, `var(${s}, ${u})`, h);
      }
    },
    (l) => l[0] === "vars"
    // skip 'vars/*' paths
  ), {
    css: n,
    vars: o,
    varsWithDefaults: a
  };
}
function iu(e, t = {}) {
  const {
    getSelector: r = _,
    disableCssColorScheme: i,
    colorSchemeSelector: n
  } = t, {
    colorSchemes: o = {},
    components: a,
    defaultColorScheme: l = "light",
    ...f
  } = e, {
    vars: h,
    css: s,
    varsWithDefaults: u
  } = Vn(f, t);
  let c = u;
  const p = {}, {
    [l]: m,
    ...d
  } = o;
  if (Object.entries(d || {}).forEach(([E, T]) => {
    const {
      vars: x,
      css: A,
      varsWithDefaults: I
    } = Vn(T, t);
    c = Ct(c, I), p[E] = {
      css: A,
      vars: x
    };
  }), m) {
    const {
      css: E,
      vars: T,
      varsWithDefaults: x
    } = Vn(m, t);
    c = Ct(c, x), p[l] = {
      css: E,
      vars: T
    };
  }
  function _(E, T) {
    var A, I;
    let x = n;
    if (n === "class" && (x = ".%s"), n === "data" && (x = "[data-%s]"), n != null && n.startsWith("data-") && !n.includes("%s") && (x = `[${n}="%s"]`), E) {
      if (x === "media")
        return e.defaultColorScheme === E ? ":root" : {
          [`@media (prefers-color-scheme: ${((I = (A = o[E]) == null ? void 0 : A.palette) == null ? void 0 : I.mode) || E})`]: {
            ":root": T
          }
        };
      if (x)
        return e.defaultColorScheme === E ? `:root, ${x.replace("%s", String(E))}` : x.replace("%s", String(E));
    }
    return ":root";
  }
  return {
    vars: c,
    generateThemeVars: () => {
      let E = {
        ...h
      };
      return Object.entries(p).forEach(([, {
        vars: T
      }]) => {
        E = Ct(E, T);
      }), E;
    },
    generateStyleSheets: () => {
      var R, M;
      const E = [], T = e.defaultColorScheme || "light";
      function x(b, N) {
        Object.keys(N).length && E.push(typeof b == "string" ? {
          [b]: {
            ...N
          }
        } : b);
      }
      x(r(void 0, {
        ...s
      }), s);
      const {
        [T]: A,
        ...I
      } = p;
      if (A) {
        const {
          css: b
        } = A, N = (M = (R = o[T]) == null ? void 0 : R.palette) == null ? void 0 : M.mode, j = !i && N ? {
          colorScheme: N,
          ...b
        } : {
          ...b
        };
        x(r(T, {
          ...j
        }), j);
      }
      return Object.entries(I).forEach(([b, {
        css: N
      }]) => {
        var re, ne;
        const j = (ne = (re = o[b]) == null ? void 0 : re.palette) == null ? void 0 : ne.mode, $ = !i && j ? {
          colorScheme: j,
          ...N
        } : {
          ...N
        };
        x(r(b, {
          ...$
        }), $);
      }), E;
    }
  };
}
function ou(e) {
  return function(r) {
    return e === "media" ? (process.env.NODE_ENV !== "production" && r !== "light" && r !== "dark" && console.error(`MUI: @media (prefers-color-scheme) supports only 'light' or 'dark', but receive '${r}'.`), `@media (prefers-color-scheme: ${r})`) : e ? e.startsWith("data-") && !e.includes("%s") ? `[${e}="${r}"] &` : e === "class" ? `.${r} &` : e === "data" ? `[data-${r}] &` : `${e.replace("%s", r)} &` : "&";
  };
}
function Ha() {
  return {
    // The colors used to style the text.
    text: {
      // The most important text.
      primary: "rgba(0, 0, 0, 0.87)",
      // Secondary text.
      secondary: "rgba(0, 0, 0, 0.6)",
      // Disabled text have even lower visual prominence.
      disabled: "rgba(0, 0, 0, 0.38)"
    },
    // The color used to divide different elements.
    divider: "rgba(0, 0, 0, 0.12)",
    // The background colors used to style the surfaces.
    // Consistency between these values is important.
    background: {
      paper: Dr.white,
      default: Dr.white
    },
    // The colors used to style the action elements.
    action: {
      // The color of an active action like an icon button.
      active: "rgba(0, 0, 0, 0.54)",
      // The color of an hovered action.
      hover: "rgba(0, 0, 0, 0.04)",
      hoverOpacity: 0.04,
      // The color of a selected action.
      selected: "rgba(0, 0, 0, 0.08)",
      selectedOpacity: 0.08,
      // The color of a disabled action.
      disabled: "rgba(0, 0, 0, 0.26)",
      // The background color of a disabled action.
      disabledBackground: "rgba(0, 0, 0, 0.12)",
      disabledOpacity: 0.38,
      focus: "rgba(0, 0, 0, 0.12)",
      focusOpacity: 0.12,
      activatedOpacity: 0.12
    }
  };
}
const au = Ha();
function $a() {
  return {
    text: {
      primary: Dr.white,
      secondary: "rgba(255, 255, 255, 0.7)",
      disabled: "rgba(255, 255, 255, 0.5)",
      icon: "rgba(255, 255, 255, 0.5)"
    },
    divider: "rgba(255, 255, 255, 0.12)",
    background: {
      paper: "#121212",
      default: "#121212"
    },
    action: {
      active: Dr.white,
      hover: "rgba(255, 255, 255, 0.08)",
      hoverOpacity: 0.08,
      selected: "rgba(255, 255, 255, 0.16)",
      selectedOpacity: 0.16,
      disabled: "rgba(255, 255, 255, 0.3)",
      disabledBackground: "rgba(255, 255, 255, 0.12)",
      disabledOpacity: 0.38,
      focus: "rgba(255, 255, 255, 0.12)",
      focusOpacity: 0.12,
      activatedOpacity: 0.24
    }
  };
}
const ko = $a();
function Co(e, t, r, i) {
  const n = i.light || i, o = i.dark || i * 1.5;
  e[t] || (e.hasOwnProperty(r) ? e[t] = e[r] : t === "light" ? e.light = Mi(e.main, n) : t === "dark" && (e.dark = Li(e.main, o)));
}
function su(e = "light") {
  return e === "dark" ? {
    main: fr[200],
    light: fr[50],
    dark: fr[400]
  } : {
    main: fr[700],
    light: fr[400],
    dark: fr[800]
  };
}
function lu(e = "light") {
  return e === "dark" ? {
    main: lr[200],
    light: lr[50],
    dark: lr[400]
  } : {
    main: lr[500],
    light: lr[300],
    dark: lr[700]
  };
}
function fu(e = "light") {
  return e === "dark" ? {
    main: sr[500],
    light: sr[300],
    dark: sr[700]
  } : {
    main: sr[700],
    light: sr[400],
    dark: sr[800]
  };
}
function cu(e = "light") {
  return e === "dark" ? {
    main: cr[400],
    light: cr[300],
    dark: cr[700]
  } : {
    main: cr[700],
    light: cr[500],
    dark: cr[900]
  };
}
function uu(e = "light") {
  return e === "dark" ? {
    main: ur[400],
    light: ur[300],
    dark: ur[700]
  } : {
    main: ur[800],
    light: ur[500],
    dark: ur[900]
  };
}
function du(e = "light") {
  return e === "dark" ? {
    main: Cr[400],
    light: Cr[300],
    dark: Cr[700]
  } : {
    main: "#ed6c02",
    // closest to orange[800] that pass 3:1.
    light: Cr[500],
    dark: Cr[900]
  };
}
function Ni(e) {
  const {
    mode: t = "light",
    contrastThreshold: r = 3,
    tonalOffset: i = 0.2,
    ...n
  } = e, o = e.primary || su(t), a = e.secondary || lu(t), l = e.error || fu(t), f = e.info || cu(t), h = e.success || uu(t), s = e.warning || du(t);
  function u(d) {
    const _ = Ao(d, ko.text.primary) >= r ? ko.text.primary : au.text.primary;
    if (process.env.NODE_ENV !== "production") {
      const v = Ao(d, _);
      v < 3 && console.error([`MUI: The contrast ratio of ${v}:1 for ${_} on ${d}`, "falls below the WCAG recommended absolute minimum contrast ratio of 3:1.", "https://www.w3.org/TR/2008/REC-WCAG20-20081211/#visual-audio-contrast-contrast"].join(`
`));
    }
    return _;
  }
  const c = ({
    color: d,
    name: _,
    mainShade: v = 500,
    lightShade: k = 300,
    darkShade: E = 700
  }) => {
    if (d = {
      ...d
    }, !d.main && d[v] && (d.main = d[v]), !d.hasOwnProperty("main"))
      throw new Error(process.env.NODE_ENV !== "production" ? `MUI: The color${_ ? ` (${_})` : ""} provided to augmentColor(color) is invalid.
The color object needs to have a \`main\` property or a \`${v}\` property.` : Jt(11, _ ? ` (${_})` : "", v));
    if (typeof d.main != "string")
      throw new Error(process.env.NODE_ENV !== "production" ? `MUI: The color${_ ? ` (${_})` : ""} provided to augmentColor(color) is invalid.
\`color.main\` should be a string, but \`${JSON.stringify(d.main)}\` was provided instead.

Did you intend to use one of the following approaches?

import { green } from "@mui/material/colors";

const theme1 = createTheme({ palette: {
  primary: green,
} });

const theme2 = createTheme({ palette: {
  primary: { main: green[500] },
} });` : Jt(12, _ ? ` (${_})` : "", JSON.stringify(d.main)));
    return Co(d, "light", k, i), Co(d, "dark", E, i), d.contrastText || (d.contrastText = u(d.main)), d;
  };
  let p;
  return t === "light" ? p = Ha() : t === "dark" && (p = $a()), process.env.NODE_ENV !== "production" && (p || console.error(`MUI: The palette mode \`${t}\` is not supported.`)), Ct({
    // A collection of common colors.
    common: {
      ...Dr
    },
    // prevent mutable object.
    // The palette mode, can be light or dark.
    mode: t,
    // The colors used to represent primary interface elements for a user.
    primary: c({
      color: o,
      name: "primary"
    }),
    // The colors used to represent secondary interface elements for a user.
    secondary: c({
      color: a,
      name: "secondary",
      mainShade: "A400",
      lightShade: "A200",
      darkShade: "A700"
    }),
    // The colors used to represent interface elements that the user should be made aware of.
    error: c({
      color: l,
      name: "error"
    }),
    // The colors used to represent potentially dangerous actions or important messages.
    warning: c({
      color: s,
      name: "warning"
    }),
    // The colors used to present information to the user that is neutral and not necessarily important.
    info: c({
      color: f,
      name: "info"
    }),
    // The colors used to indicate the successful completion of an action that user triggered.
    success: c({
      color: h,
      name: "success"
    }),
    // The grey colors.
    grey: Tl,
    // Used by `getContrastText()` to maximize the contrast between
    // the background and the text.
    contrastThreshold: r,
    // Takes a background color and returns the text color that maximizes the contrast.
    getContrastText: u,
    // Generate a rich color object.
    augmentColor: c,
    // Used by the functions below to shift a color's luminance by approximately
    // two indexes within its tonal palette.
    // E.g., shift from Red 500 to Red 300 or Red 700.
    tonalOffset: i,
    // The light and dark mode object.
    ...p
  }, n);
}
function hu(e) {
  const t = {};
  return Object.entries(e).forEach((i) => {
    const [n, o] = i;
    typeof o == "object" && (t[n] = `${o.fontStyle ? `${o.fontStyle} ` : ""}${o.fontVariant ? `${o.fontVariant} ` : ""}${o.fontWeight ? `${o.fontWeight} ` : ""}${o.fontStretch ? `${o.fontStretch} ` : ""}${o.fontSize || ""}${o.lineHeight ? `/${o.lineHeight} ` : ""}${o.fontFamily || ""}`);
  }), t;
}
function pu(e, t) {
  return {
    toolbar: {
      minHeight: 56,
      [e.up("xs")]: {
        "@media (orientation: landscape)": {
          minHeight: 48
        }
      },
      [e.up("sm")]: {
        minHeight: 64
      }
    },
    ...t
  };
}
function yu(e) {
  return Math.round(e * 1e5) / 1e5;
}
const Oo = {
  textTransform: "uppercase"
}, Po = '"Roboto", "Helvetica", "Arial", sans-serif';
function gu(e, t) {
  const {
    fontFamily: r = Po,
    // The default font size of the Material Specification.
    fontSize: i = 14,
    // px
    fontWeightLight: n = 300,
    fontWeightRegular: o = 400,
    fontWeightMedium: a = 500,
    fontWeightBold: l = 700,
    // Tell MUI what's the font-size on the html element.
    // 16px is the default font-size used by browsers.
    htmlFontSize: f = 16,
    // Apply the CSS properties to all the variants.
    allVariants: h,
    pxToRem: s,
    ...u
  } = typeof t == "function" ? t(e) : t;
  process.env.NODE_ENV !== "production" && (typeof i != "number" && console.error("MUI: `fontSize` is required to be a number."), typeof f != "number" && console.error("MUI: `htmlFontSize` is required to be a number."));
  const c = i / 14, p = s || ((_) => `${_ / f * c}rem`), m = (_, v, k, E, T) => ({
    fontFamily: r,
    fontWeight: _,
    fontSize: p(v),
    // Unitless following https://meyerweb.com/eric/thoughts/2006/02/08/unitless-line-heights/
    lineHeight: k,
    // The letter spacing was designed for the Roboto font-family. Using the same letter-spacing
    // across font-families can cause issues with the kerning.
    ...r === Po ? {
      letterSpacing: `${yu(E / v)}em`
    } : {},
    ...T,
    ...h
  }), d = {
    h1: m(n, 96, 1.167, -1.5),
    h2: m(n, 60, 1.2, -0.5),
    h3: m(o, 48, 1.167, 0),
    h4: m(o, 34, 1.235, 0.25),
    h5: m(o, 24, 1.334, 0),
    h6: m(a, 20, 1.6, 0.15),
    subtitle1: m(o, 16, 1.75, 0.15),
    subtitle2: m(a, 14, 1.57, 0.1),
    body1: m(o, 16, 1.5, 0.15),
    body2: m(o, 14, 1.43, 0.15),
    button: m(a, 14, 1.75, 0.4, Oo),
    caption: m(o, 12, 1.66, 0.4),
    overline: m(o, 12, 2.66, 1, Oo),
    // TODO v6: Remove handling of 'inherit' variant from the theme as it is already handled in Material UI's Typography component. Also, remember to remove the associated types.
    inherit: {
      fontFamily: "inherit",
      fontWeight: "inherit",
      fontSize: "inherit",
      lineHeight: "inherit",
      letterSpacing: "inherit"
    }
  };
  return Ct({
    htmlFontSize: f,
    pxToRem: p,
    fontFamily: r,
    fontSize: i,
    fontWeightLight: n,
    fontWeightRegular: o,
    fontWeightMedium: a,
    fontWeightBold: l,
    ...d
  }, u, {
    clone: !1
    // No need to clone deep
  });
}
const mu = 0.2, bu = 0.14, _u = 0.12;
function rt(...e) {
  return [`${e[0]}px ${e[1]}px ${e[2]}px ${e[3]}px rgba(0,0,0,${mu})`, `${e[4]}px ${e[5]}px ${e[6]}px ${e[7]}px rgba(0,0,0,${bu})`, `${e[8]}px ${e[9]}px ${e[10]}px ${e[11]}px rgba(0,0,0,${_u})`].join(",");
}
const vu = ["none", rt(0, 2, 1, -1, 0, 1, 1, 0, 0, 1, 3, 0), rt(0, 3, 1, -2, 0, 2, 2, 0, 0, 1, 5, 0), rt(0, 3, 3, -2, 0, 3, 4, 0, 0, 1, 8, 0), rt(0, 2, 4, -1, 0, 4, 5, 0, 0, 1, 10, 0), rt(0, 3, 5, -1, 0, 5, 8, 0, 0, 1, 14, 0), rt(0, 3, 5, -1, 0, 6, 10, 0, 0, 1, 18, 0), rt(0, 4, 5, -2, 0, 7, 10, 1, 0, 2, 16, 1), rt(0, 5, 5, -3, 0, 8, 10, 1, 0, 3, 14, 2), rt(0, 5, 6, -3, 0, 9, 12, 1, 0, 3, 16, 2), rt(0, 6, 6, -3, 0, 10, 14, 1, 0, 4, 18, 3), rt(0, 6, 7, -4, 0, 11, 15, 1, 0, 4, 20, 3), rt(0, 7, 8, -4, 0, 12, 17, 2, 0, 5, 22, 4), rt(0, 7, 8, -4, 0, 13, 19, 2, 0, 5, 24, 4), rt(0, 7, 9, -4, 0, 14, 21, 2, 0, 5, 26, 4), rt(0, 8, 9, -5, 0, 15, 22, 2, 0, 6, 28, 5), rt(0, 8, 10, -5, 0, 16, 24, 2, 0, 6, 30, 5), rt(0, 8, 11, -5, 0, 17, 26, 2, 0, 6, 32, 5), rt(0, 9, 11, -5, 0, 18, 28, 2, 0, 7, 34, 6), rt(0, 9, 12, -6, 0, 19, 29, 2, 0, 7, 36, 6), rt(0, 10, 13, -6, 0, 20, 31, 3, 0, 8, 38, 7), rt(0, 10, 13, -6, 0, 21, 33, 3, 0, 8, 40, 7), rt(0, 10, 14, -6, 0, 22, 35, 3, 0, 8, 42, 7), rt(0, 11, 14, -7, 0, 23, 36, 3, 0, 9, 44, 8), rt(0, 11, 15, -7, 0, 24, 38, 3, 0, 9, 46, 8)], wu = {
  // This is the most common easing curve.
  easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
  // Objects enter the screen at full velocity from off-screen and
  // slowly decelerate to a resting point.
  easeOut: "cubic-bezier(0.0, 0, 0.2, 1)",
  // Objects leave the screen at full velocity. They do not decelerate when off-screen.
  easeIn: "cubic-bezier(0.4, 0, 1, 1)",
  // The sharp curve is used by objects that may return to the screen at any time.
  sharp: "cubic-bezier(0.4, 0, 0.6, 1)"
}, Eu = {
  shortest: 150,
  shorter: 200,
  short: 250,
  // most basic recommended timing
  standard: 300,
  // this is to be used in complex animations
  complex: 375,
  // recommended when something is entering screen
  enteringScreen: 225,
  // recommended when something is leaving screen
  leavingScreen: 195
};
function Io(e) {
  return `${Math.round(e)}ms`;
}
function Su(e) {
  if (!e)
    return 0;
  const t = e / 36;
  return Math.min(Math.round((4 + 15 * t ** 0.25 + t / 5) * 10), 3e3);
}
function Tu(e) {
  const t = {
    ...wu,
    ...e.easing
  }, r = {
    ...Eu,
    ...e.duration
  };
  return {
    getAutoHeightDuration: Su,
    create: (n = ["all"], o = {}) => {
      const {
        duration: a = r.standard,
        easing: l = t.easeInOut,
        delay: f = 0,
        ...h
      } = o;
      if (process.env.NODE_ENV !== "production") {
        const s = (c) => typeof c == "string", u = (c) => !Number.isNaN(parseFloat(c));
        !s(n) && !Array.isArray(n) && console.error('MUI: Argument "props" must be a string or Array.'), !u(a) && !s(a) && console.error(`MUI: Argument "duration" must be a number or a string but found ${a}.`), s(l) || console.error('MUI: Argument "easing" must be a string.'), !u(f) && !s(f) && console.error('MUI: Argument "delay" must be a number or a string.'), typeof o != "object" && console.error(["MUI: Secong argument of transition.create must be an object.", "Arguments should be either `create('prop1', options)` or `create(['prop1', 'prop2'], options)`"].join(`
`)), Object.keys(h).length !== 0 && console.error(`MUI: Unrecognized argument(s) [${Object.keys(h).join(",")}].`);
      }
      return (Array.isArray(n) ? n : [n]).map((s) => `${s} ${typeof a == "string" ? a : Io(a)} ${l} ${typeof f == "string" ? f : Io(f)}`).join(",");
    },
    ...e,
    easing: t,
    duration: r
  };
}
const Au = {
  mobileStepper: 1e3,
  fab: 1050,
  speedDial: 1050,
  appBar: 1100,
  drawer: 1200,
  modal: 1300,
  snackbar: 1400,
  tooltip: 1500
};
function Ru(e) {
  return zt(e) || typeof e > "u" || typeof e == "string" || typeof e == "boolean" || typeof e == "number" || Array.isArray(e);
}
function Wa(e = {}) {
  const t = {
    ...e
  };
  function r(i) {
    const n = Object.entries(i);
    for (let o = 0; o < n.length; o++) {
      const [a, l] = n[o];
      !Ru(l) || a.startsWith("unstable_") ? delete i[a] : zt(l) && (i[a] = {
        ...l
      }, r(i[a]));
    }
  }
  return r(t), `import { unstable_createBreakpoints as createBreakpoints, createTransitions } from '@mui/material/styles';

const theme = ${JSON.stringify(t, null, 2)};

theme.breakpoints = createBreakpoints(theme.breakpoints || {});
theme.transitions = createTransitions(theme.transitions || {});

export default theme;`;
}
function mi(e = {}, ...t) {
  const {
    breakpoints: r,
    mixins: i = {},
    spacing: n,
    palette: o = {},
    transitions: a = {},
    typography: l = {},
    shape: f,
    ...h
  } = e;
  if (e.vars && // The error should throw only for the root theme creation because user is not allowed to use a custom node `vars`.
  // `generateThemeVars` is the closest identifier for checking that the `options` is a result of `createTheme` with CSS variables so that user can create new theme for nested ThemeProvider.
  e.generateThemeVars === void 0)
    throw new Error(process.env.NODE_ENV !== "production" ? "MUI: `vars` is a private field used for CSS variables support.\nPlease use another name or follow the [docs](https://mui.com/material-ui/customization/css-theme-variables/usage/) to enable the feature." : Jt(20));
  const s = Ni(o), u = Oi(e);
  let c = Ct(u, {
    mixins: pu(u.breakpoints, i),
    palette: s,
    // Don't use [...shadows] until you've verified its transpiled code is not invoking the iterator protocol.
    shadows: vu.slice(),
    typography: gu(s, l),
    transitions: Tu(a),
    zIndex: {
      ...Au
    }
  });
  if (c = Ct(c, h), c = t.reduce((p, m) => Ct(p, m), c), process.env.NODE_ENV !== "production") {
    const p = ["active", "checked", "completed", "disabled", "error", "expanded", "focused", "focusVisible", "required", "selected"], m = (d, _) => {
      let v;
      for (v in d) {
        const k = d[v];
        if (p.includes(v) && Object.keys(k).length > 0) {
          if (process.env.NODE_ENV !== "production") {
            const E = Pi("", v);
            console.error([`MUI: The \`${_}\` component increases the CSS specificity of the \`${v}\` internal state.`, "You can not override it like this: ", JSON.stringify(d, null, 2), "", `Instead, you need to use the '&.${E}' syntax:`, JSON.stringify({
              root: {
                [`&.${E}`]: k
              }
            }, null, 2), "", "https://mui.com/r/state-classes-guide"].join(`
`));
          }
          d[v] = {};
        }
      }
    };
    Object.keys(c.components).forEach((d) => {
      const _ = c.components[d].styleOverrides;
      _ && d.startsWith("Mui") && m(_, d);
    });
  }
  return c.unstable_sxConfig = {
    ...Yr,
    ...h == null ? void 0 : h.unstable_sxConfig
  }, c.unstable_sx = function(m) {
    return ar({
      sx: m,
      theme: this
    });
  }, c.toRuntimeSource = Wa, c;
}
function xu(e) {
  let t;
  return e < 1 ? t = 5.11916 * e ** 2 : t = 4.5 * Math.log(e + 1) + 2, Math.round(t * 10) / 1e3;
}
const ku = [...Array(25)].map((e, t) => {
  if (t === 0)
    return "none";
  const r = xu(t);
  return `linear-gradient(rgba(255 255 255 / ${r}), rgba(255 255 255 / ${r}))`;
});
function Za(e) {
  return {
    inputPlaceholder: e === "dark" ? 0.5 : 0.42,
    inputUnderline: e === "dark" ? 0.7 : 0.42,
    switchTrackDisabled: e === "dark" ? 0.2 : 0.12,
    switchTrack: e === "dark" ? 0.3 : 0.38
  };
}
function Ga(e) {
  return e === "dark" ? ku : [];
}
function Cu(e) {
  const {
    palette: t = {
      mode: "light"
    },
    // need to cast to avoid module augmentation test
    opacity: r,
    overlays: i,
    ...n
  } = e, o = Ni(t);
  return {
    palette: o,
    opacity: {
      ...Za(o.mode),
      ...r
    },
    overlays: i || Ga(o.mode),
    ...n
  };
}
function Ou(e) {
  var t;
  return !!e[0].match(/(cssVarPrefix|colorSchemeSelector|modularCssLayers|rootSelector|typography|mixins|breakpoints|direction|transitions)/) || !!e[0].match(/sxConfig$/) || // ends with sxConfig
  e[0] === "palette" && !!((t = e[1]) != null && t.match(/(mode|contrastThreshold|tonalOffset)/));
}
const Pu = (e) => [...[...Array(25)].map((t, r) => `--${e ? `${e}-` : ""}overlays-${r}`), `--${e ? `${e}-` : ""}palette-AppBar-darkBg`, `--${e ? `${e}-` : ""}palette-AppBar-darkColor`], Iu = (e) => (t, r) => {
  const i = e.rootSelector || ":root", n = e.colorSchemeSelector;
  let o = n;
  if (n === "class" && (o = ".%s"), n === "data" && (o = "[data-%s]"), n != null && n.startsWith("data-") && !n.includes("%s") && (o = `[${n}="%s"]`), e.defaultColorScheme === t) {
    if (t === "dark") {
      const a = {};
      return Pu(e.cssVarPrefix).forEach((l) => {
        a[l] = r[l], delete r[l];
      }), o === "media" ? {
        [i]: r,
        "@media (prefers-color-scheme: dark)": {
          [i]: a
        }
      } : o ? {
        [o.replace("%s", t)]: a,
        [`${i}, ${o.replace("%s", t)}`]: r
      } : {
        [i]: {
          ...r,
          ...a
        }
      };
    }
    if (o && o !== "media")
      return `${i}, ${o.replace("%s", String(t))}`;
  } else if (t) {
    if (o === "media")
      return {
        [`@media (prefers-color-scheme: ${String(t)})`]: {
          [i]: r
        }
      };
    if (o)
      return o.replace("%s", String(t));
  }
  return i;
};
function Lu(e, t) {
  t.forEach((r) => {
    e[r] || (e[r] = {});
  });
}
function ye(e, t, r) {
  !e[t] && r && (e[t] = r);
}
function Mr(e) {
  return typeof e != "string" || !e.startsWith("hsl") ? e : za(e);
}
function Gt(e, t) {
  `${t}Channel` in e || (e[`${t}Channel`] = Lr(Mr(e[t]), `MUI: Can't create \`palette.${t}Channel\` because \`palette.${t}\` is not one of these formats: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla(), color().
To suppress this warning, you need to explicitly provide the \`palette.${t}Channel\` as a string (in rgb format, for example "12 12 12") or undefined if you want to remove the channel token.`));
}
function Mu(e) {
  return typeof e == "number" ? `${e}px` : typeof e == "string" || typeof e == "function" || Array.isArray(e) ? e : "8px";
}
const Dt = (e) => {
  try {
    return e();
  } catch {
  }
}, Nu = (e = "mui") => tu(e);
function Kn(e, t, r, i) {
  if (!t)
    return;
  t = t === !0 ? {} : t;
  const n = i === "dark" ? "dark" : "light";
  if (!r) {
    e[i] = Cu({
      ...t,
      palette: {
        mode: n,
        ...t == null ? void 0 : t.palette
      }
    });
    return;
  }
  const {
    palette: o,
    ...a
  } = mi({
    ...r,
    palette: {
      mode: n,
      ...t == null ? void 0 : t.palette
    }
  });
  return e[i] = {
    ...t,
    palette: o,
    opacity: {
      ...Za(n),
      ...t == null ? void 0 : t.opacity
    },
    overlays: (t == null ? void 0 : t.overlays) || Ga(n)
  }, a;
}
function Bu(e = {}, ...t) {
  const {
    colorSchemes: r = {
      light: !0
    },
    defaultColorScheme: i,
    disableCssColorScheme: n = !1,
    cssVarPrefix: o = "mui",
    shouldSkipGeneratingVar: a = Ou,
    colorSchemeSelector: l = r.light && r.dark ? "media" : void 0,
    rootSelector: f = ":root",
    ...h
  } = e, s = Object.keys(r)[0], u = i || (r.light && s !== "light" ? "light" : s), c = Nu(o), {
    [u]: p,
    light: m,
    dark: d,
    ..._
  } = r, v = {
    ..._
  };
  let k = p;
  if ((u === "dark" && !("dark" in r) || u === "light" && !("light" in r)) && (k = !0), !k)
    throw new Error(process.env.NODE_ENV !== "production" ? `MUI: The \`colorSchemes.${u}\` option is either missing or invalid.` : Jt(21, u));
  const E = Kn(v, k, h, u);
  m && !v.light && Kn(v, m, void 0, "light"), d && !v.dark && Kn(v, d, void 0, "dark");
  let T = {
    defaultColorScheme: u,
    ...E,
    cssVarPrefix: o,
    colorSchemeSelector: l,
    rootSelector: f,
    getCssVar: c,
    colorSchemes: v,
    font: {
      ...hu(E.typography),
      ...E.font
    },
    spacing: Mu(h.spacing)
  };
  Object.keys(T.colorSchemes).forEach((M) => {
    const b = T.colorSchemes[M].palette, N = (j) => {
      const $ = j.split("-"), re = $[1], ne = $[2];
      return c(j, b[re][ne]);
    };
    if (b.mode === "light" && (ye(b.common, "background", "#fff"), ye(b.common, "onBackground", "#000")), b.mode === "dark" && (ye(b.common, "background", "#000"), ye(b.common, "onBackground", "#fff")), Lu(b, ["Alert", "AppBar", "Avatar", "Button", "Chip", "FilledInput", "LinearProgress", "Skeleton", "Slider", "SnackbarContent", "SpeedDialAction", "StepConnector", "StepContent", "Switch", "TableCell", "Tooltip"]), b.mode === "light") {
      ye(b.Alert, "errorColor", Je(b.error.light, 0.6)), ye(b.Alert, "infoColor", Je(b.info.light, 0.6)), ye(b.Alert, "successColor", Je(b.success.light, 0.6)), ye(b.Alert, "warningColor", Je(b.warning.light, 0.6)), ye(b.Alert, "errorFilledBg", N("palette-error-main")), ye(b.Alert, "infoFilledBg", N("palette-info-main")), ye(b.Alert, "successFilledBg", N("palette-success-main")), ye(b.Alert, "warningFilledBg", N("palette-warning-main")), ye(b.Alert, "errorFilledColor", Dt(() => b.getContrastText(b.error.main))), ye(b.Alert, "infoFilledColor", Dt(() => b.getContrastText(b.info.main))), ye(b.Alert, "successFilledColor", Dt(() => b.getContrastText(b.success.main))), ye(b.Alert, "warningFilledColor", Dt(() => b.getContrastText(b.warning.main))), ye(b.Alert, "errorStandardBg", Qe(b.error.light, 0.9)), ye(b.Alert, "infoStandardBg", Qe(b.info.light, 0.9)), ye(b.Alert, "successStandardBg", Qe(b.success.light, 0.9)), ye(b.Alert, "warningStandardBg", Qe(b.warning.light, 0.9)), ye(b.Alert, "errorIconColor", N("palette-error-main")), ye(b.Alert, "infoIconColor", N("palette-info-main")), ye(b.Alert, "successIconColor", N("palette-success-main")), ye(b.Alert, "warningIconColor", N("palette-warning-main")), ye(b.AppBar, "defaultBg", N("palette-grey-100")), ye(b.Avatar, "defaultBg", N("palette-grey-400")), ye(b.Button, "inheritContainedBg", N("palette-grey-300")), ye(b.Button, "inheritContainedHoverBg", N("palette-grey-A100")), ye(b.Chip, "defaultBorder", N("palette-grey-400")), ye(b.Chip, "defaultAvatarColor", N("palette-grey-700")), ye(b.Chip, "defaultIconColor", N("palette-grey-700")), ye(b.FilledInput, "bg", "rgba(0, 0, 0, 0.06)"), ye(b.FilledInput, "hoverBg", "rgba(0, 0, 0, 0.09)"), ye(b.FilledInput, "disabledBg", "rgba(0, 0, 0, 0.12)"), ye(b.LinearProgress, "primaryBg", Qe(b.primary.main, 0.62)), ye(b.LinearProgress, "secondaryBg", Qe(b.secondary.main, 0.62)), ye(b.LinearProgress, "errorBg", Qe(b.error.main, 0.62)), ye(b.LinearProgress, "infoBg", Qe(b.info.main, 0.62)), ye(b.LinearProgress, "successBg", Qe(b.success.main, 0.62)), ye(b.LinearProgress, "warningBg", Qe(b.warning.main, 0.62)), ye(b.Skeleton, "bg", `rgba(${N("palette-text-primaryChannel")} / 0.11)`), ye(b.Slider, "primaryTrack", Qe(b.primary.main, 0.62)), ye(b.Slider, "secondaryTrack", Qe(b.secondary.main, 0.62)), ye(b.Slider, "errorTrack", Qe(b.error.main, 0.62)), ye(b.Slider, "infoTrack", Qe(b.info.main, 0.62)), ye(b.Slider, "successTrack", Qe(b.success.main, 0.62)), ye(b.Slider, "warningTrack", Qe(b.warning.main, 0.62));
      const j = tn(b.background.default, 0.8);
      ye(b.SnackbarContent, "bg", j), ye(b.SnackbarContent, "color", Dt(() => b.getContrastText(j))), ye(b.SpeedDialAction, "fabHoverBg", tn(b.background.paper, 0.15)), ye(b.StepConnector, "border", N("palette-grey-400")), ye(b.StepContent, "border", N("palette-grey-400")), ye(b.Switch, "defaultColor", N("palette-common-white")), ye(b.Switch, "defaultDisabledColor", N("palette-grey-100")), ye(b.Switch, "primaryDisabledColor", Qe(b.primary.main, 0.62)), ye(b.Switch, "secondaryDisabledColor", Qe(b.secondary.main, 0.62)), ye(b.Switch, "errorDisabledColor", Qe(b.error.main, 0.62)), ye(b.Switch, "infoDisabledColor", Qe(b.info.main, 0.62)), ye(b.Switch, "successDisabledColor", Qe(b.success.main, 0.62)), ye(b.Switch, "warningDisabledColor", Qe(b.warning.main, 0.62)), ye(b.TableCell, "border", Qe(en(b.divider, 1), 0.88)), ye(b.Tooltip, "bg", en(b.grey[700], 0.92));
    }
    if (b.mode === "dark") {
      ye(b.Alert, "errorColor", Qe(b.error.light, 0.6)), ye(b.Alert, "infoColor", Qe(b.info.light, 0.6)), ye(b.Alert, "successColor", Qe(b.success.light, 0.6)), ye(b.Alert, "warningColor", Qe(b.warning.light, 0.6)), ye(b.Alert, "errorFilledBg", N("palette-error-dark")), ye(b.Alert, "infoFilledBg", N("palette-info-dark")), ye(b.Alert, "successFilledBg", N("palette-success-dark")), ye(b.Alert, "warningFilledBg", N("palette-warning-dark")), ye(b.Alert, "errorFilledColor", Dt(() => b.getContrastText(b.error.dark))), ye(b.Alert, "infoFilledColor", Dt(() => b.getContrastText(b.info.dark))), ye(b.Alert, "successFilledColor", Dt(() => b.getContrastText(b.success.dark))), ye(b.Alert, "warningFilledColor", Dt(() => b.getContrastText(b.warning.dark))), ye(b.Alert, "errorStandardBg", Je(b.error.light, 0.9)), ye(b.Alert, "infoStandardBg", Je(b.info.light, 0.9)), ye(b.Alert, "successStandardBg", Je(b.success.light, 0.9)), ye(b.Alert, "warningStandardBg", Je(b.warning.light, 0.9)), ye(b.Alert, "errorIconColor", N("palette-error-main")), ye(b.Alert, "infoIconColor", N("palette-info-main")), ye(b.Alert, "successIconColor", N("palette-success-main")), ye(b.Alert, "warningIconColor", N("palette-warning-main")), ye(b.AppBar, "defaultBg", N("palette-grey-900")), ye(b.AppBar, "darkBg", N("palette-background-paper")), ye(b.AppBar, "darkColor", N("palette-text-primary")), ye(b.Avatar, "defaultBg", N("palette-grey-600")), ye(b.Button, "inheritContainedBg", N("palette-grey-800")), ye(b.Button, "inheritContainedHoverBg", N("palette-grey-700")), ye(b.Chip, "defaultBorder", N("palette-grey-700")), ye(b.Chip, "defaultAvatarColor", N("palette-grey-300")), ye(b.Chip, "defaultIconColor", N("palette-grey-300")), ye(b.FilledInput, "bg", "rgba(255, 255, 255, 0.09)"), ye(b.FilledInput, "hoverBg", "rgba(255, 255, 255, 0.13)"), ye(b.FilledInput, "disabledBg", "rgba(255, 255, 255, 0.12)"), ye(b.LinearProgress, "primaryBg", Je(b.primary.main, 0.5)), ye(b.LinearProgress, "secondaryBg", Je(b.secondary.main, 0.5)), ye(b.LinearProgress, "errorBg", Je(b.error.main, 0.5)), ye(b.LinearProgress, "infoBg", Je(b.info.main, 0.5)), ye(b.LinearProgress, "successBg", Je(b.success.main, 0.5)), ye(b.LinearProgress, "warningBg", Je(b.warning.main, 0.5)), ye(b.Skeleton, "bg", `rgba(${N("palette-text-primaryChannel")} / 0.13)`), ye(b.Slider, "primaryTrack", Je(b.primary.main, 0.5)), ye(b.Slider, "secondaryTrack", Je(b.secondary.main, 0.5)), ye(b.Slider, "errorTrack", Je(b.error.main, 0.5)), ye(b.Slider, "infoTrack", Je(b.info.main, 0.5)), ye(b.Slider, "successTrack", Je(b.success.main, 0.5)), ye(b.Slider, "warningTrack", Je(b.warning.main, 0.5));
      const j = tn(b.background.default, 0.98);
      ye(b.SnackbarContent, "bg", j), ye(b.SnackbarContent, "color", Dt(() => b.getContrastText(j))), ye(b.SpeedDialAction, "fabHoverBg", tn(b.background.paper, 0.15)), ye(b.StepConnector, "border", N("palette-grey-600")), ye(b.StepContent, "border", N("palette-grey-600")), ye(b.Switch, "defaultColor", N("palette-grey-300")), ye(b.Switch, "defaultDisabledColor", N("palette-grey-600")), ye(b.Switch, "primaryDisabledColor", Je(b.primary.main, 0.55)), ye(b.Switch, "secondaryDisabledColor", Je(b.secondary.main, 0.55)), ye(b.Switch, "errorDisabledColor", Je(b.error.main, 0.55)), ye(b.Switch, "infoDisabledColor", Je(b.info.main, 0.55)), ye(b.Switch, "successDisabledColor", Je(b.success.main, 0.55)), ye(b.Switch, "warningDisabledColor", Je(b.warning.main, 0.55)), ye(b.TableCell, "border", Je(en(b.divider, 1), 0.68)), ye(b.Tooltip, "bg", en(b.grey[700], 0.92));
    }
    Gt(b.background, "default"), Gt(b.background, "paper"), Gt(b.common, "background"), Gt(b.common, "onBackground"), Gt(b, "divider"), Object.keys(b).forEach((j) => {
      const $ = b[j];
      j !== "tonalOffset" && $ && typeof $ == "object" && ($.main && ye(b[j], "mainChannel", Lr(Mr($.main))), $.light && ye(b[j], "lightChannel", Lr(Mr($.light))), $.dark && ye(b[j], "darkChannel", Lr(Mr($.dark))), $.contrastText && ye(b[j], "contrastTextChannel", Lr(Mr($.contrastText))), j === "text" && (Gt(b[j], "primary"), Gt(b[j], "secondary")), j === "action" && ($.active && Gt(b[j], "active"), $.selected && Gt(b[j], "selected")));
    });
  }), T = t.reduce((M, b) => Ct(M, b), T);
  const x = {
    prefix: o,
    disableCssColorScheme: n,
    shouldSkipGeneratingVar: a,
    getSelector: Iu(T)
  }, {
    vars: A,
    generateThemeVars: I,
    generateStyleSheets: R
  } = iu(T, x);
  return T.vars = A, Object.entries(T.colorSchemes[T.defaultColorScheme]).forEach(([M, b]) => {
    T[M] = b;
  }), T.generateThemeVars = I, T.generateStyleSheets = R, T.generateSpacing = function() {
    return Pa(h.spacing, ki(this));
  }, T.getColorSchemeSelector = ou(l), T.spacing = T.generateSpacing(), T.shouldSkipGeneratingVar = a, T.unstable_sxConfig = {
    ...Yr,
    ...h == null ? void 0 : h.unstable_sxConfig
  }, T.unstable_sx = function(b) {
    return ar({
      sx: b,
      theme: this
    });
  }, T.toRuntimeSource = Wa, T;
}
function Lo(e, t, r) {
  e.colorSchemes && r && (e.colorSchemes[t] = {
    ...r !== !0 && r,
    palette: Ni({
      ...r === !0 ? {} : r.palette,
      mode: t
    })
    // cast type to skip module augmentation test
  });
}
function Ya(e = {}, ...t) {
  const {
    palette: r,
    cssVariables: i = !1,
    colorSchemes: n = r ? void 0 : {
      light: !0
    },
    defaultColorScheme: o = r == null ? void 0 : r.mode,
    ...a
  } = e, l = o || "light", f = n == null ? void 0 : n[l], h = {
    ...n,
    ...r ? {
      [l]: {
        ...typeof f != "boolean" && f,
        palette: r
      }
    } : void 0
  };
  if (i === !1) {
    if (!("colorSchemes" in e))
      return mi(e, ...t);
    let s = r;
    "palette" in e || h[l] && (h[l] !== !0 ? s = h[l].palette : l === "dark" && (s = {
      mode: "dark"
    }));
    const u = mi({
      ...e,
      palette: s
    }, ...t);
    return u.defaultColorScheme = l, u.colorSchemes = h, u.palette.mode === "light" && (u.colorSchemes.light = {
      ...h.light !== !0 && h.light,
      palette: u.palette
    }, Lo(u, "dark", h.dark)), u.palette.mode === "dark" && (u.colorSchemes.dark = {
      ...h.dark !== !0 && h.dark,
      palette: u.palette
    }, Lo(u, "light", h.light)), u;
  }
  return !r && !("light" in h) && l === "light" && (h.light = !0), Bu({
    ...a,
    colorSchemes: h,
    defaultColorScheme: l,
    ...typeof i != "boolean" && i
  }, ...t);
}
const Fu = Ya();
function Du(e) {
  return e !== "ownerState" && e !== "theme" && e !== "sx" && e !== "as";
}
const Uu = (e) => Du(e) && e !== "classes", ju = jc({
  themeId: da,
  defaultTheme: Fu,
  rootShouldForwardProp: Uu
});
function zu() {
  return Ia;
}
const Hu = eu;
process.env.NODE_ENV !== "production" && (Pe.node, Pe.object.isRequired);
function $u(e) {
  return Qc(e);
}
function Wu(e) {
  return typeof e.main == "string";
}
function Zu(e, t = []) {
  if (!Wu(e))
    return !1;
  for (const r of t)
    if (!e.hasOwnProperty(r) || typeof e[r] != "string")
      return !1;
  return !0;
}
function Gu(e = []) {
  return ([, t]) => t && Zu(t, e);
}
function Yu(e) {
  return Pi("MuiTypography", e);
}
Ba("MuiTypography", ["root", "h1", "h2", "h3", "h4", "h5", "h6", "subtitle1", "subtitle2", "body1", "body2", "inherit", "button", "caption", "overline", "alignLeft", "alignRight", "alignCenter", "alignJustify", "noWrap", "gutterBottom", "paragraph"]);
const Vu = {
  primary: !0,
  secondary: !0,
  error: !0,
  info: !0,
  success: !0,
  warning: !0,
  textPrimary: !0,
  textSecondary: !0,
  textDisabled: !0
}, Ku = zu(), qu = (e) => {
  const {
    align: t,
    gutterBottom: r,
    noWrap: i,
    paragraph: n,
    variant: o,
    classes: a
  } = e, l = {
    root: ["root", o, e.align !== "inherit" && `align${vr(t)}`, r && "gutterBottom", i && "noWrap", n && "paragraph"]
  };
  return qc(l, Yu, a);
}, Xu = ju("span", {
  name: "MuiTypography",
  slot: "Root",
  overridesResolver: (e, t) => {
    const {
      ownerState: r
    } = e;
    return [t.root, r.variant && t[r.variant], r.align !== "inherit" && t[`align${vr(r.align)}`], r.noWrap && t.noWrap, r.gutterBottom && t.gutterBottom, r.paragraph && t.paragraph];
  }
})(Hu(({
  theme: e
}) => {
  var t;
  return {
    margin: 0,
    variants: [{
      props: {
        variant: "inherit"
      },
      style: {
        // Some elements, like <button> on Chrome have default font that doesn't inherit, reset this.
        font: "inherit",
        lineHeight: "inherit",
        letterSpacing: "inherit"
      }
    }, ...Object.entries(e.typography).filter(([r, i]) => r !== "inherit" && i && typeof i == "object").map(([r, i]) => ({
      props: {
        variant: r
      },
      style: i
    })), ...Object.entries(e.palette).filter(Gu()).map(([r]) => ({
      props: {
        color: r
      },
      style: {
        color: (e.vars || e).palette[r].main
      }
    })), ...Object.entries(((t = e.palette) == null ? void 0 : t.text) || {}).filter(([, r]) => typeof r == "string").map(([r]) => ({
      props: {
        color: `text${vr(r)}`
      },
      style: {
        color: (e.vars || e).palette.text[r]
      }
    })), {
      props: ({
        ownerState: r
      }) => r.align !== "inherit",
      style: {
        textAlign: "var(--Typography-textAlign)"
      }
    }, {
      props: ({
        ownerState: r
      }) => r.noWrap,
      style: {
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, {
      props: ({
        ownerState: r
      }) => r.gutterBottom,
      style: {
        marginBottom: "0.35em"
      }
    }, {
      props: ({
        ownerState: r
      }) => r.paragraph,
      style: {
        marginBottom: 16
      }
    }]
  };
})), Mo = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
  subtitle1: "h6",
  subtitle2: "h6",
  body1: "p",
  body2: "p",
  inherit: "p"
}, Va = /* @__PURE__ */ _t.forwardRef(function(t, r) {
  const {
    color: i,
    ...n
  } = $u({
    props: t,
    name: "MuiTypography"
  }), o = !Vu[i], a = Ku({
    ...n,
    ...o && {
      color: i
    }
  }), {
    align: l = "inherit",
    className: f,
    component: h,
    gutterBottom: s = !1,
    noWrap: u = !1,
    paragraph: c = !1,
    variant: p = "body1",
    variantMapping: m = Mo,
    ...d
  } = a, _ = {
    ...a,
    align: l,
    color: i,
    className: f,
    component: h,
    gutterBottom: s,
    noWrap: u,
    paragraph: c,
    variant: p,
    variantMapping: m
  }, v = h || (c ? "p" : m[p] || Mo[p]) || "span", k = qu(_);
  return /* @__PURE__ */ Le(Xu, {
    as: v,
    ref: r,
    className: Na(k.root, f),
    ...d,
    ownerState: _,
    style: {
      ...l !== "inherit" && {
        "--Typography-textAlign": l
      },
      ...d.style
    }
  });
});
process.env.NODE_ENV !== "production" && (Va.propTypes = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * Set the text-align on the component.
   * @default 'inherit'
   */
  align: Pe.oneOf(["center", "inherit", "justify", "left", "right"]),
  /**
   * The content of the component.
   */
  children: Pe.node,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: Pe.object,
  /**
   * @ignore
   */
  className: Pe.string,
  /**
   * The color of the component.
   * It supports both default and custom theme colors, which can be added as shown in the
   * [palette customization guide](https://mui.com/material-ui/customization/palette/#custom-colors).
   */
  color: Pe.oneOfType([Pe.oneOf(["primary", "secondary", "success", "error", "info", "warning", "textPrimary", "textSecondary", "textDisabled"]), Pe.string]),
  /**
   * The component used for the root node.
   * Either a string to use a HTML element or a component.
   */
  component: Pe.elementType,
  /**
   * If `true`, the text will have a bottom margin.
   * @default false
   */
  gutterBottom: Pe.bool,
  /**
   * If `true`, the text will not wrap, but instead will truncate with a text overflow ellipsis.
   *
   * Note that text overflow can only happen with block or inline-block level elements
   * (the element needs to have a width in order to overflow).
   * @default false
   */
  noWrap: Pe.bool,
  /**
   * If `true`, the element will be a paragraph element.
   * @default false
   * @deprecated Use the `component` prop instead. This prop will be removed in v7. See [Migrating from deprecated APIs](https://mui.com/material-ui/migration/migrating-from-deprecated-apis/) for more details.
   */
  paragraph: Pe.bool,
  /**
   * @ignore
   */
  style: Pe.object,
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: Pe.oneOfType([Pe.arrayOf(Pe.oneOfType([Pe.func, Pe.object, Pe.bool])), Pe.func, Pe.object]),
  /**
   * Applies the theme typography styles.
   * @default 'body1'
   */
  variant: Pe.oneOfType([Pe.oneOf(["body1", "body2", "button", "caption", "h1", "h2", "h3", "h4", "h5", "h6", "inherit", "overline", "subtitle1", "subtitle2"]), Pe.string]),
  /**
   * The component maps the variant prop to a range of different HTML element types.
   * For instance, subtitle1 to `<h6>`.
   * If you wish to change that mapping, you can provide your own.
   * Alternatively, you can use the `component` prop.
   * @default {
   *   h1: 'h1',
   *   h2: 'h2',
   *   h3: 'h3',
   *   h4: 'h4',
   *   h5: 'h5',
   *   h6: 'h6',
   *   subtitle1: 'h6',
   *   subtitle2: 'h6',
   *   body1: 'p',
   *   body2: 'p',
   *   inherit: 'p',
   * }
   */
  variantMapping: Pe.object
});
const Ju = Ba("MuiBox", ["root"]), Qu = Ya(), Fr = Mc({
  themeId: da,
  defaultTheme: Qu,
  defaultClassName: Ju.root,
  generateClassName: La.generate
});
process.env.NODE_ENV !== "production" && (Fr.propTypes = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: Pe.node,
  /**
   * The component used for the root node.
   * Either a string to use a HTML element or a component.
   */
  component: Pe.elementType,
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: Pe.oneOfType([Pe.arrayOf(Pe.oneOfType([Pe.func, Pe.object, Pe.bool])), Pe.func, Pe.object])
});
function ed(e, t) {
  const r = new Set(e), i = e.filter((o) => !t.has(o)), n = [];
  for (const o of t)
    r.has(o) || n.push(o);
  return { toFetch: i, toRemove: n };
}
const td = 32 * 1024 * 1024, rd = ["estimate", "jsHeap", "page"], rn = { warning: 1, critical: 2 };
function nd(e) {
  return {
    estimateBytes: e.estimatedViewerBytes,
    jsHeapBytes: e.jsHeapBytes,
    pageBytes: e.pageBytes
  };
}
function id(e, t) {
  switch (t) {
    case "estimate":
      return e.estimateBytes;
    case "jsHeap":
      return e.jsHeapBytes;
    case "page":
      return e.pageBytes;
  }
}
function od(e, t, r) {
  const i = t.warningBytes, n = t.criticalBytes, o = t.hysteresisBytes ?? td;
  if (r === "critical" && n !== void 0)
    return e >= Math.max(0, n - o) ? "critical" : i !== void 0 && e >= i ? "warning" : void 0;
  if (r === "warning" && i !== void 0)
    return n !== void 0 && e >= n ? "critical" : e >= Math.max(0, i - o) ? "warning" : void 0;
  if (n !== void 0 && e >= n)
    return "critical";
  if (i !== void 0 && e >= i)
    return "warning";
}
function ad({
  sample: e,
  thresholds: t,
  previousLevel: r,
  previousLevels: i
}) {
  const n = nd(e), o = {}, a = [];
  let l;
  for (const f of rd) {
    const h = t == null ? void 0 : t[f], s = id(n, f);
    if (h === void 0 || s === void 0)
      continue;
    const u = od(s, h, i == null ? void 0 : i[f]);
    if (u === void 0)
      continue;
    o[f] = u;
    const c = u === "critical" ? h.criticalBytes : h.warningBytes;
    c !== void 0 && a.push({ target: f, level: u, thresholdBytes: c, observedBytes: s }), (l === void 0 || rn[u] > rn[l]) && (l = u);
  }
  return l === void 0 || l === r || a.length === 0 ? { nextLevel: l, nextLevels: o } : (a.sort(
    (f, h) => rn[h.level] - rn[f.level] || h.observedBytes - h.thresholdBytes - (f.observedBytes - f.thresholdBytes)
  ), {
    nextLevel: l,
    nextLevels: o,
    alert: {
      level: l,
      breaches: a,
      observedBytes: n,
      sample: e
    }
  });
}
const sd = (e, t) => {
  const r = new nt(1 / e.direction.x, 1 / e.direction.y, 1 / e.direction.z), i = (t.min.x - e.origin.x) * r.x, n = (t.max.x - e.origin.x) * r.x, o = (t.min.y - e.origin.y) * r.y, a = (t.max.y - e.origin.y) * r.y, l = (t.min.z - e.origin.z) * r.z, f = (t.max.z - e.origin.z) * r.z, h = Math.max(Math.max(Math.min(i, n), Math.min(o, a)), Math.min(l, f)), s = Math.min(Math.min(Math.max(i, n), Math.max(o, a)), Math.max(l, f));
  if (Number.isNaN(h) || Number.isNaN(s) || s < 0 || h > s)
    return null;
  const u = h > 0 ? h : s;
  return e.origin.clone().add(e.direction.clone().multiplyScalar(u));
}, Ka = (e, t, r, i, n) => {
  r.setFromCamera(e, t);
  const o = r.ray;
  let a = null;
  for (const l of i) {
    const f = l.boundingBox.clone();
    f.translate(n);
    const h = sd(o, f);
    if (h) {
      const s = o.origin.distanceTo(h);
      (!a || s < a.distance) && (a = { view: l, distance: s, intersectionPoint: h });
    }
  }
  return a;
}, bn = (e, t, r) => Math.min(r, Math.max(t, e)), ld = (e, t) => new ea(e.x / t.width * 2 - 1, -(e.y / t.height) * 2 + 1), Bi = (e) => {
  const { canvas: t } = e;
  return Ze(
    (r) => {
      const i = t.getBoundingClientRect();
      return ld({ x: r.clientX - i.x, y: r.clientY - i.y }, i);
    },
    [t]
  );
}, qa = (e, t) => {
  if (!e) return;
  const { pointSize: r, opacity: i } = t;
  if (r === void 0 && i === void 0) return;
  const n = r === void 0 ? void 0 : bn(r, 0, 5), o = i === void 0 ? void 0 : bn(i, 0, 100) / 100;
  e.traverse((a) => {
    var f, h, s, u;
    const l = a.material;
    l && (n !== void 0 && (typeof l.size == "number" && (l.size = n, l.needsUpdate = !0), ((h = (f = l.uniforms) == null ? void 0 : f.pointSize) == null ? void 0 : h.value) !== void 0 && (l.uniforms.pointSize.value = n)), o !== void 0 && (((u = (s = l.uniforms) == null ? void 0 : s.opacity) == null ? void 0 : u.value) !== void 0 && (l.uniforms.opacity.value = o), typeof l.opacity == "number" && (l.opacity = o, o < 1 && l.transparent !== !0 && (l.transparent = !0), l.needsUpdate = !0)));
  });
}, Xa = "RCDE_VIEWER_CMD", dr = {
  RightHandedXUp: "RIGHT_HANDED_X_UP",
  LeftHandedXUp: "LEFT_HANDED_X_UP",
  RightHandedYUp: "RIGHT_HANDED_Y_UP",
  LeftHandedYUp: "LEFT_HANDED_Y_UP",
  RightHandedZUp: "RIGHT_HANDED_Z_UP",
  LeftHandedZUp: "LEFT_HANDED_Z_UP"
};
function qn(e) {
  typeof window > "u" || window.postMessage({ channel: Xa, cmd: e }, "*");
}
function hn(e) {
  return typeof e == "object" && e !== null && !Array.isArray(e);
}
function Xn(e) {
  return e === void 0 || Number.isFinite(e);
}
function No(e) {
  return e === void 0 ? !0 : hn(e) && Number.isFinite(e.x) && Number.isFinite(e.y) && Number.isFinite(e.z);
}
function fd(e) {
  if (!hn(e)) return !1;
  switch (e.type) {
    case "RESET":
      return !0;
    case "SET_APPEARANCE":
      return hn(e.payload) && Xn(e.payload.pointSize) && Xn(e.payload.opacity) && Xn(e.payload.fileId);
    case "SET_TRANSFORM":
      return hn(e.payload) && Number.isFinite(e.payload.fileId) && No(e.payload.translation) && No(e.payload.rotation);
    default:
      return !1;
  }
}
const cd = {
  setTransform(e) {
    qn({ type: "SET_TRANSFORM", payload: e });
  },
  setAppearance(e) {
    qn({ type: "SET_APPEARANCE", payload: e });
  },
  reset() {
    qn({ type: "RESET" });
  },
  addListener(e) {
    if (typeof window > "u") return () => {
    };
    const t = (r) => {
      if (!(!(r != null && r.data) || r.data.channel !== Xa)) {
        if (r.source !== window) {
          (r.source === null || r.source === void 0) && console.warn(
            "[ViewerBridge] source を持たない message を無視しました。jsdom / happy-dom の postMessage は MessageEvent.source をセットしないため、これらのテスト環境ではビューアコマンドが届きません:",
            r.data.cmd
          );
          return;
        }
        if (!fd(r.data.cmd)) {
          console.warn(
            "[ViewerBridge] 形式または値が不正なコマンドを無視しました（不正なフィールドが 1 つでもあるとコマンド全体を破棄します）:",
            r.data.cmd
          );
          return;
        }
        e(r.data.cmd);
      }
    };
    return window.addEventListener("message", t), () => window.removeEventListener("message", t);
  }
}, { min: ud, max: dd } = Math, or = (e, t = 0, r = 1) => ud(dd(t, e), r), Fi = (e) => {
  e._clipped = !1, e._unclipped = e.slice(0);
  for (let t = 0; t <= 3; t++)
    t < 3 ? ((e[t] < 0 || e[t] > 255) && (e._clipped = !0), e[t] = or(e[t], 0, 255)) : t === 3 && (e[t] = or(e[t], 0, 1));
  return e;
}, Ja = {};
for (let e of [
  "Boolean",
  "Number",
  "String",
  "Function",
  "Array",
  "Date",
  "RegExp",
  "Undefined",
  "Null"
])
  Ja[`[object ${e}]`] = e.toLowerCase();
function je(e) {
  return Ja[Object.prototype.toString.call(e)] || "object";
}
const Me = (e, t = null) => e.length >= 3 ? Array.prototype.slice.call(e) : je(e[0]) == "object" && t ? t.split("").filter((r) => e[0][r] !== void 0).map((r) => e[0][r]) : e[0].slice(0), Tr = (e) => {
  if (e.length < 2) return null;
  const t = e.length - 1;
  return je(e[t]) == "string" ? e[t].toLowerCase() : null;
}, { PI: Dn, min: Qa, max: es } = Math, It = (e) => Math.round(e * 100) / 100, bi = (e) => Math.round(e * 100) / 100, Vt = Dn * 2, Jn = Dn / 3, hd = Dn / 180, pd = 180 / Dn;
function ts(e) {
  return [...e.slice(0, 3).reverse(), ...e.slice(3)];
}
const Ie = {
  format: {},
  autodetect: []
};
class Ee {
  constructor(...t) {
    const r = this;
    if (je(t[0]) === "object" && t[0].constructor && t[0].constructor === this.constructor)
      return t[0];
    let i = Tr(t), n = !1;
    if (!i) {
      n = !0, Ie.sorted || (Ie.autodetect = Ie.autodetect.sort((o, a) => a.p - o.p), Ie.sorted = !0);
      for (let o of Ie.autodetect)
        if (i = o.test(...t), i) break;
    }
    if (Ie.format[i]) {
      const o = Ie.format[i].apply(
        null,
        n ? t : t.slice(0, -1)
      );
      r._rgb = Fi(o);
    } else
      throw new Error("unknown format: " + t);
    r._rgb.length === 3 && r._rgb.push(1);
  }
  toString() {
    return je(this.hex) == "function" ? this.hex() : `[${this._rgb.join(",")}]`;
  }
}
const yd = "3.2.0", ze = (...e) => new Ee(...e);
ze.version = yd;
const wr = {
  aliceblue: "#f0f8ff",
  antiquewhite: "#faebd7",
  aqua: "#00ffff",
  aquamarine: "#7fffd4",
  azure: "#f0ffff",
  beige: "#f5f5dc",
  bisque: "#ffe4c4",
  black: "#000000",
  blanchedalmond: "#ffebcd",
  blue: "#0000ff",
  blueviolet: "#8a2be2",
  brown: "#a52a2a",
  burlywood: "#deb887",
  cadetblue: "#5f9ea0",
  chartreuse: "#7fff00",
  chocolate: "#d2691e",
  coral: "#ff7f50",
  cornflowerblue: "#6495ed",
  cornsilk: "#fff8dc",
  crimson: "#dc143c",
  cyan: "#00ffff",
  darkblue: "#00008b",
  darkcyan: "#008b8b",
  darkgoldenrod: "#b8860b",
  darkgray: "#a9a9a9",
  darkgreen: "#006400",
  darkgrey: "#a9a9a9",
  darkkhaki: "#bdb76b",
  darkmagenta: "#8b008b",
  darkolivegreen: "#556b2f",
  darkorange: "#ff8c00",
  darkorchid: "#9932cc",
  darkred: "#8b0000",
  darksalmon: "#e9967a",
  darkseagreen: "#8fbc8f",
  darkslateblue: "#483d8b",
  darkslategray: "#2f4f4f",
  darkslategrey: "#2f4f4f",
  darkturquoise: "#00ced1",
  darkviolet: "#9400d3",
  deeppink: "#ff1493",
  deepskyblue: "#00bfff",
  dimgray: "#696969",
  dimgrey: "#696969",
  dodgerblue: "#1e90ff",
  firebrick: "#b22222",
  floralwhite: "#fffaf0",
  forestgreen: "#228b22",
  fuchsia: "#ff00ff",
  gainsboro: "#dcdcdc",
  ghostwhite: "#f8f8ff",
  gold: "#ffd700",
  goldenrod: "#daa520",
  gray: "#808080",
  green: "#008000",
  greenyellow: "#adff2f",
  grey: "#808080",
  honeydew: "#f0fff0",
  hotpink: "#ff69b4",
  indianred: "#cd5c5c",
  indigo: "#4b0082",
  ivory: "#fffff0",
  khaki: "#f0e68c",
  laserlemon: "#ffff54",
  lavender: "#e6e6fa",
  lavenderblush: "#fff0f5",
  lawngreen: "#7cfc00",
  lemonchiffon: "#fffacd",
  lightblue: "#add8e6",
  lightcoral: "#f08080",
  lightcyan: "#e0ffff",
  lightgoldenrod: "#fafad2",
  lightgoldenrodyellow: "#fafad2",
  lightgray: "#d3d3d3",
  lightgreen: "#90ee90",
  lightgrey: "#d3d3d3",
  lightpink: "#ffb6c1",
  lightsalmon: "#ffa07a",
  lightseagreen: "#20b2aa",
  lightskyblue: "#87cefa",
  lightslategray: "#778899",
  lightslategrey: "#778899",
  lightsteelblue: "#b0c4de",
  lightyellow: "#ffffe0",
  lime: "#00ff00",
  limegreen: "#32cd32",
  linen: "#faf0e6",
  magenta: "#ff00ff",
  maroon: "#800000",
  maroon2: "#7f0000",
  maroon3: "#b03060",
  mediumaquamarine: "#66cdaa",
  mediumblue: "#0000cd",
  mediumorchid: "#ba55d3",
  mediumpurple: "#9370db",
  mediumseagreen: "#3cb371",
  mediumslateblue: "#7b68ee",
  mediumspringgreen: "#00fa9a",
  mediumturquoise: "#48d1cc",
  mediumvioletred: "#c71585",
  midnightblue: "#191970",
  mintcream: "#f5fffa",
  mistyrose: "#ffe4e1",
  moccasin: "#ffe4b5",
  navajowhite: "#ffdead",
  navy: "#000080",
  oldlace: "#fdf5e6",
  olive: "#808000",
  olivedrab: "#6b8e23",
  orange: "#ffa500",
  orangered: "#ff4500",
  orchid: "#da70d6",
  palegoldenrod: "#eee8aa",
  palegreen: "#98fb98",
  paleturquoise: "#afeeee",
  palevioletred: "#db7093",
  papayawhip: "#ffefd5",
  peachpuff: "#ffdab9",
  peru: "#cd853f",
  pink: "#ffc0cb",
  plum: "#dda0dd",
  powderblue: "#b0e0e6",
  purple: "#800080",
  purple2: "#7f007f",
  purple3: "#a020f0",
  rebeccapurple: "#663399",
  red: "#ff0000",
  rosybrown: "#bc8f8f",
  royalblue: "#4169e1",
  saddlebrown: "#8b4513",
  salmon: "#fa8072",
  sandybrown: "#f4a460",
  seagreen: "#2e8b57",
  seashell: "#fff5ee",
  sienna: "#a0522d",
  silver: "#c0c0c0",
  skyblue: "#87ceeb",
  slateblue: "#6a5acd",
  slategray: "#708090",
  slategrey: "#708090",
  snow: "#fffafa",
  springgreen: "#00ff7f",
  steelblue: "#4682b4",
  tan: "#d2b48c",
  teal: "#008080",
  thistle: "#d8bfd8",
  tomato: "#ff6347",
  turquoise: "#40e0d0",
  violet: "#ee82ee",
  wheat: "#f5deb3",
  white: "#ffffff",
  whitesmoke: "#f5f5f5",
  yellow: "#ffff00",
  yellowgreen: "#9acd32"
}, gd = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, md = /^#?([A-Fa-f0-9]{8}|[A-Fa-f0-9]{4})$/, rs = (e) => {
  if (e.match(gd)) {
    (e.length === 4 || e.length === 7) && (e = e.substr(1)), e.length === 3 && (e = e.split(""), e = e[0] + e[0] + e[1] + e[1] + e[2] + e[2]);
    const t = parseInt(e, 16), r = t >> 16, i = t >> 8 & 255, n = t & 255;
    return [r, i, n, 1];
  }
  if (e.match(md)) {
    (e.length === 5 || e.length === 9) && (e = e.substr(1)), e.length === 4 && (e = e.split(""), e = e[0] + e[0] + e[1] + e[1] + e[2] + e[2] + e[3] + e[3]);
    const t = parseInt(e, 16), r = t >> 24 & 255, i = t >> 16 & 255, n = t >> 8 & 255, o = Math.round((t & 255) / 255 * 100) / 100;
    return [r, i, n, o];
  }
  throw new Error(`unknown hex color: ${e}`);
}, { round: nn } = Math, ns = (...e) => {
  let [t, r, i, n] = Me(e, "rgba"), o = Tr(e) || "auto";
  n === void 0 && (n = 1), o === "auto" && (o = n < 1 ? "rgba" : "rgb"), t = nn(t), r = nn(r), i = nn(i);
  let l = "000000" + (t << 16 | r << 8 | i).toString(16);
  l = l.substr(l.length - 6);
  let f = "0" + nn(n * 255).toString(16);
  switch (f = f.substr(f.length - 2), o.toLowerCase()) {
    case "rgba":
      return `#${l}${f}`;
    case "argb":
      return `#${f}${l}`;
    default:
      return `#${l}`;
  }
};
Ee.prototype.name = function() {
  const e = ns(this._rgb, "rgb");
  for (let t of Object.keys(wr))
    if (wr[t] === e) return t.toLowerCase();
  return e;
};
Ie.format.named = (e) => {
  if (e = e.toLowerCase(), wr[e]) return rs(wr[e]);
  throw new Error("unknown color name: " + e);
};
Ie.autodetect.push({
  p: 5,
  test: (e, ...t) => {
    if (!t.length && je(e) === "string" && wr[e.toLowerCase()])
      return "named";
  }
});
Ee.prototype.alpha = function(e, t = !1) {
  return e !== void 0 && je(e) === "number" ? t ? (this._rgb[3] = e, this) : new Ee([this._rgb[0], this._rgb[1], this._rgb[2], e], "rgb") : this._rgb[3];
};
Ee.prototype.clipped = function() {
  return this._rgb._clipped || !1;
};
const Wt = {
  // Corresponds roughly to RGB brighter/darker
  Kn: 18,
  // D65 standard referent
  labWhitePoint: "d65",
  Xn: 0.95047,
  Yn: 1,
  Zn: 1.08883,
  kE: 216 / 24389,
  kKE: 8,
  kK: 24389 / 27,
  RefWhiteRGB: {
    // sRGB
    X: 0.95047,
    Y: 1,
    Z: 1.08883
  },
  MtxRGB2XYZ: {
    m00: 0.4124564390896922,
    m01: 0.21267285140562253,
    m02: 0.0193338955823293,
    m10: 0.357576077643909,
    m11: 0.715152155287818,
    m12: 0.11919202588130297,
    m20: 0.18043748326639894,
    m21: 0.07217499330655958,
    m22: 0.9503040785363679
  },
  MtxXYZ2RGB: {
    m00: 3.2404541621141045,
    m01: -0.9692660305051868,
    m02: 0.055643430959114726,
    m10: -1.5371385127977166,
    m11: 1.8760108454466942,
    m12: -0.2040259135167538,
    m20: -0.498531409556016,
    m21: 0.041556017530349834,
    m22: 1.0572251882231791
  },
  // used in rgb2xyz
  As: 0.9414285350000001,
  Bs: 1.040417467,
  Cs: 1.089532651,
  MtxAdaptMa: {
    m00: 0.8951,
    m01: -0.7502,
    m02: 0.0389,
    m10: 0.2664,
    m11: 1.7135,
    m12: -0.0685,
    m20: -0.1614,
    m21: 0.0367,
    m22: 1.0296
  },
  MtxAdaptMaI: {
    m00: 0.9869929054667123,
    m01: 0.43230526972339456,
    m02: -0.008528664575177328,
    m10: -0.14705425642099013,
    m11: 0.5183602715367776,
    m12: 0.04004282165408487,
    m20: 0.15996265166373125,
    m21: 0.0492912282128556,
    m22: 0.9684866957875502
  }
}, bd = /* @__PURE__ */ new Map([
  // ASTM E308-01
  ["a", [1.0985, 0.35585]],
  // Wyszecki & Stiles, p. 769
  ["b", [1.0985, 0.35585]],
  // C ASTM E308-01
  ["c", [0.98074, 1.18232]],
  // D50 (ASTM E308-01)
  ["d50", [0.96422, 0.82521]],
  // D55 (ASTM E308-01)
  ["d55", [0.95682, 0.92149]],
  // D65 (ASTM E308-01)
  ["d65", [0.95047, 1.08883]],
  // E (ASTM E308-01)
  ["e", [1, 1, 1]],
  // F2 (ASTM E308-01)
  ["f2", [0.99186, 0.67393]],
  // F7 (ASTM E308-01)
  ["f7", [0.95041, 1.08747]],
  // F11 (ASTM E308-01)
  ["f11", [1.00962, 0.6435]],
  ["icc", [0.96422, 0.82521]]
]);
function Kt(e) {
  const t = bd.get(String(e).toLowerCase());
  if (!t)
    throw new Error("unknown Lab illuminant " + e);
  Wt.labWhitePoint = e, Wt.Xn = t[0], Wt.Zn = t[1];
}
function Hr() {
  return Wt.labWhitePoint;
}
const Di = (...e) => {
  e = Me(e, "lab");
  const [t, r, i] = e, [n, o, a] = _d(t, r, i), [l, f, h] = is(n, o, a);
  return [l, f, h, e.length > 3 ? e[3] : 1];
}, _d = (e, t, r) => {
  const { kE: i, kK: n, kKE: o, Xn: a, Yn: l, Zn: f } = Wt, h = (e + 16) / 116, s = 2e-3 * t + h, u = h - 5e-3 * r, c = s * s * s, p = u * u * u, m = c > i ? c : (116 * s - 16) / n, d = e > o ? Math.pow((e + 16) / 116, 3) : e / n, _ = p > i ? p : (116 * u - 16) / n, v = m * a, k = d * l, E = _ * f;
  return [v, k, E];
}, Qn = (e) => {
  const t = Math.sign(e);
  return e = Math.abs(e), (e <= 31308e-7 ? e * 12.92 : 1.055 * Math.pow(e, 1 / 2.4) - 0.055) * t;
}, is = (e, t, r) => {
  const { MtxAdaptMa: i, MtxAdaptMaI: n, MtxXYZ2RGB: o, RefWhiteRGB: a, Xn: l, Yn: f, Zn: h } = Wt, s = l * i.m00 + f * i.m10 + h * i.m20, u = l * i.m01 + f * i.m11 + h * i.m21, c = l * i.m02 + f * i.m12 + h * i.m22, p = a.X * i.m00 + a.Y * i.m10 + a.Z * i.m20, m = a.X * i.m01 + a.Y * i.m11 + a.Z * i.m21, d = a.X * i.m02 + a.Y * i.m12 + a.Z * i.m22, _ = (e * i.m00 + t * i.m10 + r * i.m20) * (p / s), v = (e * i.m01 + t * i.m11 + r * i.m21) * (m / u), k = (e * i.m02 + t * i.m12 + r * i.m22) * (d / c), E = _ * n.m00 + v * n.m10 + k * n.m20, T = _ * n.m01 + v * n.m11 + k * n.m21, x = _ * n.m02 + v * n.m12 + k * n.m22, A = Qn(
    E * o.m00 + T * o.m10 + x * o.m20
  ), I = Qn(
    E * o.m01 + T * o.m11 + x * o.m21
  ), R = Qn(
    E * o.m02 + T * o.m12 + x * o.m22
  );
  return [A * 255, I * 255, R * 255];
}, Ui = (...e) => {
  const [t, r, i, ...n] = Me(e, "rgb"), [o, a, l] = os(t, r, i), [f, h, s] = vd(o, a, l);
  return [f, h, s, ...n.length > 0 && n[0] < 1 ? [n[0]] : []];
};
function vd(e, t, r) {
  const { Xn: i, Yn: n, Zn: o, kE: a, kK: l } = Wt, f = e / i, h = t / n, s = r / o, u = f > a ? Math.pow(f, 1 / 3) : (l * f + 16) / 116, c = h > a ? Math.pow(h, 1 / 3) : (l * h + 16) / 116, p = s > a ? Math.pow(s, 1 / 3) : (l * s + 16) / 116;
  return [116 * c - 16, 500 * (u - c), 200 * (c - p)];
}
function ei(e) {
  const t = Math.sign(e);
  return e = Math.abs(e), (e <= 0.04045 ? e / 12.92 : Math.pow((e + 0.055) / 1.055, 2.4)) * t;
}
const os = (e, t, r) => {
  e = ei(e / 255), t = ei(t / 255), r = ei(r / 255);
  const { MtxRGB2XYZ: i, MtxAdaptMa: n, MtxAdaptMaI: o, Xn: a, Yn: l, Zn: f, As: h, Bs: s, Cs: u } = Wt;
  let c = e * i.m00 + t * i.m10 + r * i.m20, p = e * i.m01 + t * i.m11 + r * i.m21, m = e * i.m02 + t * i.m12 + r * i.m22;
  const d = a * n.m00 + l * n.m10 + f * n.m20, _ = a * n.m01 + l * n.m11 + f * n.m21, v = a * n.m02 + l * n.m12 + f * n.m22;
  let k = c * n.m00 + p * n.m10 + m * n.m20, E = c * n.m01 + p * n.m11 + m * n.m21, T = c * n.m02 + p * n.m12 + m * n.m22;
  return k *= d / h, E *= _ / s, T *= v / u, c = k * o.m00 + E * o.m10 + T * o.m20, p = k * o.m01 + E * o.m11 + T * o.m21, m = k * o.m02 + E * o.m12 + T * o.m22, [c, p, m];
};
Ee.prototype.lab = function() {
  return Ui(this._rgb);
};
const wd = (...e) => new Ee(...e, "lab");
Object.assign(ze, { lab: wd, getLabWhitePoint: Hr, setLabWhitePoint: Kt });
Ie.format.lab = Di;
Ie.autodetect.push({
  p: 2,
  test: (...e) => {
    if (e = Me(e, "lab"), je(e) === "array" && e.length === 3)
      return "lab";
  }
});
Ee.prototype.darken = function(e = 1) {
  const t = this, r = t.lab();
  return r[0] -= Wt.Kn * e, new Ee(r, "lab").alpha(t.alpha(), !0);
};
Ee.prototype.brighten = function(e = 1) {
  return this.darken(-e);
};
Ee.prototype.darker = Ee.prototype.darken;
Ee.prototype.brighter = Ee.prototype.brighten;
Ee.prototype.get = function(e) {
  const [t, r] = e.split("."), i = this[t]();
  if (r) {
    const n = t.indexOf(r) - (t.substr(0, 2) === "ok" ? 2 : 0);
    if (n > -1) return i[n];
    throw new Error(`unknown channel ${r} in mode ${t}`);
  } else
    return i;
};
const { pow: Ed } = Math, Sd = 1e-7, Td = 20;
Ee.prototype.luminance = function(e, t = "rgb") {
  if (e !== void 0 && je(e) === "number") {
    if (e === 0)
      return new Ee([0, 0, 0, this._rgb[3]], "rgb");
    if (e === 1)
      return new Ee([255, 255, 255, this._rgb[3]], "rgb");
    let r = this.luminance(), i = Td;
    const n = (a, l) => {
      const f = a.interpolate(l, 0.5, t), h = f.luminance();
      return Math.abs(e - h) < Sd || !i-- ? f : h > e ? n(a, f) : n(f, l);
    }, o = (r > e ? n(new Ee([0, 0, 0]), this) : n(this, new Ee([255, 255, 255]))).rgb();
    return new Ee([...o, this._rgb[3]]);
  }
  return Ad(...this._rgb.slice(0, 3));
};
const Ad = (e, t, r) => (e = ti(e), t = ti(t), r = ti(r), 0.2126 * e + 0.7152 * t + 0.0722 * r), ti = (e) => (e /= 255, e <= 0.03928 ? e / 12.92 : Ed((e + 0.055) / 1.055, 2.4)), wt = {}, Er = (e, t, r = 0.5, ...i) => {
  let n = i[0] || "lrgb";
  if (!wt[n] && !i.length && (n = Object.keys(wt)[0]), !wt[n])
    throw new Error(`interpolation mode ${n} is not defined`);
  return je(e) !== "object" && (e = new Ee(e)), je(t) !== "object" && (t = new Ee(t)), wt[n](e, t, r).alpha(
    e.alpha() + r * (t.alpha() - e.alpha())
  );
};
Ee.prototype.mix = Ee.prototype.interpolate = function(e, t = 0.5, ...r) {
  return Er(this, e, t, ...r);
};
Ee.prototype.premultiply = function(e = !1) {
  const t = this._rgb, r = t[3];
  return e ? (this._rgb = [t[0] * r, t[1] * r, t[2] * r, r], this) : new Ee([t[0] * r, t[1] * r, t[2] * r, r], "rgb");
};
const { sin: Rd, cos: xd } = Math, as = (...e) => {
  let [t, r, i] = Me(e, "lch");
  return isNaN(i) && (i = 0), i = i * hd, [t, xd(i) * r, Rd(i) * r];
}, ji = (...e) => {
  e = Me(e, "lch");
  const [t, r, i] = e, [n, o, a] = as(t, r, i), [l, f, h] = Di(n, o, a);
  return [l, f, h, e.length > 3 ? e[3] : 1];
}, kd = (...e) => {
  const t = ts(Me(e, "hcl"));
  return ji(...t);
}, { sqrt: Cd, atan2: Od, round: Pd } = Math, ss = (...e) => {
  const [t, r, i] = Me(e, "lab"), n = Cd(r * r + i * i);
  let o = (Od(i, r) * pd + 360) % 360;
  return Pd(n * 1e4) === 0 && (o = Number.NaN), [t, n, o];
}, zi = (...e) => {
  const [t, r, i, ...n] = Me(e, "rgb"), [o, a, l] = Ui(t, r, i), [f, h, s] = ss(o, a, l);
  return [f, h, s, ...n.length > 0 && n[0] < 1 ? [n[0]] : []];
};
Ee.prototype.lch = function() {
  return zi(this._rgb);
};
Ee.prototype.hcl = function() {
  return ts(zi(this._rgb));
};
const Id = (...e) => new Ee(...e, "lch"), Ld = (...e) => new Ee(...e, "hcl");
Object.assign(ze, { lch: Id, hcl: Ld });
Ie.format.lch = ji;
Ie.format.hcl = kd;
["lch", "hcl"].forEach(
  (e) => Ie.autodetect.push({
    p: 2,
    test: (...t) => {
      if (t = Me(t, e), je(t) === "array" && t.length === 3)
        return e;
    }
  })
);
Ee.prototype.saturate = function(e = 1) {
  const t = this, r = t.lch();
  return r[1] += Wt.Kn * e, r[1] < 0 && (r[1] = 0), new Ee(r, "lch").alpha(t.alpha(), !0);
};
Ee.prototype.desaturate = function(e = 1) {
  return this.saturate(-e);
};
Ee.prototype.set = function(e, t, r = !1) {
  const [i, n] = e.split("."), o = this[i]();
  if (n) {
    const a = i.indexOf(n) - (i.substr(0, 2) === "ok" ? 2 : 0);
    if (a > -1) {
      if (je(t) == "string")
        switch (t.charAt(0)) {
          case "+":
            o[a] += +t;
            break;
          case "-":
            o[a] += +t;
            break;
          case "*":
            o[a] *= +t.substr(1);
            break;
          case "/":
            o[a] /= +t.substr(1);
            break;
          default:
            o[a] = +t;
        }
      else if (je(t) === "number")
        o[a] = t;
      else
        throw new Error("unsupported value for Color.set");
      const l = new Ee(o, i);
      return r ? (this._rgb = l._rgb, this) : l;
    }
    throw new Error(`unknown channel ${n} in mode ${i}`);
  } else
    return o;
};
Ee.prototype.tint = function(e = 0.5, ...t) {
  return Er(this, "white", e, ...t);
};
Ee.prototype.shade = function(e = 0.5, ...t) {
  return Er(this, "black", e, ...t);
};
const Md = (e, t, r) => {
  const i = e._rgb, n = t._rgb;
  return new Ee(
    i[0] + r * (n[0] - i[0]),
    i[1] + r * (n[1] - i[1]),
    i[2] + r * (n[2] - i[2]),
    "rgb"
  );
};
wt.rgb = Md;
const { sqrt: ri, pow: hr } = Math, Nd = (e, t, r) => {
  const [i, n, o] = e._rgb, [a, l, f] = t._rgb;
  return new Ee(
    ri(hr(i, 2) * (1 - r) + hr(a, 2) * r),
    ri(hr(n, 2) * (1 - r) + hr(l, 2) * r),
    ri(hr(o, 2) * (1 - r) + hr(f, 2) * r),
    "rgb"
  );
};
wt.lrgb = Nd;
const Bd = (e, t, r) => {
  const i = e.lab(), n = t.lab();
  return new Ee(
    i[0] + r * (n[0] - i[0]),
    i[1] + r * (n[1] - i[1]),
    i[2] + r * (n[2] - i[2]),
    "lab"
  );
};
wt.lab = Bd;
const Ar = (e, t, r, i) => {
  let n, o;
  i === "hsl" ? (n = e.hsl(), o = t.hsl()) : i === "hsv" ? (n = e.hsv(), o = t.hsv()) : i === "hcg" ? (n = e.hcg(), o = t.hcg()) : i === "hsi" ? (n = e.hsi(), o = t.hsi()) : i === "lch" || i === "hcl" ? (i = "hcl", n = e.hcl(), o = t.hcl()) : i === "oklch" && (n = e.oklch().reverse(), o = t.oklch().reverse());
  let a, l, f, h, s, u;
  (i.substr(0, 1) === "h" || i === "oklch") && ([a, f, s] = n, [l, h, u] = o);
  let c, p, m, d;
  return !isNaN(a) && !isNaN(l) ? (l > a && l - a > 180 ? d = l - (a + 360) : l < a && a - l > 180 ? d = l + 360 - a : d = l - a, p = a + r * d) : isNaN(a) ? isNaN(l) ? p = Number.NaN : (p = l, (s == 1 || s == 0) && i != "hsv" && (c = h)) : (p = a, (u == 1 || u == 0) && i != "hsv" && (c = f)), c === void 0 && (c = f + r * (h - f)), m = s + r * (u - s), i === "oklch" ? new Ee([m, c, p], i) : new Ee([p, c, m], i);
}, ls = (e, t, r) => Ar(e, t, r, "lch");
wt.lch = ls;
wt.hcl = ls;
const Fd = (e) => {
  if (je(e) == "number" && e >= 0 && e <= 16777215) {
    const t = e >> 16, r = e >> 8 & 255, i = e & 255;
    return [t, r, i, 1];
  }
  throw new Error("unknown num color: " + e);
}, Dd = (...e) => {
  const [t, r, i] = Me(e, "rgb");
  return (t << 16) + (r << 8) + i;
};
Ee.prototype.num = function() {
  return Dd(this._rgb);
};
const Ud = (...e) => new Ee(...e, "num");
Object.assign(ze, { num: Ud });
Ie.format.num = Fd;
Ie.autodetect.push({
  p: 5,
  test: (...e) => {
    if (e.length === 1 && je(e[0]) === "number" && e[0] >= 0 && e[0] <= 16777215)
      return "num";
  }
});
const jd = (e, t, r) => {
  const i = e.num(), n = t.num();
  return new Ee(i + r * (n - i), "num");
};
wt.num = jd;
const { floor: zd } = Math, Hd = (...e) => {
  e = Me(e, "hcg");
  let [t, r, i] = e, n, o, a;
  i = i * 255;
  const l = r * 255;
  if (r === 0)
    n = o = a = i;
  else {
    t === 360 && (t = 0), t > 360 && (t -= 360), t < 0 && (t += 360), t /= 60;
    const f = zd(t), h = t - f, s = i * (1 - r), u = s + l * (1 - h), c = s + l * h, p = s + l;
    switch (f) {
      case 0:
        [n, o, a] = [p, c, s];
        break;
      case 1:
        [n, o, a] = [u, p, s];
        break;
      case 2:
        [n, o, a] = [s, p, c];
        break;
      case 3:
        [n, o, a] = [s, u, p];
        break;
      case 4:
        [n, o, a] = [c, s, p];
        break;
      case 5:
        [n, o, a] = [p, s, u];
        break;
    }
  }
  return [n, o, a, e.length > 3 ? e[3] : 1];
}, $d = (...e) => {
  const [t, r, i] = Me(e, "rgb"), n = Qa(t, r, i), o = es(t, r, i), a = o - n, l = a * 100 / 255, f = n / (255 - a) * 100;
  let h;
  return a === 0 ? h = Number.NaN : (t === o && (h = (r - i) / a), r === o && (h = 2 + (i - t) / a), i === o && (h = 4 + (t - r) / a), h *= 60, h < 0 && (h += 360)), [h, l, f];
};
Ee.prototype.hcg = function() {
  return $d(this._rgb);
};
const Wd = (...e) => new Ee(...e, "hcg");
ze.hcg = Wd;
Ie.format.hcg = Hd;
Ie.autodetect.push({
  p: 1,
  test: (...e) => {
    if (e = Me(e, "hcg"), je(e) === "array" && e.length === 3)
      return "hcg";
  }
});
const Zd = (e, t, r) => Ar(e, t, r, "hcg");
wt.hcg = Zd;
const { cos: pr } = Math, Gd = (...e) => {
  e = Me(e, "hsi");
  let [t, r, i] = e, n, o, a;
  return isNaN(t) && (t = 0), isNaN(r) && (r = 0), t > 360 && (t -= 360), t < 0 && (t += 360), t /= 360, t < 1 / 3 ? (a = (1 - r) / 3, n = (1 + r * pr(Vt * t) / pr(Jn - Vt * t)) / 3, o = 1 - (a + n)) : t < 2 / 3 ? (t -= 1 / 3, n = (1 - r) / 3, o = (1 + r * pr(Vt * t) / pr(Jn - Vt * t)) / 3, a = 1 - (n + o)) : (t -= 2 / 3, o = (1 - r) / 3, a = (1 + r * pr(Vt * t) / pr(Jn - Vt * t)) / 3, n = 1 - (o + a)), n = or(i * n * 3), o = or(i * o * 3), a = or(i * a * 3), [n * 255, o * 255, a * 255, e.length > 3 ? e[3] : 1];
}, { min: Yd, sqrt: Vd, acos: Kd } = Math, qd = (...e) => {
  let [t, r, i] = Me(e, "rgb");
  t /= 255, r /= 255, i /= 255;
  let n;
  const o = Yd(t, r, i), a = (t + r + i) / 3, l = a > 0 ? 1 - o / a : 0;
  return l === 0 ? n = NaN : (n = (t - r + (t - i)) / 2, n /= Vd((t - r) * (t - r) + (t - i) * (r - i)), n = Kd(n), i > r && (n = Vt - n), n /= Vt), [n * 360, l, a];
};
Ee.prototype.hsi = function() {
  return qd(this._rgb);
};
const Xd = (...e) => new Ee(...e, "hsi");
ze.hsi = Xd;
Ie.format.hsi = Gd;
Ie.autodetect.push({
  p: 2,
  test: (...e) => {
    if (e = Me(e, "hsi"), je(e) === "array" && e.length === 3)
      return "hsi";
  }
});
const Jd = (e, t, r) => Ar(e, t, r, "hsi");
wt.hsi = Jd;
const _i = (...e) => {
  e = Me(e, "hsl");
  const [t, r, i] = e;
  let n, o, a;
  if (r === 0)
    n = o = a = i * 255;
  else {
    const l = [0, 0, 0], f = [0, 0, 0], h = i < 0.5 ? i * (1 + r) : i + r - i * r, s = 2 * i - h, u = t / 360;
    l[0] = u + 1 / 3, l[1] = u, l[2] = u - 1 / 3;
    for (let c = 0; c < 3; c++)
      l[c] < 0 && (l[c] += 1), l[c] > 1 && (l[c] -= 1), 6 * l[c] < 1 ? f[c] = s + (h - s) * 6 * l[c] : 2 * l[c] < 1 ? f[c] = h : 3 * l[c] < 2 ? f[c] = s + (h - s) * (2 / 3 - l[c]) * 6 : f[c] = s;
    [n, o, a] = [f[0] * 255, f[1] * 255, f[2] * 255];
  }
  return e.length > 3 ? [n, o, a, e[3]] : [n, o, a, 1];
}, fs = (...e) => {
  e = Me(e, "rgba");
  let [t, r, i] = e;
  t /= 255, r /= 255, i /= 255;
  const n = Qa(t, r, i), o = es(t, r, i), a = (o + n) / 2;
  let l, f;
  return o === n ? (l = 0, f = Number.NaN) : l = a < 0.5 ? (o - n) / (o + n) : (o - n) / (2 - o - n), t == o ? f = (r - i) / (o - n) : r == o ? f = 2 + (i - t) / (o - n) : i == o && (f = 4 + (t - r) / (o - n)), f *= 60, f < 0 && (f += 360), e.length > 3 && e[3] !== void 0 ? [f, l, a, e[3]] : [f, l, a];
};
Ee.prototype.hsl = function() {
  return fs(this._rgb);
};
const Qd = (...e) => new Ee(...e, "hsl");
ze.hsl = Qd;
Ie.format.hsl = _i;
Ie.autodetect.push({
  p: 2,
  test: (...e) => {
    if (e = Me(e, "hsl"), je(e) === "array" && e.length === 3)
      return "hsl";
  }
});
const eh = (e, t, r) => Ar(e, t, r, "hsl");
wt.hsl = eh;
const { floor: th } = Math, rh = (...e) => {
  e = Me(e, "hsv");
  let [t, r, i] = e, n, o, a;
  if (i *= 255, r === 0)
    n = o = a = i;
  else {
    t === 360 && (t = 0), t > 360 && (t -= 360), t < 0 && (t += 360), t /= 60;
    const l = th(t), f = t - l, h = i * (1 - r), s = i * (1 - r * f), u = i * (1 - r * (1 - f));
    switch (l) {
      case 0:
        [n, o, a] = [i, u, h];
        break;
      case 1:
        [n, o, a] = [s, i, h];
        break;
      case 2:
        [n, o, a] = [h, i, u];
        break;
      case 3:
        [n, o, a] = [h, s, i];
        break;
      case 4:
        [n, o, a] = [u, h, i];
        break;
      case 5:
        [n, o, a] = [i, h, s];
        break;
    }
  }
  return [n, o, a, e.length > 3 ? e[3] : 1];
}, { min: nh, max: ih } = Math, oh = (...e) => {
  e = Me(e, "rgb");
  let [t, r, i] = e;
  const n = nh(t, r, i), o = ih(t, r, i), a = o - n;
  let l, f, h;
  return h = o / 255, o === 0 ? (l = Number.NaN, f = 0) : (f = a / o, t === o && (l = (r - i) / a), r === o && (l = 2 + (i - t) / a), i === o && (l = 4 + (t - r) / a), l *= 60, l < 0 && (l += 360)), [l, f, h];
};
Ee.prototype.hsv = function() {
  return oh(this._rgb);
};
const ah = (...e) => new Ee(...e, "hsv");
ze.hsv = ah;
Ie.format.hsv = rh;
Ie.autodetect.push({
  p: 2,
  test: (...e) => {
    if (e = Me(e, "hsv"), je(e) === "array" && e.length === 3)
      return "hsv";
  }
});
const sh = (e, t, r) => Ar(e, t, r, "hsv");
wt.hsv = sh;
function _n(e, t) {
  let r = e.length;
  Array.isArray(e[0]) || (e = [e]), Array.isArray(t[0]) || (t = t.map((a) => [a]));
  let i = t[0].length, n = t[0].map((a, l) => t.map((f) => f[l])), o = e.map(
    (a) => n.map((l) => Array.isArray(a) ? a.reduce((f, h, s) => f + h * (l[s] || 0), 0) : l.reduce((f, h) => f + h * a, 0))
  );
  return r === 1 && (o = o[0]), i === 1 ? o.map((a) => a[0]) : o;
}
const Hi = (...e) => {
  e = Me(e, "lab");
  const [t, r, i, ...n] = e, [o, a, l] = lh([t, r, i]), [f, h, s] = is(o, a, l);
  return [f, h, s, ...n.length > 0 && n[0] < 1 ? [n[0]] : []];
};
function lh(e) {
  var t = [
    [1.2268798758459243, -0.5578149944602171, 0.2813910456659647],
    [-0.0405757452148008, 1.112286803280317, -0.0717110580655164],
    [-0.0763729366746601, -0.4214933324022432, 1.5869240198367816]
  ], r = [
    [1, 0.3963377773761749, 0.2158037573099136],
    [1, -0.1055613458156586, -0.0638541728258133],
    [1, -0.0894841775298119, -1.2914855480194092]
  ], i = _n(r, e);
  return _n(
    t,
    i.map((n) => n ** 3)
  );
}
const $i = (...e) => {
  const [t, r, i, ...n] = Me(e, "rgb"), o = os(t, r, i);
  return [...fh(o), ...n.length > 0 && n[0] < 1 ? [n[0]] : []];
};
function fh(e) {
  const t = [
    [0.819022437996703, 0.3619062600528904, -0.1288737815209879],
    [0.0329836539323885, 0.9292868615863434, 0.0361446663506424],
    [0.0481771893596242, 0.2642395317527308, 0.6335478284694309]
  ], r = [
    [0.210454268309314, 0.7936177747023054, -0.0040720430116193],
    [1.9779985324311684, -2.42859224204858, 0.450593709617411],
    [0.0259040424655478, 0.7827717124575296, -0.8086757549230774]
  ], i = _n(t, e);
  return _n(
    r,
    i.map((n) => Math.cbrt(n))
  );
}
Ee.prototype.oklab = function() {
  return $i(this._rgb);
};
const ch = (...e) => new Ee(...e, "oklab");
Object.assign(ze, { oklab: ch });
Ie.format.oklab = Hi;
Ie.autodetect.push({
  p: 2,
  test: (...e) => {
    if (e = Me(e, "oklab"), je(e) === "array" && e.length === 3)
      return "oklab";
  }
});
const uh = (e, t, r) => {
  const i = e.oklab(), n = t.oklab();
  return new Ee(
    i[0] + r * (n[0] - i[0]),
    i[1] + r * (n[1] - i[1]),
    i[2] + r * (n[2] - i[2]),
    "oklab"
  );
};
wt.oklab = uh;
const dh = (e, t, r) => Ar(e, t, r, "oklch");
wt.oklch = dh;
const { pow: ni, sqrt: ii, PI: oi, cos: Bo, sin: Fo, atan2: hh } = Math, ph = (e, t = "lrgb", r = null) => {
  const i = e.length;
  r || (r = Array.from(new Array(i)).map(() => 1));
  const n = i / r.reduce(function(u, c) {
    return u + c;
  });
  if (r.forEach((u, c) => {
    r[c] *= n;
  }), e = e.map((u) => new Ee(u)), t === "lrgb")
    return yh(e, r);
  const o = e.shift(), a = o.get(t), l = [];
  let f = 0, h = 0;
  for (let u = 0; u < a.length; u++)
    if (a[u] = (a[u] || 0) * r[0], l.push(isNaN(a[u]) ? 0 : r[0]), t.charAt(u) === "h" && !isNaN(a[u])) {
      const c = a[u] / 180 * oi;
      f += Bo(c) * r[0], h += Fo(c) * r[0];
    }
  let s = o.alpha() * r[0];
  e.forEach((u, c) => {
    const p = u.get(t);
    s += u.alpha() * r[c + 1];
    for (let m = 0; m < a.length; m++)
      if (!isNaN(p[m]))
        if (l[m] += r[c + 1], t.charAt(m) === "h") {
          const d = p[m] / 180 * oi;
          f += Bo(d) * r[c + 1], h += Fo(d) * r[c + 1];
        } else
          a[m] += p[m] * r[c + 1];
  });
  for (let u = 0; u < a.length; u++)
    if (t.charAt(u) === "h") {
      let c = hh(h / l[u], f / l[u]) / oi * 180;
      for (; c < 0; ) c += 360;
      for (; c >= 360; ) c -= 360;
      a[u] = c;
    } else
      a[u] = a[u] / l[u];
  return s /= i, new Ee(a, t).alpha(s > 0.99999 ? 1 : s, !0);
}, yh = (e, t) => {
  const r = e.length, i = [0, 0, 0, 0];
  for (let n = 0; n < e.length; n++) {
    const o = e[n], a = t[n] / r, l = o._rgb;
    i[0] += ni(l[0], 2) * a, i[1] += ni(l[1], 2) * a, i[2] += ni(l[2], 2) * a, i[3] += l[3] * a;
  }
  return i[0] = ii(i[0]), i[1] = ii(i[1]), i[2] = ii(i[2]), i[3] > 0.9999999 && (i[3] = 1), new Ee(Fi(i));
}, { pow: gh } = Math;
function vn(e) {
  let t = "rgb", r = ze("#ccc"), i = 0, n = [0, 1], o = [0, 1], a = [], l = [0, 0], f = !1, h = [], s = !1, u = 0, c = 1, p = !1, m = {}, d = !0, _ = 1;
  const v = function(R) {
    if (R = R || ["#fff", "#000"], R && je(R) === "string" && ze.brewer && ze.brewer[R.toLowerCase()] && (R = ze.brewer[R.toLowerCase()]), je(R) === "array") {
      R.length === 1 && (R = [R[0], R[0]]), R = R.slice(0);
      for (let M = 0; M < R.length; M++)
        R[M] = ze(R[M]);
      a.length = 0;
      for (let M = 0; M < R.length; M++)
        a.push(M / (R.length - 1));
    }
    return A(), h = R;
  }, k = function(R) {
    if (f != null) {
      const M = f.length - 1;
      let b = 0;
      for (; b < M && R >= f[b]; )
        b++;
      return b - 1;
    }
    return 0;
  };
  let E = (R) => R, T = (R) => R;
  const x = function(R, M) {
    let b, N;
    if (M == null && (M = !1), isNaN(R) || R === null)
      return r;
    M ? N = R : f && f.length > 2 ? N = k(R) / (f.length - 2) : c !== u ? N = (R - u) / (c - u) : N = 1, N = T(N), M || (N = E(N)), _ !== 1 && (N = gh(N, _)), N = l[0] + N * (1 - l[0] - l[1]), N = or(N, 0, 1);
    const j = Math.floor(N * 1e4);
    if (d && m[j])
      b = m[j];
    else {
      if (je(h) === "array")
        for (let $ = 0; $ < a.length; $++) {
          const re = a[$];
          if (N <= re) {
            b = h[$];
            break;
          }
          if (N >= re && $ === a.length - 1) {
            b = h[$];
            break;
          }
          if (N > re && N < a[$ + 1]) {
            N = (N - re) / (a[$ + 1] - re), b = ze.interpolate(
              h[$],
              h[$ + 1],
              N,
              t
            );
            break;
          }
        }
      else je(h) === "function" && (b = h(N));
      d && (m[j] = b);
    }
    return b;
  };
  var A = () => m = {};
  v(e);
  const I = function(R) {
    const M = ze(x(R));
    return s && M[s] ? M[s]() : M;
  };
  return I.classes = function(R) {
    if (R != null) {
      if (je(R) === "array")
        f = R, n = [R[0], R[R.length - 1]];
      else {
        const M = ze.analyze(n);
        R === 0 ? f = [M.min, M.max] : f = ze.limits(M, "e", R);
      }
      return I;
    }
    return f;
  }, I.domain = function(R) {
    if (!arguments.length)
      return o;
    o = R.slice(0), u = R[0], c = R[R.length - 1], a = [];
    const M = h.length;
    if (R.length === M && u !== c)
      for (let b of Array.from(R))
        a.push((b - u) / (c - u));
    else {
      for (let b = 0; b < M; b++)
        a.push(b / (M - 1));
      if (R.length > 2) {
        const b = R.map((j, $) => $ / (R.length - 1)), N = R.map((j) => (j - u) / (c - u));
        N.every((j, $) => b[$] === j) || (T = (j) => {
          if (j <= 0 || j >= 1) return j;
          let $ = 0;
          for (; j >= N[$ + 1]; ) $++;
          const re = (j - N[$]) / (N[$ + 1] - N[$]);
          return b[$] + re * (b[$ + 1] - b[$]);
        });
      }
    }
    return n = [u, c], I;
  }, I.mode = function(R) {
    return arguments.length ? (t = R, A(), I) : t;
  }, I.range = function(R, M) {
    return v(R), I;
  }, I.out = function(R) {
    return s = R, I;
  }, I.spread = function(R) {
    return arguments.length ? (i = R, I) : i;
  }, I.correctLightness = function(R) {
    return R == null && (R = !0), p = R, A(), p ? E = function(M) {
      const b = x(0, !0).lab()[0], N = x(1, !0).lab()[0], j = b > N;
      let $ = x(M, !0).lab()[0];
      const re = b + (N - b) * M;
      let ne = $ - re, U = 0, P = 1, D = 20;
      for (; Math.abs(ne) > 0.01 && D-- > 0; )
        (function() {
          return j && (ne *= -1), ne < 0 ? (U = M, M += (P - M) * 0.5) : (P = M, M += (U - M) * 0.5), $ = x(M, !0).lab()[0], ne = $ - re;
        })();
      return M;
    } : E = (M) => M, I;
  }, I.padding = function(R) {
    return R != null ? (je(R) === "number" && (R = [R, R]), l = R, I) : l;
  }, I.colors = function(R, M) {
    arguments.length < 2 && (M = "hex");
    let b = [];
    if (arguments.length === 0)
      b = h.slice(0);
    else if (R === 1)
      b = [I(0.5)];
    else if (R > 1) {
      const N = n[0], j = n[1] - N;
      b = mh(0, R).map(
        ($) => I(N + $ / (R - 1) * j)
      );
    } else {
      e = [];
      let N = [];
      if (f && f.length > 2)
        for (let j = 1, $ = f.length, re = 1 <= $; re ? j < $ : j > $; re ? j++ : j--)
          N.push((f[j - 1] + f[j]) * 0.5);
      else
        N = n;
      b = N.map((j) => I(j));
    }
    return ze[M] && (b = b.map((N) => N[M]())), b;
  }, I.cache = function(R) {
    return R != null ? (d = R, I) : d;
  }, I.gamma = function(R) {
    return R != null ? (_ = R, I) : _;
  }, I.nodata = function(R) {
    return R != null ? (r = ze(R), I) : r;
  }, I;
}
function mh(e, t, r) {
  let i = [], n = e < t, o = t;
  for (let a = e; n ? a < o : a > o; n ? a++ : a--)
    i.push(a);
  return i;
}
const bh = function(e) {
  let t = [1, 1];
  for (let r = 1; r < e; r++) {
    let i = [1];
    for (let n = 1; n <= t.length; n++)
      i[n] = (t[n] || 0) + t[n - 1];
    t = i;
  }
  return t;
}, _h = function(e) {
  let t, r, i, n;
  if (e = e.map((o) => new Ee(o)), e.length === 2)
    [r, i] = e.map((o) => o.lab()), t = function(o) {
      const a = [0, 1, 2].map((l) => r[l] + o * (i[l] - r[l]));
      return new Ee(a, "lab");
    };
  else if (e.length === 3)
    [r, i, n] = e.map((o) => o.lab()), t = function(o) {
      const a = [0, 1, 2].map(
        (l) => (1 - o) * (1 - o) * r[l] + 2 * (1 - o) * o * i[l] + o * o * n[l]
      );
      return new Ee(a, "lab");
    };
  else if (e.length === 4) {
    let o;
    [r, i, n, o] = e.map((a) => a.lab()), t = function(a) {
      const l = [0, 1, 2].map(
        (f) => (1 - a) * (1 - a) * (1 - a) * r[f] + 3 * (1 - a) * (1 - a) * a * i[f] + 3 * (1 - a) * a * a * n[f] + a * a * a * o[f]
      );
      return new Ee(l, "lab");
    };
  } else if (e.length >= 5) {
    let o, a, l;
    o = e.map((f) => f.lab()), l = e.length - 1, a = bh(l), t = function(f) {
      const h = 1 - f, s = [0, 1, 2].map(
        (u) => o.reduce(
          (c, p, m) => c + a[m] * h ** (l - m) * f ** m * p[u],
          0
        )
      );
      return new Ee(s, "lab");
    };
  } else
    throw new RangeError("No point in running bezier with only one color.");
  return t;
}, vh = (e) => {
  const t = _h(e);
  return t.scale = () => vn(t), t;
}, { round: cs } = Math;
Ee.prototype.rgb = function(e = !0) {
  return e === !1 ? this._rgb.slice(0, 3) : this._rgb.slice(0, 3).map(cs);
};
Ee.prototype.rgba = function(e = !0) {
  return this._rgb.slice(0, 4).map((t, r) => r < 3 ? e === !1 ? t : cs(t) : t);
};
const wh = (...e) => new Ee(...e, "rgb");
Object.assign(ze, { rgb: wh });
Ie.format.rgb = (...e) => {
  const t = Me(e, "rgba");
  return t[3] === void 0 && (t[3] = 1), t;
};
Ie.autodetect.push({
  p: 3,
  test: (...e) => {
    if (e = Me(e, "rgba"), je(e) === "array" && (e.length === 3 || e.length === 4 && je(e[3]) == "number" && e[3] >= 0 && e[3] <= 1))
      return "rgb";
  }
});
const Bt = (e, t, r) => {
  if (!Bt[r])
    throw new Error("unknown blend mode " + r);
  return Bt[r](e, t);
}, tr = (e) => (t, r) => {
  const i = ze(r).rgb(), n = ze(t).rgb();
  return ze.rgb(e(i, n));
}, rr = (e) => (t, r) => {
  const i = [];
  return i[0] = e(t[0], r[0]), i[1] = e(t[1], r[1]), i[2] = e(t[2], r[2]), i;
}, Eh = (e) => e, Sh = (e, t) => e * t / 255, Th = (e, t) => e > t ? t : e, Ah = (e, t) => e > t ? e : t, Rh = (e, t) => 255 * (1 - (1 - e / 255) * (1 - t / 255)), xh = (e, t) => t < 128 ? 2 * e * t / 255 : 255 * (1 - 2 * (1 - e / 255) * (1 - t / 255)), kh = (e, t) => 255 * (1 - (1 - t / 255) / (e / 255)), Ch = (e, t) => e === 255 ? 255 : (e = 255 * (t / 255) / (1 - e / 255), e > 255 ? 255 : e);
Bt.normal = tr(rr(Eh));
Bt.multiply = tr(rr(Sh));
Bt.screen = tr(rr(Rh));
Bt.overlay = tr(rr(xh));
Bt.darken = tr(rr(Th));
Bt.lighten = tr(rr(Ah));
Bt.dodge = tr(rr(Ch));
Bt.burn = tr(rr(kh));
const { pow: Oh, sin: Ph, cos: Ih } = Math;
function Lh(e = 300, t = -1.5, r = 1, i = 1, n = [0, 1]) {
  let o = 0, a;
  je(n) === "array" ? a = n[1] - n[0] : (a = 0, n = [n, n]);
  const l = function(f) {
    const h = Vt * ((e + 120) / 360 + t * f), s = Oh(n[0] + a * f, i), c = (o !== 0 ? r[0] + f * o : r) * s * (1 - s) / 2, p = Ih(h), m = Ph(h), d = s + c * (-0.14861 * p + 1.78277 * m), _ = s + c * (-0.29227 * p - 0.90649 * m), v = s + c * (1.97294 * p);
    return ze(Fi([d * 255, _ * 255, v * 255, 1]));
  };
  return l.start = function(f) {
    return f == null ? e : (e = f, l);
  }, l.rotations = function(f) {
    return f == null ? t : (t = f, l);
  }, l.gamma = function(f) {
    return f == null ? i : (i = f, l);
  }, l.hue = function(f) {
    return f == null ? r : (r = f, je(r) === "array" ? (o = r[1] - r[0], o === 0 && (r = r[1])) : o = 0, l);
  }, l.lightness = function(f) {
    return f == null ? n : (je(f) === "array" ? (n = f, a = f[1] - f[0]) : (n = [f, f], a = 0), l);
  }, l.scale = () => ze.scale(l), l.hue(r), l;
}
const Mh = "0123456789abcdef", { floor: Nh, random: Bh } = Math, Fh = (e = Bh) => {
  let t = "#";
  for (let r = 0; r < 6; r++)
    t += Mh.charAt(Nh(e() * 16));
  return new Ee(t, "hex");
}, { log: Do, pow: Dh, floor: Uh, abs: jh } = Math;
function us(e, t = null) {
  const r = {
    min: Number.MAX_VALUE,
    max: Number.MAX_VALUE * -1,
    sum: 0,
    values: [],
    count: 0
  };
  return je(e) === "object" && (e = Object.values(e)), e.forEach((i) => {
    t && je(i) === "object" && (i = i[t]), i != null && !isNaN(i) && (r.values.push(i), r.sum += i, i < r.min && (r.min = i), i > r.max && (r.max = i), r.count += 1);
  }), r.domain = [r.min, r.max], r.limits = (i, n) => ds(r, i, n), r;
}
function ds(e, t = "equal", r = 7) {
  je(e) == "array" && (e = us(e));
  const { min: i, max: n } = e, o = e.values.sort((l, f) => l - f);
  if (r === 1)
    return [i, n];
  const a = [];
  if (t.substr(0, 1) === "c" && (a.push(i), a.push(n)), t.substr(0, 1) === "e") {
    a.push(i);
    for (let l = 1; l < r; l++)
      a.push(i + l / r * (n - i));
    a.push(n);
  } else if (t.substr(0, 1) === "l") {
    if (i <= 0)
      throw new Error(
        "Logarithmic scales are only possible for values > 0"
      );
    const l = Math.LOG10E * Do(i), f = Math.LOG10E * Do(n);
    a.push(i);
    for (let h = 1; h < r; h++)
      a.push(Dh(10, l + h / r * (f - l)));
    a.push(n);
  } else if (t.substr(0, 1) === "q") {
    a.push(i);
    for (let l = 1; l < r; l++) {
      const f = (o.length - 1) * l / r, h = Uh(f);
      if (h === f)
        a.push(o[h]);
      else {
        const s = f - h;
        a.push(o[h] * (1 - s) + o[h + 1] * s);
      }
    }
    a.push(n);
  } else if (t.substr(0, 1) === "k") {
    let l;
    const f = o.length, h = new Array(f), s = new Array(r);
    let u = !0, c = 0, p = null;
    p = [], p.push(i);
    for (let _ = 1; _ < r; _++)
      p.push(i + _ / r * (n - i));
    for (p.push(n); u; ) {
      for (let v = 0; v < r; v++)
        s[v] = 0;
      for (let v = 0; v < f; v++) {
        const k = o[v];
        let E = Number.MAX_VALUE, T;
        for (let x = 0; x < r; x++) {
          const A = jh(p[x] - k);
          A < E && (E = A, T = x), s[T]++, h[v] = T;
        }
      }
      const _ = new Array(r);
      for (let v = 0; v < r; v++)
        _[v] = null;
      for (let v = 0; v < f; v++)
        l = h[v], _[l] === null ? _[l] = o[v] : _[l] += o[v];
      for (let v = 0; v < r; v++)
        _[v] *= 1 / s[v];
      u = !1;
      for (let v = 0; v < r; v++)
        if (_[v] !== p[v]) {
          u = !0;
          break;
        }
      p = _, c++, c > 200 && (u = !1);
    }
    const m = {};
    for (let _ = 0; _ < r; _++)
      m[_] = [];
    for (let _ = 0; _ < f; _++)
      l = h[_], m[l].push(o[_]);
    let d = [];
    for (let _ = 0; _ < r; _++)
      d.push(m[_][0]), d.push(m[_][m[_].length - 1]);
    d = d.sort((_, v) => _ - v), a.push(d[0]);
    for (let _ = 1; _ < d.length; _ += 2) {
      const v = d[_];
      !isNaN(v) && a.indexOf(v) === -1 && a.push(v);
    }
  }
  return a;
}
const zh = (e, t) => {
  e = new Ee(e), t = new Ee(t);
  const r = e.luminance(), i = t.luminance();
  return r > i ? (r + 0.05) / (i + 0.05) : (i + 0.05) / (r + 0.05);
};
/**
 * @license
 *
 * The APCA contrast prediction algorithm is based of the formulas published
 * in the APCA-1.0.98G specification by Myndex. The specification is available at:
 * https://raw.githubusercontent.com/Myndex/apca-w3/master/images/APCAw3_0.1.17_APCA0.0.98G.svg
 *
 * Note that the APCA implementation is still beta, so please update to
 * future versions of chroma.js when they become available.
 *
 * You can read more about the APCA Readability Criterion at
 * https://readtech.org/ARC/
 */
const Uo = 0.027, Hh = 5e-4, $h = 0.1, jo = 1.14, on = 0.022, zo = 1.414, Wh = (e, t) => {
  e = new Ee(e), t = new Ee(t), e.alpha() < 1 && (e = Er(t, e, e.alpha(), "rgb"));
  const r = Ho(...e.rgb()), i = Ho(...t.rgb()), n = r >= on ? r : r + Math.pow(on - r, zo), o = i >= on ? i : i + Math.pow(on - i, zo), a = Math.pow(o, 0.56) - Math.pow(n, 0.57), l = Math.pow(o, 0.65) - Math.pow(n, 0.62), f = Math.abs(o - n) < Hh ? 0 : n < o ? a * jo : l * jo;
  return (Math.abs(f) < $h ? 0 : f > 0 ? f - Uo : f + Uo) * 100;
};
function Ho(e, t, r) {
  return 0.2126729 * Math.pow(e / 255, 2.4) + 0.7151522 * Math.pow(t / 255, 2.4) + 0.072175 * Math.pow(r / 255, 2.4);
}
const { sqrt: Yt, pow: ct, min: Zh, max: Gh, atan2: $o, abs: Wo, cos: an, sin: Zo, exp: Yh, PI: Go } = Math;
function Vh(e, t, r = 1, i = 1, n = 1) {
  var o = function(H) {
    return 360 * H / (2 * Go);
  }, a = function(H) {
    return 2 * Go * H / 360;
  };
  e = new Ee(e), t = new Ee(t);
  const [l, f, h] = Array.from(e.lab()), [s, u, c] = Array.from(t.lab()), p = (l + s) / 2, m = Yt(ct(f, 2) + ct(h, 2)), d = Yt(ct(u, 2) + ct(c, 2)), _ = (m + d) / 2, v = 0.5 * (1 - Yt(ct(_, 7) / (ct(_, 7) + ct(25, 7)))), k = f * (1 + v), E = u * (1 + v), T = Yt(ct(k, 2) + ct(h, 2)), x = Yt(ct(E, 2) + ct(c, 2)), A = (T + x) / 2, I = o($o(h, k)), R = o($o(c, E)), M = I >= 0 ? I : I + 360, b = R >= 0 ? R : R + 360, N = Wo(M - b) > 180 ? (M + b + 360) / 2 : (M + b) / 2, j = 1 - 0.17 * an(a(N - 30)) + 0.24 * an(a(2 * N)) + 0.32 * an(a(3 * N + 6)) - 0.2 * an(a(4 * N - 63));
  let $ = b - M;
  $ = Wo($) <= 180 ? $ : b <= M ? $ + 360 : $ - 360, $ = 2 * Yt(T * x) * Zo(a($) / 2);
  const re = s - l, ne = x - T, U = 1 + 0.015 * ct(p - 50, 2) / Yt(20 + ct(p - 50, 2)), P = 1 + 0.045 * A, D = 1 + 0.015 * A * j, Q = 30 * Yh(-ct((N - 275) / 25, 2)), oe = -(2 * Yt(ct(A, 7) / (ct(A, 7) + ct(25, 7)))) * Zo(2 * a(Q)), ae = Yt(
    ct(re / (r * U), 2) + ct(ne / (i * P), 2) + ct($ / (n * D), 2) + oe * (ne / (i * P)) * ($ / (n * D))
  );
  return Gh(0, Zh(100, ae));
}
function Kh(e, t, r = "lab") {
  e = new Ee(e), t = new Ee(t);
  const i = e.get(r), n = t.get(r);
  let o = 0;
  for (let a in i) {
    const l = (i[a] || 0) - (n[a] || 0);
    o += l * l;
  }
  return Math.sqrt(o);
}
const qh = (...e) => {
  try {
    return new Ee(...e), !0;
  } catch {
    return !1;
  }
}, Xh = {
  cool() {
    return vn([ze.hsl(180, 1, 0.9), ze.hsl(250, 0.7, 0.4)]);
  },
  hot() {
    return vn(["#000", "#f00", "#ff0", "#fff"]).mode(
      "rgb"
    );
  }
}, vi = {
  // sequential
  OrRd: ["#fff7ec", "#fee8c8", "#fdd49e", "#fdbb84", "#fc8d59", "#ef6548", "#d7301f", "#b30000", "#7f0000"],
  PuBu: ["#fff7fb", "#ece7f2", "#d0d1e6", "#a6bddb", "#74a9cf", "#3690c0", "#0570b0", "#045a8d", "#023858"],
  BuPu: ["#f7fcfd", "#e0ecf4", "#bfd3e6", "#9ebcda", "#8c96c6", "#8c6bb1", "#88419d", "#810f7c", "#4d004b"],
  Oranges: ["#fff5eb", "#fee6ce", "#fdd0a2", "#fdae6b", "#fd8d3c", "#f16913", "#d94801", "#a63603", "#7f2704"],
  BuGn: ["#f7fcfd", "#e5f5f9", "#ccece6", "#99d8c9", "#66c2a4", "#41ae76", "#238b45", "#006d2c", "#00441b"],
  YlOrBr: ["#ffffe5", "#fff7bc", "#fee391", "#fec44f", "#fe9929", "#ec7014", "#cc4c02", "#993404", "#662506"],
  YlGn: ["#ffffe5", "#f7fcb9", "#d9f0a3", "#addd8e", "#78c679", "#41ab5d", "#238443", "#006837", "#004529"],
  Reds: ["#fff5f0", "#fee0d2", "#fcbba1", "#fc9272", "#fb6a4a", "#ef3b2c", "#cb181d", "#a50f15", "#67000d"],
  RdPu: ["#fff7f3", "#fde0dd", "#fcc5c0", "#fa9fb5", "#f768a1", "#dd3497", "#ae017e", "#7a0177", "#49006a"],
  Greens: ["#f7fcf5", "#e5f5e0", "#c7e9c0", "#a1d99b", "#74c476", "#41ab5d", "#238b45", "#006d2c", "#00441b"],
  YlGnBu: ["#ffffd9", "#edf8b1", "#c7e9b4", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#253494", "#081d58"],
  Purples: ["#fcfbfd", "#efedf5", "#dadaeb", "#bcbddc", "#9e9ac8", "#807dba", "#6a51a3", "#54278f", "#3f007d"],
  GnBu: ["#f7fcf0", "#e0f3db", "#ccebc5", "#a8ddb5", "#7bccc4", "#4eb3d3", "#2b8cbe", "#0868ac", "#084081"],
  Greys: ["#ffffff", "#f0f0f0", "#d9d9d9", "#bdbdbd", "#969696", "#737373", "#525252", "#252525", "#000000"],
  YlOrRd: ["#ffffcc", "#ffeda0", "#fed976", "#feb24c", "#fd8d3c", "#fc4e2a", "#e31a1c", "#bd0026", "#800026"],
  PuRd: ["#f7f4f9", "#e7e1ef", "#d4b9da", "#c994c7", "#df65b0", "#e7298a", "#ce1256", "#980043", "#67001f"],
  Blues: ["#f7fbff", "#deebf7", "#c6dbef", "#9ecae1", "#6baed6", "#4292c6", "#2171b5", "#08519c", "#08306b"],
  PuBuGn: ["#fff7fb", "#ece2f0", "#d0d1e6", "#a6bddb", "#67a9cf", "#3690c0", "#02818a", "#016c59", "#014636"],
  Viridis: ["#440154", "#482777", "#3f4a8a", "#31678e", "#26838f", "#1f9d8a", "#6cce5a", "#b6de2b", "#fee825"],
  // diverging
  Spectral: ["#9e0142", "#d53e4f", "#f46d43", "#fdae61", "#fee08b", "#ffffbf", "#e6f598", "#abdda4", "#66c2a5", "#3288bd", "#5e4fa2"],
  RdYlGn: ["#a50026", "#d73027", "#f46d43", "#fdae61", "#fee08b", "#ffffbf", "#d9ef8b", "#a6d96a", "#66bd63", "#1a9850", "#006837"],
  RdBu: ["#67001f", "#b2182b", "#d6604d", "#f4a582", "#fddbc7", "#f7f7f7", "#d1e5f0", "#92c5de", "#4393c3", "#2166ac", "#053061"],
  PiYG: ["#8e0152", "#c51b7d", "#de77ae", "#f1b6da", "#fde0ef", "#f7f7f7", "#e6f5d0", "#b8e186", "#7fbc41", "#4d9221", "#276419"],
  PRGn: ["#40004b", "#762a83", "#9970ab", "#c2a5cf", "#e7d4e8", "#f7f7f7", "#d9f0d3", "#a6dba0", "#5aae61", "#1b7837", "#00441b"],
  RdYlBu: ["#a50026", "#d73027", "#f46d43", "#fdae61", "#fee090", "#ffffbf", "#e0f3f8", "#abd9e9", "#74add1", "#4575b4", "#313695"],
  BrBG: ["#543005", "#8c510a", "#bf812d", "#dfc27d", "#f6e8c3", "#f5f5f5", "#c7eae5", "#80cdc1", "#35978f", "#01665e", "#003c30"],
  RdGy: ["#67001f", "#b2182b", "#d6604d", "#f4a582", "#fddbc7", "#ffffff", "#e0e0e0", "#bababa", "#878787", "#4d4d4d", "#1a1a1a"],
  PuOr: ["#7f3b08", "#b35806", "#e08214", "#fdb863", "#fee0b6", "#f7f7f7", "#d8daeb", "#b2abd2", "#8073ac", "#542788", "#2d004b"],
  // qualitative
  Set2: ["#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3", "#a6d854", "#ffd92f", "#e5c494", "#b3b3b3"],
  Accent: ["#7fc97f", "#beaed4", "#fdc086", "#ffff99", "#386cb0", "#f0027f", "#bf5b17", "#666666"],
  Set1: ["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00", "#ffff33", "#a65628", "#f781bf", "#999999"],
  Set3: ["#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462", "#b3de69", "#fccde5", "#d9d9d9", "#bc80bd", "#ccebc5", "#ffed6f"],
  Dark2: ["#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e", "#e6ab02", "#a6761d", "#666666"],
  Paired: ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6", "#6a3d9a", "#ffff99", "#b15928"],
  Pastel2: ["#b3e2cd", "#fdcdac", "#cbd5e8", "#f4cae4", "#e6f5c9", "#fff2ae", "#f1e2cc", "#cccccc"],
  Pastel1: ["#fbb4ae", "#b3cde3", "#ccebc5", "#decbe4", "#fed9a6", "#ffffcc", "#e5d8bd", "#fddaec", "#f2f2f2"]
}, hs = Object.keys(vi), Yo = new Map(hs.map((e) => [e.toLowerCase(), e])), Jh = typeof Proxy == "function" ? new Proxy(vi, {
  get(e, t) {
    const r = t.toLowerCase();
    if (Yo.has(r))
      return e[Yo.get(r)];
  },
  getOwnPropertyNames() {
    return Object.getOwnPropertyNames(hs);
  }
}) : vi, Qh = (...e) => {
  e = Me(e, "cmyk");
  const [t, r, i, n] = e, o = e.length > 4 ? e[4] : 1;
  return n === 1 ? [0, 0, 0, o] : [
    t >= 1 ? 0 : 255 * (1 - t) * (1 - n),
    // r
    r >= 1 ? 0 : 255 * (1 - r) * (1 - n),
    // g
    i >= 1 ? 0 : 255 * (1 - i) * (1 - n),
    // b
    o
  ];
}, { max: Vo } = Math, ep = (...e) => {
  let [t, r, i] = Me(e, "rgb");
  t = t / 255, r = r / 255, i = i / 255;
  const n = 1 - Vo(t, Vo(r, i)), o = n < 1 ? 1 / (1 - n) : 0, a = (1 - t - n) * o, l = (1 - r - n) * o, f = (1 - i - n) * o;
  return [a, l, f, n];
};
Ee.prototype.cmyk = function() {
  return ep(this._rgb);
};
const tp = (...e) => new Ee(...e, "cmyk");
Object.assign(ze, { cmyk: tp });
Ie.format.cmyk = Qh;
Ie.autodetect.push({
  p: 2,
  test: (...e) => {
    if (e = Me(e, "cmyk"), je(e) === "array" && e.length === 4)
      return "cmyk";
  }
});
const rp = (...e) => {
  const t = Me(e, "hsla");
  let r = Tr(e) || "lsa";
  return t[0] = It(t[0] || 0) + "deg", t[1] = It(t[1] * 100) + "%", t[2] = It(t[2] * 100) + "%", r === "hsla" || t.length > 3 && t[3] < 1 ? (t[3] = "/ " + (t.length > 3 ? t[3] : 1), r = "hsla") : t.length = 3, `${r.substr(0, 3)}(${t.join(" ")})`;
}, np = (...e) => {
  const t = Me(e, "lab");
  let r = Tr(e) || "lab";
  return t[0] = It(t[0]) + "%", t[1] = It(t[1]), t[2] = It(t[2]), r === "laba" || t.length > 3 && t[3] < 1 ? t[3] = "/ " + (t.length > 3 ? t[3] : 1) : t.length = 3, `lab(${t.join(" ")})`;
}, ip = (...e) => {
  const t = Me(e, "lch");
  let r = Tr(e) || "lab";
  return t[0] = It(t[0]) + "%", t[1] = It(t[1]), t[2] = isNaN(t[2]) ? "none" : It(t[2]) + "deg", r === "lcha" || t.length > 3 && t[3] < 1 ? t[3] = "/ " + (t.length > 3 ? t[3] : 1) : t.length = 3, `lch(${t.join(" ")})`;
}, op = (...e) => {
  const t = Me(e, "lab");
  return t[0] = It(t[0] * 100) + "%", t[1] = bi(t[1]), t[2] = bi(t[2]), t.length > 3 && t[3] < 1 ? t[3] = "/ " + (t.length > 3 ? t[3] : 1) : t.length = 3, `oklab(${t.join(" ")})`;
}, ps = (...e) => {
  const [t, r, i, ...n] = Me(e, "rgb"), [o, a, l] = $i(t, r, i), [f, h, s] = ss(o, a, l);
  return [f, h, s, ...n.length > 0 && n[0] < 1 ? [n[0]] : []];
}, ap = (...e) => {
  const t = Me(e, "lch");
  return t[0] = It(t[0] * 100) + "%", t[1] = bi(t[1]), t[2] = isNaN(t[2]) ? "none" : It(t[2]) + "deg", t.length > 3 && t[3] < 1 ? t[3] = "/ " + (t.length > 3 ? t[3] : 1) : t.length = 3, `oklch(${t.join(" ")})`;
}, { round: ai } = Math, sp = (...e) => {
  const t = Me(e, "rgba");
  let r = Tr(e) || "rgb";
  if (r.substr(0, 3) === "hsl")
    return rp(fs(t), r);
  if (r.substr(0, 3) === "lab") {
    const i = Hr();
    Kt("d50");
    const n = np(Ui(t), r);
    return Kt(i), n;
  }
  if (r.substr(0, 3) === "lch") {
    const i = Hr();
    Kt("d50");
    const n = ip(zi(t), r);
    return Kt(i), n;
  }
  return r.substr(0, 5) === "oklab" ? op($i(t)) : r.substr(0, 5) === "oklch" ? ap(ps(t)) : (t[0] = ai(t[0]), t[1] = ai(t[1]), t[2] = ai(t[2]), (r === "rgba" || t.length > 3 && t[3] < 1) && (t[3] = "/ " + (t.length > 3 ? t[3] : 1), r = "rgba"), `${r.substr(0, 3)}(${t.slice(0, r === "rgb" ? 3 : 4).join(" ")})`);
}, ys = (...e) => {
  e = Me(e, "lch");
  const [t, r, i, ...n] = e, [o, a, l] = as(t, r, i), [f, h, s] = Hi(o, a, l);
  return [f, h, s, ...n.length > 0 && n[0] < 1 ? [n[0]] : []];
}, qt = /((?:-?\d+)|(?:-?\d+(?:\.\d+)?)%|none)/.source, Nt = /((?:-?(?:\d+(?:\.\d*)?|\.\d+)%?)|none)/.source, wn = /((?:-?(?:\d+(?:\.\d*)?|\.\d+)%)|none)/.source, Lt = /\s*/.source, Rr = /\s+/.source, Wi = /\s*,\s*/.source, Un = /((?:-?(?:\d+(?:\.\d*)?|\.\d+)(?:deg)?)|none)/.source, xr = /\s*(?:\/\s*((?:[01]|[01]?\.\d+)|\d+(?:\.\d+)?%))?/.source, gs = new RegExp(
  "^rgba?\\(" + Lt + [qt, qt, qt].join(Rr) + xr + "\\)$"
), ms = new RegExp(
  "^rgb\\(" + Lt + [qt, qt, qt].join(Wi) + Lt + "\\)$"
), bs = new RegExp(
  "^rgba\\(" + Lt + [qt, qt, qt, Nt].join(Wi) + Lt + "\\)$"
), _s = new RegExp(
  "^hsla?\\(" + Lt + [Un, wn, wn].join(Rr) + xr + "\\)$"
), vs = new RegExp(
  "^hsl?\\(" + Lt + [Un, wn, wn].join(Wi) + Lt + "\\)$"
), ws = /^hsla\(\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)%\s*,\s*(-?\d+(?:\.\d+)?)%\s*,\s*([01]|[01]?\.\d+)\)$/, Es = new RegExp(
  "^lab\\(" + Lt + [Nt, Nt, Nt].join(Rr) + xr + "\\)$"
), Ss = new RegExp(
  "^lch\\(" + Lt + [Nt, Nt, Un].join(Rr) + xr + "\\)$"
), Ts = new RegExp(
  "^oklab\\(" + Lt + [Nt, Nt, Nt].join(Rr) + xr + "\\)$"
), As = new RegExp(
  "^oklch\\(" + Lt + [Nt, Nt, Un].join(Rr) + xr + "\\)$"
), { round: Rs } = Math, yr = (e) => e.map((t, r) => r <= 2 ? or(Rs(t), 0, 255) : t), ut = (e, t = 0, r = 100, i = !1) => (typeof e == "string" && e.endsWith("%") && (e = parseFloat(e.substring(0, e.length - 1)) / 100, i ? e = t + (e + 1) * 0.5 * (r - t) : e = t + e * (r - t)), +e), St = (e, t) => e === "none" ? t : e, Zi = (e) => {
  if (e = e.toLowerCase().trim(), e === "transparent")
    return [0, 0, 0, 0];
  let t;
  if (Ie.format.named)
    try {
      return Ie.format.named(e);
    } catch {
    }
  if ((t = e.match(gs)) || (t = e.match(ms))) {
    let r = t.slice(1, 4);
    for (let n = 0; n < 3; n++)
      r[n] = +ut(St(r[n], 0), 0, 255);
    r = yr(r);
    const i = t[4] !== void 0 ? +ut(t[4], 0, 1) : 1;
    return r[3] = i, r;
  }
  if (t = e.match(bs)) {
    const r = t.slice(1, 5);
    for (let i = 0; i < 4; i++)
      r[i] = +ut(r[i], 0, 255);
    return r;
  }
  if ((t = e.match(_s)) || (t = e.match(vs))) {
    const r = t.slice(1, 4);
    r[0] = +St(r[0].replace("deg", ""), 0), r[1] = +ut(St(r[1], 0), 0, 100) * 0.01, r[2] = +ut(St(r[2], 0), 0, 100) * 0.01;
    const i = yr(_i(r)), n = t[4] !== void 0 ? +ut(t[4], 0, 1) : 1;
    return i[3] = n, i;
  }
  if (t = e.match(ws)) {
    const r = t.slice(1, 4);
    r[1] *= 0.01, r[2] *= 0.01;
    const i = _i(r);
    for (let n = 0; n < 3; n++)
      i[n] = Rs(i[n]);
    return i[3] = +t[4], i;
  }
  if (t = e.match(Es)) {
    const r = t.slice(1, 4);
    r[0] = ut(St(r[0], 0), 0, 100), r[1] = ut(St(r[1], 0), -125, 125, !0), r[2] = ut(St(r[2], 0), -125, 125, !0);
    const i = Hr();
    Kt("d50");
    const n = yr(Di(r));
    Kt(i);
    const o = t[4] !== void 0 ? +ut(t[4], 0, 1) : 1;
    return n[3] = o, n;
  }
  if (t = e.match(Ss)) {
    const r = t.slice(1, 4);
    r[0] = ut(r[0], 0, 100), r[1] = ut(St(r[1], 0), 0, 150, !1), r[2] = +St(r[2].replace("deg", ""), 0);
    const i = Hr();
    Kt("d50");
    const n = yr(ji(r));
    Kt(i);
    const o = t[4] !== void 0 ? +ut(t[4], 0, 1) : 1;
    return n[3] = o, n;
  }
  if (t = e.match(Ts)) {
    const r = t.slice(1, 4);
    r[0] = ut(St(r[0], 0), 0, 1), r[1] = ut(St(r[1], 0), -0.4, 0.4, !0), r[2] = ut(St(r[2], 0), -0.4, 0.4, !0);
    const i = yr(Hi(r)), n = t[4] !== void 0 ? +ut(t[4], 0, 1) : 1;
    return i[3] = n, i;
  }
  if (t = e.match(As)) {
    const r = t.slice(1, 4);
    r[0] = ut(St(r[0], 0), 0, 1), r[1] = ut(St(r[1], 0), 0, 0.4, !1), r[2] = +St(r[2].replace("deg", ""), 0);
    const i = yr(ys(r)), n = t[4] !== void 0 ? +ut(t[4], 0, 1) : 1;
    return i[3] = n, i;
  }
};
Zi.test = (e) => (
  // modern
  gs.test(e) || _s.test(e) || Es.test(e) || Ss.test(e) || Ts.test(e) || As.test(e) || // legacy
  ms.test(e) || bs.test(e) || vs.test(e) || ws.test(e) || e === "transparent"
);
Ee.prototype.css = function(e) {
  return sp(this._rgb, e);
};
const lp = (...e) => new Ee(...e, "css");
ze.css = lp;
Ie.format.css = Zi;
Ie.autodetect.push({
  p: 5,
  test: (e, ...t) => {
    if (!t.length && je(e) === "string" && Zi.test(e))
      return "css";
  }
});
Ie.format.gl = (...e) => {
  const t = Me(e, "rgba");
  return t[0] *= 255, t[1] *= 255, t[2] *= 255, t;
};
const fp = (...e) => new Ee(...e, "gl");
ze.gl = fp;
Ee.prototype.gl = function() {
  const e = this._rgb;
  return [e[0] / 255, e[1] / 255, e[2] / 255, e[3]];
};
Ee.prototype.hex = function(e) {
  return ns(this._rgb, e);
};
const cp = (...e) => new Ee(...e, "hex");
ze.hex = cp;
Ie.format.hex = rs;
Ie.autodetect.push({
  p: 4,
  test: (e, ...t) => {
    if (!t.length && je(e) === "string" && [3, 4, 5, 6, 7, 8, 9].indexOf(e.length) >= 0)
      return "hex";
  }
});
const { log: sn } = Math, xs = (e) => {
  const t = e / 100;
  let r, i, n;
  return t < 66 ? (r = 255, i = t < 6 ? 0 : -155.25485562709179 - 0.44596950469579133 * (i = t - 2) + 104.49216199393888 * sn(i), n = t < 20 ? 0 : -254.76935184120902 + 0.8274096064007395 * (n = t - 10) + 115.67994401066147 * sn(n)) : (r = 351.97690566805693 + 0.114206453784165 * (r = t - 55) - 40.25366309332127 * sn(r), i = 325.4494125711974 + 0.07943456536662342 * (i = t - 50) - 28.0852963507957 * sn(i), n = 255), [r, i, n, 1];
}, { round: up } = Math, dp = (...e) => {
  const t = Me(e, "rgb"), r = t[0], i = t[2];
  let n = 1e3, o = 4e4;
  const a = 0.4;
  let l;
  for (; o - n > a; ) {
    l = (o + n) * 0.5;
    const f = xs(l);
    f[2] / f[0] >= i / r ? o = l : n = l;
  }
  return up(l);
};
Ee.prototype.temp = Ee.prototype.kelvin = Ee.prototype.temperature = function() {
  return dp(this._rgb);
};
const si = (...e) => new Ee(...e, "temp");
Object.assign(ze, { temp: si, kelvin: si, temperature: si });
Ie.format.temp = Ie.format.kelvin = Ie.format.temperature = xs;
Ee.prototype.oklch = function() {
  return ps(this._rgb);
};
const hp = (...e) => new Ee(...e, "oklch");
Object.assign(ze, { oklch: hp });
Ie.format.oklch = ys;
Ie.autodetect.push({
  p: 2,
  test: (...e) => {
    if (e = Me(e, "oklch"), je(e) === "array" && e.length === 3)
      return "oklch";
  }
});
Object.assign(ze, {
  analyze: us,
  average: ph,
  bezier: vh,
  blend: Bt,
  brewer: Jh,
  Color: Ee,
  colors: wr,
  contrast: zh,
  contrastAPCA: Wh,
  cubehelix: Lh,
  deltaE: Vh,
  distance: Kh,
  input: Ie,
  interpolate: Er,
  limits: ds,
  mix: Er,
  random: Fh,
  scale: vn,
  scales: Xh,
  valid: qh
});
function ln(e) {
  throw new Error('Could not dynamically require "' + e + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
}
var li = { exports: {} }, Ko;
function pp() {
  return Ko || (Ko = 1, (function(e, t) {
    (function(r) {
      e.exports = r();
    })(function() {
      return (/* @__PURE__ */ (function() {
        function r(i, n, o) {
          function a(h, s) {
            if (!n[h]) {
              if (!i[h]) {
                var u = typeof ln == "function" && ln;
                if (!s && u) return u(h, !0);
                if (l) return l(h, !0);
                var c = new Error("Cannot find module '" + h + "'");
                throw c.code = "MODULE_NOT_FOUND", c;
              }
              var p = n[h] = { exports: {} };
              i[h][0].call(p.exports, function(m) {
                var d = i[h][1][m];
                return a(d || m);
              }, p, p.exports, r, i, n, o);
            }
            return n[h].exports;
          }
          for (var l = typeof ln == "function" && ln, f = 0; f < o.length; f++) a(o[f]);
          return a;
        }
        return r;
      })())({ 1: [function(r, i, n) {
        (function(o) {
          (function() {
            let a = r("./interlace"), l = [
              // 0 - dummy entry
              function() {
              },
              // 1 - L
              // 0: 0, 1: 0, 2: 0, 3: 0xff
              function(c, p, m, d) {
                if (d === p.length)
                  throw new Error("Ran out of data");
                let _ = p[d];
                c[m] = _, c[m + 1] = _, c[m + 2] = _, c[m + 3] = 255;
              },
              // 2 - LA
              // 0: 0, 1: 0, 2: 0, 3: 1
              function(c, p, m, d) {
                if (d + 1 >= p.length)
                  throw new Error("Ran out of data");
                let _ = p[d];
                c[m] = _, c[m + 1] = _, c[m + 2] = _, c[m + 3] = p[d + 1];
              },
              // 3 - RGB
              // 0: 0, 1: 1, 2: 2, 3: 0xff
              function(c, p, m, d) {
                if (d + 2 >= p.length)
                  throw new Error("Ran out of data");
                c[m] = p[d], c[m + 1] = p[d + 1], c[m + 2] = p[d + 2], c[m + 3] = 255;
              },
              // 4 - RGBA
              // 0: 0, 1: 1, 2: 2, 3: 3
              function(c, p, m, d) {
                if (d + 3 >= p.length)
                  throw new Error("Ran out of data");
                c[m] = p[d], c[m + 1] = p[d + 1], c[m + 2] = p[d + 2], c[m + 3] = p[d + 3];
              }
            ], f = [
              // 0 - dummy entry
              function() {
              },
              // 1 - L
              // 0: 0, 1: 0, 2: 0, 3: 0xff
              function(c, p, m, d) {
                let _ = p[0];
                c[m] = _, c[m + 1] = _, c[m + 2] = _, c[m + 3] = d;
              },
              // 2 - LA
              // 0: 0, 1: 0, 2: 0, 3: 1
              function(c, p, m) {
                let d = p[0];
                c[m] = d, c[m + 1] = d, c[m + 2] = d, c[m + 3] = p[1];
              },
              // 3 - RGB
              // 0: 0, 1: 1, 2: 2, 3: 0xff
              function(c, p, m, d) {
                c[m] = p[0], c[m + 1] = p[1], c[m + 2] = p[2], c[m + 3] = d;
              },
              // 4 - RGBA
              // 0: 0, 1: 1, 2: 2, 3: 3
              function(c, p, m) {
                c[m] = p[0], c[m + 1] = p[1], c[m + 2] = p[2], c[m + 3] = p[3];
              }
            ];
            function h(c, p) {
              let m = [], d = 0;
              function _() {
                if (d === c.length)
                  throw new Error("Ran out of data");
                let v = c[d];
                d++;
                let k, E, T, x, A, I, R, M;
                switch (p) {
                  default:
                    throw new Error("unrecognised depth");
                  case 16:
                    R = c[d], d++, m.push((v << 8) + R);
                    break;
                  case 4:
                    R = v & 15, M = v >> 4, m.push(M, R);
                    break;
                  case 2:
                    A = v & 3, I = v >> 2 & 3, R = v >> 4 & 3, M = v >> 6 & 3, m.push(M, R, I, A);
                    break;
                  case 1:
                    k = v & 1, E = v >> 1 & 1, T = v >> 2 & 1, x = v >> 3 & 1, A = v >> 4 & 1, I = v >> 5 & 1, R = v >> 6 & 1, M = v >> 7 & 1, m.push(M, R, I, A, x, T, E, k);
                    break;
                }
              }
              return {
                get: function(v) {
                  for (; m.length < v; )
                    _();
                  let k = m.slice(0, v);
                  return m = m.slice(v), k;
                },
                resetAfterLine: function() {
                  m.length = 0;
                },
                end: function() {
                  if (d !== c.length)
                    throw new Error("extra data found");
                }
              };
            }
            function s(c, p, m, d, _, v) {
              let k = c.width, E = c.height, T = c.index;
              for (let x = 0; x < E; x++)
                for (let A = 0; A < k; A++) {
                  let I = m(A, x, T);
                  l[d](p, _, I, v), v += d;
                }
              return v;
            }
            function u(c, p, m, d, _, v) {
              let k = c.width, E = c.height, T = c.index;
              for (let x = 0; x < E; x++) {
                for (let A = 0; A < k; A++) {
                  let I = _.get(d), R = m(A, x, T);
                  f[d](p, I, R, v);
                }
                _.resetAfterLine();
              }
            }
            n.dataToBitMap = function(c, p) {
              let m = p.width, d = p.height, _ = p.depth, v = p.bpp, k = p.interlace, E;
              _ !== 8 && (E = h(c, _));
              let T;
              _ <= 8 ? T = o.alloc(m * d * 4) : T = new Uint16Array(m * d * 4);
              let x = Math.pow(2, _) - 1, A = 0, I, R;
              if (k)
                I = a.getImagePasses(m, d), R = a.getInterlaceIterator(m, d);
              else {
                let M = 0;
                R = function() {
                  let b = M;
                  return M += 4, b;
                }, I = [{ width: m, height: d }];
              }
              for (let M = 0; M < I.length; M++)
                _ === 8 ? A = s(
                  I[M],
                  T,
                  R,
                  v,
                  c,
                  A
                ) : u(
                  I[M],
                  T,
                  R,
                  v,
                  E,
                  x
                );
              if (_ === 8) {
                if (A !== c.length)
                  throw new Error("extra data found");
              } else
                E.end();
              return T;
            };
          }).call(this);
        }).call(this, r("buffer").Buffer);
      }, { "./interlace": 11, buffer: 32 }], 2: [function(r, i, n) {
        (function(o) {
          (function() {
            let a = r("./constants");
            i.exports = function(l, f, h, s) {
              let u = [a.COLORTYPE_COLOR_ALPHA, a.COLORTYPE_ALPHA].indexOf(
                s.colorType
              ) !== -1;
              if (s.colorType === s.inputColorType) {
                let x = (function() {
                  let A = new ArrayBuffer(2);
                  return new DataView(A).setInt16(
                    0,
                    256,
                    !0
                    /* littleEndian */
                  ), new Int16Array(A)[0] !== 256;
                })();
                if (s.bitDepth === 8 || s.bitDepth === 16 && x)
                  return l;
              }
              let c = s.bitDepth !== 16 ? l : new Uint16Array(l.buffer), p = 255, m = a.COLORTYPE_TO_BPP_MAP[s.inputColorType];
              m === 4 && !s.inputHasAlpha && (m = 3);
              let d = a.COLORTYPE_TO_BPP_MAP[s.colorType];
              s.bitDepth === 16 && (p = 65535, d *= 2);
              let _ = o.alloc(f * h * d), v = 0, k = 0, E = s.bgColor || {};
              E.red === void 0 && (E.red = p), E.green === void 0 && (E.green = p), E.blue === void 0 && (E.blue = p);
              function T() {
                let x, A, I, R = p;
                switch (s.inputColorType) {
                  case a.COLORTYPE_COLOR_ALPHA:
                    R = c[v + 3], x = c[v], A = c[v + 1], I = c[v + 2];
                    break;
                  case a.COLORTYPE_COLOR:
                    x = c[v], A = c[v + 1], I = c[v + 2];
                    break;
                  case a.COLORTYPE_ALPHA:
                    R = c[v + 1], x = c[v], A = x, I = x;
                    break;
                  case a.COLORTYPE_GRAYSCALE:
                    x = c[v], A = x, I = x;
                    break;
                  default:
                    throw new Error(
                      "input color type:" + s.inputColorType + " is not supported at present"
                    );
                }
                return s.inputHasAlpha && (u || (R /= p, x = Math.min(
                  Math.max(Math.round((1 - R) * E.red + R * x), 0),
                  p
                ), A = Math.min(
                  Math.max(Math.round((1 - R) * E.green + R * A), 0),
                  p
                ), I = Math.min(
                  Math.max(Math.round((1 - R) * E.blue + R * I), 0),
                  p
                ))), { red: x, green: A, blue: I, alpha: R };
              }
              for (let x = 0; x < h; x++)
                for (let A = 0; A < f; A++) {
                  let I = T();
                  switch (s.colorType) {
                    case a.COLORTYPE_COLOR_ALPHA:
                    case a.COLORTYPE_COLOR:
                      s.bitDepth === 8 ? (_[k] = I.red, _[k + 1] = I.green, _[k + 2] = I.blue, u && (_[k + 3] = I.alpha)) : (_.writeUInt16BE(I.red, k), _.writeUInt16BE(I.green, k + 2), _.writeUInt16BE(I.blue, k + 4), u && _.writeUInt16BE(I.alpha, k + 6));
                      break;
                    case a.COLORTYPE_ALPHA:
                    case a.COLORTYPE_GRAYSCALE: {
                      let R = (I.red + I.green + I.blue) / 3;
                      s.bitDepth === 8 ? (_[k] = R, u && (_[k + 1] = I.alpha)) : (_.writeUInt16BE(R, k), u && _.writeUInt16BE(I.alpha, k + 2));
                      break;
                    }
                    default:
                      throw new Error("unrecognised color Type " + s.colorType);
                  }
                  v += m, k += d;
                }
              return _;
            };
          }).call(this);
        }).call(this, r("buffer").Buffer);
      }, { "./constants": 4, buffer: 32 }], 3: [function(r, i, n) {
        (function(o, a) {
          (function() {
            let l = r("util"), f = r("stream"), h = i.exports = function() {
              f.call(this), this._buffers = [], this._buffered = 0, this._reads = [], this._paused = !1, this._encoding = "utf8", this.writable = !0;
            };
            l.inherits(h, f), h.prototype.read = function(s, u) {
              this._reads.push({
                length: Math.abs(s),
                // if length < 0 then at most this length
                allowLess: s < 0,
                func: u
              }), o.nextTick(
                (function() {
                  this._process(), this._paused && this._reads && this._reads.length > 0 && (this._paused = !1, this.emit("drain"));
                }).bind(this)
              );
            }, h.prototype.write = function(s, u) {
              if (!this.writable)
                return this.emit("error", new Error("Stream not writable")), !1;
              let c;
              return a.isBuffer(s) ? c = s : c = a.from(s, u || this._encoding), this._buffers.push(c), this._buffered += c.length, this._process(), this._reads && this._reads.length === 0 && (this._paused = !0), this.writable && !this._paused;
            }, h.prototype.end = function(s, u) {
              s && this.write(s, u), this.writable = !1, this._buffers && (this._buffers.length === 0 ? this._end() : (this._buffers.push(null), this._process()));
            }, h.prototype.destroySoon = h.prototype.end, h.prototype._end = function() {
              this._reads.length > 0 && this.emit("error", new Error("Unexpected end of input")), this.destroy();
            }, h.prototype.destroy = function() {
              this._buffers && (this.writable = !1, this._reads = null, this._buffers = null, this.emit("close"));
            }, h.prototype._processReadAllowingLess = function(s) {
              this._reads.shift();
              let u = this._buffers[0];
              u.length > s.length ? (this._buffered -= s.length, this._buffers[0] = u.slice(s.length), s.func.call(this, u.slice(0, s.length))) : (this._buffered -= u.length, this._buffers.shift(), s.func.call(this, u));
            }, h.prototype._processRead = function(s) {
              this._reads.shift();
              let u = 0, c = 0, p = a.alloc(s.length);
              for (; u < s.length; ) {
                let m = this._buffers[c++], d = Math.min(m.length, s.length - u);
                m.copy(p, u, 0, d), u += d, d !== m.length && (this._buffers[--c] = m.slice(d));
              }
              c > 0 && this._buffers.splice(0, c), this._buffered -= s.length, s.func.call(this, p);
            }, h.prototype._process = function() {
              try {
                for (; this._buffered > 0 && this._reads && this._reads.length > 0; ) {
                  let s = this._reads[0];
                  if (s.allowLess)
                    this._processReadAllowingLess(s);
                  else if (this._buffered >= s.length)
                    this._processRead(s);
                  else
                    break;
                }
                this._buffers && !this.writable && this._end();
              } catch (s) {
                this.emit("error", s);
              }
            };
          }).call(this);
        }).call(this, r("_process"), r("buffer").Buffer);
      }, { _process: 63, buffer: 32, stream: 65, util: 84 }], 4: [function(r, i, n) {
        i.exports = {
          PNG_SIGNATURE: [137, 80, 78, 71, 13, 10, 26, 10],
          TYPE_IHDR: 1229472850,
          TYPE_IEND: 1229278788,
          TYPE_IDAT: 1229209940,
          TYPE_PLTE: 1347179589,
          TYPE_tRNS: 1951551059,
          // eslint-disable-line camelcase
          TYPE_gAMA: 1732332865,
          // eslint-disable-line camelcase
          // color-type bits
          COLORTYPE_GRAYSCALE: 0,
          COLORTYPE_PALETTE: 1,
          COLORTYPE_COLOR: 2,
          COLORTYPE_ALPHA: 4,
          // e.g. grayscale and alpha
          // color-type combinations
          COLORTYPE_PALETTE_COLOR: 3,
          COLORTYPE_COLOR_ALPHA: 6,
          COLORTYPE_TO_BPP_MAP: {
            0: 1,
            2: 3,
            3: 1,
            4: 2,
            6: 4
          },
          GAMMA_DIVISION: 1e5
        };
      }, {}], 5: [function(r, i, n) {
        let o = [];
        (function() {
          for (let l = 0; l < 256; l++) {
            let f = l;
            for (let h = 0; h < 8; h++)
              f & 1 ? f = 3988292384 ^ f >>> 1 : f = f >>> 1;
            o[l] = f;
          }
        })();
        let a = i.exports = function() {
          this._crc = -1;
        };
        a.prototype.write = function(l) {
          for (let f = 0; f < l.length; f++)
            this._crc = o[(this._crc ^ l[f]) & 255] ^ this._crc >>> 8;
          return !0;
        }, a.prototype.crc32 = function() {
          return this._crc ^ -1;
        }, a.crc32 = function(l) {
          let f = -1;
          for (let h = 0; h < l.length; h++)
            f = o[(f ^ l[h]) & 255] ^ f >>> 8;
          return f ^ -1;
        };
      }, {}], 6: [function(r, i, n) {
        (function(o) {
          (function() {
            let a = r("./paeth-predictor");
            function l(E, T, x, A, I) {
              for (let R = 0; R < x; R++)
                A[I + R] = E[T + R];
            }
            function f(E, T, x) {
              let A = 0, I = T + x;
              for (let R = T; R < I; R++)
                A += Math.abs(E[R]);
              return A;
            }
            function h(E, T, x, A, I, R) {
              for (let M = 0; M < x; M++) {
                let b = M >= R ? E[T + M - R] : 0, N = E[T + M] - b;
                A[I + M] = N;
              }
            }
            function s(E, T, x, A) {
              let I = 0;
              for (let R = 0; R < x; R++) {
                let M = R >= A ? E[T + R - A] : 0, b = E[T + R] - M;
                I += Math.abs(b);
              }
              return I;
            }
            function u(E, T, x, A, I) {
              for (let R = 0; R < x; R++) {
                let M = T > 0 ? E[T + R - x] : 0, b = E[T + R] - M;
                A[I + R] = b;
              }
            }
            function c(E, T, x) {
              let A = 0, I = T + x;
              for (let R = T; R < I; R++) {
                let M = T > 0 ? E[R - x] : 0, b = E[R] - M;
                A += Math.abs(b);
              }
              return A;
            }
            function p(E, T, x, A, I, R) {
              for (let M = 0; M < x; M++) {
                let b = M >= R ? E[T + M - R] : 0, N = T > 0 ? E[T + M - x] : 0, j = E[T + M] - (b + N >> 1);
                A[I + M] = j;
              }
            }
            function m(E, T, x, A) {
              let I = 0;
              for (let R = 0; R < x; R++) {
                let M = R >= A ? E[T + R - A] : 0, b = T > 0 ? E[T + R - x] : 0, N = E[T + R] - (M + b >> 1);
                I += Math.abs(N);
              }
              return I;
            }
            function d(E, T, x, A, I, R) {
              for (let M = 0; M < x; M++) {
                let b = M >= R ? E[T + M - R] : 0, N = T > 0 ? E[T + M - x] : 0, j = T > 0 && M >= R ? E[T + M - (x + R)] : 0, $ = E[T + M] - a(b, N, j);
                A[I + M] = $;
              }
            }
            function _(E, T, x, A) {
              let I = 0;
              for (let R = 0; R < x; R++) {
                let M = R >= A ? E[T + R - A] : 0, b = T > 0 ? E[T + R - x] : 0, N = T > 0 && R >= A ? E[T + R - (x + A)] : 0, j = E[T + R] - a(M, b, N);
                I += Math.abs(j);
              }
              return I;
            }
            let v = {
              0: l,
              1: h,
              2: u,
              3: p,
              4: d
            }, k = {
              0: f,
              1: s,
              2: c,
              3: m,
              4: _
            };
            i.exports = function(E, T, x, A, I) {
              let R;
              if (!("filterType" in A) || A.filterType === -1)
                R = [0, 1, 2, 3, 4];
              else if (typeof A.filterType == "number")
                R = [A.filterType];
              else
                throw new Error("unrecognised filter types");
              A.bitDepth === 16 && (I *= 2);
              let M = T * I, b = 0, N = 0, j = o.alloc((M + 1) * x), $ = R[0];
              for (let re = 0; re < x; re++) {
                if (R.length > 1) {
                  let ne = 1 / 0;
                  for (let U = 0; U < R.length; U++) {
                    let P = k[R[U]](E, N, M, I);
                    P < ne && ($ = R[U], ne = P);
                  }
                }
                j[b] = $, b++, v[$](E, N, M, j, b, I), b += M, N += M;
              }
              return j;
            };
          }).call(this);
        }).call(this, r("buffer").Buffer);
      }, { "./paeth-predictor": 15, buffer: 32 }], 7: [function(r, i, n) {
        (function(o) {
          (function() {
            let a = r("util"), l = r("./chunkstream"), f = r("./filter-parse"), h = i.exports = function(s) {
              l.call(this);
              let u = [], c = this;
              this._filter = new f(s, {
                read: this.read.bind(this),
                write: function(p) {
                  u.push(p);
                },
                complete: function() {
                  c.emit("complete", o.concat(u));
                }
              }), this._filter.start();
            };
            a.inherits(h, l);
          }).call(this);
        }).call(this, r("buffer").Buffer);
      }, { "./chunkstream": 3, "./filter-parse": 9, buffer: 32, util: 84 }], 8: [function(r, i, n) {
        (function(o) {
          (function() {
            let a = r("./sync-reader"), l = r("./filter-parse");
            n.process = function(f, h) {
              let s = [], u = new a(f);
              return new l(h, {
                read: u.read.bind(u),
                write: function(p) {
                  s.push(p);
                },
                complete: function() {
                }
              }).start(), u.process(), o.concat(s);
            };
          }).call(this);
        }).call(this, r("buffer").Buffer);
      }, { "./filter-parse": 9, "./sync-reader": 22, buffer: 32 }], 9: [function(r, i, n) {
        (function(o) {
          (function() {
            let a = r("./interlace"), l = r("./paeth-predictor");
            function f(s, u, c) {
              let p = s * u;
              return c !== 8 && (p = Math.ceil(p / (8 / c))), p;
            }
            let h = i.exports = function(s, u) {
              let c = s.width, p = s.height, m = s.interlace, d = s.bpp, _ = s.depth;
              if (this.read = u.read, this.write = u.write, this.complete = u.complete, this._imageIndex = 0, this._images = [], m) {
                let v = a.getImagePasses(c, p);
                for (let k = 0; k < v.length; k++)
                  this._images.push({
                    byteWidth: f(v[k].width, d, _),
                    height: v[k].height,
                    lineIndex: 0
                  });
              } else
                this._images.push({
                  byteWidth: f(c, d, _),
                  height: p,
                  lineIndex: 0
                });
              _ === 8 ? this._xComparison = d : _ === 16 ? this._xComparison = d * 2 : this._xComparison = 1;
            };
            h.prototype.start = function() {
              this.read(
                this._images[this._imageIndex].byteWidth + 1,
                this._reverseFilterLine.bind(this)
              );
            }, h.prototype._unFilterType1 = function(s, u, c) {
              let p = this._xComparison, m = p - 1;
              for (let d = 0; d < c; d++) {
                let _ = s[1 + d], v = d > m ? u[d - p] : 0;
                u[d] = _ + v;
              }
            }, h.prototype._unFilterType2 = function(s, u, c) {
              let p = this._lastLine;
              for (let m = 0; m < c; m++) {
                let d = s[1 + m], _ = p ? p[m] : 0;
                u[m] = d + _;
              }
            }, h.prototype._unFilterType3 = function(s, u, c) {
              let p = this._xComparison, m = p - 1, d = this._lastLine;
              for (let _ = 0; _ < c; _++) {
                let v = s[1 + _], k = d ? d[_] : 0, E = _ > m ? u[_ - p] : 0, T = Math.floor((E + k) / 2);
                u[_] = v + T;
              }
            }, h.prototype._unFilterType4 = function(s, u, c) {
              let p = this._xComparison, m = p - 1, d = this._lastLine;
              for (let _ = 0; _ < c; _++) {
                let v = s[1 + _], k = d ? d[_] : 0, E = _ > m ? u[_ - p] : 0, T = _ > m && d ? d[_ - p] : 0, x = l(E, k, T);
                u[_] = v + x;
              }
            }, h.prototype._reverseFilterLine = function(s) {
              let u = s[0], c, p = this._images[this._imageIndex], m = p.byteWidth;
              if (u === 0)
                c = s.slice(1, m + 1);
              else
                switch (c = o.alloc(m), u) {
                  case 1:
                    this._unFilterType1(s, c, m);
                    break;
                  case 2:
                    this._unFilterType2(s, c, m);
                    break;
                  case 3:
                    this._unFilterType3(s, c, m);
                    break;
                  case 4:
                    this._unFilterType4(s, c, m);
                    break;
                  default:
                    throw new Error("Unrecognised filter type - " + u);
                }
              this.write(c), p.lineIndex++, p.lineIndex >= p.height ? (this._lastLine = null, this._imageIndex++, p = this._images[this._imageIndex]) : this._lastLine = c, p ? this.read(p.byteWidth + 1, this._reverseFilterLine.bind(this)) : (this._lastLine = null, this.complete());
            };
          }).call(this);
        }).call(this, r("buffer").Buffer);
      }, { "./interlace": 11, "./paeth-predictor": 15, buffer: 32 }], 10: [function(r, i, n) {
        (function(o) {
          (function() {
            function a(h, s, u, c, p) {
              let m = 0;
              for (let d = 0; d < c; d++)
                for (let _ = 0; _ < u; _++) {
                  let v = p[h[m]];
                  if (!v)
                    throw new Error("index " + h[m] + " not in palette");
                  for (let k = 0; k < 4; k++)
                    s[m + k] = v[k];
                  m += 4;
                }
            }
            function l(h, s, u, c, p) {
              let m = 0;
              for (let d = 0; d < c; d++)
                for (let _ = 0; _ < u; _++) {
                  let v = !1;
                  if (p.length === 1 ? p[0] === h[m] && (v = !0) : p[0] === h[m] && p[1] === h[m + 1] && p[2] === h[m + 2] && (v = !0), v)
                    for (let k = 0; k < 4; k++)
                      s[m + k] = 0;
                  m += 4;
                }
            }
            function f(h, s, u, c, p) {
              let m = 255, d = Math.pow(2, p) - 1, _ = 0;
              for (let v = 0; v < c; v++)
                for (let k = 0; k < u; k++) {
                  for (let E = 0; E < 4; E++)
                    s[_ + E] = Math.floor(
                      h[_ + E] * m / d + 0.5
                    );
                  _ += 4;
                }
            }
            i.exports = function(h, s, u = !1) {
              let c = s.depth, p = s.width, m = s.height, d = s.colorType, _ = s.transColor, v = s.palette, k = h;
              return d === 3 ? a(h, k, p, m, v) : (_ && l(h, k, p, m, _), c !== 8 && !u && (c === 16 && (k = o.alloc(p * m * 4)), f(h, k, p, m, c))), k;
            };
          }).call(this);
        }).call(this, r("buffer").Buffer);
      }, { buffer: 32 }], 11: [function(r, i, n) {
        let o = [
          {
            // pass 1 - 1px
            x: [0],
            y: [0]
          },
          {
            // pass 2 - 1px
            x: [4],
            y: [0]
          },
          {
            // pass 3 - 2px
            x: [0, 4],
            y: [4]
          },
          {
            // pass 4 - 4px
            x: [2, 6],
            y: [0, 4]
          },
          {
            // pass 5 - 8px
            x: [0, 2, 4, 6],
            y: [2, 6]
          },
          {
            // pass 6 - 16px
            x: [1, 3, 5, 7],
            y: [0, 2, 4, 6]
          },
          {
            // pass 7 - 32px
            x: [0, 1, 2, 3, 4, 5, 6, 7],
            y: [1, 3, 5, 7]
          }
        ];
        n.getImagePasses = function(a, l) {
          let f = [], h = a % 8, s = l % 8, u = (a - h) / 8, c = (l - s) / 8;
          for (let p = 0; p < o.length; p++) {
            let m = o[p], d = u * m.x.length, _ = c * m.y.length;
            for (let v = 0; v < m.x.length && m.x[v] < h; v++)
              d++;
            for (let v = 0; v < m.y.length && m.y[v] < s; v++)
              _++;
            d > 0 && _ > 0 && f.push({ width: d, height: _, index: p });
          }
          return f;
        }, n.getInterlaceIterator = function(a) {
          return function(l, f, h) {
            let s = l % o[h].x.length, u = (l - s) / o[h].x.length * 8 + o[h].x[s], c = f % o[h].y.length, p = (f - c) / o[h].y.length * 8 + o[h].y[c];
            return u * 4 + p * a * 4;
          };
        };
      }, {}], 12: [function(r, i, n) {
        (function(o) {
          (function() {
            let a = r("util"), l = r("stream"), f = r("./constants"), h = r("./packer"), s = i.exports = function(u) {
              l.call(this);
              let c = u || {};
              this._packer = new h(c), this._deflate = this._packer.createDeflate(), this.readable = !0;
            };
            a.inherits(s, l), s.prototype.pack = function(u, c, p, m) {
              this.emit("data", o.from(f.PNG_SIGNATURE)), this.emit("data", this._packer.packIHDR(c, p)), m && this.emit("data", this._packer.packGAMA(m));
              let d = this._packer.filterData(u, c, p);
              this._deflate.on("error", this.emit.bind(this, "error")), this._deflate.on(
                "data",
                (function(_) {
                  this.emit("data", this._packer.packIDAT(_));
                }).bind(this)
              ), this._deflate.on(
                "end",
                (function() {
                  this.emit("data", this._packer.packIEND()), this.emit("end");
                }).bind(this)
              ), this._deflate.end(d);
            };
          }).call(this);
        }).call(this, r("buffer").Buffer);
      }, { "./constants": 4, "./packer": 14, buffer: 32, stream: 65, util: 84 }], 13: [function(r, i, n) {
        (function(o) {
          (function() {
            let a = !0, l = r("zlib");
            l.deflateSync || (a = !1);
            let f = r("./constants"), h = r("./packer");
            i.exports = function(s, u) {
              if (!a)
                throw new Error(
                  "To use the sync capability of this library in old node versions, please pin pngjs to v2.3.0"
                );
              let c = u || {}, p = new h(c), m = [];
              m.push(o.from(f.PNG_SIGNATURE)), m.push(p.packIHDR(s.width, s.height)), s.gamma && m.push(p.packGAMA(s.gamma));
              let d = p.filterData(
                s.data,
                s.width,
                s.height
              ), _ = l.deflateSync(
                d,
                p.getDeflateOptions()
              );
              if (d = null, !_ || !_.length)
                throw new Error("bad png - invalid compressed data response");
              return m.push(p.packIDAT(_)), m.push(p.packIEND()), o.concat(m);
            };
          }).call(this);
        }).call(this, r("buffer").Buffer);
      }, { "./constants": 4, "./packer": 14, buffer: 32, zlib: 31 }], 14: [function(r, i, n) {
        (function(o) {
          (function() {
            let a = r("./constants"), l = r("./crc"), f = r("./bitpacker"), h = r("./filter-pack"), s = r("zlib"), u = i.exports = function(c) {
              if (this._options = c, c.deflateChunkSize = c.deflateChunkSize || 32 * 1024, c.deflateLevel = c.deflateLevel != null ? c.deflateLevel : 9, c.deflateStrategy = c.deflateStrategy != null ? c.deflateStrategy : 3, c.inputHasAlpha = c.inputHasAlpha != null ? c.inputHasAlpha : !0, c.deflateFactory = c.deflateFactory || s.createDeflate, c.bitDepth = c.bitDepth || 8, c.colorType = typeof c.colorType == "number" ? c.colorType : a.COLORTYPE_COLOR_ALPHA, c.inputColorType = typeof c.inputColorType == "number" ? c.inputColorType : a.COLORTYPE_COLOR_ALPHA, [
                a.COLORTYPE_GRAYSCALE,
                a.COLORTYPE_COLOR,
                a.COLORTYPE_COLOR_ALPHA,
                a.COLORTYPE_ALPHA
              ].indexOf(c.colorType) === -1)
                throw new Error(
                  "option color type:" + c.colorType + " is not supported at present"
                );
              if ([
                a.COLORTYPE_GRAYSCALE,
                a.COLORTYPE_COLOR,
                a.COLORTYPE_COLOR_ALPHA,
                a.COLORTYPE_ALPHA
              ].indexOf(c.inputColorType) === -1)
                throw new Error(
                  "option input color type:" + c.inputColorType + " is not supported at present"
                );
              if (c.bitDepth !== 8 && c.bitDepth !== 16)
                throw new Error(
                  "option bit depth:" + c.bitDepth + " is not supported at present"
                );
            };
            u.prototype.getDeflateOptions = function() {
              return {
                chunkSize: this._options.deflateChunkSize,
                level: this._options.deflateLevel,
                strategy: this._options.deflateStrategy
              };
            }, u.prototype.createDeflate = function() {
              return this._options.deflateFactory(this.getDeflateOptions());
            }, u.prototype.filterData = function(c, p, m) {
              let d = f(c, p, m, this._options), _ = a.COLORTYPE_TO_BPP_MAP[this._options.colorType];
              return h(d, p, m, this._options, _);
            }, u.prototype._packChunk = function(c, p) {
              let m = p ? p.length : 0, d = o.alloc(m + 12);
              return d.writeUInt32BE(m, 0), d.writeUInt32BE(c, 4), p && p.copy(d, 8), d.writeInt32BE(
                l.crc32(d.slice(4, d.length - 4)),
                d.length - 4
              ), d;
            }, u.prototype.packGAMA = function(c) {
              let p = o.alloc(4);
              return p.writeUInt32BE(Math.floor(c * a.GAMMA_DIVISION), 0), this._packChunk(a.TYPE_gAMA, p);
            }, u.prototype.packIHDR = function(c, p) {
              let m = o.alloc(13);
              return m.writeUInt32BE(c, 0), m.writeUInt32BE(p, 4), m[8] = this._options.bitDepth, m[9] = this._options.colorType, m[10] = 0, m[11] = 0, m[12] = 0, this._packChunk(a.TYPE_IHDR, m);
            }, u.prototype.packIDAT = function(c) {
              return this._packChunk(a.TYPE_IDAT, c);
            }, u.prototype.packIEND = function() {
              return this._packChunk(a.TYPE_IEND, null);
            };
          }).call(this);
        }).call(this, r("buffer").Buffer);
      }, { "./bitpacker": 2, "./constants": 4, "./crc": 5, "./filter-pack": 6, buffer: 32, zlib: 31 }], 15: [function(r, i, n) {
        i.exports = function(a, l, f) {
          let h = a + l - f, s = Math.abs(h - a), u = Math.abs(h - l), c = Math.abs(h - f);
          return s <= u && s <= c ? a : u <= c ? l : f;
        };
      }, {}], 16: [function(r, i, n) {
        let o = r("util"), a = r("zlib"), l = r("./chunkstream"), f = r("./filter-parse-async"), h = r("./parser"), s = r("./bitmapper"), u = r("./format-normaliser"), c = i.exports = function(p) {
          l.call(this), this._parser = new h(p, {
            read: this.read.bind(this),
            error: this._handleError.bind(this),
            metadata: this._handleMetaData.bind(this),
            gamma: this.emit.bind(this, "gamma"),
            palette: this._handlePalette.bind(this),
            transColor: this._handleTransColor.bind(this),
            finished: this._finished.bind(this),
            inflateData: this._inflateData.bind(this),
            simpleTransparency: this._simpleTransparency.bind(this),
            headersFinished: this._headersFinished.bind(this)
          }), this._options = p, this.writable = !0, this._parser.start();
        };
        o.inherits(c, l), c.prototype._handleError = function(p) {
          this.emit("error", p), this.writable = !1, this.destroy(), this._inflate && this._inflate.destroy && this._inflate.destroy(), this._filter && (this._filter.destroy(), this._filter.on("error", function() {
          })), this.errord = !0;
        }, c.prototype._inflateData = function(p) {
          if (!this._inflate)
            if (this._bitmapInfo.interlace)
              this._inflate = a.createInflate(), this._inflate.on("error", this.emit.bind(this, "error")), this._filter.on("complete", this._complete.bind(this)), this._inflate.pipe(this._filter);
            else {
              let d = ((this._bitmapInfo.width * this._bitmapInfo.bpp * this._bitmapInfo.depth + 7 >> 3) + 1) * this._bitmapInfo.height, _ = Math.max(d, a.Z_MIN_CHUNK);
              this._inflate = a.createInflate({ chunkSize: _ });
              let v = d, k = this.emit.bind(this, "error");
              this._inflate.on("error", function(T) {
                v && k(T);
              }), this._filter.on("complete", this._complete.bind(this));
              let E = this._filter.write.bind(this._filter);
              this._inflate.on("data", function(T) {
                v && (T.length > v && (T = T.slice(0, v)), v -= T.length, E(T));
              }), this._inflate.on("end", this._filter.end.bind(this._filter));
            }
          this._inflate.write(p);
        }, c.prototype._handleMetaData = function(p) {
          this._metaData = p, this._bitmapInfo = Object.create(p), this._filter = new f(this._bitmapInfo);
        }, c.prototype._handleTransColor = function(p) {
          this._bitmapInfo.transColor = p;
        }, c.prototype._handlePalette = function(p) {
          this._bitmapInfo.palette = p;
        }, c.prototype._simpleTransparency = function() {
          this._metaData.alpha = !0;
        }, c.prototype._headersFinished = function() {
          this.emit("metadata", this._metaData);
        }, c.prototype._finished = function() {
          this.errord || (this._inflate ? this._inflate.end() : this.emit("error", "No Inflate block"));
        }, c.prototype._complete = function(p) {
          if (this.errord)
            return;
          let m;
          try {
            let d = s.dataToBitMap(p, this._bitmapInfo);
            m = u(
              d,
              this._bitmapInfo,
              this._options.skipRescale
            ), d = null;
          } catch (d) {
            this._handleError(d);
            return;
          }
          this.emit("parsed", m);
        };
      }, { "./bitmapper": 1, "./chunkstream": 3, "./filter-parse-async": 7, "./format-normaliser": 10, "./parser": 18, util: 84, zlib: 31 }], 17: [function(r, i, n) {
        (function(o) {
          (function() {
            let a = !0, l = r("zlib"), f = r("./sync-inflate");
            l.deflateSync || (a = !1);
            let h = r("./sync-reader"), s = r("./filter-parse-sync"), u = r("./parser"), c = r("./bitmapper"), p = r("./format-normaliser");
            i.exports = function(m, d) {
              if (!a)
                throw new Error(
                  "To use the sync capability of this library in old node versions, please pin pngjs to v2.3.0"
                );
              let _;
              function v(D) {
                _ = D;
              }
              let k;
              function E(D) {
                k = D;
              }
              function T(D) {
                k.transColor = D;
              }
              function x(D) {
                k.palette = D;
              }
              function A() {
                k.alpha = !0;
              }
              let I;
              function R(D) {
                I = D;
              }
              let M = [];
              function b(D) {
                M.push(D);
              }
              let N = new h(m);
              if (new u(d, {
                read: N.read.bind(N),
                error: v,
                metadata: E,
                gamma: R,
                palette: x,
                transColor: T,
                inflateData: b,
                simpleTransparency: A
              }).start(), N.process(), _)
                throw _;
              let $ = o.concat(M);
              M.length = 0;
              let re;
              if (k.interlace)
                re = l.inflateSync($);
              else {
                let Q = ((k.width * k.bpp * k.depth + 7 >> 3) + 1) * k.height;
                re = f($, {
                  chunkSize: Q,
                  maxLength: Q
                });
              }
              if ($ = null, !re || !re.length)
                throw new Error("bad png - invalid inflate data response");
              let ne = s.process(re, k);
              $ = null;
              let U = c.dataToBitMap(ne, k);
              ne = null;
              let P = p(
                U,
                k,
                d.skipRescale
              );
              return k.data = P, k.gamma = I || 0, k;
            };
          }).call(this);
        }).call(this, r("buffer").Buffer);
      }, { "./bitmapper": 1, "./filter-parse-sync": 8, "./format-normaliser": 10, "./parser": 18, "./sync-inflate": 21, "./sync-reader": 22, buffer: 32, zlib: 31 }], 18: [function(r, i, n) {
        (function(o) {
          (function() {
            let a = r("./constants"), l = r("./crc"), f = i.exports = function(h, s) {
              this._options = h, h.checkCRC = h.checkCRC !== !1, this._hasIHDR = !1, this._hasIEND = !1, this._emittedHeadersFinished = !1, this._palette = [], this._colorType = 0, this._chunks = {}, this._chunks[a.TYPE_IHDR] = this._handleIHDR.bind(this), this._chunks[a.TYPE_IEND] = this._handleIEND.bind(this), this._chunks[a.TYPE_IDAT] = this._handleIDAT.bind(this), this._chunks[a.TYPE_PLTE] = this._handlePLTE.bind(this), this._chunks[a.TYPE_tRNS] = this._handleTRNS.bind(this), this._chunks[a.TYPE_gAMA] = this._handleGAMA.bind(this), this.read = s.read, this.error = s.error, this.metadata = s.metadata, this.gamma = s.gamma, this.transColor = s.transColor, this.palette = s.palette, this.parsed = s.parsed, this.inflateData = s.inflateData, this.finished = s.finished, this.simpleTransparency = s.simpleTransparency, this.headersFinished = s.headersFinished || function() {
              };
            };
            f.prototype.start = function() {
              this.read(a.PNG_SIGNATURE.length, this._parseSignature.bind(this));
            }, f.prototype._parseSignature = function(h) {
              let s = a.PNG_SIGNATURE;
              for (let u = 0; u < s.length; u++)
                if (h[u] !== s[u]) {
                  this.error(new Error("Invalid file signature"));
                  return;
                }
              this.read(8, this._parseChunkBegin.bind(this));
            }, f.prototype._parseChunkBegin = function(h) {
              let s = h.readUInt32BE(0), u = h.readUInt32BE(4), c = "";
              for (let m = 4; m < 8; m++)
                c += String.fromCharCode(h[m]);
              let p = !!(h[4] & 32);
              if (!this._hasIHDR && u !== a.TYPE_IHDR) {
                this.error(new Error("Expected IHDR on beggining"));
                return;
              }
              if (this._crc = new l(), this._crc.write(o.from(c)), this._chunks[u])
                return this._chunks[u](s);
              if (!p) {
                this.error(new Error("Unsupported critical chunk type " + c));
                return;
              }
              this.read(s + 4, this._skipChunk.bind(this));
            }, f.prototype._skipChunk = function() {
              this.read(8, this._parseChunkBegin.bind(this));
            }, f.prototype._handleChunkEnd = function() {
              this.read(4, this._parseChunkEnd.bind(this));
            }, f.prototype._parseChunkEnd = function(h) {
              let s = h.readInt32BE(0), u = this._crc.crc32();
              if (this._options.checkCRC && u !== s) {
                this.error(new Error("Crc error - " + s + " - " + u));
                return;
              }
              this._hasIEND || this.read(8, this._parseChunkBegin.bind(this));
            }, f.prototype._handleIHDR = function(h) {
              this.read(h, this._parseIHDR.bind(this));
            }, f.prototype._parseIHDR = function(h) {
              this._crc.write(h);
              let s = h.readUInt32BE(0), u = h.readUInt32BE(4), c = h[8], p = h[9], m = h[10], d = h[11], _ = h[12];
              if (c !== 8 && c !== 4 && c !== 2 && c !== 1 && c !== 16) {
                this.error(new Error("Unsupported bit depth " + c));
                return;
              }
              if (!(p in a.COLORTYPE_TO_BPP_MAP)) {
                this.error(new Error("Unsupported color type"));
                return;
              }
              if (m !== 0) {
                this.error(new Error("Unsupported compression method"));
                return;
              }
              if (d !== 0) {
                this.error(new Error("Unsupported filter method"));
                return;
              }
              if (_ !== 0 && _ !== 1) {
                this.error(new Error("Unsupported interlace method"));
                return;
              }
              this._colorType = p;
              let v = a.COLORTYPE_TO_BPP_MAP[this._colorType];
              this._hasIHDR = !0, this.metadata({
                width: s,
                height: u,
                depth: c,
                interlace: !!_,
                palette: !!(p & a.COLORTYPE_PALETTE),
                color: !!(p & a.COLORTYPE_COLOR),
                alpha: !!(p & a.COLORTYPE_ALPHA),
                bpp: v,
                colorType: p
              }), this._handleChunkEnd();
            }, f.prototype._handlePLTE = function(h) {
              this.read(h, this._parsePLTE.bind(this));
            }, f.prototype._parsePLTE = function(h) {
              this._crc.write(h);
              let s = Math.floor(h.length / 3);
              for (let u = 0; u < s; u++)
                this._palette.push([h[u * 3], h[u * 3 + 1], h[u * 3 + 2], 255]);
              this.palette(this._palette), this._handleChunkEnd();
            }, f.prototype._handleTRNS = function(h) {
              this.simpleTransparency(), this.read(h, this._parseTRNS.bind(this));
            }, f.prototype._parseTRNS = function(h) {
              if (this._crc.write(h), this._colorType === a.COLORTYPE_PALETTE_COLOR) {
                if (this._palette.length === 0) {
                  this.error(new Error("Transparency chunk must be after palette"));
                  return;
                }
                if (h.length > this._palette.length) {
                  this.error(new Error("More transparent colors than palette size"));
                  return;
                }
                for (let s = 0; s < h.length; s++)
                  this._palette[s][3] = h[s];
                this.palette(this._palette);
              }
              this._colorType === a.COLORTYPE_GRAYSCALE && this.transColor([h.readUInt16BE(0)]), this._colorType === a.COLORTYPE_COLOR && this.transColor([
                h.readUInt16BE(0),
                h.readUInt16BE(2),
                h.readUInt16BE(4)
              ]), this._handleChunkEnd();
            }, f.prototype._handleGAMA = function(h) {
              this.read(h, this._parseGAMA.bind(this));
            }, f.prototype._parseGAMA = function(h) {
              this._crc.write(h), this.gamma(h.readUInt32BE(0) / a.GAMMA_DIVISION), this._handleChunkEnd();
            }, f.prototype._handleIDAT = function(h) {
              this._emittedHeadersFinished || (this._emittedHeadersFinished = !0, this.headersFinished()), this.read(-h, this._parseIDAT.bind(this, h));
            }, f.prototype._parseIDAT = function(h, s) {
              if (this._crc.write(s), this._colorType === a.COLORTYPE_PALETTE_COLOR && this._palette.length === 0)
                throw new Error("Expected palette not found");
              this.inflateData(s);
              let u = h - s.length;
              u > 0 ? this._handleIDAT(u) : this._handleChunkEnd();
            }, f.prototype._handleIEND = function(h) {
              this.read(h, this._parseIEND.bind(this));
            }, f.prototype._parseIEND = function(h) {
              this._crc.write(h), this._hasIEND = !0, this._handleChunkEnd(), this.finished && this.finished();
            };
          }).call(this);
        }).call(this, r("buffer").Buffer);
      }, { "./constants": 4, "./crc": 5, buffer: 32 }], 19: [function(r, i, n) {
        let o = r("./parser-sync"), a = r("./packer-sync");
        n.read = function(l, f) {
          return o(l, f || {});
        }, n.write = function(l, f) {
          return a(l, f);
        };
      }, { "./packer-sync": 13, "./parser-sync": 17 }], 20: [function(r, i, n) {
        (function(o, a) {
          (function() {
            let l = r("util"), f = r("stream"), h = r("./parser-async"), s = r("./packer-async"), u = r("./png-sync"), c = n.PNG = function(p) {
              f.call(this), p = p || {}, this.width = p.width | 0, this.height = p.height | 0, this.data = this.width > 0 && this.height > 0 ? a.alloc(4 * this.width * this.height) : null, p.fill && this.data && this.data.fill(0), this.gamma = 0, this.readable = this.writable = !0, this._parser = new h(p), this._parser.on("error", this.emit.bind(this, "error")), this._parser.on("close", this._handleClose.bind(this)), this._parser.on("metadata", this._metadata.bind(this)), this._parser.on("gamma", this._gamma.bind(this)), this._parser.on(
                "parsed",
                (function(m) {
                  this.data = m, this.emit("parsed", m);
                }).bind(this)
              ), this._packer = new s(p), this._packer.on("data", this.emit.bind(this, "data")), this._packer.on("end", this.emit.bind(this, "end")), this._parser.on("close", this._handleClose.bind(this)), this._packer.on("error", this.emit.bind(this, "error"));
            };
            l.inherits(c, f), c.sync = u, c.prototype.pack = function() {
              return !this.data || !this.data.length ? (this.emit("error", "No data provided"), this) : (o.nextTick(
                (function() {
                  this._packer.pack(this.data, this.width, this.height, this.gamma);
                }).bind(this)
              ), this);
            }, c.prototype.parse = function(p, m) {
              if (m) {
                let d, _;
                d = (function(v) {
                  this.removeListener("error", _), this.data = v, m(null, this);
                }).bind(this), _ = (function(v) {
                  this.removeListener("parsed", d), m(v, null);
                }).bind(this), this.once("parsed", d), this.once("error", _);
              }
              return this.end(p), this;
            }, c.prototype.write = function(p) {
              return this._parser.write(p), !0;
            }, c.prototype.end = function(p) {
              this._parser.end(p);
            }, c.prototype._metadata = function(p) {
              this.width = p.width, this.height = p.height, this.emit("metadata", p);
            }, c.prototype._gamma = function(p) {
              this.gamma = p;
            }, c.prototype._handleClose = function() {
              !this._parser.writable && !this._packer.readable && this.emit("close");
            }, c.bitblt = function(p, m, d, _, v, k, E, T) {
              if (d |= 0, _ |= 0, v |= 0, k |= 0, E |= 0, T |= 0, d > p.width || _ > p.height || d + v > p.width || _ + k > p.height)
                throw new Error("bitblt reading outside image");
              if (E > m.width || T > m.height || E + v > m.width || T + k > m.height)
                throw new Error("bitblt writing outside image");
              for (let x = 0; x < k; x++)
                p.data.copy(
                  m.data,
                  (T + x) * m.width + E << 2,
                  (_ + x) * p.width + d << 2,
                  (_ + x) * p.width + d + v << 2
                );
            }, c.prototype.bitblt = function(p, m, d, _, v, k, E) {
              return c.bitblt(this, p, m, d, _, v, k, E), this;
            }, c.adjustGamma = function(p) {
              if (p.gamma) {
                for (let m = 0; m < p.height; m++)
                  for (let d = 0; d < p.width; d++) {
                    let _ = p.width * m + d << 2;
                    for (let v = 0; v < 3; v++) {
                      let k = p.data[_ + v] / 255;
                      k = Math.pow(k, 1 / 2.2 / p.gamma), p.data[_ + v] = Math.round(k * 255);
                    }
                  }
                p.gamma = 0;
              }
            }, c.prototype.adjustGamma = function() {
              c.adjustGamma(this);
            };
          }).call(this);
        }).call(this, r("_process"), r("buffer").Buffer);
      }, { "./packer-async": 12, "./parser-async": 16, "./png-sync": 19, _process: 63, buffer: 32, stream: 65, util: 84 }], 21: [function(r, i, n) {
        (function(o, a) {
          (function() {
            let l = r("assert").ok, f = r("zlib"), h = r("util"), s = r("buffer").kMaxLength;
            function u(_) {
              if (!(this instanceof u))
                return new u(_);
              _ && _.chunkSize < f.Z_MIN_CHUNK && (_.chunkSize = f.Z_MIN_CHUNK), f.Inflate.call(this, _), this._offset = this._offset === void 0 ? this._outOffset : this._offset, this._buffer = this._buffer || this._outBuffer, _ && _.maxLength != null && (this._maxLength = _.maxLength);
            }
            function c(_) {
              return new u(_);
            }
            function p(_, v) {
              _._handle && (_._handle.close(), _._handle = null);
            }
            u.prototype._processChunk = function(_, v, k) {
              if (typeof k == "function")
                return f.Inflate._processChunk.call(this, _, v, k);
              let E = this, T = _ && _.length, x = this._chunkSize - this._offset, A = this._maxLength, I = 0, R = [], M = 0, b;
              this.on("error", function(re) {
                b = re;
              });
              function N(re, ne) {
                if (E._hadError)
                  return;
                let U = x - ne;
                if (l(U >= 0, "have should not go down"), U > 0) {
                  let P = E._buffer.slice(E._offset, E._offset + U);
                  if (E._offset += U, P.length > A && (P = P.slice(0, A)), R.push(P), M += P.length, A -= P.length, A === 0)
                    return !1;
                }
                return (ne === 0 || E._offset >= E._chunkSize) && (x = E._chunkSize, E._offset = 0, E._buffer = a.allocUnsafe(E._chunkSize)), ne === 0 ? (I += T - re, T = re, !0) : !1;
              }
              l(this._handle, "zlib binding closed");
              let j;
              do
                j = this._handle.writeSync(
                  v,
                  _,
                  // in
                  I,
                  // in_off
                  T,
                  // in_len
                  this._buffer,
                  // out
                  this._offset,
                  //out_off
                  x
                ), j = j || this._writeState;
              while (!this._hadError && N(j[0], j[1]));
              if (this._hadError)
                throw b;
              if (M >= s)
                throw p(this), new RangeError(
                  "Cannot create final Buffer. It would be larger than 0x" + s.toString(16) + " bytes"
                );
              let $ = a.concat(R, M);
              return p(this), $;
            }, h.inherits(u, f.Inflate);
            function m(_, v) {
              if (typeof v == "string" && (v = a.from(v)), !(v instanceof a))
                throw new TypeError("Not a string or buffer");
              let k = _._finishFlushFlag;
              return k == null && (k = f.Z_FINISH), _._processChunk(v, k);
            }
            function d(_, v) {
              return m(new u(v), _);
            }
            i.exports = n = d, n.Inflate = u, n.createInflate = c, n.inflateSync = d;
          }).call(this);
        }).call(this, r("_process"), r("buffer").Buffer);
      }, { _process: 63, assert: 23, buffer: 32, util: 84, zlib: 31 }], 22: [function(r, i, n) {
        let o = i.exports = function(a) {
          this._buffer = a, this._reads = [];
        };
        o.prototype.read = function(a, l) {
          this._reads.push({
            length: Math.abs(a),
            // if length < 0 then at most this length
            allowLess: a < 0,
            func: l
          });
        }, o.prototype.process = function() {
          for (; this._reads.length > 0 && this._buffer.length; ) {
            let a = this._reads[0];
            if (this._buffer.length && (this._buffer.length >= a.length || a.allowLess)) {
              this._reads.shift();
              let l = this._buffer;
              this._buffer = l.slice(a.length), a.func.call(this, l.slice(0, a.length));
            } else
              break;
          }
          if (this._reads.length > 0)
            throw new Error("There are some read requests waitng on finished stream");
          if (this._buffer.length > 0)
            throw new Error("unrecognised content at end of stream");
        };
      }, {}], 23: [function(r, i, n) {
        (function(o) {
          (function() {
            var a = r("object-assign");
            /*!
             * The buffer module from node.js, for the browser.
             *
             * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
             * @license  MIT
             */
            function l(U, P) {
              if (U === P)
                return 0;
              for (var D = U.length, Q = P.length, W = 0, oe = Math.min(D, Q); W < oe; ++W)
                if (U[W] !== P[W]) {
                  D = U[W], Q = P[W];
                  break;
                }
              return D < Q ? -1 : Q < D ? 1 : 0;
            }
            function f(U) {
              return o.Buffer && typeof o.Buffer.isBuffer == "function" ? o.Buffer.isBuffer(U) : !!(U != null && U._isBuffer);
            }
            var h = r("util/"), s = Object.prototype.hasOwnProperty, u = Array.prototype.slice, c = (function() {
              return (function() {
              }).name === "foo";
            })();
            function p(U) {
              return Object.prototype.toString.call(U);
            }
            function m(U) {
              return f(U) || typeof o.ArrayBuffer != "function" ? !1 : typeof ArrayBuffer.isView == "function" ? ArrayBuffer.isView(U) : U ? !!(U instanceof DataView || U.buffer && U.buffer instanceof ArrayBuffer) : !1;
            }
            var d = i.exports = A, _ = /\s*function\s+([^\(\s]*)\s*/;
            function v(U) {
              if (h.isFunction(U)) {
                if (c)
                  return U.name;
                var P = U.toString(), D = P.match(_);
                return D && D[1];
              }
            }
            d.AssertionError = function(P) {
              this.name = "AssertionError", this.actual = P.actual, this.expected = P.expected, this.operator = P.operator, P.message ? (this.message = P.message, this.generatedMessage = !1) : (this.message = T(this), this.generatedMessage = !0);
              var D = P.stackStartFunction || x;
              if (Error.captureStackTrace)
                Error.captureStackTrace(this, D);
              else {
                var Q = new Error();
                if (Q.stack) {
                  var W = Q.stack, oe = v(D), ae = W.indexOf(`
` + oe);
                  if (ae >= 0) {
                    var H = W.indexOf(`
`, ae + 1);
                    W = W.substring(H + 1);
                  }
                  this.stack = W;
                }
              }
            }, h.inherits(d.AssertionError, Error);
            function k(U, P) {
              return typeof U == "string" ? U.length < P ? U : U.slice(0, P) : U;
            }
            function E(U) {
              if (c || !h.isFunction(U))
                return h.inspect(U);
              var P = v(U), D = P ? ": " + P : "";
              return "[Function" + D + "]";
            }
            function T(U) {
              return k(E(U.actual), 128) + " " + U.operator + " " + k(E(U.expected), 128);
            }
            function x(U, P, D, Q, W) {
              throw new d.AssertionError({
                message: D,
                actual: U,
                expected: P,
                operator: Q,
                stackStartFunction: W
              });
            }
            d.fail = x;
            function A(U, P) {
              U || x(U, !0, P, "==", d.ok);
            }
            d.ok = A, d.equal = function(P, D, Q) {
              P != D && x(P, D, Q, "==", d.equal);
            }, d.notEqual = function(P, D, Q) {
              P == D && x(P, D, Q, "!=", d.notEqual);
            }, d.deepEqual = function(P, D, Q) {
              I(P, D, !1) || x(P, D, Q, "deepEqual", d.deepEqual);
            }, d.deepStrictEqual = function(P, D, Q) {
              I(P, D, !0) || x(P, D, Q, "deepStrictEqual", d.deepStrictEqual);
            };
            function I(U, P, D, Q) {
              if (U === P)
                return !0;
              if (f(U) && f(P))
                return l(U, P) === 0;
              if (h.isDate(U) && h.isDate(P))
                return U.getTime() === P.getTime();
              if (h.isRegExp(U) && h.isRegExp(P))
                return U.source === P.source && U.global === P.global && U.multiline === P.multiline && U.lastIndex === P.lastIndex && U.ignoreCase === P.ignoreCase;
              if ((U === null || typeof U != "object") && (P === null || typeof P != "object"))
                return D ? U === P : U == P;
              if (m(U) && m(P) && p(U) === p(P) && !(U instanceof Float32Array || U instanceof Float64Array))
                return l(
                  new Uint8Array(U.buffer),
                  new Uint8Array(P.buffer)
                ) === 0;
              if (f(U) !== f(P))
                return !1;
              Q = Q || { actual: [], expected: [] };
              var W = Q.actual.indexOf(U);
              return W !== -1 && W === Q.expected.indexOf(P) ? !0 : (Q.actual.push(U), Q.expected.push(P), M(U, P, D, Q));
            }
            function R(U) {
              return Object.prototype.toString.call(U) == "[object Arguments]";
            }
            function M(U, P, D, Q) {
              if (U == null || P === null || P === void 0)
                return !1;
              if (h.isPrimitive(U) || h.isPrimitive(P))
                return U === P;
              if (D && Object.getPrototypeOf(U) !== Object.getPrototypeOf(P))
                return !1;
              var W = R(U), oe = R(P);
              if (W && !oe || !W && oe)
                return !1;
              if (W)
                return U = u.call(U), P = u.call(P), I(U, P, D);
              var ae = ne(U), H = ne(P), X, ie;
              if (ae.length !== H.length)
                return !1;
              for (ae.sort(), H.sort(), ie = ae.length - 1; ie >= 0; ie--)
                if (ae[ie] !== H[ie])
                  return !1;
              for (ie = ae.length - 1; ie >= 0; ie--)
                if (X = ae[ie], !I(U[X], P[X], D, Q))
                  return !1;
              return !0;
            }
            d.notDeepEqual = function(P, D, Q) {
              I(P, D, !1) && x(P, D, Q, "notDeepEqual", d.notDeepEqual);
            }, d.notDeepStrictEqual = b;
            function b(U, P, D) {
              I(U, P, !0) && x(U, P, D, "notDeepStrictEqual", b);
            }
            d.strictEqual = function(P, D, Q) {
              P !== D && x(P, D, Q, "===", d.strictEqual);
            }, d.notStrictEqual = function(P, D, Q) {
              P === D && x(P, D, Q, "!==", d.notStrictEqual);
            };
            function N(U, P) {
              if (!U || !P)
                return !1;
              if (Object.prototype.toString.call(P) == "[object RegExp]")
                return P.test(U);
              try {
                if (U instanceof P)
                  return !0;
              } catch {
              }
              return Error.isPrototypeOf(P) ? !1 : P.call({}, U) === !0;
            }
            function j(U) {
              var P;
              try {
                U();
              } catch (D) {
                P = D;
              }
              return P;
            }
            function $(U, P, D, Q) {
              var W;
              if (typeof P != "function")
                throw new TypeError('"block" argument must be a function');
              typeof D == "string" && (Q = D, D = null), W = j(P), Q = (D && D.name ? " (" + D.name + ")." : ".") + (Q ? " " + Q : "."), U && !W && x(W, D, "Missing expected exception" + Q);
              var oe = typeof Q == "string", ae = !U && h.isError(W), H = !U && W && !D;
              if ((ae && oe && N(W, D) || H) && x(W, D, "Got unwanted exception" + Q), U && W && D && !N(W, D) || !U && W)
                throw W;
            }
            d.throws = function(U, P, D) {
              $(!0, U, P, D);
            }, d.doesNotThrow = function(U, P, D) {
              $(!1, U, P, D);
            }, d.ifError = function(U) {
              if (U) throw U;
            };
            function re(U, P) {
              U || x(U, !0, P, "==", re);
            }
            d.strict = a(re, d, {
              equal: d.strictEqual,
              deepEqual: d.deepStrictEqual,
              notEqual: d.notStrictEqual,
              notDeepEqual: d.notDeepStrictEqual
            }), d.strict.strict = d.strict;
            var ne = Object.keys || function(U) {
              var P = [];
              for (var D in U)
                s.call(U, D) && P.push(D);
              return P;
            };
          }).call(this);
        }).call(this, typeof mt < "u" ? mt : typeof self < "u" ? self : typeof window < "u" ? window : {});
      }, { "object-assign": 51, "util/": 26 }], 24: [function(r, i, n) {
        typeof Object.create == "function" ? i.exports = function(a, l) {
          a.super_ = l, a.prototype = Object.create(l.prototype, {
            constructor: {
              value: a,
              enumerable: !1,
              writable: !0,
              configurable: !0
            }
          });
        } : i.exports = function(a, l) {
          a.super_ = l;
          var f = function() {
          };
          f.prototype = l.prototype, a.prototype = new f(), a.prototype.constructor = a;
        };
      }, {}], 25: [function(r, i, n) {
        i.exports = function(a) {
          return a && typeof a == "object" && typeof a.copy == "function" && typeof a.fill == "function" && typeof a.readUInt8 == "function";
        };
      }, {}], 26: [function(r, i, n) {
        (function(o, a) {
          (function() {
            var l = /%[sdj%]/g;
            n.format = function(H) {
              if (!M(H)) {
                for (var X = [], ie = 0; ie < arguments.length; ie++)
                  X.push(s(arguments[ie]));
                return X.join(" ");
              }
              for (var ie = 1, pe = arguments, Z = pe.length, K = String(H).replace(l, function(de) {
                if (de === "%%") return "%";
                if (ie >= Z) return de;
                switch (de) {
                  case "%s":
                    return String(pe[ie++]);
                  case "%d":
                    return Number(pe[ie++]);
                  case "%j":
                    try {
                      return JSON.stringify(pe[ie++]);
                    } catch {
                      return "[Circular]";
                    }
                  default:
                    return de;
                }
              }), ee = pe[ie]; ie < Z; ee = pe[++ie])
                A(ee) || !$(ee) ? K += " " + ee : K += " " + s(ee);
              return K;
            }, n.deprecate = function(H, X) {
              if (N(a.process))
                return function() {
                  return n.deprecate(H, X).apply(this, arguments);
                };
              if (o.noDeprecation === !0)
                return H;
              var ie = !1;
              function pe() {
                if (!ie) {
                  if (o.throwDeprecation)
                    throw new Error(X);
                  o.traceDeprecation ? console.trace(X) : console.error(X), ie = !0;
                }
                return H.apply(this, arguments);
              }
              return pe;
            };
            var f = {}, h;
            n.debuglog = function(H) {
              if (N(h) && (h = o.env.NODE_DEBUG || ""), H = H.toUpperCase(), !f[H])
                if (new RegExp("\\b" + H + "\\b", "i").test(h)) {
                  var X = o.pid;
                  f[H] = function() {
                    var ie = n.format.apply(n, arguments);
                    console.error("%s %d: %s", H, X, ie);
                  };
                } else
                  f[H] = function() {
                  };
              return f[H];
            };
            function s(H, X) {
              var ie = {
                seen: [],
                stylize: c
              };
              return arguments.length >= 3 && (ie.depth = arguments[2]), arguments.length >= 4 && (ie.colors = arguments[3]), x(X) ? ie.showHidden = X : X && n._extend(ie, X), N(ie.showHidden) && (ie.showHidden = !1), N(ie.depth) && (ie.depth = 2), N(ie.colors) && (ie.colors = !1), N(ie.customInspect) && (ie.customInspect = !0), ie.colors && (ie.stylize = u), m(ie, H, ie.depth);
            }
            n.inspect = s, s.colors = {
              bold: [1, 22],
              italic: [3, 23],
              underline: [4, 24],
              inverse: [7, 27],
              white: [37, 39],
              grey: [90, 39],
              black: [30, 39],
              blue: [34, 39],
              cyan: [36, 39],
              green: [32, 39],
              magenta: [35, 39],
              red: [31, 39],
              yellow: [33, 39]
            }, s.styles = {
              special: "cyan",
              number: "yellow",
              boolean: "yellow",
              undefined: "grey",
              null: "bold",
              string: "green",
              date: "magenta",
              // "name": intentionally not styling
              regexp: "red"
            };
            function u(H, X) {
              var ie = s.styles[X];
              return ie ? "\x1B[" + s.colors[ie][0] + "m" + H + "\x1B[" + s.colors[ie][1] + "m" : H;
            }
            function c(H, X) {
              return H;
            }
            function p(H) {
              var X = {};
              return H.forEach(function(ie, pe) {
                X[ie] = !0;
              }), X;
            }
            function m(H, X, ie) {
              if (H.customInspect && X && U(X.inspect) && // Filter out the util module, it's inspect function is special
              X.inspect !== n.inspect && // Also filter out any prototype objects using the circular check.
              !(X.constructor && X.constructor.prototype === X)) {
                var pe = X.inspect(ie, H);
                return M(pe) || (pe = m(H, pe, ie)), pe;
              }
              var Z = d(H, X);
              if (Z)
                return Z;
              var K = Object.keys(X), ee = p(K);
              if (H.showHidden && (K = Object.getOwnPropertyNames(X)), ne(X) && (K.indexOf("message") >= 0 || K.indexOf("description") >= 0))
                return _(X);
              if (K.length === 0) {
                if (U(X)) {
                  var de = X.name ? ": " + X.name : "";
                  return H.stylize("[Function" + de + "]", "special");
                }
                if (j(X))
                  return H.stylize(RegExp.prototype.toString.call(X), "regexp");
                if (re(X))
                  return H.stylize(Date.prototype.toString.call(X), "date");
                if (ne(X))
                  return _(X);
              }
              var ge = "", ue = !1, Y = ["{", "}"];
              if (T(X) && (ue = !0, Y = ["[", "]"]), U(X)) {
                var q = X.name ? ": " + X.name : "";
                ge = " [Function" + q + "]";
              }
              if (j(X) && (ge = " " + RegExp.prototype.toString.call(X)), re(X) && (ge = " " + Date.prototype.toUTCString.call(X)), ne(X) && (ge = " " + _(X)), K.length === 0 && (!ue || X.length == 0))
                return Y[0] + ge + Y[1];
              if (ie < 0)
                return j(X) ? H.stylize(RegExp.prototype.toString.call(X), "regexp") : H.stylize("[Object]", "special");
              H.seen.push(X);
              var he;
              return ue ? he = v(H, X, ie, ee, K) : he = K.map(function(Se) {
                return k(H, X, ie, ee, Se, ue);
              }), H.seen.pop(), E(he, ge, Y);
            }
            function d(H, X) {
              if (N(X))
                return H.stylize("undefined", "undefined");
              if (M(X)) {
                var ie = "'" + JSON.stringify(X).replace(/^"|"$/g, "").replace(/'/g, "\\'").replace(/\\"/g, '"') + "'";
                return H.stylize(ie, "string");
              }
              if (R(X))
                return H.stylize("" + X, "number");
              if (x(X))
                return H.stylize("" + X, "boolean");
              if (A(X))
                return H.stylize("null", "null");
            }
            function _(H) {
              return "[" + Error.prototype.toString.call(H) + "]";
            }
            function v(H, X, ie, pe, Z) {
              for (var K = [], ee = 0, de = X.length; ee < de; ++ee)
                ae(X, String(ee)) ? K.push(k(
                  H,
                  X,
                  ie,
                  pe,
                  String(ee),
                  !0
                )) : K.push("");
              return Z.forEach(function(ge) {
                ge.match(/^\d+$/) || K.push(k(
                  H,
                  X,
                  ie,
                  pe,
                  ge,
                  !0
                ));
              }), K;
            }
            function k(H, X, ie, pe, Z, K) {
              var ee, de, ge;
              if (ge = Object.getOwnPropertyDescriptor(X, Z) || { value: X[Z] }, ge.get ? ge.set ? de = H.stylize("[Getter/Setter]", "special") : de = H.stylize("[Getter]", "special") : ge.set && (de = H.stylize("[Setter]", "special")), ae(pe, Z) || (ee = "[" + Z + "]"), de || (H.seen.indexOf(ge.value) < 0 ? (A(ie) ? de = m(H, ge.value, null) : de = m(H, ge.value, ie - 1), de.indexOf(`
`) > -1 && (K ? de = de.split(`
`).map(function(ue) {
                return "  " + ue;
              }).join(`
`).substr(2) : de = `
` + de.split(`
`).map(function(ue) {
                return "   " + ue;
              }).join(`
`))) : de = H.stylize("[Circular]", "special")), N(ee)) {
                if (K && Z.match(/^\d+$/))
                  return de;
                ee = JSON.stringify("" + Z), ee.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/) ? (ee = ee.substr(1, ee.length - 2), ee = H.stylize(ee, "name")) : (ee = ee.replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'"), ee = H.stylize(ee, "string"));
              }
              return ee + ": " + de;
            }
            function E(H, X, ie) {
              var pe = H.reduce(function(Z, K) {
                return K.indexOf(`
`) >= 0, Z + K.replace(/\u001b\[\d\d?m/g, "").length + 1;
              }, 0);
              return pe > 60 ? ie[0] + (X === "" ? "" : X + `
 `) + " " + H.join(`,
  `) + " " + ie[1] : ie[0] + X + " " + H.join(", ") + " " + ie[1];
            }
            function T(H) {
              return Array.isArray(H);
            }
            n.isArray = T;
            function x(H) {
              return typeof H == "boolean";
            }
            n.isBoolean = x;
            function A(H) {
              return H === null;
            }
            n.isNull = A;
            function I(H) {
              return H == null;
            }
            n.isNullOrUndefined = I;
            function R(H) {
              return typeof H == "number";
            }
            n.isNumber = R;
            function M(H) {
              return typeof H == "string";
            }
            n.isString = M;
            function b(H) {
              return typeof H == "symbol";
            }
            n.isSymbol = b;
            function N(H) {
              return H === void 0;
            }
            n.isUndefined = N;
            function j(H) {
              return $(H) && D(H) === "[object RegExp]";
            }
            n.isRegExp = j;
            function $(H) {
              return typeof H == "object" && H !== null;
            }
            n.isObject = $;
            function re(H) {
              return $(H) && D(H) === "[object Date]";
            }
            n.isDate = re;
            function ne(H) {
              return $(H) && (D(H) === "[object Error]" || H instanceof Error);
            }
            n.isError = ne;
            function U(H) {
              return typeof H == "function";
            }
            n.isFunction = U;
            function P(H) {
              return H === null || typeof H == "boolean" || typeof H == "number" || typeof H == "string" || typeof H == "symbol" || // ES6 symbol
              typeof H > "u";
            }
            n.isPrimitive = P, n.isBuffer = r("./support/isBuffer");
            function D(H) {
              return Object.prototype.toString.call(H);
            }
            function Q(H) {
              return H < 10 ? "0" + H.toString(10) : H.toString(10);
            }
            var W = [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec"
            ];
            function oe() {
              var H = /* @__PURE__ */ new Date(), X = [
                Q(H.getHours()),
                Q(H.getMinutes()),
                Q(H.getSeconds())
              ].join(":");
              return [H.getDate(), W[H.getMonth()], X].join(" ");
            }
            n.log = function() {
              console.log("%s - %s", oe(), n.format.apply(n, arguments));
            }, n.inherits = r("inherits"), n._extend = function(H, X) {
              if (!X || !$(X)) return H;
              for (var ie = Object.keys(X), pe = ie.length; pe--; )
                H[ie[pe]] = X[ie[pe]];
              return H;
            };
            function ae(H, X) {
              return Object.prototype.hasOwnProperty.call(H, X);
            }
          }).call(this);
        }).call(this, r("_process"), typeof mt < "u" ? mt : typeof self < "u" ? self : typeof window < "u" ? window : {});
      }, { "./support/isBuffer": 25, _process: 63, inherits: 24 }], 27: [function(r, i, n) {
        (function(o) {
          (function() {
            var a = [
              "BigInt64Array",
              "BigUint64Array",
              "Float32Array",
              "Float64Array",
              "Int16Array",
              "Int32Array",
              "Int8Array",
              "Uint16Array",
              "Uint32Array",
              "Uint8Array",
              "Uint8ClampedArray"
            ], l = typeof globalThis > "u" ? o : globalThis;
            i.exports = function() {
              for (var h = [], s = 0; s < a.length; s++)
                typeof l[a[s]] == "function" && (h[h.length] = a[s]);
              return h;
            };
          }).call(this);
        }).call(this, typeof mt < "u" ? mt : typeof self < "u" ? self : typeof window < "u" ? window : {});
      }, {}], 28: [function(r, i, n) {
        n.byteLength = c, n.toByteArray = m, n.fromByteArray = v;
        for (var o = [], a = [], l = typeof Uint8Array < "u" ? Uint8Array : Array, f = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", h = 0, s = f.length; h < s; ++h)
          o[h] = f[h], a[f.charCodeAt(h)] = h;
        a[45] = 62, a[95] = 63;
        function u(k) {
          var E = k.length;
          if (E % 4 > 0)
            throw new Error("Invalid string. Length must be a multiple of 4");
          var T = k.indexOf("=");
          T === -1 && (T = E);
          var x = T === E ? 0 : 4 - T % 4;
          return [T, x];
        }
        function c(k) {
          var E = u(k), T = E[0], x = E[1];
          return (T + x) * 3 / 4 - x;
        }
        function p(k, E, T) {
          return (E + T) * 3 / 4 - T;
        }
        function m(k) {
          var E, T = u(k), x = T[0], A = T[1], I = new l(p(k, x, A)), R = 0, M = A > 0 ? x - 4 : x, b;
          for (b = 0; b < M; b += 4)
            E = a[k.charCodeAt(b)] << 18 | a[k.charCodeAt(b + 1)] << 12 | a[k.charCodeAt(b + 2)] << 6 | a[k.charCodeAt(b + 3)], I[R++] = E >> 16 & 255, I[R++] = E >> 8 & 255, I[R++] = E & 255;
          return A === 2 && (E = a[k.charCodeAt(b)] << 2 | a[k.charCodeAt(b + 1)] >> 4, I[R++] = E & 255), A === 1 && (E = a[k.charCodeAt(b)] << 10 | a[k.charCodeAt(b + 1)] << 4 | a[k.charCodeAt(b + 2)] >> 2, I[R++] = E >> 8 & 255, I[R++] = E & 255), I;
        }
        function d(k) {
          return o[k >> 18 & 63] + o[k >> 12 & 63] + o[k >> 6 & 63] + o[k & 63];
        }
        function _(k, E, T) {
          for (var x, A = [], I = E; I < T; I += 3)
            x = (k[I] << 16 & 16711680) + (k[I + 1] << 8 & 65280) + (k[I + 2] & 255), A.push(d(x));
          return A.join("");
        }
        function v(k) {
          for (var E, T = k.length, x = T % 3, A = [], I = 16383, R = 0, M = T - x; R < M; R += I)
            A.push(_(k, R, R + I > M ? M : R + I));
          return x === 1 ? (E = k[T - 1], A.push(
            o[E >> 2] + o[E << 4 & 63] + "=="
          )) : x === 2 && (E = (k[T - 2] << 8) + k[T - 1], A.push(
            o[E >> 10] + o[E >> 4 & 63] + o[E << 2 & 63] + "="
          )), A.join("");
        }
      }, {}], 29: [function(r, i, n) {
      }, {}], 30: [function(r, i, n) {
        (function(o, a) {
          (function() {
            var l = r("assert"), f = r("pako/lib/zlib/zstream"), h = r("pako/lib/zlib/deflate.js"), s = r("pako/lib/zlib/inflate.js"), u = r("pako/lib/zlib/constants");
            for (var c in u)
              n[c] = u[c];
            n.NONE = 0, n.DEFLATE = 1, n.INFLATE = 2, n.GZIP = 3, n.GUNZIP = 4, n.DEFLATERAW = 5, n.INFLATERAW = 6, n.UNZIP = 7;
            var p = 31, m = 139;
            function d(_) {
              if (typeof _ != "number" || _ < n.DEFLATE || _ > n.UNZIP)
                throw new TypeError("Bad argument");
              this.dictionary = null, this.err = 0, this.flush = 0, this.init_done = !1, this.level = 0, this.memLevel = 0, this.mode = _, this.strategy = 0, this.windowBits = 0, this.write_in_progress = !1, this.pending_close = !1, this.gzip_id_bytes_read = 0;
            }
            d.prototype.close = function() {
              if (this.write_in_progress) {
                this.pending_close = !0;
                return;
              }
              this.pending_close = !1, l(this.init_done, "close before init"), l(this.mode <= n.UNZIP), this.mode === n.DEFLATE || this.mode === n.GZIP || this.mode === n.DEFLATERAW ? h.deflateEnd(this.strm) : (this.mode === n.INFLATE || this.mode === n.GUNZIP || this.mode === n.INFLATERAW || this.mode === n.UNZIP) && s.inflateEnd(this.strm), this.mode = n.NONE, this.dictionary = null;
            }, d.prototype.write = function(_, v, k, E, T, x, A) {
              return this._write(!0, _, v, k, E, T, x, A);
            }, d.prototype.writeSync = function(_, v, k, E, T, x, A) {
              return this._write(!1, _, v, k, E, T, x, A);
            }, d.prototype._write = function(_, v, k, E, T, x, A, I) {
              if (l.equal(arguments.length, 8), l(this.init_done, "write before init"), l(this.mode !== n.NONE, "already finalized"), l.equal(!1, this.write_in_progress, "write already in progress"), l.equal(!1, this.pending_close, "close is pending"), this.write_in_progress = !0, l.equal(!1, v === void 0, "must provide flush value"), this.write_in_progress = !0, v !== n.Z_NO_FLUSH && v !== n.Z_PARTIAL_FLUSH && v !== n.Z_SYNC_FLUSH && v !== n.Z_FULL_FLUSH && v !== n.Z_FINISH && v !== n.Z_BLOCK)
                throw new Error("Invalid flush value");
              if (k == null && (k = a.alloc(0), T = 0, E = 0), this.strm.avail_in = T, this.strm.input = k, this.strm.next_in = E, this.strm.avail_out = I, this.strm.output = x, this.strm.next_out = A, this.flush = v, !_)
                return this._process(), this._checkError() ? this._afterSync() : void 0;
              var R = this;
              return o.nextTick(function() {
                R._process(), R._after();
              }), this;
            }, d.prototype._afterSync = function() {
              var _ = this.strm.avail_out, v = this.strm.avail_in;
              return this.write_in_progress = !1, [v, _];
            }, d.prototype._process = function() {
              var _ = null;
              switch (this.mode) {
                case n.DEFLATE:
                case n.GZIP:
                case n.DEFLATERAW:
                  this.err = h.deflate(this.strm, this.flush);
                  break;
                case n.UNZIP:
                  switch (this.strm.avail_in > 0 && (_ = this.strm.next_in), this.gzip_id_bytes_read) {
                    case 0:
                      if (_ === null)
                        break;
                      if (this.strm.input[_] === p) {
                        if (this.gzip_id_bytes_read = 1, _++, this.strm.avail_in === 1)
                          break;
                      } else {
                        this.mode = n.INFLATE;
                        break;
                      }
                    // fallthrough
                    case 1:
                      if (_ === null)
                        break;
                      this.strm.input[_] === m ? (this.gzip_id_bytes_read = 2, this.mode = n.GUNZIP) : this.mode = n.INFLATE;
                      break;
                    default:
                      throw new Error("invalid number of gzip magic number bytes read");
                  }
                // fallthrough
                case n.INFLATE:
                case n.GUNZIP:
                case n.INFLATERAW:
                  for (this.err = s.inflate(
                    this.strm,
                    this.flush
                    // If data was encoded with dictionary
                  ), this.err === n.Z_NEED_DICT && this.dictionary && (this.err = s.inflateSetDictionary(this.strm, this.dictionary), this.err === n.Z_OK ? this.err = s.inflate(this.strm, this.flush) : this.err === n.Z_DATA_ERROR && (this.err = n.Z_NEED_DICT)); this.strm.avail_in > 0 && this.mode === n.GUNZIP && this.err === n.Z_STREAM_END && this.strm.next_in[0] !== 0; )
                    this.reset(), this.err = s.inflate(this.strm, this.flush);
                  break;
                default:
                  throw new Error("Unknown mode " + this.mode);
              }
            }, d.prototype._checkError = function() {
              switch (this.err) {
                case n.Z_OK:
                case n.Z_BUF_ERROR:
                  if (this.strm.avail_out !== 0 && this.flush === n.Z_FINISH)
                    return this._error("unexpected end of file"), !1;
                  break;
                case n.Z_STREAM_END:
                  break;
                case n.Z_NEED_DICT:
                  return this.dictionary == null ? this._error("Missing dictionary") : this._error("Bad dictionary"), !1;
                default:
                  return this._error("Zlib error"), !1;
              }
              return !0;
            }, d.prototype._after = function() {
              if (this._checkError()) {
                var _ = this.strm.avail_out, v = this.strm.avail_in;
                this.write_in_progress = !1, this.callback(v, _), this.pending_close && this.close();
              }
            }, d.prototype._error = function(_) {
              this.strm.msg && (_ = this.strm.msg), this.onerror(
                _,
                this.err
                // no hope of rescue.
              ), this.write_in_progress = !1, this.pending_close && this.close();
            }, d.prototype.init = function(_, v, k, E, T) {
              l(arguments.length === 4 || arguments.length === 5, "init(windowBits, level, memLevel, strategy, [dictionary])"), l(_ >= 8 && _ <= 15, "invalid windowBits"), l(v >= -1 && v <= 9, "invalid compression level"), l(k >= 1 && k <= 9, "invalid memlevel"), l(E === n.Z_FILTERED || E === n.Z_HUFFMAN_ONLY || E === n.Z_RLE || E === n.Z_FIXED || E === n.Z_DEFAULT_STRATEGY, "invalid strategy"), this._init(v, _, k, E, T), this._setDictionary();
            }, d.prototype.params = function() {
              throw new Error("deflateParams Not supported");
            }, d.prototype.reset = function() {
              this._reset(), this._setDictionary();
            }, d.prototype._init = function(_, v, k, E, T) {
              switch (this.level = _, this.windowBits = v, this.memLevel = k, this.strategy = E, this.flush = n.Z_NO_FLUSH, this.err = n.Z_OK, (this.mode === n.GZIP || this.mode === n.GUNZIP) && (this.windowBits += 16), this.mode === n.UNZIP && (this.windowBits += 32), (this.mode === n.DEFLATERAW || this.mode === n.INFLATERAW) && (this.windowBits = -1 * this.windowBits), this.strm = new f(), this.mode) {
                case n.DEFLATE:
                case n.GZIP:
                case n.DEFLATERAW:
                  this.err = h.deflateInit2(this.strm, this.level, n.Z_DEFLATED, this.windowBits, this.memLevel, this.strategy);
                  break;
                case n.INFLATE:
                case n.GUNZIP:
                case n.INFLATERAW:
                case n.UNZIP:
                  this.err = s.inflateInit2(this.strm, this.windowBits);
                  break;
                default:
                  throw new Error("Unknown mode " + this.mode);
              }
              this.err !== n.Z_OK && this._error("Init error"), this.dictionary = T, this.write_in_progress = !1, this.init_done = !0;
            }, d.prototype._setDictionary = function() {
              if (this.dictionary != null) {
                switch (this.err = n.Z_OK, this.mode) {
                  case n.DEFLATE:
                  case n.DEFLATERAW:
                    this.err = h.deflateSetDictionary(this.strm, this.dictionary);
                    break;
                }
                this.err !== n.Z_OK && this._error("Failed to set dictionary");
              }
            }, d.prototype._reset = function() {
              switch (this.err = n.Z_OK, this.mode) {
                case n.DEFLATE:
                case n.DEFLATERAW:
                case n.GZIP:
                  this.err = h.deflateReset(this.strm);
                  break;
                case n.INFLATE:
                case n.INFLATERAW:
                case n.GUNZIP:
                  this.err = s.inflateReset(this.strm);
                  break;
              }
              this.err !== n.Z_OK && this._error("Failed to reset stream");
            }, n.Zlib = d;
          }).call(this);
        }).call(this, r("_process"), r("buffer").Buffer);
      }, { _process: 63, assert: 23, buffer: 32, "pako/lib/zlib/constants": 54, "pako/lib/zlib/deflate.js": 56, "pako/lib/zlib/inflate.js": 58, "pako/lib/zlib/zstream": 62 }], 31: [function(r, i, n) {
        (function(o) {
          (function() {
            var a = r("buffer").Buffer, l = r("stream").Transform, f = r("./binding"), h = r("util"), s = r("assert").ok, u = r("buffer").kMaxLength, c = "Cannot create final Buffer. It would be larger than 0x" + u.toString(16) + " bytes";
            f.Z_MIN_WINDOWBITS = 8, f.Z_MAX_WINDOWBITS = 15, f.Z_DEFAULT_WINDOWBITS = 15, f.Z_MIN_CHUNK = 64, f.Z_MAX_CHUNK = 1 / 0, f.Z_DEFAULT_CHUNK = 16 * 1024, f.Z_MIN_MEMLEVEL = 1, f.Z_MAX_MEMLEVEL = 9, f.Z_DEFAULT_MEMLEVEL = 8, f.Z_MIN_LEVEL = -1, f.Z_MAX_LEVEL = 9, f.Z_DEFAULT_LEVEL = f.Z_DEFAULT_COMPRESSION;
            for (var p = Object.keys(f), m = 0; m < p.length; m++) {
              var d = p[m];
              d.match(/^Z/) && Object.defineProperty(n, d, {
                enumerable: !0,
                value: f[d],
                writable: !1
              });
            }
            for (var _ = {
              Z_OK: f.Z_OK,
              Z_STREAM_END: f.Z_STREAM_END,
              Z_NEED_DICT: f.Z_NEED_DICT,
              Z_ERRNO: f.Z_ERRNO,
              Z_STREAM_ERROR: f.Z_STREAM_ERROR,
              Z_DATA_ERROR: f.Z_DATA_ERROR,
              Z_MEM_ERROR: f.Z_MEM_ERROR,
              Z_BUF_ERROR: f.Z_BUF_ERROR,
              Z_VERSION_ERROR: f.Z_VERSION_ERROR
            }, v = Object.keys(_), k = 0; k < v.length; k++) {
              var E = v[k];
              _[_[E]] = E;
            }
            Object.defineProperty(n, "codes", {
              enumerable: !0,
              value: Object.freeze(_),
              writable: !1
            }), n.Deflate = A, n.Inflate = I, n.Gzip = R, n.Gunzip = M, n.DeflateRaw = b, n.InflateRaw = N, n.Unzip = j, n.createDeflate = function(P) {
              return new A(P);
            }, n.createInflate = function(P) {
              return new I(P);
            }, n.createDeflateRaw = function(P) {
              return new b(P);
            }, n.createInflateRaw = function(P) {
              return new N(P);
            }, n.createGzip = function(P) {
              return new R(P);
            }, n.createGunzip = function(P) {
              return new M(P);
            }, n.createUnzip = function(P) {
              return new j(P);
            }, n.deflate = function(P, D, Q) {
              return typeof D == "function" && (Q = D, D = {}), T(new A(D), P, Q);
            }, n.deflateSync = function(P, D) {
              return x(new A(D), P);
            }, n.gzip = function(P, D, Q) {
              return typeof D == "function" && (Q = D, D = {}), T(new R(D), P, Q);
            }, n.gzipSync = function(P, D) {
              return x(new R(D), P);
            }, n.deflateRaw = function(P, D, Q) {
              return typeof D == "function" && (Q = D, D = {}), T(new b(D), P, Q);
            }, n.deflateRawSync = function(P, D) {
              return x(new b(D), P);
            }, n.unzip = function(P, D, Q) {
              return typeof D == "function" && (Q = D, D = {}), T(new j(D), P, Q);
            }, n.unzipSync = function(P, D) {
              return x(new j(D), P);
            }, n.inflate = function(P, D, Q) {
              return typeof D == "function" && (Q = D, D = {}), T(new I(D), P, Q);
            }, n.inflateSync = function(P, D) {
              return x(new I(D), P);
            }, n.gunzip = function(P, D, Q) {
              return typeof D == "function" && (Q = D, D = {}), T(new M(D), P, Q);
            }, n.gunzipSync = function(P, D) {
              return x(new M(D), P);
            }, n.inflateRaw = function(P, D, Q) {
              return typeof D == "function" && (Q = D, D = {}), T(new N(D), P, Q);
            }, n.inflateRawSync = function(P, D) {
              return x(new N(D), P);
            };
            function T(P, D, Q) {
              var W = [], oe = 0;
              P.on("error", H), P.on("end", X), P.end(D), ae();
              function ae() {
                for (var ie; (ie = P.read()) !== null; )
                  W.push(ie), oe += ie.length;
                P.once("readable", ae);
              }
              function H(ie) {
                P.removeListener("end", X), P.removeListener("readable", ae), Q(ie);
              }
              function X() {
                var ie, pe = null;
                oe >= u ? pe = new RangeError(c) : ie = a.concat(W, oe), W = [], P.close(), Q(pe, ie);
              }
            }
            function x(P, D) {
              if (typeof D == "string" && (D = a.from(D)), !a.isBuffer(D)) throw new TypeError("Not a string or buffer");
              var Q = P._finishFlushFlag;
              return P._processChunk(D, Q);
            }
            function A(P) {
              if (!(this instanceof A)) return new A(P);
              re.call(this, P, f.DEFLATE);
            }
            function I(P) {
              if (!(this instanceof I)) return new I(P);
              re.call(this, P, f.INFLATE);
            }
            function R(P) {
              if (!(this instanceof R)) return new R(P);
              re.call(this, P, f.GZIP);
            }
            function M(P) {
              if (!(this instanceof M)) return new M(P);
              re.call(this, P, f.GUNZIP);
            }
            function b(P) {
              if (!(this instanceof b)) return new b(P);
              re.call(this, P, f.DEFLATERAW);
            }
            function N(P) {
              if (!(this instanceof N)) return new N(P);
              re.call(this, P, f.INFLATERAW);
            }
            function j(P) {
              if (!(this instanceof j)) return new j(P);
              re.call(this, P, f.UNZIP);
            }
            function $(P) {
              return P === f.Z_NO_FLUSH || P === f.Z_PARTIAL_FLUSH || P === f.Z_SYNC_FLUSH || P === f.Z_FULL_FLUSH || P === f.Z_FINISH || P === f.Z_BLOCK;
            }
            function re(P, D) {
              var Q = this;
              if (this._opts = P = P || {}, this._chunkSize = P.chunkSize || n.Z_DEFAULT_CHUNK, l.call(this, P), P.flush && !$(P.flush))
                throw new Error("Invalid flush flag: " + P.flush);
              if (P.finishFlush && !$(P.finishFlush))
                throw new Error("Invalid flush flag: " + P.finishFlush);
              if (this._flushFlag = P.flush || f.Z_NO_FLUSH, this._finishFlushFlag = typeof P.finishFlush < "u" ? P.finishFlush : f.Z_FINISH, P.chunkSize && (P.chunkSize < n.Z_MIN_CHUNK || P.chunkSize > n.Z_MAX_CHUNK))
                throw new Error("Invalid chunk size: " + P.chunkSize);
              if (P.windowBits && (P.windowBits < n.Z_MIN_WINDOWBITS || P.windowBits > n.Z_MAX_WINDOWBITS))
                throw new Error("Invalid windowBits: " + P.windowBits);
              if (P.level && (P.level < n.Z_MIN_LEVEL || P.level > n.Z_MAX_LEVEL))
                throw new Error("Invalid compression level: " + P.level);
              if (P.memLevel && (P.memLevel < n.Z_MIN_MEMLEVEL || P.memLevel > n.Z_MAX_MEMLEVEL))
                throw new Error("Invalid memLevel: " + P.memLevel);
              if (P.strategy && P.strategy != n.Z_FILTERED && P.strategy != n.Z_HUFFMAN_ONLY && P.strategy != n.Z_RLE && P.strategy != n.Z_FIXED && P.strategy != n.Z_DEFAULT_STRATEGY)
                throw new Error("Invalid strategy: " + P.strategy);
              if (P.dictionary && !a.isBuffer(P.dictionary))
                throw new Error("Invalid dictionary: it should be a Buffer instance");
              this._handle = new f.Zlib(D);
              var W = this;
              this._hadError = !1, this._handle.onerror = function(H, X) {
                ne(W), W._hadError = !0;
                var ie = new Error(H);
                ie.errno = X, ie.code = n.codes[X], W.emit("error", ie);
              };
              var oe = n.Z_DEFAULT_COMPRESSION;
              typeof P.level == "number" && (oe = P.level);
              var ae = n.Z_DEFAULT_STRATEGY;
              typeof P.strategy == "number" && (ae = P.strategy), this._handle.init(P.windowBits || n.Z_DEFAULT_WINDOWBITS, oe, P.memLevel || n.Z_DEFAULT_MEMLEVEL, ae, P.dictionary), this._buffer = a.allocUnsafe(this._chunkSize), this._offset = 0, this._level = oe, this._strategy = ae, this.once("end", this.close), Object.defineProperty(this, "_closed", {
                get: function() {
                  return !Q._handle;
                },
                configurable: !0,
                enumerable: !0
              });
            }
            h.inherits(re, l), re.prototype.params = function(P, D, Q) {
              if (P < n.Z_MIN_LEVEL || P > n.Z_MAX_LEVEL)
                throw new RangeError("Invalid compression level: " + P);
              if (D != n.Z_FILTERED && D != n.Z_HUFFMAN_ONLY && D != n.Z_RLE && D != n.Z_FIXED && D != n.Z_DEFAULT_STRATEGY)
                throw new TypeError("Invalid strategy: " + D);
              if (this._level !== P || this._strategy !== D) {
                var W = this;
                this.flush(f.Z_SYNC_FLUSH, function() {
                  s(W._handle, "zlib binding closed"), W._handle.params(P, D), W._hadError || (W._level = P, W._strategy = D, Q && Q());
                });
              } else
                o.nextTick(Q);
            }, re.prototype.reset = function() {
              return s(this._handle, "zlib binding closed"), this._handle.reset();
            }, re.prototype._flush = function(P) {
              this._transform(a.alloc(0), "", P);
            }, re.prototype.flush = function(P, D) {
              var Q = this, W = this._writableState;
              (typeof P == "function" || P === void 0 && !D) && (D = P, P = f.Z_FULL_FLUSH), W.ended ? D && o.nextTick(D) : W.ending ? D && this.once("end", D) : W.needDrain ? D && this.once("drain", function() {
                return Q.flush(P, D);
              }) : (this._flushFlag = P, this.write(a.alloc(0), "", D));
            }, re.prototype.close = function(P) {
              ne(this, P), o.nextTick(U, this);
            };
            function ne(P, D) {
              D && o.nextTick(D), P._handle && (P._handle.close(), P._handle = null);
            }
            function U(P) {
              P.emit("close");
            }
            re.prototype._transform = function(P, D, Q) {
              var W, oe = this._writableState, ae = oe.ending || oe.ended, H = ae && (!P || oe.length === P.length);
              if (P !== null && !a.isBuffer(P)) return Q(new Error("invalid input"));
              if (!this._handle) return Q(new Error("zlib binding closed"));
              H ? W = this._finishFlushFlag : (W = this._flushFlag, P.length >= oe.length && (this._flushFlag = this._opts.flush || f.Z_NO_FLUSH)), this._processChunk(P, W, Q);
            }, re.prototype._processChunk = function(P, D, Q) {
              var W = P && P.length, oe = this._chunkSize - this._offset, ae = 0, H = this, X = typeof Q == "function";
              if (!X) {
                var ie = [], pe = 0, Z;
                this.on("error", function(ue) {
                  Z = ue;
                }), s(this._handle, "zlib binding closed");
                do
                  var K = this._handle.writeSync(
                    D,
                    P,
                    // in
                    ae,
                    // in_off
                    W,
                    // in_len
                    this._buffer,
                    // out
                    this._offset,
                    //out_off
                    oe
                  );
                while (!this._hadError && ge(K[0], K[1]));
                if (this._hadError)
                  throw Z;
                if (pe >= u)
                  throw ne(this), new RangeError(c);
                var ee = a.concat(ie, pe);
                return ne(this), ee;
              }
              s(this._handle, "zlib binding closed");
              var de = this._handle.write(
                D,
                P,
                // in
                ae,
                // in_off
                W,
                // in_len
                this._buffer,
                // out
                this._offset,
                //out_off
                oe
              );
              de.buffer = P, de.callback = ge;
              function ge(ue, Y) {
                if (this && (this.buffer = null, this.callback = null), !H._hadError) {
                  var q = oe - Y;
                  if (s(q >= 0, "have should not go down"), q > 0) {
                    var he = H._buffer.slice(H._offset, H._offset + q);
                    H._offset += q, X ? H.push(he) : (ie.push(he), pe += he.length);
                  }
                  if ((Y === 0 || H._offset >= H._chunkSize) && (oe = H._chunkSize, H._offset = 0, H._buffer = a.allocUnsafe(H._chunkSize)), Y === 0) {
                    if (ae += W - ue, W = ue, !X) return !0;
                    var Se = H._handle.write(D, P, ae, W, H._buffer, H._offset, H._chunkSize);
                    Se.callback = ge, Se.buffer = P;
                    return;
                  }
                  if (!X) return !1;
                  Q();
                }
              }
            }, h.inherits(A, re), h.inherits(I, re), h.inherits(R, re), h.inherits(M, re), h.inherits(b, re), h.inherits(N, re), h.inherits(j, re);
          }).call(this);
        }).call(this, r("_process"));
      }, { "./binding": 30, _process: 63, assert: 23, buffer: 32, stream: 65, util: 84 }], 32: [function(r, i, n) {
        (function(o) {
          (function() {
            var a = r("base64-js"), l = r("ieee754");
            n.Buffer = u, n.SlowBuffer = x, n.INSPECT_MAX_BYTES = 50;
            var f = 2147483647;
            n.kMaxLength = f, u.TYPED_ARRAY_SUPPORT = h(), !u.TYPED_ARRAY_SUPPORT && typeof console < "u" && typeof console.error == "function" && console.error(
              "This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support."
            );
            function h() {
              try {
                var O = new Uint8Array(1);
                return O.__proto__ = { __proto__: Uint8Array.prototype, foo: function() {
                  return 42;
                } }, O.foo() === 42;
              } catch {
                return !1;
              }
            }
            Object.defineProperty(u.prototype, "parent", {
              enumerable: !0,
              get: function() {
                if (u.isBuffer(this))
                  return this.buffer;
              }
            }), Object.defineProperty(u.prototype, "offset", {
              enumerable: !0,
              get: function() {
                if (u.isBuffer(this))
                  return this.byteOffset;
              }
            });
            function s(O) {
              if (O > f)
                throw new RangeError('The value "' + O + '" is invalid for option "size"');
              var g = new Uint8Array(O);
              return g.__proto__ = u.prototype, g;
            }
            function u(O, g, w) {
              if (typeof O == "number") {
                if (typeof g == "string")
                  throw new TypeError(
                    'The "string" argument must be of type string. Received type number'
                  );
                return d(O);
              }
              return c(O, g, w);
            }
            typeof Symbol < "u" && Symbol.species != null && u[Symbol.species] === u && Object.defineProperty(u, Symbol.species, {
              value: null,
              configurable: !0,
              enumerable: !1,
              writable: !1
            }), u.poolSize = 8192;
            function c(O, g, w) {
              if (typeof O == "string")
                return _(O, g);
              if (ArrayBuffer.isView(O))
                return v(O);
              if (O == null)
                throw TypeError(
                  "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof O
                );
              if (F(O, ArrayBuffer) || O && F(O.buffer, ArrayBuffer))
                return k(O, g, w);
              if (typeof O == "number")
                throw new TypeError(
                  'The "value" argument must not be of type number. Received type number'
                );
              var S = O.valueOf && O.valueOf();
              if (S != null && S !== O)
                return u.from(S, g, w);
              var J = E(O);
              if (J) return J;
              if (typeof Symbol < "u" && Symbol.toPrimitive != null && typeof O[Symbol.toPrimitive] == "function")
                return u.from(
                  O[Symbol.toPrimitive]("string"),
                  g,
                  w
                );
              throw new TypeError(
                "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof O
              );
            }
            u.from = function(O, g, w) {
              return c(O, g, w);
            }, u.prototype.__proto__ = Uint8Array.prototype, u.__proto__ = Uint8Array;
            function p(O) {
              if (typeof O != "number")
                throw new TypeError('"size" argument must be of type number');
              if (O < 0)
                throw new RangeError('The value "' + O + '" is invalid for option "size"');
            }
            function m(O, g, w) {
              return p(O), O <= 0 ? s(O) : g !== void 0 ? typeof w == "string" ? s(O).fill(g, w) : s(O).fill(g) : s(O);
            }
            u.alloc = function(O, g, w) {
              return m(O, g, w);
            };
            function d(O) {
              return p(O), s(O < 0 ? 0 : T(O) | 0);
            }
            u.allocUnsafe = function(O) {
              return d(O);
            }, u.allocUnsafeSlow = function(O) {
              return d(O);
            };
            function _(O, g) {
              if ((typeof g != "string" || g === "") && (g = "utf8"), !u.isEncoding(g))
                throw new TypeError("Unknown encoding: " + g);
              var w = A(O, g) | 0, S = s(w), J = S.write(O, g);
              return J !== w && (S = S.slice(0, J)), S;
            }
            function v(O) {
              for (var g = O.length < 0 ? 0 : T(O.length) | 0, w = s(g), S = 0; S < g; S += 1)
                w[S] = O[S] & 255;
              return w;
            }
            function k(O, g, w) {
              if (g < 0 || O.byteLength < g)
                throw new RangeError('"offset" is outside of buffer bounds');
              if (O.byteLength < g + (w || 0))
                throw new RangeError('"length" is outside of buffer bounds');
              var S;
              return g === void 0 && w === void 0 ? S = new Uint8Array(O) : w === void 0 ? S = new Uint8Array(O, g) : S = new Uint8Array(O, g, w), S.__proto__ = u.prototype, S;
            }
            function E(O) {
              if (u.isBuffer(O)) {
                var g = T(O.length) | 0, w = s(g);
                return w.length === 0 || O.copy(w, 0, 0, g), w;
              }
              if (O.length !== void 0)
                return typeof O.length != "number" || z(O.length) ? s(0) : v(O);
              if (O.type === "Buffer" && Array.isArray(O.data))
                return v(O.data);
            }
            function T(O) {
              if (O >= f)
                throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + f.toString(16) + " bytes");
              return O | 0;
            }
            function x(O) {
              return +O != O && (O = 0), u.alloc(+O);
            }
            u.isBuffer = function(g) {
              return g != null && g._isBuffer === !0 && g !== u.prototype;
            }, u.compare = function(g, w) {
              if (F(g, Uint8Array) && (g = u.from(g, g.offset, g.byteLength)), F(w, Uint8Array) && (w = u.from(w, w.offset, w.byteLength)), !u.isBuffer(g) || !u.isBuffer(w))
                throw new TypeError(
                  'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
                );
              if (g === w) return 0;
              for (var S = g.length, J = w.length, be = 0, _e = Math.min(S, J); be < _e; ++be)
                if (g[be] !== w[be]) {
                  S = g[be], J = w[be];
                  break;
                }
              return S < J ? -1 : J < S ? 1 : 0;
            }, u.isEncoding = function(g) {
              switch (String(g).toLowerCase()) {
                case "hex":
                case "utf8":
                case "utf-8":
                case "ascii":
                case "latin1":
                case "binary":
                case "base64":
                case "ucs2":
                case "ucs-2":
                case "utf16le":
                case "utf-16le":
                  return !0;
                default:
                  return !1;
              }
            }, u.concat = function(g, w) {
              if (!Array.isArray(g))
                throw new TypeError('"list" argument must be an Array of Buffers');
              if (g.length === 0)
                return u.alloc(0);
              var S;
              if (w === void 0)
                for (w = 0, S = 0; S < g.length; ++S)
                  w += g[S].length;
              var J = u.allocUnsafe(w), be = 0;
              for (S = 0; S < g.length; ++S) {
                var _e = g[S];
                if (F(_e, Uint8Array) && (_e = u.from(_e)), !u.isBuffer(_e))
                  throw new TypeError('"list" argument must be an Array of Buffers');
                _e.copy(J, be), be += _e.length;
              }
              return J;
            };
            function A(O, g) {
              if (u.isBuffer(O))
                return O.length;
              if (ArrayBuffer.isView(O) || F(O, ArrayBuffer))
                return O.byteLength;
              if (typeof O != "string")
                throw new TypeError(
                  'The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type ' + typeof O
                );
              var w = O.length, S = arguments.length > 2 && arguments[2] === !0;
              if (!S && w === 0) return 0;
              for (var J = !1; ; )
                switch (g) {
                  case "ascii":
                  case "latin1":
                  case "binary":
                    return w;
                  case "utf8":
                  case "utf-8":
                    return Y(O).length;
                  case "ucs2":
                  case "ucs-2":
                  case "utf16le":
                  case "utf-16le":
                    return w * 2;
                  case "hex":
                    return w >>> 1;
                  case "base64":
                    return Se(O).length;
                  default:
                    if (J)
                      return S ? -1 : Y(O).length;
                    g = ("" + g).toLowerCase(), J = !0;
                }
            }
            u.byteLength = A;
            function I(O, g, w) {
              var S = !1;
              if ((g === void 0 || g < 0) && (g = 0), g > this.length || ((w === void 0 || w > this.length) && (w = this.length), w <= 0) || (w >>>= 0, g >>>= 0, w <= g))
                return "";
              for (O || (O = "utf8"); ; )
                switch (O) {
                  case "hex":
                    return H(this, g, w);
                  case "utf8":
                  case "utf-8":
                    return D(this, g, w);
                  case "ascii":
                    return oe(this, g, w);
                  case "latin1":
                  case "binary":
                    return ae(this, g, w);
                  case "base64":
                    return P(this, g, w);
                  case "ucs2":
                  case "ucs-2":
                  case "utf16le":
                  case "utf-16le":
                    return X(this, g, w);
                  default:
                    if (S) throw new TypeError("Unknown encoding: " + O);
                    O = (O + "").toLowerCase(), S = !0;
                }
            }
            u.prototype._isBuffer = !0;
            function R(O, g, w) {
              var S = O[g];
              O[g] = O[w], O[w] = S;
            }
            u.prototype.swap16 = function() {
              var g = this.length;
              if (g % 2 !== 0)
                throw new RangeError("Buffer size must be a multiple of 16-bits");
              for (var w = 0; w < g; w += 2)
                R(this, w, w + 1);
              return this;
            }, u.prototype.swap32 = function() {
              var g = this.length;
              if (g % 4 !== 0)
                throw new RangeError("Buffer size must be a multiple of 32-bits");
              for (var w = 0; w < g; w += 4)
                R(this, w, w + 3), R(this, w + 1, w + 2);
              return this;
            }, u.prototype.swap64 = function() {
              var g = this.length;
              if (g % 8 !== 0)
                throw new RangeError("Buffer size must be a multiple of 64-bits");
              for (var w = 0; w < g; w += 8)
                R(this, w, w + 7), R(this, w + 1, w + 6), R(this, w + 2, w + 5), R(this, w + 3, w + 4);
              return this;
            }, u.prototype.toString = function() {
              var g = this.length;
              return g === 0 ? "" : arguments.length === 0 ? D(this, 0, g) : I.apply(this, arguments);
            }, u.prototype.toLocaleString = u.prototype.toString, u.prototype.equals = function(g) {
              if (!u.isBuffer(g)) throw new TypeError("Argument must be a Buffer");
              return this === g ? !0 : u.compare(this, g) === 0;
            }, u.prototype.inspect = function() {
              var g = "", w = n.INSPECT_MAX_BYTES;
              return g = this.toString("hex", 0, w).replace(/(.{2})/g, "$1 ").trim(), this.length > w && (g += " ... "), "<Buffer " + g + ">";
            }, u.prototype.compare = function(g, w, S, J, be) {
              if (F(g, Uint8Array) && (g = u.from(g, g.offset, g.byteLength)), !u.isBuffer(g))
                throw new TypeError(
                  'The "target" argument must be one of type Buffer or Uint8Array. Received type ' + typeof g
                );
              if (w === void 0 && (w = 0), S === void 0 && (S = g ? g.length : 0), J === void 0 && (J = 0), be === void 0 && (be = this.length), w < 0 || S > g.length || J < 0 || be > this.length)
                throw new RangeError("out of range index");
              if (J >= be && w >= S)
                return 0;
              if (J >= be)
                return -1;
              if (w >= S)
                return 1;
              if (w >>>= 0, S >>>= 0, J >>>= 0, be >>>= 0, this === g) return 0;
              for (var _e = be - J, Oe = S - w, Be = Math.min(_e, Oe), De = this.slice(J, be), He = g.slice(w, S), Fe = 0; Fe < Be; ++Fe)
                if (De[Fe] !== He[Fe]) {
                  _e = De[Fe], Oe = He[Fe];
                  break;
                }
              return _e < Oe ? -1 : Oe < _e ? 1 : 0;
            };
            function M(O, g, w, S, J) {
              if (O.length === 0) return -1;
              if (typeof w == "string" ? (S = w, w = 0) : w > 2147483647 ? w = 2147483647 : w < -2147483648 && (w = -2147483648), w = +w, z(w) && (w = J ? 0 : O.length - 1), w < 0 && (w = O.length + w), w >= O.length) {
                if (J) return -1;
                w = O.length - 1;
              } else if (w < 0)
                if (J) w = 0;
                else return -1;
              if (typeof g == "string" && (g = u.from(g, S)), u.isBuffer(g))
                return g.length === 0 ? -1 : b(O, g, w, S, J);
              if (typeof g == "number")
                return g = g & 255, typeof Uint8Array.prototype.indexOf == "function" ? J ? Uint8Array.prototype.indexOf.call(O, g, w) : Uint8Array.prototype.lastIndexOf.call(O, g, w) : b(O, [g], w, S, J);
              throw new TypeError("val must be string, number or Buffer");
            }
            function b(O, g, w, S, J) {
              var be = 1, _e = O.length, Oe = g.length;
              if (S !== void 0 && (S = String(S).toLowerCase(), S === "ucs2" || S === "ucs-2" || S === "utf16le" || S === "utf-16le")) {
                if (O.length < 2 || g.length < 2)
                  return -1;
                be = 2, _e /= 2, Oe /= 2, w /= 2;
              }
              function Be(qe, tt) {
                return be === 1 ? qe[tt] : qe.readUInt16BE(tt * be);
              }
              var De;
              if (J) {
                var He = -1;
                for (De = w; De < _e; De++)
                  if (Be(O, De) === Be(g, He === -1 ? 0 : De - He)) {
                    if (He === -1 && (He = De), De - He + 1 === Oe) return He * be;
                  } else
                    He !== -1 && (De -= De - He), He = -1;
              } else
                for (w + Oe > _e && (w = _e - Oe), De = w; De >= 0; De--) {
                  for (var Fe = !0, ht = 0; ht < Oe; ht++)
                    if (Be(O, De + ht) !== Be(g, ht)) {
                      Fe = !1;
                      break;
                    }
                  if (Fe) return De;
                }
              return -1;
            }
            u.prototype.includes = function(g, w, S) {
              return this.indexOf(g, w, S) !== -1;
            }, u.prototype.indexOf = function(g, w, S) {
              return M(this, g, w, S, !0);
            }, u.prototype.lastIndexOf = function(g, w, S) {
              return M(this, g, w, S, !1);
            };
            function N(O, g, w, S) {
              w = Number(w) || 0;
              var J = O.length - w;
              S ? (S = Number(S), S > J && (S = J)) : S = J;
              var be = g.length;
              S > be / 2 && (S = be / 2);
              for (var _e = 0; _e < S; ++_e) {
                var Oe = parseInt(g.substr(_e * 2, 2), 16);
                if (z(Oe)) return _e;
                O[w + _e] = Oe;
              }
              return _e;
            }
            function j(O, g, w, S) {
              return Te(Y(g, O.length - w), O, w, S);
            }
            function $(O, g, w, S) {
              return Te(q(g), O, w, S);
            }
            function re(O, g, w, S) {
              return $(O, g, w, S);
            }
            function ne(O, g, w, S) {
              return Te(Se(g), O, w, S);
            }
            function U(O, g, w, S) {
              return Te(he(g, O.length - w), O, w, S);
            }
            u.prototype.write = function(g, w, S, J) {
              if (w === void 0)
                J = "utf8", S = this.length, w = 0;
              else if (S === void 0 && typeof w == "string")
                J = w, S = this.length, w = 0;
              else if (isFinite(w))
                w = w >>> 0, isFinite(S) ? (S = S >>> 0, J === void 0 && (J = "utf8")) : (J = S, S = void 0);
              else
                throw new Error(
                  "Buffer.write(string, encoding, offset[, length]) is no longer supported"
                );
              var be = this.length - w;
              if ((S === void 0 || S > be) && (S = be), g.length > 0 && (S < 0 || w < 0) || w > this.length)
                throw new RangeError("Attempt to write outside buffer bounds");
              J || (J = "utf8");
              for (var _e = !1; ; )
                switch (J) {
                  case "hex":
                    return N(this, g, w, S);
                  case "utf8":
                  case "utf-8":
                    return j(this, g, w, S);
                  case "ascii":
                    return $(this, g, w, S);
                  case "latin1":
                  case "binary":
                    return re(this, g, w, S);
                  case "base64":
                    return ne(this, g, w, S);
                  case "ucs2":
                  case "ucs-2":
                  case "utf16le":
                  case "utf-16le":
                    return U(this, g, w, S);
                  default:
                    if (_e) throw new TypeError("Unknown encoding: " + J);
                    J = ("" + J).toLowerCase(), _e = !0;
                }
            }, u.prototype.toJSON = function() {
              return {
                type: "Buffer",
                data: Array.prototype.slice.call(this._arr || this, 0)
              };
            };
            function P(O, g, w) {
              return g === 0 && w === O.length ? a.fromByteArray(O) : a.fromByteArray(O.slice(g, w));
            }
            function D(O, g, w) {
              w = Math.min(O.length, w);
              for (var S = [], J = g; J < w; ) {
                var be = O[J], _e = null, Oe = be > 239 ? 4 : be > 223 ? 3 : be > 191 ? 2 : 1;
                if (J + Oe <= w) {
                  var Be, De, He, Fe;
                  switch (Oe) {
                    case 1:
                      be < 128 && (_e = be);
                      break;
                    case 2:
                      Be = O[J + 1], (Be & 192) === 128 && (Fe = (be & 31) << 6 | Be & 63, Fe > 127 && (_e = Fe));
                      break;
                    case 3:
                      Be = O[J + 1], De = O[J + 2], (Be & 192) === 128 && (De & 192) === 128 && (Fe = (be & 15) << 12 | (Be & 63) << 6 | De & 63, Fe > 2047 && (Fe < 55296 || Fe > 57343) && (_e = Fe));
                      break;
                    case 4:
                      Be = O[J + 1], De = O[J + 2], He = O[J + 3], (Be & 192) === 128 && (De & 192) === 128 && (He & 192) === 128 && (Fe = (be & 15) << 18 | (Be & 63) << 12 | (De & 63) << 6 | He & 63, Fe > 65535 && Fe < 1114112 && (_e = Fe));
                  }
                }
                _e === null ? (_e = 65533, Oe = 1) : _e > 65535 && (_e -= 65536, S.push(_e >>> 10 & 1023 | 55296), _e = 56320 | _e & 1023), S.push(_e), J += Oe;
              }
              return W(S);
            }
            var Q = 4096;
            function W(O) {
              var g = O.length;
              if (g <= Q)
                return String.fromCharCode.apply(String, O);
              for (var w = "", S = 0; S < g; )
                w += String.fromCharCode.apply(
                  String,
                  O.slice(S, S += Q)
                );
              return w;
            }
            function oe(O, g, w) {
              var S = "";
              w = Math.min(O.length, w);
              for (var J = g; J < w; ++J)
                S += String.fromCharCode(O[J] & 127);
              return S;
            }
            function ae(O, g, w) {
              var S = "";
              w = Math.min(O.length, w);
              for (var J = g; J < w; ++J)
                S += String.fromCharCode(O[J]);
              return S;
            }
            function H(O, g, w) {
              var S = O.length;
              (!g || g < 0) && (g = 0), (!w || w < 0 || w > S) && (w = S);
              for (var J = "", be = g; be < w; ++be)
                J += ue(O[be]);
              return J;
            }
            function X(O, g, w) {
              for (var S = O.slice(g, w), J = "", be = 0; be < S.length; be += 2)
                J += String.fromCharCode(S[be] + S[be + 1] * 256);
              return J;
            }
            u.prototype.slice = function(g, w) {
              var S = this.length;
              g = ~~g, w = w === void 0 ? S : ~~w, g < 0 ? (g += S, g < 0 && (g = 0)) : g > S && (g = S), w < 0 ? (w += S, w < 0 && (w = 0)) : w > S && (w = S), w < g && (w = g);
              var J = this.subarray(g, w);
              return J.__proto__ = u.prototype, J;
            };
            function ie(O, g, w) {
              if (O % 1 !== 0 || O < 0) throw new RangeError("offset is not uint");
              if (O + g > w) throw new RangeError("Trying to access beyond buffer length");
            }
            u.prototype.readUIntLE = function(g, w, S) {
              g = g >>> 0, w = w >>> 0, S || ie(g, w, this.length);
              for (var J = this[g], be = 1, _e = 0; ++_e < w && (be *= 256); )
                J += this[g + _e] * be;
              return J;
            }, u.prototype.readUIntBE = function(g, w, S) {
              g = g >>> 0, w = w >>> 0, S || ie(g, w, this.length);
              for (var J = this[g + --w], be = 1; w > 0 && (be *= 256); )
                J += this[g + --w] * be;
              return J;
            }, u.prototype.readUInt8 = function(g, w) {
              return g = g >>> 0, w || ie(g, 1, this.length), this[g];
            }, u.prototype.readUInt16LE = function(g, w) {
              return g = g >>> 0, w || ie(g, 2, this.length), this[g] | this[g + 1] << 8;
            }, u.prototype.readUInt16BE = function(g, w) {
              return g = g >>> 0, w || ie(g, 2, this.length), this[g] << 8 | this[g + 1];
            }, u.prototype.readUInt32LE = function(g, w) {
              return g = g >>> 0, w || ie(g, 4, this.length), (this[g] | this[g + 1] << 8 | this[g + 2] << 16) + this[g + 3] * 16777216;
            }, u.prototype.readUInt32BE = function(g, w) {
              return g = g >>> 0, w || ie(g, 4, this.length), this[g] * 16777216 + (this[g + 1] << 16 | this[g + 2] << 8 | this[g + 3]);
            }, u.prototype.readIntLE = function(g, w, S) {
              g = g >>> 0, w = w >>> 0, S || ie(g, w, this.length);
              for (var J = this[g], be = 1, _e = 0; ++_e < w && (be *= 256); )
                J += this[g + _e] * be;
              return be *= 128, J >= be && (J -= Math.pow(2, 8 * w)), J;
            }, u.prototype.readIntBE = function(g, w, S) {
              g = g >>> 0, w = w >>> 0, S || ie(g, w, this.length);
              for (var J = w, be = 1, _e = this[g + --J]; J > 0 && (be *= 256); )
                _e += this[g + --J] * be;
              return be *= 128, _e >= be && (_e -= Math.pow(2, 8 * w)), _e;
            }, u.prototype.readInt8 = function(g, w) {
              return g = g >>> 0, w || ie(g, 1, this.length), this[g] & 128 ? (255 - this[g] + 1) * -1 : this[g];
            }, u.prototype.readInt16LE = function(g, w) {
              g = g >>> 0, w || ie(g, 2, this.length);
              var S = this[g] | this[g + 1] << 8;
              return S & 32768 ? S | 4294901760 : S;
            }, u.prototype.readInt16BE = function(g, w) {
              g = g >>> 0, w || ie(g, 2, this.length);
              var S = this[g + 1] | this[g] << 8;
              return S & 32768 ? S | 4294901760 : S;
            }, u.prototype.readInt32LE = function(g, w) {
              return g = g >>> 0, w || ie(g, 4, this.length), this[g] | this[g + 1] << 8 | this[g + 2] << 16 | this[g + 3] << 24;
            }, u.prototype.readInt32BE = function(g, w) {
              return g = g >>> 0, w || ie(g, 4, this.length), this[g] << 24 | this[g + 1] << 16 | this[g + 2] << 8 | this[g + 3];
            }, u.prototype.readFloatLE = function(g, w) {
              return g = g >>> 0, w || ie(g, 4, this.length), l.read(this, g, !0, 23, 4);
            }, u.prototype.readFloatBE = function(g, w) {
              return g = g >>> 0, w || ie(g, 4, this.length), l.read(this, g, !1, 23, 4);
            }, u.prototype.readDoubleLE = function(g, w) {
              return g = g >>> 0, w || ie(g, 8, this.length), l.read(this, g, !0, 52, 8);
            }, u.prototype.readDoubleBE = function(g, w) {
              return g = g >>> 0, w || ie(g, 8, this.length), l.read(this, g, !1, 52, 8);
            };
            function pe(O, g, w, S, J, be) {
              if (!u.isBuffer(O)) throw new TypeError('"buffer" argument must be a Buffer instance');
              if (g > J || g < be) throw new RangeError('"value" argument is out of bounds');
              if (w + S > O.length) throw new RangeError("Index out of range");
            }
            u.prototype.writeUIntLE = function(g, w, S, J) {
              if (g = +g, w = w >>> 0, S = S >>> 0, !J) {
                var be = Math.pow(2, 8 * S) - 1;
                pe(this, g, w, S, be, 0);
              }
              var _e = 1, Oe = 0;
              for (this[w] = g & 255; ++Oe < S && (_e *= 256); )
                this[w + Oe] = g / _e & 255;
              return w + S;
            }, u.prototype.writeUIntBE = function(g, w, S, J) {
              if (g = +g, w = w >>> 0, S = S >>> 0, !J) {
                var be = Math.pow(2, 8 * S) - 1;
                pe(this, g, w, S, be, 0);
              }
              var _e = S - 1, Oe = 1;
              for (this[w + _e] = g & 255; --_e >= 0 && (Oe *= 256); )
                this[w + _e] = g / Oe & 255;
              return w + S;
            }, u.prototype.writeUInt8 = function(g, w, S) {
              return g = +g, w = w >>> 0, S || pe(this, g, w, 1, 255, 0), this[w] = g & 255, w + 1;
            }, u.prototype.writeUInt16LE = function(g, w, S) {
              return g = +g, w = w >>> 0, S || pe(this, g, w, 2, 65535, 0), this[w] = g & 255, this[w + 1] = g >>> 8, w + 2;
            }, u.prototype.writeUInt16BE = function(g, w, S) {
              return g = +g, w = w >>> 0, S || pe(this, g, w, 2, 65535, 0), this[w] = g >>> 8, this[w + 1] = g & 255, w + 2;
            }, u.prototype.writeUInt32LE = function(g, w, S) {
              return g = +g, w = w >>> 0, S || pe(this, g, w, 4, 4294967295, 0), this[w + 3] = g >>> 24, this[w + 2] = g >>> 16, this[w + 1] = g >>> 8, this[w] = g & 255, w + 4;
            }, u.prototype.writeUInt32BE = function(g, w, S) {
              return g = +g, w = w >>> 0, S || pe(this, g, w, 4, 4294967295, 0), this[w] = g >>> 24, this[w + 1] = g >>> 16, this[w + 2] = g >>> 8, this[w + 3] = g & 255, w + 4;
            }, u.prototype.writeIntLE = function(g, w, S, J) {
              if (g = +g, w = w >>> 0, !J) {
                var be = Math.pow(2, 8 * S - 1);
                pe(this, g, w, S, be - 1, -be);
              }
              var _e = 0, Oe = 1, Be = 0;
              for (this[w] = g & 255; ++_e < S && (Oe *= 256); )
                g < 0 && Be === 0 && this[w + _e - 1] !== 0 && (Be = 1), this[w + _e] = (g / Oe >> 0) - Be & 255;
              return w + S;
            }, u.prototype.writeIntBE = function(g, w, S, J) {
              if (g = +g, w = w >>> 0, !J) {
                var be = Math.pow(2, 8 * S - 1);
                pe(this, g, w, S, be - 1, -be);
              }
              var _e = S - 1, Oe = 1, Be = 0;
              for (this[w + _e] = g & 255; --_e >= 0 && (Oe *= 256); )
                g < 0 && Be === 0 && this[w + _e + 1] !== 0 && (Be = 1), this[w + _e] = (g / Oe >> 0) - Be & 255;
              return w + S;
            }, u.prototype.writeInt8 = function(g, w, S) {
              return g = +g, w = w >>> 0, S || pe(this, g, w, 1, 127, -128), g < 0 && (g = 255 + g + 1), this[w] = g & 255, w + 1;
            }, u.prototype.writeInt16LE = function(g, w, S) {
              return g = +g, w = w >>> 0, S || pe(this, g, w, 2, 32767, -32768), this[w] = g & 255, this[w + 1] = g >>> 8, w + 2;
            }, u.prototype.writeInt16BE = function(g, w, S) {
              return g = +g, w = w >>> 0, S || pe(this, g, w, 2, 32767, -32768), this[w] = g >>> 8, this[w + 1] = g & 255, w + 2;
            }, u.prototype.writeInt32LE = function(g, w, S) {
              return g = +g, w = w >>> 0, S || pe(this, g, w, 4, 2147483647, -2147483648), this[w] = g & 255, this[w + 1] = g >>> 8, this[w + 2] = g >>> 16, this[w + 3] = g >>> 24, w + 4;
            }, u.prototype.writeInt32BE = function(g, w, S) {
              return g = +g, w = w >>> 0, S || pe(this, g, w, 4, 2147483647, -2147483648), g < 0 && (g = 4294967295 + g + 1), this[w] = g >>> 24, this[w + 1] = g >>> 16, this[w + 2] = g >>> 8, this[w + 3] = g & 255, w + 4;
            };
            function Z(O, g, w, S, J, be) {
              if (w + S > O.length) throw new RangeError("Index out of range");
              if (w < 0) throw new RangeError("Index out of range");
            }
            function K(O, g, w, S, J) {
              return g = +g, w = w >>> 0, J || Z(O, g, w, 4), l.write(O, g, w, S, 23, 4), w + 4;
            }
            u.prototype.writeFloatLE = function(g, w, S) {
              return K(this, g, w, !0, S);
            }, u.prototype.writeFloatBE = function(g, w, S) {
              return K(this, g, w, !1, S);
            };
            function ee(O, g, w, S, J) {
              return g = +g, w = w >>> 0, J || Z(O, g, w, 8), l.write(O, g, w, S, 52, 8), w + 8;
            }
            u.prototype.writeDoubleLE = function(g, w, S) {
              return ee(this, g, w, !0, S);
            }, u.prototype.writeDoubleBE = function(g, w, S) {
              return ee(this, g, w, !1, S);
            }, u.prototype.copy = function(g, w, S, J) {
              if (!u.isBuffer(g)) throw new TypeError("argument should be a Buffer");
              if (S || (S = 0), !J && J !== 0 && (J = this.length), w >= g.length && (w = g.length), w || (w = 0), J > 0 && J < S && (J = S), J === S || g.length === 0 || this.length === 0) return 0;
              if (w < 0)
                throw new RangeError("targetStart out of bounds");
              if (S < 0 || S >= this.length) throw new RangeError("Index out of range");
              if (J < 0) throw new RangeError("sourceEnd out of bounds");
              J > this.length && (J = this.length), g.length - w < J - S && (J = g.length - w + S);
              var be = J - S;
              if (this === g && typeof Uint8Array.prototype.copyWithin == "function")
                this.copyWithin(w, S, J);
              else if (this === g && S < w && w < J)
                for (var _e = be - 1; _e >= 0; --_e)
                  g[_e + w] = this[_e + S];
              else
                Uint8Array.prototype.set.call(
                  g,
                  this.subarray(S, J),
                  w
                );
              return be;
            }, u.prototype.fill = function(g, w, S, J) {
              if (typeof g == "string") {
                if (typeof w == "string" ? (J = w, w = 0, S = this.length) : typeof S == "string" && (J = S, S = this.length), J !== void 0 && typeof J != "string")
                  throw new TypeError("encoding must be a string");
                if (typeof J == "string" && !u.isEncoding(J))
                  throw new TypeError("Unknown encoding: " + J);
                if (g.length === 1) {
                  var be = g.charCodeAt(0);
                  (J === "utf8" && be < 128 || J === "latin1") && (g = be);
                }
              } else typeof g == "number" && (g = g & 255);
              if (w < 0 || this.length < w || this.length < S)
                throw new RangeError("Out of range index");
              if (S <= w)
                return this;
              w = w >>> 0, S = S === void 0 ? this.length : S >>> 0, g || (g = 0);
              var _e;
              if (typeof g == "number")
                for (_e = w; _e < S; ++_e)
                  this[_e] = g;
              else {
                var Oe = u.isBuffer(g) ? g : u.from(g, J), Be = Oe.length;
                if (Be === 0)
                  throw new TypeError('The value "' + g + '" is invalid for argument "value"');
                for (_e = 0; _e < S - w; ++_e)
                  this[_e + w] = Oe[_e % Be];
              }
              return this;
            };
            var de = /[^+/0-9A-Za-z-_]/g;
            function ge(O) {
              if (O = O.split("=")[0], O = O.trim().replace(de, ""), O.length < 2) return "";
              for (; O.length % 4 !== 0; )
                O = O + "=";
              return O;
            }
            function ue(O) {
              return O < 16 ? "0" + O.toString(16) : O.toString(16);
            }
            function Y(O, g) {
              g = g || 1 / 0;
              for (var w, S = O.length, J = null, be = [], _e = 0; _e < S; ++_e) {
                if (w = O.charCodeAt(_e), w > 55295 && w < 57344) {
                  if (!J) {
                    if (w > 56319) {
                      (g -= 3) > -1 && be.push(239, 191, 189);
                      continue;
                    } else if (_e + 1 === S) {
                      (g -= 3) > -1 && be.push(239, 191, 189);
                      continue;
                    }
                    J = w;
                    continue;
                  }
                  if (w < 56320) {
                    (g -= 3) > -1 && be.push(239, 191, 189), J = w;
                    continue;
                  }
                  w = (J - 55296 << 10 | w - 56320) + 65536;
                } else J && (g -= 3) > -1 && be.push(239, 191, 189);
                if (J = null, w < 128) {
                  if ((g -= 1) < 0) break;
                  be.push(w);
                } else if (w < 2048) {
                  if ((g -= 2) < 0) break;
                  be.push(
                    w >> 6 | 192,
                    w & 63 | 128
                  );
                } else if (w < 65536) {
                  if ((g -= 3) < 0) break;
                  be.push(
                    w >> 12 | 224,
                    w >> 6 & 63 | 128,
                    w & 63 | 128
                  );
                } else if (w < 1114112) {
                  if ((g -= 4) < 0) break;
                  be.push(
                    w >> 18 | 240,
                    w >> 12 & 63 | 128,
                    w >> 6 & 63 | 128,
                    w & 63 | 128
                  );
                } else
                  throw new Error("Invalid code point");
              }
              return be;
            }
            function q(O) {
              for (var g = [], w = 0; w < O.length; ++w)
                g.push(O.charCodeAt(w) & 255);
              return g;
            }
            function he(O, g) {
              for (var w, S, J, be = [], _e = 0; _e < O.length && !((g -= 2) < 0); ++_e)
                w = O.charCodeAt(_e), S = w >> 8, J = w % 256, be.push(J), be.push(S);
              return be;
            }
            function Se(O) {
              return a.toByteArray(ge(O));
            }
            function Te(O, g, w, S) {
              for (var J = 0; J < S && !(J + w >= g.length || J >= O.length); ++J)
                g[J + w] = O[J];
              return J;
            }
            function F(O, g) {
              return O instanceof g || O != null && O.constructor != null && O.constructor.name != null && O.constructor.name === g.name;
            }
            function z(O) {
              return O !== O;
            }
          }).call(this);
        }).call(this, r("buffer").Buffer);
      }, { "base64-js": 28, buffer: 32, ieee754: 45 }], 33: [function(r, i, n) {
        var o = r("get-intrinsic"), a = r("./"), l = a(o("String.prototype.indexOf"));
        i.exports = function(h, s) {
          var u = o(h, !!s);
          return typeof u == "function" && l(h, ".prototype.") > -1 ? a(u) : u;
        };
      }, { "./": 34, "get-intrinsic": 39 }], 34: [function(r, i, n) {
        var o = r("function-bind"), a = r("get-intrinsic"), l = a("%Function.prototype.apply%"), f = a("%Function.prototype.call%"), h = a("%Reflect.apply%", !0) || o.call(f, l), s = a("%Object.getOwnPropertyDescriptor%", !0), u = a("%Object.defineProperty%", !0), c = a("%Math.max%");
        if (u)
          try {
            u({}, "a", { value: 1 });
          } catch {
            u = null;
          }
        i.exports = function(d) {
          var _ = h(o, f, arguments);
          if (s && u) {
            var v = s(_, "length");
            v.configurable && u(
              _,
              "length",
              { value: 1 + c(0, d.length - (arguments.length - 1)) }
            );
          }
          return _;
        };
        var p = function() {
          return h(o, l, arguments);
        };
        u ? u(i.exports, "apply", { value: p }) : i.exports.apply = p;
      }, { "function-bind": 38, "get-intrinsic": 39 }], 35: [function(r, i, n) {
        var o = typeof Reflect == "object" ? Reflect : null, a = o && typeof o.apply == "function" ? o.apply : function(b, N, j) {
          return Function.prototype.apply.call(b, N, j);
        }, l;
        o && typeof o.ownKeys == "function" ? l = o.ownKeys : Object.getOwnPropertySymbols ? l = function(b) {
          return Object.getOwnPropertyNames(b).concat(Object.getOwnPropertySymbols(b));
        } : l = function(b) {
          return Object.getOwnPropertyNames(b);
        };
        function f(M) {
          console && console.warn && console.warn(M);
        }
        var h = Number.isNaN || function(b) {
          return b !== b;
        };
        function s() {
          s.init.call(this);
        }
        i.exports = s, i.exports.once = A, s.EventEmitter = s, s.prototype._events = void 0, s.prototype._eventsCount = 0, s.prototype._maxListeners = void 0;
        var u = 10;
        function c(M) {
          if (typeof M != "function")
            throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof M);
        }
        Object.defineProperty(s, "defaultMaxListeners", {
          enumerable: !0,
          get: function() {
            return u;
          },
          set: function(M) {
            if (typeof M != "number" || M < 0 || h(M))
              throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + M + ".");
            u = M;
          }
        }), s.init = function() {
          (this._events === void 0 || this._events === Object.getPrototypeOf(this)._events) && (this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0), this._maxListeners = this._maxListeners || void 0;
        }, s.prototype.setMaxListeners = function(b) {
          if (typeof b != "number" || b < 0 || h(b))
            throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + b + ".");
          return this._maxListeners = b, this;
        };
        function p(M) {
          return M._maxListeners === void 0 ? s.defaultMaxListeners : M._maxListeners;
        }
        s.prototype.getMaxListeners = function() {
          return p(this);
        }, s.prototype.emit = function(b) {
          for (var N = [], j = 1; j < arguments.length; j++) N.push(arguments[j]);
          var $ = b === "error", re = this._events;
          if (re !== void 0)
            $ = $ && re.error === void 0;
          else if (!$)
            return !1;
          if ($) {
            var ne;
            if (N.length > 0 && (ne = N[0]), ne instanceof Error)
              throw ne;
            var U = new Error("Unhandled error." + (ne ? " (" + ne.message + ")" : ""));
            throw U.context = ne, U;
          }
          var P = re[b];
          if (P === void 0)
            return !1;
          if (typeof P == "function")
            a(P, this, N);
          else
            for (var D = P.length, Q = E(P, D), j = 0; j < D; ++j)
              a(Q[j], this, N);
          return !0;
        };
        function m(M, b, N, j) {
          var $, re, ne;
          if (c(N), re = M._events, re === void 0 ? (re = M._events = /* @__PURE__ */ Object.create(null), M._eventsCount = 0) : (re.newListener !== void 0 && (M.emit(
            "newListener",
            b,
            N.listener ? N.listener : N
          ), re = M._events), ne = re[b]), ne === void 0)
            ne = re[b] = N, ++M._eventsCount;
          else if (typeof ne == "function" ? ne = re[b] = j ? [N, ne] : [ne, N] : j ? ne.unshift(N) : ne.push(N), $ = p(M), $ > 0 && ne.length > $ && !ne.warned) {
            ne.warned = !0;
            var U = new Error("Possible EventEmitter memory leak detected. " + ne.length + " " + String(b) + " listeners added. Use emitter.setMaxListeners() to increase limit");
            U.name = "MaxListenersExceededWarning", U.emitter = M, U.type = b, U.count = ne.length, f(U);
          }
          return M;
        }
        s.prototype.addListener = function(b, N) {
          return m(this, b, N, !1);
        }, s.prototype.on = s.prototype.addListener, s.prototype.prependListener = function(b, N) {
          return m(this, b, N, !0);
        };
        function d() {
          if (!this.fired)
            return this.target.removeListener(this.type, this.wrapFn), this.fired = !0, arguments.length === 0 ? this.listener.call(this.target) : this.listener.apply(this.target, arguments);
        }
        function _(M, b, N) {
          var j = { fired: !1, wrapFn: void 0, target: M, type: b, listener: N }, $ = d.bind(j);
          return $.listener = N, j.wrapFn = $, $;
        }
        s.prototype.once = function(b, N) {
          return c(N), this.on(b, _(this, b, N)), this;
        }, s.prototype.prependOnceListener = function(b, N) {
          return c(N), this.prependListener(b, _(this, b, N)), this;
        }, s.prototype.removeListener = function(b, N) {
          var j, $, re, ne, U;
          if (c(N), $ = this._events, $ === void 0)
            return this;
          if (j = $[b], j === void 0)
            return this;
          if (j === N || j.listener === N)
            --this._eventsCount === 0 ? this._events = /* @__PURE__ */ Object.create(null) : (delete $[b], $.removeListener && this.emit("removeListener", b, j.listener || N));
          else if (typeof j != "function") {
            for (re = -1, ne = j.length - 1; ne >= 0; ne--)
              if (j[ne] === N || j[ne].listener === N) {
                U = j[ne].listener, re = ne;
                break;
              }
            if (re < 0)
              return this;
            re === 0 ? j.shift() : T(j, re), j.length === 1 && ($[b] = j[0]), $.removeListener !== void 0 && this.emit("removeListener", b, U || N);
          }
          return this;
        }, s.prototype.off = s.prototype.removeListener, s.prototype.removeAllListeners = function(b) {
          var N, j, $;
          if (j = this._events, j === void 0)
            return this;
          if (j.removeListener === void 0)
            return arguments.length === 0 ? (this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0) : j[b] !== void 0 && (--this._eventsCount === 0 ? this._events = /* @__PURE__ */ Object.create(null) : delete j[b]), this;
          if (arguments.length === 0) {
            var re = Object.keys(j), ne;
            for ($ = 0; $ < re.length; ++$)
              ne = re[$], ne !== "removeListener" && this.removeAllListeners(ne);
            return this.removeAllListeners("removeListener"), this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0, this;
          }
          if (N = j[b], typeof N == "function")
            this.removeListener(b, N);
          else if (N !== void 0)
            for ($ = N.length - 1; $ >= 0; $--)
              this.removeListener(b, N[$]);
          return this;
        };
        function v(M, b, N) {
          var j = M._events;
          if (j === void 0)
            return [];
          var $ = j[b];
          return $ === void 0 ? [] : typeof $ == "function" ? N ? [$.listener || $] : [$] : N ? x($) : E($, $.length);
        }
        s.prototype.listeners = function(b) {
          return v(this, b, !0);
        }, s.prototype.rawListeners = function(b) {
          return v(this, b, !1);
        }, s.listenerCount = function(M, b) {
          return typeof M.listenerCount == "function" ? M.listenerCount(b) : k.call(M, b);
        }, s.prototype.listenerCount = k;
        function k(M) {
          var b = this._events;
          if (b !== void 0) {
            var N = b[M];
            if (typeof N == "function")
              return 1;
            if (N !== void 0)
              return N.length;
          }
          return 0;
        }
        s.prototype.eventNames = function() {
          return this._eventsCount > 0 ? l(this._events) : [];
        };
        function E(M, b) {
          for (var N = new Array(b), j = 0; j < b; ++j)
            N[j] = M[j];
          return N;
        }
        function T(M, b) {
          for (; b + 1 < M.length; b++)
            M[b] = M[b + 1];
          M.pop();
        }
        function x(M) {
          for (var b = new Array(M.length), N = 0; N < b.length; ++N)
            b[N] = M[N].listener || M[N];
          return b;
        }
        function A(M, b) {
          return new Promise(function(N, j) {
            function $(ne) {
              M.removeListener(b, re), j(ne);
            }
            function re() {
              typeof M.removeListener == "function" && M.removeListener("error", $), N([].slice.call(arguments));
            }
            R(M, b, re, { once: !0 }), b !== "error" && I(M, $, { once: !0 });
          });
        }
        function I(M, b, N) {
          typeof M.on == "function" && R(M, "error", b, N);
        }
        function R(M, b, N, j) {
          if (typeof M.on == "function")
            j.once ? M.once(b, N) : M.on(b, N);
          else if (typeof M.addEventListener == "function")
            M.addEventListener(b, function $(re) {
              j.once && M.removeEventListener(b, $), N(re);
            });
          else
            throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof M);
        }
      }, {}], 36: [function(r, i, n) {
        var o = r("is-callable"), a = Object.prototype.toString, l = Object.prototype.hasOwnProperty, f = function(p, m, d) {
          for (var _ = 0, v = p.length; _ < v; _++)
            l.call(p, _) && (d == null ? m(p[_], _, p) : m.call(d, p[_], _, p));
        }, h = function(p, m, d) {
          for (var _ = 0, v = p.length; _ < v; _++)
            d == null ? m(p.charAt(_), _, p) : m.call(d, p.charAt(_), _, p);
        }, s = function(p, m, d) {
          for (var _ in p)
            l.call(p, _) && (d == null ? m(p[_], _, p) : m.call(d, p[_], _, p));
        }, u = function(p, m, d) {
          if (!o(m))
            throw new TypeError("iterator must be a function");
          var _;
          arguments.length >= 3 && (_ = d), a.call(p) === "[object Array]" ? f(p, m, _) : typeof p == "string" ? h(p, m, _) : s(p, m, _);
        };
        i.exports = u;
      }, { "is-callable": 48 }], 37: [function(r, i, n) {
        var o = "Function.prototype.bind called on incompatible ", a = Array.prototype.slice, l = Object.prototype.toString, f = "[object Function]";
        i.exports = function(s) {
          var u = this;
          if (typeof u != "function" || l.call(u) !== f)
            throw new TypeError(o + u);
          for (var c = a.call(arguments, 1), p, m = function() {
            if (this instanceof p) {
              var E = u.apply(
                this,
                c.concat(a.call(arguments))
              );
              return Object(E) === E ? E : this;
            } else
              return u.apply(
                s,
                c.concat(a.call(arguments))
              );
          }, d = Math.max(0, u.length - c.length), _ = [], v = 0; v < d; v++)
            _.push("$" + v);
          if (p = Function("binder", "return function (" + _.join(",") + "){ return binder.apply(this,arguments); }")(m), u.prototype) {
            var k = function() {
            };
            k.prototype = u.prototype, p.prototype = new k(), k.prototype = null;
          }
          return p;
        };
      }, {}], 38: [function(r, i, n) {
        var o = r("./implementation");
        i.exports = Function.prototype.bind || o;
      }, { "./implementation": 37 }], 39: [function(r, i, n) {
        var o, a = SyntaxError, l = Function, f = TypeError, h = function(U) {
          try {
            return l('"use strict"; return (' + U + ").constructor;")();
          } catch {
          }
        }, s = Object.getOwnPropertyDescriptor;
        if (s)
          try {
            s({}, "");
          } catch {
            s = null;
          }
        var u = function() {
          throw new f();
        }, c = s ? (function() {
          try {
            return arguments.callee, u;
          } catch {
            try {
              return s(arguments, "callee").get;
            } catch {
              return u;
            }
          }
        })() : u, p = r("has-symbols")(), m = Object.getPrototypeOf || function(U) {
          return U.__proto__;
        }, d = {}, _ = typeof Uint8Array > "u" ? o : m(Uint8Array), v = {
          "%AggregateError%": typeof AggregateError > "u" ? o : AggregateError,
          "%Array%": Array,
          "%ArrayBuffer%": typeof ArrayBuffer > "u" ? o : ArrayBuffer,
          "%ArrayIteratorPrototype%": p ? m([][Symbol.iterator]()) : o,
          "%AsyncFromSyncIteratorPrototype%": o,
          "%AsyncFunction%": d,
          "%AsyncGenerator%": d,
          "%AsyncGeneratorFunction%": d,
          "%AsyncIteratorPrototype%": d,
          "%Atomics%": typeof Atomics > "u" ? o : Atomics,
          "%BigInt%": typeof BigInt > "u" ? o : BigInt,
          "%BigInt64Array%": typeof BigInt64Array > "u" ? o : BigInt64Array,
          "%BigUint64Array%": typeof BigUint64Array > "u" ? o : BigUint64Array,
          "%Boolean%": Boolean,
          "%DataView%": typeof DataView > "u" ? o : DataView,
          "%Date%": Date,
          "%decodeURI%": decodeURI,
          "%decodeURIComponent%": decodeURIComponent,
          "%encodeURI%": encodeURI,
          "%encodeURIComponent%": encodeURIComponent,
          "%Error%": Error,
          "%eval%": eval,
          // eslint-disable-line no-eval
          "%EvalError%": EvalError,
          "%Float32Array%": typeof Float32Array > "u" ? o : Float32Array,
          "%Float64Array%": typeof Float64Array > "u" ? o : Float64Array,
          "%FinalizationRegistry%": typeof FinalizationRegistry > "u" ? o : FinalizationRegistry,
          "%Function%": l,
          "%GeneratorFunction%": d,
          "%Int8Array%": typeof Int8Array > "u" ? o : Int8Array,
          "%Int16Array%": typeof Int16Array > "u" ? o : Int16Array,
          "%Int32Array%": typeof Int32Array > "u" ? o : Int32Array,
          "%isFinite%": isFinite,
          "%isNaN%": isNaN,
          "%IteratorPrototype%": p ? m(m([][Symbol.iterator]())) : o,
          "%JSON%": typeof JSON == "object" ? JSON : o,
          "%Map%": typeof Map > "u" ? o : Map,
          "%MapIteratorPrototype%": typeof Map > "u" || !p ? o : m((/* @__PURE__ */ new Map())[Symbol.iterator]()),
          "%Math%": Math,
          "%Number%": Number,
          "%Object%": Object,
          "%parseFloat%": parseFloat,
          "%parseInt%": parseInt,
          "%Promise%": typeof Promise > "u" ? o : Promise,
          "%Proxy%": typeof Proxy > "u" ? o : Proxy,
          "%RangeError%": RangeError,
          "%ReferenceError%": ReferenceError,
          "%Reflect%": typeof Reflect > "u" ? o : Reflect,
          "%RegExp%": RegExp,
          "%Set%": typeof Set > "u" ? o : Set,
          "%SetIteratorPrototype%": typeof Set > "u" || !p ? o : m((/* @__PURE__ */ new Set())[Symbol.iterator]()),
          "%SharedArrayBuffer%": typeof SharedArrayBuffer > "u" ? o : SharedArrayBuffer,
          "%String%": String,
          "%StringIteratorPrototype%": p ? m(""[Symbol.iterator]()) : o,
          "%Symbol%": p ? Symbol : o,
          "%SyntaxError%": a,
          "%ThrowTypeError%": c,
          "%TypedArray%": _,
          "%TypeError%": f,
          "%Uint8Array%": typeof Uint8Array > "u" ? o : Uint8Array,
          "%Uint8ClampedArray%": typeof Uint8ClampedArray > "u" ? o : Uint8ClampedArray,
          "%Uint16Array%": typeof Uint16Array > "u" ? o : Uint16Array,
          "%Uint32Array%": typeof Uint32Array > "u" ? o : Uint32Array,
          "%URIError%": URIError,
          "%WeakMap%": typeof WeakMap > "u" ? o : WeakMap,
          "%WeakRef%": typeof WeakRef > "u" ? o : WeakRef,
          "%WeakSet%": typeof WeakSet > "u" ? o : WeakSet
        };
        try {
          null.error;
        } catch (U) {
          var k = m(m(U));
          v["%Error.prototype%"] = k;
        }
        var E = function U(P) {
          var D;
          if (P === "%AsyncFunction%")
            D = h("async function () {}");
          else if (P === "%GeneratorFunction%")
            D = h("function* () {}");
          else if (P === "%AsyncGeneratorFunction%")
            D = h("async function* () {}");
          else if (P === "%AsyncGenerator%") {
            var Q = U("%AsyncGeneratorFunction%");
            Q && (D = Q.prototype);
          } else if (P === "%AsyncIteratorPrototype%") {
            var W = U("%AsyncGenerator%");
            W && (D = m(W.prototype));
          }
          return v[P] = D, D;
        }, T = {
          "%ArrayBufferPrototype%": ["ArrayBuffer", "prototype"],
          "%ArrayPrototype%": ["Array", "prototype"],
          "%ArrayProto_entries%": ["Array", "prototype", "entries"],
          "%ArrayProto_forEach%": ["Array", "prototype", "forEach"],
          "%ArrayProto_keys%": ["Array", "prototype", "keys"],
          "%ArrayProto_values%": ["Array", "prototype", "values"],
          "%AsyncFunctionPrototype%": ["AsyncFunction", "prototype"],
          "%AsyncGenerator%": ["AsyncGeneratorFunction", "prototype"],
          "%AsyncGeneratorPrototype%": ["AsyncGeneratorFunction", "prototype", "prototype"],
          "%BooleanPrototype%": ["Boolean", "prototype"],
          "%DataViewPrototype%": ["DataView", "prototype"],
          "%DatePrototype%": ["Date", "prototype"],
          "%ErrorPrototype%": ["Error", "prototype"],
          "%EvalErrorPrototype%": ["EvalError", "prototype"],
          "%Float32ArrayPrototype%": ["Float32Array", "prototype"],
          "%Float64ArrayPrototype%": ["Float64Array", "prototype"],
          "%FunctionPrototype%": ["Function", "prototype"],
          "%Generator%": ["GeneratorFunction", "prototype"],
          "%GeneratorPrototype%": ["GeneratorFunction", "prototype", "prototype"],
          "%Int8ArrayPrototype%": ["Int8Array", "prototype"],
          "%Int16ArrayPrototype%": ["Int16Array", "prototype"],
          "%Int32ArrayPrototype%": ["Int32Array", "prototype"],
          "%JSONParse%": ["JSON", "parse"],
          "%JSONStringify%": ["JSON", "stringify"],
          "%MapPrototype%": ["Map", "prototype"],
          "%NumberPrototype%": ["Number", "prototype"],
          "%ObjectPrototype%": ["Object", "prototype"],
          "%ObjProto_toString%": ["Object", "prototype", "toString"],
          "%ObjProto_valueOf%": ["Object", "prototype", "valueOf"],
          "%PromisePrototype%": ["Promise", "prototype"],
          "%PromiseProto_then%": ["Promise", "prototype", "then"],
          "%Promise_all%": ["Promise", "all"],
          "%Promise_reject%": ["Promise", "reject"],
          "%Promise_resolve%": ["Promise", "resolve"],
          "%RangeErrorPrototype%": ["RangeError", "prototype"],
          "%ReferenceErrorPrototype%": ["ReferenceError", "prototype"],
          "%RegExpPrototype%": ["RegExp", "prototype"],
          "%SetPrototype%": ["Set", "prototype"],
          "%SharedArrayBufferPrototype%": ["SharedArrayBuffer", "prototype"],
          "%StringPrototype%": ["String", "prototype"],
          "%SymbolPrototype%": ["Symbol", "prototype"],
          "%SyntaxErrorPrototype%": ["SyntaxError", "prototype"],
          "%TypedArrayPrototype%": ["TypedArray", "prototype"],
          "%TypeErrorPrototype%": ["TypeError", "prototype"],
          "%Uint8ArrayPrototype%": ["Uint8Array", "prototype"],
          "%Uint8ClampedArrayPrototype%": ["Uint8ClampedArray", "prototype"],
          "%Uint16ArrayPrototype%": ["Uint16Array", "prototype"],
          "%Uint32ArrayPrototype%": ["Uint32Array", "prototype"],
          "%URIErrorPrototype%": ["URIError", "prototype"],
          "%WeakMapPrototype%": ["WeakMap", "prototype"],
          "%WeakSetPrototype%": ["WeakSet", "prototype"]
        }, x = r("function-bind"), A = r("has"), I = x.call(Function.call, Array.prototype.concat), R = x.call(Function.apply, Array.prototype.splice), M = x.call(Function.call, String.prototype.replace), b = x.call(Function.call, String.prototype.slice), N = x.call(Function.call, RegExp.prototype.exec), j = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g, $ = /\\(\\)?/g, re = function(P) {
          var D = b(P, 0, 1), Q = b(P, -1);
          if (D === "%" && Q !== "%")
            throw new a("invalid intrinsic syntax, expected closing `%`");
          if (Q === "%" && D !== "%")
            throw new a("invalid intrinsic syntax, expected opening `%`");
          var W = [];
          return M(P, j, function(oe, ae, H, X) {
            W[W.length] = H ? M(X, $, "$1") : ae || oe;
          }), W;
        }, ne = function(P, D) {
          var Q = P, W;
          if (A(T, Q) && (W = T[Q], Q = "%" + W[0] + "%"), A(v, Q)) {
            var oe = v[Q];
            if (oe === d && (oe = E(Q)), typeof oe > "u" && !D)
              throw new f("intrinsic " + P + " exists, but is not available. Please file an issue!");
            return {
              alias: W,
              name: Q,
              value: oe
            };
          }
          throw new a("intrinsic " + P + " does not exist!");
        };
        i.exports = function(P, D) {
          if (typeof P != "string" || P.length === 0)
            throw new f("intrinsic name must be a non-empty string");
          if (arguments.length > 1 && typeof D != "boolean")
            throw new f('"allowMissing" argument must be a boolean');
          if (N(/^%?[^%]*%?$/, P) === null)
            throw new a("`%` may not be present anywhere but at the beginning and end of the intrinsic name");
          var Q = re(P), W = Q.length > 0 ? Q[0] : "", oe = ne("%" + W + "%", D), ae = oe.name, H = oe.value, X = !1, ie = oe.alias;
          ie && (W = ie[0], R(Q, I([0, 1], ie)));
          for (var pe = 1, Z = !0; pe < Q.length; pe += 1) {
            var K = Q[pe], ee = b(K, 0, 1), de = b(K, -1);
            if ((ee === '"' || ee === "'" || ee === "`" || de === '"' || de === "'" || de === "`") && ee !== de)
              throw new a("property names with quotes must have matching quotes");
            if ((K === "constructor" || !Z) && (X = !0), W += "." + K, ae = "%" + W + "%", A(v, ae))
              H = v[ae];
            else if (H != null) {
              if (!(K in H)) {
                if (!D)
                  throw new f("base intrinsic for " + P + " exists, but the property is not available.");
                return;
              }
              if (s && pe + 1 >= Q.length) {
                var ge = s(H, K);
                Z = !!ge, Z && "get" in ge && !("originalValue" in ge.get) ? H = ge.get : H = H[K];
              } else
                Z = A(H, K), H = H[K];
              Z && !X && (v[ae] = H);
            }
          }
          return H;
        };
      }, { "function-bind": 38, has: 44, "has-symbols": 41 }], 40: [function(r, i, n) {
        var o = r("get-intrinsic"), a = o("%Object.getOwnPropertyDescriptor%", !0);
        if (a)
          try {
            a([], "length");
          } catch {
            a = null;
          }
        i.exports = a;
      }, { "get-intrinsic": 39 }], 41: [function(r, i, n) {
        var o = typeof Symbol < "u" && Symbol, a = r("./shams");
        i.exports = function() {
          return typeof o != "function" || typeof Symbol != "function" || typeof o("foo") != "symbol" || typeof Symbol("bar") != "symbol" ? !1 : a();
        };
      }, { "./shams": 42 }], 42: [function(r, i, n) {
        i.exports = function() {
          if (typeof Symbol != "function" || typeof Object.getOwnPropertySymbols != "function")
            return !1;
          if (typeof Symbol.iterator == "symbol")
            return !0;
          var a = {}, l = Symbol("test"), f = Object(l);
          if (typeof l == "string" || Object.prototype.toString.call(l) !== "[object Symbol]" || Object.prototype.toString.call(f) !== "[object Symbol]")
            return !1;
          var h = 42;
          a[l] = h;
          for (l in a)
            return !1;
          if (typeof Object.keys == "function" && Object.keys(a).length !== 0 || typeof Object.getOwnPropertyNames == "function" && Object.getOwnPropertyNames(a).length !== 0)
            return !1;
          var s = Object.getOwnPropertySymbols(a);
          if (s.length !== 1 || s[0] !== l || !Object.prototype.propertyIsEnumerable.call(a, l))
            return !1;
          if (typeof Object.getOwnPropertyDescriptor == "function") {
            var u = Object.getOwnPropertyDescriptor(a, l);
            if (u.value !== h || u.enumerable !== !0)
              return !1;
          }
          return !0;
        };
      }, {}], 43: [function(r, i, n) {
        var o = r("has-symbols/shams");
        i.exports = function() {
          return o() && !!Symbol.toStringTag;
        };
      }, { "has-symbols/shams": 42 }], 44: [function(r, i, n) {
        var o = r("function-bind");
        i.exports = o.call(Function.call, Object.prototype.hasOwnProperty);
      }, { "function-bind": 38 }], 45: [function(r, i, n) {
        /*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
        n.read = function(o, a, l, f, h) {
          var s, u, c = h * 8 - f - 1, p = (1 << c) - 1, m = p >> 1, d = -7, _ = l ? h - 1 : 0, v = l ? -1 : 1, k = o[a + _];
          for (_ += v, s = k & (1 << -d) - 1, k >>= -d, d += c; d > 0; s = s * 256 + o[a + _], _ += v, d -= 8)
            ;
          for (u = s & (1 << -d) - 1, s >>= -d, d += f; d > 0; u = u * 256 + o[a + _], _ += v, d -= 8)
            ;
          if (s === 0)
            s = 1 - m;
          else {
            if (s === p)
              return u ? NaN : (k ? -1 : 1) * (1 / 0);
            u = u + Math.pow(2, f), s = s - m;
          }
          return (k ? -1 : 1) * u * Math.pow(2, s - f);
        }, n.write = function(o, a, l, f, h, s) {
          var u, c, p, m = s * 8 - h - 1, d = (1 << m) - 1, _ = d >> 1, v = h === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0, k = f ? 0 : s - 1, E = f ? 1 : -1, T = a < 0 || a === 0 && 1 / a < 0 ? 1 : 0;
          for (a = Math.abs(a), isNaN(a) || a === 1 / 0 ? (c = isNaN(a) ? 1 : 0, u = d) : (u = Math.floor(Math.log(a) / Math.LN2), a * (p = Math.pow(2, -u)) < 1 && (u--, p *= 2), u + _ >= 1 ? a += v / p : a += v * Math.pow(2, 1 - _), a * p >= 2 && (u++, p /= 2), u + _ >= d ? (c = 0, u = d) : u + _ >= 1 ? (c = (a * p - 1) * Math.pow(2, h), u = u + _) : (c = a * Math.pow(2, _ - 1) * Math.pow(2, h), u = 0)); h >= 8; o[l + k] = c & 255, k += E, c /= 256, h -= 8)
            ;
          for (u = u << h | c, m += h; m > 0; o[l + k] = u & 255, k += E, u /= 256, m -= 8)
            ;
          o[l + k - E] |= T * 128;
        };
      }, {}], 46: [function(r, i, n) {
        typeof Object.create == "function" ? i.exports = function(a, l) {
          l && (a.super_ = l, a.prototype = Object.create(l.prototype, {
            constructor: {
              value: a,
              enumerable: !1,
              writable: !0,
              configurable: !0
            }
          }));
        } : i.exports = function(a, l) {
          if (l) {
            a.super_ = l;
            var f = function() {
            };
            f.prototype = l.prototype, a.prototype = new f(), a.prototype.constructor = a;
          }
        };
      }, {}], 47: [function(r, i, n) {
        var o = r("has-tostringtag/shams")(), a = r("call-bind/callBound"), l = a("Object.prototype.toString"), f = function(c) {
          return o && c && typeof c == "object" && Symbol.toStringTag in c ? !1 : l(c) === "[object Arguments]";
        }, h = function(c) {
          return f(c) ? !0 : c !== null && typeof c == "object" && typeof c.length == "number" && c.length >= 0 && l(c) !== "[object Array]" && l(c.callee) === "[object Function]";
        }, s = (function() {
          return f(arguments);
        })();
        f.isLegacyArguments = h, i.exports = s ? f : h;
      }, { "call-bind/callBound": 33, "has-tostringtag/shams": 43 }], 48: [function(r, i, n) {
        var o = Function.prototype.toString, a = typeof Reflect == "object" && Reflect !== null && Reflect.apply, l, f;
        if (typeof a == "function" && typeof Object.defineProperty == "function")
          try {
            l = Object.defineProperty({}, "length", {
              get: function() {
                throw f;
              }
            }), f = {}, a(function() {
              throw 42;
            }, null, l);
          } catch (I) {
            I !== f && (a = null);
          }
        else
          a = null;
        var h = /^\s*class\b/, s = function(R) {
          try {
            var M = o.call(R);
            return h.test(M);
          } catch {
            return !1;
          }
        }, u = function(R) {
          try {
            return s(R) ? !1 : (o.call(R), !0);
          } catch {
            return !1;
          }
        }, c = Object.prototype.toString, p = "[object Object]", m = "[object Function]", d = "[object GeneratorFunction]", _ = "[object HTMLAllCollection]", v = "[object HTML document.all class]", k = "[object HTMLCollection]", E = typeof Symbol == "function" && !!Symbol.toStringTag, T = !(0 in [,]), x = function() {
          return !1;
        };
        if (typeof document == "object") {
          var A = document.all;
          c.call(A) === c.call(document.all) && (x = function(R) {
            if ((T || !R) && (typeof R > "u" || typeof R == "object"))
              try {
                var M = c.call(R);
                return (M === _ || M === v || M === k || M === p) && R("") == null;
              } catch {
              }
            return !1;
          });
        }
        i.exports = a ? function(R) {
          if (x(R))
            return !0;
          if (!R || typeof R != "function" && typeof R != "object")
            return !1;
          try {
            a(R, null, l);
          } catch (M) {
            if (M !== f)
              return !1;
          }
          return !s(R) && u(R);
        } : function(R) {
          if (x(R))
            return !0;
          if (!R || typeof R != "function" && typeof R != "object")
            return !1;
          if (E)
            return u(R);
          if (s(R))
            return !1;
          var M = c.call(R);
          return M !== m && M !== d && !/^\[object HTML/.test(M) ? !1 : u(R);
        };
      }, {}], 49: [function(r, i, n) {
        var o = Object.prototype.toString, a = Function.prototype.toString, l = /^\s*(?:function)?\*/, f = r("has-tostringtag/shams")(), h = Object.getPrototypeOf, s = function() {
          if (!f)
            return !1;
          try {
            return Function("return function*() {}")();
          } catch {
          }
        }, u;
        i.exports = function(p) {
          if (typeof p != "function")
            return !1;
          if (l.test(a.call(p)))
            return !0;
          if (!f) {
            var m = o.call(p);
            return m === "[object GeneratorFunction]";
          }
          if (!h)
            return !1;
          if (typeof u > "u") {
            var d = s();
            u = d ? h(d) : !1;
          }
          return h(p) === u;
        };
      }, { "has-tostringtag/shams": 43 }], 50: [function(r, i, n) {
        (function(o) {
          (function() {
            var a = r("for-each"), l = r("available-typed-arrays"), f = r("call-bind/callBound"), h = f("Object.prototype.toString"), s = r("has-tostringtag/shams")(), u = r("gopd"), c = typeof globalThis > "u" ? o : globalThis, p = l(), m = f("Array.prototype.indexOf", !0) || function(T, x) {
              for (var A = 0; A < T.length; A += 1)
                if (T[A] === x)
                  return A;
              return -1;
            }, d = f("String.prototype.slice"), _ = {}, v = Object.getPrototypeOf;
            s && u && v && a(p, function(E) {
              var T = new c[E]();
              if (Symbol.toStringTag in T) {
                var x = v(T), A = u(x, Symbol.toStringTag);
                if (!A) {
                  var I = v(x);
                  A = u(I, Symbol.toStringTag);
                }
                _[E] = A.get;
              }
            });
            var k = function(T) {
              var x = !1;
              return a(_, function(A, I) {
                if (!x)
                  try {
                    x = A.call(T) === I;
                  } catch {
                  }
              }), x;
            };
            i.exports = function(T) {
              if (!T || typeof T != "object")
                return !1;
              if (!s || !(Symbol.toStringTag in T)) {
                var x = d(h(T), 8, -1);
                return m(p, x) > -1;
              }
              return u ? k(T) : !1;
            };
          }).call(this);
        }).call(this, typeof mt < "u" ? mt : typeof self < "u" ? self : typeof window < "u" ? window : {});
      }, { "available-typed-arrays": 27, "call-bind/callBound": 33, "for-each": 36, gopd: 40, "has-tostringtag/shams": 43 }], 51: [function(r, i, n) {
        var o = Object.getOwnPropertySymbols, a = Object.prototype.hasOwnProperty, l = Object.prototype.propertyIsEnumerable;
        function f(s) {
          if (s == null)
            throw new TypeError("Object.assign cannot be called with null or undefined");
          return Object(s);
        }
        function h() {
          try {
            if (!Object.assign)
              return !1;
            var s = new String("abc");
            if (s[5] = "de", Object.getOwnPropertyNames(s)[0] === "5")
              return !1;
            for (var u = {}, c = 0; c < 10; c++)
              u["_" + String.fromCharCode(c)] = c;
            var p = Object.getOwnPropertyNames(u).map(function(d) {
              return u[d];
            });
            if (p.join("") !== "0123456789")
              return !1;
            var m = {};
            return "abcdefghijklmnopqrst".split("").forEach(function(d) {
              m[d] = d;
            }), Object.keys(Object.assign({}, m)).join("") === "abcdefghijklmnopqrst";
          } catch {
            return !1;
          }
        }
        i.exports = h() ? Object.assign : function(s, u) {
          for (var c, p = f(s), m, d = 1; d < arguments.length; d++) {
            c = Object(arguments[d]);
            for (var _ in c)
              a.call(c, _) && (p[_] = c[_]);
            if (o) {
              m = o(c);
              for (var v = 0; v < m.length; v++)
                l.call(c, m[v]) && (p[m[v]] = c[m[v]]);
            }
          }
          return p;
        };
      }, {}], 52: [function(r, i, n) {
        var o = typeof Uint8Array < "u" && typeof Uint16Array < "u" && typeof Int32Array < "u";
        function a(h, s) {
          return Object.prototype.hasOwnProperty.call(h, s);
        }
        n.assign = function(h) {
          for (var s = Array.prototype.slice.call(arguments, 1); s.length; ) {
            var u = s.shift();
            if (u) {
              if (typeof u != "object")
                throw new TypeError(u + "must be non-object");
              for (var c in u)
                a(u, c) && (h[c] = u[c]);
            }
          }
          return h;
        }, n.shrinkBuf = function(h, s) {
          return h.length === s ? h : h.subarray ? h.subarray(0, s) : (h.length = s, h);
        };
        var l = {
          arraySet: function(h, s, u, c, p) {
            if (s.subarray && h.subarray) {
              h.set(s.subarray(u, u + c), p);
              return;
            }
            for (var m = 0; m < c; m++)
              h[p + m] = s[u + m];
          },
          // Join array of chunks to single array.
          flattenChunks: function(h) {
            var s, u, c, p, m, d;
            for (c = 0, s = 0, u = h.length; s < u; s++)
              c += h[s].length;
            for (d = new Uint8Array(c), p = 0, s = 0, u = h.length; s < u; s++)
              m = h[s], d.set(m, p), p += m.length;
            return d;
          }
        }, f = {
          arraySet: function(h, s, u, c, p) {
            for (var m = 0; m < c; m++)
              h[p + m] = s[u + m];
          },
          // Join array of chunks to single array.
          flattenChunks: function(h) {
            return [].concat.apply([], h);
          }
        };
        n.setTyped = function(h) {
          h ? (n.Buf8 = Uint8Array, n.Buf16 = Uint16Array, n.Buf32 = Int32Array, n.assign(n, l)) : (n.Buf8 = Array, n.Buf16 = Array, n.Buf32 = Array, n.assign(n, f));
        }, n.setTyped(o);
      }, {}], 53: [function(r, i, n) {
        function o(a, l, f, h) {
          for (var s = a & 65535 | 0, u = a >>> 16 & 65535 | 0, c = 0; f !== 0; ) {
            c = f > 2e3 ? 2e3 : f, f -= c;
            do
              s = s + l[h++] | 0, u = u + s | 0;
            while (--c);
            s %= 65521, u %= 65521;
          }
          return s | u << 16 | 0;
        }
        i.exports = o;
      }, {}], 54: [function(r, i, n) {
        i.exports = {
          /* Allowed flush values; see deflate() and inflate() below for details */
          Z_NO_FLUSH: 0,
          Z_PARTIAL_FLUSH: 1,
          Z_SYNC_FLUSH: 2,
          Z_FULL_FLUSH: 3,
          Z_FINISH: 4,
          Z_BLOCK: 5,
          Z_TREES: 6,
          /* Return codes for the compression/decompression functions. Negative values
          * are errors, positive values are used for special but normal events.
          */
          Z_OK: 0,
          Z_STREAM_END: 1,
          Z_NEED_DICT: 2,
          Z_ERRNO: -1,
          Z_STREAM_ERROR: -2,
          Z_DATA_ERROR: -3,
          //Z_MEM_ERROR:     -4,
          Z_BUF_ERROR: -5,
          //Z_VERSION_ERROR: -6,
          /* compression levels */
          Z_NO_COMPRESSION: 0,
          Z_BEST_SPEED: 1,
          Z_BEST_COMPRESSION: 9,
          Z_DEFAULT_COMPRESSION: -1,
          Z_FILTERED: 1,
          Z_HUFFMAN_ONLY: 2,
          Z_RLE: 3,
          Z_FIXED: 4,
          Z_DEFAULT_STRATEGY: 0,
          /* Possible values of the data_type field (though see inflate()) */
          Z_BINARY: 0,
          Z_TEXT: 1,
          //Z_ASCII:                1, // = Z_TEXT (deprecated)
          Z_UNKNOWN: 2,
          /* The deflate compression method */
          Z_DEFLATED: 8
          //Z_NULL:                 null // Use -1 or null inline, depending on var type
        };
      }, {}], 55: [function(r, i, n) {
        function o() {
          for (var f, h = [], s = 0; s < 256; s++) {
            f = s;
            for (var u = 0; u < 8; u++)
              f = f & 1 ? 3988292384 ^ f >>> 1 : f >>> 1;
            h[s] = f;
          }
          return h;
        }
        var a = o();
        function l(f, h, s, u) {
          var c = a, p = u + s;
          f ^= -1;
          for (var m = u; m < p; m++)
            f = f >>> 8 ^ c[(f ^ h[m]) & 255];
          return f ^ -1;
        }
        i.exports = l;
      }, {}], 56: [function(r, i, n) {
        var o = r("../utils/common"), a = r("./trees"), l = r("./adler32"), f = r("./crc32"), h = r("./messages"), s = 0, u = 1, c = 3, p = 4, m = 5, d = 0, _ = 1, v = -2, k = -3, E = -5, T = -1, x = 1, A = 2, I = 3, R = 4, M = 0, b = 2, N = 8, j = 9, $ = 15, re = 8, ne = 29, U = 256, P = U + 1 + ne, D = 30, Q = 19, W = 2 * P + 1, oe = 15, ae = 3, H = 258, X = H + ae + 1, ie = 32, pe = 42, Z = 69, K = 73, ee = 91, de = 103, ge = 113, ue = 666, Y = 1, q = 2, he = 3, Se = 4, Te = 3;
        function F(y, le) {
          return y.msg = h[le], le;
        }
        function z(y) {
          return (y << 1) - (y > 4 ? 9 : 0);
        }
        function O(y) {
          for (var le = y.length; --le >= 0; )
            y[le] = 0;
        }
        function g(y) {
          var le = y.state, ce = le.pending;
          ce > y.avail_out && (ce = y.avail_out), ce !== 0 && (o.arraySet(y.output, le.pending_buf, le.pending_out, ce, y.next_out), y.next_out += ce, le.pending_out += ce, y.total_out += ce, y.avail_out -= ce, le.pending -= ce, le.pending === 0 && (le.pending_out = 0));
        }
        function w(y, le) {
          a._tr_flush_block(y, y.block_start >= 0 ? y.block_start : -1, y.strstart - y.block_start, le), y.block_start = y.strstart, g(y.strm);
        }
        function S(y, le) {
          y.pending_buf[y.pending++] = le;
        }
        function J(y, le) {
          y.pending_buf[y.pending++] = le >>> 8 & 255, y.pending_buf[y.pending++] = le & 255;
        }
        function be(y, le, ce, L) {
          var G = y.avail_in;
          return G > L && (G = L), G === 0 ? 0 : (y.avail_in -= G, o.arraySet(le, y.input, y.next_in, G, ce), y.state.wrap === 1 ? y.adler = l(y.adler, le, G, ce) : y.state.wrap === 2 && (y.adler = f(y.adler, le, G, ce)), y.next_in += G, y.total_in += G, G);
        }
        function _e(y, le) {
          var ce = y.max_chain_length, L = y.strstart, G, te, xe = y.prev_length, Ae = y.nice_match, Re = y.strstart > y.w_size - X ? y.strstart - (y.w_size - X) : 0, Ne = y.window, Tt = y.w_mask, Xe = y.prev, Ue = y.strstart + H, it = Ne[L + xe - 1], gt = Ne[L + xe];
          y.prev_length >= y.good_match && (ce >>= 2), Ae > y.lookahead && (Ae = y.lookahead);
          do
            if (G = le, !(Ne[G + xe] !== gt || Ne[G + xe - 1] !== it || Ne[G] !== Ne[L] || Ne[++G] !== Ne[L + 1])) {
              L += 2, G++;
              do
                ;
              while (Ne[++L] === Ne[++G] && Ne[++L] === Ne[++G] && Ne[++L] === Ne[++G] && Ne[++L] === Ne[++G] && Ne[++L] === Ne[++G] && Ne[++L] === Ne[++G] && Ne[++L] === Ne[++G] && Ne[++L] === Ne[++G] && L < Ue);
              if (te = H - (Ue - L), L = Ue - H, te > xe) {
                if (y.match_start = le, xe = te, te >= Ae)
                  break;
                it = Ne[L + xe - 1], gt = Ne[L + xe];
              }
            }
          while ((le = Xe[le & Tt]) > Re && --ce !== 0);
          return xe <= y.lookahead ? xe : y.lookahead;
        }
        function Oe(y) {
          var le = y.w_size, ce, L, G, te, xe;
          do {
            if (te = y.window_size - y.lookahead - y.strstart, y.strstart >= le + (le - X)) {
              o.arraySet(y.window, y.window, le, le, 0), y.match_start -= le, y.strstart -= le, y.block_start -= le, L = y.hash_size, ce = L;
              do
                G = y.head[--ce], y.head[ce] = G >= le ? G - le : 0;
              while (--L);
              L = le, ce = L;
              do
                G = y.prev[--ce], y.prev[ce] = G >= le ? G - le : 0;
              while (--L);
              te += le;
            }
            if (y.strm.avail_in === 0)
              break;
            if (L = be(y.strm, y.window, y.strstart + y.lookahead, te), y.lookahead += L, y.lookahead + y.insert >= ae)
              for (xe = y.strstart - y.insert, y.ins_h = y.window[xe], y.ins_h = (y.ins_h << y.hash_shift ^ y.window[xe + 1]) & y.hash_mask; y.insert && (y.ins_h = (y.ins_h << y.hash_shift ^ y.window[xe + ae - 1]) & y.hash_mask, y.prev[xe & y.w_mask] = y.head[y.ins_h], y.head[y.ins_h] = xe, xe++, y.insert--, !(y.lookahead + y.insert < ae)); )
                ;
          } while (y.lookahead < X && y.strm.avail_in !== 0);
        }
        function Be(y, le) {
          var ce = 65535;
          for (ce > y.pending_buf_size - 5 && (ce = y.pending_buf_size - 5); ; ) {
            if (y.lookahead <= 1) {
              if (Oe(y), y.lookahead === 0 && le === s)
                return Y;
              if (y.lookahead === 0)
                break;
            }
            y.strstart += y.lookahead, y.lookahead = 0;
            var L = y.block_start + ce;
            if ((y.strstart === 0 || y.strstart >= L) && (y.lookahead = y.strstart - L, y.strstart = L, w(y, !1), y.strm.avail_out === 0) || y.strstart - y.block_start >= y.w_size - X && (w(y, !1), y.strm.avail_out === 0))
              return Y;
          }
          return y.insert = 0, le === p ? (w(y, !0), y.strm.avail_out === 0 ? he : Se) : (y.strstart > y.block_start && (w(y, !1), y.strm.avail_out === 0), Y);
        }
        function De(y, le) {
          for (var ce, L; ; ) {
            if (y.lookahead < X) {
              if (Oe(y), y.lookahead < X && le === s)
                return Y;
              if (y.lookahead === 0)
                break;
            }
            if (ce = 0, y.lookahead >= ae && (y.ins_h = (y.ins_h << y.hash_shift ^ y.window[y.strstart + ae - 1]) & y.hash_mask, ce = y.prev[y.strstart & y.w_mask] = y.head[y.ins_h], y.head[y.ins_h] = y.strstart), ce !== 0 && y.strstart - ce <= y.w_size - X && (y.match_length = _e(y, ce)), y.match_length >= ae)
              if (L = a._tr_tally(y, y.strstart - y.match_start, y.match_length - ae), y.lookahead -= y.match_length, y.match_length <= y.max_lazy_match && y.lookahead >= ae) {
                y.match_length--;
                do
                  y.strstart++, y.ins_h = (y.ins_h << y.hash_shift ^ y.window[y.strstart + ae - 1]) & y.hash_mask, ce = y.prev[y.strstart & y.w_mask] = y.head[y.ins_h], y.head[y.ins_h] = y.strstart;
                while (--y.match_length !== 0);
                y.strstart++;
              } else
                y.strstart += y.match_length, y.match_length = 0, y.ins_h = y.window[y.strstart], y.ins_h = (y.ins_h << y.hash_shift ^ y.window[y.strstart + 1]) & y.hash_mask;
            else
              L = a._tr_tally(y, 0, y.window[y.strstart]), y.lookahead--, y.strstart++;
            if (L && (w(y, !1), y.strm.avail_out === 0))
              return Y;
          }
          return y.insert = y.strstart < ae - 1 ? y.strstart : ae - 1, le === p ? (w(y, !0), y.strm.avail_out === 0 ? he : Se) : y.last_lit && (w(y, !1), y.strm.avail_out === 0) ? Y : q;
        }
        function He(y, le) {
          for (var ce, L, G; ; ) {
            if (y.lookahead < X) {
              if (Oe(y), y.lookahead < X && le === s)
                return Y;
              if (y.lookahead === 0)
                break;
            }
            if (ce = 0, y.lookahead >= ae && (y.ins_h = (y.ins_h << y.hash_shift ^ y.window[y.strstart + ae - 1]) & y.hash_mask, ce = y.prev[y.strstart & y.w_mask] = y.head[y.ins_h], y.head[y.ins_h] = y.strstart), y.prev_length = y.match_length, y.prev_match = y.match_start, y.match_length = ae - 1, ce !== 0 && y.prev_length < y.max_lazy_match && y.strstart - ce <= y.w_size - X && (y.match_length = _e(y, ce), y.match_length <= 5 && (y.strategy === x || y.match_length === ae && y.strstart - y.match_start > 4096) && (y.match_length = ae - 1)), y.prev_length >= ae && y.match_length <= y.prev_length) {
              G = y.strstart + y.lookahead - ae, L = a._tr_tally(y, y.strstart - 1 - y.prev_match, y.prev_length - ae), y.lookahead -= y.prev_length - 1, y.prev_length -= 2;
              do
                ++y.strstart <= G && (y.ins_h = (y.ins_h << y.hash_shift ^ y.window[y.strstart + ae - 1]) & y.hash_mask, ce = y.prev[y.strstart & y.w_mask] = y.head[y.ins_h], y.head[y.ins_h] = y.strstart);
              while (--y.prev_length !== 0);
              if (y.match_available = 0, y.match_length = ae - 1, y.strstart++, L && (w(y, !1), y.strm.avail_out === 0))
                return Y;
            } else if (y.match_available) {
              if (L = a._tr_tally(y, 0, y.window[y.strstart - 1]), L && w(y, !1), y.strstart++, y.lookahead--, y.strm.avail_out === 0)
                return Y;
            } else
              y.match_available = 1, y.strstart++, y.lookahead--;
          }
          return y.match_available && (L = a._tr_tally(y, 0, y.window[y.strstart - 1]), y.match_available = 0), y.insert = y.strstart < ae - 1 ? y.strstart : ae - 1, le === p ? (w(y, !0), y.strm.avail_out === 0 ? he : Se) : y.last_lit && (w(y, !1), y.strm.avail_out === 0) ? Y : q;
        }
        function Fe(y, le) {
          for (var ce, L, G, te, xe = y.window; ; ) {
            if (y.lookahead <= H) {
              if (Oe(y), y.lookahead <= H && le === s)
                return Y;
              if (y.lookahead === 0)
                break;
            }
            if (y.match_length = 0, y.lookahead >= ae && y.strstart > 0 && (G = y.strstart - 1, L = xe[G], L === xe[++G] && L === xe[++G] && L === xe[++G])) {
              te = y.strstart + H;
              do
                ;
              while (L === xe[++G] && L === xe[++G] && L === xe[++G] && L === xe[++G] && L === xe[++G] && L === xe[++G] && L === xe[++G] && L === xe[++G] && G < te);
              y.match_length = H - (te - G), y.match_length > y.lookahead && (y.match_length = y.lookahead);
            }
            if (y.match_length >= ae ? (ce = a._tr_tally(y, 1, y.match_length - ae), y.lookahead -= y.match_length, y.strstart += y.match_length, y.match_length = 0) : (ce = a._tr_tally(y, 0, y.window[y.strstart]), y.lookahead--, y.strstart++), ce && (w(y, !1), y.strm.avail_out === 0))
              return Y;
          }
          return y.insert = 0, le === p ? (w(y, !0), y.strm.avail_out === 0 ? he : Se) : y.last_lit && (w(y, !1), y.strm.avail_out === 0) ? Y : q;
        }
        function ht(y, le) {
          for (var ce; ; ) {
            if (y.lookahead === 0 && (Oe(y), y.lookahead === 0)) {
              if (le === s)
                return Y;
              break;
            }
            if (y.match_length = 0, ce = a._tr_tally(y, 0, y.window[y.strstart]), y.lookahead--, y.strstart++, ce && (w(y, !1), y.strm.avail_out === 0))
              return Y;
          }
          return y.insert = 0, le === p ? (w(y, !0), y.strm.avail_out === 0 ? he : Se) : y.last_lit && (w(y, !1), y.strm.avail_out === 0) ? Y : q;
        }
        function qe(y, le, ce, L, G) {
          this.good_length = y, this.max_lazy = le, this.nice_length = ce, this.max_chain = L, this.func = G;
        }
        var tt;
        tt = [
          /*      good lazy nice chain */
          new qe(0, 0, 0, 0, Be),
          /* 0 store only */
          new qe(4, 4, 8, 4, De),
          /* 1 max speed, no lazy matches */
          new qe(4, 5, 16, 8, De),
          /* 2 */
          new qe(4, 6, 32, 32, De),
          /* 3 */
          new qe(4, 4, 16, 16, He),
          /* 4 lazy matches */
          new qe(8, 16, 32, 32, He),
          /* 5 */
          new qe(8, 16, 128, 128, He),
          /* 6 */
          new qe(8, 32, 128, 256, He),
          /* 7 */
          new qe(32, 128, 258, 1024, He),
          /* 8 */
          new qe(32, 258, 258, 4096, He)
          /* 9 max compression */
        ];
        function Et(y) {
          y.window_size = 2 * y.w_size, O(y.head), y.max_lazy_match = tt[y.level].max_lazy, y.good_match = tt[y.level].good_length, y.nice_match = tt[y.level].nice_length, y.max_chain_length = tt[y.level].max_chain, y.strstart = 0, y.block_start = 0, y.lookahead = 0, y.insert = 0, y.match_length = y.prev_length = ae - 1, y.match_available = 0, y.ins_h = 0;
        }
        function B() {
          this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = N, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new o.Buf16(W * 2), this.dyn_dtree = new o.Buf16((2 * D + 1) * 2), this.bl_tree = new o.Buf16((2 * Q + 1) * 2), O(this.dyn_ltree), O(this.dyn_dtree), O(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new o.Buf16(oe + 1), this.heap = new o.Buf16(2 * P + 1), O(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new o.Buf16(2 * P + 1), O(this.depth), this.l_buf = 0, this.lit_bufsize = 0, this.last_lit = 0, this.d_buf = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
        }
        function ve(y) {
          var le;
          return !y || !y.state ? F(y, v) : (y.total_in = y.total_out = 0, y.data_type = b, le = y.state, le.pending = 0, le.pending_out = 0, le.wrap < 0 && (le.wrap = -le.wrap), le.status = le.wrap ? pe : ge, y.adler = le.wrap === 2 ? 0 : 1, le.last_flush = s, a._tr_init(le), d);
        }
        function fe(y) {
          var le = ve(y);
          return le === d && Et(y.state), le;
        }
        function we(y, le) {
          return !y || !y.state || y.state.wrap !== 2 ? v : (y.state.gzhead = le, d);
        }
        function V(y, le, ce, L, G, te) {
          if (!y)
            return v;
          var xe = 1;
          if (le === T && (le = 6), L < 0 ? (xe = 0, L = -L) : L > 15 && (xe = 2, L -= 16), G < 1 || G > j || ce !== N || L < 8 || L > 15 || le < 0 || le > 9 || te < 0 || te > R)
            return F(y, v);
          L === 8 && (L = 9);
          var Ae = new B();
          return y.state = Ae, Ae.strm = y, Ae.wrap = xe, Ae.gzhead = null, Ae.w_bits = L, Ae.w_size = 1 << Ae.w_bits, Ae.w_mask = Ae.w_size - 1, Ae.hash_bits = G + 7, Ae.hash_size = 1 << Ae.hash_bits, Ae.hash_mask = Ae.hash_size - 1, Ae.hash_shift = ~~((Ae.hash_bits + ae - 1) / ae), Ae.window = new o.Buf8(Ae.w_size * 2), Ae.head = new o.Buf16(Ae.hash_size), Ae.prev = new o.Buf16(Ae.w_size), Ae.lit_bufsize = 1 << G + 6, Ae.pending_buf_size = Ae.lit_bufsize * 4, Ae.pending_buf = new o.Buf8(Ae.pending_buf_size), Ae.d_buf = 1 * Ae.lit_bufsize, Ae.l_buf = 3 * Ae.lit_bufsize, Ae.level = le, Ae.strategy = te, Ae.method = ce, fe(y);
        }
        function se(y, le) {
          return V(y, le, N, $, re, M);
        }
        function C(y, le) {
          var ce, L, G, te;
          if (!y || !y.state || le > m || le < 0)
            return y ? F(y, v) : v;
          if (L = y.state, !y.output || !y.input && y.avail_in !== 0 || L.status === ue && le !== p)
            return F(y, y.avail_out === 0 ? E : v);
          if (L.strm = y, ce = L.last_flush, L.last_flush = le, L.status === pe)
            if (L.wrap === 2)
              y.adler = 0, S(L, 31), S(L, 139), S(L, 8), L.gzhead ? (S(
                L,
                (L.gzhead.text ? 1 : 0) + (L.gzhead.hcrc ? 2 : 0) + (L.gzhead.extra ? 4 : 0) + (L.gzhead.name ? 8 : 0) + (L.gzhead.comment ? 16 : 0)
              ), S(L, L.gzhead.time & 255), S(L, L.gzhead.time >> 8 & 255), S(L, L.gzhead.time >> 16 & 255), S(L, L.gzhead.time >> 24 & 255), S(L, L.level === 9 ? 2 : L.strategy >= A || L.level < 2 ? 4 : 0), S(L, L.gzhead.os & 255), L.gzhead.extra && L.gzhead.extra.length && (S(L, L.gzhead.extra.length & 255), S(L, L.gzhead.extra.length >> 8 & 255)), L.gzhead.hcrc && (y.adler = f(y.adler, L.pending_buf, L.pending, 0)), L.gzindex = 0, L.status = Z) : (S(L, 0), S(L, 0), S(L, 0), S(L, 0), S(L, 0), S(L, L.level === 9 ? 2 : L.strategy >= A || L.level < 2 ? 4 : 0), S(L, Te), L.status = ge);
            else {
              var xe = N + (L.w_bits - 8 << 4) << 8, Ae = -1;
              L.strategy >= A || L.level < 2 ? Ae = 0 : L.level < 6 ? Ae = 1 : L.level === 6 ? Ae = 2 : Ae = 3, xe |= Ae << 6, L.strstart !== 0 && (xe |= ie), xe += 31 - xe % 31, L.status = ge, J(L, xe), L.strstart !== 0 && (J(L, y.adler >>> 16), J(L, y.adler & 65535)), y.adler = 1;
            }
          if (L.status === Z)
            if (L.gzhead.extra) {
              for (G = L.pending; L.gzindex < (L.gzhead.extra.length & 65535) && !(L.pending === L.pending_buf_size && (L.gzhead.hcrc && L.pending > G && (y.adler = f(y.adler, L.pending_buf, L.pending - G, G)), g(y), G = L.pending, L.pending === L.pending_buf_size)); )
                S(L, L.gzhead.extra[L.gzindex] & 255), L.gzindex++;
              L.gzhead.hcrc && L.pending > G && (y.adler = f(y.adler, L.pending_buf, L.pending - G, G)), L.gzindex === L.gzhead.extra.length && (L.gzindex = 0, L.status = K);
            } else
              L.status = K;
          if (L.status === K)
            if (L.gzhead.name) {
              G = L.pending;
              do {
                if (L.pending === L.pending_buf_size && (L.gzhead.hcrc && L.pending > G && (y.adler = f(y.adler, L.pending_buf, L.pending - G, G)), g(y), G = L.pending, L.pending === L.pending_buf_size)) {
                  te = 1;
                  break;
                }
                L.gzindex < L.gzhead.name.length ? te = L.gzhead.name.charCodeAt(L.gzindex++) & 255 : te = 0, S(L, te);
              } while (te !== 0);
              L.gzhead.hcrc && L.pending > G && (y.adler = f(y.adler, L.pending_buf, L.pending - G, G)), te === 0 && (L.gzindex = 0, L.status = ee);
            } else
              L.status = ee;
          if (L.status === ee)
            if (L.gzhead.comment) {
              G = L.pending;
              do {
                if (L.pending === L.pending_buf_size && (L.gzhead.hcrc && L.pending > G && (y.adler = f(y.adler, L.pending_buf, L.pending - G, G)), g(y), G = L.pending, L.pending === L.pending_buf_size)) {
                  te = 1;
                  break;
                }
                L.gzindex < L.gzhead.comment.length ? te = L.gzhead.comment.charCodeAt(L.gzindex++) & 255 : te = 0, S(L, te);
              } while (te !== 0);
              L.gzhead.hcrc && L.pending > G && (y.adler = f(y.adler, L.pending_buf, L.pending - G, G)), te === 0 && (L.status = de);
            } else
              L.status = de;
          if (L.status === de && (L.gzhead.hcrc ? (L.pending + 2 > L.pending_buf_size && g(y), L.pending + 2 <= L.pending_buf_size && (S(L, y.adler & 255), S(L, y.adler >> 8 & 255), y.adler = 0, L.status = ge)) : L.status = ge), L.pending !== 0) {
            if (g(y), y.avail_out === 0)
              return L.last_flush = -1, d;
          } else if (y.avail_in === 0 && z(le) <= z(ce) && le !== p)
            return F(y, E);
          if (L.status === ue && y.avail_in !== 0)
            return F(y, E);
          if (y.avail_in !== 0 || L.lookahead !== 0 || le !== s && L.status !== ue) {
            var Re = L.strategy === A ? ht(L, le) : L.strategy === I ? Fe(L, le) : tt[L.level].func(L, le);
            if ((Re === he || Re === Se) && (L.status = ue), Re === Y || Re === he)
              return y.avail_out === 0 && (L.last_flush = -1), d;
            if (Re === q && (le === u ? a._tr_align(L) : le !== m && (a._tr_stored_block(L, 0, 0, !1), le === c && (O(L.head), L.lookahead === 0 && (L.strstart = 0, L.block_start = 0, L.insert = 0))), g(y), y.avail_out === 0))
              return L.last_flush = -1, d;
          }
          return le !== p ? d : L.wrap <= 0 ? _ : (L.wrap === 2 ? (S(L, y.adler & 255), S(L, y.adler >> 8 & 255), S(L, y.adler >> 16 & 255), S(L, y.adler >> 24 & 255), S(L, y.total_in & 255), S(L, y.total_in >> 8 & 255), S(L, y.total_in >> 16 & 255), S(L, y.total_in >> 24 & 255)) : (J(L, y.adler >>> 16), J(L, y.adler & 65535)), g(y), L.wrap > 0 && (L.wrap = -L.wrap), L.pending !== 0 ? d : _);
        }
        function me(y) {
          var le;
          return !y || !y.state ? v : (le = y.state.status, le !== pe && le !== Z && le !== K && le !== ee && le !== de && le !== ge && le !== ue ? F(y, v) : (y.state = null, le === ge ? F(y, k) : d));
        }
        function ke(y, le) {
          var ce = le.length, L, G, te, xe, Ae, Re, Ne, Tt;
          if (!y || !y.state || (L = y.state, xe = L.wrap, xe === 2 || xe === 1 && L.status !== pe || L.lookahead))
            return v;
          for (xe === 1 && (y.adler = l(y.adler, le, ce, 0)), L.wrap = 0, ce >= L.w_size && (xe === 0 && (O(L.head), L.strstart = 0, L.block_start = 0, L.insert = 0), Tt = new o.Buf8(L.w_size), o.arraySet(Tt, le, ce - L.w_size, L.w_size, 0), le = Tt, ce = L.w_size), Ae = y.avail_in, Re = y.next_in, Ne = y.input, y.avail_in = ce, y.next_in = 0, y.input = le, Oe(L); L.lookahead >= ae; ) {
            G = L.strstart, te = L.lookahead - (ae - 1);
            do
              L.ins_h = (L.ins_h << L.hash_shift ^ L.window[G + ae - 1]) & L.hash_mask, L.prev[G & L.w_mask] = L.head[L.ins_h], L.head[L.ins_h] = G, G++;
            while (--te);
            L.strstart = G, L.lookahead = ae - 1, Oe(L);
          }
          return L.strstart += L.lookahead, L.block_start = L.strstart, L.insert = L.lookahead, L.lookahead = 0, L.match_length = L.prev_length = ae - 1, L.match_available = 0, y.next_in = Re, y.input = Ne, y.avail_in = Ae, L.wrap = xe, d;
        }
        n.deflateInit = se, n.deflateInit2 = V, n.deflateReset = fe, n.deflateResetKeep = ve, n.deflateSetHeader = we, n.deflate = C, n.deflateEnd = me, n.deflateSetDictionary = ke, n.deflateInfo = "pako deflate (from Nodeca project)";
      }, { "../utils/common": 52, "./adler32": 53, "./crc32": 55, "./messages": 60, "./trees": 61 }], 57: [function(r, i, n) {
        var o = 30, a = 12;
        i.exports = function(f, h) {
          var s, u, c, p, m, d, _, v, k, E, T, x, A, I, R, M, b, N, j, $, re, ne, U, P, D;
          s = f.state, u = f.next_in, P = f.input, c = u + (f.avail_in - 5), p = f.next_out, D = f.output, m = p - (h - f.avail_out), d = p + (f.avail_out - 257), _ = s.dmax, v = s.wsize, k = s.whave, E = s.wnext, T = s.window, x = s.hold, A = s.bits, I = s.lencode, R = s.distcode, M = (1 << s.lenbits) - 1, b = (1 << s.distbits) - 1;
          e:
            do {
              A < 15 && (x += P[u++] << A, A += 8, x += P[u++] << A, A += 8), N = I[x & M];
              t:
                for (; ; ) {
                  if (j = N >>> 24, x >>>= j, A -= j, j = N >>> 16 & 255, j === 0)
                    D[p++] = N & 65535;
                  else if (j & 16) {
                    $ = N & 65535, j &= 15, j && (A < j && (x += P[u++] << A, A += 8), $ += x & (1 << j) - 1, x >>>= j, A -= j), A < 15 && (x += P[u++] << A, A += 8, x += P[u++] << A, A += 8), N = R[x & b];
                    r:
                      for (; ; ) {
                        if (j = N >>> 24, x >>>= j, A -= j, j = N >>> 16 & 255, j & 16) {
                          if (re = N & 65535, j &= 15, A < j && (x += P[u++] << A, A += 8, A < j && (x += P[u++] << A, A += 8)), re += x & (1 << j) - 1, re > _) {
                            f.msg = "invalid distance too far back", s.mode = o;
                            break e;
                          }
                          if (x >>>= j, A -= j, j = p - m, re > j) {
                            if (j = re - j, j > k && s.sane) {
                              f.msg = "invalid distance too far back", s.mode = o;
                              break e;
                            }
                            if (ne = 0, U = T, E === 0) {
                              if (ne += v - j, j < $) {
                                $ -= j;
                                do
                                  D[p++] = T[ne++];
                                while (--j);
                                ne = p - re, U = D;
                              }
                            } else if (E < j) {
                              if (ne += v + E - j, j -= E, j < $) {
                                $ -= j;
                                do
                                  D[p++] = T[ne++];
                                while (--j);
                                if (ne = 0, E < $) {
                                  j = E, $ -= j;
                                  do
                                    D[p++] = T[ne++];
                                  while (--j);
                                  ne = p - re, U = D;
                                }
                              }
                            } else if (ne += E - j, j < $) {
                              $ -= j;
                              do
                                D[p++] = T[ne++];
                              while (--j);
                              ne = p - re, U = D;
                            }
                            for (; $ > 2; )
                              D[p++] = U[ne++], D[p++] = U[ne++], D[p++] = U[ne++], $ -= 3;
                            $ && (D[p++] = U[ne++], $ > 1 && (D[p++] = U[ne++]));
                          } else {
                            ne = p - re;
                            do
                              D[p++] = D[ne++], D[p++] = D[ne++], D[p++] = D[ne++], $ -= 3;
                            while ($ > 2);
                            $ && (D[p++] = D[ne++], $ > 1 && (D[p++] = D[ne++]));
                          }
                        } else if ((j & 64) === 0) {
                          N = R[(N & 65535) + (x & (1 << j) - 1)];
                          continue r;
                        } else {
                          f.msg = "invalid distance code", s.mode = o;
                          break e;
                        }
                        break;
                      }
                  } else if ((j & 64) === 0) {
                    N = I[(N & 65535) + (x & (1 << j) - 1)];
                    continue t;
                  } else if (j & 32) {
                    s.mode = a;
                    break e;
                  } else {
                    f.msg = "invalid literal/length code", s.mode = o;
                    break e;
                  }
                  break;
                }
            } while (u < c && p < d);
          $ = A >> 3, u -= $, A -= $ << 3, x &= (1 << A) - 1, f.next_in = u, f.next_out = p, f.avail_in = u < c ? 5 + (c - u) : 5 - (u - c), f.avail_out = p < d ? 257 + (d - p) : 257 - (p - d), s.hold = x, s.bits = A;
        };
      }, {}], 58: [function(r, i, n) {
        var o = r("../utils/common"), a = r("./adler32"), l = r("./crc32"), f = r("./inffast"), h = r("./inftrees"), s = 0, u = 1, c = 2, p = 4, m = 5, d = 6, _ = 0, v = 1, k = 2, E = -2, T = -3, x = -4, A = -5, I = 8, R = 1, M = 2, b = 3, N = 4, j = 5, $ = 6, re = 7, ne = 8, U = 9, P = 10, D = 11, Q = 12, W = 13, oe = 14, ae = 15, H = 16, X = 17, ie = 18, pe = 19, Z = 20, K = 21, ee = 22, de = 23, ge = 24, ue = 25, Y = 26, q = 27, he = 28, Se = 29, Te = 30, F = 31, z = 32, O = 852, g = 592, w = 15, S = w;
        function J(V) {
          return (V >>> 24 & 255) + (V >>> 8 & 65280) + ((V & 65280) << 8) + ((V & 255) << 24);
        }
        function be() {
          this.mode = 0, this.last = !1, this.wrap = 0, this.havedict = !1, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new o.Buf16(320), this.work = new o.Buf16(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
        }
        function _e(V) {
          var se;
          return !V || !V.state ? E : (se = V.state, V.total_in = V.total_out = se.total = 0, V.msg = "", se.wrap && (V.adler = se.wrap & 1), se.mode = R, se.last = 0, se.havedict = 0, se.dmax = 32768, se.head = null, se.hold = 0, se.bits = 0, se.lencode = se.lendyn = new o.Buf32(O), se.distcode = se.distdyn = new o.Buf32(g), se.sane = 1, se.back = -1, _);
        }
        function Oe(V) {
          var se;
          return !V || !V.state ? E : (se = V.state, se.wsize = 0, se.whave = 0, se.wnext = 0, _e(V));
        }
        function Be(V, se) {
          var C, me;
          return !V || !V.state || (me = V.state, se < 0 ? (C = 0, se = -se) : (C = (se >> 4) + 1, se < 48 && (se &= 15)), se && (se < 8 || se > 15)) ? E : (me.window !== null && me.wbits !== se && (me.window = null), me.wrap = C, me.wbits = se, Oe(V));
        }
        function De(V, se) {
          var C, me;
          return V ? (me = new be(), V.state = me, me.window = null, C = Be(V, se), C !== _ && (V.state = null), C) : E;
        }
        function He(V) {
          return De(V, S);
        }
        var Fe = !0, ht, qe;
        function tt(V) {
          if (Fe) {
            var se;
            for (ht = new o.Buf32(512), qe = new o.Buf32(32), se = 0; se < 144; )
              V.lens[se++] = 8;
            for (; se < 256; )
              V.lens[se++] = 9;
            for (; se < 280; )
              V.lens[se++] = 7;
            for (; se < 288; )
              V.lens[se++] = 8;
            for (h(u, V.lens, 0, 288, ht, 0, V.work, { bits: 9 }), se = 0; se < 32; )
              V.lens[se++] = 5;
            h(c, V.lens, 0, 32, qe, 0, V.work, { bits: 5 }), Fe = !1;
          }
          V.lencode = ht, V.lenbits = 9, V.distcode = qe, V.distbits = 5;
        }
        function Et(V, se, C, me) {
          var ke, y = V.state;
          return y.window === null && (y.wsize = 1 << y.wbits, y.wnext = 0, y.whave = 0, y.window = new o.Buf8(y.wsize)), me >= y.wsize ? (o.arraySet(y.window, se, C - y.wsize, y.wsize, 0), y.wnext = 0, y.whave = y.wsize) : (ke = y.wsize - y.wnext, ke > me && (ke = me), o.arraySet(y.window, se, C - me, ke, y.wnext), me -= ke, me ? (o.arraySet(y.window, se, C - me, me, 0), y.wnext = me, y.whave = y.wsize) : (y.wnext += ke, y.wnext === y.wsize && (y.wnext = 0), y.whave < y.wsize && (y.whave += ke))), 0;
        }
        function B(V, se) {
          var C, me, ke, y, le, ce, L, G, te, xe, Ae, Re, Ne, Tt, Xe = 0, Ue, it, gt, At, Vr, Kr, ft, Ot, pt = new o.Buf8(4), Zt, Ft, Gi = (
            /* permutation of code lengths */
            [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]
          );
          if (!V || !V.state || !V.output || !V.input && V.avail_in !== 0)
            return E;
          C = V.state, C.mode === Q && (C.mode = W), le = V.next_out, ke = V.output, L = V.avail_out, y = V.next_in, me = V.input, ce = V.avail_in, G = C.hold, te = C.bits, xe = ce, Ae = L, Ot = _;
          e:
            for (; ; )
              switch (C.mode) {
                case R:
                  if (C.wrap === 0) {
                    C.mode = W;
                    break;
                  }
                  for (; te < 16; ) {
                    if (ce === 0)
                      break e;
                    ce--, G += me[y++] << te, te += 8;
                  }
                  if (C.wrap & 2 && G === 35615) {
                    C.check = 0, pt[0] = G & 255, pt[1] = G >>> 8 & 255, C.check = l(C.check, pt, 2, 0), G = 0, te = 0, C.mode = M;
                    break;
                  }
                  if (C.flags = 0, C.head && (C.head.done = !1), !(C.wrap & 1) || /* check if zlib header allowed */
                  (((G & 255) << 8) + (G >> 8)) % 31) {
                    V.msg = "incorrect header check", C.mode = Te;
                    break;
                  }
                  if ((G & 15) !== I) {
                    V.msg = "unknown compression method", C.mode = Te;
                    break;
                  }
                  if (G >>>= 4, te -= 4, ft = (G & 15) + 8, C.wbits === 0)
                    C.wbits = ft;
                  else if (ft > C.wbits) {
                    V.msg = "invalid window size", C.mode = Te;
                    break;
                  }
                  C.dmax = 1 << ft, V.adler = C.check = 1, C.mode = G & 512 ? P : Q, G = 0, te = 0;
                  break;
                case M:
                  for (; te < 16; ) {
                    if (ce === 0)
                      break e;
                    ce--, G += me[y++] << te, te += 8;
                  }
                  if (C.flags = G, (C.flags & 255) !== I) {
                    V.msg = "unknown compression method", C.mode = Te;
                    break;
                  }
                  if (C.flags & 57344) {
                    V.msg = "unknown header flags set", C.mode = Te;
                    break;
                  }
                  C.head && (C.head.text = G >> 8 & 1), C.flags & 512 && (pt[0] = G & 255, pt[1] = G >>> 8 & 255, C.check = l(C.check, pt, 2, 0)), G = 0, te = 0, C.mode = b;
                /* falls through */
                case b:
                  for (; te < 32; ) {
                    if (ce === 0)
                      break e;
                    ce--, G += me[y++] << te, te += 8;
                  }
                  C.head && (C.head.time = G), C.flags & 512 && (pt[0] = G & 255, pt[1] = G >>> 8 & 255, pt[2] = G >>> 16 & 255, pt[3] = G >>> 24 & 255, C.check = l(C.check, pt, 4, 0)), G = 0, te = 0, C.mode = N;
                /* falls through */
                case N:
                  for (; te < 16; ) {
                    if (ce === 0)
                      break e;
                    ce--, G += me[y++] << te, te += 8;
                  }
                  C.head && (C.head.xflags = G & 255, C.head.os = G >> 8), C.flags & 512 && (pt[0] = G & 255, pt[1] = G >>> 8 & 255, C.check = l(C.check, pt, 2, 0)), G = 0, te = 0, C.mode = j;
                /* falls through */
                case j:
                  if (C.flags & 1024) {
                    for (; te < 16; ) {
                      if (ce === 0)
                        break e;
                      ce--, G += me[y++] << te, te += 8;
                    }
                    C.length = G, C.head && (C.head.extra_len = G), C.flags & 512 && (pt[0] = G & 255, pt[1] = G >>> 8 & 255, C.check = l(C.check, pt, 2, 0)), G = 0, te = 0;
                  } else C.head && (C.head.extra = null);
                  C.mode = $;
                /* falls through */
                case $:
                  if (C.flags & 1024 && (Re = C.length, Re > ce && (Re = ce), Re && (C.head && (ft = C.head.extra_len - C.length, C.head.extra || (C.head.extra = new Array(C.head.extra_len)), o.arraySet(
                    C.head.extra,
                    me,
                    y,
                    // extra field is limited to 65536 bytes
                    // - no need for additional size check
                    Re,
                    /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
                    ft
                  )), C.flags & 512 && (C.check = l(C.check, me, Re, y)), ce -= Re, y += Re, C.length -= Re), C.length))
                    break e;
                  C.length = 0, C.mode = re;
                /* falls through */
                case re:
                  if (C.flags & 2048) {
                    if (ce === 0)
                      break e;
                    Re = 0;
                    do
                      ft = me[y + Re++], C.head && ft && C.length < 65536 && (C.head.name += String.fromCharCode(ft));
                    while (ft && Re < ce);
                    if (C.flags & 512 && (C.check = l(C.check, me, Re, y)), ce -= Re, y += Re, ft)
                      break e;
                  } else C.head && (C.head.name = null);
                  C.length = 0, C.mode = ne;
                /* falls through */
                case ne:
                  if (C.flags & 4096) {
                    if (ce === 0)
                      break e;
                    Re = 0;
                    do
                      ft = me[y + Re++], C.head && ft && C.length < 65536 && (C.head.comment += String.fromCharCode(ft));
                    while (ft && Re < ce);
                    if (C.flags & 512 && (C.check = l(C.check, me, Re, y)), ce -= Re, y += Re, ft)
                      break e;
                  } else C.head && (C.head.comment = null);
                  C.mode = U;
                /* falls through */
                case U:
                  if (C.flags & 512) {
                    for (; te < 16; ) {
                      if (ce === 0)
                        break e;
                      ce--, G += me[y++] << te, te += 8;
                    }
                    if (G !== (C.check & 65535)) {
                      V.msg = "header crc mismatch", C.mode = Te;
                      break;
                    }
                    G = 0, te = 0;
                  }
                  C.head && (C.head.hcrc = C.flags >> 9 & 1, C.head.done = !0), V.adler = C.check = 0, C.mode = Q;
                  break;
                case P:
                  for (; te < 32; ) {
                    if (ce === 0)
                      break e;
                    ce--, G += me[y++] << te, te += 8;
                  }
                  V.adler = C.check = J(G), G = 0, te = 0, C.mode = D;
                /* falls through */
                case D:
                  if (C.havedict === 0)
                    return V.next_out = le, V.avail_out = L, V.next_in = y, V.avail_in = ce, C.hold = G, C.bits = te, k;
                  V.adler = C.check = 1, C.mode = Q;
                /* falls through */
                case Q:
                  if (se === m || se === d)
                    break e;
                /* falls through */
                case W:
                  if (C.last) {
                    G >>>= te & 7, te -= te & 7, C.mode = q;
                    break;
                  }
                  for (; te < 3; ) {
                    if (ce === 0)
                      break e;
                    ce--, G += me[y++] << te, te += 8;
                  }
                  switch (C.last = G & 1, G >>>= 1, te -= 1, G & 3) {
                    case 0:
                      C.mode = oe;
                      break;
                    case 1:
                      if (tt(C), C.mode = Z, se === d) {
                        G >>>= 2, te -= 2;
                        break e;
                      }
                      break;
                    case 2:
                      C.mode = X;
                      break;
                    case 3:
                      V.msg = "invalid block type", C.mode = Te;
                  }
                  G >>>= 2, te -= 2;
                  break;
                case oe:
                  for (G >>>= te & 7, te -= te & 7; te < 32; ) {
                    if (ce === 0)
                      break e;
                    ce--, G += me[y++] << te, te += 8;
                  }
                  if ((G & 65535) !== (G >>> 16 ^ 65535)) {
                    V.msg = "invalid stored block lengths", C.mode = Te;
                    break;
                  }
                  if (C.length = G & 65535, G = 0, te = 0, C.mode = ae, se === d)
                    break e;
                /* falls through */
                case ae:
                  C.mode = H;
                /* falls through */
                case H:
                  if (Re = C.length, Re) {
                    if (Re > ce && (Re = ce), Re > L && (Re = L), Re === 0)
                      break e;
                    o.arraySet(ke, me, y, Re, le), ce -= Re, y += Re, L -= Re, le += Re, C.length -= Re;
                    break;
                  }
                  C.mode = Q;
                  break;
                case X:
                  for (; te < 14; ) {
                    if (ce === 0)
                      break e;
                    ce--, G += me[y++] << te, te += 8;
                  }
                  if (C.nlen = (G & 31) + 257, G >>>= 5, te -= 5, C.ndist = (G & 31) + 1, G >>>= 5, te -= 5, C.ncode = (G & 15) + 4, G >>>= 4, te -= 4, C.nlen > 286 || C.ndist > 30) {
                    V.msg = "too many length or distance symbols", C.mode = Te;
                    break;
                  }
                  C.have = 0, C.mode = ie;
                /* falls through */
                case ie:
                  for (; C.have < C.ncode; ) {
                    for (; te < 3; ) {
                      if (ce === 0)
                        break e;
                      ce--, G += me[y++] << te, te += 8;
                    }
                    C.lens[Gi[C.have++]] = G & 7, G >>>= 3, te -= 3;
                  }
                  for (; C.have < 19; )
                    C.lens[Gi[C.have++]] = 0;
                  if (C.lencode = C.lendyn, C.lenbits = 7, Zt = { bits: C.lenbits }, Ot = h(s, C.lens, 0, 19, C.lencode, 0, C.work, Zt), C.lenbits = Zt.bits, Ot) {
                    V.msg = "invalid code lengths set", C.mode = Te;
                    break;
                  }
                  C.have = 0, C.mode = pe;
                /* falls through */
                case pe:
                  for (; C.have < C.nlen + C.ndist; ) {
                    for (; Xe = C.lencode[G & (1 << C.lenbits) - 1], Ue = Xe >>> 24, it = Xe >>> 16 & 255, gt = Xe & 65535, !(Ue <= te); ) {
                      if (ce === 0)
                        break e;
                      ce--, G += me[y++] << te, te += 8;
                    }
                    if (gt < 16)
                      G >>>= Ue, te -= Ue, C.lens[C.have++] = gt;
                    else {
                      if (gt === 16) {
                        for (Ft = Ue + 2; te < Ft; ) {
                          if (ce === 0)
                            break e;
                          ce--, G += me[y++] << te, te += 8;
                        }
                        if (G >>>= Ue, te -= Ue, C.have === 0) {
                          V.msg = "invalid bit length repeat", C.mode = Te;
                          break;
                        }
                        ft = C.lens[C.have - 1], Re = 3 + (G & 3), G >>>= 2, te -= 2;
                      } else if (gt === 17) {
                        for (Ft = Ue + 3; te < Ft; ) {
                          if (ce === 0)
                            break e;
                          ce--, G += me[y++] << te, te += 8;
                        }
                        G >>>= Ue, te -= Ue, ft = 0, Re = 3 + (G & 7), G >>>= 3, te -= 3;
                      } else {
                        for (Ft = Ue + 7; te < Ft; ) {
                          if (ce === 0)
                            break e;
                          ce--, G += me[y++] << te, te += 8;
                        }
                        G >>>= Ue, te -= Ue, ft = 0, Re = 11 + (G & 127), G >>>= 7, te -= 7;
                      }
                      if (C.have + Re > C.nlen + C.ndist) {
                        V.msg = "invalid bit length repeat", C.mode = Te;
                        break;
                      }
                      for (; Re--; )
                        C.lens[C.have++] = ft;
                    }
                  }
                  if (C.mode === Te)
                    break;
                  if (C.lens[256] === 0) {
                    V.msg = "invalid code -- missing end-of-block", C.mode = Te;
                    break;
                  }
                  if (C.lenbits = 9, Zt = { bits: C.lenbits }, Ot = h(u, C.lens, 0, C.nlen, C.lencode, 0, C.work, Zt), C.lenbits = Zt.bits, Ot) {
                    V.msg = "invalid literal/lengths set", C.mode = Te;
                    break;
                  }
                  if (C.distbits = 6, C.distcode = C.distdyn, Zt = { bits: C.distbits }, Ot = h(c, C.lens, C.nlen, C.ndist, C.distcode, 0, C.work, Zt), C.distbits = Zt.bits, Ot) {
                    V.msg = "invalid distances set", C.mode = Te;
                    break;
                  }
                  if (C.mode = Z, se === d)
                    break e;
                /* falls through */
                case Z:
                  C.mode = K;
                /* falls through */
                case K:
                  if (ce >= 6 && L >= 258) {
                    V.next_out = le, V.avail_out = L, V.next_in = y, V.avail_in = ce, C.hold = G, C.bits = te, f(V, Ae), le = V.next_out, ke = V.output, L = V.avail_out, y = V.next_in, me = V.input, ce = V.avail_in, G = C.hold, te = C.bits, C.mode === Q && (C.back = -1);
                    break;
                  }
                  for (C.back = 0; Xe = C.lencode[G & (1 << C.lenbits) - 1], Ue = Xe >>> 24, it = Xe >>> 16 & 255, gt = Xe & 65535, !(Ue <= te); ) {
                    if (ce === 0)
                      break e;
                    ce--, G += me[y++] << te, te += 8;
                  }
                  if (it && (it & 240) === 0) {
                    for (At = Ue, Vr = it, Kr = gt; Xe = C.lencode[Kr + ((G & (1 << At + Vr) - 1) >> At)], Ue = Xe >>> 24, it = Xe >>> 16 & 255, gt = Xe & 65535, !(At + Ue <= te); ) {
                      if (ce === 0)
                        break e;
                      ce--, G += me[y++] << te, te += 8;
                    }
                    G >>>= At, te -= At, C.back += At;
                  }
                  if (G >>>= Ue, te -= Ue, C.back += Ue, C.length = gt, it === 0) {
                    C.mode = Y;
                    break;
                  }
                  if (it & 32) {
                    C.back = -1, C.mode = Q;
                    break;
                  }
                  if (it & 64) {
                    V.msg = "invalid literal/length code", C.mode = Te;
                    break;
                  }
                  C.extra = it & 15, C.mode = ee;
                /* falls through */
                case ee:
                  if (C.extra) {
                    for (Ft = C.extra; te < Ft; ) {
                      if (ce === 0)
                        break e;
                      ce--, G += me[y++] << te, te += 8;
                    }
                    C.length += G & (1 << C.extra) - 1, G >>>= C.extra, te -= C.extra, C.back += C.extra;
                  }
                  C.was = C.length, C.mode = de;
                /* falls through */
                case de:
                  for (; Xe = C.distcode[G & (1 << C.distbits) - 1], Ue = Xe >>> 24, it = Xe >>> 16 & 255, gt = Xe & 65535, !(Ue <= te); ) {
                    if (ce === 0)
                      break e;
                    ce--, G += me[y++] << te, te += 8;
                  }
                  if ((it & 240) === 0) {
                    for (At = Ue, Vr = it, Kr = gt; Xe = C.distcode[Kr + ((G & (1 << At + Vr) - 1) >> At)], Ue = Xe >>> 24, it = Xe >>> 16 & 255, gt = Xe & 65535, !(At + Ue <= te); ) {
                      if (ce === 0)
                        break e;
                      ce--, G += me[y++] << te, te += 8;
                    }
                    G >>>= At, te -= At, C.back += At;
                  }
                  if (G >>>= Ue, te -= Ue, C.back += Ue, it & 64) {
                    V.msg = "invalid distance code", C.mode = Te;
                    break;
                  }
                  C.offset = gt, C.extra = it & 15, C.mode = ge;
                /* falls through */
                case ge:
                  if (C.extra) {
                    for (Ft = C.extra; te < Ft; ) {
                      if (ce === 0)
                        break e;
                      ce--, G += me[y++] << te, te += 8;
                    }
                    C.offset += G & (1 << C.extra) - 1, G >>>= C.extra, te -= C.extra, C.back += C.extra;
                  }
                  if (C.offset > C.dmax) {
                    V.msg = "invalid distance too far back", C.mode = Te;
                    break;
                  }
                  C.mode = ue;
                /* falls through */
                case ue:
                  if (L === 0)
                    break e;
                  if (Re = Ae - L, C.offset > Re) {
                    if (Re = C.offset - Re, Re > C.whave && C.sane) {
                      V.msg = "invalid distance too far back", C.mode = Te;
                      break;
                    }
                    Re > C.wnext ? (Re -= C.wnext, Ne = C.wsize - Re) : Ne = C.wnext - Re, Re > C.length && (Re = C.length), Tt = C.window;
                  } else
                    Tt = ke, Ne = le - C.offset, Re = C.length;
                  Re > L && (Re = L), L -= Re, C.length -= Re;
                  do
                    ke[le++] = Tt[Ne++];
                  while (--Re);
                  C.length === 0 && (C.mode = K);
                  break;
                case Y:
                  if (L === 0)
                    break e;
                  ke[le++] = C.length, L--, C.mode = K;
                  break;
                case q:
                  if (C.wrap) {
                    for (; te < 32; ) {
                      if (ce === 0)
                        break e;
                      ce--, G |= me[y++] << te, te += 8;
                    }
                    if (Ae -= L, V.total_out += Ae, C.total += Ae, Ae && (V.adler = C.check = /*UPDATE(state.check, put - _out, _out);*/
                    C.flags ? l(C.check, ke, Ae, le - Ae) : a(C.check, ke, Ae, le - Ae)), Ae = L, (C.flags ? G : J(G)) !== C.check) {
                      V.msg = "incorrect data check", C.mode = Te;
                      break;
                    }
                    G = 0, te = 0;
                  }
                  C.mode = he;
                /* falls through */
                case he:
                  if (C.wrap && C.flags) {
                    for (; te < 32; ) {
                      if (ce === 0)
                        break e;
                      ce--, G += me[y++] << te, te += 8;
                    }
                    if (G !== (C.total & 4294967295)) {
                      V.msg = "incorrect length check", C.mode = Te;
                      break;
                    }
                    G = 0, te = 0;
                  }
                  C.mode = Se;
                /* falls through */
                case Se:
                  Ot = v;
                  break e;
                case Te:
                  Ot = T;
                  break e;
                case F:
                  return x;
                case z:
                /* falls through */
                default:
                  return E;
              }
          return V.next_out = le, V.avail_out = L, V.next_in = y, V.avail_in = ce, C.hold = G, C.bits = te, (C.wsize || Ae !== V.avail_out && C.mode < Te && (C.mode < q || se !== p)) && Et(V, V.output, V.next_out, Ae - V.avail_out), xe -= V.avail_in, Ae -= V.avail_out, V.total_in += xe, V.total_out += Ae, C.total += Ae, C.wrap && Ae && (V.adler = C.check = /*UPDATE(state.check, strm.next_out - _out, _out);*/
          C.flags ? l(C.check, ke, Ae, V.next_out - Ae) : a(C.check, ke, Ae, V.next_out - Ae)), V.data_type = C.bits + (C.last ? 64 : 0) + (C.mode === Q ? 128 : 0) + (C.mode === Z || C.mode === ae ? 256 : 0), (xe === 0 && Ae === 0 || se === p) && Ot === _ && (Ot = A), Ot;
        }
        function ve(V) {
          if (!V || !V.state)
            return E;
          var se = V.state;
          return se.window && (se.window = null), V.state = null, _;
        }
        function fe(V, se) {
          var C;
          return !V || !V.state || (C = V.state, (C.wrap & 2) === 0) ? E : (C.head = se, se.done = !1, _);
        }
        function we(V, se) {
          var C = se.length, me, ke, y;
          return !V || !V.state || (me = V.state, me.wrap !== 0 && me.mode !== D) ? E : me.mode === D && (ke = 1, ke = a(ke, se, C, 0), ke !== me.check) ? T : (y = Et(V, se, C, C), y ? (me.mode = F, x) : (me.havedict = 1, _));
        }
        n.inflateReset = Oe, n.inflateReset2 = Be, n.inflateResetKeep = _e, n.inflateInit = He, n.inflateInit2 = De, n.inflate = B, n.inflateEnd = ve, n.inflateGetHeader = fe, n.inflateSetDictionary = we, n.inflateInfo = "pako inflate (from Nodeca project)";
      }, { "../utils/common": 52, "./adler32": 53, "./crc32": 55, "./inffast": 57, "./inftrees": 59 }], 59: [function(r, i, n) {
        var o = r("../utils/common"), a = 15, l = 852, f = 592, h = 0, s = 1, u = 2, c = [
          /* Length codes 257..285 base */
          3,
          4,
          5,
          6,
          7,
          8,
          9,
          10,
          11,
          13,
          15,
          17,
          19,
          23,
          27,
          31,
          35,
          43,
          51,
          59,
          67,
          83,
          99,
          115,
          131,
          163,
          195,
          227,
          258,
          0,
          0
        ], p = [
          /* Length codes 257..285 extra */
          16,
          16,
          16,
          16,
          16,
          16,
          16,
          16,
          17,
          17,
          17,
          17,
          18,
          18,
          18,
          18,
          19,
          19,
          19,
          19,
          20,
          20,
          20,
          20,
          21,
          21,
          21,
          21,
          16,
          72,
          78
        ], m = [
          /* Distance codes 0..29 base */
          1,
          2,
          3,
          4,
          5,
          7,
          9,
          13,
          17,
          25,
          33,
          49,
          65,
          97,
          129,
          193,
          257,
          385,
          513,
          769,
          1025,
          1537,
          2049,
          3073,
          4097,
          6145,
          8193,
          12289,
          16385,
          24577,
          0,
          0
        ], d = [
          /* Distance codes 0..29 extra */
          16,
          16,
          16,
          16,
          17,
          17,
          18,
          18,
          19,
          19,
          20,
          20,
          21,
          21,
          22,
          22,
          23,
          23,
          24,
          24,
          25,
          25,
          26,
          26,
          27,
          27,
          28,
          28,
          29,
          29,
          64,
          64
        ];
        i.exports = function(v, k, E, T, x, A, I, R) {
          var M = R.bits, b = 0, N = 0, j = 0, $ = 0, re = 0, ne = 0, U = 0, P = 0, D = 0, Q = 0, W, oe, ae, H, X, ie = null, pe = 0, Z, K = new o.Buf16(a + 1), ee = new o.Buf16(a + 1), de = null, ge = 0, ue, Y, q;
          for (b = 0; b <= a; b++)
            K[b] = 0;
          for (N = 0; N < T; N++)
            K[k[E + N]]++;
          for (re = M, $ = a; $ >= 1 && K[$] === 0; $--)
            ;
          if (re > $ && (re = $), $ === 0)
            return x[A++] = 1 << 24 | 64 << 16 | 0, x[A++] = 1 << 24 | 64 << 16 | 0, R.bits = 1, 0;
          for (j = 1; j < $ && K[j] === 0; j++)
            ;
          for (re < j && (re = j), P = 1, b = 1; b <= a; b++)
            if (P <<= 1, P -= K[b], P < 0)
              return -1;
          if (P > 0 && (v === h || $ !== 1))
            return -1;
          for (ee[1] = 0, b = 1; b < a; b++)
            ee[b + 1] = ee[b] + K[b];
          for (N = 0; N < T; N++)
            k[E + N] !== 0 && (I[ee[k[E + N]]++] = N);
          if (v === h ? (ie = de = I, Z = 19) : v === s ? (ie = c, pe -= 257, de = p, ge -= 257, Z = 256) : (ie = m, de = d, Z = -1), Q = 0, N = 0, b = j, X = A, ne = re, U = 0, ae = -1, D = 1 << re, H = D - 1, v === s && D > l || v === u && D > f)
            return 1;
          for (; ; ) {
            ue = b - U, I[N] < Z ? (Y = 0, q = I[N]) : I[N] > Z ? (Y = de[ge + I[N]], q = ie[pe + I[N]]) : (Y = 96, q = 0), W = 1 << b - U, oe = 1 << ne, j = oe;
            do
              oe -= W, x[X + (Q >> U) + oe] = ue << 24 | Y << 16 | q | 0;
            while (oe !== 0);
            for (W = 1 << b - 1; Q & W; )
              W >>= 1;
            if (W !== 0 ? (Q &= W - 1, Q += W) : Q = 0, N++, --K[b] === 0) {
              if (b === $)
                break;
              b = k[E + I[N]];
            }
            if (b > re && (Q & H) !== ae) {
              for (U === 0 && (U = re), X += j, ne = b - U, P = 1 << ne; ne + U < $ && (P -= K[ne + U], !(P <= 0)); )
                ne++, P <<= 1;
              if (D += 1 << ne, v === s && D > l || v === u && D > f)
                return 1;
              ae = Q & H, x[ae] = re << 24 | ne << 16 | X - A | 0;
            }
          }
          return Q !== 0 && (x[X + Q] = b - U << 24 | 64 << 16 | 0), R.bits = re, 0;
        };
      }, { "../utils/common": 52 }], 60: [function(r, i, n) {
        i.exports = {
          2: "need dictionary",
          /* Z_NEED_DICT       2  */
          1: "stream end",
          /* Z_STREAM_END      1  */
          0: "",
          /* Z_OK              0  */
          "-1": "file error",
          /* Z_ERRNO         (-1) */
          "-2": "stream error",
          /* Z_STREAM_ERROR  (-2) */
          "-3": "data error",
          /* Z_DATA_ERROR    (-3) */
          "-4": "insufficient memory",
          /* Z_MEM_ERROR     (-4) */
          "-5": "buffer error",
          /* Z_BUF_ERROR     (-5) */
          "-6": "incompatible version"
          /* Z_VERSION_ERROR (-6) */
        };
      }, {}], 61: [function(r, i, n) {
        var o = r("../utils/common"), a = 4, l = 0, f = 1, h = 2;
        function s(B) {
          for (var ve = B.length; --ve >= 0; )
            B[ve] = 0;
        }
        var u = 0, c = 1, p = 2, m = 3, d = 258, _ = 29, v = 256, k = v + 1 + _, E = 30, T = 19, x = 2 * k + 1, A = 15, I = 16, R = 7, M = 256, b = 16, N = 17, j = 18, $ = (
          /* extra bits for each length code */
          [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0]
        ), re = (
          /* extra bits for each distance code */
          [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13]
        ), ne = (
          /* extra bits for each bit length code */
          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7]
        ), U = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15], P = 512, D = new Array((k + 2) * 2);
        s(D);
        var Q = new Array(E * 2);
        s(Q);
        var W = new Array(P);
        s(W);
        var oe = new Array(d - m + 1);
        s(oe);
        var ae = new Array(_);
        s(ae);
        var H = new Array(E);
        s(H);
        function X(B, ve, fe, we, V) {
          this.static_tree = B, this.extra_bits = ve, this.extra_base = fe, this.elems = we, this.max_length = V, this.has_stree = B && B.length;
        }
        var ie, pe, Z;
        function K(B, ve) {
          this.dyn_tree = B, this.max_code = 0, this.stat_desc = ve;
        }
        function ee(B) {
          return B < 256 ? W[B] : W[256 + (B >>> 7)];
        }
        function de(B, ve) {
          B.pending_buf[B.pending++] = ve & 255, B.pending_buf[B.pending++] = ve >>> 8 & 255;
        }
        function ge(B, ve, fe) {
          B.bi_valid > I - fe ? (B.bi_buf |= ve << B.bi_valid & 65535, de(B, B.bi_buf), B.bi_buf = ve >> I - B.bi_valid, B.bi_valid += fe - I) : (B.bi_buf |= ve << B.bi_valid & 65535, B.bi_valid += fe);
        }
        function ue(B, ve, fe) {
          ge(
            B,
            fe[ve * 2],
            fe[ve * 2 + 1]
            /*.Len*/
          );
        }
        function Y(B, ve) {
          var fe = 0;
          do
            fe |= B & 1, B >>>= 1, fe <<= 1;
          while (--ve > 0);
          return fe >>> 1;
        }
        function q(B) {
          B.bi_valid === 16 ? (de(B, B.bi_buf), B.bi_buf = 0, B.bi_valid = 0) : B.bi_valid >= 8 && (B.pending_buf[B.pending++] = B.bi_buf & 255, B.bi_buf >>= 8, B.bi_valid -= 8);
        }
        function he(B, ve) {
          var fe = ve.dyn_tree, we = ve.max_code, V = ve.stat_desc.static_tree, se = ve.stat_desc.has_stree, C = ve.stat_desc.extra_bits, me = ve.stat_desc.extra_base, ke = ve.stat_desc.max_length, y, le, ce, L, G, te, xe = 0;
          for (L = 0; L <= A; L++)
            B.bl_count[L] = 0;
          for (fe[B.heap[B.heap_max] * 2 + 1] = 0, y = B.heap_max + 1; y < x; y++)
            le = B.heap[y], L = fe[fe[le * 2 + 1] * 2 + 1] + 1, L > ke && (L = ke, xe++), fe[le * 2 + 1] = L, !(le > we) && (B.bl_count[L]++, G = 0, le >= me && (G = C[le - me]), te = fe[le * 2], B.opt_len += te * (L + G), se && (B.static_len += te * (V[le * 2 + 1] + G)));
          if (xe !== 0) {
            do {
              for (L = ke - 1; B.bl_count[L] === 0; )
                L--;
              B.bl_count[L]--, B.bl_count[L + 1] += 2, B.bl_count[ke]--, xe -= 2;
            } while (xe > 0);
            for (L = ke; L !== 0; L--)
              for (le = B.bl_count[L]; le !== 0; )
                ce = B.heap[--y], !(ce > we) && (fe[ce * 2 + 1] !== L && (B.opt_len += (L - fe[ce * 2 + 1]) * fe[ce * 2], fe[ce * 2 + 1] = L), le--);
          }
        }
        function Se(B, ve, fe) {
          var we = new Array(A + 1), V = 0, se, C;
          for (se = 1; se <= A; se++)
            we[se] = V = V + fe[se - 1] << 1;
          for (C = 0; C <= ve; C++) {
            var me = B[C * 2 + 1];
            me !== 0 && (B[C * 2] = Y(we[me]++, me));
          }
        }
        function Te() {
          var B, ve, fe, we, V, se = new Array(A + 1);
          for (fe = 0, we = 0; we < _ - 1; we++)
            for (ae[we] = fe, B = 0; B < 1 << $[we]; B++)
              oe[fe++] = we;
          for (oe[fe - 1] = we, V = 0, we = 0; we < 16; we++)
            for (H[we] = V, B = 0; B < 1 << re[we]; B++)
              W[V++] = we;
          for (V >>= 7; we < E; we++)
            for (H[we] = V << 7, B = 0; B < 1 << re[we] - 7; B++)
              W[256 + V++] = we;
          for (ve = 0; ve <= A; ve++)
            se[ve] = 0;
          for (B = 0; B <= 143; )
            D[B * 2 + 1] = 8, B++, se[8]++;
          for (; B <= 255; )
            D[B * 2 + 1] = 9, B++, se[9]++;
          for (; B <= 279; )
            D[B * 2 + 1] = 7, B++, se[7]++;
          for (; B <= 287; )
            D[B * 2 + 1] = 8, B++, se[8]++;
          for (Se(D, k + 1, se), B = 0; B < E; B++)
            Q[B * 2 + 1] = 5, Q[B * 2] = Y(B, 5);
          ie = new X(D, $, v + 1, k, A), pe = new X(Q, re, 0, E, A), Z = new X(new Array(0), ne, 0, T, R);
        }
        function F(B) {
          var ve;
          for (ve = 0; ve < k; ve++)
            B.dyn_ltree[ve * 2] = 0;
          for (ve = 0; ve < E; ve++)
            B.dyn_dtree[ve * 2] = 0;
          for (ve = 0; ve < T; ve++)
            B.bl_tree[ve * 2] = 0;
          B.dyn_ltree[M * 2] = 1, B.opt_len = B.static_len = 0, B.last_lit = B.matches = 0;
        }
        function z(B) {
          B.bi_valid > 8 ? de(B, B.bi_buf) : B.bi_valid > 0 && (B.pending_buf[B.pending++] = B.bi_buf), B.bi_buf = 0, B.bi_valid = 0;
        }
        function O(B, ve, fe, we) {
          z(B), de(B, fe), de(B, ~fe), o.arraySet(B.pending_buf, B.window, ve, fe, B.pending), B.pending += fe;
        }
        function g(B, ve, fe, we) {
          var V = ve * 2, se = fe * 2;
          return B[V] < B[se] || B[V] === B[se] && we[ve] <= we[fe];
        }
        function w(B, ve, fe) {
          for (var we = B.heap[fe], V = fe << 1; V <= B.heap_len && (V < B.heap_len && g(ve, B.heap[V + 1], B.heap[V], B.depth) && V++, !g(ve, we, B.heap[V], B.depth)); )
            B.heap[fe] = B.heap[V], fe = V, V <<= 1;
          B.heap[fe] = we;
        }
        function S(B, ve, fe) {
          var we, V, se = 0, C, me;
          if (B.last_lit !== 0)
            do
              we = B.pending_buf[B.d_buf + se * 2] << 8 | B.pending_buf[B.d_buf + se * 2 + 1], V = B.pending_buf[B.l_buf + se], se++, we === 0 ? ue(B, V, ve) : (C = oe[V], ue(B, C + v + 1, ve), me = $[C], me !== 0 && (V -= ae[C], ge(B, V, me)), we--, C = ee(we), ue(B, C, fe), me = re[C], me !== 0 && (we -= H[C], ge(B, we, me)));
            while (se < B.last_lit);
          ue(B, M, ve);
        }
        function J(B, ve) {
          var fe = ve.dyn_tree, we = ve.stat_desc.static_tree, V = ve.stat_desc.has_stree, se = ve.stat_desc.elems, C, me, ke = -1, y;
          for (B.heap_len = 0, B.heap_max = x, C = 0; C < se; C++)
            fe[C * 2] !== 0 ? (B.heap[++B.heap_len] = ke = C, B.depth[C] = 0) : fe[C * 2 + 1] = 0;
          for (; B.heap_len < 2; )
            y = B.heap[++B.heap_len] = ke < 2 ? ++ke : 0, fe[y * 2] = 1, B.depth[y] = 0, B.opt_len--, V && (B.static_len -= we[y * 2 + 1]);
          for (ve.max_code = ke, C = B.heap_len >> 1; C >= 1; C--)
            w(B, fe, C);
          y = se;
          do
            C = B.heap[
              1
              /*SMALLEST*/
            ], B.heap[
              1
              /*SMALLEST*/
            ] = B.heap[B.heap_len--], w(
              B,
              fe,
              1
              /*SMALLEST*/
            ), me = B.heap[
              1
              /*SMALLEST*/
            ], B.heap[--B.heap_max] = C, B.heap[--B.heap_max] = me, fe[y * 2] = fe[C * 2] + fe[me * 2], B.depth[y] = (B.depth[C] >= B.depth[me] ? B.depth[C] : B.depth[me]) + 1, fe[C * 2 + 1] = fe[me * 2 + 1] = y, B.heap[
              1
              /*SMALLEST*/
            ] = y++, w(
              B,
              fe,
              1
              /*SMALLEST*/
            );
          while (B.heap_len >= 2);
          B.heap[--B.heap_max] = B.heap[
            1
            /*SMALLEST*/
          ], he(B, ve), Se(fe, ke, B.bl_count);
        }
        function be(B, ve, fe) {
          var we, V = -1, se, C = ve[1], me = 0, ke = 7, y = 4;
          for (C === 0 && (ke = 138, y = 3), ve[(fe + 1) * 2 + 1] = 65535, we = 0; we <= fe; we++)
            se = C, C = ve[(we + 1) * 2 + 1], !(++me < ke && se === C) && (me < y ? B.bl_tree[se * 2] += me : se !== 0 ? (se !== V && B.bl_tree[se * 2]++, B.bl_tree[b * 2]++) : me <= 10 ? B.bl_tree[N * 2]++ : B.bl_tree[j * 2]++, me = 0, V = se, C === 0 ? (ke = 138, y = 3) : se === C ? (ke = 6, y = 3) : (ke = 7, y = 4));
        }
        function _e(B, ve, fe) {
          var we, V = -1, se, C = ve[1], me = 0, ke = 7, y = 4;
          for (C === 0 && (ke = 138, y = 3), we = 0; we <= fe; we++)
            if (se = C, C = ve[(we + 1) * 2 + 1], !(++me < ke && se === C)) {
              if (me < y)
                do
                  ue(B, se, B.bl_tree);
                while (--me !== 0);
              else se !== 0 ? (se !== V && (ue(B, se, B.bl_tree), me--), ue(B, b, B.bl_tree), ge(B, me - 3, 2)) : me <= 10 ? (ue(B, N, B.bl_tree), ge(B, me - 3, 3)) : (ue(B, j, B.bl_tree), ge(B, me - 11, 7));
              me = 0, V = se, C === 0 ? (ke = 138, y = 3) : se === C ? (ke = 6, y = 3) : (ke = 7, y = 4);
            }
        }
        function Oe(B) {
          var ve;
          for (be(B, B.dyn_ltree, B.l_desc.max_code), be(B, B.dyn_dtree, B.d_desc.max_code), J(B, B.bl_desc), ve = T - 1; ve >= 3 && B.bl_tree[U[ve] * 2 + 1] === 0; ve--)
            ;
          return B.opt_len += 3 * (ve + 1) + 5 + 5 + 4, ve;
        }
        function Be(B, ve, fe, we) {
          var V;
          for (ge(B, ve - 257, 5), ge(B, fe - 1, 5), ge(B, we - 4, 4), V = 0; V < we; V++)
            ge(B, B.bl_tree[U[V] * 2 + 1], 3);
          _e(B, B.dyn_ltree, ve - 1), _e(B, B.dyn_dtree, fe - 1);
        }
        function De(B) {
          var ve = 4093624447, fe;
          for (fe = 0; fe <= 31; fe++, ve >>>= 1)
            if (ve & 1 && B.dyn_ltree[fe * 2] !== 0)
              return l;
          if (B.dyn_ltree[18] !== 0 || B.dyn_ltree[20] !== 0 || B.dyn_ltree[26] !== 0)
            return f;
          for (fe = 32; fe < v; fe++)
            if (B.dyn_ltree[fe * 2] !== 0)
              return f;
          return l;
        }
        var He = !1;
        function Fe(B) {
          He || (Te(), He = !0), B.l_desc = new K(B.dyn_ltree, ie), B.d_desc = new K(B.dyn_dtree, pe), B.bl_desc = new K(B.bl_tree, Z), B.bi_buf = 0, B.bi_valid = 0, F(B);
        }
        function ht(B, ve, fe, we) {
          ge(B, (u << 1) + (we ? 1 : 0), 3), O(B, ve, fe);
        }
        function qe(B) {
          ge(B, c << 1, 3), ue(B, M, D), q(B);
        }
        function tt(B, ve, fe, we) {
          var V, se, C = 0;
          B.level > 0 ? (B.strm.data_type === h && (B.strm.data_type = De(B)), J(B, B.l_desc), J(B, B.d_desc), C = Oe(B), V = B.opt_len + 3 + 7 >>> 3, se = B.static_len + 3 + 7 >>> 3, se <= V && (V = se)) : V = se = fe + 5, fe + 4 <= V && ve !== -1 ? ht(B, ve, fe, we) : B.strategy === a || se === V ? (ge(B, (c << 1) + (we ? 1 : 0), 3), S(B, D, Q)) : (ge(B, (p << 1) + (we ? 1 : 0), 3), Be(B, B.l_desc.max_code + 1, B.d_desc.max_code + 1, C + 1), S(B, B.dyn_ltree, B.dyn_dtree)), F(B), we && z(B);
        }
        function Et(B, ve, fe) {
          return B.pending_buf[B.d_buf + B.last_lit * 2] = ve >>> 8 & 255, B.pending_buf[B.d_buf + B.last_lit * 2 + 1] = ve & 255, B.pending_buf[B.l_buf + B.last_lit] = fe & 255, B.last_lit++, ve === 0 ? B.dyn_ltree[fe * 2]++ : (B.matches++, ve--, B.dyn_ltree[(oe[fe] + v + 1) * 2]++, B.dyn_dtree[ee(ve) * 2]++), B.last_lit === B.lit_bufsize - 1;
        }
        n._tr_init = Fe, n._tr_stored_block = ht, n._tr_flush_block = tt, n._tr_tally = Et, n._tr_align = qe;
      }, { "../utils/common": 52 }], 62: [function(r, i, n) {
        function o() {
          this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
        }
        i.exports = o;
      }, {}], 63: [function(r, i, n) {
        var o = i.exports = {}, a, l;
        function f() {
          throw new Error("setTimeout has not been defined");
        }
        function h() {
          throw new Error("clearTimeout has not been defined");
        }
        (function() {
          try {
            typeof setTimeout == "function" ? a = setTimeout : a = f;
          } catch {
            a = f;
          }
          try {
            typeof clearTimeout == "function" ? l = clearTimeout : l = h;
          } catch {
            l = h;
          }
        })();
        function s(T) {
          if (a === setTimeout)
            return setTimeout(T, 0);
          if ((a === f || !a) && setTimeout)
            return a = setTimeout, setTimeout(T, 0);
          try {
            return a(T, 0);
          } catch {
            try {
              return a.call(null, T, 0);
            } catch {
              return a.call(this, T, 0);
            }
          }
        }
        function u(T) {
          if (l === clearTimeout)
            return clearTimeout(T);
          if ((l === h || !l) && clearTimeout)
            return l = clearTimeout, clearTimeout(T);
          try {
            return l(T);
          } catch {
            try {
              return l.call(null, T);
            } catch {
              return l.call(this, T);
            }
          }
        }
        var c = [], p = !1, m, d = -1;
        function _() {
          !p || !m || (p = !1, m.length ? c = m.concat(c) : d = -1, c.length && v());
        }
        function v() {
          if (!p) {
            var T = s(_);
            p = !0;
            for (var x = c.length; x; ) {
              for (m = c, c = []; ++d < x; )
                m && m[d].run();
              d = -1, x = c.length;
            }
            m = null, p = !1, u(T);
          }
        }
        o.nextTick = function(T) {
          var x = new Array(arguments.length - 1);
          if (arguments.length > 1)
            for (var A = 1; A < arguments.length; A++)
              x[A - 1] = arguments[A];
          c.push(new k(T, x)), c.length === 1 && !p && s(v);
        };
        function k(T, x) {
          this.fun = T, this.array = x;
        }
        k.prototype.run = function() {
          this.fun.apply(null, this.array);
        }, o.title = "browser", o.browser = !0, o.env = {}, o.argv = [], o.version = "", o.versions = {};
        function E() {
        }
        o.on = E, o.addListener = E, o.once = E, o.off = E, o.removeListener = E, o.removeAllListeners = E, o.emit = E, o.prependListener = E, o.prependOnceListener = E, o.listeners = function(T) {
          return [];
        }, o.binding = function(T) {
          throw new Error("process.binding is not supported");
        }, o.cwd = function() {
          return "/";
        }, o.chdir = function(T) {
          throw new Error("process.chdir is not supported");
        }, o.umask = function() {
          return 0;
        };
      }, {}], 64: [function(r, i, n) {
        /*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
        var o = r("buffer"), a = o.Buffer;
        function l(h, s) {
          for (var u in h)
            s[u] = h[u];
        }
        a.from && a.alloc && a.allocUnsafe && a.allocUnsafeSlow ? i.exports = o : (l(o, n), n.Buffer = f);
        function f(h, s, u) {
          return a(h, s, u);
        }
        f.prototype = Object.create(a.prototype), l(a, f), f.from = function(h, s, u) {
          if (typeof h == "number")
            throw new TypeError("Argument must not be a number");
          return a(h, s, u);
        }, f.alloc = function(h, s, u) {
          if (typeof h != "number")
            throw new TypeError("Argument must be a number");
          var c = a(h);
          return s !== void 0 ? typeof u == "string" ? c.fill(s, u) : c.fill(s) : c.fill(0), c;
        }, f.allocUnsafe = function(h) {
          if (typeof h != "number")
            throw new TypeError("Argument must be a number");
          return a(h);
        }, f.allocUnsafeSlow = function(h) {
          if (typeof h != "number")
            throw new TypeError("Argument must be a number");
          return o.SlowBuffer(h);
        };
      }, { buffer: 32 }], 65: [function(r, i, n) {
        i.exports = l;
        var o = r("events").EventEmitter, a = r("inherits");
        a(l, o), l.Readable = r("readable-stream/lib/_stream_readable.js"), l.Writable = r("readable-stream/lib/_stream_writable.js"), l.Duplex = r("readable-stream/lib/_stream_duplex.js"), l.Transform = r("readable-stream/lib/_stream_transform.js"), l.PassThrough = r("readable-stream/lib/_stream_passthrough.js"), l.finished = r("readable-stream/lib/internal/streams/end-of-stream.js"), l.pipeline = r("readable-stream/lib/internal/streams/pipeline.js"), l.Stream = l;
        function l() {
          o.call(this);
        }
        l.prototype.pipe = function(f, h) {
          var s = this;
          function u(k) {
            f.writable && f.write(k) === !1 && s.pause && s.pause();
          }
          s.on("data", u);
          function c() {
            s.readable && s.resume && s.resume();
          }
          f.on("drain", c), !f._isStdio && (!h || h.end !== !1) && (s.on("end", m), s.on("close", d));
          var p = !1;
          function m() {
            p || (p = !0, f.end());
          }
          function d() {
            p || (p = !0, typeof f.destroy == "function" && f.destroy());
          }
          function _(k) {
            if (v(), o.listenerCount(this, "error") === 0)
              throw k;
          }
          s.on("error", _), f.on("error", _);
          function v() {
            s.removeListener("data", u), f.removeListener("drain", c), s.removeListener("end", m), s.removeListener("close", d), s.removeListener("error", _), f.removeListener("error", _), s.removeListener("end", v), s.removeListener("close", v), f.removeListener("close", v);
          }
          return s.on("end", v), s.on("close", v), f.on("close", v), f.emit("pipe", s), f;
        };
      }, { events: 35, inherits: 46, "readable-stream/lib/_stream_duplex.js": 67, "readable-stream/lib/_stream_passthrough.js": 68, "readable-stream/lib/_stream_readable.js": 69, "readable-stream/lib/_stream_transform.js": 70, "readable-stream/lib/_stream_writable.js": 71, "readable-stream/lib/internal/streams/end-of-stream.js": 75, "readable-stream/lib/internal/streams/pipeline.js": 77 }], 66: [function(r, i, n) {
        function o(c, p) {
          c.prototype = Object.create(p.prototype), c.prototype.constructor = c, c.__proto__ = p;
        }
        var a = {};
        function l(c, p, m) {
          m || (m = Error);
          function d(v, k, E) {
            return typeof p == "string" ? p : p(v, k, E);
          }
          var _ = /* @__PURE__ */ (function(v) {
            o(k, v);
            function k(E, T, x) {
              return v.call(this, d(E, T, x)) || this;
            }
            return k;
          })(m);
          _.prototype.name = m.name, _.prototype.code = c, a[c] = _;
        }
        function f(c, p) {
          if (Array.isArray(c)) {
            var m = c.length;
            return c = c.map(function(d) {
              return String(d);
            }), m > 2 ? "one of ".concat(p, " ").concat(c.slice(0, m - 1).join(", "), ", or ") + c[m - 1] : m === 2 ? "one of ".concat(p, " ").concat(c[0], " or ").concat(c[1]) : "of ".concat(p, " ").concat(c[0]);
          } else
            return "of ".concat(p, " ").concat(String(c));
        }
        function h(c, p, m) {
          return c.substr(0, p.length) === p;
        }
        function s(c, p, m) {
          return (m === void 0 || m > c.length) && (m = c.length), c.substring(m - p.length, m) === p;
        }
        function u(c, p, m) {
          return typeof m != "number" && (m = 0), m + p.length > c.length ? !1 : c.indexOf(p, m) !== -1;
        }
        l("ERR_INVALID_OPT_VALUE", function(c, p) {
          return 'The value "' + p + '" is invalid for option "' + c + '"';
        }, TypeError), l("ERR_INVALID_ARG_TYPE", function(c, p, m) {
          var d;
          typeof p == "string" && h(p, "not ") ? (d = "must not be", p = p.replace(/^not /, "")) : d = "must be";
          var _;
          if (s(c, " argument"))
            _ = "The ".concat(c, " ").concat(d, " ").concat(f(p, "type"));
          else {
            var v = u(c, ".") ? "property" : "argument";
            _ = 'The "'.concat(c, '" ').concat(v, " ").concat(d, " ").concat(f(p, "type"));
          }
          return _ += ". Received type ".concat(typeof m), _;
        }, TypeError), l("ERR_STREAM_PUSH_AFTER_EOF", "stream.push() after EOF"), l("ERR_METHOD_NOT_IMPLEMENTED", function(c) {
          return "The " + c + " method is not implemented";
        }), l("ERR_STREAM_PREMATURE_CLOSE", "Premature close"), l("ERR_STREAM_DESTROYED", function(c) {
          return "Cannot call " + c + " after a stream was destroyed";
        }), l("ERR_MULTIPLE_CALLBACK", "Callback called multiple times"), l("ERR_STREAM_CANNOT_PIPE", "Cannot pipe, not readable"), l("ERR_STREAM_WRITE_AFTER_END", "write after end"), l("ERR_STREAM_NULL_VALUES", "May not write null values to stream", TypeError), l("ERR_UNKNOWN_ENCODING", function(c) {
          return "Unknown encoding: " + c;
        }, TypeError), l("ERR_STREAM_UNSHIFT_AFTER_END_EVENT", "stream.unshift() after end event"), i.exports.codes = a;
      }, {}], 67: [function(r, i, n) {
        (function(o) {
          (function() {
            var a = Object.keys || function(d) {
              var _ = [];
              for (var v in d)
                _.push(v);
              return _;
            };
            i.exports = c;
            var l = r("./_stream_readable"), f = r("./_stream_writable");
            r("inherits")(c, l);
            for (var h = a(f.prototype), s = 0; s < h.length; s++) {
              var u = h[s];
              c.prototype[u] || (c.prototype[u] = f.prototype[u]);
            }
            function c(d) {
              if (!(this instanceof c)) return new c(d);
              l.call(this, d), f.call(this, d), this.allowHalfOpen = !0, d && (d.readable === !1 && (this.readable = !1), d.writable === !1 && (this.writable = !1), d.allowHalfOpen === !1 && (this.allowHalfOpen = !1, this.once("end", p)));
            }
            Object.defineProperty(c.prototype, "writableHighWaterMark", {
              // making it explicit this property is not enumerable
              // because otherwise some prototype manipulation in
              // userland will fail
              enumerable: !1,
              get: function() {
                return this._writableState.highWaterMark;
              }
            }), Object.defineProperty(c.prototype, "writableBuffer", {
              // making it explicit this property is not enumerable
              // because otherwise some prototype manipulation in
              // userland will fail
              enumerable: !1,
              get: function() {
                return this._writableState && this._writableState.getBuffer();
              }
            }), Object.defineProperty(c.prototype, "writableLength", {
              // making it explicit this property is not enumerable
              // because otherwise some prototype manipulation in
              // userland will fail
              enumerable: !1,
              get: function() {
                return this._writableState.length;
              }
            });
            function p() {
              this._writableState.ended || o.nextTick(m, this);
            }
            function m(d) {
              d.end();
            }
            Object.defineProperty(c.prototype, "destroyed", {
              // making it explicit this property is not enumerable
              // because otherwise some prototype manipulation in
              // userland will fail
              enumerable: !1,
              get: function() {
                return this._readableState === void 0 || this._writableState === void 0 ? !1 : this._readableState.destroyed && this._writableState.destroyed;
              },
              set: function(_) {
                this._readableState === void 0 || this._writableState === void 0 || (this._readableState.destroyed = _, this._writableState.destroyed = _);
              }
            });
          }).call(this);
        }).call(this, r("_process"));
      }, { "./_stream_readable": 69, "./_stream_writable": 71, _process: 63, inherits: 46 }], 68: [function(r, i, n) {
        i.exports = a;
        var o = r("./_stream_transform");
        r("inherits")(a, o);
        function a(l) {
          if (!(this instanceof a)) return new a(l);
          o.call(this, l);
        }
        a.prototype._transform = function(l, f, h) {
          h(null, l);
        };
      }, { "./_stream_transform": 70, inherits: 46 }], 69: [function(r, i, n) {
        (function(o, a) {
          (function() {
            i.exports = U;
            var l;
            U.ReadableState = ne, r("events").EventEmitter;
            var f = function(z, O) {
              return z.listeners(O).length;
            }, h = r("./internal/streams/stream"), s = r("buffer").Buffer, u = a.Uint8Array || function() {
            };
            function c(F) {
              return s.from(F);
            }
            function p(F) {
              return s.isBuffer(F) || F instanceof u;
            }
            var m = r("util"), d;
            m && m.debuglog ? d = m.debuglog("stream") : d = function() {
            };
            var _ = r("./internal/streams/buffer_list"), v = r("./internal/streams/destroy"), k = r("./internal/streams/state"), E = k.getHighWaterMark, T = r("../errors").codes, x = T.ERR_INVALID_ARG_TYPE, A = T.ERR_STREAM_PUSH_AFTER_EOF, I = T.ERR_METHOD_NOT_IMPLEMENTED, R = T.ERR_STREAM_UNSHIFT_AFTER_END_EVENT, M, b, N;
            r("inherits")(U, h);
            var j = v.errorOrDestroy, $ = ["error", "close", "destroy", "pause", "resume"];
            function re(F, z, O) {
              if (typeof F.prependListener == "function") return F.prependListener(z, O);
              !F._events || !F._events[z] ? F.on(z, O) : Array.isArray(F._events[z]) ? F._events[z].unshift(O) : F._events[z] = [O, F._events[z]];
            }
            function ne(F, z, O) {
              l = l || r("./_stream_duplex"), F = F || {}, typeof O != "boolean" && (O = z instanceof l), this.objectMode = !!F.objectMode, O && (this.objectMode = this.objectMode || !!F.readableObjectMode), this.highWaterMark = E(this, F, "readableHighWaterMark", O), this.buffer = new _(), this.length = 0, this.pipes = null, this.pipesCount = 0, this.flowing = null, this.ended = !1, this.endEmitted = !1, this.reading = !1, this.sync = !0, this.needReadable = !1, this.emittedReadable = !1, this.readableListening = !1, this.resumeScheduled = !1, this.paused = !0, this.emitClose = F.emitClose !== !1, this.autoDestroy = !!F.autoDestroy, this.destroyed = !1, this.defaultEncoding = F.defaultEncoding || "utf8", this.awaitDrain = 0, this.readingMore = !1, this.decoder = null, this.encoding = null, F.encoding && (M || (M = r("string_decoder/").StringDecoder), this.decoder = new M(F.encoding), this.encoding = F.encoding);
            }
            function U(F) {
              if (l = l || r("./_stream_duplex"), !(this instanceof U)) return new U(F);
              var z = this instanceof l;
              this._readableState = new ne(F, this, z), this.readable = !0, F && (typeof F.read == "function" && (this._read = F.read), typeof F.destroy == "function" && (this._destroy = F.destroy)), h.call(this);
            }
            Object.defineProperty(U.prototype, "destroyed", {
              // making it explicit this property is not enumerable
              // because otherwise some prototype manipulation in
              // userland will fail
              enumerable: !1,
              get: function() {
                return this._readableState === void 0 ? !1 : this._readableState.destroyed;
              },
              set: function(z) {
                this._readableState && (this._readableState.destroyed = z);
              }
            }), U.prototype.destroy = v.destroy, U.prototype._undestroy = v.undestroy, U.prototype._destroy = function(F, z) {
              z(F);
            }, U.prototype.push = function(F, z) {
              var O = this._readableState, g;
              return O.objectMode ? g = !0 : typeof F == "string" && (z = z || O.defaultEncoding, z !== O.encoding && (F = s.from(F, z), z = ""), g = !0), P(this, F, z, !1, g);
            }, U.prototype.unshift = function(F) {
              return P(this, F, null, !0, !1);
            };
            function P(F, z, O, g, w) {
              d("readableAddChunk", z);
              var S = F._readableState;
              if (z === null)
                S.reading = !1, H(F, S);
              else {
                var J;
                if (w || (J = Q(S, z)), J)
                  j(F, J);
                else if (S.objectMode || z && z.length > 0)
                  if (typeof z != "string" && !S.objectMode && Object.getPrototypeOf(z) !== s.prototype && (z = c(z)), g)
                    S.endEmitted ? j(F, new R()) : D(F, S, z, !0);
                  else if (S.ended)
                    j(F, new A());
                  else {
                    if (S.destroyed)
                      return !1;
                    S.reading = !1, S.decoder && !O ? (z = S.decoder.write(z), S.objectMode || z.length !== 0 ? D(F, S, z, !1) : pe(F, S)) : D(F, S, z, !1);
                  }
                else g || (S.reading = !1, pe(F, S));
              }
              return !S.ended && (S.length < S.highWaterMark || S.length === 0);
            }
            function D(F, z, O, g) {
              z.flowing && z.length === 0 && !z.sync ? (z.awaitDrain = 0, F.emit("data", O)) : (z.length += z.objectMode ? 1 : O.length, g ? z.buffer.unshift(O) : z.buffer.push(O), z.needReadable && X(F)), pe(F, z);
            }
            function Q(F, z) {
              var O;
              return !p(z) && typeof z != "string" && z !== void 0 && !F.objectMode && (O = new x("chunk", ["string", "Buffer", "Uint8Array"], z)), O;
            }
            U.prototype.isPaused = function() {
              return this._readableState.flowing === !1;
            }, U.prototype.setEncoding = function(F) {
              M || (M = r("string_decoder/").StringDecoder);
              var z = new M(F);
              this._readableState.decoder = z, this._readableState.encoding = this._readableState.decoder.encoding;
              for (var O = this._readableState.buffer.head, g = ""; O !== null; )
                g += z.write(O.data), O = O.next;
              return this._readableState.buffer.clear(), g !== "" && this._readableState.buffer.push(g), this._readableState.length = g.length, this;
            };
            var W = 1073741824;
            function oe(F) {
              return F >= W ? F = W : (F--, F |= F >>> 1, F |= F >>> 2, F |= F >>> 4, F |= F >>> 8, F |= F >>> 16, F++), F;
            }
            function ae(F, z) {
              return F <= 0 || z.length === 0 && z.ended ? 0 : z.objectMode ? 1 : F !== F ? z.flowing && z.length ? z.buffer.head.data.length : z.length : (F > z.highWaterMark && (z.highWaterMark = oe(F)), F <= z.length ? F : z.ended ? z.length : (z.needReadable = !0, 0));
            }
            U.prototype.read = function(F) {
              d("read", F), F = parseInt(F, 10);
              var z = this._readableState, O = F;
              if (F !== 0 && (z.emittedReadable = !1), F === 0 && z.needReadable && ((z.highWaterMark !== 0 ? z.length >= z.highWaterMark : z.length > 0) || z.ended))
                return d("read: emitReadable", z.length, z.ended), z.length === 0 && z.ended ? he(this) : X(this), null;
              if (F = ae(F, z), F === 0 && z.ended)
                return z.length === 0 && he(this), null;
              var g = z.needReadable;
              d("need readable", g), (z.length === 0 || z.length - F < z.highWaterMark) && (g = !0, d("length less than watermark", g)), z.ended || z.reading ? (g = !1, d("reading or ended", g)) : g && (d("do read"), z.reading = !0, z.sync = !0, z.length === 0 && (z.needReadable = !0), this._read(z.highWaterMark), z.sync = !1, z.reading || (F = ae(O, z)));
              var w;
              return F > 0 ? w = q(F, z) : w = null, w === null ? (z.needReadable = z.length <= z.highWaterMark, F = 0) : (z.length -= F, z.awaitDrain = 0), z.length === 0 && (z.ended || (z.needReadable = !0), O !== F && z.ended && he(this)), w !== null && this.emit("data", w), w;
            };
            function H(F, z) {
              if (d("onEofChunk"), !z.ended) {
                if (z.decoder) {
                  var O = z.decoder.end();
                  O && O.length && (z.buffer.push(O), z.length += z.objectMode ? 1 : O.length);
                }
                z.ended = !0, z.sync ? X(F) : (z.needReadable = !1, z.emittedReadable || (z.emittedReadable = !0, ie(F)));
              }
            }
            function X(F) {
              var z = F._readableState;
              d("emitReadable", z.needReadable, z.emittedReadable), z.needReadable = !1, z.emittedReadable || (d("emitReadable", z.flowing), z.emittedReadable = !0, o.nextTick(ie, F));
            }
            function ie(F) {
              var z = F._readableState;
              d("emitReadable_", z.destroyed, z.length, z.ended), !z.destroyed && (z.length || z.ended) && (F.emit("readable"), z.emittedReadable = !1), z.needReadable = !z.flowing && !z.ended && z.length <= z.highWaterMark, Y(F);
            }
            function pe(F, z) {
              z.readingMore || (z.readingMore = !0, o.nextTick(Z, F, z));
            }
            function Z(F, z) {
              for (; !z.reading && !z.ended && (z.length < z.highWaterMark || z.flowing && z.length === 0); ) {
                var O = z.length;
                if (d("maybeReadMore read 0"), F.read(0), O === z.length)
                  break;
              }
              z.readingMore = !1;
            }
            U.prototype._read = function(F) {
              j(this, new I("_read()"));
            }, U.prototype.pipe = function(F, z) {
              var O = this, g = this._readableState;
              switch (g.pipesCount) {
                case 0:
                  g.pipes = F;
                  break;
                case 1:
                  g.pipes = [g.pipes, F];
                  break;
                default:
                  g.pipes.push(F);
                  break;
              }
              g.pipesCount += 1, d("pipe count=%d opts=%j", g.pipesCount, z);
              var w = (!z || z.end !== !1) && F !== o.stdout && F !== o.stderr, S = w ? be : qe;
              g.endEmitted ? o.nextTick(S) : O.once("end", S), F.on("unpipe", J);
              function J(tt, Et) {
                d("onunpipe"), tt === O && Et && Et.hasUnpiped === !1 && (Et.hasUnpiped = !0, Be());
              }
              function be() {
                d("onend"), F.end();
              }
              var _e = K(O);
              F.on("drain", _e);
              var Oe = !1;
              function Be() {
                d("cleanup"), F.removeListener("close", Fe), F.removeListener("finish", ht), F.removeListener("drain", _e), F.removeListener("error", He), F.removeListener("unpipe", J), O.removeListener("end", be), O.removeListener("end", qe), O.removeListener("data", De), Oe = !0, g.awaitDrain && (!F._writableState || F._writableState.needDrain) && _e();
              }
              O.on("data", De);
              function De(tt) {
                d("ondata");
                var Et = F.write(tt);
                d("dest.write", Et), Et === !1 && ((g.pipesCount === 1 && g.pipes === F || g.pipesCount > 1 && Te(g.pipes, F) !== -1) && !Oe && (d("false write response, pause", g.awaitDrain), g.awaitDrain++), O.pause());
              }
              function He(tt) {
                d("onerror", tt), qe(), F.removeListener("error", He), f(F, "error") === 0 && j(F, tt);
              }
              re(F, "error", He);
              function Fe() {
                F.removeListener("finish", ht), qe();
              }
              F.once("close", Fe);
              function ht() {
                d("onfinish"), F.removeListener("close", Fe), qe();
              }
              F.once("finish", ht);
              function qe() {
                d("unpipe"), O.unpipe(F);
              }
              return F.emit("pipe", O), g.flowing || (d("pipe resume"), O.resume()), F;
            };
            function K(F) {
              return function() {
                var O = F._readableState;
                d("pipeOnDrain", O.awaitDrain), O.awaitDrain && O.awaitDrain--, O.awaitDrain === 0 && f(F, "data") && (O.flowing = !0, Y(F));
              };
            }
            U.prototype.unpipe = function(F) {
              var z = this._readableState, O = {
                hasUnpiped: !1
              };
              if (z.pipesCount === 0) return this;
              if (z.pipesCount === 1)
                return F && F !== z.pipes ? this : (F || (F = z.pipes), z.pipes = null, z.pipesCount = 0, z.flowing = !1, F && F.emit("unpipe", this, O), this);
              if (!F) {
                var g = z.pipes, w = z.pipesCount;
                z.pipes = null, z.pipesCount = 0, z.flowing = !1;
                for (var S = 0; S < w; S++)
                  g[S].emit("unpipe", this, {
                    hasUnpiped: !1
                  });
                return this;
              }
              var J = Te(z.pipes, F);
              return J === -1 ? this : (z.pipes.splice(J, 1), z.pipesCount -= 1, z.pipesCount === 1 && (z.pipes = z.pipes[0]), F.emit("unpipe", this, O), this);
            }, U.prototype.on = function(F, z) {
              var O = h.prototype.on.call(this, F, z), g = this._readableState;
              return F === "data" ? (g.readableListening = this.listenerCount("readable") > 0, g.flowing !== !1 && this.resume()) : F === "readable" && !g.endEmitted && !g.readableListening && (g.readableListening = g.needReadable = !0, g.flowing = !1, g.emittedReadable = !1, d("on readable", g.length, g.reading), g.length ? X(this) : g.reading || o.nextTick(de, this)), O;
            }, U.prototype.addListener = U.prototype.on, U.prototype.removeListener = function(F, z) {
              var O = h.prototype.removeListener.call(this, F, z);
              return F === "readable" && o.nextTick(ee, this), O;
            }, U.prototype.removeAllListeners = function(F) {
              var z = h.prototype.removeAllListeners.apply(this, arguments);
              return (F === "readable" || F === void 0) && o.nextTick(ee, this), z;
            };
            function ee(F) {
              var z = F._readableState;
              z.readableListening = F.listenerCount("readable") > 0, z.resumeScheduled && !z.paused ? z.flowing = !0 : F.listenerCount("data") > 0 && F.resume();
            }
            function de(F) {
              d("readable nexttick read 0"), F.read(0);
            }
            U.prototype.resume = function() {
              var F = this._readableState;
              return F.flowing || (d("resume"), F.flowing = !F.readableListening, ge(this, F)), F.paused = !1, this;
            };
            function ge(F, z) {
              z.resumeScheduled || (z.resumeScheduled = !0, o.nextTick(ue, F, z));
            }
            function ue(F, z) {
              d("resume", z.reading), z.reading || F.read(0), z.resumeScheduled = !1, F.emit("resume"), Y(F), z.flowing && !z.reading && F.read(0);
            }
            U.prototype.pause = function() {
              return d("call pause flowing=%j", this._readableState.flowing), this._readableState.flowing !== !1 && (d("pause"), this._readableState.flowing = !1, this.emit("pause")), this._readableState.paused = !0, this;
            };
            function Y(F) {
              var z = F._readableState;
              for (d("flow", z.flowing); z.flowing && F.read() !== null; )
                ;
            }
            U.prototype.wrap = function(F) {
              var z = this, O = this._readableState, g = !1;
              F.on("end", function() {
                if (d("wrapped end"), O.decoder && !O.ended) {
                  var J = O.decoder.end();
                  J && J.length && z.push(J);
                }
                z.push(null);
              }), F.on("data", function(J) {
                if (d("wrapped data"), O.decoder && (J = O.decoder.write(J)), !(O.objectMode && J == null) && !(!O.objectMode && (!J || !J.length))) {
                  var be = z.push(J);
                  be || (g = !0, F.pause());
                }
              });
              for (var w in F)
                this[w] === void 0 && typeof F[w] == "function" && (this[w] = /* @__PURE__ */ (function(be) {
                  return function() {
                    return F[be].apply(F, arguments);
                  };
                })(w));
              for (var S = 0; S < $.length; S++)
                F.on($[S], this.emit.bind(this, $[S]));
              return this._read = function(J) {
                d("wrapped _read", J), g && (g = !1, F.resume());
              }, this;
            }, typeof Symbol == "function" && (U.prototype[Symbol.asyncIterator] = function() {
              return b === void 0 && (b = r("./internal/streams/async_iterator")), b(this);
            }), Object.defineProperty(U.prototype, "readableHighWaterMark", {
              // making it explicit this property is not enumerable
              // because otherwise some prototype manipulation in
              // userland will fail
              enumerable: !1,
              get: function() {
                return this._readableState.highWaterMark;
              }
            }), Object.defineProperty(U.prototype, "readableBuffer", {
              // making it explicit this property is not enumerable
              // because otherwise some prototype manipulation in
              // userland will fail
              enumerable: !1,
              get: function() {
                return this._readableState && this._readableState.buffer;
              }
            }), Object.defineProperty(U.prototype, "readableFlowing", {
              // making it explicit this property is not enumerable
              // because otherwise some prototype manipulation in
              // userland will fail
              enumerable: !1,
              get: function() {
                return this._readableState.flowing;
              },
              set: function(z) {
                this._readableState && (this._readableState.flowing = z);
              }
            }), U._fromList = q, Object.defineProperty(U.prototype, "readableLength", {
              // making it explicit this property is not enumerable
              // because otherwise some prototype manipulation in
              // userland will fail
              enumerable: !1,
              get: function() {
                return this._readableState.length;
              }
            });
            function q(F, z) {
              if (z.length === 0) return null;
              var O;
              return z.objectMode ? O = z.buffer.shift() : !F || F >= z.length ? (z.decoder ? O = z.buffer.join("") : z.buffer.length === 1 ? O = z.buffer.first() : O = z.buffer.concat(z.length), z.buffer.clear()) : O = z.buffer.consume(F, z.decoder), O;
            }
            function he(F) {
              var z = F._readableState;
              d("endReadable", z.endEmitted), z.endEmitted || (z.ended = !0, o.nextTick(Se, z, F));
            }
            function Se(F, z) {
              if (d("endReadableNT", F.endEmitted, F.length), !F.endEmitted && F.length === 0 && (F.endEmitted = !0, z.readable = !1, z.emit("end"), F.autoDestroy)) {
                var O = z._writableState;
                (!O || O.autoDestroy && O.finished) && z.destroy();
              }
            }
            typeof Symbol == "function" && (U.from = function(F, z) {
              return N === void 0 && (N = r("./internal/streams/from")), N(U, F, z);
            });
            function Te(F, z) {
              for (var O = 0, g = F.length; O < g; O++)
                if (F[O] === z) return O;
              return -1;
            }
          }).call(this);
        }).call(this, r("_process"), typeof mt < "u" ? mt : typeof self < "u" ? self : typeof window < "u" ? window : {});
      }, { "../errors": 66, "./_stream_duplex": 67, "./internal/streams/async_iterator": 72, "./internal/streams/buffer_list": 73, "./internal/streams/destroy": 74, "./internal/streams/from": 76, "./internal/streams/state": 78, "./internal/streams/stream": 79, _process: 63, buffer: 32, events: 35, inherits: 46, "string_decoder/": 80, util: 29 }], 70: [function(r, i, n) {
        i.exports = c;
        var o = r("../errors").codes, a = o.ERR_METHOD_NOT_IMPLEMENTED, l = o.ERR_MULTIPLE_CALLBACK, f = o.ERR_TRANSFORM_ALREADY_TRANSFORMING, h = o.ERR_TRANSFORM_WITH_LENGTH_0, s = r("./_stream_duplex");
        r("inherits")(c, s);
        function u(d, _) {
          var v = this._transformState;
          v.transforming = !1;
          var k = v.writecb;
          if (k === null)
            return this.emit("error", new l());
          v.writechunk = null, v.writecb = null, _ != null && this.push(_), k(d);
          var E = this._readableState;
          E.reading = !1, (E.needReadable || E.length < E.highWaterMark) && this._read(E.highWaterMark);
        }
        function c(d) {
          if (!(this instanceof c)) return new c(d);
          s.call(this, d), this._transformState = {
            afterTransform: u.bind(this),
            needTransform: !1,
            transforming: !1,
            writecb: null,
            writechunk: null,
            writeencoding: null
          }, this._readableState.needReadable = !0, this._readableState.sync = !1, d && (typeof d.transform == "function" && (this._transform = d.transform), typeof d.flush == "function" && (this._flush = d.flush)), this.on("prefinish", p);
        }
        function p() {
          var d = this;
          typeof this._flush == "function" && !this._readableState.destroyed ? this._flush(function(_, v) {
            m(d, _, v);
          }) : m(this, null, null);
        }
        c.prototype.push = function(d, _) {
          return this._transformState.needTransform = !1, s.prototype.push.call(this, d, _);
        }, c.prototype._transform = function(d, _, v) {
          v(new a("_transform()"));
        }, c.prototype._write = function(d, _, v) {
          var k = this._transformState;
          if (k.writecb = v, k.writechunk = d, k.writeencoding = _, !k.transforming) {
            var E = this._readableState;
            (k.needTransform || E.needReadable || E.length < E.highWaterMark) && this._read(E.highWaterMark);
          }
        }, c.prototype._read = function(d) {
          var _ = this._transformState;
          _.writechunk !== null && !_.transforming ? (_.transforming = !0, this._transform(_.writechunk, _.writeencoding, _.afterTransform)) : _.needTransform = !0;
        }, c.prototype._destroy = function(d, _) {
          s.prototype._destroy.call(this, d, function(v) {
            _(v);
          });
        };
        function m(d, _, v) {
          if (_) return d.emit("error", _);
          if (v != null && d.push(v), d._writableState.length) throw new h();
          if (d._transformState.transforming) throw new f();
          return d.push(null);
        }
      }, { "../errors": 66, "./_stream_duplex": 67, inherits: 46 }], 71: [function(r, i, n) {
        (function(o, a) {
          (function() {
            i.exports = ne;
            function l(Y) {
              var q = this;
              this.next = null, this.entry = null, this.finish = function() {
                ue(q, Y);
              };
            }
            var f;
            ne.WritableState = $;
            var h = {
              deprecate: r("util-deprecate")
            }, s = r("./internal/streams/stream"), u = r("buffer").Buffer, c = a.Uint8Array || function() {
            };
            function p(Y) {
              return u.from(Y);
            }
            function m(Y) {
              return u.isBuffer(Y) || Y instanceof c;
            }
            var d = r("./internal/streams/destroy"), _ = r("./internal/streams/state"), v = _.getHighWaterMark, k = r("../errors").codes, E = k.ERR_INVALID_ARG_TYPE, T = k.ERR_METHOD_NOT_IMPLEMENTED, x = k.ERR_MULTIPLE_CALLBACK, A = k.ERR_STREAM_CANNOT_PIPE, I = k.ERR_STREAM_DESTROYED, R = k.ERR_STREAM_NULL_VALUES, M = k.ERR_STREAM_WRITE_AFTER_END, b = k.ERR_UNKNOWN_ENCODING, N = d.errorOrDestroy;
            r("inherits")(ne, s);
            function j() {
            }
            function $(Y, q, he) {
              f = f || r("./_stream_duplex"), Y = Y || {}, typeof he != "boolean" && (he = q instanceof f), this.objectMode = !!Y.objectMode, he && (this.objectMode = this.objectMode || !!Y.writableObjectMode), this.highWaterMark = v(this, Y, "writableHighWaterMark", he), this.finalCalled = !1, this.needDrain = !1, this.ending = !1, this.ended = !1, this.finished = !1, this.destroyed = !1;
              var Se = Y.decodeStrings === !1;
              this.decodeStrings = !Se, this.defaultEncoding = Y.defaultEncoding || "utf8", this.length = 0, this.writing = !1, this.corked = 0, this.sync = !0, this.bufferProcessing = !1, this.onwrite = function(Te) {
                H(q, Te);
              }, this.writecb = null, this.writelen = 0, this.bufferedRequest = null, this.lastBufferedRequest = null, this.pendingcb = 0, this.prefinished = !1, this.errorEmitted = !1, this.emitClose = Y.emitClose !== !1, this.autoDestroy = !!Y.autoDestroy, this.bufferedRequestCount = 0, this.corkedRequestsFree = new l(this);
            }
            $.prototype.getBuffer = function() {
              for (var q = this.bufferedRequest, he = []; q; )
                he.push(q), q = q.next;
              return he;
            }, (function() {
              try {
                Object.defineProperty($.prototype, "buffer", {
                  get: h.deprecate(function() {
                    return this.getBuffer();
                  }, "_writableState.buffer is deprecated. Use _writableState.getBuffer instead.", "DEP0003")
                });
              } catch {
              }
            })();
            var re;
            typeof Symbol == "function" && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] == "function" ? (re = Function.prototype[Symbol.hasInstance], Object.defineProperty(ne, Symbol.hasInstance, {
              value: function(q) {
                return re.call(this, q) ? !0 : this !== ne ? !1 : q && q._writableState instanceof $;
              }
            })) : re = function(q) {
              return q instanceof this;
            };
            function ne(Y) {
              f = f || r("./_stream_duplex");
              var q = this instanceof f;
              if (!q && !re.call(ne, this)) return new ne(Y);
              this._writableState = new $(Y, this, q), this.writable = !0, Y && (typeof Y.write == "function" && (this._write = Y.write), typeof Y.writev == "function" && (this._writev = Y.writev), typeof Y.destroy == "function" && (this._destroy = Y.destroy), typeof Y.final == "function" && (this._final = Y.final)), s.call(this);
            }
            ne.prototype.pipe = function() {
              N(this, new A());
            };
            function U(Y, q) {
              var he = new M();
              N(Y, he), o.nextTick(q, he);
            }
            function P(Y, q, he, Se) {
              var Te;
              return he === null ? Te = new R() : typeof he != "string" && !q.objectMode && (Te = new E("chunk", ["string", "Buffer"], he)), Te ? (N(Y, Te), o.nextTick(Se, Te), !1) : !0;
            }
            ne.prototype.write = function(Y, q, he) {
              var Se = this._writableState, Te = !1, F = !Se.objectMode && m(Y);
              return F && !u.isBuffer(Y) && (Y = p(Y)), typeof q == "function" && (he = q, q = null), F ? q = "buffer" : q || (q = Se.defaultEncoding), typeof he != "function" && (he = j), Se.ending ? U(this, he) : (F || P(this, Se, Y, he)) && (Se.pendingcb++, Te = Q(this, Se, F, Y, q, he)), Te;
            }, ne.prototype.cork = function() {
              this._writableState.corked++;
            }, ne.prototype.uncork = function() {
              var Y = this._writableState;
              Y.corked && (Y.corked--, !Y.writing && !Y.corked && !Y.bufferProcessing && Y.bufferedRequest && pe(this, Y));
            }, ne.prototype.setDefaultEncoding = function(q) {
              if (typeof q == "string" && (q = q.toLowerCase()), !(["hex", "utf8", "utf-8", "ascii", "binary", "base64", "ucs2", "ucs-2", "utf16le", "utf-16le", "raw"].indexOf((q + "").toLowerCase()) > -1)) throw new b(q);
              return this._writableState.defaultEncoding = q, this;
            }, Object.defineProperty(ne.prototype, "writableBuffer", {
              // making it explicit this property is not enumerable
              // because otherwise some prototype manipulation in
              // userland will fail
              enumerable: !1,
              get: function() {
                return this._writableState && this._writableState.getBuffer();
              }
            });
            function D(Y, q, he) {
              return !Y.objectMode && Y.decodeStrings !== !1 && typeof q == "string" && (q = u.from(q, he)), q;
            }
            Object.defineProperty(ne.prototype, "writableHighWaterMark", {
              // making it explicit this property is not enumerable
              // because otherwise some prototype manipulation in
              // userland will fail
              enumerable: !1,
              get: function() {
                return this._writableState.highWaterMark;
              }
            });
            function Q(Y, q, he, Se, Te, F) {
              if (!he) {
                var z = D(q, Se, Te);
                Se !== z && (he = !0, Te = "buffer", Se = z);
              }
              var O = q.objectMode ? 1 : Se.length;
              q.length += O;
              var g = q.length < q.highWaterMark;
              if (g || (q.needDrain = !0), q.writing || q.corked) {
                var w = q.lastBufferedRequest;
                q.lastBufferedRequest = {
                  chunk: Se,
                  encoding: Te,
                  isBuf: he,
                  callback: F,
                  next: null
                }, w ? w.next = q.lastBufferedRequest : q.bufferedRequest = q.lastBufferedRequest, q.bufferedRequestCount += 1;
              } else
                W(Y, q, !1, O, Se, Te, F);
              return g;
            }
            function W(Y, q, he, Se, Te, F, z) {
              q.writelen = Se, q.writecb = z, q.writing = !0, q.sync = !0, q.destroyed ? q.onwrite(new I("write")) : he ? Y._writev(Te, q.onwrite) : Y._write(Te, F, q.onwrite), q.sync = !1;
            }
            function oe(Y, q, he, Se, Te) {
              --q.pendingcb, he ? (o.nextTick(Te, Se), o.nextTick(de, Y, q), Y._writableState.errorEmitted = !0, N(Y, Se)) : (Te(Se), Y._writableState.errorEmitted = !0, N(Y, Se), de(Y, q));
            }
            function ae(Y) {
              Y.writing = !1, Y.writecb = null, Y.length -= Y.writelen, Y.writelen = 0;
            }
            function H(Y, q) {
              var he = Y._writableState, Se = he.sync, Te = he.writecb;
              if (typeof Te != "function") throw new x();
              if (ae(he), q) oe(Y, he, Se, q, Te);
              else {
                var F = Z(he) || Y.destroyed;
                !F && !he.corked && !he.bufferProcessing && he.bufferedRequest && pe(Y, he), Se ? o.nextTick(X, Y, he, F, Te) : X(Y, he, F, Te);
              }
            }
            function X(Y, q, he, Se) {
              he || ie(Y, q), q.pendingcb--, Se(), de(Y, q);
            }
            function ie(Y, q) {
              q.length === 0 && q.needDrain && (q.needDrain = !1, Y.emit("drain"));
            }
            function pe(Y, q) {
              q.bufferProcessing = !0;
              var he = q.bufferedRequest;
              if (Y._writev && he && he.next) {
                var Se = q.bufferedRequestCount, Te = new Array(Se), F = q.corkedRequestsFree;
                F.entry = he;
                for (var z = 0, O = !0; he; )
                  Te[z] = he, he.isBuf || (O = !1), he = he.next, z += 1;
                Te.allBuffers = O, W(Y, q, !0, q.length, Te, "", F.finish), q.pendingcb++, q.lastBufferedRequest = null, F.next ? (q.corkedRequestsFree = F.next, F.next = null) : q.corkedRequestsFree = new l(q), q.bufferedRequestCount = 0;
              } else {
                for (; he; ) {
                  var g = he.chunk, w = he.encoding, S = he.callback, J = q.objectMode ? 1 : g.length;
                  if (W(Y, q, !1, J, g, w, S), he = he.next, q.bufferedRequestCount--, q.writing)
                    break;
                }
                he === null && (q.lastBufferedRequest = null);
              }
              q.bufferedRequest = he, q.bufferProcessing = !1;
            }
            ne.prototype._write = function(Y, q, he) {
              he(new T("_write()"));
            }, ne.prototype._writev = null, ne.prototype.end = function(Y, q, he) {
              var Se = this._writableState;
              return typeof Y == "function" ? (he = Y, Y = null, q = null) : typeof q == "function" && (he = q, q = null), Y != null && this.write(Y, q), Se.corked && (Se.corked = 1, this.uncork()), Se.ending || ge(this, Se, he), this;
            }, Object.defineProperty(ne.prototype, "writableLength", {
              // making it explicit this property is not enumerable
              // because otherwise some prototype manipulation in
              // userland will fail
              enumerable: !1,
              get: function() {
                return this._writableState.length;
              }
            });
            function Z(Y) {
              return Y.ending && Y.length === 0 && Y.bufferedRequest === null && !Y.finished && !Y.writing;
            }
            function K(Y, q) {
              Y._final(function(he) {
                q.pendingcb--, he && N(Y, he), q.prefinished = !0, Y.emit("prefinish"), de(Y, q);
              });
            }
            function ee(Y, q) {
              !q.prefinished && !q.finalCalled && (typeof Y._final == "function" && !q.destroyed ? (q.pendingcb++, q.finalCalled = !0, o.nextTick(K, Y, q)) : (q.prefinished = !0, Y.emit("prefinish")));
            }
            function de(Y, q) {
              var he = Z(q);
              if (he && (ee(Y, q), q.pendingcb === 0 && (q.finished = !0, Y.emit("finish"), q.autoDestroy))) {
                var Se = Y._readableState;
                (!Se || Se.autoDestroy && Se.endEmitted) && Y.destroy();
              }
              return he;
            }
            function ge(Y, q, he) {
              q.ending = !0, de(Y, q), he && (q.finished ? o.nextTick(he) : Y.once("finish", he)), q.ended = !0, Y.writable = !1;
            }
            function ue(Y, q, he) {
              var Se = Y.entry;
              for (Y.entry = null; Se; ) {
                var Te = Se.callback;
                q.pendingcb--, Te(he), Se = Se.next;
              }
              q.corkedRequestsFree.next = Y;
            }
            Object.defineProperty(ne.prototype, "destroyed", {
              // making it explicit this property is not enumerable
              // because otherwise some prototype manipulation in
              // userland will fail
              enumerable: !1,
              get: function() {
                return this._writableState === void 0 ? !1 : this._writableState.destroyed;
              },
              set: function(q) {
                this._writableState && (this._writableState.destroyed = q);
              }
            }), ne.prototype.destroy = d.destroy, ne.prototype._undestroy = d.undestroy, ne.prototype._destroy = function(Y, q) {
              q(Y);
            };
          }).call(this);
        }).call(this, r("_process"), typeof mt < "u" ? mt : typeof self < "u" ? self : typeof window < "u" ? window : {});
      }, { "../errors": 66, "./_stream_duplex": 67, "./internal/streams/destroy": 74, "./internal/streams/state": 78, "./internal/streams/stream": 79, _process: 63, buffer: 32, inherits: 46, "util-deprecate": 81 }], 72: [function(r, i, n) {
        (function(o) {
          (function() {
            var a;
            function l(I, R, M) {
              return R in I ? Object.defineProperty(I, R, { value: M, enumerable: !0, configurable: !0, writable: !0 }) : I[R] = M, I;
            }
            var f = r("./end-of-stream"), h = Symbol("lastResolve"), s = Symbol("lastReject"), u = Symbol("error"), c = Symbol("ended"), p = Symbol("lastPromise"), m = Symbol("handlePromise"), d = Symbol("stream");
            function _(I, R) {
              return {
                value: I,
                done: R
              };
            }
            function v(I) {
              var R = I[h];
              if (R !== null) {
                var M = I[d].read();
                M !== null && (I[p] = null, I[h] = null, I[s] = null, R(_(M, !1)));
              }
            }
            function k(I) {
              o.nextTick(v, I);
            }
            function E(I, R) {
              return function(M, b) {
                I.then(function() {
                  if (R[c]) {
                    M(_(void 0, !0));
                    return;
                  }
                  R[m](M, b);
                }, b);
              };
            }
            var T = Object.getPrototypeOf(function() {
            }), x = Object.setPrototypeOf((a = {
              get stream() {
                return this[d];
              },
              next: function() {
                var R = this, M = this[u];
                if (M !== null)
                  return Promise.reject(M);
                if (this[c])
                  return Promise.resolve(_(void 0, !0));
                if (this[d].destroyed)
                  return new Promise(function($, re) {
                    o.nextTick(function() {
                      R[u] ? re(R[u]) : $(_(void 0, !0));
                    });
                  });
                var b = this[p], N;
                if (b)
                  N = new Promise(E(b, this));
                else {
                  var j = this[d].read();
                  if (j !== null)
                    return Promise.resolve(_(j, !1));
                  N = new Promise(this[m]);
                }
                return this[p] = N, N;
              }
            }, l(a, Symbol.asyncIterator, function() {
              return this;
            }), l(a, "return", function() {
              var R = this;
              return new Promise(function(M, b) {
                R[d].destroy(null, function(N) {
                  if (N) {
                    b(N);
                    return;
                  }
                  M(_(void 0, !0));
                });
              });
            }), a), T), A = function(R) {
              var M, b = Object.create(x, (M = {}, l(M, d, {
                value: R,
                writable: !0
              }), l(M, h, {
                value: null,
                writable: !0
              }), l(M, s, {
                value: null,
                writable: !0
              }), l(M, u, {
                value: null,
                writable: !0
              }), l(M, c, {
                value: R._readableState.endEmitted,
                writable: !0
              }), l(M, m, {
                value: function(j, $) {
                  var re = b[d].read();
                  re ? (b[p] = null, b[h] = null, b[s] = null, j(_(re, !1))) : (b[h] = j, b[s] = $);
                },
                writable: !0
              }), M));
              return b[p] = null, f(R, function(N) {
                if (N && N.code !== "ERR_STREAM_PREMATURE_CLOSE") {
                  var j = b[s];
                  j !== null && (b[p] = null, b[h] = null, b[s] = null, j(N)), b[u] = N;
                  return;
                }
                var $ = b[h];
                $ !== null && (b[p] = null, b[h] = null, b[s] = null, $(_(void 0, !0))), b[c] = !0;
              }), R.on("readable", k.bind(null, b)), b;
            };
            i.exports = A;
          }).call(this);
        }).call(this, r("_process"));
      }, { "./end-of-stream": 75, _process: 63 }], 73: [function(r, i, n) {
        function o(v, k) {
          var E = Object.keys(v);
          if (Object.getOwnPropertySymbols) {
            var T = Object.getOwnPropertySymbols(v);
            k && (T = T.filter(function(x) {
              return Object.getOwnPropertyDescriptor(v, x).enumerable;
            })), E.push.apply(E, T);
          }
          return E;
        }
        function a(v) {
          for (var k = 1; k < arguments.length; k++) {
            var E = arguments[k] != null ? arguments[k] : {};
            k % 2 ? o(Object(E), !0).forEach(function(T) {
              l(v, T, E[T]);
            }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(v, Object.getOwnPropertyDescriptors(E)) : o(Object(E)).forEach(function(T) {
              Object.defineProperty(v, T, Object.getOwnPropertyDescriptor(E, T));
            });
          }
          return v;
        }
        function l(v, k, E) {
          return k in v ? Object.defineProperty(v, k, { value: E, enumerable: !0, configurable: !0, writable: !0 }) : v[k] = E, v;
        }
        function f(v, k) {
          if (!(v instanceof k))
            throw new TypeError("Cannot call a class as a function");
        }
        function h(v, k) {
          for (var E = 0; E < k.length; E++) {
            var T = k[E];
            T.enumerable = T.enumerable || !1, T.configurable = !0, "value" in T && (T.writable = !0), Object.defineProperty(v, T.key, T);
          }
        }
        function s(v, k, E) {
          return k && h(v.prototype, k), v;
        }
        var u = r("buffer"), c = u.Buffer, p = r("util"), m = p.inspect, d = m && m.custom || "inspect";
        function _(v, k, E) {
          c.prototype.copy.call(v, k, E);
        }
        i.exports = /* @__PURE__ */ (function() {
          function v() {
            f(this, v), this.head = null, this.tail = null, this.length = 0;
          }
          return s(v, [{
            key: "push",
            value: function(E) {
              var T = {
                data: E,
                next: null
              };
              this.length > 0 ? this.tail.next = T : this.head = T, this.tail = T, ++this.length;
            }
          }, {
            key: "unshift",
            value: function(E) {
              var T = {
                data: E,
                next: this.head
              };
              this.length === 0 && (this.tail = T), this.head = T, ++this.length;
            }
          }, {
            key: "shift",
            value: function() {
              if (this.length !== 0) {
                var E = this.head.data;
                return this.length === 1 ? this.head = this.tail = null : this.head = this.head.next, --this.length, E;
              }
            }
          }, {
            key: "clear",
            value: function() {
              this.head = this.tail = null, this.length = 0;
            }
          }, {
            key: "join",
            value: function(E) {
              if (this.length === 0) return "";
              for (var T = this.head, x = "" + T.data; T = T.next; )
                x += E + T.data;
              return x;
            }
          }, {
            key: "concat",
            value: function(E) {
              if (this.length === 0) return c.alloc(0);
              for (var T = c.allocUnsafe(E >>> 0), x = this.head, A = 0; x; )
                _(x.data, T, A), A += x.data.length, x = x.next;
              return T;
            }
            // Consumes a specified amount of bytes or characters from the buffered data.
          }, {
            key: "consume",
            value: function(E, T) {
              var x;
              return E < this.head.data.length ? (x = this.head.data.slice(0, E), this.head.data = this.head.data.slice(E)) : E === this.head.data.length ? x = this.shift() : x = T ? this._getString(E) : this._getBuffer(E), x;
            }
          }, {
            key: "first",
            value: function() {
              return this.head.data;
            }
            // Consumes a specified amount of characters from the buffered data.
          }, {
            key: "_getString",
            value: function(E) {
              var T = this.head, x = 1, A = T.data;
              for (E -= A.length; T = T.next; ) {
                var I = T.data, R = E > I.length ? I.length : E;
                if (R === I.length ? A += I : A += I.slice(0, E), E -= R, E === 0) {
                  R === I.length ? (++x, T.next ? this.head = T.next : this.head = this.tail = null) : (this.head = T, T.data = I.slice(R));
                  break;
                }
                ++x;
              }
              return this.length -= x, A;
            }
            // Consumes a specified amount of bytes from the buffered data.
          }, {
            key: "_getBuffer",
            value: function(E) {
              var T = c.allocUnsafe(E), x = this.head, A = 1;
              for (x.data.copy(T), E -= x.data.length; x = x.next; ) {
                var I = x.data, R = E > I.length ? I.length : E;
                if (I.copy(T, T.length - E, 0, R), E -= R, E === 0) {
                  R === I.length ? (++A, x.next ? this.head = x.next : this.head = this.tail = null) : (this.head = x, x.data = I.slice(R));
                  break;
                }
                ++A;
              }
              return this.length -= A, T;
            }
            // Make sure the linked list only shows the minimal necessary information.
          }, {
            key: d,
            value: function(E, T) {
              return m(this, a({}, T, {
                // Only inspect one level.
                depth: 0,
                // It should not recurse.
                customInspect: !1
              }));
            }
          }]), v;
        })();
      }, { buffer: 32, util: 29 }], 74: [function(r, i, n) {
        (function(o) {
          (function() {
            function a(c, p) {
              var m = this, d = this._readableState && this._readableState.destroyed, _ = this._writableState && this._writableState.destroyed;
              return d || _ ? (p ? p(c) : c && (this._writableState ? this._writableState.errorEmitted || (this._writableState.errorEmitted = !0, o.nextTick(s, this, c)) : o.nextTick(s, this, c)), this) : (this._readableState && (this._readableState.destroyed = !0), this._writableState && (this._writableState.destroyed = !0), this._destroy(c || null, function(v) {
                !p && v ? m._writableState ? m._writableState.errorEmitted ? o.nextTick(f, m) : (m._writableState.errorEmitted = !0, o.nextTick(l, m, v)) : o.nextTick(l, m, v) : p ? (o.nextTick(f, m), p(v)) : o.nextTick(f, m);
              }), this);
            }
            function l(c, p) {
              s(c, p), f(c);
            }
            function f(c) {
              c._writableState && !c._writableState.emitClose || c._readableState && !c._readableState.emitClose || c.emit("close");
            }
            function h() {
              this._readableState && (this._readableState.destroyed = !1, this._readableState.reading = !1, this._readableState.ended = !1, this._readableState.endEmitted = !1), this._writableState && (this._writableState.destroyed = !1, this._writableState.ended = !1, this._writableState.ending = !1, this._writableState.finalCalled = !1, this._writableState.prefinished = !1, this._writableState.finished = !1, this._writableState.errorEmitted = !1);
            }
            function s(c, p) {
              c.emit("error", p);
            }
            function u(c, p) {
              var m = c._readableState, d = c._writableState;
              m && m.autoDestroy || d && d.autoDestroy ? c.destroy(p) : c.emit("error", p);
            }
            i.exports = {
              destroy: a,
              undestroy: h,
              errorOrDestroy: u
            };
          }).call(this);
        }).call(this, r("_process"));
      }, { _process: 63 }], 75: [function(r, i, n) {
        var o = r("../../../errors").codes.ERR_STREAM_PREMATURE_CLOSE;
        function a(s) {
          var u = !1;
          return function() {
            if (!u) {
              u = !0;
              for (var c = arguments.length, p = new Array(c), m = 0; m < c; m++)
                p[m] = arguments[m];
              s.apply(this, p);
            }
          };
        }
        function l() {
        }
        function f(s) {
          return s.setHeader && typeof s.abort == "function";
        }
        function h(s, u, c) {
          if (typeof u == "function") return h(s, null, u);
          u || (u = {}), c = a(c || l);
          var p = u.readable || u.readable !== !1 && s.readable, m = u.writable || u.writable !== !1 && s.writable, d = function() {
            s.writable || v();
          }, _ = s._writableState && s._writableState.finished, v = function() {
            m = !1, _ = !0, p || c.call(s);
          }, k = s._readableState && s._readableState.endEmitted, E = function() {
            p = !1, k = !0, m || c.call(s);
          }, T = function(R) {
            c.call(s, R);
          }, x = function() {
            var R;
            if (p && !k)
              return (!s._readableState || !s._readableState.ended) && (R = new o()), c.call(s, R);
            if (m && !_)
              return (!s._writableState || !s._writableState.ended) && (R = new o()), c.call(s, R);
          }, A = function() {
            s.req.on("finish", v);
          };
          return f(s) ? (s.on("complete", v), s.on("abort", x), s.req ? A() : s.on("request", A)) : m && !s._writableState && (s.on("end", d), s.on("close", d)), s.on("end", E), s.on("finish", v), u.error !== !1 && s.on("error", T), s.on("close", x), function() {
            s.removeListener("complete", v), s.removeListener("abort", x), s.removeListener("request", A), s.req && s.req.removeListener("finish", v), s.removeListener("end", d), s.removeListener("close", d), s.removeListener("finish", v), s.removeListener("end", E), s.removeListener("error", T), s.removeListener("close", x);
          };
        }
        i.exports = h;
      }, { "../../../errors": 66 }], 76: [function(r, i, n) {
        i.exports = function() {
          throw new Error("Readable.from is not available in the browser");
        };
      }, {}], 77: [function(r, i, n) {
        var o;
        function a(v) {
          var k = !1;
          return function() {
            k || (k = !0, v.apply(void 0, arguments));
          };
        }
        var l = r("../../../errors").codes, f = l.ERR_MISSING_ARGS, h = l.ERR_STREAM_DESTROYED;
        function s(v) {
          if (v) throw v;
        }
        function u(v) {
          return v.setHeader && typeof v.abort == "function";
        }
        function c(v, k, E, T) {
          T = a(T);
          var x = !1;
          v.on("close", function() {
            x = !0;
          }), o === void 0 && (o = r("./end-of-stream")), o(v, {
            readable: k,
            writable: E
          }, function(I) {
            if (I) return T(I);
            x = !0, T();
          });
          var A = !1;
          return function(I) {
            if (!x && !A) {
              if (A = !0, u(v)) return v.abort();
              if (typeof v.destroy == "function") return v.destroy();
              T(I || new h("pipe"));
            }
          };
        }
        function p(v) {
          v();
        }
        function m(v, k) {
          return v.pipe(k);
        }
        function d(v) {
          return !v.length || typeof v[v.length - 1] != "function" ? s : v.pop();
        }
        function _() {
          for (var v = arguments.length, k = new Array(v), E = 0; E < v; E++)
            k[E] = arguments[E];
          var T = d(k);
          if (Array.isArray(k[0]) && (k = k[0]), k.length < 2)
            throw new f("streams");
          var x, A = k.map(function(I, R) {
            var M = R < k.length - 1, b = R > 0;
            return c(I, M, b, function(N) {
              x || (x = N), N && A.forEach(p), !M && (A.forEach(p), T(x));
            });
          });
          return k.reduce(m);
        }
        i.exports = _;
      }, { "../../../errors": 66, "./end-of-stream": 75 }], 78: [function(r, i, n) {
        var o = r("../../../errors").codes.ERR_INVALID_OPT_VALUE;
        function a(f, h, s) {
          return f.highWaterMark != null ? f.highWaterMark : h ? f[s] : null;
        }
        function l(f, h, s, u) {
          var c = a(h, u, s);
          if (c != null) {
            if (!(isFinite(c) && Math.floor(c) === c) || c < 0) {
              var p = u ? s : "highWaterMark";
              throw new o(p, c);
            }
            return Math.floor(c);
          }
          return f.objectMode ? 16 : 16 * 1024;
        }
        i.exports = {
          getHighWaterMark: l
        };
      }, { "../../../errors": 66 }], 79: [function(r, i, n) {
        i.exports = r("events").EventEmitter;
      }, { events: 35 }], 80: [function(r, i, n) {
        var o = r("safe-buffer").Buffer, a = o.isEncoding || function(A) {
          switch (A = "" + A, A && A.toLowerCase()) {
            case "hex":
            case "utf8":
            case "utf-8":
            case "ascii":
            case "binary":
            case "base64":
            case "ucs2":
            case "ucs-2":
            case "utf16le":
            case "utf-16le":
            case "raw":
              return !0;
            default:
              return !1;
          }
        };
        function l(A) {
          if (!A) return "utf8";
          for (var I; ; )
            switch (A) {
              case "utf8":
              case "utf-8":
                return "utf8";
              case "ucs2":
              case "ucs-2":
              case "utf16le":
              case "utf-16le":
                return "utf16le";
              case "latin1":
              case "binary":
                return "latin1";
              case "base64":
              case "ascii":
              case "hex":
                return A;
              default:
                if (I) return;
                A = ("" + A).toLowerCase(), I = !0;
            }
        }
        function f(A) {
          var I = l(A);
          if (typeof I != "string" && (o.isEncoding === a || !a(A))) throw new Error("Unknown encoding: " + A);
          return I || A;
        }
        n.StringDecoder = h;
        function h(A) {
          this.encoding = f(A);
          var I;
          switch (this.encoding) {
            case "utf16le":
              this.text = _, this.end = v, I = 4;
              break;
            case "utf8":
              this.fillLast = p, I = 4;
              break;
            case "base64":
              this.text = k, this.end = E, I = 3;
              break;
            default:
              this.write = T, this.end = x;
              return;
          }
          this.lastNeed = 0, this.lastTotal = 0, this.lastChar = o.allocUnsafe(I);
        }
        h.prototype.write = function(A) {
          if (A.length === 0) return "";
          var I, R;
          if (this.lastNeed) {
            if (I = this.fillLast(A), I === void 0) return "";
            R = this.lastNeed, this.lastNeed = 0;
          } else
            R = 0;
          return R < A.length ? I ? I + this.text(A, R) : this.text(A, R) : I || "";
        }, h.prototype.end = d, h.prototype.text = m, h.prototype.fillLast = function(A) {
          if (this.lastNeed <= A.length)
            return A.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed), this.lastChar.toString(this.encoding, 0, this.lastTotal);
          A.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, A.length), this.lastNeed -= A.length;
        };
        function s(A) {
          return A <= 127 ? 0 : A >> 5 === 6 ? 2 : A >> 4 === 14 ? 3 : A >> 3 === 30 ? 4 : A >> 6 === 2 ? -1 : -2;
        }
        function u(A, I, R) {
          var M = I.length - 1;
          if (M < R) return 0;
          var b = s(I[M]);
          return b >= 0 ? (b > 0 && (A.lastNeed = b - 1), b) : --M < R || b === -2 ? 0 : (b = s(I[M]), b >= 0 ? (b > 0 && (A.lastNeed = b - 2), b) : --M < R || b === -2 ? 0 : (b = s(I[M]), b >= 0 ? (b > 0 && (b === 2 ? b = 0 : A.lastNeed = b - 3), b) : 0));
        }
        function c(A, I, R) {
          if ((I[0] & 192) !== 128)
            return A.lastNeed = 0, "�";
          if (A.lastNeed > 1 && I.length > 1) {
            if ((I[1] & 192) !== 128)
              return A.lastNeed = 1, "�";
            if (A.lastNeed > 2 && I.length > 2 && (I[2] & 192) !== 128)
              return A.lastNeed = 2, "�";
          }
        }
        function p(A) {
          var I = this.lastTotal - this.lastNeed, R = c(this, A);
          if (R !== void 0) return R;
          if (this.lastNeed <= A.length)
            return A.copy(this.lastChar, I, 0, this.lastNeed), this.lastChar.toString(this.encoding, 0, this.lastTotal);
          A.copy(this.lastChar, I, 0, A.length), this.lastNeed -= A.length;
        }
        function m(A, I) {
          var R = u(this, A, I);
          if (!this.lastNeed) return A.toString("utf8", I);
          this.lastTotal = R;
          var M = A.length - (R - this.lastNeed);
          return A.copy(this.lastChar, 0, M), A.toString("utf8", I, M);
        }
        function d(A) {
          var I = A && A.length ? this.write(A) : "";
          return this.lastNeed ? I + "�" : I;
        }
        function _(A, I) {
          if ((A.length - I) % 2 === 0) {
            var R = A.toString("utf16le", I);
            if (R) {
              var M = R.charCodeAt(R.length - 1);
              if (M >= 55296 && M <= 56319)
                return this.lastNeed = 2, this.lastTotal = 4, this.lastChar[0] = A[A.length - 2], this.lastChar[1] = A[A.length - 1], R.slice(0, -1);
            }
            return R;
          }
          return this.lastNeed = 1, this.lastTotal = 2, this.lastChar[0] = A[A.length - 1], A.toString("utf16le", I, A.length - 1);
        }
        function v(A) {
          var I = A && A.length ? this.write(A) : "";
          if (this.lastNeed) {
            var R = this.lastTotal - this.lastNeed;
            return I + this.lastChar.toString("utf16le", 0, R);
          }
          return I;
        }
        function k(A, I) {
          var R = (A.length - I) % 3;
          return R === 0 ? A.toString("base64", I) : (this.lastNeed = 3 - R, this.lastTotal = 3, R === 1 ? this.lastChar[0] = A[A.length - 1] : (this.lastChar[0] = A[A.length - 2], this.lastChar[1] = A[A.length - 1]), A.toString("base64", I, A.length - R));
        }
        function E(A) {
          var I = A && A.length ? this.write(A) : "";
          return this.lastNeed ? I + this.lastChar.toString("base64", 0, 3 - this.lastNeed) : I;
        }
        function T(A) {
          return A.toString(this.encoding);
        }
        function x(A) {
          return A && A.length ? this.write(A) : "";
        }
      }, { "safe-buffer": 64 }], 81: [function(r, i, n) {
        (function(o) {
          (function() {
            i.exports = a;
            function a(f, h) {
              if (l("noDeprecation"))
                return f;
              var s = !1;
              function u() {
                if (!s) {
                  if (l("throwDeprecation"))
                    throw new Error(h);
                  l("traceDeprecation") ? console.trace(h) : console.warn(h), s = !0;
                }
                return f.apply(this, arguments);
              }
              return u;
            }
            function l(f) {
              try {
                if (!o.localStorage) return !1;
              } catch {
                return !1;
              }
              var h = o.localStorage[f];
              return h == null ? !1 : String(h).toLowerCase() === "true";
            }
          }).call(this);
        }).call(this, typeof mt < "u" ? mt : typeof self < "u" ? self : typeof window < "u" ? window : {});
      }, {}], 82: [function(r, i, n) {
        arguments[4][25][0].apply(n, arguments);
      }, { dup: 25 }], 83: [function(r, i, n) {
        var o = r("is-arguments"), a = r("is-generator-function"), l = r("which-typed-array"), f = r("is-typed-array");
        function h(S) {
          return S.call.bind(S);
        }
        var s = typeof BigInt < "u", u = typeof Symbol < "u", c = h(Object.prototype.toString), p = h(Number.prototype.valueOf), m = h(String.prototype.valueOf), d = h(Boolean.prototype.valueOf);
        if (s)
          var _ = h(BigInt.prototype.valueOf);
        if (u)
          var v = h(Symbol.prototype.valueOf);
        function k(S, J) {
          if (typeof S != "object")
            return !1;
          try {
            return J(S), !0;
          } catch {
            return !1;
          }
        }
        n.isArgumentsObject = o, n.isGeneratorFunction = a, n.isTypedArray = f;
        function E(S) {
          return typeof Promise < "u" && S instanceof Promise || S !== null && typeof S == "object" && typeof S.then == "function" && typeof S.catch == "function";
        }
        n.isPromise = E;
        function T(S) {
          return typeof ArrayBuffer < "u" && ArrayBuffer.isView ? ArrayBuffer.isView(S) : f(S) || Z(S);
        }
        n.isArrayBufferView = T;
        function x(S) {
          return l(S) === "Uint8Array";
        }
        n.isUint8Array = x;
        function A(S) {
          return l(S) === "Uint8ClampedArray";
        }
        n.isUint8ClampedArray = A;
        function I(S) {
          return l(S) === "Uint16Array";
        }
        n.isUint16Array = I;
        function R(S) {
          return l(S) === "Uint32Array";
        }
        n.isUint32Array = R;
        function M(S) {
          return l(S) === "Int8Array";
        }
        n.isInt8Array = M;
        function b(S) {
          return l(S) === "Int16Array";
        }
        n.isInt16Array = b;
        function N(S) {
          return l(S) === "Int32Array";
        }
        n.isInt32Array = N;
        function j(S) {
          return l(S) === "Float32Array";
        }
        n.isFloat32Array = j;
        function $(S) {
          return l(S) === "Float64Array";
        }
        n.isFloat64Array = $;
        function re(S) {
          return l(S) === "BigInt64Array";
        }
        n.isBigInt64Array = re;
        function ne(S) {
          return l(S) === "BigUint64Array";
        }
        n.isBigUint64Array = ne;
        function U(S) {
          return c(S) === "[object Map]";
        }
        U.working = typeof Map < "u" && U(/* @__PURE__ */ new Map());
        function P(S) {
          return typeof Map > "u" ? !1 : U.working ? U(S) : S instanceof Map;
        }
        n.isMap = P;
        function D(S) {
          return c(S) === "[object Set]";
        }
        D.working = typeof Set < "u" && D(/* @__PURE__ */ new Set());
        function Q(S) {
          return typeof Set > "u" ? !1 : D.working ? D(S) : S instanceof Set;
        }
        n.isSet = Q;
        function W(S) {
          return c(S) === "[object WeakMap]";
        }
        W.working = typeof WeakMap < "u" && W(/* @__PURE__ */ new WeakMap());
        function oe(S) {
          return typeof WeakMap > "u" ? !1 : W.working ? W(S) : S instanceof WeakMap;
        }
        n.isWeakMap = oe;
        function ae(S) {
          return c(S) === "[object WeakSet]";
        }
        ae.working = typeof WeakSet < "u" && ae(/* @__PURE__ */ new WeakSet());
        function H(S) {
          return ae(S);
        }
        n.isWeakSet = H;
        function X(S) {
          return c(S) === "[object ArrayBuffer]";
        }
        X.working = typeof ArrayBuffer < "u" && X(new ArrayBuffer());
        function ie(S) {
          return typeof ArrayBuffer > "u" ? !1 : X.working ? X(S) : S instanceof ArrayBuffer;
        }
        n.isArrayBuffer = ie;
        function pe(S) {
          return c(S) === "[object DataView]";
        }
        pe.working = typeof ArrayBuffer < "u" && typeof DataView < "u" && pe(new DataView(new ArrayBuffer(1), 0, 1));
        function Z(S) {
          return typeof DataView > "u" ? !1 : pe.working ? pe(S) : S instanceof DataView;
        }
        n.isDataView = Z;
        var K = typeof SharedArrayBuffer < "u" ? SharedArrayBuffer : void 0;
        function ee(S) {
          return c(S) === "[object SharedArrayBuffer]";
        }
        function de(S) {
          return typeof K > "u" ? !1 : (typeof ee.working > "u" && (ee.working = ee(new K())), ee.working ? ee(S) : S instanceof K);
        }
        n.isSharedArrayBuffer = de;
        function ge(S) {
          return c(S) === "[object AsyncFunction]";
        }
        n.isAsyncFunction = ge;
        function ue(S) {
          return c(S) === "[object Map Iterator]";
        }
        n.isMapIterator = ue;
        function Y(S) {
          return c(S) === "[object Set Iterator]";
        }
        n.isSetIterator = Y;
        function q(S) {
          return c(S) === "[object Generator]";
        }
        n.isGeneratorObject = q;
        function he(S) {
          return c(S) === "[object WebAssembly.Module]";
        }
        n.isWebAssemblyCompiledModule = he;
        function Se(S) {
          return k(S, p);
        }
        n.isNumberObject = Se;
        function Te(S) {
          return k(S, m);
        }
        n.isStringObject = Te;
        function F(S) {
          return k(S, d);
        }
        n.isBooleanObject = F;
        function z(S) {
          return s && k(S, _);
        }
        n.isBigIntObject = z;
        function O(S) {
          return u && k(S, v);
        }
        n.isSymbolObject = O;
        function g(S) {
          return Se(S) || Te(S) || F(S) || z(S) || O(S);
        }
        n.isBoxedPrimitive = g;
        function w(S) {
          return typeof Uint8Array < "u" && (ie(S) || de(S));
        }
        n.isAnyArrayBuffer = w, ["isProxy", "isExternal", "isModuleNamespaceObject"].forEach(function(S) {
          Object.defineProperty(n, S, {
            enumerable: !1,
            value: function() {
              throw new Error(S + " is not supported in userland");
            }
          });
        });
      }, { "is-arguments": 47, "is-generator-function": 49, "is-typed-array": 50, "which-typed-array": 85 }], 84: [function(r, i, n) {
        (function(o) {
          (function() {
            var a = Object.getOwnPropertyDescriptors || function(K) {
              for (var ee = Object.keys(K), de = {}, ge = 0; ge < ee.length; ge++)
                de[ee[ge]] = Object.getOwnPropertyDescriptor(K, ee[ge]);
              return de;
            }, l = /%[sdj%]/g;
            n.format = function(Z) {
              if (!b(Z)) {
                for (var K = [], ee = 0; ee < arguments.length; ee++)
                  K.push(u(arguments[ee]));
                return K.join(" ");
              }
              for (var ee = 1, de = arguments, ge = de.length, ue = String(Z).replace(l, function(q) {
                if (q === "%%") return "%";
                if (ee >= ge) return q;
                switch (q) {
                  case "%s":
                    return String(de[ee++]);
                  case "%d":
                    return Number(de[ee++]);
                  case "%j":
                    try {
                      return JSON.stringify(de[ee++]);
                    } catch {
                      return "[Circular]";
                    }
                  default:
                    return q;
                }
              }), Y = de[ee]; ee < ge; Y = de[++ee])
                I(Y) || !re(Y) ? ue += " " + Y : ue += " " + u(Y);
              return ue;
            }, n.deprecate = function(Z, K) {
              if (typeof o < "u" && o.noDeprecation === !0)
                return Z;
              if (typeof o > "u")
                return function() {
                  return n.deprecate(Z, K).apply(this, arguments);
                };
              var ee = !1;
              function de() {
                if (!ee) {
                  if (o.throwDeprecation)
                    throw new Error(K);
                  o.traceDeprecation ? console.trace(K) : console.error(K), ee = !0;
                }
                return Z.apply(this, arguments);
              }
              return de;
            };
            var f = {}, h = /^$/;
            if (o.env.NODE_DEBUG) {
              var s = o.env.NODE_DEBUG;
              s = s.replace(/[|\\{}()[\]^$+?.]/g, "\\$&").replace(/\*/g, ".*").replace(/,/g, "$|^").toUpperCase(), h = new RegExp("^" + s + "$", "i");
            }
            n.debuglog = function(Z) {
              if (Z = Z.toUpperCase(), !f[Z])
                if (h.test(Z)) {
                  var K = o.pid;
                  f[Z] = function() {
                    var ee = n.format.apply(n, arguments);
                    console.error("%s %d: %s", Z, K, ee);
                  };
                } else
                  f[Z] = function() {
                  };
              return f[Z];
            };
            function u(Z, K) {
              var ee = {
                seen: [],
                stylize: p
              };
              return arguments.length >= 3 && (ee.depth = arguments[2]), arguments.length >= 4 && (ee.colors = arguments[3]), A(K) ? ee.showHidden = K : K && n._extend(ee, K), j(ee.showHidden) && (ee.showHidden = !1), j(ee.depth) && (ee.depth = 2), j(ee.colors) && (ee.colors = !1), j(ee.customInspect) && (ee.customInspect = !0), ee.colors && (ee.stylize = c), d(ee, Z, ee.depth);
            }
            n.inspect = u, u.colors = {
              bold: [1, 22],
              italic: [3, 23],
              underline: [4, 24],
              inverse: [7, 27],
              white: [37, 39],
              grey: [90, 39],
              black: [30, 39],
              blue: [34, 39],
              cyan: [36, 39],
              green: [32, 39],
              magenta: [35, 39],
              red: [31, 39],
              yellow: [33, 39]
            }, u.styles = {
              special: "cyan",
              number: "yellow",
              boolean: "yellow",
              undefined: "grey",
              null: "bold",
              string: "green",
              date: "magenta",
              // "name": intentionally not styling
              regexp: "red"
            };
            function c(Z, K) {
              var ee = u.styles[K];
              return ee ? "\x1B[" + u.colors[ee][0] + "m" + Z + "\x1B[" + u.colors[ee][1] + "m" : Z;
            }
            function p(Z, K) {
              return Z;
            }
            function m(Z) {
              var K = {};
              return Z.forEach(function(ee, de) {
                K[ee] = !0;
              }), K;
            }
            function d(Z, K, ee) {
              if (Z.customInspect && K && P(K.inspect) && // Filter out the util module, it's inspect function is special
              K.inspect !== n.inspect && // Also filter out any prototype objects using the circular check.
              !(K.constructor && K.constructor.prototype === K)) {
                var de = K.inspect(ee, Z);
                return b(de) || (de = d(Z, de, ee)), de;
              }
              var ge = _(Z, K);
              if (ge)
                return ge;
              var ue = Object.keys(K), Y = m(ue);
              if (Z.showHidden && (ue = Object.getOwnPropertyNames(K)), U(K) && (ue.indexOf("message") >= 0 || ue.indexOf("description") >= 0))
                return v(K);
              if (ue.length === 0) {
                if (P(K)) {
                  var q = K.name ? ": " + K.name : "";
                  return Z.stylize("[Function" + q + "]", "special");
                }
                if ($(K))
                  return Z.stylize(RegExp.prototype.toString.call(K), "regexp");
                if (ne(K))
                  return Z.stylize(Date.prototype.toString.call(K), "date");
                if (U(K))
                  return v(K);
              }
              var he = "", Se = !1, Te = ["{", "}"];
              if (x(K) && (Se = !0, Te = ["[", "]"]), P(K)) {
                var F = K.name ? ": " + K.name : "";
                he = " [Function" + F + "]";
              }
              if ($(K) && (he = " " + RegExp.prototype.toString.call(K)), ne(K) && (he = " " + Date.prototype.toUTCString.call(K)), U(K) && (he = " " + v(K)), ue.length === 0 && (!Se || K.length == 0))
                return Te[0] + he + Te[1];
              if (ee < 0)
                return $(K) ? Z.stylize(RegExp.prototype.toString.call(K), "regexp") : Z.stylize("[Object]", "special");
              Z.seen.push(K);
              var z;
              return Se ? z = k(Z, K, ee, Y, ue) : z = ue.map(function(O) {
                return E(Z, K, ee, Y, O, Se);
              }), Z.seen.pop(), T(z, he, Te);
            }
            function _(Z, K) {
              if (j(K))
                return Z.stylize("undefined", "undefined");
              if (b(K)) {
                var ee = "'" + JSON.stringify(K).replace(/^"|"$/g, "").replace(/'/g, "\\'").replace(/\\"/g, '"') + "'";
                return Z.stylize(ee, "string");
              }
              if (M(K))
                return Z.stylize("" + K, "number");
              if (A(K))
                return Z.stylize("" + K, "boolean");
              if (I(K))
                return Z.stylize("null", "null");
            }
            function v(Z) {
              return "[" + Error.prototype.toString.call(Z) + "]";
            }
            function k(Z, K, ee, de, ge) {
              for (var ue = [], Y = 0, q = K.length; Y < q; ++Y)
                H(K, String(Y)) ? ue.push(E(
                  Z,
                  K,
                  ee,
                  de,
                  String(Y),
                  !0
                )) : ue.push("");
              return ge.forEach(function(he) {
                he.match(/^\d+$/) || ue.push(E(
                  Z,
                  K,
                  ee,
                  de,
                  he,
                  !0
                ));
              }), ue;
            }
            function E(Z, K, ee, de, ge, ue) {
              var Y, q, he;
              if (he = Object.getOwnPropertyDescriptor(K, ge) || { value: K[ge] }, he.get ? he.set ? q = Z.stylize("[Getter/Setter]", "special") : q = Z.stylize("[Getter]", "special") : he.set && (q = Z.stylize("[Setter]", "special")), H(de, ge) || (Y = "[" + ge + "]"), q || (Z.seen.indexOf(he.value) < 0 ? (I(ee) ? q = d(Z, he.value, null) : q = d(Z, he.value, ee - 1), q.indexOf(`
`) > -1 && (ue ? q = q.split(`
`).map(function(Se) {
                return "  " + Se;
              }).join(`
`).slice(2) : q = `
` + q.split(`
`).map(function(Se) {
                return "   " + Se;
              }).join(`
`))) : q = Z.stylize("[Circular]", "special")), j(Y)) {
                if (ue && ge.match(/^\d+$/))
                  return q;
                Y = JSON.stringify("" + ge), Y.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/) ? (Y = Y.slice(1, -1), Y = Z.stylize(Y, "name")) : (Y = Y.replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'"), Y = Z.stylize(Y, "string"));
              }
              return Y + ": " + q;
            }
            function T(Z, K, ee) {
              var de = Z.reduce(function(ge, ue) {
                return ue.indexOf(`
`) >= 0, ge + ue.replace(/\u001b\[\d\d?m/g, "").length + 1;
              }, 0);
              return de > 60 ? ee[0] + (K === "" ? "" : K + `
 `) + " " + Z.join(`,
  `) + " " + ee[1] : ee[0] + K + " " + Z.join(", ") + " " + ee[1];
            }
            n.types = r("./support/types");
            function x(Z) {
              return Array.isArray(Z);
            }
            n.isArray = x;
            function A(Z) {
              return typeof Z == "boolean";
            }
            n.isBoolean = A;
            function I(Z) {
              return Z === null;
            }
            n.isNull = I;
            function R(Z) {
              return Z == null;
            }
            n.isNullOrUndefined = R;
            function M(Z) {
              return typeof Z == "number";
            }
            n.isNumber = M;
            function b(Z) {
              return typeof Z == "string";
            }
            n.isString = b;
            function N(Z) {
              return typeof Z == "symbol";
            }
            n.isSymbol = N;
            function j(Z) {
              return Z === void 0;
            }
            n.isUndefined = j;
            function $(Z) {
              return re(Z) && Q(Z) === "[object RegExp]";
            }
            n.isRegExp = $, n.types.isRegExp = $;
            function re(Z) {
              return typeof Z == "object" && Z !== null;
            }
            n.isObject = re;
            function ne(Z) {
              return re(Z) && Q(Z) === "[object Date]";
            }
            n.isDate = ne, n.types.isDate = ne;
            function U(Z) {
              return re(Z) && (Q(Z) === "[object Error]" || Z instanceof Error);
            }
            n.isError = U, n.types.isNativeError = U;
            function P(Z) {
              return typeof Z == "function";
            }
            n.isFunction = P;
            function D(Z) {
              return Z === null || typeof Z == "boolean" || typeof Z == "number" || typeof Z == "string" || typeof Z == "symbol" || // ES6 symbol
              typeof Z > "u";
            }
            n.isPrimitive = D, n.isBuffer = r("./support/isBuffer");
            function Q(Z) {
              return Object.prototype.toString.call(Z);
            }
            function W(Z) {
              return Z < 10 ? "0" + Z.toString(10) : Z.toString(10);
            }
            var oe = [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec"
            ];
            function ae() {
              var Z = /* @__PURE__ */ new Date(), K = [
                W(Z.getHours()),
                W(Z.getMinutes()),
                W(Z.getSeconds())
              ].join(":");
              return [Z.getDate(), oe[Z.getMonth()], K].join(" ");
            }
            n.log = function() {
              console.log("%s - %s", ae(), n.format.apply(n, arguments));
            }, n.inherits = r("inherits"), n._extend = function(Z, K) {
              if (!K || !re(K)) return Z;
              for (var ee = Object.keys(K), de = ee.length; de--; )
                Z[ee[de]] = K[ee[de]];
              return Z;
            };
            function H(Z, K) {
              return Object.prototype.hasOwnProperty.call(Z, K);
            }
            var X = typeof Symbol < "u" ? Symbol("util.promisify.custom") : void 0;
            n.promisify = function(K) {
              if (typeof K != "function")
                throw new TypeError('The "original" argument must be of type Function');
              if (X && K[X]) {
                var ee = K[X];
                if (typeof ee != "function")
                  throw new TypeError('The "util.promisify.custom" argument must be of type Function');
                return Object.defineProperty(ee, X, {
                  value: ee,
                  enumerable: !1,
                  writable: !1,
                  configurable: !0
                }), ee;
              }
              function ee() {
                for (var de, ge, ue = new Promise(function(he, Se) {
                  de = he, ge = Se;
                }), Y = [], q = 0; q < arguments.length; q++)
                  Y.push(arguments[q]);
                Y.push(function(he, Se) {
                  he ? ge(he) : de(Se);
                });
                try {
                  K.apply(this, Y);
                } catch (he) {
                  ge(he);
                }
                return ue;
              }
              return Object.setPrototypeOf(ee, Object.getPrototypeOf(K)), X && Object.defineProperty(ee, X, {
                value: ee,
                enumerable: !1,
                writable: !1,
                configurable: !0
              }), Object.defineProperties(
                ee,
                a(K)
              );
            }, n.promisify.custom = X;
            function ie(Z, K) {
              if (!Z) {
                var ee = new Error("Promise was rejected with a falsy value");
                ee.reason = Z, Z = ee;
              }
              return K(Z);
            }
            function pe(Z) {
              if (typeof Z != "function")
                throw new TypeError('The "original" argument must be of type Function');
              function K() {
                for (var ee = [], de = 0; de < arguments.length; de++)
                  ee.push(arguments[de]);
                var ge = ee.pop();
                if (typeof ge != "function")
                  throw new TypeError("The last argument must be of type Function");
                var ue = this, Y = function() {
                  return ge.apply(ue, arguments);
                };
                Z.apply(this, ee).then(
                  function(q) {
                    o.nextTick(Y.bind(null, null, q));
                  },
                  function(q) {
                    o.nextTick(ie.bind(null, q, Y));
                  }
                );
              }
              return Object.setPrototypeOf(K, Object.getPrototypeOf(Z)), Object.defineProperties(
                K,
                a(Z)
              ), K;
            }
            n.callbackify = pe;
          }).call(this);
        }).call(this, r("_process"));
      }, { "./support/isBuffer": 82, "./support/types": 83, _process: 63, inherits: 46 }], 85: [function(r, i, n) {
        (function(o) {
          (function() {
            var a = r("for-each"), l = r("available-typed-arrays"), f = r("call-bind/callBound"), h = r("gopd"), s = f("Object.prototype.toString"), u = r("has-tostringtag/shams")(), c = typeof globalThis > "u" ? o : globalThis, p = l(), m = f("String.prototype.slice"), d = {}, _ = Object.getPrototypeOf;
            u && h && _ && a(p, function(E) {
              if (typeof c[E] == "function") {
                var T = new c[E]();
                if (Symbol.toStringTag in T) {
                  var x = _(T), A = h(x, Symbol.toStringTag);
                  if (!A) {
                    var I = _(x);
                    A = h(I, Symbol.toStringTag);
                  }
                  d[E] = A.get;
                }
              }
            });
            var v = function(T) {
              var x = !1;
              return a(d, function(A, I) {
                if (!x)
                  try {
                    var R = A.call(T);
                    R === I && (x = R);
                  } catch {
                  }
              }), x;
            }, k = r("is-typed-array");
            i.exports = function(T) {
              return k(T) ? !u || !(Symbol.toStringTag in T) ? m(s(T), 8, -1) : v(T) : !1;
            };
          }).call(this);
        }).call(this, typeof mt < "u" ? mt : typeof self < "u" ? self : typeof window < "u" ? window : {});
      }, { "available-typed-arrays": 27, "call-bind/callBound": 33, "for-each": 36, gopd: 40, "has-tostringtag/shams": 43, "is-typed-array": 50 }] }, {}, [20])(20);
    });
  })(li)), li.exports;
}
var yp = pp();
function gp(e) {
  return new Promise((t, r) => {
    const i = new yp.PNG();
    i.parse(e).on("error", r).on("parsed", () => t({ data: i.data, width: i.width, height: i.height }));
  });
}
async function mp(e, t, r) {
  if (t) {
    const [o, a] = await Promise.all([e(), t()]);
    if (o === void 0 || a === void 0)
      throw new Error("Failed to load PNG buffer");
    const [l, f] = await Promise.all([r(o), r(a)]);
    return {
      position: l,
      color: f,
      compressedBytes: o.byteLength + a.byteLength,
      decodedBytes: l.data.byteLength + f.data.byteLength
    };
  }
  const i = await e();
  if (i === void 0)
    throw new Error("Failed to load PNG buffer");
  const n = await r(i);
  return {
    position: n,
    compressedBytes: i.byteLength,
    decodedBytes: n.data.byteLength
  };
}
const bp = {
  // 右手系 Z Up → 変換不要
  [dr.RightHandedZUp]: { rotation: [0, 0, 0], scale: [1, 1, 1] },
  // 右手系 Y Up → X軸周りに +90° 回転して Y→Z へ
  [dr.RightHandedYUp]: { rotation: [Math.PI / 2, 0, 0], scale: [1, 1, 1] },
  // 右手系 X Up → Y軸周りに -90° 回転して X→Z へ
  [dr.RightHandedXUp]: { rotation: [0, -Math.PI / 2, 0], scale: [1, 1, 1] },
  // 左手系 Z Up → X軸ミラーで右手系に変換
  [dr.LeftHandedZUp]: { rotation: [0, 0, 0], scale: [-1, 1, 1] },
  // 左手系 Y Up → X軸周りに +90° 回転 + X軸ミラー
  [dr.LeftHandedYUp]: { rotation: [Math.PI / 2, 0, 0], scale: [-1, 1, 1] },
  // 左手系 X Up → Y軸周りに -90° 回転 + X軸ミラー
  [dr.LeftHandedXUp]: { rotation: [0, -Math.PI / 2, 0], scale: [-1, 1, 1] }
}, _p = ({
  file: e,
  meta: t,
  referencePoint: r,
  selected: i = !1,
  translation: n,
  rotation: o,
  inspectorPointSize: a,
  inspectorOpacity: l,
  inspectorCoordinateSystem: f,
  onMemoryEstimateChange: h
}) => {
  const { client: s, project: u } = Tn(), [c, p] = vt(!1), [m, d] = vt(!1), _ = Ce(null), v = Ce(null), k = `${e.id ?? "unknown"}-${(t == null ? void 0 : t.version) ?? "unknown"}`, E = Ce({
    key: k,
    pngBufferCache: /* @__PURE__ */ new Map(),
    loadedTileMemory: /* @__PURE__ */ new Map()
  }), T = Ce(e.id), x = Ce(h);
  E.current.key !== k && (E.current = {
    key: k,
    pngBufferCache: /* @__PURE__ */ new Map(),
    loadedTileMemory: /* @__PURE__ */ new Map()
  });
  const A = Ze(() => {
    if (e.id === void 0 || h === void 0)
      return;
    let Q = 0, W = 0, oe = 0;
    for (const ae of E.current.loadedTileMemory.values())
      Q += 1, W += ae.compressedBytes, oe += ae.decodedBytes;
    h({
      fileId: e.id,
      loadedTileCount: Q,
      compressedBytes: W,
      decodedBytes: oe,
      totalBytes: oe
    });
  }, [e.id, h]), I = Ze(() => {
    h !== void 0 && v.current === null && (v.current = window.requestAnimationFrame(() => {
      v.current = null, A();
    }));
  }, [A, h]), R = Ze(
    (Q, W) => {
      const oe = E.current.loadedTileMemory.get(Q);
      (oe == null ? void 0 : oe.compressedBytes) === W.compressedBytes && (oe == null ? void 0 : oe.decodedBytes) === W.decodedBytes || (E.current.loadedTileMemory.set(Q, W), I());
    },
    [I]
  ), M = Ze(
    (Q) => {
      const W = E.current.pngBufferCache, { address: oe, color: ae } = Q, { lod: H, coordinate: X } = oe, ie = `${X.x}-${X.y}-${X.z}`, pe = `${H}-${ie}-${ae ? "color" : "position"}`, Z = W.get(pe);
      if (Z !== void 0)
        return Z;
      if (s === void 0 || u === void 0 || e.id === void 0) {
        const de = [
          s === void 0 ? "client" : void 0,
          u === void 0 ? "project" : void 0,
          e.id === void 0 ? "file.id" : void 0
        ].filter((ge) => ge !== void 0);
        return Promise.reject(
          new Error(`[ContractFileView] cannot load tiles without ${de.join(", ")}`)
        );
      }
      const K = {
        contractId: u.contractId,
        contractFileId: e.id,
        level: H,
        addr: ie
      }, ee = mp(
        () => s.getContractFileImagePosition(K),
        ae ? () => s.getContractFileImageColor(K) : void 0,
        gp
      ).then((de) => {
        R(pe, {
          compressedBytes: de.compressedBytes,
          decodedBytes: de.decodedBytes
        });
        const ge = { position: de.position };
        return de.color && (ge.color = de.color), ge;
      });
      return W.set(pe, ee), ee.catch(() => {
        W.delete(pe);
      }), ee;
    },
    [s, u, e, R]
  ), b = Ze(
    (Q) => M(Q).catch((W) => (console.warn("[ContractFileView] failed to load tile", W), new Promise(() => {
    }))),
    [M]
  );
  et(() => {
    T.current = e.id, x.current = h;
  }, [e.id, h]), et(() => {
    A();
  }, [k, A]), et(() => {
    (async () => {
      if ((t == null ? void 0 : t.version) !== void 0)
        try {
          const {
            position: { data: Q }
          } = await M({
            address: {
              lod: 0,
              coordinate: {
                x: 0,
                y: 0,
                z: 0
              }
            }
          }), { length: W } = Q, oe = Array.from({ length: W / 4 }).some((ae, H) => {
            const X = Q[H * 4 + 3];
            return X !== 0 && X !== 255;
          });
          d(oe);
        } catch (Q) {
          console.warn(Q);
        }
      p(!0);
    })();
  }, [t, M]), et(() => () => {
    v.current !== null && window.cancelAnimationFrame(v.current), E.current.pngBufferCache.clear(), E.current.loadedTileMemory.clear(), T.current !== void 0 && x.current !== void 0 && x.current({
      fileId: T.current,
      loadedTileCount: 0,
      compressedBytes: 0,
      decodedBytes: 0,
      totalBytes: 0
    });
  }, []);
  const N = st(() => {
    if (r == null) return t;
    const { min: Q, max: W } = t.bounds, oe = new nt().fromArray(Q).add(r), ae = new nt().fromArray(W).add(r);
    return {
      ...t,
      bounds: {
        min: oe.toArray(),
        max: ae.toArray()
      }
    };
  }, [t, r]), j = Ze(
    (Q) => {
      const W = r ?? new nt();
      return $s(Q).map((ae) => (ae.position.add(W), ae));
    },
    [r]
  ), $ = st(() => ze.scale("Spectral"), []), re = Ze(
    (Q) => {
      const W = $(Q), [oe, ae, H] = W.rgb(!1);
      return [oe / 255, ae / 255, H / 255];
    },
    [$]
  ), ne = Ze(
    ({ point: Q }) => {
      const { color: W } = Q;
      let oe;
      if (W !== void 0) {
        const { r: ae, g: H, b: X, a: ie } = W;
        m ? oe = re(ie / 255) : oe = [ae / 255, H / 255, X / 255];
      } else
        oe = [1, 1, 1];
      if (i) {
        const ae = [0.12941176470588237, 0.5882352941176471, 0.9529411764705882], H = 0.3;
        return [
          oe[0] * (1 - H) + ae[0] * H,
          oe[1] * (1 - H) + ae[1] * H,
          oe[2] * (1 - H) + ae[2] * H
        ];
      }
      return oe;
    },
    [re, m, i]
  ), U = st(() => {
    const Q = t.bounds, W = Q.max[0] - Q.min[0], oe = Q.max[1] - Q.min[1], ae = Q.max[2] - Q.min[2];
    return vp({ size: { x: W, y: oe, z: ae } });
  }, [t]), P = st(() => (U ?? 1) * 0.1, [U]);
  et(() => {
    qa(_.current, {
      pointSize: a,
      opacity: l
    });
  }, [a, l]);
  const D = st(() => {
    if (f)
      return bp[f];
  }, [f]);
  return c ? /* @__PURE__ */ Le(
    "group",
    {
      ref: _,
      position: [n.x, n.y, n.z],
      rotation: [
        o.x * (Math.PI / 180),
        o.y * (Math.PI / 180),
        o.z * (Math.PI / 180),
        "XYZ"
      ],
      children: /* @__PURE__ */ Le(
        "group",
        {
          rotation: D ? new Is(
            D.rotation[0],
            D.rotation[1],
            D.rotation[2],
            "XYZ"
          ) : void 0,
          scale: D ? D.scale : void 0,
          children: /* @__PURE__ */ Le(
            Ws,
            {
              frustumCulled: !1,
              meta: N,
              loader: b,
              parser: j,
              pointColorHandler: ne,
              pointSize: U,
              minPointSize: P
            }
          )
        }
      )
    }
  ) : null;
};
function vp(e) {
  const { x: t, y: r, z: i } = e.size;
  return Math.max(t, r, i) / 128 * 3;
}
const wp = ({
  length: e = 10,
  width: t = 0.2,
  visible: r = !0
}) => {
  const i = st(
    () => [
      { direction: new nt(1, 0, 0), color: "#ff0000", label: "X" },
      { direction: new nt(0, 1, 0), color: "#00ff00", label: "Y" },
      { direction: new nt(0, 0, 1), color: "#0000ff", label: "Z" }
    ],
    []
  );
  return r ? /* @__PURE__ */ Le("group", { children: i.map((n) => /* @__PURE__ */ Le(
    "arrowHelper",
    {
      args: [n.direction, new nt(0, 0, 0), e, n.color, e * 0.2, t]
    },
    n.label
  )) }) : null;
}, Ep = ({ point: e }) => /* @__PURE__ */ Ht(
  Fr,
  {
    component: "div",
    sx: {
      display: "inline-flex",
      alignItems: "center",
      alignContent: "center",
      pointerEvents: "none",
      userSelect: "none"
    },
    children: [
      /* @__PURE__ */ Le(
        Va,
        {
          variant: "caption",
          sx: {
            marginRight: 1,
            marginTop: "2px"
          },
          children: "基準点"
        }
      ),
      /* @__PURE__ */ Ht(
        "code",
        {
          style: {
            fontSize: "0.75em"
          },
          children: [
            "(",
            fi(e.x),
            ", ",
            fi(e.y),
            ", ",
            fi(e.z),
            ")"
          ]
        }
      )
    ]
  }
), fi = (e) => Math.floor(e * 10) / 10, qo = {
  pointSize: 2,
  opacity: 100
}, ks = "__rcde_measurement_handled", Sp = ({ views: e, referencePoint: t, onContractFileClick: r, onObjectClick: i, clickEnabled: n }) => {
  const { camera: o, gl: a } = $r(), l = st(() => new ta(), []), f = Bi({ canvas: a.domElement }), h = Ce(e), s = Ce(t), u = Ce(o), c = Ce(r), p = Ce(i), m = Ce(n);
  Sn(() => {
    h.current = e, s.current = t, u.current = o, c.current = r, p.current = i, m.current = n;
  });
  const d = Ze(
    (_) => {
      var E, T, x, A;
      if (!m.current || _[ks] || !c.current && !p.current) return;
      const v = f(_), k = Ka(
        v,
        u.current,
        l,
        h.current,
        s.current
      );
      k ? ((E = c.current) == null || E.call(c, k.view.file, k.view.boundingBox), (T = p.current) == null || T.call(p, {
        hit: !0,
        file: k.view.file,
        boundingBox: k.view.boundingBox,
        intersectionPoint: k.intersectionPoint,
        localIntersectionPoint: k.intersectionPoint.clone().sub(s.current),
        screenPosition: { x: _.clientX, y: _.clientY }
      })) : ((x = c.current) == null || x.call(c, void 0, void 0), (A = p.current) == null || A.call(p, {
        hit: !1,
        screenPosition: { x: _.clientX, y: _.clientY }
      }));
    },
    [f, l]
  );
  return et(() => {
    const _ = a.domElement;
    return _.addEventListener("click", d), () => {
      _.removeEventListener("click", d);
    };
  }, [a, d]), null;
}, Tp = 50, Ap = ({ views: e, referencePoint: t, onObjectHover: r }) => {
  const { camera: i, gl: n } = $r(), o = st(() => new ta(), []), a = Bi({ canvas: n.domElement }), l = Ce(void 0), f = Ce(null), h = Ce(null), s = Ce(r), u = Ce(e), c = Ce(t), p = Ce(i);
  Sn(() => {
    s.current = r, u.current = e, c.current = t, p.current = i;
  });
  const m = Ze(
    (v) => {
      const k = a(v), E = Ka(
        k,
        p.current,
        o,
        u.current,
        c.current
      ), T = E == null ? void 0 : E.view.file.id;
      T !== l.current && (l.current = T, E ? s.current({
        hit: !0,
        file: E.view.file,
        boundingBox: E.view.boundingBox,
        screenPosition: { x: v.clientX, y: v.clientY }
      }) : s.current({ hit: !1 }));
    },
    [a, o]
  ), d = Ze(
    (v) => {
      h.current = v, f.current === null && (m(v), h.current = null, f.current = window.setTimeout(() => {
        f.current = null;
        const k = h.current;
        k && (h.current = null, m(k));
      }, Tp));
    },
    [m]
  ), _ = Ze(() => {
    l.current !== void 0 && (l.current = void 0, s.current({ hit: !1 }));
  }, []);
  return et(() => {
    const v = l.current;
    v !== void 0 && !e.some((k) => k.file.id === v) && _();
  }, [e, _]), et(() => {
    const v = n.domElement, k = (T) => d(T), E = () => {
      f.current !== null && (window.clearTimeout(f.current), f.current = null), h.current = null, _();
    };
    return v.addEventListener("mousemove", k), v.addEventListener("mouseleave", E), () => {
      v.removeEventListener("mousemove", k), v.removeEventListener("mouseleave", E);
    };
  }, [n, d, _]), et(
    () => () => {
      f.current !== null && (window.clearTimeout(f.current), f.current = null), h.current = null, _();
    },
    [_]
  ), null;
}, Rp = ({
  onRendererReady: e
}) => {
  const { gl: t } = $r();
  return et(() => (e(t), () => {
    e(null);
  }), [t, e]), null;
};
function xp(e) {
  let t = 0, r = 0, i = 0;
  for (const n of Object.values(e))
    t += n.loadedTileCount, r += n.compressedBytes, i += n.decodedBytes;
  return {
    loadedFileCount: Object.keys(e).length,
    loadedTileCount: t,
    compressedBytes: r,
    decodedBytes: i,
    estimatedViewerBytes: i
  };
}
const kp = (e) => {
  const { load: t, updateFiles: r, containers: i } = Si(), {
    app: n,
    constructionId: o,
    contractId: a,
    contractFileIds: l,
    r3f: f,
    children: h,
    positionOffsetComponent: s,
    auxiliaryContent: u,
    contractFilesRefetchKey: c,
    selectedFileId: p,
    onContractFileClick: m,
    onObjectClick: d,
    onObjectHover: _,
    memoryMonitoring: v,
    clickEnabled: k = !0
  } = e, { initialize: E, client: T, project: x, setProject: A } = Tn(), { point: I } = ua(), [R, M] = vt([]), [b, N] = vt({}), j = Ce(/* @__PURE__ */ new Map()), $ = Ce(""), re = Ce(void 0), ne = Ce(null), U = Ce(null), P = Ce(null), D = Ce(v), Q = Ce(
    (v == null ? void 0 : v.enabled) === !0 ? v : void 0
  ), W = Ce(0), oe = Ce(void 0), ae = Ce(0), H = Ce({}), X = Ce({
    loadedFileCount: 0,
    loadedTileCount: 0,
    compressedBytes: 0,
    decodedBytes: 0,
    estimatedViewerBytes: 0
  }), ie = Ce(void 0), pe = Ce([]), Z = Ce(void 0), K = Ce(!1), ee = Ce(!0), de = Ce(void 0), ge = Ce({}), ue = Ce(() => {
  }), Y = Ce(async () => {
  }), q = Ce(null), [he, Se] = vt({
    ...qo
  }), Te = Ce(he), F = (v == null ? void 0 : v.enabled) === !0, z = Math.max((v == null ? void 0 : v.sampleIntervalMs) ?? 1e4, 1e3), O = Ze(() => {
    var V, se;
    const fe = de.current, we = ie.current;
    if (fe !== void 0 && we !== void 0) {
      const C = ((V = D.current) == null ? void 0 : V.onAlertLevelChange) ?? ((se = Q.current) == null ? void 0 : se.onAlertLevelChange);
      C == null || C(void 0, we), Q.current = void 0;
    }
    de.current = void 0, ge.current = {}, ie.current = void 0;
  }, []), [g, w] = vt({}), [S, J] = vt({}), be = Ce(l);
  Sn(() => {
    be.current = l;
  }), et(() => {
    E(n);
  }, [n, E]), et(() => {
    A({ constructionId: o, contractId: a });
  }, [o, a, A]);
  const _e = Ce(void 0), Oe = Ce(0), Be = Ze(async () => {
    if (!T || !a) return;
    const fe = _e.current !== a, we = be.current, V = ++Oe.current;
    try {
      const se = await T.getContractFileList({ contractId: a });
      if (V !== Oe.current) return;
      const C = (se == null ? void 0 : se.contractFiles) ?? [];
      fe ? (t(C, we), _e.current = a) : r(C);
    } catch (se) {
      if (V !== Oe.current) return;
      console.warn("[Viewer] getContractFileList threw:", se), fe && t([], we);
    }
  }, [T, a, t, r]);
  et(() => {
    Be();
  }, [Be, c]);
  const De = st(
    () => ({
      fov: 40,
      position: new nt(1, 2, 1).multiplyScalar(100),
      up: new nt(0, 0, 1),
      near: 0.1,
      far: 1e3 * 5
    }),
    []
  ), He = st(() => i.filter((fe) => fe.visible && pn(fe.file)).map((fe) => {
    var we;
    return `${fe.file.id}:${((we = fe.file.batchProcessingResult) == null ? void 0 : we.id) ?? ""}`;
  }).sort().join(","), [i]);
  et(() => {
    var L;
    if (x === void 0 || T === void 0) return;
    const fe = i.filter(
      (G) => G.visible && pn(G.file)
    );
    if (fe.length === 0) {
      j.current.clear(), $.current = "", re.current = void 0, M([]);
      return;
    }
    const we = `${x.constructionId}:${x.contractId}`;
    ($.current !== we || re.current !== T) && (j.current.clear(), $.current = we, re.current = T);
    for (const G of fe) {
      const te = G.file.id;
      if (te === void 0) continue;
      const xe = j.current.get(te);
      xe && xe.batchId !== ((L = G.file.batchProcessingResult) == null ? void 0 : L.id) && j.current.delete(te);
    }
    const V = fe.map((G) => G.file.id).filter((G) => G !== void 0), { toFetch: se, toRemove: C } = ed(
      V,
      new Set(j.current.keys())
    );
    for (const G of C)
      j.current.delete(G);
    const me = new Set(se), ke = fe.filter((G) => G.file.id !== void 0 && me.has(G.file.id)), y = () => {
      const G = fe.map((te) => {
        const xe = te.file.id;
        if (xe === void 0) return;
        const Ae = j.current.get(xe);
        if (Ae)
          return { file: te.file, meta: Ae.meta, boundingBox: Ae.boundingBox };
      }).filter((te) => te !== void 0);
      M(G);
    };
    if (ke.length === 0) {
      y();
      return;
    }
    let le = !1;
    const ce = ke.map((G) => {
      var Ae;
      const te = G.file.id, xe = (Ae = G.file.batchProcessingResult) == null ? void 0 : Ae.id;
      return T.getContractFileMetadata({ ...x, contractFileId: te }).then((Re) => {
        if (le) return;
        const Ne = Re, { min: Tt, max: Xe } = Ne.bounds, Ue = new Qo(new nt().fromArray(Tt), new nt().fromArray(Xe));
        j.current.set(te, { meta: Ne, boundingBox: Ue, batchId: xe });
      }).catch((Re) => {
        console.error(Re);
      });
    });
    return Promise.all(ce).then(() => {
      le || y();
    }), () => {
      le = !0;
    };
  }, [He, x, T]);
  const Fe = Ze(
    (fe) => {
      H.current = fe, X.current = xp(fe), N(fe);
    },
    []
  ), ht = Ze(
    (fe) => {
      const we = H.current, V = we[fe.fileId];
      if (fe.loadedTileCount === 0 && fe.compressedBytes === 0 && fe.decodedBytes === 0 && fe.totalBytes === 0) {
        if (V === void 0)
          return;
        const me = { ...we };
        delete me[fe.fileId], Fe(me);
        return;
      }
      if ((V == null ? void 0 : V.loadedTileCount) === fe.loadedTileCount && V.compressedBytes === fe.compressedBytes && V.decodedBytes === fe.decodedBytes && V.totalBytes === fe.totalBytes)
        return;
      const C = {
        ...we,
        [fe.fileId]: fe
      };
      Fe(C);
    },
    [Fe]
  ), qe = Ze((fe) => {
    P.current = fe;
  }, []), tt = st(
    () => R.map((fe) => fe.file.id).filter((fe) => fe !== void 0),
    [R]
  ), Et = st(() => tt.join(","), [tt]);
  et(() => {
    D.current = v, (v == null ? void 0 : v.enabled) === !0 && (Q.current = v);
  }, [v]), et(() => {
    pe.current = tt;
  }, [tt]), et(() => (ee.current = !0, () => {
    O(), ee.current = !1, P.current = null;
  }), [O]);
  const B = Ze(
    ({ force: fe = !1 } = {}) => {
      var Re, Ne, Tt, Xe, Ue, it;
      if (((Re = D.current) == null ? void 0 : Re.enabled) !== !0)
        return;
      const we = Date.now();
      if (!fe) {
        if (we - W.current < z)
          return;
        W.current = we;
      }
      const V = performance, se = typeof ((Ne = V.memory) == null ? void 0 : Ne.usedJSHeapSize) == "number" ? V.memory.usedJSHeapSize : void 0, C = Z.current, me = oe.current;
      let ke = "estimate";
      C !== void 0 ? ke = "browser-precise" : se !== void 0 && (ke = "js-heap");
      const y = (Tt = P.current) == null ? void 0 : Tt.info.memory, le = X.current, ce = {
        timestamp: we,
        source: ke,
        estimatedViewerBytes: le.estimatedViewerBytes,
        pageBytes: C,
        pageBytesMeasuredAt: me,
        jsHeapBytes: se,
        loadedFileCount: le.loadedFileCount,
        loadedTileCount: le.loadedTileCount,
        compressedBytes: le.compressedBytes,
        decodedBytes: le.decodedBytes,
        geometryCount: y == null ? void 0 : y.geometries,
        textureCount: y == null ? void 0 : y.textures,
        visibleFileIds: [...pe.current]
      };
      ie.current = ce;
      const L = D.current;
      try {
        (Xe = L == null ? void 0 : L.onSample) == null || Xe.call(L, ce);
      } catch {
      }
      const G = de.current, { nextLevel: te, nextLevels: xe, alert: Ae } = ad({
        sample: ce,
        thresholds: L == null ? void 0 : L.thresholds,
        previousLevel: G,
        previousLevels: ge.current
      });
      if (de.current = te, ge.current = xe, te !== G)
        try {
          (Ue = L == null ? void 0 : L.onAlertLevelChange) == null || Ue.call(L, te, ce);
        } catch {
        }
      if (Ae !== void 0)
        try {
          (it = L == null ? void 0 : L.onAlert) == null || it.call(L, Ae);
        } catch {
        }
    },
    [z]
  ), ve = Ze(async () => {
    var se;
    if (((se = D.current) == null ? void 0 : se.enabled) !== !0 || K.current)
      return;
    const fe = ae.current, we = performance;
    if (typeof we.measureUserAgentSpecificMemory != "function") {
      Z.current = void 0, oe.current = void 0;
      return;
    }
    K.current = !0;
    let V = !1;
    try {
      const C = await we.measureUserAgentSpecificMemory();
      if (!ee.current || fe !== ae.current)
        return;
      Z.current = typeof C.bytes == "number" ? C.bytes : void 0, oe.current = typeof C.bytes == "number" ? Date.now() : void 0, V = !0;
    } catch {
      if (!ee.current || fe !== ae.current)
        return;
      V = Z.current !== void 0, Z.current = void 0, oe.current = void 0;
    } finally {
      K.current = !1;
    }
    V && B({ force: !0 });
  }, [B]);
  return et(() => {
    ue.current = B, Y.current = ve;
  }), et(() => {
    qa(ne.current, {
      pointSize: he.pointSize,
      opacity: he.opacity
    });
  }, [he]), et(() => {
    if (!F) {
      O(), Q.current = void 0, ae.current += 1, K.current = !1, Z.current = void 0, oe.current = void 0, W.current = 0;
      return;
    }
    const fe = new Set(pe.current), we = H.current, V = Object.keys(we);
    let se = !1;
    const C = {};
    for (const me of V)
      fe.has(Number(me)) ? C[Number(me)] = we[Number(me)] : se = !0;
    se && Fe(C), ue.current(), Y.current().catch(() => {
    });
  }, [F, O, Fe]), et(() => {
    if (!F)
      return;
    const fe = window.setInterval(() => {
      ue.current(), Y.current().catch(() => {
      });
    }, z);
    return () => {
      window.clearInterval(fe);
    };
  }, [F, z]), et(() => {
    F && ue.current();
  }, [F, b, Et]), et(() => cd.addListener((fe) => {
    var we, V, se, C, me, ke;
    if (fe.type === "SET_TRANSFORM") {
      const { fileId: y, translation: le, rotation: ce } = fe.payload;
      w((L) => ({
        ...L,
        [y]: {
          translation: le,
          rotation: ce
        }
      }));
    } else if (fe.type === "SET_APPEARANCE") {
      const y = fe.payload.upAxis, le = fe.payload.coordinateSystem, ce = bn(fe.payload.pointSize ?? Te.current.pointSize, 0, 5), L = bn(fe.payload.opacity ?? Te.current.opacity, 0, 100), G = fe.payload.fileId;
      if (G !== void 0)
        J((te) => {
          var xe;
          return {
            ...te,
            [G]: {
              pointSize: ce,
              opacity: L,
              coordinateSystem: le ?? ((xe = te[G]) == null ? void 0 : xe.coordinateSystem)
            }
          };
        });
      else {
        const te = { pointSize: ce, opacity: L };
        Te.current = te, Se(te);
      }
      if (y) {
        const te = U.current;
        te && (y === "Y" ? te.up.set(0, 1, 0) : te.up.set(0, 0, 1), (we = te.updateProjectionMatrix) == null || we.call(te)), (se = (V = q.current) == null ? void 0 : V.update) == null || se.call(V);
      }
    } else if (fe.type === "RESET") {
      const y = ne.current;
      y && (y.position.set(0, 0, 0), y.rotation.set(0, 0, 0, "XYZ"));
      const le = { ...qo };
      Te.current = le, Se(le), J({}), w({});
      const ce = U.current;
      ce && (ce.up.set(0, 0, 1), (C = ce.updateProjectionMatrix) == null || C.call(ce)), (ke = (me = q.current) == null ? void 0 : me.update) == null || ke.call(me);
    }
  }), []), /* @__PURE__ */ Ht(Fr, { width: 1, height: 1, display: "flex", children: [
    /* @__PURE__ */ Ht(Fr, { width: 1, height: 1, flex: 1, position: "relative", overflow: "hidden", children: [
      /* @__PURE__ */ Ht(Hs, { camera: De, ...f == null ? void 0 : f.canvas, children: [
        /* @__PURE__ */ Le(Rp, { onRendererReady: qe }),
        /* @__PURE__ */ Le("perspectiveCamera", { ref: U }),
        (f == null ? void 0 : f.map) !== !1 && /* @__PURE__ */ Le(Fs, { ref: q, makeDefault: !0, screenSpacePanning: !0 }),
        (f == null ? void 0 : f.light) !== !1 && /* @__PURE__ */ Le("ambientLight", { intensity: 0.5 }),
        (f == null ? void 0 : f.grid) !== !1 && /* @__PURE__ */ Le(
          Ds,
          {
            args: [10, 10],
            quaternion: new Ns().setFromAxisAngle(new nt(1, 0, 0), Math.PI / 2),
            infiniteGrid: !0,
            followCamera: !0,
            fadeDistance: 1e3,
            cellSize: 10,
            sectionSize: 50,
            sectionColor: new Ms("#6f6f6f"),
            side: Ls
          }
        ),
        (f == null ? void 0 : f.gizmo) !== !1 && /* @__PURE__ */ Le(Us, { alignment: "top-right", margin: [80, 80], children: /* @__PURE__ */ Le(js, { axisColors: ["#9d4b4b", "#2f7f4f", "#3b5b9d"], labelColor: "white" }) }),
        /* @__PURE__ */ Ht("group", { ref: ne, children: [
          R.map((fe) => {
            const we = fe.file.id, V = we !== void 0 ? g[we] : void 0, se = we !== void 0 ? S[we] : void 0;
            return /* @__PURE__ */ Le(
              _p,
              {
                file: fe.file,
                meta: fe.meta,
                referencePoint: I,
                selected: we === p,
                translation: (V == null ? void 0 : V.translation) ?? { x: 0, y: 0, z: 0 },
                rotation: (V == null ? void 0 : V.rotation) ?? { x: 0, y: 0, z: 0 },
                inspectorPointSize: se == null ? void 0 : se.pointSize,
                inspectorOpacity: se == null ? void 0 : se.opacity,
                inspectorCoordinateSystem: se == null ? void 0 : se.coordinateSystem,
                onMemoryEstimateChange: F ? ht : void 0
              },
              we
            );
          }),
          (f == null ? void 0 : f.referencePointAxis) !== !1 && /* @__PURE__ */ Le(wp, { length: 10, width: 0.2, visible: !0 }),
          /* @__PURE__ */ Le("group", { position: I, children: s }),
          /* @__PURE__ */ Le("group", { children: h }),
          (m || d) && /* @__PURE__ */ Le(
            Sp,
            {
              views: R,
              referencePoint: I,
              onContractFileClick: m,
              onObjectClick: d,
              clickEnabled: k
            }
          ),
          _ && /* @__PURE__ */ Le(Ap, { views: R, referencePoint: I, onObjectHover: _ })
        ] })
      ] }),
      /* @__PURE__ */ Le(
        Fr,
        {
          component: "div",
          sx: {
            position: "absolute",
            bottom: 10,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center"
          },
          children: /* @__PURE__ */ Le(Ep, { point: I })
        }
      )
    ] }),
    u
  ] });
}, Vp = (e) => /* @__PURE__ */ Le(gl, { children: /* @__PURE__ */ Le(vl, { children: /* @__PURE__ */ Le(Sl, { children: /* @__PURE__ */ Le(kp, { ...e }) }) }) }), Cp = {}, Kp = (e = Cp) => {
  const { client: t, project: r } = Tn(), { containers: i, toggleVisibility: n } = Si(), { focusFileById: o } = ua(), a = st(() => {
    const s = i.map((p) => ({
      type: "container",
      container: p
    })), u = new Set(i.map((p) => p.file.id)), c = Object.entries(e).filter(([p]) => !u.has(Number(p))).map(([p, m]) => ({
      type: "pending",
      contractFileId: Number(p),
      name: m.name
    }));
    return [...s, ...c];
  }, [i, e]), l = Ze(
    async (s) => {
      const u = s == null ? void 0 : s.id;
      return u === void 0 ? !1 : o(u);
    },
    [o]
  ), f = Ze(
    async (s) => {
      if (r === void 0 || t === void 0) return !1;
      const u = s == null ? void 0 : s.id;
      if (u === void 0) return !1;
      try {
        const c = await t.getContractFileDownloadUrl(r.contractId, u), p = c == null ? void 0 : c.presignedURL;
        return p ? (window.open(p, "_blank", "noopener,noreferrer"), !0) : !1;
      } catch (c) {
        return console.error("[useContractFileActions] ダウンロードURLの取得に失敗しました:", c), !1;
      }
    },
    [t, r]
  ), h = Ze(
    (s) => {
      if (!s) return { upload: "uploading", pclod: "waiting" };
      const u = s.id !== void 0 && e[s.id] !== void 0;
      return El(s, u);
    },
    [e]
  );
  return st(
    () => ({
      rows: a,
      toggleVisibility: n,
      focusFile: l,
      downloadFile: f,
      getFileStatus: h,
      isPclodCompleted: pn
    }),
    [a, n, l, f, h]
  );
};
class Nr {
  constructor(t, r, i, n, o) {
    this.x = t, this.y = r, this.w = i, this.h = n, this.data = o;
  }
  contains(t) {
    return t.x >= this.x && t.x <= this.x + this.w && t.y >= this.y && t.y <= this.y + this.h;
  }
  intersects(t) {
    return !(t.x > this.x + this.w || t.x + t.w < this.x || t.y > this.y + this.h || t.y + t.h < this.y);
  }
}
class Op {
  constructor(t, r, i, n) {
    this.x = t, this.y = r, this.r = i, this.rPow2 = this.r * this.r, this.data = n;
  }
  euclideanDistancePow2(t, r) {
    return Math.pow(t.x - r.x, 2) + Math.pow(t.y - r.y, 2);
  }
  contains(t) {
    return this.euclideanDistancePow2(t, this) <= this.rPow2;
  }
  intersects(t) {
    const r = this.x - Math.max(t.x, Math.min(this.x, t.x + t.w)), i = this.y - Math.max(t.y, Math.min(this.y, t.y + t.h));
    return r * r + i * i <= this.rPow2;
  }
}
class Pp {
  constructor(t, r, i) {
    this.x = t, this.y = r, this.data = i;
  }
}
const Ip = { capacity: 4, removeEmptyNodes: !1, maximumDepth: -1, arePointsEqual: (e, t) => e.x === t.x && e.y === t.y };
class gr {
  constructor(t, r, i = []) {
    this.container = t, this.config = Object.assign({}, Ip, r), this.isDivided = !1, this.points = [];
    for (const n of i) this.insertRecursive(n);
  }
  getTree() {
    let t;
    return t = this.isDivided ? { ne: this.ne.getTree(), nw: this.nw.getTree(), se: this.se.getTree(), sw: this.sw.getTree() } : this.getNodePointAmount(), t;
  }
  getAllPoints() {
    const t = [];
    return this.getAllPointsRecursive(t), t;
  }
  getAllPointsRecursive(t) {
    this.isDivided ? (this.ne.getAllPointsRecursive(t), this.nw.getAllPointsRecursive(t), this.se.getAllPointsRecursive(t), this.sw.getAllPointsRecursive(t)) : Array.prototype.push.apply(t, this.points.slice());
  }
  getNodePointAmount() {
    return this.points.length;
  }
  divide() {
    const t = this.config.maximumDepth === -1 ? -1 : this.config.maximumDepth - 1, r = Object.assign({}, this.config, { maximumDepth: t });
    this.isDivided = !0;
    const i = this.container.x, n = this.container.y, o = this.container.w / 2, a = this.container.h / 2;
    this.ne = new gr(new Nr(i + o, n, o, a), r), this.nw = new gr(new Nr(i, n, o, a), r), this.se = new gr(new Nr(i + o, n + a, o, a), r), this.sw = new gr(new Nr(i, n + a, o, a), r), this.insert(this.points.slice()), this.points.length = 0, this.points = [];
  }
  remove(t) {
    if (Array.isArray(t)) for (const r of t) this.removeRecursive(r);
    else this.removeRecursive(t);
  }
  removeRecursive(t) {
    if (this.container.contains(t)) if (this.isDivided) this.ne.removeRecursive(t), this.nw.removeRecursive(t), this.se.removeRecursive(t), this.sw.removeRecursive(t), this.config.removeEmptyNodes && (this.ne.getNodePointAmount() !== 0 || this.ne.isDivided || this.nw.getNodePointAmount() !== 0 || this.nw.isDivided || this.se.getNodePointAmount() !== 0 || this.se.isDivided || this.sw.getNodePointAmount() !== 0 || this.sw.isDivided || (this.isDivided = !1, delete this.ne, delete this.nw, delete this.se, delete this.sw));
    else
      for (let r = this.points.length - 1; r >= 0; r--) this.config.arePointsEqual(t, this.points[r]) && this.points.splice(r, 1);
  }
  insert(t) {
    if (Array.isArray(t)) {
      let r = !0;
      for (const i of t) r = r && this.insertRecursive(i);
      return r;
    }
    return this.insertRecursive(t);
  }
  insertRecursive(t) {
    if (!this.container.contains(t)) return !1;
    if (!this.isDivided) {
      if (this.getNodePointAmount() < this.config.capacity || this.config.maximumDepth === 0) return this.points.push(t), !0;
      (this.config.maximumDepth === -1 || this.config.maximumDepth > 0) && this.divide();
    }
    return !!this.isDivided && (this.ne.insertRecursive(t) || this.nw.insertRecursive(t) || this.se.insertRecursive(t) || this.sw.insertRecursive(t));
  }
  query(t) {
    const r = [];
    return this.queryRecursive(t, r), r;
  }
  queryRecursive(t, r) {
    if (t.intersects(this.container)) if (this.isDivided) this.ne.queryRecursive(t, r), this.nw.queryRecursive(t, r), this.se.queryRecursive(t, r), this.sw.queryRecursive(t, r);
    else {
      const i = this.points.filter(((n) => t.contains(n)));
      Array.prototype.push.apply(r, i);
    }
  }
  clear() {
    this.points = [], this.isDivided = !1, delete this.ne, delete this.nw, delete this.se, delete this.sw;
  }
}
const Xo = (e) => {
  const { points: t, camera: r } = e, i = new gr(new Nr(-1, -1, 2, 2)), n = /* @__PURE__ */ new Map(), o = 1e4;
  return t.forEach((a, l) => {
    const f = a.clone().project(r), h = Math.round(f.x * o) / o, s = Math.round(f.y * o) / o;
    if (h < -1 || h > 1 || s < -1 || s > 1)
      return;
    const u = `${h},${s}`;
    if (!n.has(u)) {
      const c = new Pp(h, s, { id: l });
      n.set(u, c), i.insert(c);
    }
  }), {
    tree: i
  };
}, Lp = (e, t, r) => {
  const i = t.query(new Op(e.x, e.y, 0.05));
  if (i.length > 0) {
    const n = Mp(e, i), { id: o } = n.data;
    return r[o].clone();
  }
}, Mp = (e, t) => {
  const r = t.map((n) => {
    const o = e.x - n.x, a = e.y - n.y;
    return o * o + a * a;
  }), i = Math.min(...r);
  return t[r.indexOf(i)];
}, Np = 180 / Math.PI, Bp = (e, t, r) => {
  const { width: i, height: n } = e.getBoundingClientRect(), o = r.clone().project(t);
  return new nt(
    (o.x + 1) / 2 * i,
    -(o.y - 1) / 2 * n,
    0
  );
}, Fp = ({ points: e, referencePoint: t, edit: r }) => {
  const { camera: i } = $r(), [n, o] = vt(null), [a, l] = vt([]), [f, h] = vt([]), s = Ce(new ra()), u = Ce(0), c = Ce(""), p = st(() => e !== void 0 ? e : [], [e]), m = st(() => t !== void 0 ? t : new nt(), [t]), d = Ze(
    (_) => {
      const v = p.map((T) => T.clone().add(m));
      if (n === null || v.length < 1) return [];
      const k = v.map((T) => Bp(n, _, T));
      r && l(k);
      const E = Array.from(Array(k.length - 1).keys()).map((T) => {
        const x = v[T], A = v[T + 1], I = x.distanceTo(A);
        return {
          from: k[T],
          to: k[T + 1],
          length: I
        };
      });
      h(E);
    },
    [n, r, m, p]
  );
  return et(() => {
    n !== null && p.length > 0 && d(i);
  }, [p, n, i, d]), na(({ camera: _ }) => {
    const v = u.current !== p.length, k = p.map(
      (T) => `${T.x.toFixed(3)},${T.y.toFixed(3)},${T.z.toFixed(3)}`
    ).join("|"), E = c.current !== k;
    (!s.current.equals(_.matrixWorld) || v || E) && n !== null && (s.current.copy(_.matrixWorld), u.current = p.length, c.current = k, d(_));
  }), /* @__PURE__ */ Ht(
    zs,
    {
      as: "div",
      ref: o,
      fullscreen: !0,
      style: {
        pointerEvents: "none",
        userSelect: "none"
      },
      zIndexRange: [0, 100],
      children: [
        a.map((_, v) => /* @__PURE__ */ Le(Dp, { position: _, color: "white" }, `metrics-point-${v}`)),
        f.map((_, v) => /* @__PURE__ */ Le(Up, { ..._ }, `metrics-line-${v}`))
      ]
    }
  );
}, Dp = ({ position: e, color: t }) => /* @__PURE__ */ Le(
  "div",
  {
    style: {
      position: "absolute",
      left: "0px",
      right: "0px",
      top: "0px",
      bottom: "0px",
      pointerEvents: "none",
      overflow: "hidden"
    },
    children: /* @__PURE__ */ Le("svg", { width: "100%", height: "100%", children: /* @__PURE__ */ Le("circle", { cx: e.x, cy: e.y, r: 5, fill: t, stroke: "black" }) })
  }
), Up = ({ from: e, to: t, length: r }) => {
  const i = st(() => {
    const n = t.clone().sub(e), o = n.length(), a = new nt(n.y, -n.x, 0), l = n.clone().normalize(), f = Math.PI * 0.15, h = Math.min(o * 0.25, 10), s = l.clone().applyAxisAngle(new nt(0, 0, 1), f).setLength(h), u = l.clone().applyAxisAngle(new nt(0, 0, 1), -f).setLength(h), c = t.clone(), p = c.clone().add(s.clone().negate()), m = c.clone().add(u.clone().negate()), d = e.clone(), _ = d.clone().add(s), v = d.clone().add(u), k = a.clone().setLength(10), E = e.clone().add(t).multiplyScalar(0.5).add(k), x = new ea(l.x, l.y).negate().angle() * Np;
    return {
      head: c,
      tail: d,
      headLeft: p,
      headRight: m,
      tailLeft: _,
      tailRight: v,
      angle: x,
      labelPosition: E
    };
  }, [e, t]);
  return /* @__PURE__ */ Ht(
    "div",
    {
      style: {
        position: "absolute",
        left: "0px",
        right: "0px",
        top: "0px",
        bottom: "0px",
        pointerEvents: "none",
        overflow: "hidden"
      },
      children: [
        /* @__PURE__ */ Le("svg", { width: "100%", height: "100%", children: /* @__PURE__ */ Ht(
          "g",
          {
            style: {
              stroke: "black",
              strokeWidth: 2
            },
            children: [
              /* @__PURE__ */ Le("line", { x1: i.head.x, y1: i.head.y, x2: i.tail.x, y2: i.tail.y }),
              /* @__PURE__ */ Le("line", { x1: i.head.x, y1: i.head.y, x2: i.headLeft.x, y2: i.headLeft.y }),
              /* @__PURE__ */ Le("line", { x1: i.head.x, y1: i.head.y, x2: i.headRight.x, y2: i.headRight.y }),
              /* @__PURE__ */ Le("line", { x1: i.tail.x, y1: i.tail.y, x2: i.tailLeft.x, y2: i.tailLeft.y }),
              /* @__PURE__ */ Le("line", { x1: i.tail.x, y1: i.tail.y, x2: i.tailRight.x, y2: i.tailRight.y })
            ]
          }
        ) }),
        /* @__PURE__ */ Ht(
          "span",
          {
            style: {
              position: "absolute",
              left: `${i.labelPosition.x}px`,
              top: `${i.labelPosition.y}px`,
              transform: `translate(-50%, -50%) rotate(${i.angle}deg)`,
              color: "black",
              fontSize: "14px",
              fontWeight: "bold"
            },
            children: [
              r.toFixed(2),
              "m"
            ]
          }
        )
      ]
    }
  );
}, Jo = (e, t = 10) => {
  const r = [];
  return e.traverse((i) => {
    if (i instanceof Bs || i.type === "Points" || i.type === "points") {
      const o = i.geometry.getAttribute("position");
      if (o)
        for (let a = 0; a < o.count; a += t) {
          const l = new nt(o.getX(a), o.getY(a), o.getZ(a));
          l.applyMatrix4(i.matrixWorld), r.push(l);
        }
    }
  }), r;
}, qp = ({
  onChange: e,
  externalAppEditedPoints: t,
  isActive: r
}) => {
  const i = Ce(null), [n, o] = vt(null), [a, l] = vt([]), f = r ?? !0, h = Ce(a), s = Ce(l), u = Ce(e);
  Sn(() => {
    h.current = a, s.current = l, u.current = e;
  });
  const c = Ce(null), p = Ce(null), m = Ce([]), d = Ce(new ra()), { camera: _, gl: v, scene: k } = $r(), E = v.domElement, T = Bi({ canvas: E }), x = st(() => t && t.length > 0 ? t : n !== null ? [...a, n] : [...a], [t, a, n]);
  na(() => {
    if (f && !d.current.equals(_.matrixWorld)) {
      d.current.copy(_.matrixWorld);
      const I = Jo(k);
      if (I.length > 0) {
        m.current = I;
        const R = Xo({ camera: _, points: I });
        p.current = R.tree;
      }
    }
  }), et(() => {
    if (!f) return;
    const I = setTimeout(() => {
      const R = Jo(k);
      if (R.length > 0) {
        m.current = R;
        const M = Xo({ camera: _, points: R });
        p.current = M.tree;
      }
    }, 500);
    return d.current.identity(), () => clearTimeout(I);
  }, [f, _, k]);
  const A = Ze((I) => !p.current || m.current.length === 0 ? void 0 : Lp(I, p.current, m.current), []);
  return et(() => {
    if (!f) return;
    const I = (j) => {
      var re;
      j.stopPropagation();
      const $ = i.current;
      if ($ !== null) {
        const U = [...h.current, $];
        s.current(U), (re = u.current) == null || re.call(u, U), i.current = null, U.length >= 2 && (c.current && clearTimeout(c.current), c.current = setTimeout(() => {
          c.current = null, s.current([]);
        }, 2e3));
      }
    }, R = (j) => {
      const $ = A(T(j));
      $ !== void 0 && (i.current = $, o($));
    }, M = (j) => {
      j.key === "Escape" && (s.current([]), o(null), i.current = null);
    }, b = (j) => {
      j.preventDefault(), j.stopPropagation(), s.current([]), o(null), i.current = null;
    }, N = (j) => {
      j[ks] = !0;
    };
    return E.addEventListener("mousedown", I, { capture: !0 }), E.addEventListener("click", N, { capture: !0 }), E.addEventListener("mousemove", R), window.addEventListener("keydown", M), E.addEventListener("contextmenu", b, { capture: !0 }), () => {
      c.current && (clearTimeout(c.current), c.current = null), E.removeEventListener("mousedown", I, { capture: !0 }), E.removeEventListener("click", N, { capture: !0 }), E.removeEventListener("mousemove", R), window.removeEventListener("keydown", M), E.removeEventListener("contextmenu", b, { capture: !0 });
    };
  }, [f, E, T, A]), f ? /* @__PURE__ */ Le(Fp, { edit: !0, points: x }) : null;
};
export {
  Pr as BATCH_PROCESSING_STATUS,
  gl as ClientProvider,
  _p as ContractFileView,
  vl as ContractFilesProvider,
  dr as CoordinateSystem,
  qp as MeasurementHandler,
  Fp as MeasurementView,
  Vp as RCDE,
  dl as RCDEClient,
  ks as RCDE_CLICK_HANDLED,
  wp as ReferencePointAxis,
  Sl as ReferencePointProvider,
  kp as Viewer,
  cd as ViewerBridge,
  El as deriveFileStatus,
  Gs as isBatchProcessingStatus,
  Yp as isFileStatusActive,
  pn as isPclodCompleted,
  Tn as useClient,
  Kp as useContractFileActions,
  Si as useContractFiles,
  ua as useReferencePoint
};
