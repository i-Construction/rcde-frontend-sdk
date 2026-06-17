"use client";
var Kn = Object.defineProperty;
var Jn = (n, r, t) => r in n ? Kn(n, r, { enumerable: !0, configurable: !0, writable: !0, value: t }) : n[r] = t;
var Be = (n, r, t) => Jn(n, typeof r != "symbol" ? r + "" : r, t);
import { jsx as yt, jsxs as Gt, Fragment as ln } from "react/jsx-runtime";
import { useState as zt, useCallback as Bt, useContext as qe, createContext as We, useMemo as Ut, useRef as se, useEffect as ie } from "react";
import { Vector3 as Lt, Box3 as xe, Color as fn, Euler as Qn, DoubleSide as ti, Quaternion as cn, Raycaster as ei, Vector2 as Fe, Matrix4 as un, Points as ri, Plane as qr } from "three";
import { createActorContext as ni } from "@xstate/react";
import { createMachine as ii } from "xstate";
import { Modal as oi, Box as fe, FormControl as Lr, FormLabel as hn, TextField as er, Typography as Ue, Button as rr, FormHelperText as ai, MenuList as Pr, MenuItem as dn, ListItemIcon as si, ListItemText as li, ListItem as Ar, Tooltip as lr, IconButton as fr, Menu as fi, List as ci } from "@mui/material";
import { Box as ui, Points as hi, MapControls as di, Grid as pi, GizmoHelper as bi, GizmoViewport as yi, Html as gi, PivotControls as mi, Line as cr } from "@react-three/drei";
import { useFrame as Rr, Canvas as _i, useThree as Or } from "@react-three/fiber";
import { PNG as Wr } from "pngjs/browser";
import { Add as wi, InsertDriveFile as vi, Adjust as Ei, Visibility as Ai, VisibilityOff as Si, CenterFocusStrong as xi, MoreHoriz as ki, Save as Li, Close as Pi } from "@mui/icons-material";
class Ri {
  constructor(r = {}) {
    Be(this, "baseUrl");
    Be(this, "token");
    Be(this, "authType");
    Be(this, "fetchImpl");
    this.baseUrl = r.baseUrl ?? "", this.token = r.accessToken, this.authType = r.authType ?? "2legged", this.fetchImpl = r.fetchImpl ?? fetch.bind(globalThis);
  }
  headers() {
    const r = { "Content-Type": "application/json" };
    return this.token && (r.Authorization = `Bearer ${this.token}`), r;
  }
  getApiPath(r) {
    const t = this.authType === "3legged" ? "/ext/v2/userAuthenticated" : "/ext/v2/authenticated";
    return `${this.baseUrl}${t}${r}`;
  }
  // ---- 既存で使われている想定のAPI ----
  // Viewer などで使用
  async getContractFileList(r) {
    const { contractId: t } = r, a = this.getApiPath("/contractFile"), e = new URLSearchParams({ contractId: String(t) }), i = await this.fetchImpl(`${a}?${e}`, {
      headers: this.headers()
    });
    if (!i.ok) throw new Error(`HTTP ${i.status}`);
    return { contractFiles: (await i.json()).contractFiles ?? [] };
  }
  async getContractFileMetadata(r) {
    const { contractId: t, contractFileId: a } = r, e = this.getApiPath("/pclod/meta"), i = new URLSearchParams({
      contractFileId: String(a)
    });
    this.authType === "2legged" && i.append("contractId", String(t));
    const o = await this.fetchImpl(`${e}?${i}`, {
      headers: this.headers()
    });
    if (!o.ok) throw new Error(`HTTP ${o.status}`);
    return await o.json();
  }
  // 画像（位置）バッファ
  async getContractFileImagePosition(r) {
    const { contractId: t, contractFileId: a, level: e = 0, addr: i = "0-0-0" } = r, o = this.getApiPath("/pclod/imagePosition"), u = new URLSearchParams({
      contractFileId: String(a),
      level: String(e),
      addr: i
    });
    this.authType === "2legged" && u.append("contractId", String(t));
    const h = await this.fetchImpl(`${o}?${u}`, {
      headers: this.headers()
    });
    if (!h.ok) throw new Error(`HTTP ${h.status}`);
    return await h.arrayBuffer();
  }
  // 画像（色）バッファ
  async getContractFileImageColor(r) {
    const { contractId: t, contractFileId: a, level: e = 0, addr: i = "0-0-0" } = r, o = this.getApiPath("/pclod/imageColor"), u = new URLSearchParams({
      contractFileId: String(a),
      level: String(e),
      addr: i
    });
    this.authType === "2legged" && u.append("contractId", String(t));
    const h = await this.fetchImpl(`${o}?${u}`, {
      headers: this.headers()
    });
    if (!h.ok) throw new Error(`HTTP ${h.status}`);
    return await h.arrayBuffer();
  }
  // ダウンロードURL
  async getContractFileDownloadUrl(r, t) {
    const a = this.getApiPath(`/contractFile/downloadURL/${t}`);
    let e = a;
    if (this.authType === "2legged") {
      const h = new URLSearchParams({ contractId: String(r) });
      e = `${a}?${h}`;
    }
    const i = await this.fetchImpl(e, {
      headers: this.headers()
    });
    if (!i.ok) throw new Error(`HTTP ${i.status}`);
    const o = await i.json(), u = o.presignedURL ?? o.url ?? "";
    return { url: u, presignedURL: u };
  }
  // アップロード開始（点群アップロードAPIを使用）
  async uploadContractFile(r) {
    const { contractId: t, name: a, buffer: e, pointCloudAttribute: i } = r, o = this.getApiPath("/contractFile/pointCloud"), u = {
      contractId: t,
      name: a,
      size: e.byteLength,
      pointCloudAttribute: i ?? {}
    }, h = await this.fetchImpl(o, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(u)
    });
    if (!h.ok) throw new Error(`HTTP ${h.status}`);
    const p = await h.json(), f = await this.fetchImpl(p.presignedURL, {
      method: "PUT",
      body: e
    });
    if (!f.ok) throw new Error(`Upload failed: HTTP ${f.status}`);
    const d = this.getApiPath(`/contractFile/uploaded/${p.contractFileId}`), s = await this.fetchImpl(d, {
      method: "PUT",
      headers: this.headers(),
      body: JSON.stringify({ contractId: t })
    });
    if (!s.ok) throw new Error(`Complete upload failed: HTTP ${s.status}`);
    return await s.json();
  }
  // Construction関連のAPI
  async getConstructionList() {
    const r = this.getApiPath("/construction"), t = await this.fetchImpl(r, {
      headers: this.headers()
    });
    if (!t.ok) throw new Error(`HTTP ${t.status}`);
    return { constructions: (await t.json()).constructions ?? [] };
  }
  async getConstruction(r) {
    const t = this.getApiPath(`/construction/${r}`), a = await this.fetchImpl(t, {
      headers: this.headers()
    });
    if (!a.ok) throw new Error(`HTTP ${a.status}`);
    return await a.json();
  }
  async createConstruction(r) {
    const t = this.getApiPath("/construction"), a = await this.fetchImpl(t, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(r)
    });
    if (!a.ok) throw new Error(`HTTP ${a.status}`);
    return await a.json();
  }
  // Contract関連のAPI
  async getContractList(r) {
    const { constructionId: t } = r, a = this.getApiPath("/contract"), e = new URLSearchParams();
    (this.authType === "2legged" || t) && e.append("constructionId", String(t));
    const i = e.toString() ? `${a}?${e}` : a, o = await this.fetchImpl(i, {
      headers: this.headers()
    });
    if (!o.ok) throw new Error(`HTTP ${o.status}`);
    return { contracts: (await o.json()).contracts ?? [] };
  }
  async createContract(r) {
    const { constructionId: t, name: a, contractedAt: e, status: i } = r, o = this.getApiPath("/contract"), u = {
      name: a,
      contractedAt: e,
      constructionId: t
    };
    i !== void 0 && (u.status = i);
    const h = await this.fetchImpl(o, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(u)
    });
    if (!h.ok) throw new Error(`HTTP ${h.status}`);
    return await h.json();
  }
}
const pn = We(void 0), Oi = ({ children: n }) => {
  const [r, t] = zt(), [a, e] = zt(), i = Bt(
    (o) => {
      const u = new Ri({
        accessToken: o.token,
        baseUrl: o.baseUrl,
        authType: o.authType
      });
      t(u);
    },
    []
  );
  return /* @__PURE__ */ yt(pn.Provider, { value: { client: r, initialize: i, project: a, setProject: e }, children: n });
}, Ge = () => {
  const n = qe(pn);
  if (!n)
    throw new Error("useClient must be used within a ClientProvider");
  return n;
}, bn = We(void 0), Ii = ({
  children: n
}) => {
  const [r, t] = zt([]), a = Bt((i, o) => {
    t(
      i.map((u) => ({
        file: u,
        visible: o === void 0 ? !0 : u.id !== void 0 && o.includes(u.id)
      }))
    );
  }, []), e = Bt((i) => {
    t(
      (o) => o.map(
        (u) => u.file.id === i.file.id ? {
          ...u,
          visible: !u.visible
        } : u
      )
    );
  }, []);
  return /* @__PURE__ */ yt(
    bn.Provider,
    {
      value: { load: a, toggleVisibility: e, containers: r },
      children: n
    }
  );
}, Ir = () => {
  const n = qe(bn);
  if (!n)
    throw new Error(
      "useContractFiles must be used within a ContractFilesProvider"
    );
  return n;
}, yn = We(void 0), Ci = ({ children: n }) => {
  const [r, t] = zt(new Lt(0, 0, 0)), { client: a, project: e } = Ge(), { containers: i } = Ir(), o = Bt((p) => {
    t(p);
  }, [t]), u = Bt((p) => {
    t(p);
  }, [t]), h = Bt(async (p) => {
    if (!(!a || !e || !i.find((d) => d.file.id === p)))
      try {
        const s = await a.getContractFileMetadata({
          ...e,
          contractFileId: p
        }), { min: g, max: m } = s.bounds, w = new xe(
          new Lt().fromArray(g),
          new Lt().fromArray(m)
        ).getCenter(new Lt());
        o(w.negate());
      } catch (d) {
        console.error("[useReferencePoint] Failed to focus file:", d);
      }
  }, [a, e, i, o]);
  return /* @__PURE__ */ yt(yn.Provider, { value: { point: r, change: o, save: u, focusFileById: h }, children: n });
}, Cr = () => {
  const n = qe(yn);
  if (!n)
    throw new Error("useReferencePoint must be used within a ReferencePointProvider");
  return n;
}, Mi = ii(
  {
    id: "root",
    initial: "idle",
    states: {
      idle: {},
      appearance: {},
      reference_point: {},
      metric: {
        initial: "idle",
        states: {
          idle: {},
          create: {},
          translate: {}
        }
      },
      modeling: {
        initial: "idle",
        states: {
          idle: {},
          sphere: {},
          cube: {}
        }
      },
      transform: {
        initial: "idle",
        states: {
          idle: {},
          position: {},
          rotation: {}
        }
      }
    },
    on: {
      IDLE: {
        target: ".idle"
      },
      APPEARANCE: {
        target: ".appearance"
      },
      REFERENCE_POINT: {
        target: ".reference_point"
      },
      CREATE_METRIC: {
        target: ".metric.create"
      },
      TRANSLATE_METRIC: {
        target: ".metric.translate"
      },
      MODELING_SPHERE: {
        target: ".modeling.sphere"
      },
      MODELING_CUBE: {
        target: ".modeling.cube"
      },
      TRANSFORM_POSITION: {
        target: ".transform.position"
      },
      TRANSFORM_ROTATION: {
        target: ".transform.rotation"
      }
    }
  },
  {
    actions: {}
  }
), ze = ni(Mi), { min: Ti, max: Ni } = Math, ke = (n, r = 0, t = 1) => Ti(Ni(r, n), t), Mr = (n) => {
  n._clipped = !1, n._unclipped = n.slice(0);
  for (let r = 0; r <= 3; r++)
    r < 3 ? ((n[r] < 0 || n[r] > 255) && (n._clipped = !0), n[r] = ke(n[r], 0, 255)) : r === 3 && (n[r] = ke(n[r], 0, 1));
  return n;
}, gn = {};
for (let n of [
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
  gn[`[object ${n}]`] = n.toLowerCase();
function Mt(n) {
  return gn[Object.prototype.toString.call(n)] || "object";
}
const Ct = (n, r = null) => n.length >= 3 ? Array.prototype.slice.call(n) : Mt(n[0]) == "object" && r ? r.split("").filter((t) => n[0][t] !== void 0).map((t) => n[0][t]) : n[0].slice(0), Me = (n) => {
  if (n.length < 2) return null;
  const r = n.length - 1;
  return Mt(n[r]) == "string" ? n[r].toLowerCase() : null;
}, { PI: ar, min: mn, max: _n } = Math, ce = (n) => Math.round(n * 100) / 100, Sr = (n) => Math.round(n * 100) / 100, we = ar * 2, ur = ar / 3, Di = ar / 180, Bi = 180 / ar;
function wn(n) {
  return [...n.slice(0, 3).reverse(), ...n.slice(3)];
}
const Ot = {
  format: {},
  autodetect: []
};
class mt {
  constructor(...r) {
    const t = this;
    if (Mt(r[0]) === "object" && r[0].constructor && r[0].constructor === this.constructor)
      return r[0];
    let a = Me(r), e = !1;
    if (!a) {
      e = !0, Ot.sorted || (Ot.autodetect = Ot.autodetect.sort((i, o) => o.p - i.p), Ot.sorted = !0);
      for (let i of Ot.autodetect)
        if (a = i.test(...r), a) break;
    }
    if (Ot.format[a]) {
      const i = Ot.format[a].apply(
        null,
        e ? r : r.slice(0, -1)
      );
      t._rgb = Mr(i);
    } else
      throw new Error("unknown format: " + r);
    t._rgb.length === 3 && t._rgb.push(1);
  }
  toString() {
    return Mt(this.hex) == "function" ? this.hex() : `[${this._rgb.join(",")}]`;
  }
}
const ji = "3.2.0", Dt = (...n) => new mt(...n);
Dt.version = ji;
const Ie = {
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
}, Fi = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, Ui = /^#?([A-Fa-f0-9]{8}|[A-Fa-f0-9]{4})$/, vn = (n) => {
  if (n.match(Fi)) {
    (n.length === 4 || n.length === 7) && (n = n.substr(1)), n.length === 3 && (n = n.split(""), n = n[0] + n[0] + n[1] + n[1] + n[2] + n[2]);
    const r = parseInt(n, 16), t = r >> 16, a = r >> 8 & 255, e = r & 255;
    return [t, a, e, 1];
  }
  if (n.match(Ui)) {
    (n.length === 5 || n.length === 9) && (n = n.substr(1)), n.length === 4 && (n = n.split(""), n = n[0] + n[0] + n[1] + n[1] + n[2] + n[2] + n[3] + n[3]);
    const r = parseInt(n, 16), t = r >> 24 & 255, a = r >> 16 & 255, e = r >> 8 & 255, i = Math.round((r & 255) / 255 * 100) / 100;
    return [t, a, e, i];
  }
  throw new Error(`unknown hex color: ${n}`);
}, { round: Ye } = Math, En = (...n) => {
  let [r, t, a, e] = Ct(n, "rgba"), i = Me(n) || "auto";
  e === void 0 && (e = 1), i === "auto" && (i = e < 1 ? "rgba" : "rgb"), r = Ye(r), t = Ye(t), a = Ye(a);
  let u = "000000" + (r << 16 | t << 8 | a).toString(16);
  u = u.substr(u.length - 6);
  let h = "0" + Ye(e * 255).toString(16);
  switch (h = h.substr(h.length - 2), i.toLowerCase()) {
    case "rgba":
      return `#${u}${h}`;
    case "argb":
      return `#${h}${u}`;
    default:
      return `#${u}`;
  }
};
mt.prototype.name = function() {
  const n = En(this._rgb, "rgb");
  for (let r of Object.keys(Ie))
    if (Ie[r] === n) return r.toLowerCase();
  return n;
};
Ot.format.named = (n) => {
  if (n = n.toLowerCase(), Ie[n]) return vn(Ie[n]);
  throw new Error("unknown color name: " + n);
};
Ot.autodetect.push({
  p: 5,
  test: (n, ...r) => {
    if (!r.length && Mt(n) === "string" && Ie[n.toLowerCase()])
      return "named";
  }
});
mt.prototype.alpha = function(n, r = !1) {
  return n !== void 0 && Mt(n) === "number" ? r ? (this._rgb[3] = n, this) : new mt([this._rgb[0], this._rgb[1], this._rgb[2], n], "rgb") : this._rgb[3];
};
mt.prototype.clipped = function() {
  return this._rgb._clipped || !1;
};
const ye = {
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
}, zi = /* @__PURE__ */ new Map([
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
function ve(n) {
  const r = zi.get(String(n).toLowerCase());
  if (!r)
    throw new Error("unknown Lab illuminant " + n);
  ye.labWhitePoint = n, ye.Xn = r[0], ye.Zn = r[1];
}
function Ze() {
  return ye.labWhitePoint;
}
const Tr = (...n) => {
  n = Ct(n, "lab");
  const [r, t, a] = n, [e, i, o] = Zi(r, t, a), [u, h, p] = An(e, i, o);
  return [u, h, p, n.length > 3 ? n[3] : 1];
}, Zi = (n, r, t) => {
  const { kE: a, kK: e, kKE: i, Xn: o, Yn: u, Zn: h } = ye, p = (n + 16) / 116, f = 2e-3 * r + p, d = p - 5e-3 * t, s = f * f * f, g = d * d * d, m = s > a ? s : (116 * f - 16) / e, b = n > i ? Math.pow((n + 16) / 116, 3) : n / e, w = g > a ? g : (116 * d - 16) / e, _ = m * o, S = b * u, k = w * h;
  return [_, S, k];
}, hr = (n) => {
  const r = Math.sign(n);
  return n = Math.abs(n), (n <= 31308e-7 ? n * 12.92 : 1.055 * Math.pow(n, 1 / 2.4) - 0.055) * r;
}, An = (n, r, t) => {
  const { MtxAdaptMa: a, MtxAdaptMaI: e, MtxXYZ2RGB: i, RefWhiteRGB: o, Xn: u, Yn: h, Zn: p } = ye, f = u * a.m00 + h * a.m10 + p * a.m20, d = u * a.m01 + h * a.m11 + p * a.m21, s = u * a.m02 + h * a.m12 + p * a.m22, g = o.X * a.m00 + o.Y * a.m10 + o.Z * a.m20, m = o.X * a.m01 + o.Y * a.m11 + o.Z * a.m21, b = o.X * a.m02 + o.Y * a.m12 + o.Z * a.m22, w = (n * a.m00 + r * a.m10 + t * a.m20) * (g / f), _ = (n * a.m01 + r * a.m11 + t * a.m21) * (m / d), S = (n * a.m02 + r * a.m12 + t * a.m22) * (b / s), k = w * e.m00 + _ * e.m10 + S * e.m20, C = w * e.m01 + _ * e.m11 + S * e.m21, j = w * e.m02 + _ * e.m12 + S * e.m22, O = hr(
    k * i.m00 + C * i.m10 + j * i.m20
  ), I = hr(
    k * i.m01 + C * i.m11 + j * i.m21
  ), P = hr(
    k * i.m02 + C * i.m12 + j * i.m22
  );
  return [O * 255, I * 255, P * 255];
}, Nr = (...n) => {
  const [r, t, a, ...e] = Ct(n, "rgb"), [i, o, u] = Sn(r, t, a), [h, p, f] = qi(i, o, u);
  return [h, p, f, ...e.length > 0 && e[0] < 1 ? [e[0]] : []];
};
function qi(n, r, t) {
  const { Xn: a, Yn: e, Zn: i, kE: o, kK: u } = ye, h = n / a, p = r / e, f = t / i, d = h > o ? Math.pow(h, 1 / 3) : (u * h + 16) / 116, s = p > o ? Math.pow(p, 1 / 3) : (u * p + 16) / 116, g = f > o ? Math.pow(f, 1 / 3) : (u * f + 16) / 116;
  return [116 * s - 16, 500 * (d - s), 200 * (s - g)];
}
function dr(n) {
  const r = Math.sign(n);
  return n = Math.abs(n), (n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4)) * r;
}
const Sn = (n, r, t) => {
  n = dr(n / 255), r = dr(r / 255), t = dr(t / 255);
  const { MtxRGB2XYZ: a, MtxAdaptMa: e, MtxAdaptMaI: i, Xn: o, Yn: u, Zn: h, As: p, Bs: f, Cs: d } = ye;
  let s = n * a.m00 + r * a.m10 + t * a.m20, g = n * a.m01 + r * a.m11 + t * a.m21, m = n * a.m02 + r * a.m12 + t * a.m22;
  const b = o * e.m00 + u * e.m10 + h * e.m20, w = o * e.m01 + u * e.m11 + h * e.m21, _ = o * e.m02 + u * e.m12 + h * e.m22;
  let S = s * e.m00 + g * e.m10 + m * e.m20, k = s * e.m01 + g * e.m11 + m * e.m21, C = s * e.m02 + g * e.m12 + m * e.m22;
  return S *= b / p, k *= w / f, C *= _ / d, s = S * i.m00 + k * i.m10 + C * i.m20, g = S * i.m01 + k * i.m11 + C * i.m21, m = S * i.m02 + k * i.m12 + C * i.m22, [s, g, m];
};
mt.prototype.lab = function() {
  return Nr(this._rgb);
};
const Wi = (...n) => new mt(...n, "lab");
Object.assign(Dt, { lab: Wi, getLabWhitePoint: Ze, setLabWhitePoint: ve });
Ot.format.lab = Tr;
Ot.autodetect.push({
  p: 2,
  test: (...n) => {
    if (n = Ct(n, "lab"), Mt(n) === "array" && n.length === 3)
      return "lab";
  }
});
mt.prototype.darken = function(n = 1) {
  const r = this, t = r.lab();
  return t[0] -= ye.Kn * n, new mt(t, "lab").alpha(r.alpha(), !0);
};
mt.prototype.brighten = function(n = 1) {
  return this.darken(-n);
};
mt.prototype.darker = mt.prototype.darken;
mt.prototype.brighter = mt.prototype.brighten;
mt.prototype.get = function(n) {
  const [r, t] = n.split("."), a = this[r]();
  if (t) {
    const e = r.indexOf(t) - (r.substr(0, 2) === "ok" ? 2 : 0);
    if (e > -1) return a[e];
    throw new Error(`unknown channel ${t} in mode ${r}`);
  } else
    return a;
};
const { pow: Gi } = Math, Hi = 1e-7, Vi = 20;
mt.prototype.luminance = function(n, r = "rgb") {
  if (n !== void 0 && Mt(n) === "number") {
    if (n === 0)
      return new mt([0, 0, 0, this._rgb[3]], "rgb");
    if (n === 1)
      return new mt([255, 255, 255, this._rgb[3]], "rgb");
    let t = this.luminance(), a = Vi;
    const e = (o, u) => {
      const h = o.interpolate(u, 0.5, r), p = h.luminance();
      return Math.abs(n - p) < Hi || !a-- ? h : p > n ? e(o, h) : e(h, u);
    }, i = (t > n ? e(new mt([0, 0, 0]), this) : e(this, new mt([255, 255, 255]))).rgb();
    return new mt([...i, this._rgb[3]]);
  }
  return Yi(...this._rgb.slice(0, 3));
};
const Yi = (n, r, t) => (n = pr(n), r = pr(r), t = pr(t), 0.2126 * n + 0.7152 * r + 0.0722 * t), pr = (n) => (n /= 255, n <= 0.03928 ? n / 12.92 : Gi((n + 0.055) / 1.055, 2.4)), re = {}, Ce = (n, r, t = 0.5, ...a) => {
  let e = a[0] || "lrgb";
  if (!re[e] && !a.length && (e = Object.keys(re)[0]), !re[e])
    throw new Error(`interpolation mode ${e} is not defined`);
  return Mt(n) !== "object" && (n = new mt(n)), Mt(r) !== "object" && (r = new mt(r)), re[e](n, r, t).alpha(
    n.alpha() + t * (r.alpha() - n.alpha())
  );
};
mt.prototype.mix = mt.prototype.interpolate = function(n, r = 0.5, ...t) {
  return Ce(this, n, r, ...t);
};
mt.prototype.premultiply = function(n = !1) {
  const r = this._rgb, t = r[3];
  return n ? (this._rgb = [r[0] * t, r[1] * t, r[2] * t, t], this) : new mt([r[0] * t, r[1] * t, r[2] * t, t], "rgb");
};
const { sin: Xi, cos: $i } = Math, xn = (...n) => {
  let [r, t, a] = Ct(n, "lch");
  return isNaN(a) && (a = 0), a = a * Di, [r, $i(a) * t, Xi(a) * t];
}, Dr = (...n) => {
  n = Ct(n, "lch");
  const [r, t, a] = n, [e, i, o] = xn(r, t, a), [u, h, p] = Tr(e, i, o);
  return [u, h, p, n.length > 3 ? n[3] : 1];
}, Ki = (...n) => {
  const r = wn(Ct(n, "hcl"));
  return Dr(...r);
}, { sqrt: Ji, atan2: Qi, round: to } = Math, kn = (...n) => {
  const [r, t, a] = Ct(n, "lab"), e = Ji(t * t + a * a);
  let i = (Qi(a, t) * Bi + 360) % 360;
  return to(e * 1e4) === 0 && (i = Number.NaN), [r, e, i];
}, Br = (...n) => {
  const [r, t, a, ...e] = Ct(n, "rgb"), [i, o, u] = Nr(r, t, a), [h, p, f] = kn(i, o, u);
  return [h, p, f, ...e.length > 0 && e[0] < 1 ? [e[0]] : []];
};
mt.prototype.lch = function() {
  return Br(this._rgb);
};
mt.prototype.hcl = function() {
  return wn(Br(this._rgb));
};
const eo = (...n) => new mt(...n, "lch"), ro = (...n) => new mt(...n, "hcl");
Object.assign(Dt, { lch: eo, hcl: ro });
Ot.format.lch = Dr;
Ot.format.hcl = Ki;
["lch", "hcl"].forEach(
  (n) => Ot.autodetect.push({
    p: 2,
    test: (...r) => {
      if (r = Ct(r, n), Mt(r) === "array" && r.length === 3)
        return n;
    }
  })
);
mt.prototype.saturate = function(n = 1) {
  const r = this, t = r.lch();
  return t[1] += ye.Kn * n, t[1] < 0 && (t[1] = 0), new mt(t, "lch").alpha(r.alpha(), !0);
};
mt.prototype.desaturate = function(n = 1) {
  return this.saturate(-n);
};
mt.prototype.set = function(n, r, t = !1) {
  const [a, e] = n.split("."), i = this[a]();
  if (e) {
    const o = a.indexOf(e) - (a.substr(0, 2) === "ok" ? 2 : 0);
    if (o > -1) {
      if (Mt(r) == "string")
        switch (r.charAt(0)) {
          case "+":
            i[o] += +r;
            break;
          case "-":
            i[o] += +r;
            break;
          case "*":
            i[o] *= +r.substr(1);
            break;
          case "/":
            i[o] /= +r.substr(1);
            break;
          default:
            i[o] = +r;
        }
      else if (Mt(r) === "number")
        i[o] = r;
      else
        throw new Error("unsupported value for Color.set");
      const u = new mt(i, a);
      return t ? (this._rgb = u._rgb, this) : u;
    }
    throw new Error(`unknown channel ${e} in mode ${a}`);
  } else
    return i;
};
mt.prototype.tint = function(n = 0.5, ...r) {
  return Ce(this, "white", n, ...r);
};
mt.prototype.shade = function(n = 0.5, ...r) {
  return Ce(this, "black", n, ...r);
};
const no = (n, r, t) => {
  const a = n._rgb, e = r._rgb;
  return new mt(
    a[0] + t * (e[0] - a[0]),
    a[1] + t * (e[1] - a[1]),
    a[2] + t * (e[2] - a[2]),
    "rgb"
  );
};
re.rgb = no;
const { sqrt: br, pow: Le } = Math, io = (n, r, t) => {
  const [a, e, i] = n._rgb, [o, u, h] = r._rgb;
  return new mt(
    br(Le(a, 2) * (1 - t) + Le(o, 2) * t),
    br(Le(e, 2) * (1 - t) + Le(u, 2) * t),
    br(Le(i, 2) * (1 - t) + Le(h, 2) * t),
    "rgb"
  );
};
re.lrgb = io;
const oo = (n, r, t) => {
  const a = n.lab(), e = r.lab();
  return new mt(
    a[0] + t * (e[0] - a[0]),
    a[1] + t * (e[1] - a[1]),
    a[2] + t * (e[2] - a[2]),
    "lab"
  );
};
re.lab = oo;
const Te = (n, r, t, a) => {
  let e, i;
  a === "hsl" ? (e = n.hsl(), i = r.hsl()) : a === "hsv" ? (e = n.hsv(), i = r.hsv()) : a === "hcg" ? (e = n.hcg(), i = r.hcg()) : a === "hsi" ? (e = n.hsi(), i = r.hsi()) : a === "lch" || a === "hcl" ? (a = "hcl", e = n.hcl(), i = r.hcl()) : a === "oklch" && (e = n.oklch().reverse(), i = r.oklch().reverse());
  let o, u, h, p, f, d;
  (a.substr(0, 1) === "h" || a === "oklch") && ([o, h, f] = e, [u, p, d] = i);
  let s, g, m, b;
  return !isNaN(o) && !isNaN(u) ? (u > o && u - o > 180 ? b = u - (o + 360) : u < o && o - u > 180 ? b = u + 360 - o : b = u - o, g = o + t * b) : isNaN(o) ? isNaN(u) ? g = Number.NaN : (g = u, (f == 1 || f == 0) && a != "hsv" && (s = p)) : (g = o, (d == 1 || d == 0) && a != "hsv" && (s = h)), s === void 0 && (s = h + t * (p - h)), m = f + t * (d - f), a === "oklch" ? new mt([m, s, g], a) : new mt([g, s, m], a);
}, Ln = (n, r, t) => Te(n, r, t, "lch");
re.lch = Ln;
re.hcl = Ln;
const ao = (n) => {
  if (Mt(n) == "number" && n >= 0 && n <= 16777215) {
    const r = n >> 16, t = n >> 8 & 255, a = n & 255;
    return [r, t, a, 1];
  }
  throw new Error("unknown num color: " + n);
}, so = (...n) => {
  const [r, t, a] = Ct(n, "rgb");
  return (r << 16) + (t << 8) + a;
};
mt.prototype.num = function() {
  return so(this._rgb);
};
const lo = (...n) => new mt(...n, "num");
Object.assign(Dt, { num: lo });
Ot.format.num = ao;
Ot.autodetect.push({
  p: 5,
  test: (...n) => {
    if (n.length === 1 && Mt(n[0]) === "number" && n[0] >= 0 && n[0] <= 16777215)
      return "num";
  }
});
const fo = (n, r, t) => {
  const a = n.num(), e = r.num();
  return new mt(a + t * (e - a), "num");
};
re.num = fo;
const { floor: co } = Math, uo = (...n) => {
  n = Ct(n, "hcg");
  let [r, t, a] = n, e, i, o;
  a = a * 255;
  const u = t * 255;
  if (t === 0)
    e = i = o = a;
  else {
    r === 360 && (r = 0), r > 360 && (r -= 360), r < 0 && (r += 360), r /= 60;
    const h = co(r), p = r - h, f = a * (1 - t), d = f + u * (1 - p), s = f + u * p, g = f + u;
    switch (h) {
      case 0:
        [e, i, o] = [g, s, f];
        break;
      case 1:
        [e, i, o] = [d, g, f];
        break;
      case 2:
        [e, i, o] = [f, g, s];
        break;
      case 3:
        [e, i, o] = [f, d, g];
        break;
      case 4:
        [e, i, o] = [s, f, g];
        break;
      case 5:
        [e, i, o] = [g, f, d];
        break;
    }
  }
  return [e, i, o, n.length > 3 ? n[3] : 1];
}, ho = (...n) => {
  const [r, t, a] = Ct(n, "rgb"), e = mn(r, t, a), i = _n(r, t, a), o = i - e, u = o * 100 / 255, h = e / (255 - o) * 100;
  let p;
  return o === 0 ? p = Number.NaN : (r === i && (p = (t - a) / o), t === i && (p = 2 + (a - r) / o), a === i && (p = 4 + (r - t) / o), p *= 60, p < 0 && (p += 360)), [p, u, h];
};
mt.prototype.hcg = function() {
  return ho(this._rgb);
};
const po = (...n) => new mt(...n, "hcg");
Dt.hcg = po;
Ot.format.hcg = uo;
Ot.autodetect.push({
  p: 1,
  test: (...n) => {
    if (n = Ct(n, "hcg"), Mt(n) === "array" && n.length === 3)
      return "hcg";
  }
});
const bo = (n, r, t) => Te(n, r, t, "hcg");
re.hcg = bo;
const { cos: Pe } = Math, yo = (...n) => {
  n = Ct(n, "hsi");
  let [r, t, a] = n, e, i, o;
  return isNaN(r) && (r = 0), isNaN(t) && (t = 0), r > 360 && (r -= 360), r < 0 && (r += 360), r /= 360, r < 1 / 3 ? (o = (1 - t) / 3, e = (1 + t * Pe(we * r) / Pe(ur - we * r)) / 3, i = 1 - (o + e)) : r < 2 / 3 ? (r -= 1 / 3, e = (1 - t) / 3, i = (1 + t * Pe(we * r) / Pe(ur - we * r)) / 3, o = 1 - (e + i)) : (r -= 2 / 3, i = (1 - t) / 3, o = (1 + t * Pe(we * r) / Pe(ur - we * r)) / 3, e = 1 - (i + o)), e = ke(a * e * 3), i = ke(a * i * 3), o = ke(a * o * 3), [e * 255, i * 255, o * 255, n.length > 3 ? n[3] : 1];
}, { min: go, sqrt: mo, acos: _o } = Math, wo = (...n) => {
  let [r, t, a] = Ct(n, "rgb");
  r /= 255, t /= 255, a /= 255;
  let e;
  const i = go(r, t, a), o = (r + t + a) / 3, u = o > 0 ? 1 - i / o : 0;
  return u === 0 ? e = NaN : (e = (r - t + (r - a)) / 2, e /= mo((r - t) * (r - t) + (r - a) * (t - a)), e = _o(e), a > t && (e = we - e), e /= we), [e * 360, u, o];
};
mt.prototype.hsi = function() {
  return wo(this._rgb);
};
const vo = (...n) => new mt(...n, "hsi");
Dt.hsi = vo;
Ot.format.hsi = yo;
Ot.autodetect.push({
  p: 2,
  test: (...n) => {
    if (n = Ct(n, "hsi"), Mt(n) === "array" && n.length === 3)
      return "hsi";
  }
});
const Eo = (n, r, t) => Te(n, r, t, "hsi");
re.hsi = Eo;
const xr = (...n) => {
  n = Ct(n, "hsl");
  const [r, t, a] = n;
  let e, i, o;
  if (t === 0)
    e = i = o = a * 255;
  else {
    const u = [0, 0, 0], h = [0, 0, 0], p = a < 0.5 ? a * (1 + t) : a + t - a * t, f = 2 * a - p, d = r / 360;
    u[0] = d + 1 / 3, u[1] = d, u[2] = d - 1 / 3;
    for (let s = 0; s < 3; s++)
      u[s] < 0 && (u[s] += 1), u[s] > 1 && (u[s] -= 1), 6 * u[s] < 1 ? h[s] = f + (p - f) * 6 * u[s] : 2 * u[s] < 1 ? h[s] = p : 3 * u[s] < 2 ? h[s] = f + (p - f) * (2 / 3 - u[s]) * 6 : h[s] = f;
    [e, i, o] = [h[0] * 255, h[1] * 255, h[2] * 255];
  }
  return n.length > 3 ? [e, i, o, n[3]] : [e, i, o, 1];
}, Pn = (...n) => {
  n = Ct(n, "rgba");
  let [r, t, a] = n;
  r /= 255, t /= 255, a /= 255;
  const e = mn(r, t, a), i = _n(r, t, a), o = (i + e) / 2;
  let u, h;
  return i === e ? (u = 0, h = Number.NaN) : u = o < 0.5 ? (i - e) / (i + e) : (i - e) / (2 - i - e), r == i ? h = (t - a) / (i - e) : t == i ? h = 2 + (a - r) / (i - e) : a == i && (h = 4 + (r - t) / (i - e)), h *= 60, h < 0 && (h += 360), n.length > 3 && n[3] !== void 0 ? [h, u, o, n[3]] : [h, u, o];
};
mt.prototype.hsl = function() {
  return Pn(this._rgb);
};
const Ao = (...n) => new mt(...n, "hsl");
Dt.hsl = Ao;
Ot.format.hsl = xr;
Ot.autodetect.push({
  p: 2,
  test: (...n) => {
    if (n = Ct(n, "hsl"), Mt(n) === "array" && n.length === 3)
      return "hsl";
  }
});
const So = (n, r, t) => Te(n, r, t, "hsl");
re.hsl = So;
const { floor: xo } = Math, ko = (...n) => {
  n = Ct(n, "hsv");
  let [r, t, a] = n, e, i, o;
  if (a *= 255, t === 0)
    e = i = o = a;
  else {
    r === 360 && (r = 0), r > 360 && (r -= 360), r < 0 && (r += 360), r /= 60;
    const u = xo(r), h = r - u, p = a * (1 - t), f = a * (1 - t * h), d = a * (1 - t * (1 - h));
    switch (u) {
      case 0:
        [e, i, o] = [a, d, p];
        break;
      case 1:
        [e, i, o] = [f, a, p];
        break;
      case 2:
        [e, i, o] = [p, a, d];
        break;
      case 3:
        [e, i, o] = [p, f, a];
        break;
      case 4:
        [e, i, o] = [d, p, a];
        break;
      case 5:
        [e, i, o] = [a, p, f];
        break;
    }
  }
  return [e, i, o, n.length > 3 ? n[3] : 1];
}, { min: Lo, max: Po } = Math, Ro = (...n) => {
  n = Ct(n, "rgb");
  let [r, t, a] = n;
  const e = Lo(r, t, a), i = Po(r, t, a), o = i - e;
  let u, h, p;
  return p = i / 255, i === 0 ? (u = Number.NaN, h = 0) : (h = o / i, r === i && (u = (t - a) / o), t === i && (u = 2 + (a - r) / o), a === i && (u = 4 + (r - t) / o), u *= 60, u < 0 && (u += 360)), [u, h, p];
};
mt.prototype.hsv = function() {
  return Ro(this._rgb);
};
const Oo = (...n) => new mt(...n, "hsv");
Dt.hsv = Oo;
Ot.format.hsv = ko;
Ot.autodetect.push({
  p: 2,
  test: (...n) => {
    if (n = Ct(n, "hsv"), Mt(n) === "array" && n.length === 3)
      return "hsv";
  }
});
const Io = (n, r, t) => Te(n, r, t, "hsv");
re.hsv = Io;
function nr(n, r) {
  let t = n.length;
  Array.isArray(n[0]) || (n = [n]), Array.isArray(r[0]) || (r = r.map((o) => [o]));
  let a = r[0].length, e = r[0].map((o, u) => r.map((h) => h[u])), i = n.map(
    (o) => e.map((u) => Array.isArray(o) ? o.reduce((h, p, f) => h + p * (u[f] || 0), 0) : u.reduce((h, p) => h + p * o, 0))
  );
  return t === 1 && (i = i[0]), a === 1 ? i.map((o) => o[0]) : i;
}
const jr = (...n) => {
  n = Ct(n, "lab");
  const [r, t, a, ...e] = n, [i, o, u] = Co([r, t, a]), [h, p, f] = An(i, o, u);
  return [h, p, f, ...e.length > 0 && e[0] < 1 ? [e[0]] : []];
};
function Co(n) {
  var r = [
    [1.2268798758459243, -0.5578149944602171, 0.2813910456659647],
    [-0.0405757452148008, 1.112286803280317, -0.0717110580655164],
    [-0.0763729366746601, -0.4214933324022432, 1.5869240198367816]
  ], t = [
    [1, 0.3963377773761749, 0.2158037573099136],
    [1, -0.1055613458156586, -0.0638541728258133],
    [1, -0.0894841775298119, -1.2914855480194092]
  ], a = nr(t, n);
  return nr(
    r,
    a.map((e) => e ** 3)
  );
}
const Fr = (...n) => {
  const [r, t, a, ...e] = Ct(n, "rgb"), i = Sn(r, t, a);
  return [...Mo(i), ...e.length > 0 && e[0] < 1 ? [e[0]] : []];
};
function Mo(n) {
  const r = [
    [0.819022437996703, 0.3619062600528904, -0.1288737815209879],
    [0.0329836539323885, 0.9292868615863434, 0.0361446663506424],
    [0.0481771893596242, 0.2642395317527308, 0.6335478284694309]
  ], t = [
    [0.210454268309314, 0.7936177747023054, -0.0040720430116193],
    [1.9779985324311684, -2.42859224204858, 0.450593709617411],
    [0.0259040424655478, 0.7827717124575296, -0.8086757549230774]
  ], a = nr(r, n);
  return nr(
    t,
    a.map((e) => Math.cbrt(e))
  );
}
mt.prototype.oklab = function() {
  return Fr(this._rgb);
};
const To = (...n) => new mt(...n, "oklab");
Object.assign(Dt, { oklab: To });
Ot.format.oklab = jr;
Ot.autodetect.push({
  p: 2,
  test: (...n) => {
    if (n = Ct(n, "oklab"), Mt(n) === "array" && n.length === 3)
      return "oklab";
  }
});
const No = (n, r, t) => {
  const a = n.oklab(), e = r.oklab();
  return new mt(
    a[0] + t * (e[0] - a[0]),
    a[1] + t * (e[1] - a[1]),
    a[2] + t * (e[2] - a[2]),
    "oklab"
  );
};
re.oklab = No;
const Do = (n, r, t) => Te(n, r, t, "oklch");
re.oklch = Do;
const { pow: yr, sqrt: gr, PI: mr, cos: Gr, sin: Hr, atan2: Bo } = Math, jo = (n, r = "lrgb", t = null) => {
  const a = n.length;
  t || (t = Array.from(new Array(a)).map(() => 1));
  const e = a / t.reduce(function(d, s) {
    return d + s;
  });
  if (t.forEach((d, s) => {
    t[s] *= e;
  }), n = n.map((d) => new mt(d)), r === "lrgb")
    return Fo(n, t);
  const i = n.shift(), o = i.get(r), u = [];
  let h = 0, p = 0;
  for (let d = 0; d < o.length; d++)
    if (o[d] = (o[d] || 0) * t[0], u.push(isNaN(o[d]) ? 0 : t[0]), r.charAt(d) === "h" && !isNaN(o[d])) {
      const s = o[d] / 180 * mr;
      h += Gr(s) * t[0], p += Hr(s) * t[0];
    }
  let f = i.alpha() * t[0];
  n.forEach((d, s) => {
    const g = d.get(r);
    f += d.alpha() * t[s + 1];
    for (let m = 0; m < o.length; m++)
      if (!isNaN(g[m]))
        if (u[m] += t[s + 1], r.charAt(m) === "h") {
          const b = g[m] / 180 * mr;
          h += Gr(b) * t[s + 1], p += Hr(b) * t[s + 1];
        } else
          o[m] += g[m] * t[s + 1];
  });
  for (let d = 0; d < o.length; d++)
    if (r.charAt(d) === "h") {
      let s = Bo(p / u[d], h / u[d]) / mr * 180;
      for (; s < 0; ) s += 360;
      for (; s >= 360; ) s -= 360;
      o[d] = s;
    } else
      o[d] = o[d] / u[d];
  return f /= a, new mt(o, r).alpha(f > 0.99999 ? 1 : f, !0);
}, Fo = (n, r) => {
  const t = n.length, a = [0, 0, 0, 0];
  for (let e = 0; e < n.length; e++) {
    const i = n[e], o = r[e] / t, u = i._rgb;
    a[0] += yr(u[0], 2) * o, a[1] += yr(u[1], 2) * o, a[2] += yr(u[2], 2) * o, a[3] += u[3] * o;
  }
  return a[0] = gr(a[0]), a[1] = gr(a[1]), a[2] = gr(a[2]), a[3] > 0.9999999 && (a[3] = 1), new mt(Mr(a));
}, { pow: Uo } = Math;
function ir(n) {
  let r = "rgb", t = Dt("#ccc"), a = 0, e = [0, 1], i = [0, 1], o = [], u = [0, 0], h = !1, p = [], f = !1, d = 0, s = 1, g = !1, m = {}, b = !0, w = 1;
  const _ = function(P) {
    if (P = P || ["#fff", "#000"], P && Mt(P) === "string" && Dt.brewer && Dt.brewer[P.toLowerCase()] && (P = Dt.brewer[P.toLowerCase()]), Mt(P) === "array") {
      P.length === 1 && (P = [P[0], P[0]]), P = P.slice(0);
      for (let v = 0; v < P.length; v++)
        P[v] = Dt(P[v]);
      o.length = 0;
      for (let v = 0; v < P.length; v++)
        o.push(v / (P.length - 1));
    }
    return O(), p = P;
  }, S = function(P) {
    if (h != null) {
      const v = h.length - 1;
      let N = 0;
      for (; N < v && P >= h[N]; )
        N++;
      return N - 1;
    }
    return 0;
  };
  let k = (P) => P, C = (P) => P;
  const j = function(P, v) {
    let N, T;
    if (v == null && (v = !1), isNaN(P) || P === null)
      return t;
    v ? T = P : h && h.length > 2 ? T = S(P) / (h.length - 2) : s !== d ? T = (P - d) / (s - d) : T = 1, T = C(T), v || (T = k(T)), w !== 1 && (T = Uo(T, w)), T = u[0] + T * (1 - u[0] - u[1]), T = ke(T, 0, 1);
    const G = Math.floor(T * 1e4);
    if (b && m[G])
      N = m[G];
    else {
      if (Mt(p) === "array")
        for (let $ = 0; $ < o.length; $++) {
          const J = o[$];
          if (T <= J) {
            N = p[$];
            break;
          }
          if (T >= J && $ === o.length - 1) {
            N = p[$];
            break;
          }
          if (T > J && T < o[$ + 1]) {
            T = (T - J) / (o[$ + 1] - J), N = Dt.interpolate(
              p[$],
              p[$ + 1],
              T,
              r
            );
            break;
          }
        }
      else Mt(p) === "function" && (N = p(T));
      b && (m[G] = N);
    }
    return N;
  };
  var O = () => m = {};
  _(n);
  const I = function(P) {
    const v = Dt(j(P));
    return f && v[f] ? v[f]() : v;
  };
  return I.classes = function(P) {
    if (P != null) {
      if (Mt(P) === "array")
        h = P, e = [P[0], P[P.length - 1]];
      else {
        const v = Dt.analyze(e);
        P === 0 ? h = [v.min, v.max] : h = Dt.limits(v, "e", P);
      }
      return I;
    }
    return h;
  }, I.domain = function(P) {
    if (!arguments.length)
      return i;
    i = P.slice(0), d = P[0], s = P[P.length - 1], o = [];
    const v = p.length;
    if (P.length === v && d !== s)
      for (let N of Array.from(P))
        o.push((N - d) / (s - d));
    else {
      for (let N = 0; N < v; N++)
        o.push(N / (v - 1));
      if (P.length > 2) {
        const N = P.map((G, $) => $ / (P.length - 1)), T = P.map((G) => (G - d) / (s - d));
        T.every((G, $) => N[$] === G) || (C = (G) => {
          if (G <= 0 || G >= 1) return G;
          let $ = 0;
          for (; G >= T[$ + 1]; ) $++;
          const J = (G - T[$]) / (T[$ + 1] - T[$]);
          return N[$] + J * (N[$ + 1] - N[$]);
        });
      }
    }
    return e = [d, s], I;
  }, I.mode = function(P) {
    return arguments.length ? (r = P, O(), I) : r;
  }, I.range = function(P, v) {
    return _(P), I;
  }, I.out = function(P) {
    return f = P, I;
  }, I.spread = function(P) {
    return arguments.length ? (a = P, I) : a;
  }, I.correctLightness = function(P) {
    return P == null && (P = !0), g = P, O(), g ? k = function(v) {
      const N = j(0, !0).lab()[0], T = j(1, !0).lab()[0], G = N > T;
      let $ = j(v, !0).lab()[0];
      const J = N + (T - N) * v;
      let st = $ - J, D = 0, E = 1, Z = 20;
      for (; Math.abs(st) > 0.01 && Z-- > 0; )
        (function() {
          return G && (st *= -1), st < 0 ? (D = v, v += (E - v) * 0.5) : (E = v, v += (D - v) * 0.5), $ = j(v, !0).lab()[0], st = $ - J;
        })();
      return v;
    } : k = (v) => v, I;
  }, I.padding = function(P) {
    return P != null ? (Mt(P) === "number" && (P = [P, P]), u = P, I) : u;
  }, I.colors = function(P, v) {
    arguments.length < 2 && (v = "hex");
    let N = [];
    if (arguments.length === 0)
      N = p.slice(0);
    else if (P === 1)
      N = [I(0.5)];
    else if (P > 1) {
      const T = e[0], G = e[1] - T;
      N = zo(0, P).map(
        ($) => I(T + $ / (P - 1) * G)
      );
    } else {
      n = [];
      let T = [];
      if (h && h.length > 2)
        for (let G = 1, $ = h.length, J = 1 <= $; J ? G < $ : G > $; J ? G++ : G--)
          T.push((h[G - 1] + h[G]) * 0.5);
      else
        T = e;
      N = T.map((G) => I(G));
    }
    return Dt[v] && (N = N.map((T) => T[v]())), N;
  }, I.cache = function(P) {
    return P != null ? (b = P, I) : b;
  }, I.gamma = function(P) {
    return P != null ? (w = P, I) : w;
  }, I.nodata = function(P) {
    return P != null ? (t = Dt(P), I) : t;
  }, I;
}
function zo(n, r, t) {
  let a = [], e = n < r, i = r;
  for (let o = n; e ? o < i : o > i; e ? o++ : o--)
    a.push(o);
  return a;
}
const Zo = function(n) {
  let r = [1, 1];
  for (let t = 1; t < n; t++) {
    let a = [1];
    for (let e = 1; e <= r.length; e++)
      a[e] = (r[e] || 0) + r[e - 1];
    r = a;
  }
  return r;
}, qo = function(n) {
  let r, t, a, e;
  if (n = n.map((i) => new mt(i)), n.length === 2)
    [t, a] = n.map((i) => i.lab()), r = function(i) {
      const o = [0, 1, 2].map((u) => t[u] + i * (a[u] - t[u]));
      return new mt(o, "lab");
    };
  else if (n.length === 3)
    [t, a, e] = n.map((i) => i.lab()), r = function(i) {
      const o = [0, 1, 2].map(
        (u) => (1 - i) * (1 - i) * t[u] + 2 * (1 - i) * i * a[u] + i * i * e[u]
      );
      return new mt(o, "lab");
    };
  else if (n.length === 4) {
    let i;
    [t, a, e, i] = n.map((o) => o.lab()), r = function(o) {
      const u = [0, 1, 2].map(
        (h) => (1 - o) * (1 - o) * (1 - o) * t[h] + 3 * (1 - o) * (1 - o) * o * a[h] + 3 * (1 - o) * o * o * e[h] + o * o * o * i[h]
      );
      return new mt(u, "lab");
    };
  } else if (n.length >= 5) {
    let i, o, u;
    i = n.map((h) => h.lab()), u = n.length - 1, o = Zo(u), r = function(h) {
      const p = 1 - h, f = [0, 1, 2].map(
        (d) => i.reduce(
          (s, g, m) => s + o[m] * p ** (u - m) * h ** m * g[d],
          0
        )
      );
      return new mt(f, "lab");
    };
  } else
    throw new RangeError("No point in running bezier with only one color.");
  return r;
}, Wo = (n) => {
  const r = qo(n);
  return r.scale = () => ir(r), r;
}, { round: Rn } = Math;
mt.prototype.rgb = function(n = !0) {
  return n === !1 ? this._rgb.slice(0, 3) : this._rgb.slice(0, 3).map(Rn);
};
mt.prototype.rgba = function(n = !0) {
  return this._rgb.slice(0, 4).map((r, t) => t < 3 ? n === !1 ? r : Rn(r) : r);
};
const Go = (...n) => new mt(...n, "rgb");
Object.assign(Dt, { rgb: Go });
Ot.format.rgb = (...n) => {
  const r = Ct(n, "rgba");
  return r[3] === void 0 && (r[3] = 1), r;
};
Ot.autodetect.push({
  p: 3,
  test: (...n) => {
    if (n = Ct(n, "rgba"), Mt(n) === "array" && (n.length === 3 || n.length === 4 && Mt(n[3]) == "number" && n[3] >= 0 && n[3] <= 1))
      return "rgb";
  }
});
const de = (n, r, t) => {
  if (!de[t])
    throw new Error("unknown blend mode " + t);
  return de[t](n, r);
}, Ae = (n) => (r, t) => {
  const a = Dt(t).rgb(), e = Dt(r).rgb();
  return Dt.rgb(n(a, e));
}, Se = (n) => (r, t) => {
  const a = [];
  return a[0] = n(r[0], t[0]), a[1] = n(r[1], t[1]), a[2] = n(r[2], t[2]), a;
}, Ho = (n) => n, Vo = (n, r) => n * r / 255, Yo = (n, r) => n > r ? r : n, Xo = (n, r) => n > r ? n : r, $o = (n, r) => 255 * (1 - (1 - n / 255) * (1 - r / 255)), Ko = (n, r) => r < 128 ? 2 * n * r / 255 : 255 * (1 - 2 * (1 - n / 255) * (1 - r / 255)), Jo = (n, r) => 255 * (1 - (1 - r / 255) / (n / 255)), Qo = (n, r) => n === 255 ? 255 : (n = 255 * (r / 255) / (1 - n / 255), n > 255 ? 255 : n);
de.normal = Ae(Se(Ho));
de.multiply = Ae(Se(Vo));
de.screen = Ae(Se($o));
de.overlay = Ae(Se(Ko));
de.darken = Ae(Se(Yo));
de.lighten = Ae(Se(Xo));
de.dodge = Ae(Se(Qo));
de.burn = Ae(Se(Jo));
const { pow: ta, sin: ea, cos: ra } = Math;
function na(n = 300, r = -1.5, t = 1, a = 1, e = [0, 1]) {
  let i = 0, o;
  Mt(e) === "array" ? o = e[1] - e[0] : (o = 0, e = [e, e]);
  const u = function(h) {
    const p = we * ((n + 120) / 360 + r * h), f = ta(e[0] + o * h, a), s = (i !== 0 ? t[0] + h * i : t) * f * (1 - f) / 2, g = ra(p), m = ea(p), b = f + s * (-0.14861 * g + 1.78277 * m), w = f + s * (-0.29227 * g - 0.90649 * m), _ = f + s * (1.97294 * g);
    return Dt(Mr([b * 255, w * 255, _ * 255, 1]));
  };
  return u.start = function(h) {
    return h == null ? n : (n = h, u);
  }, u.rotations = function(h) {
    return h == null ? r : (r = h, u);
  }, u.gamma = function(h) {
    return h == null ? a : (a = h, u);
  }, u.hue = function(h) {
    return h == null ? t : (t = h, Mt(t) === "array" ? (i = t[1] - t[0], i === 0 && (t = t[1])) : i = 0, u);
  }, u.lightness = function(h) {
    return h == null ? e : (Mt(h) === "array" ? (e = h, o = h[1] - h[0]) : (e = [h, h], o = 0), u);
  }, u.scale = () => Dt.scale(u), u.hue(t), u;
}
const ia = "0123456789abcdef", { floor: oa, random: aa } = Math, sa = (n = aa) => {
  let r = "#";
  for (let t = 0; t < 6; t++)
    r += ia.charAt(oa(n() * 16));
  return new mt(r, "hex");
}, { log: Vr, pow: la, floor: fa, abs: ca } = Math;
function On(n, r = null) {
  const t = {
    min: Number.MAX_VALUE,
    max: Number.MAX_VALUE * -1,
    sum: 0,
    values: [],
    count: 0
  };
  return Mt(n) === "object" && (n = Object.values(n)), n.forEach((a) => {
    r && Mt(a) === "object" && (a = a[r]), a != null && !isNaN(a) && (t.values.push(a), t.sum += a, a < t.min && (t.min = a), a > t.max && (t.max = a), t.count += 1);
  }), t.domain = [t.min, t.max], t.limits = (a, e) => In(t, a, e), t;
}
function In(n, r = "equal", t = 7) {
  Mt(n) == "array" && (n = On(n));
  const { min: a, max: e } = n, i = n.values.sort((u, h) => u - h);
  if (t === 1)
    return [a, e];
  const o = [];
  if (r.substr(0, 1) === "c" && (o.push(a), o.push(e)), r.substr(0, 1) === "e") {
    o.push(a);
    for (let u = 1; u < t; u++)
      o.push(a + u / t * (e - a));
    o.push(e);
  } else if (r.substr(0, 1) === "l") {
    if (a <= 0)
      throw new Error(
        "Logarithmic scales are only possible for values > 0"
      );
    const u = Math.LOG10E * Vr(a), h = Math.LOG10E * Vr(e);
    o.push(a);
    for (let p = 1; p < t; p++)
      o.push(la(10, u + p / t * (h - u)));
    o.push(e);
  } else if (r.substr(0, 1) === "q") {
    o.push(a);
    for (let u = 1; u < t; u++) {
      const h = (i.length - 1) * u / t, p = fa(h);
      if (p === h)
        o.push(i[p]);
      else {
        const f = h - p;
        o.push(i[p] * (1 - f) + i[p + 1] * f);
      }
    }
    o.push(e);
  } else if (r.substr(0, 1) === "k") {
    let u;
    const h = i.length, p = new Array(h), f = new Array(t);
    let d = !0, s = 0, g = null;
    g = [], g.push(a);
    for (let w = 1; w < t; w++)
      g.push(a + w / t * (e - a));
    for (g.push(e); d; ) {
      for (let _ = 0; _ < t; _++)
        f[_] = 0;
      for (let _ = 0; _ < h; _++) {
        const S = i[_];
        let k = Number.MAX_VALUE, C;
        for (let j = 0; j < t; j++) {
          const O = ca(g[j] - S);
          O < k && (k = O, C = j), f[C]++, p[_] = C;
        }
      }
      const w = new Array(t);
      for (let _ = 0; _ < t; _++)
        w[_] = null;
      for (let _ = 0; _ < h; _++)
        u = p[_], w[u] === null ? w[u] = i[_] : w[u] += i[_];
      for (let _ = 0; _ < t; _++)
        w[_] *= 1 / f[_];
      d = !1;
      for (let _ = 0; _ < t; _++)
        if (w[_] !== g[_]) {
          d = !0;
          break;
        }
      g = w, s++, s > 200 && (d = !1);
    }
    const m = {};
    for (let w = 0; w < t; w++)
      m[w] = [];
    for (let w = 0; w < h; w++)
      u = p[w], m[u].push(i[w]);
    let b = [];
    for (let w = 0; w < t; w++)
      b.push(m[w][0]), b.push(m[w][m[w].length - 1]);
    b = b.sort((w, _) => w - _), o.push(b[0]);
    for (let w = 1; w < b.length; w += 2) {
      const _ = b[w];
      !isNaN(_) && o.indexOf(_) === -1 && o.push(_);
    }
  }
  return o;
}
const ua = (n, r) => {
  n = new mt(n), r = new mt(r);
  const t = n.luminance(), a = r.luminance();
  return t > a ? (t + 0.05) / (a + 0.05) : (a + 0.05) / (t + 0.05);
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
const Yr = 0.027, ha = 5e-4, da = 0.1, Xr = 1.14, Xe = 0.022, $r = 1.414, pa = (n, r) => {
  n = new mt(n), r = new mt(r), n.alpha() < 1 && (n = Ce(r, n, n.alpha(), "rgb"));
  const t = Kr(...n.rgb()), a = Kr(...r.rgb()), e = t >= Xe ? t : t + Math.pow(Xe - t, $r), i = a >= Xe ? a : a + Math.pow(Xe - a, $r), o = Math.pow(i, 0.56) - Math.pow(e, 0.57), u = Math.pow(i, 0.65) - Math.pow(e, 0.62), h = Math.abs(i - e) < ha ? 0 : e < i ? o * Xr : u * Xr;
  return (Math.abs(h) < da ? 0 : h > 0 ? h - Yr : h + Yr) * 100;
};
function Kr(n, r, t) {
  return 0.2126729 * Math.pow(n / 255, 2.4) + 0.7151522 * Math.pow(r / 255, 2.4) + 0.072175 * Math.pow(t / 255, 2.4);
}
const { sqrt: _e, pow: Xt, min: ba, max: ya, atan2: Jr, abs: Qr, cos: $e, sin: tn, exp: ga, PI: en } = Math;
function ma(n, r, t = 1, a = 1, e = 1) {
  var i = function(U) {
    return 360 * U / (2 * en);
  }, o = function(U) {
    return 2 * en * U / 360;
  };
  n = new mt(n), r = new mt(r);
  const [u, h, p] = Array.from(n.lab()), [f, d, s] = Array.from(r.lab()), g = (u + f) / 2, m = _e(Xt(h, 2) + Xt(p, 2)), b = _e(Xt(d, 2) + Xt(s, 2)), w = (m + b) / 2, _ = 0.5 * (1 - _e(Xt(w, 7) / (Xt(w, 7) + Xt(25, 7)))), S = h * (1 + _), k = d * (1 + _), C = _e(Xt(S, 2) + Xt(p, 2)), j = _e(Xt(k, 2) + Xt(s, 2)), O = (C + j) / 2, I = i(Jr(p, S)), P = i(Jr(s, k)), v = I >= 0 ? I : I + 360, N = P >= 0 ? P : P + 360, T = Qr(v - N) > 180 ? (v + N + 360) / 2 : (v + N) / 2, G = 1 - 0.17 * $e(o(T - 30)) + 0.24 * $e(o(2 * T)) + 0.32 * $e(o(3 * T + 6)) - 0.2 * $e(o(4 * T - 63));
  let $ = N - v;
  $ = Qr($) <= 180 ? $ : N <= v ? $ + 360 : $ - 360, $ = 2 * _e(C * j) * tn(o($) / 2);
  const J = f - u, st = j - C, D = 1 + 0.015 * Xt(g - 50, 2) / _e(20 + Xt(g - 50, 2)), E = 1 + 0.045 * O, Z = 1 + 0.015 * O * G, nt = 30 * ga(-Xt((T - 275) / 25, 2)), Et = -(2 * _e(Xt(O, 7) / (Xt(O, 7) + Xt(25, 7)))) * tn(2 * o(nt)), it = _e(
    Xt(J / (t * D), 2) + Xt(st / (a * E), 2) + Xt($ / (e * Z), 2) + Et * (st / (a * E)) * ($ / (e * Z))
  );
  return ya(0, ba(100, it));
}
function _a(n, r, t = "lab") {
  n = new mt(n), r = new mt(r);
  const a = n.get(t), e = r.get(t);
  let i = 0;
  for (let o in a) {
    const u = (a[o] || 0) - (e[o] || 0);
    i += u * u;
  }
  return Math.sqrt(i);
}
const wa = (...n) => {
  try {
    return new mt(...n), !0;
  } catch {
    return !1;
  }
}, va = {
  cool() {
    return ir([Dt.hsl(180, 1, 0.9), Dt.hsl(250, 0.7, 0.4)]);
  },
  hot() {
    return ir(["#000", "#f00", "#ff0", "#fff"]).mode(
      "rgb"
    );
  }
}, kr = {
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
}, Cn = Object.keys(kr), rn = new Map(Cn.map((n) => [n.toLowerCase(), n])), Ea = typeof Proxy == "function" ? new Proxy(kr, {
  get(n, r) {
    const t = r.toLowerCase();
    if (rn.has(t))
      return n[rn.get(t)];
  },
  getOwnPropertyNames() {
    return Object.getOwnPropertyNames(Cn);
  }
}) : kr, Aa = (...n) => {
  n = Ct(n, "cmyk");
  const [r, t, a, e] = n, i = n.length > 4 ? n[4] : 1;
  return e === 1 ? [0, 0, 0, i] : [
    r >= 1 ? 0 : 255 * (1 - r) * (1 - e),
    // r
    t >= 1 ? 0 : 255 * (1 - t) * (1 - e),
    // g
    a >= 1 ? 0 : 255 * (1 - a) * (1 - e),
    // b
    i
  ];
}, { max: nn } = Math, Sa = (...n) => {
  let [r, t, a] = Ct(n, "rgb");
  r = r / 255, t = t / 255, a = a / 255;
  const e = 1 - nn(r, nn(t, a)), i = e < 1 ? 1 / (1 - e) : 0, o = (1 - r - e) * i, u = (1 - t - e) * i, h = (1 - a - e) * i;
  return [o, u, h, e];
};
mt.prototype.cmyk = function() {
  return Sa(this._rgb);
};
const xa = (...n) => new mt(...n, "cmyk");
Object.assign(Dt, { cmyk: xa });
Ot.format.cmyk = Aa;
Ot.autodetect.push({
  p: 2,
  test: (...n) => {
    if (n = Ct(n, "cmyk"), Mt(n) === "array" && n.length === 4)
      return "cmyk";
  }
});
const ka = (...n) => {
  const r = Ct(n, "hsla");
  let t = Me(n) || "lsa";
  return r[0] = ce(r[0] || 0) + "deg", r[1] = ce(r[1] * 100) + "%", r[2] = ce(r[2] * 100) + "%", t === "hsla" || r.length > 3 && r[3] < 1 ? (r[3] = "/ " + (r.length > 3 ? r[3] : 1), t = "hsla") : r.length = 3, `${t.substr(0, 3)}(${r.join(" ")})`;
}, La = (...n) => {
  const r = Ct(n, "lab");
  let t = Me(n) || "lab";
  return r[0] = ce(r[0]) + "%", r[1] = ce(r[1]), r[2] = ce(r[2]), t === "laba" || r.length > 3 && r[3] < 1 ? r[3] = "/ " + (r.length > 3 ? r[3] : 1) : r.length = 3, `lab(${r.join(" ")})`;
}, Pa = (...n) => {
  const r = Ct(n, "lch");
  let t = Me(n) || "lab";
  return r[0] = ce(r[0]) + "%", r[1] = ce(r[1]), r[2] = isNaN(r[2]) ? "none" : ce(r[2]) + "deg", t === "lcha" || r.length > 3 && r[3] < 1 ? r[3] = "/ " + (r.length > 3 ? r[3] : 1) : r.length = 3, `lch(${r.join(" ")})`;
}, Ra = (...n) => {
  const r = Ct(n, "lab");
  return r[0] = ce(r[0] * 100) + "%", r[1] = Sr(r[1]), r[2] = Sr(r[2]), r.length > 3 && r[3] < 1 ? r[3] = "/ " + (r.length > 3 ? r[3] : 1) : r.length = 3, `oklab(${r.join(" ")})`;
}, Mn = (...n) => {
  const [r, t, a, ...e] = Ct(n, "rgb"), [i, o, u] = Fr(r, t, a), [h, p, f] = kn(i, o, u);
  return [h, p, f, ...e.length > 0 && e[0] < 1 ? [e[0]] : []];
}, Oa = (...n) => {
  const r = Ct(n, "lch");
  return r[0] = ce(r[0] * 100) + "%", r[1] = Sr(r[1]), r[2] = isNaN(r[2]) ? "none" : ce(r[2]) + "deg", r.length > 3 && r[3] < 1 ? r[3] = "/ " + (r.length > 3 ? r[3] : 1) : r.length = 3, `oklch(${r.join(" ")})`;
}, { round: _r } = Math, Ia = (...n) => {
  const r = Ct(n, "rgba");
  let t = Me(n) || "rgb";
  if (t.substr(0, 3) === "hsl")
    return ka(Pn(r), t);
  if (t.substr(0, 3) === "lab") {
    const a = Ze();
    ve("d50");
    const e = La(Nr(r), t);
    return ve(a), e;
  }
  if (t.substr(0, 3) === "lch") {
    const a = Ze();
    ve("d50");
    const e = Pa(Br(r), t);
    return ve(a), e;
  }
  return t.substr(0, 5) === "oklab" ? Ra(Fr(r)) : t.substr(0, 5) === "oklch" ? Oa(Mn(r)) : (r[0] = _r(r[0]), r[1] = _r(r[1]), r[2] = _r(r[2]), (t === "rgba" || r.length > 3 && r[3] < 1) && (r[3] = "/ " + (r.length > 3 ? r[3] : 1), t = "rgba"), `${t.substr(0, 3)}(${r.slice(0, t === "rgb" ? 3 : 4).join(" ")})`);
}, Tn = (...n) => {
  n = Ct(n, "lch");
  const [r, t, a, ...e] = n, [i, o, u] = xn(r, t, a), [h, p, f] = jr(i, o, u);
  return [h, p, f, ...e.length > 0 && e[0] < 1 ? [e[0]] : []];
}, Ee = /((?:-?\d+)|(?:-?\d+(?:\.\d+)?)%|none)/.source, he = /((?:-?(?:\d+(?:\.\d*)?|\.\d+)%?)|none)/.source, or = /((?:-?(?:\d+(?:\.\d*)?|\.\d+)%)|none)/.source, ue = /\s*/.source, Ne = /\s+/.source, Ur = /\s*,\s*/.source, sr = /((?:-?(?:\d+(?:\.\d*)?|\.\d+)(?:deg)?)|none)/.source, De = /\s*(?:\/\s*((?:[01]|[01]?\.\d+)|\d+(?:\.\d+)?%))?/.source, Nn = new RegExp(
  "^rgba?\\(" + ue + [Ee, Ee, Ee].join(Ne) + De + "\\)$"
), Dn = new RegExp(
  "^rgb\\(" + ue + [Ee, Ee, Ee].join(Ur) + ue + "\\)$"
), Bn = new RegExp(
  "^rgba\\(" + ue + [Ee, Ee, Ee, he].join(Ur) + ue + "\\)$"
), jn = new RegExp(
  "^hsla?\\(" + ue + [sr, or, or].join(Ne) + De + "\\)$"
), Fn = new RegExp(
  "^hsl?\\(" + ue + [sr, or, or].join(Ur) + ue + "\\)$"
), Un = /^hsla\(\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)%\s*,\s*(-?\d+(?:\.\d+)?)%\s*,\s*([01]|[01]?\.\d+)\)$/, zn = new RegExp(
  "^lab\\(" + ue + [he, he, he].join(Ne) + De + "\\)$"
), Zn = new RegExp(
  "^lch\\(" + ue + [he, he, sr].join(Ne) + De + "\\)$"
), qn = new RegExp(
  "^oklab\\(" + ue + [he, he, he].join(Ne) + De + "\\)$"
), Wn = new RegExp(
  "^oklch\\(" + ue + [he, he, sr].join(Ne) + De + "\\)$"
), { round: Gn } = Math, Re = (n) => n.map((r, t) => t <= 2 ? ke(Gn(r), 0, 255) : r), $t = (n, r = 0, t = 100, a = !1) => (typeof n == "string" && n.endsWith("%") && (n = parseFloat(n.substring(0, n.length - 1)) / 100, a ? n = r + (n + 1) * 0.5 * (t - r) : n = r + n * (t - r)), +n), ne = (n, r) => n === "none" ? r : n, zr = (n) => {
  if (n = n.toLowerCase().trim(), n === "transparent")
    return [0, 0, 0, 0];
  let r;
  if (Ot.format.named)
    try {
      return Ot.format.named(n);
    } catch {
    }
  if ((r = n.match(Nn)) || (r = n.match(Dn))) {
    let t = r.slice(1, 4);
    for (let e = 0; e < 3; e++)
      t[e] = +$t(ne(t[e], 0), 0, 255);
    t = Re(t);
    const a = r[4] !== void 0 ? +$t(r[4], 0, 1) : 1;
    return t[3] = a, t;
  }
  if (r = n.match(Bn)) {
    const t = r.slice(1, 5);
    for (let a = 0; a < 4; a++)
      t[a] = +$t(t[a], 0, 255);
    return t;
  }
  if ((r = n.match(jn)) || (r = n.match(Fn))) {
    const t = r.slice(1, 4);
    t[0] = +ne(t[0].replace("deg", ""), 0), t[1] = +$t(ne(t[1], 0), 0, 100) * 0.01, t[2] = +$t(ne(t[2], 0), 0, 100) * 0.01;
    const a = Re(xr(t)), e = r[4] !== void 0 ? +$t(r[4], 0, 1) : 1;
    return a[3] = e, a;
  }
  if (r = n.match(Un)) {
    const t = r.slice(1, 4);
    t[1] *= 0.01, t[2] *= 0.01;
    const a = xr(t);
    for (let e = 0; e < 3; e++)
      a[e] = Gn(a[e]);
    return a[3] = +r[4], a;
  }
  if (r = n.match(zn)) {
    const t = r.slice(1, 4);
    t[0] = $t(ne(t[0], 0), 0, 100), t[1] = $t(ne(t[1], 0), -125, 125, !0), t[2] = $t(ne(t[2], 0), -125, 125, !0);
    const a = Ze();
    ve("d50");
    const e = Re(Tr(t));
    ve(a);
    const i = r[4] !== void 0 ? +$t(r[4], 0, 1) : 1;
    return e[3] = i, e;
  }
  if (r = n.match(Zn)) {
    const t = r.slice(1, 4);
    t[0] = $t(t[0], 0, 100), t[1] = $t(ne(t[1], 0), 0, 150, !1), t[2] = +ne(t[2].replace("deg", ""), 0);
    const a = Ze();
    ve("d50");
    const e = Re(Dr(t));
    ve(a);
    const i = r[4] !== void 0 ? +$t(r[4], 0, 1) : 1;
    return e[3] = i, e;
  }
  if (r = n.match(qn)) {
    const t = r.slice(1, 4);
    t[0] = $t(ne(t[0], 0), 0, 1), t[1] = $t(ne(t[1], 0), -0.4, 0.4, !0), t[2] = $t(ne(t[2], 0), -0.4, 0.4, !0);
    const a = Re(jr(t)), e = r[4] !== void 0 ? +$t(r[4], 0, 1) : 1;
    return a[3] = e, a;
  }
  if (r = n.match(Wn)) {
    const t = r.slice(1, 4);
    t[0] = $t(ne(t[0], 0), 0, 1), t[1] = $t(ne(t[1], 0), 0, 0.4, !1), t[2] = +ne(t[2].replace("deg", ""), 0);
    const a = Re(Tn(t)), e = r[4] !== void 0 ? +$t(r[4], 0, 1) : 1;
    return a[3] = e, a;
  }
};
zr.test = (n) => (
  // modern
  Nn.test(n) || jn.test(n) || zn.test(n) || Zn.test(n) || qn.test(n) || Wn.test(n) || // legacy
  Dn.test(n) || Bn.test(n) || Fn.test(n) || Un.test(n) || n === "transparent"
);
mt.prototype.css = function(n) {
  return Ia(this._rgb, n);
};
const Ca = (...n) => new mt(...n, "css");
Dt.css = Ca;
Ot.format.css = zr;
Ot.autodetect.push({
  p: 5,
  test: (n, ...r) => {
    if (!r.length && Mt(n) === "string" && zr.test(n))
      return "css";
  }
});
Ot.format.gl = (...n) => {
  const r = Ct(n, "rgba");
  return r[0] *= 255, r[1] *= 255, r[2] *= 255, r;
};
const Ma = (...n) => new mt(...n, "gl");
Dt.gl = Ma;
mt.prototype.gl = function() {
  const n = this._rgb;
  return [n[0] / 255, n[1] / 255, n[2] / 255, n[3]];
};
mt.prototype.hex = function(n) {
  return En(this._rgb, n);
};
const Ta = (...n) => new mt(...n, "hex");
Dt.hex = Ta;
Ot.format.hex = vn;
Ot.autodetect.push({
  p: 4,
  test: (n, ...r) => {
    if (!r.length && Mt(n) === "string" && [3, 4, 5, 6, 7, 8, 9].indexOf(n.length) >= 0)
      return "hex";
  }
});
const { log: Ke } = Math, Hn = (n) => {
  const r = n / 100;
  let t, a, e;
  return r < 66 ? (t = 255, a = r < 6 ? 0 : -155.25485562709179 - 0.44596950469579133 * (a = r - 2) + 104.49216199393888 * Ke(a), e = r < 20 ? 0 : -254.76935184120902 + 0.8274096064007395 * (e = r - 10) + 115.67994401066147 * Ke(e)) : (t = 351.97690566805693 + 0.114206453784165 * (t = r - 55) - 40.25366309332127 * Ke(t), a = 325.4494125711974 + 0.07943456536662342 * (a = r - 50) - 28.0852963507957 * Ke(a), e = 255), [t, a, e, 1];
}, { round: Na } = Math, Da = (...n) => {
  const r = Ct(n, "rgb"), t = r[0], a = r[2];
  let e = 1e3, i = 4e4;
  const o = 0.4;
  let u;
  for (; i - e > o; ) {
    u = (i + e) * 0.5;
    const h = Hn(u);
    h[2] / h[0] >= a / t ? i = u : e = u;
  }
  return Na(u);
};
mt.prototype.temp = mt.prototype.kelvin = mt.prototype.temperature = function() {
  return Da(this._rgb);
};
const wr = (...n) => new mt(...n, "temp");
Object.assign(Dt, { temp: wr, kelvin: wr, temperature: wr });
Ot.format.temp = Ot.format.kelvin = Ot.format.temperature = Hn;
mt.prototype.oklch = function() {
  return Mn(this._rgb);
};
const Ba = (...n) => new mt(...n, "oklch");
Object.assign(Dt, { oklch: Ba });
Ot.format.oklch = Tn;
Ot.autodetect.push({
  p: 2,
  test: (...n) => {
    if (n = Ct(n, "oklch"), Mt(n) === "array" && n.length === 3)
      return "oklch";
  }
});
Object.assign(Dt, {
  analyze: On,
  average: jo,
  bezier: Wo,
  blend: de,
  brewer: Ea,
  Color: mt,
  colors: Ie,
  contrast: ua,
  contrastAPCA: pa,
  cubehelix: na,
  deltaE: ma,
  distance: _a,
  input: Ot,
  interpolate: Ce,
  limits: In,
  mix: Ce,
  random: sa,
  scale: ir,
  scales: va,
  valid: wa
});
var ee = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function Je(n) {
  throw new Error('Could not dynamically require "' + n + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
}
var ja = { exports: {} };
(function(n, r) {
  (function(t) {
    n.exports = t();
  })(function() {
    return (/* @__PURE__ */ (function() {
      function t(a, e, i) {
        function o(p, f) {
          if (!e[p]) {
            if (!a[p]) {
              var d = typeof Je == "function" && Je;
              if (!f && d)
                return d(p, !0);
              if (u)
                return u(p, !0);
              var s = new Error("Cannot find module '" + p + "'");
              throw s.code = "MODULE_NOT_FOUND", s;
            }
            var g = e[p] = { exports: {} };
            a[p][0].call(g.exports, function(m) {
              var b = a[p][1][m];
              return o(b || m);
            }, g, g.exports, t, a, e, i);
          }
          return e[p].exports;
        }
        for (var u = typeof Je == "function" && Je, h = 0; h < i.length; h++)
          o(i[h]);
        return o;
      }
      return t;
    })())({ 1: [function(t, a, e) {
      (function(i) {
        (function() {
          let o = t("./interlace"), u = [
            // 0 - dummy entry
            function() {
            },
            // 1 - L
            // 0: 0, 1: 0, 2: 0, 3: 0xff
            function(s, g, m, b) {
              if (b === g.length)
                throw new Error("Ran out of data");
              let w = g[b];
              s[m] = w, s[m + 1] = w, s[m + 2] = w, s[m + 3] = 255;
            },
            // 2 - LA
            // 0: 0, 1: 0, 2: 0, 3: 1
            function(s, g, m, b) {
              if (b + 1 >= g.length)
                throw new Error("Ran out of data");
              let w = g[b];
              s[m] = w, s[m + 1] = w, s[m + 2] = w, s[m + 3] = g[b + 1];
            },
            // 3 - RGB
            // 0: 0, 1: 1, 2: 2, 3: 0xff
            function(s, g, m, b) {
              if (b + 2 >= g.length)
                throw new Error("Ran out of data");
              s[m] = g[b], s[m + 1] = g[b + 1], s[m + 2] = g[b + 2], s[m + 3] = 255;
            },
            // 4 - RGBA
            // 0: 0, 1: 1, 2: 2, 3: 3
            function(s, g, m, b) {
              if (b + 3 >= g.length)
                throw new Error("Ran out of data");
              s[m] = g[b], s[m + 1] = g[b + 1], s[m + 2] = g[b + 2], s[m + 3] = g[b + 3];
            }
          ], h = [
            // 0 - dummy entry
            function() {
            },
            // 1 - L
            // 0: 0, 1: 0, 2: 0, 3: 0xff
            function(s, g, m, b) {
              let w = g[0];
              s[m] = w, s[m + 1] = w, s[m + 2] = w, s[m + 3] = b;
            },
            // 2 - LA
            // 0: 0, 1: 0, 2: 0, 3: 1
            function(s, g, m) {
              let b = g[0];
              s[m] = b, s[m + 1] = b, s[m + 2] = b, s[m + 3] = g[1];
            },
            // 3 - RGB
            // 0: 0, 1: 1, 2: 2, 3: 0xff
            function(s, g, m, b) {
              s[m] = g[0], s[m + 1] = g[1], s[m + 2] = g[2], s[m + 3] = b;
            },
            // 4 - RGBA
            // 0: 0, 1: 1, 2: 2, 3: 3
            function(s, g, m) {
              s[m] = g[0], s[m + 1] = g[1], s[m + 2] = g[2], s[m + 3] = g[3];
            }
          ];
          function p(s, g) {
            let m = [], b = 0;
            function w() {
              if (b === s.length)
                throw new Error("Ran out of data");
              let _ = s[b];
              b++;
              let S, k, C, j, O, I, P, v;
              switch (g) {
                default:
                  throw new Error("unrecognised depth");
                case 16:
                  P = s[b], b++, m.push((_ << 8) + P);
                  break;
                case 4:
                  P = _ & 15, v = _ >> 4, m.push(v, P);
                  break;
                case 2:
                  O = _ & 3, I = _ >> 2 & 3, P = _ >> 4 & 3, v = _ >> 6 & 3, m.push(v, P, I, O);
                  break;
                case 1:
                  S = _ & 1, k = _ >> 1 & 1, C = _ >> 2 & 1, j = _ >> 3 & 1, O = _ >> 4 & 1, I = _ >> 5 & 1, P = _ >> 6 & 1, v = _ >> 7 & 1, m.push(v, P, I, O, j, C, k, S);
                  break;
              }
            }
            return {
              get: function(_) {
                for (; m.length < _; )
                  w();
                let S = m.slice(0, _);
                return m = m.slice(_), S;
              },
              resetAfterLine: function() {
                m.length = 0;
              },
              end: function() {
                if (b !== s.length)
                  throw new Error("extra data found");
              }
            };
          }
          function f(s, g, m, b, w, _) {
            let S = s.width, k = s.height, C = s.index;
            for (let j = 0; j < k; j++)
              for (let O = 0; O < S; O++) {
                let I = m(O, j, C);
                u[b](g, w, I, _), _ += b;
              }
            return _;
          }
          function d(s, g, m, b, w, _) {
            let S = s.width, k = s.height, C = s.index;
            for (let j = 0; j < k; j++) {
              for (let O = 0; O < S; O++) {
                let I = w.get(b), P = m(O, j, C);
                h[b](g, I, P, _);
              }
              w.resetAfterLine();
            }
          }
          e.dataToBitMap = function(s, g) {
            let m = g.width, b = g.height, w = g.depth, _ = g.bpp, S = g.interlace, k;
            w !== 8 && (k = p(s, w));
            let C;
            w <= 8 ? C = i.alloc(m * b * 4) : C = new Uint16Array(m * b * 4);
            let j = Math.pow(2, w) - 1, O = 0, I, P;
            if (S)
              I = o.getImagePasses(m, b), P = o.getInterlaceIterator(m, b);
            else {
              let v = 0;
              P = function() {
                let N = v;
                return v += 4, N;
              }, I = [{ width: m, height: b }];
            }
            for (let v = 0; v < I.length; v++)
              w === 8 ? O = f(
                I[v],
                C,
                P,
                _,
                s,
                O
              ) : d(
                I[v],
                C,
                P,
                _,
                k,
                j
              );
            if (w === 8) {
              if (O !== s.length)
                throw new Error("extra data found");
            } else
              k.end();
            return C;
          };
        }).call(this);
      }).call(this, t("buffer").Buffer);
    }, { "./interlace": 11, buffer: 32 }], 2: [function(t, a, e) {
      (function(i) {
        (function() {
          let o = t("./constants");
          a.exports = function(u, h, p, f) {
            let d = [o.COLORTYPE_COLOR_ALPHA, o.COLORTYPE_ALPHA].indexOf(
              f.colorType
            ) !== -1;
            if (f.colorType === f.inputColorType) {
              let j = (function() {
                let O = new ArrayBuffer(2);
                return new DataView(O).setInt16(
                  0,
                  256,
                  !0
                  /* littleEndian */
                ), new Int16Array(O)[0] !== 256;
              })();
              if (f.bitDepth === 8 || f.bitDepth === 16 && j)
                return u;
            }
            let s = f.bitDepth !== 16 ? u : new Uint16Array(u.buffer), g = 255, m = o.COLORTYPE_TO_BPP_MAP[f.inputColorType];
            m === 4 && !f.inputHasAlpha && (m = 3);
            let b = o.COLORTYPE_TO_BPP_MAP[f.colorType];
            f.bitDepth === 16 && (g = 65535, b *= 2);
            let w = i.alloc(h * p * b), _ = 0, S = 0, k = f.bgColor || {};
            k.red === void 0 && (k.red = g), k.green === void 0 && (k.green = g), k.blue === void 0 && (k.blue = g);
            function C() {
              let j, O, I, P = g;
              switch (f.inputColorType) {
                case o.COLORTYPE_COLOR_ALPHA:
                  P = s[_ + 3], j = s[_], O = s[_ + 1], I = s[_ + 2];
                  break;
                case o.COLORTYPE_COLOR:
                  j = s[_], O = s[_ + 1], I = s[_ + 2];
                  break;
                case o.COLORTYPE_ALPHA:
                  P = s[_ + 1], j = s[_], O = j, I = j;
                  break;
                case o.COLORTYPE_GRAYSCALE:
                  j = s[_], O = j, I = j;
                  break;
                default:
                  throw new Error(
                    "input color type:" + f.inputColorType + " is not supported at present"
                  );
              }
              return f.inputHasAlpha && (d || (P /= g, j = Math.min(
                Math.max(Math.round((1 - P) * k.red + P * j), 0),
                g
              ), O = Math.min(
                Math.max(Math.round((1 - P) * k.green + P * O), 0),
                g
              ), I = Math.min(
                Math.max(Math.round((1 - P) * k.blue + P * I), 0),
                g
              ))), { red: j, green: O, blue: I, alpha: P };
            }
            for (let j = 0; j < p; j++)
              for (let O = 0; O < h; O++) {
                let I = C();
                switch (f.colorType) {
                  case o.COLORTYPE_COLOR_ALPHA:
                  case o.COLORTYPE_COLOR:
                    f.bitDepth === 8 ? (w[S] = I.red, w[S + 1] = I.green, w[S + 2] = I.blue, d && (w[S + 3] = I.alpha)) : (w.writeUInt16BE(I.red, S), w.writeUInt16BE(I.green, S + 2), w.writeUInt16BE(I.blue, S + 4), d && w.writeUInt16BE(I.alpha, S + 6));
                    break;
                  case o.COLORTYPE_ALPHA:
                  case o.COLORTYPE_GRAYSCALE: {
                    let P = (I.red + I.green + I.blue) / 3;
                    f.bitDepth === 8 ? (w[S] = P, d && (w[S + 1] = I.alpha)) : (w.writeUInt16BE(P, S), d && w.writeUInt16BE(I.alpha, S + 2));
                    break;
                  }
                  default:
                    throw new Error("unrecognised color Type " + f.colorType);
                }
                _ += m, S += b;
              }
            return w;
          };
        }).call(this);
      }).call(this, t("buffer").Buffer);
    }, { "./constants": 4, buffer: 32 }], 3: [function(t, a, e) {
      (function(i, o) {
        (function() {
          let u = t("util"), h = t("stream"), p = a.exports = function() {
            h.call(this), this._buffers = [], this._buffered = 0, this._reads = [], this._paused = !1, this._encoding = "utf8", this.writable = !0;
          };
          u.inherits(p, h), p.prototype.read = function(f, d) {
            this._reads.push({
              length: Math.abs(f),
              // if length < 0 then at most this length
              allowLess: f < 0,
              func: d
            }), i.nextTick(
              (function() {
                this._process(), this._paused && this._reads && this._reads.length > 0 && (this._paused = !1, this.emit("drain"));
              }).bind(this)
            );
          }, p.prototype.write = function(f, d) {
            if (!this.writable)
              return this.emit("error", new Error("Stream not writable")), !1;
            let s;
            return o.isBuffer(f) ? s = f : s = o.from(f, d || this._encoding), this._buffers.push(s), this._buffered += s.length, this._process(), this._reads && this._reads.length === 0 && (this._paused = !0), this.writable && !this._paused;
          }, p.prototype.end = function(f, d) {
            f && this.write(f, d), this.writable = !1, this._buffers && (this._buffers.length === 0 ? this._end() : (this._buffers.push(null), this._process()));
          }, p.prototype.destroySoon = p.prototype.end, p.prototype._end = function() {
            this._reads.length > 0 && this.emit("error", new Error("Unexpected end of input")), this.destroy();
          }, p.prototype.destroy = function() {
            this._buffers && (this.writable = !1, this._reads = null, this._buffers = null, this.emit("close"));
          }, p.prototype._processReadAllowingLess = function(f) {
            this._reads.shift();
            let d = this._buffers[0];
            d.length > f.length ? (this._buffered -= f.length, this._buffers[0] = d.slice(f.length), f.func.call(this, d.slice(0, f.length))) : (this._buffered -= d.length, this._buffers.shift(), f.func.call(this, d));
          }, p.prototype._processRead = function(f) {
            this._reads.shift();
            let d = 0, s = 0, g = o.alloc(f.length);
            for (; d < f.length; ) {
              let m = this._buffers[s++], b = Math.min(m.length, f.length - d);
              m.copy(g, d, 0, b), d += b, b !== m.length && (this._buffers[--s] = m.slice(b));
            }
            s > 0 && this._buffers.splice(0, s), this._buffered -= f.length, f.func.call(this, g);
          }, p.prototype._process = function() {
            try {
              for (; this._buffered > 0 && this._reads && this._reads.length > 0; ) {
                let f = this._reads[0];
                if (f.allowLess)
                  this._processReadAllowingLess(f);
                else if (this._buffered >= f.length)
                  this._processRead(f);
                else
                  break;
              }
              this._buffers && !this.writable && this._end();
            } catch (f) {
              this.emit("error", f);
            }
          };
        }).call(this);
      }).call(this, t("_process"), t("buffer").Buffer);
    }, { _process: 63, buffer: 32, stream: 65, util: 84 }], 4: [function(t, a, e) {
      a.exports = {
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
    }, {}], 5: [function(t, a, e) {
      let i = [];
      (function() {
        for (let u = 0; u < 256; u++) {
          let h = u;
          for (let p = 0; p < 8; p++)
            h & 1 ? h = 3988292384 ^ h >>> 1 : h = h >>> 1;
          i[u] = h;
        }
      })();
      let o = a.exports = function() {
        this._crc = -1;
      };
      o.prototype.write = function(u) {
        for (let h = 0; h < u.length; h++)
          this._crc = i[(this._crc ^ u[h]) & 255] ^ this._crc >>> 8;
        return !0;
      }, o.prototype.crc32 = function() {
        return this._crc ^ -1;
      }, o.crc32 = function(u) {
        let h = -1;
        for (let p = 0; p < u.length; p++)
          h = i[(h ^ u[p]) & 255] ^ h >>> 8;
        return h ^ -1;
      };
    }, {}], 6: [function(t, a, e) {
      (function(i) {
        (function() {
          let o = t("./paeth-predictor");
          function u(k, C, j, O, I) {
            for (let P = 0; P < j; P++)
              O[I + P] = k[C + P];
          }
          function h(k, C, j) {
            let O = 0, I = C + j;
            for (let P = C; P < I; P++)
              O += Math.abs(k[P]);
            return O;
          }
          function p(k, C, j, O, I, P) {
            for (let v = 0; v < j; v++) {
              let N = v >= P ? k[C + v - P] : 0, T = k[C + v] - N;
              O[I + v] = T;
            }
          }
          function f(k, C, j, O) {
            let I = 0;
            for (let P = 0; P < j; P++) {
              let v = P >= O ? k[C + P - O] : 0, N = k[C + P] - v;
              I += Math.abs(N);
            }
            return I;
          }
          function d(k, C, j, O, I) {
            for (let P = 0; P < j; P++) {
              let v = C > 0 ? k[C + P - j] : 0, N = k[C + P] - v;
              O[I + P] = N;
            }
          }
          function s(k, C, j) {
            let O = 0, I = C + j;
            for (let P = C; P < I; P++) {
              let v = C > 0 ? k[P - j] : 0, N = k[P] - v;
              O += Math.abs(N);
            }
            return O;
          }
          function g(k, C, j, O, I, P) {
            for (let v = 0; v < j; v++) {
              let N = v >= P ? k[C + v - P] : 0, T = C > 0 ? k[C + v - j] : 0, G = k[C + v] - (N + T >> 1);
              O[I + v] = G;
            }
          }
          function m(k, C, j, O) {
            let I = 0;
            for (let P = 0; P < j; P++) {
              let v = P >= O ? k[C + P - O] : 0, N = C > 0 ? k[C + P - j] : 0, T = k[C + P] - (v + N >> 1);
              I += Math.abs(T);
            }
            return I;
          }
          function b(k, C, j, O, I, P) {
            for (let v = 0; v < j; v++) {
              let N = v >= P ? k[C + v - P] : 0, T = C > 0 ? k[C + v - j] : 0, G = C > 0 && v >= P ? k[C + v - (j + P)] : 0, $ = k[C + v] - o(N, T, G);
              O[I + v] = $;
            }
          }
          function w(k, C, j, O) {
            let I = 0;
            for (let P = 0; P < j; P++) {
              let v = P >= O ? k[C + P - O] : 0, N = C > 0 ? k[C + P - j] : 0, T = C > 0 && P >= O ? k[C + P - (j + O)] : 0, G = k[C + P] - o(v, N, T);
              I += Math.abs(G);
            }
            return I;
          }
          let _ = {
            0: u,
            1: p,
            2: d,
            3: g,
            4: b
          }, S = {
            0: h,
            1: f,
            2: s,
            3: m,
            4: w
          };
          a.exports = function(k, C, j, O, I) {
            let P;
            if (!("filterType" in O) || O.filterType === -1)
              P = [0, 1, 2, 3, 4];
            else if (typeof O.filterType == "number")
              P = [O.filterType];
            else
              throw new Error("unrecognised filter types");
            O.bitDepth === 16 && (I *= 2);
            let v = C * I, N = 0, T = 0, G = i.alloc((v + 1) * j), $ = P[0];
            for (let J = 0; J < j; J++) {
              if (P.length > 1) {
                let st = 1 / 0;
                for (let D = 0; D < P.length; D++) {
                  let E = S[P[D]](k, T, v, I);
                  E < st && ($ = P[D], st = E);
                }
              }
              G[N] = $, N++, _[$](k, T, v, G, N, I), N += v, T += v;
            }
            return G;
          };
        }).call(this);
      }).call(this, t("buffer").Buffer);
    }, { "./paeth-predictor": 15, buffer: 32 }], 7: [function(t, a, e) {
      (function(i) {
        (function() {
          let o = t("util"), u = t("./chunkstream"), h = t("./filter-parse"), p = a.exports = function(f) {
            u.call(this);
            let d = [], s = this;
            this._filter = new h(f, {
              read: this.read.bind(this),
              write: function(g) {
                d.push(g);
              },
              complete: function() {
                s.emit("complete", i.concat(d));
              }
            }), this._filter.start();
          };
          o.inherits(p, u);
        }).call(this);
      }).call(this, t("buffer").Buffer);
    }, { "./chunkstream": 3, "./filter-parse": 9, buffer: 32, util: 84 }], 8: [function(t, a, e) {
      (function(i) {
        (function() {
          let o = t("./sync-reader"), u = t("./filter-parse");
          e.process = function(h, p) {
            let f = [], d = new o(h);
            return new u(p, {
              read: d.read.bind(d),
              write: function(s) {
                f.push(s);
              },
              complete: function() {
              }
            }).start(), d.process(), i.concat(f);
          };
        }).call(this);
      }).call(this, t("buffer").Buffer);
    }, { "./filter-parse": 9, "./sync-reader": 22, buffer: 32 }], 9: [function(t, a, e) {
      (function(i) {
        (function() {
          let o = t("./interlace"), u = t("./paeth-predictor");
          function h(f, d, s) {
            let g = f * d;
            return s !== 8 && (g = Math.ceil(g / (8 / s))), g;
          }
          let p = a.exports = function(f, d) {
            let s = f.width, g = f.height, m = f.interlace, b = f.bpp, w = f.depth;
            if (this.read = d.read, this.write = d.write, this.complete = d.complete, this._imageIndex = 0, this._images = [], m) {
              let _ = o.getImagePasses(s, g);
              for (let S = 0; S < _.length; S++)
                this._images.push({
                  byteWidth: h(_[S].width, b, w),
                  height: _[S].height,
                  lineIndex: 0
                });
            } else
              this._images.push({
                byteWidth: h(s, b, w),
                height: g,
                lineIndex: 0
              });
            w === 8 ? this._xComparison = b : w === 16 ? this._xComparison = b * 2 : this._xComparison = 1;
          };
          p.prototype.start = function() {
            this.read(
              this._images[this._imageIndex].byteWidth + 1,
              this._reverseFilterLine.bind(this)
            );
          }, p.prototype._unFilterType1 = function(f, d, s) {
            let g = this._xComparison, m = g - 1;
            for (let b = 0; b < s; b++) {
              let w = f[1 + b], _ = b > m ? d[b - g] : 0;
              d[b] = w + _;
            }
          }, p.prototype._unFilterType2 = function(f, d, s) {
            let g = this._lastLine;
            for (let m = 0; m < s; m++) {
              let b = f[1 + m], w = g ? g[m] : 0;
              d[m] = b + w;
            }
          }, p.prototype._unFilterType3 = function(f, d, s) {
            let g = this._xComparison, m = g - 1, b = this._lastLine;
            for (let w = 0; w < s; w++) {
              let _ = f[1 + w], S = b ? b[w] : 0, k = w > m ? d[w - g] : 0, C = Math.floor((k + S) / 2);
              d[w] = _ + C;
            }
          }, p.prototype._unFilterType4 = function(f, d, s) {
            let g = this._xComparison, m = g - 1, b = this._lastLine;
            for (let w = 0; w < s; w++) {
              let _ = f[1 + w], S = b ? b[w] : 0, k = w > m ? d[w - g] : 0, C = w > m && b ? b[w - g] : 0, j = u(k, S, C);
              d[w] = _ + j;
            }
          }, p.prototype._reverseFilterLine = function(f) {
            let d = f[0], s, g = this._images[this._imageIndex], m = g.byteWidth;
            if (d === 0)
              s = f.slice(1, m + 1);
            else
              switch (s = i.alloc(m), d) {
                case 1:
                  this._unFilterType1(f, s, m);
                  break;
                case 2:
                  this._unFilterType2(f, s, m);
                  break;
                case 3:
                  this._unFilterType3(f, s, m);
                  break;
                case 4:
                  this._unFilterType4(f, s, m);
                  break;
                default:
                  throw new Error("Unrecognised filter type - " + d);
              }
            this.write(s), g.lineIndex++, g.lineIndex >= g.height ? (this._lastLine = null, this._imageIndex++, g = this._images[this._imageIndex]) : this._lastLine = s, g ? this.read(g.byteWidth + 1, this._reverseFilterLine.bind(this)) : (this._lastLine = null, this.complete());
          };
        }).call(this);
      }).call(this, t("buffer").Buffer);
    }, { "./interlace": 11, "./paeth-predictor": 15, buffer: 32 }], 10: [function(t, a, e) {
      (function(i) {
        (function() {
          function o(p, f, d, s, g) {
            let m = 0;
            for (let b = 0; b < s; b++)
              for (let w = 0; w < d; w++) {
                let _ = g[p[m]];
                if (!_)
                  throw new Error("index " + p[m] + " not in palette");
                for (let S = 0; S < 4; S++)
                  f[m + S] = _[S];
                m += 4;
              }
          }
          function u(p, f, d, s, g) {
            let m = 0;
            for (let b = 0; b < s; b++)
              for (let w = 0; w < d; w++) {
                let _ = !1;
                if (g.length === 1 ? g[0] === p[m] && (_ = !0) : g[0] === p[m] && g[1] === p[m + 1] && g[2] === p[m + 2] && (_ = !0), _)
                  for (let S = 0; S < 4; S++)
                    f[m + S] = 0;
                m += 4;
              }
          }
          function h(p, f, d, s, g) {
            let m = 255, b = Math.pow(2, g) - 1, w = 0;
            for (let _ = 0; _ < s; _++)
              for (let S = 0; S < d; S++) {
                for (let k = 0; k < 4; k++)
                  f[w + k] = Math.floor(
                    p[w + k] * m / b + 0.5
                  );
                w += 4;
              }
          }
          a.exports = function(p, f, d = !1) {
            let s = f.depth, g = f.width, m = f.height, b = f.colorType, w = f.transColor, _ = f.palette, S = p;
            return b === 3 ? o(p, S, g, m, _) : (w && u(p, S, g, m, w), s !== 8 && !d && (s === 16 && (S = i.alloc(g * m * 4)), h(p, S, g, m, s))), S;
          };
        }).call(this);
      }).call(this, t("buffer").Buffer);
    }, { buffer: 32 }], 11: [function(t, a, e) {
      let i = [
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
      e.getImagePasses = function(o, u) {
        let h = [], p = o % 8, f = u % 8, d = (o - p) / 8, s = (u - f) / 8;
        for (let g = 0; g < i.length; g++) {
          let m = i[g], b = d * m.x.length, w = s * m.y.length;
          for (let _ = 0; _ < m.x.length && m.x[_] < p; _++)
            b++;
          for (let _ = 0; _ < m.y.length && m.y[_] < f; _++)
            w++;
          b > 0 && w > 0 && h.push({ width: b, height: w, index: g });
        }
        return h;
      }, e.getInterlaceIterator = function(o) {
        return function(u, h, p) {
          let f = u % i[p].x.length, d = (u - f) / i[p].x.length * 8 + i[p].x[f], s = h % i[p].y.length, g = (h - s) / i[p].y.length * 8 + i[p].y[s];
          return d * 4 + g * o * 4;
        };
      };
    }, {}], 12: [function(t, a, e) {
      (function(i) {
        (function() {
          let o = t("util"), u = t("stream"), h = t("./constants"), p = t("./packer"), f = a.exports = function(d) {
            u.call(this);
            let s = d || {};
            this._packer = new p(s), this._deflate = this._packer.createDeflate(), this.readable = !0;
          };
          o.inherits(f, u), f.prototype.pack = function(d, s, g, m) {
            this.emit("data", i.from(h.PNG_SIGNATURE)), this.emit("data", this._packer.packIHDR(s, g)), m && this.emit("data", this._packer.packGAMA(m));
            let b = this._packer.filterData(d, s, g);
            this._deflate.on("error", this.emit.bind(this, "error")), this._deflate.on(
              "data",
              (function(w) {
                this.emit("data", this._packer.packIDAT(w));
              }).bind(this)
            ), this._deflate.on(
              "end",
              (function() {
                this.emit("data", this._packer.packIEND()), this.emit("end");
              }).bind(this)
            ), this._deflate.end(b);
          };
        }).call(this);
      }).call(this, t("buffer").Buffer);
    }, { "./constants": 4, "./packer": 14, buffer: 32, stream: 65, util: 84 }], 13: [function(t, a, e) {
      (function(i) {
        (function() {
          let o = !0, u = t("zlib");
          u.deflateSync || (o = !1);
          let h = t("./constants"), p = t("./packer");
          a.exports = function(f, d) {
            if (!o)
              throw new Error(
                "To use the sync capability of this library in old node versions, please pin pngjs to v2.3.0"
              );
            let s = d || {}, g = new p(s), m = [];
            m.push(i.from(h.PNG_SIGNATURE)), m.push(g.packIHDR(f.width, f.height)), f.gamma && m.push(g.packGAMA(f.gamma));
            let b = g.filterData(
              f.data,
              f.width,
              f.height
            ), w = u.deflateSync(
              b,
              g.getDeflateOptions()
            );
            if (b = null, !w || !w.length)
              throw new Error("bad png - invalid compressed data response");
            return m.push(g.packIDAT(w)), m.push(g.packIEND()), i.concat(m);
          };
        }).call(this);
      }).call(this, t("buffer").Buffer);
    }, { "./constants": 4, "./packer": 14, buffer: 32, zlib: 31 }], 14: [function(t, a, e) {
      (function(i) {
        (function() {
          let o = t("./constants"), u = t("./crc"), h = t("./bitpacker"), p = t("./filter-pack"), f = t("zlib"), d = a.exports = function(s) {
            if (this._options = s, s.deflateChunkSize = s.deflateChunkSize || 32 * 1024, s.deflateLevel = s.deflateLevel != null ? s.deflateLevel : 9, s.deflateStrategy = s.deflateStrategy != null ? s.deflateStrategy : 3, s.inputHasAlpha = s.inputHasAlpha != null ? s.inputHasAlpha : !0, s.deflateFactory = s.deflateFactory || f.createDeflate, s.bitDepth = s.bitDepth || 8, s.colorType = typeof s.colorType == "number" ? s.colorType : o.COLORTYPE_COLOR_ALPHA, s.inputColorType = typeof s.inputColorType == "number" ? s.inputColorType : o.COLORTYPE_COLOR_ALPHA, [
              o.COLORTYPE_GRAYSCALE,
              o.COLORTYPE_COLOR,
              o.COLORTYPE_COLOR_ALPHA,
              o.COLORTYPE_ALPHA
            ].indexOf(s.colorType) === -1)
              throw new Error(
                "option color type:" + s.colorType + " is not supported at present"
              );
            if ([
              o.COLORTYPE_GRAYSCALE,
              o.COLORTYPE_COLOR,
              o.COLORTYPE_COLOR_ALPHA,
              o.COLORTYPE_ALPHA
            ].indexOf(s.inputColorType) === -1)
              throw new Error(
                "option input color type:" + s.inputColorType + " is not supported at present"
              );
            if (s.bitDepth !== 8 && s.bitDepth !== 16)
              throw new Error(
                "option bit depth:" + s.bitDepth + " is not supported at present"
              );
          };
          d.prototype.getDeflateOptions = function() {
            return {
              chunkSize: this._options.deflateChunkSize,
              level: this._options.deflateLevel,
              strategy: this._options.deflateStrategy
            };
          }, d.prototype.createDeflate = function() {
            return this._options.deflateFactory(this.getDeflateOptions());
          }, d.prototype.filterData = function(s, g, m) {
            let b = h(s, g, m, this._options), w = o.COLORTYPE_TO_BPP_MAP[this._options.colorType];
            return p(b, g, m, this._options, w);
          }, d.prototype._packChunk = function(s, g) {
            let m = g ? g.length : 0, b = i.alloc(m + 12);
            return b.writeUInt32BE(m, 0), b.writeUInt32BE(s, 4), g && g.copy(b, 8), b.writeInt32BE(
              u.crc32(b.slice(4, b.length - 4)),
              b.length - 4
            ), b;
          }, d.prototype.packGAMA = function(s) {
            let g = i.alloc(4);
            return g.writeUInt32BE(Math.floor(s * o.GAMMA_DIVISION), 0), this._packChunk(o.TYPE_gAMA, g);
          }, d.prototype.packIHDR = function(s, g) {
            let m = i.alloc(13);
            return m.writeUInt32BE(s, 0), m.writeUInt32BE(g, 4), m[8] = this._options.bitDepth, m[9] = this._options.colorType, m[10] = 0, m[11] = 0, m[12] = 0, this._packChunk(o.TYPE_IHDR, m);
          }, d.prototype.packIDAT = function(s) {
            return this._packChunk(o.TYPE_IDAT, s);
          }, d.prototype.packIEND = function() {
            return this._packChunk(o.TYPE_IEND, null);
          };
        }).call(this);
      }).call(this, t("buffer").Buffer);
    }, { "./bitpacker": 2, "./constants": 4, "./crc": 5, "./filter-pack": 6, buffer: 32, zlib: 31 }], 15: [function(t, a, e) {
      a.exports = function(i, o, u) {
        let h = i + o - u, p = Math.abs(h - i), f = Math.abs(h - o), d = Math.abs(h - u);
        return p <= f && p <= d ? i : f <= d ? o : u;
      };
    }, {}], 16: [function(t, a, e) {
      let i = t("util"), o = t("zlib"), u = t("./chunkstream"), h = t("./filter-parse-async"), p = t("./parser"), f = t("./bitmapper"), d = t("./format-normaliser"), s = a.exports = function(g) {
        u.call(this), this._parser = new p(g, {
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
        }), this._options = g, this.writable = !0, this._parser.start();
      };
      i.inherits(s, u), s.prototype._handleError = function(g) {
        this.emit("error", g), this.writable = !1, this.destroy(), this._inflate && this._inflate.destroy && this._inflate.destroy(), this._filter && (this._filter.destroy(), this._filter.on("error", function() {
        })), this.errord = !0;
      }, s.prototype._inflateData = function(g) {
        if (!this._inflate)
          if (this._bitmapInfo.interlace)
            this._inflate = o.createInflate(), this._inflate.on("error", this.emit.bind(this, "error")), this._filter.on("complete", this._complete.bind(this)), this._inflate.pipe(this._filter);
          else {
            let m = ((this._bitmapInfo.width * this._bitmapInfo.bpp * this._bitmapInfo.depth + 7 >> 3) + 1) * this._bitmapInfo.height, b = Math.max(m, o.Z_MIN_CHUNK);
            this._inflate = o.createInflate({ chunkSize: b });
            let w = m, _ = this.emit.bind(this, "error");
            this._inflate.on("error", function(k) {
              w && _(k);
            }), this._filter.on("complete", this._complete.bind(this));
            let S = this._filter.write.bind(this._filter);
            this._inflate.on("data", function(k) {
              w && (k.length > w && (k = k.slice(0, w)), w -= k.length, S(k));
            }), this._inflate.on("end", this._filter.end.bind(this._filter));
          }
        this._inflate.write(g);
      }, s.prototype._handleMetaData = function(g) {
        this._metaData = g, this._bitmapInfo = Object.create(g), this._filter = new h(this._bitmapInfo);
      }, s.prototype._handleTransColor = function(g) {
        this._bitmapInfo.transColor = g;
      }, s.prototype._handlePalette = function(g) {
        this._bitmapInfo.palette = g;
      }, s.prototype._simpleTransparency = function() {
        this._metaData.alpha = !0;
      }, s.prototype._headersFinished = function() {
        this.emit("metadata", this._metaData);
      }, s.prototype._finished = function() {
        this.errord || (this._inflate ? this._inflate.end() : this.emit("error", "No Inflate block"));
      }, s.prototype._complete = function(g) {
        if (this.errord)
          return;
        let m;
        try {
          let b = f.dataToBitMap(g, this._bitmapInfo);
          m = d(
            b,
            this._bitmapInfo,
            this._options.skipRescale
          ), b = null;
        } catch (b) {
          this._handleError(b);
          return;
        }
        this.emit("parsed", m);
      };
    }, { "./bitmapper": 1, "./chunkstream": 3, "./filter-parse-async": 7, "./format-normaliser": 10, "./parser": 18, util: 84, zlib: 31 }], 17: [function(t, a, e) {
      (function(i) {
        (function() {
          let o = !0, u = t("zlib"), h = t("./sync-inflate");
          u.deflateSync || (o = !1);
          let p = t("./sync-reader"), f = t("./filter-parse-sync"), d = t("./parser"), s = t("./bitmapper"), g = t("./format-normaliser");
          a.exports = function(m, b) {
            if (!o)
              throw new Error(
                "To use the sync capability of this library in old node versions, please pin pngjs to v2.3.0"
              );
            let w;
            function _(E) {
              w = E;
            }
            let S;
            function k(E) {
              S = E;
            }
            function C(E) {
              S.transColor = E;
            }
            function j(E) {
              S.palette = E;
            }
            function O() {
              S.alpha = !0;
            }
            let I;
            function P(E) {
              I = E;
            }
            let v = [];
            function N(E) {
              v.push(E);
            }
            let T = new p(m);
            if (new d(b, {
              read: T.read.bind(T),
              error: _,
              metadata: k,
              gamma: P,
              palette: j,
              transColor: C,
              inflateData: N,
              simpleTransparency: O
            }).start(), T.process(), w)
              throw w;
            let G = i.concat(v);
            v.length = 0;
            let $;
            if (S.interlace)
              $ = u.inflateSync(G);
            else {
              let E = ((S.width * S.bpp * S.depth + 7 >> 3) + 1) * S.height;
              $ = h(G, {
                chunkSize: E,
                maxLength: E
              });
            }
            if (G = null, !$ || !$.length)
              throw new Error("bad png - invalid inflate data response");
            let J = f.process($, S);
            G = null;
            let st = s.dataToBitMap(J, S);
            J = null;
            let D = g(
              st,
              S,
              b.skipRescale
            );
            return S.data = D, S.gamma = I || 0, S;
          };
        }).call(this);
      }).call(this, t("buffer").Buffer);
    }, { "./bitmapper": 1, "./filter-parse-sync": 8, "./format-normaliser": 10, "./parser": 18, "./sync-inflate": 21, "./sync-reader": 22, buffer: 32, zlib: 31 }], 18: [function(t, a, e) {
      (function(i) {
        (function() {
          let o = t("./constants"), u = t("./crc"), h = a.exports = function(p, f) {
            this._options = p, p.checkCRC = p.checkCRC !== !1, this._hasIHDR = !1, this._hasIEND = !1, this._emittedHeadersFinished = !1, this._palette = [], this._colorType = 0, this._chunks = {}, this._chunks[o.TYPE_IHDR] = this._handleIHDR.bind(this), this._chunks[o.TYPE_IEND] = this._handleIEND.bind(this), this._chunks[o.TYPE_IDAT] = this._handleIDAT.bind(this), this._chunks[o.TYPE_PLTE] = this._handlePLTE.bind(this), this._chunks[o.TYPE_tRNS] = this._handleTRNS.bind(this), this._chunks[o.TYPE_gAMA] = this._handleGAMA.bind(this), this.read = f.read, this.error = f.error, this.metadata = f.metadata, this.gamma = f.gamma, this.transColor = f.transColor, this.palette = f.palette, this.parsed = f.parsed, this.inflateData = f.inflateData, this.finished = f.finished, this.simpleTransparency = f.simpleTransparency, this.headersFinished = f.headersFinished || function() {
            };
          };
          h.prototype.start = function() {
            this.read(o.PNG_SIGNATURE.length, this._parseSignature.bind(this));
          }, h.prototype._parseSignature = function(p) {
            let f = o.PNG_SIGNATURE;
            for (let d = 0; d < f.length; d++)
              if (p[d] !== f[d]) {
                this.error(new Error("Invalid file signature"));
                return;
              }
            this.read(8, this._parseChunkBegin.bind(this));
          }, h.prototype._parseChunkBegin = function(p) {
            let f = p.readUInt32BE(0), d = p.readUInt32BE(4), s = "";
            for (let m = 4; m < 8; m++)
              s += String.fromCharCode(p[m]);
            let g = !!(p[4] & 32);
            if (!this._hasIHDR && d !== o.TYPE_IHDR) {
              this.error(new Error("Expected IHDR on beggining"));
              return;
            }
            if (this._crc = new u(), this._crc.write(i.from(s)), this._chunks[d])
              return this._chunks[d](f);
            if (!g) {
              this.error(new Error("Unsupported critical chunk type " + s));
              return;
            }
            this.read(f + 4, this._skipChunk.bind(this));
          }, h.prototype._skipChunk = function() {
            this.read(8, this._parseChunkBegin.bind(this));
          }, h.prototype._handleChunkEnd = function() {
            this.read(4, this._parseChunkEnd.bind(this));
          }, h.prototype._parseChunkEnd = function(p) {
            let f = p.readInt32BE(0), d = this._crc.crc32();
            if (this._options.checkCRC && d !== f) {
              this.error(new Error("Crc error - " + f + " - " + d));
              return;
            }
            this._hasIEND || this.read(8, this._parseChunkBegin.bind(this));
          }, h.prototype._handleIHDR = function(p) {
            this.read(p, this._parseIHDR.bind(this));
          }, h.prototype._parseIHDR = function(p) {
            this._crc.write(p);
            let f = p.readUInt32BE(0), d = p.readUInt32BE(4), s = p[8], g = p[9], m = p[10], b = p[11], w = p[12];
            if (s !== 8 && s !== 4 && s !== 2 && s !== 1 && s !== 16) {
              this.error(new Error("Unsupported bit depth " + s));
              return;
            }
            if (!(g in o.COLORTYPE_TO_BPP_MAP)) {
              this.error(new Error("Unsupported color type"));
              return;
            }
            if (m !== 0) {
              this.error(new Error("Unsupported compression method"));
              return;
            }
            if (b !== 0) {
              this.error(new Error("Unsupported filter method"));
              return;
            }
            if (w !== 0 && w !== 1) {
              this.error(new Error("Unsupported interlace method"));
              return;
            }
            this._colorType = g;
            let _ = o.COLORTYPE_TO_BPP_MAP[this._colorType];
            this._hasIHDR = !0, this.metadata({
              width: f,
              height: d,
              depth: s,
              interlace: !!w,
              palette: !!(g & o.COLORTYPE_PALETTE),
              color: !!(g & o.COLORTYPE_COLOR),
              alpha: !!(g & o.COLORTYPE_ALPHA),
              bpp: _,
              colorType: g
            }), this._handleChunkEnd();
          }, h.prototype._handlePLTE = function(p) {
            this.read(p, this._parsePLTE.bind(this));
          }, h.prototype._parsePLTE = function(p) {
            this._crc.write(p);
            let f = Math.floor(p.length / 3);
            for (let d = 0; d < f; d++)
              this._palette.push([p[d * 3], p[d * 3 + 1], p[d * 3 + 2], 255]);
            this.palette(this._palette), this._handleChunkEnd();
          }, h.prototype._handleTRNS = function(p) {
            this.simpleTransparency(), this.read(p, this._parseTRNS.bind(this));
          }, h.prototype._parseTRNS = function(p) {
            if (this._crc.write(p), this._colorType === o.COLORTYPE_PALETTE_COLOR) {
              if (this._palette.length === 0) {
                this.error(new Error("Transparency chunk must be after palette"));
                return;
              }
              if (p.length > this._palette.length) {
                this.error(new Error("More transparent colors than palette size"));
                return;
              }
              for (let f = 0; f < p.length; f++)
                this._palette[f][3] = p[f];
              this.palette(this._palette);
            }
            this._colorType === o.COLORTYPE_GRAYSCALE && this.transColor([p.readUInt16BE(0)]), this._colorType === o.COLORTYPE_COLOR && this.transColor([
              p.readUInt16BE(0),
              p.readUInt16BE(2),
              p.readUInt16BE(4)
            ]), this._handleChunkEnd();
          }, h.prototype._handleGAMA = function(p) {
            this.read(p, this._parseGAMA.bind(this));
          }, h.prototype._parseGAMA = function(p) {
            this._crc.write(p), this.gamma(p.readUInt32BE(0) / o.GAMMA_DIVISION), this._handleChunkEnd();
          }, h.prototype._handleIDAT = function(p) {
            this._emittedHeadersFinished || (this._emittedHeadersFinished = !0, this.headersFinished()), this.read(-p, this._parseIDAT.bind(this, p));
          }, h.prototype._parseIDAT = function(p, f) {
            if (this._crc.write(f), this._colorType === o.COLORTYPE_PALETTE_COLOR && this._palette.length === 0)
              throw new Error("Expected palette not found");
            this.inflateData(f);
            let d = p - f.length;
            d > 0 ? this._handleIDAT(d) : this._handleChunkEnd();
          }, h.prototype._handleIEND = function(p) {
            this.read(p, this._parseIEND.bind(this));
          }, h.prototype._parseIEND = function(p) {
            this._crc.write(p), this._hasIEND = !0, this._handleChunkEnd(), this.finished && this.finished();
          };
        }).call(this);
      }).call(this, t("buffer").Buffer);
    }, { "./constants": 4, "./crc": 5, buffer: 32 }], 19: [function(t, a, e) {
      let i = t("./parser-sync"), o = t("./packer-sync");
      e.read = function(u, h) {
        return i(u, h || {});
      }, e.write = function(u, h) {
        return o(u, h);
      };
    }, { "./packer-sync": 13, "./parser-sync": 17 }], 20: [function(t, a, e) {
      (function(i, o) {
        (function() {
          let u = t("util"), h = t("stream"), p = t("./parser-async"), f = t("./packer-async"), d = t("./png-sync"), s = e.PNG = function(g) {
            h.call(this), g = g || {}, this.width = g.width | 0, this.height = g.height | 0, this.data = this.width > 0 && this.height > 0 ? o.alloc(4 * this.width * this.height) : null, g.fill && this.data && this.data.fill(0), this.gamma = 0, this.readable = this.writable = !0, this._parser = new p(g), this._parser.on("error", this.emit.bind(this, "error")), this._parser.on("close", this._handleClose.bind(this)), this._parser.on("metadata", this._metadata.bind(this)), this._parser.on("gamma", this._gamma.bind(this)), this._parser.on(
              "parsed",
              (function(m) {
                this.data = m, this.emit("parsed", m);
              }).bind(this)
            ), this._packer = new f(g), this._packer.on("data", this.emit.bind(this, "data")), this._packer.on("end", this.emit.bind(this, "end")), this._parser.on("close", this._handleClose.bind(this)), this._packer.on("error", this.emit.bind(this, "error"));
          };
          u.inherits(s, h), s.sync = d, s.prototype.pack = function() {
            return !this.data || !this.data.length ? (this.emit("error", "No data provided"), this) : (i.nextTick(
              (function() {
                this._packer.pack(this.data, this.width, this.height, this.gamma);
              }).bind(this)
            ), this);
          }, s.prototype.parse = function(g, m) {
            if (m) {
              let b, w;
              b = (function(_) {
                this.removeListener("error", w), this.data = _, m(null, this);
              }).bind(this), w = (function(_) {
                this.removeListener("parsed", b), m(_, null);
              }).bind(this), this.once("parsed", b), this.once("error", w);
            }
            return this.end(g), this;
          }, s.prototype.write = function(g) {
            return this._parser.write(g), !0;
          }, s.prototype.end = function(g) {
            this._parser.end(g);
          }, s.prototype._metadata = function(g) {
            this.width = g.width, this.height = g.height, this.emit("metadata", g);
          }, s.prototype._gamma = function(g) {
            this.gamma = g;
          }, s.prototype._handleClose = function() {
            !this._parser.writable && !this._packer.readable && this.emit("close");
          }, s.bitblt = function(g, m, b, w, _, S, k, C) {
            if (b |= 0, w |= 0, _ |= 0, S |= 0, k |= 0, C |= 0, b > g.width || w > g.height || b + _ > g.width || w + S > g.height)
              throw new Error("bitblt reading outside image");
            if (k > m.width || C > m.height || k + _ > m.width || C + S > m.height)
              throw new Error("bitblt writing outside image");
            for (let j = 0; j < S; j++)
              g.data.copy(
                m.data,
                (C + j) * m.width + k << 2,
                (w + j) * g.width + b << 2,
                (w + j) * g.width + b + _ << 2
              );
          }, s.prototype.bitblt = function(g, m, b, w, _, S, k) {
            return s.bitblt(this, g, m, b, w, _, S, k), this;
          }, s.adjustGamma = function(g) {
            if (g.gamma) {
              for (let m = 0; m < g.height; m++)
                for (let b = 0; b < g.width; b++) {
                  let w = g.width * m + b << 2;
                  for (let _ = 0; _ < 3; _++) {
                    let S = g.data[w + _] / 255;
                    S = Math.pow(S, 1 / 2.2 / g.gamma), g.data[w + _] = Math.round(S * 255);
                  }
                }
              g.gamma = 0;
            }
          }, s.prototype.adjustGamma = function() {
            s.adjustGamma(this);
          };
        }).call(this);
      }).call(this, t("_process"), t("buffer").Buffer);
    }, { "./packer-async": 12, "./parser-async": 16, "./png-sync": 19, _process: 63, buffer: 32, stream: 65, util: 84 }], 21: [function(t, a, e) {
      (function(i, o) {
        (function() {
          let u = t("assert").ok, h = t("zlib"), p = t("util"), f = t("buffer").kMaxLength;
          function d(w) {
            if (!(this instanceof d))
              return new d(w);
            w && w.chunkSize < h.Z_MIN_CHUNK && (w.chunkSize = h.Z_MIN_CHUNK), h.Inflate.call(this, w), this._offset = this._offset === void 0 ? this._outOffset : this._offset, this._buffer = this._buffer || this._outBuffer, w && w.maxLength != null && (this._maxLength = w.maxLength);
          }
          function s(w) {
            return new d(w);
          }
          function g(w, _) {
            w._handle && (w._handle.close(), w._handle = null);
          }
          d.prototype._processChunk = function(w, _, S) {
            if (typeof S == "function")
              return h.Inflate._processChunk.call(this, w, _, S);
            let k = this, C = w && w.length, j = this._chunkSize - this._offset, O = this._maxLength, I = 0, P = [], v = 0, N;
            this.on("error", function(J) {
              N = J;
            });
            function T(J, st) {
              if (k._hadError)
                return;
              let D = j - st;
              if (u(D >= 0, "have should not go down"), D > 0) {
                let E = k._buffer.slice(k._offset, k._offset + D);
                if (k._offset += D, E.length > O && (E = E.slice(0, O)), P.push(E), v += E.length, O -= E.length, O === 0)
                  return !1;
              }
              return (st === 0 || k._offset >= k._chunkSize) && (j = k._chunkSize, k._offset = 0, k._buffer = o.allocUnsafe(k._chunkSize)), st === 0 ? (I += C - J, C = J, !0) : !1;
            }
            u(this._handle, "zlib binding closed");
            let G;
            do
              G = this._handle.writeSync(
                _,
                w,
                // in
                I,
                // in_off
                C,
                // in_len
                this._buffer,
                // out
                this._offset,
                //out_off
                j
              ), G = G || this._writeState;
            while (!this._hadError && T(G[0], G[1]));
            if (this._hadError)
              throw N;
            if (v >= f)
              throw g(this), new RangeError(
                "Cannot create final Buffer. It would be larger than 0x" + f.toString(16) + " bytes"
              );
            let $ = o.concat(P, v);
            return g(this), $;
          }, p.inherits(d, h.Inflate);
          function m(w, _) {
            if (typeof _ == "string" && (_ = o.from(_)), !(_ instanceof o))
              throw new TypeError("Not a string or buffer");
            let S = w._finishFlushFlag;
            return S == null && (S = h.Z_FINISH), w._processChunk(_, S);
          }
          function b(w, _) {
            return m(new d(_), w);
          }
          a.exports = e = b, e.Inflate = d, e.createInflate = s, e.inflateSync = b;
        }).call(this);
      }).call(this, t("_process"), t("buffer").Buffer);
    }, { _process: 63, assert: 23, buffer: 32, util: 84, zlib: 31 }], 22: [function(t, a, e) {
      let i = a.exports = function(o) {
        this._buffer = o, this._reads = [];
      };
      i.prototype.read = function(o, u) {
        this._reads.push({
          length: Math.abs(o),
          // if length < 0 then at most this length
          allowLess: o < 0,
          func: u
        });
      }, i.prototype.process = function() {
        for (; this._reads.length > 0 && this._buffer.length; ) {
          let o = this._reads[0];
          if (this._buffer.length && (this._buffer.length >= o.length || o.allowLess)) {
            this._reads.shift();
            let u = this._buffer;
            this._buffer = u.slice(o.length), o.func.call(this, u.slice(0, o.length));
          } else
            break;
        }
        if (this._reads.length > 0)
          throw new Error("There are some read requests waitng on finished stream");
        if (this._buffer.length > 0)
          throw new Error("unrecognised content at end of stream");
      };
    }, {}], 23: [function(t, a, e) {
      (function(i) {
        (function() {
          var o = t("object-assign");
          /*!
           * The buffer module from node.js, for the browser.
           *
           * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
           * @license  MIT
           */
          function u(D, E) {
            if (D === E)
              return 0;
            for (var Z = D.length, nt = E.length, ut = 0, Et = Math.min(Z, nt); ut < Et; ++ut)
              if (D[ut] !== E[ut]) {
                Z = D[ut], nt = E[ut];
                break;
              }
            return Z < nt ? -1 : nt < Z ? 1 : 0;
          }
          function h(D) {
            return i.Buffer && typeof i.Buffer.isBuffer == "function" ? i.Buffer.isBuffer(D) : !!(D != null && D._isBuffer);
          }
          var p = t("util/"), f = Object.prototype.hasOwnProperty, d = Array.prototype.slice, s = (function() {
            return (function() {
            }).name === "foo";
          })();
          function g(D) {
            return Object.prototype.toString.call(D);
          }
          function m(D) {
            return h(D) || typeof i.ArrayBuffer != "function" ? !1 : typeof ArrayBuffer.isView == "function" ? ArrayBuffer.isView(D) : D ? !!(D instanceof DataView || D.buffer && D.buffer instanceof ArrayBuffer) : !1;
          }
          var b = a.exports = O, w = /\s*function\s+([^\(\s]*)\s*/;
          function _(D) {
            if (p.isFunction(D)) {
              if (s)
                return D.name;
              var E = D.toString(), Z = E.match(w);
              return Z && Z[1];
            }
          }
          b.AssertionError = function(D) {
            this.name = "AssertionError", this.actual = D.actual, this.expected = D.expected, this.operator = D.operator, D.message ? (this.message = D.message, this.generatedMessage = !1) : (this.message = C(this), this.generatedMessage = !0);
            var E = D.stackStartFunction || j;
            if (Error.captureStackTrace)
              Error.captureStackTrace(this, E);
            else {
              var Z = new Error();
              if (Z.stack) {
                var nt = Z.stack, ut = _(E), Et = nt.indexOf(`
` + ut);
                if (Et >= 0) {
                  var it = nt.indexOf(`
`, Et + 1);
                  nt = nt.substring(it + 1);
                }
                this.stack = nt;
              }
            }
          }, p.inherits(b.AssertionError, Error);
          function S(D, E) {
            return typeof D == "string" ? D.length < E ? D : D.slice(0, E) : D;
          }
          function k(D) {
            if (s || !p.isFunction(D))
              return p.inspect(D);
            var E = _(D), Z = E ? ": " + E : "";
            return "[Function" + Z + "]";
          }
          function C(D) {
            return S(k(D.actual), 128) + " " + D.operator + " " + S(k(D.expected), 128);
          }
          function j(D, E, Z, nt, ut) {
            throw new b.AssertionError({
              message: Z,
              actual: D,
              expected: E,
              operator: nt,
              stackStartFunction: ut
            });
          }
          b.fail = j;
          function O(D, E) {
            D || j(D, !0, E, "==", b.ok);
          }
          b.ok = O, b.equal = function(D, E, Z) {
            D != E && j(D, E, Z, "==", b.equal);
          }, b.notEqual = function(D, E, Z) {
            D == E && j(D, E, Z, "!=", b.notEqual);
          }, b.deepEqual = function(D, E, Z) {
            I(D, E, !1) || j(D, E, Z, "deepEqual", b.deepEqual);
          }, b.deepStrictEqual = function(D, E, Z) {
            I(D, E, !0) || j(D, E, Z, "deepStrictEqual", b.deepStrictEqual);
          };
          function I(D, E, Z, nt) {
            if (D === E)
              return !0;
            if (h(D) && h(E))
              return u(D, E) === 0;
            if (p.isDate(D) && p.isDate(E))
              return D.getTime() === E.getTime();
            if (p.isRegExp(D) && p.isRegExp(E))
              return D.source === E.source && D.global === E.global && D.multiline === E.multiline && D.lastIndex === E.lastIndex && D.ignoreCase === E.ignoreCase;
            if ((D === null || typeof D != "object") && (E === null || typeof E != "object"))
              return Z ? D === E : D == E;
            if (m(D) && m(E) && g(D) === g(E) && !(D instanceof Float32Array || D instanceof Float64Array))
              return u(
                new Uint8Array(D.buffer),
                new Uint8Array(E.buffer)
              ) === 0;
            if (h(D) !== h(E))
              return !1;
            nt = nt || { actual: [], expected: [] };
            var ut = nt.actual.indexOf(D);
            return ut !== -1 && ut === nt.expected.indexOf(E) ? !0 : (nt.actual.push(D), nt.expected.push(E), v(D, E, Z, nt));
          }
          function P(D) {
            return Object.prototype.toString.call(D) == "[object Arguments]";
          }
          function v(D, E, Z, nt) {
            if (D == null || E === null || E === void 0)
              return !1;
            if (p.isPrimitive(D) || p.isPrimitive(E))
              return D === E;
            if (Z && Object.getPrototypeOf(D) !== Object.getPrototypeOf(E))
              return !1;
            var ut = P(D), Et = P(E);
            if (ut && !Et || !ut && Et)
              return !1;
            if (ut)
              return D = d.call(D), E = d.call(E), I(D, E, Z);
            var it = st(D), U = st(E), W, V;
            if (it.length !== U.length)
              return !1;
            for (it.sort(), U.sort(), V = it.length - 1; V >= 0; V--)
              if (it[V] !== U[V])
                return !1;
            for (V = it.length - 1; V >= 0; V--)
              if (W = it[V], !I(D[W], E[W], Z, nt))
                return !1;
            return !0;
          }
          b.notDeepEqual = function(D, E, Z) {
            I(D, E, !1) && j(D, E, Z, "notDeepEqual", b.notDeepEqual);
          }, b.notDeepStrictEqual = N;
          function N(D, E, Z) {
            I(D, E, !0) && j(D, E, Z, "notDeepStrictEqual", N);
          }
          b.strictEqual = function(D, E, Z) {
            D !== E && j(D, E, Z, "===", b.strictEqual);
          }, b.notStrictEqual = function(D, E, Z) {
            D === E && j(D, E, Z, "!==", b.notStrictEqual);
          };
          function T(D, E) {
            if (!D || !E)
              return !1;
            if (Object.prototype.toString.call(E) == "[object RegExp]")
              return E.test(D);
            try {
              if (D instanceof E)
                return !0;
            } catch {
            }
            return Error.isPrototypeOf(E) ? !1 : E.call({}, D) === !0;
          }
          function G(D) {
            var E;
            try {
              D();
            } catch (Z) {
              E = Z;
            }
            return E;
          }
          function $(D, E, Z, nt) {
            var ut;
            if (typeof E != "function")
              throw new TypeError('"block" argument must be a function');
            typeof Z == "string" && (nt = Z, Z = null), ut = G(E), nt = (Z && Z.name ? " (" + Z.name + ")." : ".") + (nt ? " " + nt : "."), D && !ut && j(ut, Z, "Missing expected exception" + nt);
            var Et = typeof nt == "string", it = !D && p.isError(ut), U = !D && ut && !Z;
            if ((it && Et && T(ut, Z) || U) && j(ut, Z, "Got unwanted exception" + nt), D && ut && Z && !T(ut, Z) || !D && ut)
              throw ut;
          }
          b.throws = function(D, E, Z) {
            $(!0, D, E, Z);
          }, b.doesNotThrow = function(D, E, Z) {
            $(!1, D, E, Z);
          }, b.ifError = function(D) {
            if (D)
              throw D;
          };
          function J(D, E) {
            D || j(D, !0, E, "==", J);
          }
          b.strict = o(J, b, {
            equal: b.strictEqual,
            deepEqual: b.deepStrictEqual,
            notEqual: b.notStrictEqual,
            notDeepEqual: b.notDeepStrictEqual
          }), b.strict.strict = b.strict;
          var st = Object.keys || function(D) {
            var E = [];
            for (var Z in D)
              f.call(D, Z) && E.push(Z);
            return E;
          };
        }).call(this);
      }).call(this, typeof ee < "u" ? ee : typeof self < "u" ? self : typeof window < "u" ? window : {});
    }, { "object-assign": 51, "util/": 26 }], 24: [function(t, a, e) {
      typeof Object.create == "function" ? a.exports = function(i, o) {
        i.super_ = o, i.prototype = Object.create(o.prototype, {
          constructor: {
            value: i,
            enumerable: !1,
            writable: !0,
            configurable: !0
          }
        });
      } : a.exports = function(i, o) {
        i.super_ = o;
        var u = function() {
        };
        u.prototype = o.prototype, i.prototype = new u(), i.prototype.constructor = i;
      };
    }, {}], 25: [function(t, a, e) {
      a.exports = function(i) {
        return i && typeof i == "object" && typeof i.copy == "function" && typeof i.fill == "function" && typeof i.readUInt8 == "function";
      };
    }, {}], 26: [function(t, a, e) {
      (function(i, o) {
        (function() {
          var u = /%[sdj%]/g;
          e.format = function(U) {
            if (!v(U)) {
              for (var W = [], V = 0; V < arguments.length; V++)
                W.push(f(arguments[V]));
              return W.join(" ");
            }
            for (var V = 1, ft = arguments, q = ft.length, Y = String(U).replace(u, function(bt) {
              if (bt === "%%")
                return "%";
              if (V >= q)
                return bt;
              switch (bt) {
                case "%s":
                  return String(ft[V++]);
                case "%d":
                  return Number(ft[V++]);
                case "%j":
                  try {
                    return JSON.stringify(ft[V++]);
                  } catch {
                    return "[Circular]";
                  }
                default:
                  return bt;
              }
            }), Q = ft[V]; V < q; Q = ft[++V])
              O(Q) || !$(Q) ? Y += " " + Q : Y += " " + f(Q);
            return Y;
          }, e.deprecate = function(U, W) {
            if (T(o.process))
              return function() {
                return e.deprecate(U, W).apply(this, arguments);
              };
            if (i.noDeprecation === !0)
              return U;
            var V = !1;
            function ft() {
              if (!V) {
                if (i.throwDeprecation)
                  throw new Error(W);
                i.traceDeprecation ? console.trace(W) : console.error(W), V = !0;
              }
              return U.apply(this, arguments);
            }
            return ft;
          };
          var h = {}, p;
          e.debuglog = function(U) {
            if (T(p) && (p = i.env.NODE_DEBUG || ""), U = U.toUpperCase(), !h[U])
              if (new RegExp("\\b" + U + "\\b", "i").test(p)) {
                var W = i.pid;
                h[U] = function() {
                  var V = e.format.apply(e, arguments);
                  console.error("%s %d: %s", U, W, V);
                };
              } else
                h[U] = function() {
                };
            return h[U];
          };
          function f(U, W) {
            var V = {
              seen: [],
              stylize: s
            };
            return arguments.length >= 3 && (V.depth = arguments[2]), arguments.length >= 4 && (V.colors = arguments[3]), j(W) ? V.showHidden = W : W && e._extend(V, W), T(V.showHidden) && (V.showHidden = !1), T(V.depth) && (V.depth = 2), T(V.colors) && (V.colors = !1), T(V.customInspect) && (V.customInspect = !0), V.colors && (V.stylize = d), m(V, U, V.depth);
          }
          e.inspect = f, f.colors = {
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
          }, f.styles = {
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
          function d(U, W) {
            var V = f.styles[W];
            return V ? "\x1B[" + f.colors[V][0] + "m" + U + "\x1B[" + f.colors[V][1] + "m" : U;
          }
          function s(U, W) {
            return U;
          }
          function g(U) {
            var W = {};
            return U.forEach(function(V, ft) {
              W[V] = !0;
            }), W;
          }
          function m(U, W, V) {
            if (U.customInspect && W && D(W.inspect) && // Filter out the util module, it's inspect function is special
            W.inspect !== e.inspect && // Also filter out any prototype objects using the circular check.
            !(W.constructor && W.constructor.prototype === W)) {
              var ft = W.inspect(V, U);
              return v(ft) || (ft = m(U, ft, V)), ft;
            }
            var q = b(U, W);
            if (q)
              return q;
            var Y = Object.keys(W), Q = g(Y);
            if (U.showHidden && (Y = Object.getOwnPropertyNames(W)), st(W) && (Y.indexOf("message") >= 0 || Y.indexOf("description") >= 0))
              return w(W);
            if (Y.length === 0) {
              if (D(W)) {
                var ct = W.name ? ": " + W.name : "";
                return U.stylize("[Function" + ct + "]", "special");
              }
              if (G(W))
                return U.stylize(RegExp.prototype.toString.call(W), "regexp");
              if (J(W))
                return U.stylize(Date.prototype.toString.call(W), "date");
              if (st(W))
                return w(W);
            }
            var bt = "", gt = !1, z = ["{", "}"];
            if (C(W) && (gt = !0, z = ["[", "]"]), D(W)) {
              var X = W.name ? ": " + W.name : "";
              bt = " [Function" + X + "]";
            }
            if (G(W) && (bt = " " + RegExp.prototype.toString.call(W)), J(W) && (bt = " " + Date.prototype.toUTCString.call(W)), st(W) && (bt = " " + w(W)), Y.length === 0 && (!gt || W.length == 0))
              return z[0] + bt + z[1];
            if (V < 0)
              return G(W) ? U.stylize(RegExp.prototype.toString.call(W), "regexp") : U.stylize("[Object]", "special");
            U.seen.push(W);
            var ot;
            return gt ? ot = _(U, W, V, Q, Y) : ot = Y.map(function(vt) {
              return S(U, W, V, Q, vt, gt);
            }), U.seen.pop(), k(ot, bt, z);
          }
          function b(U, W) {
            if (T(W))
              return U.stylize("undefined", "undefined");
            if (v(W)) {
              var V = "'" + JSON.stringify(W).replace(/^"|"$/g, "").replace(/'/g, "\\'").replace(/\\"/g, '"') + "'";
              return U.stylize(V, "string");
            }
            if (P(W))
              return U.stylize("" + W, "number");
            if (j(W))
              return U.stylize("" + W, "boolean");
            if (O(W))
              return U.stylize("null", "null");
          }
          function w(U) {
            return "[" + Error.prototype.toString.call(U) + "]";
          }
          function _(U, W, V, ft, q) {
            for (var Y = [], Q = 0, ct = W.length; Q < ct; ++Q)
              it(W, String(Q)) ? Y.push(S(
                U,
                W,
                V,
                ft,
                String(Q),
                !0
              )) : Y.push("");
            return q.forEach(function(bt) {
              bt.match(/^\d+$/) || Y.push(S(
                U,
                W,
                V,
                ft,
                bt,
                !0
              ));
            }), Y;
          }
          function S(U, W, V, ft, q, Y) {
            var Q, ct, bt;
            if (bt = Object.getOwnPropertyDescriptor(W, q) || { value: W[q] }, bt.get ? bt.set ? ct = U.stylize("[Getter/Setter]", "special") : ct = U.stylize("[Getter]", "special") : bt.set && (ct = U.stylize("[Setter]", "special")), it(ft, q) || (Q = "[" + q + "]"), ct || (U.seen.indexOf(bt.value) < 0 ? (O(V) ? ct = m(U, bt.value, null) : ct = m(U, bt.value, V - 1), ct.indexOf(`
`) > -1 && (Y ? ct = ct.split(`
`).map(function(gt) {
              return "  " + gt;
            }).join(`
`).substr(2) : ct = `
` + ct.split(`
`).map(function(gt) {
              return "   " + gt;
            }).join(`
`))) : ct = U.stylize("[Circular]", "special")), T(Q)) {
              if (Y && q.match(/^\d+$/))
                return ct;
              Q = JSON.stringify("" + q), Q.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/) ? (Q = Q.substr(1, Q.length - 2), Q = U.stylize(Q, "name")) : (Q = Q.replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'"), Q = U.stylize(Q, "string"));
            }
            return Q + ": " + ct;
          }
          function k(U, W, V) {
            var ft = U.reduce(function(q, Y) {
              return Y.indexOf(`
`) >= 0, q + Y.replace(/\u001b\[\d\d?m/g, "").length + 1;
            }, 0);
            return ft > 60 ? V[0] + (W === "" ? "" : W + `
 `) + " " + U.join(`,
  `) + " " + V[1] : V[0] + W + " " + U.join(", ") + " " + V[1];
          }
          function C(U) {
            return Array.isArray(U);
          }
          e.isArray = C;
          function j(U) {
            return typeof U == "boolean";
          }
          e.isBoolean = j;
          function O(U) {
            return U === null;
          }
          e.isNull = O;
          function I(U) {
            return U == null;
          }
          e.isNullOrUndefined = I;
          function P(U) {
            return typeof U == "number";
          }
          e.isNumber = P;
          function v(U) {
            return typeof U == "string";
          }
          e.isString = v;
          function N(U) {
            return typeof U == "symbol";
          }
          e.isSymbol = N;
          function T(U) {
            return U === void 0;
          }
          e.isUndefined = T;
          function G(U) {
            return $(U) && Z(U) === "[object RegExp]";
          }
          e.isRegExp = G;
          function $(U) {
            return typeof U == "object" && U !== null;
          }
          e.isObject = $;
          function J(U) {
            return $(U) && Z(U) === "[object Date]";
          }
          e.isDate = J;
          function st(U) {
            return $(U) && (Z(U) === "[object Error]" || U instanceof Error);
          }
          e.isError = st;
          function D(U) {
            return typeof U == "function";
          }
          e.isFunction = D;
          function E(U) {
            return U === null || typeof U == "boolean" || typeof U == "number" || typeof U == "string" || typeof U == "symbol" || // ES6 symbol
            typeof U > "u";
          }
          e.isPrimitive = E, e.isBuffer = t("./support/isBuffer");
          function Z(U) {
            return Object.prototype.toString.call(U);
          }
          function nt(U) {
            return U < 10 ? "0" + U.toString(10) : U.toString(10);
          }
          var ut = [
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
          function Et() {
            var U = /* @__PURE__ */ new Date(), W = [
              nt(U.getHours()),
              nt(U.getMinutes()),
              nt(U.getSeconds())
            ].join(":");
            return [U.getDate(), ut[U.getMonth()], W].join(" ");
          }
          e.log = function() {
            console.log("%s - %s", Et(), e.format.apply(e, arguments));
          }, e.inherits = t("inherits"), e._extend = function(U, W) {
            if (!W || !$(W))
              return U;
            for (var V = Object.keys(W), ft = V.length; ft--; )
              U[V[ft]] = W[V[ft]];
            return U;
          };
          function it(U, W) {
            return Object.prototype.hasOwnProperty.call(U, W);
          }
        }).call(this);
      }).call(this, t("_process"), typeof ee < "u" ? ee : typeof self < "u" ? self : typeof window < "u" ? window : {});
    }, { "./support/isBuffer": 25, _process: 63, inherits: 24 }], 27: [function(t, a, e) {
      (function(i) {
        (function() {
          var o = [
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
          ], u = typeof globalThis > "u" ? i : globalThis;
          a.exports = function() {
            for (var h = [], p = 0; p < o.length; p++)
              typeof u[o[p]] == "function" && (h[h.length] = o[p]);
            return h;
          };
        }).call(this);
      }).call(this, typeof ee < "u" ? ee : typeof self < "u" ? self : typeof window < "u" ? window : {});
    }, {}], 28: [function(t, a, e) {
      e.byteLength = s, e.toByteArray = m, e.fromByteArray = _;
      for (var i = [], o = [], u = typeof Uint8Array < "u" ? Uint8Array : Array, h = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", p = 0, f = h.length; p < f; ++p)
        i[p] = h[p], o[h.charCodeAt(p)] = p;
      o[45] = 62, o[95] = 63;
      function d(S) {
        var k = S.length;
        if (k % 4 > 0)
          throw new Error("Invalid string. Length must be a multiple of 4");
        var C = S.indexOf("=");
        C === -1 && (C = k);
        var j = C === k ? 0 : 4 - C % 4;
        return [C, j];
      }
      function s(S) {
        var k = d(S), C = k[0], j = k[1];
        return (C + j) * 3 / 4 - j;
      }
      function g(S, k, C) {
        return (k + C) * 3 / 4 - C;
      }
      function m(S) {
        var k, C = d(S), j = C[0], O = C[1], I = new u(g(S, j, O)), P = 0, v = O > 0 ? j - 4 : j, N;
        for (N = 0; N < v; N += 4)
          k = o[S.charCodeAt(N)] << 18 | o[S.charCodeAt(N + 1)] << 12 | o[S.charCodeAt(N + 2)] << 6 | o[S.charCodeAt(N + 3)], I[P++] = k >> 16 & 255, I[P++] = k >> 8 & 255, I[P++] = k & 255;
        return O === 2 && (k = o[S.charCodeAt(N)] << 2 | o[S.charCodeAt(N + 1)] >> 4, I[P++] = k & 255), O === 1 && (k = o[S.charCodeAt(N)] << 10 | o[S.charCodeAt(N + 1)] << 4 | o[S.charCodeAt(N + 2)] >> 2, I[P++] = k >> 8 & 255, I[P++] = k & 255), I;
      }
      function b(S) {
        return i[S >> 18 & 63] + i[S >> 12 & 63] + i[S >> 6 & 63] + i[S & 63];
      }
      function w(S, k, C) {
        for (var j, O = [], I = k; I < C; I += 3)
          j = (S[I] << 16 & 16711680) + (S[I + 1] << 8 & 65280) + (S[I + 2] & 255), O.push(b(j));
        return O.join("");
      }
      function _(S) {
        for (var k, C = S.length, j = C % 3, O = [], I = 16383, P = 0, v = C - j; P < v; P += I)
          O.push(w(S, P, P + I > v ? v : P + I));
        return j === 1 ? (k = S[C - 1], O.push(
          i[k >> 2] + i[k << 4 & 63] + "=="
        )) : j === 2 && (k = (S[C - 2] << 8) + S[C - 1], O.push(
          i[k >> 10] + i[k >> 4 & 63] + i[k << 2 & 63] + "="
        )), O.join("");
      }
    }, {}], 29: [function(t, a, e) {
    }, {}], 30: [function(t, a, e) {
      (function(i, o) {
        (function() {
          var u = t("assert"), h = t("pako/lib/zlib/zstream"), p = t("pako/lib/zlib/deflate.js"), f = t("pako/lib/zlib/inflate.js"), d = t("pako/lib/zlib/constants");
          for (var s in d)
            e[s] = d[s];
          e.NONE = 0, e.DEFLATE = 1, e.INFLATE = 2, e.GZIP = 3, e.GUNZIP = 4, e.DEFLATERAW = 5, e.INFLATERAW = 6, e.UNZIP = 7;
          var g = 31, m = 139;
          function b(w) {
            if (typeof w != "number" || w < e.DEFLATE || w > e.UNZIP)
              throw new TypeError("Bad argument");
            this.dictionary = null, this.err = 0, this.flush = 0, this.init_done = !1, this.level = 0, this.memLevel = 0, this.mode = w, this.strategy = 0, this.windowBits = 0, this.write_in_progress = !1, this.pending_close = !1, this.gzip_id_bytes_read = 0;
          }
          b.prototype.close = function() {
            if (this.write_in_progress) {
              this.pending_close = !0;
              return;
            }
            this.pending_close = !1, u(this.init_done, "close before init"), u(this.mode <= e.UNZIP), this.mode === e.DEFLATE || this.mode === e.GZIP || this.mode === e.DEFLATERAW ? p.deflateEnd(this.strm) : (this.mode === e.INFLATE || this.mode === e.GUNZIP || this.mode === e.INFLATERAW || this.mode === e.UNZIP) && f.inflateEnd(this.strm), this.mode = e.NONE, this.dictionary = null;
          }, b.prototype.write = function(w, _, S, k, C, j, O) {
            return this._write(!0, w, _, S, k, C, j, O);
          }, b.prototype.writeSync = function(w, _, S, k, C, j, O) {
            return this._write(!1, w, _, S, k, C, j, O);
          }, b.prototype._write = function(w, _, S, k, C, j, O, I) {
            if (u.equal(arguments.length, 8), u(this.init_done, "write before init"), u(this.mode !== e.NONE, "already finalized"), u.equal(!1, this.write_in_progress, "write already in progress"), u.equal(!1, this.pending_close, "close is pending"), this.write_in_progress = !0, u.equal(!1, _ === void 0, "must provide flush value"), this.write_in_progress = !0, _ !== e.Z_NO_FLUSH && _ !== e.Z_PARTIAL_FLUSH && _ !== e.Z_SYNC_FLUSH && _ !== e.Z_FULL_FLUSH && _ !== e.Z_FINISH && _ !== e.Z_BLOCK)
              throw new Error("Invalid flush value");
            if (S == null && (S = o.alloc(0), C = 0, k = 0), this.strm.avail_in = C, this.strm.input = S, this.strm.next_in = k, this.strm.avail_out = I, this.strm.output = j, this.strm.next_out = O, this.flush = _, !w)
              return this._process(), this._checkError() ? this._afterSync() : void 0;
            var P = this;
            return i.nextTick(function() {
              P._process(), P._after();
            }), this;
          }, b.prototype._afterSync = function() {
            var w = this.strm.avail_out, _ = this.strm.avail_in;
            return this.write_in_progress = !1, [_, w];
          }, b.prototype._process = function() {
            var w = null;
            switch (this.mode) {
              case e.DEFLATE:
              case e.GZIP:
              case e.DEFLATERAW:
                this.err = p.deflate(this.strm, this.flush);
                break;
              case e.UNZIP:
                switch (this.strm.avail_in > 0 && (w = this.strm.next_in), this.gzip_id_bytes_read) {
                  case 0:
                    if (w === null)
                      break;
                    if (this.strm.input[w] === g) {
                      if (this.gzip_id_bytes_read = 1, w++, this.strm.avail_in === 1)
                        break;
                    } else {
                      this.mode = e.INFLATE;
                      break;
                    }
                  case 1:
                    if (w === null)
                      break;
                    this.strm.input[w] === m ? (this.gzip_id_bytes_read = 2, this.mode = e.GUNZIP) : this.mode = e.INFLATE;
                    break;
                  default:
                    throw new Error("invalid number of gzip magic number bytes read");
                }
              case e.INFLATE:
              case e.GUNZIP:
              case e.INFLATERAW:
                for (this.err = f.inflate(
                  this.strm,
                  this.flush
                  // If data was encoded with dictionary
                ), this.err === e.Z_NEED_DICT && this.dictionary && (this.err = f.inflateSetDictionary(this.strm, this.dictionary), this.err === e.Z_OK ? this.err = f.inflate(this.strm, this.flush) : this.err === e.Z_DATA_ERROR && (this.err = e.Z_NEED_DICT)); this.strm.avail_in > 0 && this.mode === e.GUNZIP && this.err === e.Z_STREAM_END && this.strm.next_in[0] !== 0; )
                  this.reset(), this.err = f.inflate(this.strm, this.flush);
                break;
              default:
                throw new Error("Unknown mode " + this.mode);
            }
          }, b.prototype._checkError = function() {
            switch (this.err) {
              case e.Z_OK:
              case e.Z_BUF_ERROR:
                if (this.strm.avail_out !== 0 && this.flush === e.Z_FINISH)
                  return this._error("unexpected end of file"), !1;
                break;
              case e.Z_STREAM_END:
                break;
              case e.Z_NEED_DICT:
                return this.dictionary == null ? this._error("Missing dictionary") : this._error("Bad dictionary"), !1;
              default:
                return this._error("Zlib error"), !1;
            }
            return !0;
          }, b.prototype._after = function() {
            if (this._checkError()) {
              var w = this.strm.avail_out, _ = this.strm.avail_in;
              this.write_in_progress = !1, this.callback(_, w), this.pending_close && this.close();
            }
          }, b.prototype._error = function(w) {
            this.strm.msg && (w = this.strm.msg), this.onerror(
              w,
              this.err
              // no hope of rescue.
            ), this.write_in_progress = !1, this.pending_close && this.close();
          }, b.prototype.init = function(w, _, S, k, C) {
            u(arguments.length === 4 || arguments.length === 5, "init(windowBits, level, memLevel, strategy, [dictionary])"), u(w >= 8 && w <= 15, "invalid windowBits"), u(_ >= -1 && _ <= 9, "invalid compression level"), u(S >= 1 && S <= 9, "invalid memlevel"), u(k === e.Z_FILTERED || k === e.Z_HUFFMAN_ONLY || k === e.Z_RLE || k === e.Z_FIXED || k === e.Z_DEFAULT_STRATEGY, "invalid strategy"), this._init(_, w, S, k, C), this._setDictionary();
          }, b.prototype.params = function() {
            throw new Error("deflateParams Not supported");
          }, b.prototype.reset = function() {
            this._reset(), this._setDictionary();
          }, b.prototype._init = function(w, _, S, k, C) {
            switch (this.level = w, this.windowBits = _, this.memLevel = S, this.strategy = k, this.flush = e.Z_NO_FLUSH, this.err = e.Z_OK, (this.mode === e.GZIP || this.mode === e.GUNZIP) && (this.windowBits += 16), this.mode === e.UNZIP && (this.windowBits += 32), (this.mode === e.DEFLATERAW || this.mode === e.INFLATERAW) && (this.windowBits = -1 * this.windowBits), this.strm = new h(), this.mode) {
              case e.DEFLATE:
              case e.GZIP:
              case e.DEFLATERAW:
                this.err = p.deflateInit2(this.strm, this.level, e.Z_DEFLATED, this.windowBits, this.memLevel, this.strategy);
                break;
              case e.INFLATE:
              case e.GUNZIP:
              case e.INFLATERAW:
              case e.UNZIP:
                this.err = f.inflateInit2(this.strm, this.windowBits);
                break;
              default:
                throw new Error("Unknown mode " + this.mode);
            }
            this.err !== e.Z_OK && this._error("Init error"), this.dictionary = C, this.write_in_progress = !1, this.init_done = !0;
          }, b.prototype._setDictionary = function() {
            if (this.dictionary != null) {
              switch (this.err = e.Z_OK, this.mode) {
                case e.DEFLATE:
                case e.DEFLATERAW:
                  this.err = p.deflateSetDictionary(this.strm, this.dictionary);
                  break;
              }
              this.err !== e.Z_OK && this._error("Failed to set dictionary");
            }
          }, b.prototype._reset = function() {
            switch (this.err = e.Z_OK, this.mode) {
              case e.DEFLATE:
              case e.DEFLATERAW:
              case e.GZIP:
                this.err = p.deflateReset(this.strm);
                break;
              case e.INFLATE:
              case e.INFLATERAW:
              case e.GUNZIP:
                this.err = f.inflateReset(this.strm);
                break;
            }
            this.err !== e.Z_OK && this._error("Failed to reset stream");
          }, e.Zlib = b;
        }).call(this);
      }).call(this, t("_process"), t("buffer").Buffer);
    }, { _process: 63, assert: 23, buffer: 32, "pako/lib/zlib/constants": 54, "pako/lib/zlib/deflate.js": 56, "pako/lib/zlib/inflate.js": 58, "pako/lib/zlib/zstream": 62 }], 31: [function(t, a, e) {
      (function(i) {
        (function() {
          var o = t("buffer").Buffer, u = t("stream").Transform, h = t("./binding"), p = t("util"), f = t("assert").ok, d = t("buffer").kMaxLength, s = "Cannot create final Buffer. It would be larger than 0x" + d.toString(16) + " bytes";
          h.Z_MIN_WINDOWBITS = 8, h.Z_MAX_WINDOWBITS = 15, h.Z_DEFAULT_WINDOWBITS = 15, h.Z_MIN_CHUNK = 64, h.Z_MAX_CHUNK = 1 / 0, h.Z_DEFAULT_CHUNK = 16 * 1024, h.Z_MIN_MEMLEVEL = 1, h.Z_MAX_MEMLEVEL = 9, h.Z_DEFAULT_MEMLEVEL = 8, h.Z_MIN_LEVEL = -1, h.Z_MAX_LEVEL = 9, h.Z_DEFAULT_LEVEL = h.Z_DEFAULT_COMPRESSION;
          for (var g = Object.keys(h), m = 0; m < g.length; m++) {
            var b = g[m];
            b.match(/^Z/) && Object.defineProperty(e, b, {
              enumerable: !0,
              value: h[b],
              writable: !1
            });
          }
          for (var w = {
            Z_OK: h.Z_OK,
            Z_STREAM_END: h.Z_STREAM_END,
            Z_NEED_DICT: h.Z_NEED_DICT,
            Z_ERRNO: h.Z_ERRNO,
            Z_STREAM_ERROR: h.Z_STREAM_ERROR,
            Z_DATA_ERROR: h.Z_DATA_ERROR,
            Z_MEM_ERROR: h.Z_MEM_ERROR,
            Z_BUF_ERROR: h.Z_BUF_ERROR,
            Z_VERSION_ERROR: h.Z_VERSION_ERROR
          }, _ = Object.keys(w), S = 0; S < _.length; S++) {
            var k = _[S];
            w[w[k]] = k;
          }
          Object.defineProperty(e, "codes", {
            enumerable: !0,
            value: Object.freeze(w),
            writable: !1
          }), e.Deflate = O, e.Inflate = I, e.Gzip = P, e.Gunzip = v, e.DeflateRaw = N, e.InflateRaw = T, e.Unzip = G, e.createDeflate = function(E) {
            return new O(E);
          }, e.createInflate = function(E) {
            return new I(E);
          }, e.createDeflateRaw = function(E) {
            return new N(E);
          }, e.createInflateRaw = function(E) {
            return new T(E);
          }, e.createGzip = function(E) {
            return new P(E);
          }, e.createGunzip = function(E) {
            return new v(E);
          }, e.createUnzip = function(E) {
            return new G(E);
          }, e.deflate = function(E, Z, nt) {
            return typeof Z == "function" && (nt = Z, Z = {}), C(new O(Z), E, nt);
          }, e.deflateSync = function(E, Z) {
            return j(new O(Z), E);
          }, e.gzip = function(E, Z, nt) {
            return typeof Z == "function" && (nt = Z, Z = {}), C(new P(Z), E, nt);
          }, e.gzipSync = function(E, Z) {
            return j(new P(Z), E);
          }, e.deflateRaw = function(E, Z, nt) {
            return typeof Z == "function" && (nt = Z, Z = {}), C(new N(Z), E, nt);
          }, e.deflateRawSync = function(E, Z) {
            return j(new N(Z), E);
          }, e.unzip = function(E, Z, nt) {
            return typeof Z == "function" && (nt = Z, Z = {}), C(new G(Z), E, nt);
          }, e.unzipSync = function(E, Z) {
            return j(new G(Z), E);
          }, e.inflate = function(E, Z, nt) {
            return typeof Z == "function" && (nt = Z, Z = {}), C(new I(Z), E, nt);
          }, e.inflateSync = function(E, Z) {
            return j(new I(Z), E);
          }, e.gunzip = function(E, Z, nt) {
            return typeof Z == "function" && (nt = Z, Z = {}), C(new v(Z), E, nt);
          }, e.gunzipSync = function(E, Z) {
            return j(new v(Z), E);
          }, e.inflateRaw = function(E, Z, nt) {
            return typeof Z == "function" && (nt = Z, Z = {}), C(new T(Z), E, nt);
          }, e.inflateRawSync = function(E, Z) {
            return j(new T(Z), E);
          };
          function C(E, Z, nt) {
            var ut = [], Et = 0;
            E.on("error", U), E.on("end", W), E.end(Z), it();
            function it() {
              for (var V; (V = E.read()) !== null; )
                ut.push(V), Et += V.length;
              E.once("readable", it);
            }
            function U(V) {
              E.removeListener("end", W), E.removeListener("readable", it), nt(V);
            }
            function W() {
              var V, ft = null;
              Et >= d ? ft = new RangeError(s) : V = o.concat(ut, Et), ut = [], E.close(), nt(ft, V);
            }
          }
          function j(E, Z) {
            if (typeof Z == "string" && (Z = o.from(Z)), !o.isBuffer(Z))
              throw new TypeError("Not a string or buffer");
            var nt = E._finishFlushFlag;
            return E._processChunk(Z, nt);
          }
          function O(E) {
            if (!(this instanceof O))
              return new O(E);
            J.call(this, E, h.DEFLATE);
          }
          function I(E) {
            if (!(this instanceof I))
              return new I(E);
            J.call(this, E, h.INFLATE);
          }
          function P(E) {
            if (!(this instanceof P))
              return new P(E);
            J.call(this, E, h.GZIP);
          }
          function v(E) {
            if (!(this instanceof v))
              return new v(E);
            J.call(this, E, h.GUNZIP);
          }
          function N(E) {
            if (!(this instanceof N))
              return new N(E);
            J.call(this, E, h.DEFLATERAW);
          }
          function T(E) {
            if (!(this instanceof T))
              return new T(E);
            J.call(this, E, h.INFLATERAW);
          }
          function G(E) {
            if (!(this instanceof G))
              return new G(E);
            J.call(this, E, h.UNZIP);
          }
          function $(E) {
            return E === h.Z_NO_FLUSH || E === h.Z_PARTIAL_FLUSH || E === h.Z_SYNC_FLUSH || E === h.Z_FULL_FLUSH || E === h.Z_FINISH || E === h.Z_BLOCK;
          }
          function J(E, Z) {
            var nt = this;
            if (this._opts = E = E || {}, this._chunkSize = E.chunkSize || e.Z_DEFAULT_CHUNK, u.call(this, E), E.flush && !$(E.flush))
              throw new Error("Invalid flush flag: " + E.flush);
            if (E.finishFlush && !$(E.finishFlush))
              throw new Error("Invalid flush flag: " + E.finishFlush);
            if (this._flushFlag = E.flush || h.Z_NO_FLUSH, this._finishFlushFlag = typeof E.finishFlush < "u" ? E.finishFlush : h.Z_FINISH, E.chunkSize && (E.chunkSize < e.Z_MIN_CHUNK || E.chunkSize > e.Z_MAX_CHUNK))
              throw new Error("Invalid chunk size: " + E.chunkSize);
            if (E.windowBits && (E.windowBits < e.Z_MIN_WINDOWBITS || E.windowBits > e.Z_MAX_WINDOWBITS))
              throw new Error("Invalid windowBits: " + E.windowBits);
            if (E.level && (E.level < e.Z_MIN_LEVEL || E.level > e.Z_MAX_LEVEL))
              throw new Error("Invalid compression level: " + E.level);
            if (E.memLevel && (E.memLevel < e.Z_MIN_MEMLEVEL || E.memLevel > e.Z_MAX_MEMLEVEL))
              throw new Error("Invalid memLevel: " + E.memLevel);
            if (E.strategy && E.strategy != e.Z_FILTERED && E.strategy != e.Z_HUFFMAN_ONLY && E.strategy != e.Z_RLE && E.strategy != e.Z_FIXED && E.strategy != e.Z_DEFAULT_STRATEGY)
              throw new Error("Invalid strategy: " + E.strategy);
            if (E.dictionary && !o.isBuffer(E.dictionary))
              throw new Error("Invalid dictionary: it should be a Buffer instance");
            this._handle = new h.Zlib(Z);
            var ut = this;
            this._hadError = !1, this._handle.onerror = function(U, W) {
              st(ut), ut._hadError = !0;
              var V = new Error(U);
              V.errno = W, V.code = e.codes[W], ut.emit("error", V);
            };
            var Et = e.Z_DEFAULT_COMPRESSION;
            typeof E.level == "number" && (Et = E.level);
            var it = e.Z_DEFAULT_STRATEGY;
            typeof E.strategy == "number" && (it = E.strategy), this._handle.init(E.windowBits || e.Z_DEFAULT_WINDOWBITS, Et, E.memLevel || e.Z_DEFAULT_MEMLEVEL, it, E.dictionary), this._buffer = o.allocUnsafe(this._chunkSize), this._offset = 0, this._level = Et, this._strategy = it, this.once("end", this.close), Object.defineProperty(this, "_closed", {
              get: function() {
                return !nt._handle;
              },
              configurable: !0,
              enumerable: !0
            });
          }
          p.inherits(J, u), J.prototype.params = function(E, Z, nt) {
            if (E < e.Z_MIN_LEVEL || E > e.Z_MAX_LEVEL)
              throw new RangeError("Invalid compression level: " + E);
            if (Z != e.Z_FILTERED && Z != e.Z_HUFFMAN_ONLY && Z != e.Z_RLE && Z != e.Z_FIXED && Z != e.Z_DEFAULT_STRATEGY)
              throw new TypeError("Invalid strategy: " + Z);
            if (this._level !== E || this._strategy !== Z) {
              var ut = this;
              this.flush(h.Z_SYNC_FLUSH, function() {
                f(ut._handle, "zlib binding closed"), ut._handle.params(E, Z), ut._hadError || (ut._level = E, ut._strategy = Z, nt && nt());
              });
            } else
              i.nextTick(nt);
          }, J.prototype.reset = function() {
            return f(this._handle, "zlib binding closed"), this._handle.reset();
          }, J.prototype._flush = function(E) {
            this._transform(o.alloc(0), "", E);
          }, J.prototype.flush = function(E, Z) {
            var nt = this, ut = this._writableState;
            (typeof E == "function" || E === void 0 && !Z) && (Z = E, E = h.Z_FULL_FLUSH), ut.ended ? Z && i.nextTick(Z) : ut.ending ? Z && this.once("end", Z) : ut.needDrain ? Z && this.once("drain", function() {
              return nt.flush(E, Z);
            }) : (this._flushFlag = E, this.write(o.alloc(0), "", Z));
          }, J.prototype.close = function(E) {
            st(this, E), i.nextTick(D, this);
          };
          function st(E, Z) {
            Z && i.nextTick(Z), E._handle && (E._handle.close(), E._handle = null);
          }
          function D(E) {
            E.emit("close");
          }
          J.prototype._transform = function(E, Z, nt) {
            var ut, Et = this._writableState, it = Et.ending || Et.ended, U = it && (!E || Et.length === E.length);
            if (E !== null && !o.isBuffer(E))
              return nt(new Error("invalid input"));
            if (!this._handle)
              return nt(new Error("zlib binding closed"));
            U ? ut = this._finishFlushFlag : (ut = this._flushFlag, E.length >= Et.length && (this._flushFlag = this._opts.flush || h.Z_NO_FLUSH)), this._processChunk(E, ut, nt);
          }, J.prototype._processChunk = function(E, Z, nt) {
            var ut = E && E.length, Et = this._chunkSize - this._offset, it = 0, U = this, W = typeof nt == "function";
            if (!W) {
              var V = [], ft = 0, q;
              this.on("error", function(gt) {
                q = gt;
              }), f(this._handle, "zlib binding closed");
              do
                var Y = this._handle.writeSync(
                  Z,
                  E,
                  // in
                  it,
                  // in_off
                  ut,
                  // in_len
                  this._buffer,
                  // out
                  this._offset,
                  //out_off
                  Et
                );
              while (!this._hadError && bt(Y[0], Y[1]));
              if (this._hadError)
                throw q;
              if (ft >= d)
                throw st(this), new RangeError(s);
              var Q = o.concat(V, ft);
              return st(this), Q;
            }
            f(this._handle, "zlib binding closed");
            var ct = this._handle.write(
              Z,
              E,
              // in
              it,
              // in_off
              ut,
              // in_len
              this._buffer,
              // out
              this._offset,
              //out_off
              Et
            );
            ct.buffer = E, ct.callback = bt;
            function bt(gt, z) {
              if (this && (this.buffer = null, this.callback = null), !U._hadError) {
                var X = Et - z;
                if (f(X >= 0, "have should not go down"), X > 0) {
                  var ot = U._buffer.slice(U._offset, U._offset + X);
                  U._offset += X, W ? U.push(ot) : (V.push(ot), ft += ot.length);
                }
                if ((z === 0 || U._offset >= U._chunkSize) && (Et = U._chunkSize, U._offset = 0, U._buffer = o.allocUnsafe(U._chunkSize)), z === 0) {
                  if (it += ut - gt, ut = gt, !W)
                    return !0;
                  var vt = U._handle.write(Z, E, it, ut, U._buffer, U._offset, U._chunkSize);
                  vt.callback = bt, vt.buffer = E;
                  return;
                }
                if (!W)
                  return !1;
                nt();
              }
            }
          }, p.inherits(O, J), p.inherits(I, J), p.inherits(P, J), p.inherits(v, J), p.inherits(N, J), p.inherits(T, J), p.inherits(G, J);
        }).call(this);
      }).call(this, t("_process"));
    }, { "./binding": 30, _process: 63, assert: 23, buffer: 32, stream: 65, util: 84 }], 32: [function(t, a, e) {
      (function(i) {
        (function() {
          var o = t("base64-js"), u = t("ieee754");
          e.Buffer = d, e.SlowBuffer = j, e.INSPECT_MAX_BYTES = 50;
          var h = 2147483647;
          e.kMaxLength = h, d.TYPED_ARRAY_SUPPORT = p(), !d.TYPED_ARRAY_SUPPORT && typeof console < "u" && typeof console.error == "function" && console.error(
            "This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support."
          );
          function p() {
            try {
              var l = new Uint8Array(1);
              return l.__proto__ = { __proto__: Uint8Array.prototype, foo: function() {
                return 42;
              } }, l.foo() === 42;
            } catch {
              return !1;
            }
          }
          Object.defineProperty(d.prototype, "parent", {
            enumerable: !0,
            get: function() {
              if (d.isBuffer(this))
                return this.buffer;
            }
          }), Object.defineProperty(d.prototype, "offset", {
            enumerable: !0,
            get: function() {
              if (d.isBuffer(this))
                return this.byteOffset;
            }
          });
          function f(l) {
            if (l > h)
              throw new RangeError('The value "' + l + '" is invalid for option "size"');
            var y = new Uint8Array(l);
            return y.__proto__ = d.prototype, y;
          }
          function d(l, y, A) {
            if (typeof l == "number") {
              if (typeof y == "string")
                throw new TypeError(
                  'The "string" argument must be of type string. Received type number'
                );
              return b(l);
            }
            return s(l, y, A);
          }
          typeof Symbol < "u" && Symbol.species != null && d[Symbol.species] === d && Object.defineProperty(d, Symbol.species, {
            value: null,
            configurable: !0,
            enumerable: !1,
            writable: !1
          }), d.poolSize = 8192;
          function s(l, y, A) {
            if (typeof l == "string")
              return w(l, y);
            if (ArrayBuffer.isView(l))
              return _(l);
            if (l == null)
              throw TypeError(
                "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof l
              );
            if (B(l, ArrayBuffer) || l && B(l.buffer, ArrayBuffer))
              return S(l, y, A);
            if (typeof l == "number")
              throw new TypeError(
                'The "value" argument must not be of type number. Received type number'
              );
            var L = l.valueOf && l.valueOf();
            if (L != null && L !== l)
              return d.from(L, y, A);
            var tt = k(l);
            if (tt)
              return tt;
            if (typeof Symbol < "u" && Symbol.toPrimitive != null && typeof l[Symbol.toPrimitive] == "function")
              return d.from(
                l[Symbol.toPrimitive]("string"),
                y,
                A
              );
            throw new TypeError(
              "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof l
            );
          }
          d.from = function(l, y, A) {
            return s(l, y, A);
          }, d.prototype.__proto__ = Uint8Array.prototype, d.__proto__ = Uint8Array;
          function g(l) {
            if (typeof l != "number")
              throw new TypeError('"size" argument must be of type number');
            if (l < 0)
              throw new RangeError('The value "' + l + '" is invalid for option "size"');
          }
          function m(l, y, A) {
            return g(l), l <= 0 ? f(l) : y !== void 0 ? typeof A == "string" ? f(l).fill(y, A) : f(l).fill(y) : f(l);
          }
          d.alloc = function(l, y, A) {
            return m(l, y, A);
          };
          function b(l) {
            return g(l), f(l < 0 ? 0 : C(l) | 0);
          }
          d.allocUnsafe = function(l) {
            return b(l);
          }, d.allocUnsafeSlow = function(l) {
            return b(l);
          };
          function w(l, y) {
            if ((typeof y != "string" || y === "") && (y = "utf8"), !d.isEncoding(y))
              throw new TypeError("Unknown encoding: " + y);
            var A = O(l, y) | 0, L = f(A), tt = L.write(l, y);
            return tt !== A && (L = L.slice(0, tt)), L;
          }
          function _(l) {
            for (var y = l.length < 0 ? 0 : C(l.length) | 0, A = f(y), L = 0; L < y; L += 1)
              A[L] = l[L] & 255;
            return A;
          }
          function S(l, y, A) {
            if (y < 0 || l.byteLength < y)
              throw new RangeError('"offset" is outside of buffer bounds');
            if (l.byteLength < y + (A || 0))
              throw new RangeError('"length" is outside of buffer bounds');
            var L;
            return y === void 0 && A === void 0 ? L = new Uint8Array(l) : A === void 0 ? L = new Uint8Array(l, y) : L = new Uint8Array(l, y, A), L.__proto__ = d.prototype, L;
          }
          function k(l) {
            if (d.isBuffer(l)) {
              var y = C(l.length) | 0, A = f(y);
              return A.length === 0 || l.copy(A, 0, 0, y), A;
            }
            if (l.length !== void 0)
              return typeof l.length != "number" || F(l.length) ? f(0) : _(l);
            if (l.type === "Buffer" && Array.isArray(l.data))
              return _(l.data);
          }
          function C(l) {
            if (l >= h)
              throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + h.toString(16) + " bytes");
            return l | 0;
          }
          function j(l) {
            return +l != l && (l = 0), d.alloc(+l);
          }
          d.isBuffer = function(l) {
            return l != null && l._isBuffer === !0 && l !== d.prototype;
          }, d.compare = function(l, y) {
            if (B(l, Uint8Array) && (l = d.from(l, l.offset, l.byteLength)), B(y, Uint8Array) && (y = d.from(y, y.offset, y.byteLength)), !d.isBuffer(l) || !d.isBuffer(y))
              throw new TypeError(
                'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
              );
            if (l === y)
              return 0;
            for (var A = l.length, L = y.length, tt = 0, ht = Math.min(A, L); tt < ht; ++tt)
              if (l[tt] !== y[tt]) {
                A = l[tt], L = y[tt];
                break;
              }
            return A < L ? -1 : L < A ? 1 : 0;
          }, d.isEncoding = function(l) {
            switch (String(l).toLowerCase()) {
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
          }, d.concat = function(l, y) {
            if (!Array.isArray(l))
              throw new TypeError('"list" argument must be an Array of Buffers');
            if (l.length === 0)
              return d.alloc(0);
            var A;
            if (y === void 0)
              for (y = 0, A = 0; A < l.length; ++A)
                y += l[A].length;
            var L = d.allocUnsafe(y), tt = 0;
            for (A = 0; A < l.length; ++A) {
              var ht = l[A];
              if (B(ht, Uint8Array) && (ht = d.from(ht)), !d.isBuffer(ht))
                throw new TypeError('"list" argument must be an Array of Buffers');
              ht.copy(L, tt), tt += ht.length;
            }
            return L;
          };
          function O(l, y) {
            if (d.isBuffer(l))
              return l.length;
            if (ArrayBuffer.isView(l) || B(l, ArrayBuffer))
              return l.byteLength;
            if (typeof l != "string")
              throw new TypeError(
                'The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type ' + typeof l
              );
            var A = l.length, L = arguments.length > 2 && arguments[2] === !0;
            if (!L && A === 0)
              return 0;
            for (var tt = !1; ; )
              switch (y) {
                case "ascii":
                case "latin1":
                case "binary":
                  return A;
                case "utf8":
                case "utf-8":
                  return z(l).length;
                case "ucs2":
                case "ucs-2":
                case "utf16le":
                case "utf-16le":
                  return A * 2;
                case "hex":
                  return A >>> 1;
                case "base64":
                  return vt(l).length;
                default:
                  if (tt)
                    return L ? -1 : z(l).length;
                  y = ("" + y).toLowerCase(), tt = !0;
              }
          }
          d.byteLength = O;
          function I(l, y, A) {
            var L = !1;
            if ((y === void 0 || y < 0) && (y = 0), y > this.length || ((A === void 0 || A > this.length) && (A = this.length), A <= 0) || (A >>>= 0, y >>>= 0, A <= y))
              return "";
            for (l || (l = "utf8"); ; )
              switch (l) {
                case "hex":
                  return U(this, y, A);
                case "utf8":
                case "utf-8":
                  return Z(this, y, A);
                case "ascii":
                  return Et(this, y, A);
                case "latin1":
                case "binary":
                  return it(this, y, A);
                case "base64":
                  return E(this, y, A);
                case "ucs2":
                case "ucs-2":
                case "utf16le":
                case "utf-16le":
                  return W(this, y, A);
                default:
                  if (L)
                    throw new TypeError("Unknown encoding: " + l);
                  l = (l + "").toLowerCase(), L = !0;
              }
          }
          d.prototype._isBuffer = !0;
          function P(l, y, A) {
            var L = l[y];
            l[y] = l[A], l[A] = L;
          }
          d.prototype.swap16 = function() {
            var l = this.length;
            if (l % 2 !== 0)
              throw new RangeError("Buffer size must be a multiple of 16-bits");
            for (var y = 0; y < l; y += 2)
              P(this, y, y + 1);
            return this;
          }, d.prototype.swap32 = function() {
            var l = this.length;
            if (l % 4 !== 0)
              throw new RangeError("Buffer size must be a multiple of 32-bits");
            for (var y = 0; y < l; y += 4)
              P(this, y, y + 3), P(this, y + 1, y + 2);
            return this;
          }, d.prototype.swap64 = function() {
            var l = this.length;
            if (l % 8 !== 0)
              throw new RangeError("Buffer size must be a multiple of 64-bits");
            for (var y = 0; y < l; y += 8)
              P(this, y, y + 7), P(this, y + 1, y + 6), P(this, y + 2, y + 5), P(this, y + 3, y + 4);
            return this;
          }, d.prototype.toString = function() {
            var l = this.length;
            return l === 0 ? "" : arguments.length === 0 ? Z(this, 0, l) : I.apply(this, arguments);
          }, d.prototype.toLocaleString = d.prototype.toString, d.prototype.equals = function(l) {
            if (!d.isBuffer(l))
              throw new TypeError("Argument must be a Buffer");
            return this === l ? !0 : d.compare(this, l) === 0;
          }, d.prototype.inspect = function() {
            var l = "", y = e.INSPECT_MAX_BYTES;
            return l = this.toString("hex", 0, y).replace(/(.{2})/g, "$1 ").trim(), this.length > y && (l += " ... "), "<Buffer " + l + ">";
          }, d.prototype.compare = function(l, y, A, L, tt) {
            if (B(l, Uint8Array) && (l = d.from(l, l.offset, l.byteLength)), !d.isBuffer(l))
              throw new TypeError(
                'The "target" argument must be one of type Buffer or Uint8Array. Received type ' + typeof l
              );
            if (y === void 0 && (y = 0), A === void 0 && (A = l ? l.length : 0), L === void 0 && (L = 0), tt === void 0 && (tt = this.length), y < 0 || A > l.length || L < 0 || tt > this.length)
              throw new RangeError("out of range index");
            if (L >= tt && y >= A)
              return 0;
            if (L >= tt)
              return -1;
            if (y >= A)
              return 1;
            if (y >>>= 0, A >>>= 0, L >>>= 0, tt >>>= 0, this === l)
              return 0;
            for (var ht = tt - L, xt = A - y, It = Math.min(ht, xt), Zt = this.slice(L, tt), Tt = l.slice(y, A), Nt = 0; Nt < It; ++Nt)
              if (Zt[Nt] !== Tt[Nt]) {
                ht = Zt[Nt], xt = Tt[Nt];
                break;
              }
            return ht < xt ? -1 : xt < ht ? 1 : 0;
          };
          function v(l, y, A, L, tt) {
            if (l.length === 0)
              return -1;
            if (typeof A == "string" ? (L = A, A = 0) : A > 2147483647 ? A = 2147483647 : A < -2147483648 && (A = -2147483648), A = +A, F(A) && (A = tt ? 0 : l.length - 1), A < 0 && (A = l.length + A), A >= l.length) {
              if (tt)
                return -1;
              A = l.length - 1;
            } else if (A < 0)
              if (tt)
                A = 0;
              else
                return -1;
            if (typeof y == "string" && (y = d.from(y, L)), d.isBuffer(y))
              return y.length === 0 ? -1 : N(l, y, A, L, tt);
            if (typeof y == "number")
              return y = y & 255, typeof Uint8Array.prototype.indexOf == "function" ? tt ? Uint8Array.prototype.indexOf.call(l, y, A) : Uint8Array.prototype.lastIndexOf.call(l, y, A) : N(l, [y], A, L, tt);
            throw new TypeError("val must be string, number or Buffer");
          }
          function N(l, y, A, L, tt) {
            var ht = 1, xt = l.length, It = y.length;
            if (L !== void 0 && (L = String(L).toLowerCase(), L === "ucs2" || L === "ucs-2" || L === "utf16le" || L === "utf-16le")) {
              if (l.length < 2 || y.length < 2)
                return -1;
              ht = 2, xt /= 2, It /= 2, A /= 2;
            }
            function Zt(Wt, Vt) {
              return ht === 1 ? Wt[Vt] : Wt.readUInt16BE(Vt * ht);
            }
            var Tt;
            if (tt) {
              var Nt = -1;
              for (Tt = A; Tt < xt; Tt++)
                if (Zt(l, Tt) === Zt(y, Nt === -1 ? 0 : Tt - Nt)) {
                  if (Nt === -1 && (Nt = Tt), Tt - Nt + 1 === It)
                    return Nt * ht;
                } else
                  Nt !== -1 && (Tt -= Tt - Nt), Nt = -1;
            } else
              for (A + It > xt && (A = xt - It), Tt = A; Tt >= 0; Tt--) {
                for (var qt = !0, Jt = 0; Jt < It; Jt++)
                  if (Zt(l, Tt + Jt) !== Zt(y, Jt)) {
                    qt = !1;
                    break;
                  }
                if (qt)
                  return Tt;
              }
            return -1;
          }
          d.prototype.includes = function(l, y, A) {
            return this.indexOf(l, y, A) !== -1;
          }, d.prototype.indexOf = function(l, y, A) {
            return v(this, l, y, A, !0);
          }, d.prototype.lastIndexOf = function(l, y, A) {
            return v(this, l, y, A, !1);
          };
          function T(l, y, A, L) {
            A = Number(A) || 0;
            var tt = l.length - A;
            L ? (L = Number(L), L > tt && (L = tt)) : L = tt;
            var ht = y.length;
            L > ht / 2 && (L = ht / 2);
            for (var xt = 0; xt < L; ++xt) {
              var It = parseInt(y.substr(xt * 2, 2), 16);
              if (F(It))
                return xt;
              l[A + xt] = It;
            }
            return xt;
          }
          function G(l, y, A, L) {
            return wt(z(y, l.length - A), l, A, L);
          }
          function $(l, y, A, L) {
            return wt(X(y), l, A, L);
          }
          function J(l, y, A, L) {
            return $(l, y, A, L);
          }
          function st(l, y, A, L) {
            return wt(vt(y), l, A, L);
          }
          function D(l, y, A, L) {
            return wt(ot(y, l.length - A), l, A, L);
          }
          d.prototype.write = function(l, y, A, L) {
            if (y === void 0)
              L = "utf8", A = this.length, y = 0;
            else if (A === void 0 && typeof y == "string")
              L = y, A = this.length, y = 0;
            else if (isFinite(y))
              y = y >>> 0, isFinite(A) ? (A = A >>> 0, L === void 0 && (L = "utf8")) : (L = A, A = void 0);
            else
              throw new Error(
                "Buffer.write(string, encoding, offset[, length]) is no longer supported"
              );
            var tt = this.length - y;
            if ((A === void 0 || A > tt) && (A = tt), l.length > 0 && (A < 0 || y < 0) || y > this.length)
              throw new RangeError("Attempt to write outside buffer bounds");
            L || (L = "utf8");
            for (var ht = !1; ; )
              switch (L) {
                case "hex":
                  return T(this, l, y, A);
                case "utf8":
                case "utf-8":
                  return G(this, l, y, A);
                case "ascii":
                  return $(this, l, y, A);
                case "latin1":
                case "binary":
                  return J(this, l, y, A);
                case "base64":
                  return st(this, l, y, A);
                case "ucs2":
                case "ucs-2":
                case "utf16le":
                case "utf-16le":
                  return D(this, l, y, A);
                default:
                  if (ht)
                    throw new TypeError("Unknown encoding: " + L);
                  L = ("" + L).toLowerCase(), ht = !0;
              }
          }, d.prototype.toJSON = function() {
            return {
              type: "Buffer",
              data: Array.prototype.slice.call(this._arr || this, 0)
            };
          };
          function E(l, y, A) {
            return y === 0 && A === l.length ? o.fromByteArray(l) : o.fromByteArray(l.slice(y, A));
          }
          function Z(l, y, A) {
            A = Math.min(l.length, A);
            for (var L = [], tt = y; tt < A; ) {
              var ht = l[tt], xt = null, It = ht > 239 ? 4 : ht > 223 ? 3 : ht > 191 ? 2 : 1;
              if (tt + It <= A) {
                var Zt, Tt, Nt, qt;
                switch (It) {
                  case 1:
                    ht < 128 && (xt = ht);
                    break;
                  case 2:
                    Zt = l[tt + 1], (Zt & 192) === 128 && (qt = (ht & 31) << 6 | Zt & 63, qt > 127 && (xt = qt));
                    break;
                  case 3:
                    Zt = l[tt + 1], Tt = l[tt + 2], (Zt & 192) === 128 && (Tt & 192) === 128 && (qt = (ht & 15) << 12 | (Zt & 63) << 6 | Tt & 63, qt > 2047 && (qt < 55296 || qt > 57343) && (xt = qt));
                    break;
                  case 4:
                    Zt = l[tt + 1], Tt = l[tt + 2], Nt = l[tt + 3], (Zt & 192) === 128 && (Tt & 192) === 128 && (Nt & 192) === 128 && (qt = (ht & 15) << 18 | (Zt & 63) << 12 | (Tt & 63) << 6 | Nt & 63, qt > 65535 && qt < 1114112 && (xt = qt));
                }
              }
              xt === null ? (xt = 65533, It = 1) : xt > 65535 && (xt -= 65536, L.push(xt >>> 10 & 1023 | 55296), xt = 56320 | xt & 1023), L.push(xt), tt += It;
            }
            return ut(L);
          }
          var nt = 4096;
          function ut(l) {
            var y = l.length;
            if (y <= nt)
              return String.fromCharCode.apply(String, l);
            for (var A = "", L = 0; L < y; )
              A += String.fromCharCode.apply(
                String,
                l.slice(L, L += nt)
              );
            return A;
          }
          function Et(l, y, A) {
            var L = "";
            A = Math.min(l.length, A);
            for (var tt = y; tt < A; ++tt)
              L += String.fromCharCode(l[tt] & 127);
            return L;
          }
          function it(l, y, A) {
            var L = "";
            A = Math.min(l.length, A);
            for (var tt = y; tt < A; ++tt)
              L += String.fromCharCode(l[tt]);
            return L;
          }
          function U(l, y, A) {
            var L = l.length;
            (!y || y < 0) && (y = 0), (!A || A < 0 || A > L) && (A = L);
            for (var tt = "", ht = y; ht < A; ++ht)
              tt += gt(l[ht]);
            return tt;
          }
          function W(l, y, A) {
            for (var L = l.slice(y, A), tt = "", ht = 0; ht < L.length; ht += 2)
              tt += String.fromCharCode(L[ht] + L[ht + 1] * 256);
            return tt;
          }
          d.prototype.slice = function(l, y) {
            var A = this.length;
            l = ~~l, y = y === void 0 ? A : ~~y, l < 0 ? (l += A, l < 0 && (l = 0)) : l > A && (l = A), y < 0 ? (y += A, y < 0 && (y = 0)) : y > A && (y = A), y < l && (y = l);
            var L = this.subarray(l, y);
            return L.__proto__ = d.prototype, L;
          };
          function V(l, y, A) {
            if (l % 1 !== 0 || l < 0)
              throw new RangeError("offset is not uint");
            if (l + y > A)
              throw new RangeError("Trying to access beyond buffer length");
          }
          d.prototype.readUIntLE = function(l, y, A) {
            l = l >>> 0, y = y >>> 0, A || V(l, y, this.length);
            for (var L = this[l], tt = 1, ht = 0; ++ht < y && (tt *= 256); )
              L += this[l + ht] * tt;
            return L;
          }, d.prototype.readUIntBE = function(l, y, A) {
            l = l >>> 0, y = y >>> 0, A || V(l, y, this.length);
            for (var L = this[l + --y], tt = 1; y > 0 && (tt *= 256); )
              L += this[l + --y] * tt;
            return L;
          }, d.prototype.readUInt8 = function(l, y) {
            return l = l >>> 0, y || V(l, 1, this.length), this[l];
          }, d.prototype.readUInt16LE = function(l, y) {
            return l = l >>> 0, y || V(l, 2, this.length), this[l] | this[l + 1] << 8;
          }, d.prototype.readUInt16BE = function(l, y) {
            return l = l >>> 0, y || V(l, 2, this.length), this[l] << 8 | this[l + 1];
          }, d.prototype.readUInt32LE = function(l, y) {
            return l = l >>> 0, y || V(l, 4, this.length), (this[l] | this[l + 1] << 8 | this[l + 2] << 16) + this[l + 3] * 16777216;
          }, d.prototype.readUInt32BE = function(l, y) {
            return l = l >>> 0, y || V(l, 4, this.length), this[l] * 16777216 + (this[l + 1] << 16 | this[l + 2] << 8 | this[l + 3]);
          }, d.prototype.readIntLE = function(l, y, A) {
            l = l >>> 0, y = y >>> 0, A || V(l, y, this.length);
            for (var L = this[l], tt = 1, ht = 0; ++ht < y && (tt *= 256); )
              L += this[l + ht] * tt;
            return tt *= 128, L >= tt && (L -= Math.pow(2, 8 * y)), L;
          }, d.prototype.readIntBE = function(l, y, A) {
            l = l >>> 0, y = y >>> 0, A || V(l, y, this.length);
            for (var L = y, tt = 1, ht = this[l + --L]; L > 0 && (tt *= 256); )
              ht += this[l + --L] * tt;
            return tt *= 128, ht >= tt && (ht -= Math.pow(2, 8 * y)), ht;
          }, d.prototype.readInt8 = function(l, y) {
            return l = l >>> 0, y || V(l, 1, this.length), this[l] & 128 ? (255 - this[l] + 1) * -1 : this[l];
          }, d.prototype.readInt16LE = function(l, y) {
            l = l >>> 0, y || V(l, 2, this.length);
            var A = this[l] | this[l + 1] << 8;
            return A & 32768 ? A | 4294901760 : A;
          }, d.prototype.readInt16BE = function(l, y) {
            l = l >>> 0, y || V(l, 2, this.length);
            var A = this[l + 1] | this[l] << 8;
            return A & 32768 ? A | 4294901760 : A;
          }, d.prototype.readInt32LE = function(l, y) {
            return l = l >>> 0, y || V(l, 4, this.length), this[l] | this[l + 1] << 8 | this[l + 2] << 16 | this[l + 3] << 24;
          }, d.prototype.readInt32BE = function(l, y) {
            return l = l >>> 0, y || V(l, 4, this.length), this[l] << 24 | this[l + 1] << 16 | this[l + 2] << 8 | this[l + 3];
          }, d.prototype.readFloatLE = function(l, y) {
            return l = l >>> 0, y || V(l, 4, this.length), u.read(this, l, !0, 23, 4);
          }, d.prototype.readFloatBE = function(l, y) {
            return l = l >>> 0, y || V(l, 4, this.length), u.read(this, l, !1, 23, 4);
          }, d.prototype.readDoubleLE = function(l, y) {
            return l = l >>> 0, y || V(l, 8, this.length), u.read(this, l, !0, 52, 8);
          }, d.prototype.readDoubleBE = function(l, y) {
            return l = l >>> 0, y || V(l, 8, this.length), u.read(this, l, !1, 52, 8);
          };
          function ft(l, y, A, L, tt, ht) {
            if (!d.isBuffer(l))
              throw new TypeError('"buffer" argument must be a Buffer instance');
            if (y > tt || y < ht)
              throw new RangeError('"value" argument is out of bounds');
            if (A + L > l.length)
              throw new RangeError("Index out of range");
          }
          d.prototype.writeUIntLE = function(l, y, A, L) {
            if (l = +l, y = y >>> 0, A = A >>> 0, !L) {
              var tt = Math.pow(2, 8 * A) - 1;
              ft(this, l, y, A, tt, 0);
            }
            var ht = 1, xt = 0;
            for (this[y] = l & 255; ++xt < A && (ht *= 256); )
              this[y + xt] = l / ht & 255;
            return y + A;
          }, d.prototype.writeUIntBE = function(l, y, A, L) {
            if (l = +l, y = y >>> 0, A = A >>> 0, !L) {
              var tt = Math.pow(2, 8 * A) - 1;
              ft(this, l, y, A, tt, 0);
            }
            var ht = A - 1, xt = 1;
            for (this[y + ht] = l & 255; --ht >= 0 && (xt *= 256); )
              this[y + ht] = l / xt & 255;
            return y + A;
          }, d.prototype.writeUInt8 = function(l, y, A) {
            return l = +l, y = y >>> 0, A || ft(this, l, y, 1, 255, 0), this[y] = l & 255, y + 1;
          }, d.prototype.writeUInt16LE = function(l, y, A) {
            return l = +l, y = y >>> 0, A || ft(this, l, y, 2, 65535, 0), this[y] = l & 255, this[y + 1] = l >>> 8, y + 2;
          }, d.prototype.writeUInt16BE = function(l, y, A) {
            return l = +l, y = y >>> 0, A || ft(this, l, y, 2, 65535, 0), this[y] = l >>> 8, this[y + 1] = l & 255, y + 2;
          }, d.prototype.writeUInt32LE = function(l, y, A) {
            return l = +l, y = y >>> 0, A || ft(this, l, y, 4, 4294967295, 0), this[y + 3] = l >>> 24, this[y + 2] = l >>> 16, this[y + 1] = l >>> 8, this[y] = l & 255, y + 4;
          }, d.prototype.writeUInt32BE = function(l, y, A) {
            return l = +l, y = y >>> 0, A || ft(this, l, y, 4, 4294967295, 0), this[y] = l >>> 24, this[y + 1] = l >>> 16, this[y + 2] = l >>> 8, this[y + 3] = l & 255, y + 4;
          }, d.prototype.writeIntLE = function(l, y, A, L) {
            if (l = +l, y = y >>> 0, !L) {
              var tt = Math.pow(2, 8 * A - 1);
              ft(this, l, y, A, tt - 1, -tt);
            }
            var ht = 0, xt = 1, It = 0;
            for (this[y] = l & 255; ++ht < A && (xt *= 256); )
              l < 0 && It === 0 && this[y + ht - 1] !== 0 && (It = 1), this[y + ht] = (l / xt >> 0) - It & 255;
            return y + A;
          }, d.prototype.writeIntBE = function(l, y, A, L) {
            if (l = +l, y = y >>> 0, !L) {
              var tt = Math.pow(2, 8 * A - 1);
              ft(this, l, y, A, tt - 1, -tt);
            }
            var ht = A - 1, xt = 1, It = 0;
            for (this[y + ht] = l & 255; --ht >= 0 && (xt *= 256); )
              l < 0 && It === 0 && this[y + ht + 1] !== 0 && (It = 1), this[y + ht] = (l / xt >> 0) - It & 255;
            return y + A;
          }, d.prototype.writeInt8 = function(l, y, A) {
            return l = +l, y = y >>> 0, A || ft(this, l, y, 1, 127, -128), l < 0 && (l = 255 + l + 1), this[y] = l & 255, y + 1;
          }, d.prototype.writeInt16LE = function(l, y, A) {
            return l = +l, y = y >>> 0, A || ft(this, l, y, 2, 32767, -32768), this[y] = l & 255, this[y + 1] = l >>> 8, y + 2;
          }, d.prototype.writeInt16BE = function(l, y, A) {
            return l = +l, y = y >>> 0, A || ft(this, l, y, 2, 32767, -32768), this[y] = l >>> 8, this[y + 1] = l & 255, y + 2;
          }, d.prototype.writeInt32LE = function(l, y, A) {
            return l = +l, y = y >>> 0, A || ft(this, l, y, 4, 2147483647, -2147483648), this[y] = l & 255, this[y + 1] = l >>> 8, this[y + 2] = l >>> 16, this[y + 3] = l >>> 24, y + 4;
          }, d.prototype.writeInt32BE = function(l, y, A) {
            return l = +l, y = y >>> 0, A || ft(this, l, y, 4, 2147483647, -2147483648), l < 0 && (l = 4294967295 + l + 1), this[y] = l >>> 24, this[y + 1] = l >>> 16, this[y + 2] = l >>> 8, this[y + 3] = l & 255, y + 4;
          };
          function q(l, y, A, L, tt, ht) {
            if (A + L > l.length)
              throw new RangeError("Index out of range");
            if (A < 0)
              throw new RangeError("Index out of range");
          }
          function Y(l, y, A, L, tt) {
            return y = +y, A = A >>> 0, tt || q(l, y, A, 4), u.write(l, y, A, L, 23, 4), A + 4;
          }
          d.prototype.writeFloatLE = function(l, y, A) {
            return Y(this, l, y, !0, A);
          }, d.prototype.writeFloatBE = function(l, y, A) {
            return Y(this, l, y, !1, A);
          };
          function Q(l, y, A, L, tt) {
            return y = +y, A = A >>> 0, tt || q(l, y, A, 8), u.write(l, y, A, L, 52, 8), A + 8;
          }
          d.prototype.writeDoubleLE = function(l, y, A) {
            return Q(this, l, y, !0, A);
          }, d.prototype.writeDoubleBE = function(l, y, A) {
            return Q(this, l, y, !1, A);
          }, d.prototype.copy = function(l, y, A, L) {
            if (!d.isBuffer(l))
              throw new TypeError("argument should be a Buffer");
            if (A || (A = 0), !L && L !== 0 && (L = this.length), y >= l.length && (y = l.length), y || (y = 0), L > 0 && L < A && (L = A), L === A || l.length === 0 || this.length === 0)
              return 0;
            if (y < 0)
              throw new RangeError("targetStart out of bounds");
            if (A < 0 || A >= this.length)
              throw new RangeError("Index out of range");
            if (L < 0)
              throw new RangeError("sourceEnd out of bounds");
            L > this.length && (L = this.length), l.length - y < L - A && (L = l.length - y + A);
            var tt = L - A;
            if (this === l && typeof Uint8Array.prototype.copyWithin == "function")
              this.copyWithin(y, A, L);
            else if (this === l && A < y && y < L)
              for (var ht = tt - 1; ht >= 0; --ht)
                l[ht + y] = this[ht + A];
            else
              Uint8Array.prototype.set.call(
                l,
                this.subarray(A, L),
                y
              );
            return tt;
          }, d.prototype.fill = function(l, y, A, L) {
            if (typeof l == "string") {
              if (typeof y == "string" ? (L = y, y = 0, A = this.length) : typeof A == "string" && (L = A, A = this.length), L !== void 0 && typeof L != "string")
                throw new TypeError("encoding must be a string");
              if (typeof L == "string" && !d.isEncoding(L))
                throw new TypeError("Unknown encoding: " + L);
              if (l.length === 1) {
                var tt = l.charCodeAt(0);
                (L === "utf8" && tt < 128 || L === "latin1") && (l = tt);
              }
            } else
              typeof l == "number" && (l = l & 255);
            if (y < 0 || this.length < y || this.length < A)
              throw new RangeError("Out of range index");
            if (A <= y)
              return this;
            y = y >>> 0, A = A === void 0 ? this.length : A >>> 0, l || (l = 0);
            var ht;
            if (typeof l == "number")
              for (ht = y; ht < A; ++ht)
                this[ht] = l;
            else {
              var xt = d.isBuffer(l) ? l : d.from(l, L), It = xt.length;
              if (It === 0)
                throw new TypeError('The value "' + l + '" is invalid for argument "value"');
              for (ht = 0; ht < A - y; ++ht)
                this[ht + y] = xt[ht % It];
            }
            return this;
          };
          var ct = /[^+/0-9A-Za-z-_]/g;
          function bt(l) {
            if (l = l.split("=")[0], l = l.trim().replace(ct, ""), l.length < 2)
              return "";
            for (; l.length % 4 !== 0; )
              l = l + "=";
            return l;
          }
          function gt(l) {
            return l < 16 ? "0" + l.toString(16) : l.toString(16);
          }
          function z(l, y) {
            y = y || 1 / 0;
            for (var A, L = l.length, tt = null, ht = [], xt = 0; xt < L; ++xt) {
              if (A = l.charCodeAt(xt), A > 55295 && A < 57344) {
                if (!tt) {
                  if (A > 56319) {
                    (y -= 3) > -1 && ht.push(239, 191, 189);
                    continue;
                  } else if (xt + 1 === L) {
                    (y -= 3) > -1 && ht.push(239, 191, 189);
                    continue;
                  }
                  tt = A;
                  continue;
                }
                if (A < 56320) {
                  (y -= 3) > -1 && ht.push(239, 191, 189), tt = A;
                  continue;
                }
                A = (tt - 55296 << 10 | A - 56320) + 65536;
              } else
                tt && (y -= 3) > -1 && ht.push(239, 191, 189);
              if (tt = null, A < 128) {
                if ((y -= 1) < 0)
                  break;
                ht.push(A);
              } else if (A < 2048) {
                if ((y -= 2) < 0)
                  break;
                ht.push(
                  A >> 6 | 192,
                  A & 63 | 128
                );
              } else if (A < 65536) {
                if ((y -= 3) < 0)
                  break;
                ht.push(
                  A >> 12 | 224,
                  A >> 6 & 63 | 128,
                  A & 63 | 128
                );
              } else if (A < 1114112) {
                if ((y -= 4) < 0)
                  break;
                ht.push(
                  A >> 18 | 240,
                  A >> 12 & 63 | 128,
                  A >> 6 & 63 | 128,
                  A & 63 | 128
                );
              } else
                throw new Error("Invalid code point");
            }
            return ht;
          }
          function X(l) {
            for (var y = [], A = 0; A < l.length; ++A)
              y.push(l.charCodeAt(A) & 255);
            return y;
          }
          function ot(l, y) {
            for (var A, L, tt, ht = [], xt = 0; xt < l.length && !((y -= 2) < 0); ++xt)
              A = l.charCodeAt(xt), L = A >> 8, tt = A % 256, ht.push(tt), ht.push(L);
            return ht;
          }
          function vt(l) {
            return o.toByteArray(bt(l));
          }
          function wt(l, y, A, L) {
            for (var tt = 0; tt < L && !(tt + A >= y.length || tt >= l.length); ++tt)
              y[tt + A] = l[tt];
            return tt;
          }
          function B(l, y) {
            return l instanceof y || l != null && l.constructor != null && l.constructor.name != null && l.constructor.name === y.name;
          }
          function F(l) {
            return l !== l;
          }
        }).call(this);
      }).call(this, t("buffer").Buffer);
    }, { "base64-js": 28, buffer: 32, ieee754: 45 }], 33: [function(t, a, e) {
      var i = t("get-intrinsic"), o = t("./"), u = o(i("String.prototype.indexOf"));
      a.exports = function(h, p) {
        var f = i(h, !!p);
        return typeof f == "function" && u(h, ".prototype.") > -1 ? o(f) : f;
      };
    }, { "./": 34, "get-intrinsic": 39 }], 34: [function(t, a, e) {
      var i = t("function-bind"), o = t("get-intrinsic"), u = o("%Function.prototype.apply%"), h = o("%Function.prototype.call%"), p = o("%Reflect.apply%", !0) || i.call(h, u), f = o("%Object.getOwnPropertyDescriptor%", !0), d = o("%Object.defineProperty%", !0), s = o("%Math.max%");
      if (d)
        try {
          d({}, "a", { value: 1 });
        } catch {
          d = null;
        }
      a.exports = function(m) {
        var b = p(i, h, arguments);
        if (f && d) {
          var w = f(b, "length");
          w.configurable && d(
            b,
            "length",
            { value: 1 + s(0, m.length - (arguments.length - 1)) }
          );
        }
        return b;
      };
      var g = function() {
        return p(i, u, arguments);
      };
      d ? d(a.exports, "apply", { value: g }) : a.exports.apply = g;
    }, { "function-bind": 38, "get-intrinsic": 39 }], 35: [function(t, a, e) {
      var i = typeof Reflect == "object" ? Reflect : null, o = i && typeof i.apply == "function" ? i.apply : function(v, N, T) {
        return Function.prototype.apply.call(v, N, T);
      }, u;
      i && typeof i.ownKeys == "function" ? u = i.ownKeys : Object.getOwnPropertySymbols ? u = function(v) {
        return Object.getOwnPropertyNames(v).concat(Object.getOwnPropertySymbols(v));
      } : u = function(v) {
        return Object.getOwnPropertyNames(v);
      };
      function h(v) {
        console && console.warn && console.warn(v);
      }
      var p = Number.isNaN || function(v) {
        return v !== v;
      };
      function f() {
        f.init.call(this);
      }
      a.exports = f, a.exports.once = O, f.EventEmitter = f, f.prototype._events = void 0, f.prototype._eventsCount = 0, f.prototype._maxListeners = void 0;
      var d = 10;
      function s(v) {
        if (typeof v != "function")
          throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof v);
      }
      Object.defineProperty(f, "defaultMaxListeners", {
        enumerable: !0,
        get: function() {
          return d;
        },
        set: function(v) {
          if (typeof v != "number" || v < 0 || p(v))
            throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + v + ".");
          d = v;
        }
      }), f.init = function() {
        (this._events === void 0 || this._events === Object.getPrototypeOf(this)._events) && (this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0), this._maxListeners = this._maxListeners || void 0;
      }, f.prototype.setMaxListeners = function(v) {
        if (typeof v != "number" || v < 0 || p(v))
          throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + v + ".");
        return this._maxListeners = v, this;
      };
      function g(v) {
        return v._maxListeners === void 0 ? f.defaultMaxListeners : v._maxListeners;
      }
      f.prototype.getMaxListeners = function() {
        return g(this);
      }, f.prototype.emit = function(v) {
        for (var N = [], T = 1; T < arguments.length; T++)
          N.push(arguments[T]);
        var G = v === "error", $ = this._events;
        if ($ !== void 0)
          G = G && $.error === void 0;
        else if (!G)
          return !1;
        if (G) {
          var J;
          if (N.length > 0 && (J = N[0]), J instanceof Error)
            throw J;
          var st = new Error("Unhandled error." + (J ? " (" + J.message + ")" : ""));
          throw st.context = J, st;
        }
        var D = $[v];
        if (D === void 0)
          return !1;
        if (typeof D == "function")
          o(D, this, N);
        else
          for (var E = D.length, Z = k(D, E), T = 0; T < E; ++T)
            o(Z[T], this, N);
        return !0;
      };
      function m(v, N, T, G) {
        var $, J, st;
        if (s(T), J = v._events, J === void 0 ? (J = v._events = /* @__PURE__ */ Object.create(null), v._eventsCount = 0) : (J.newListener !== void 0 && (v.emit(
          "newListener",
          N,
          T.listener ? T.listener : T
        ), J = v._events), st = J[N]), st === void 0)
          st = J[N] = T, ++v._eventsCount;
        else if (typeof st == "function" ? st = J[N] = G ? [T, st] : [st, T] : G ? st.unshift(T) : st.push(T), $ = g(v), $ > 0 && st.length > $ && !st.warned) {
          st.warned = !0;
          var D = new Error("Possible EventEmitter memory leak detected. " + st.length + " " + String(N) + " listeners added. Use emitter.setMaxListeners() to increase limit");
          D.name = "MaxListenersExceededWarning", D.emitter = v, D.type = N, D.count = st.length, h(D);
        }
        return v;
      }
      f.prototype.addListener = function(v, N) {
        return m(this, v, N, !1);
      }, f.prototype.on = f.prototype.addListener, f.prototype.prependListener = function(v, N) {
        return m(this, v, N, !0);
      };
      function b() {
        if (!this.fired)
          return this.target.removeListener(this.type, this.wrapFn), this.fired = !0, arguments.length === 0 ? this.listener.call(this.target) : this.listener.apply(this.target, arguments);
      }
      function w(v, N, T) {
        var G = { fired: !1, wrapFn: void 0, target: v, type: N, listener: T }, $ = b.bind(G);
        return $.listener = T, G.wrapFn = $, $;
      }
      f.prototype.once = function(v, N) {
        return s(N), this.on(v, w(this, v, N)), this;
      }, f.prototype.prependOnceListener = function(v, N) {
        return s(N), this.prependListener(v, w(this, v, N)), this;
      }, f.prototype.removeListener = function(v, N) {
        var T, G, $, J, st;
        if (s(N), G = this._events, G === void 0)
          return this;
        if (T = G[v], T === void 0)
          return this;
        if (T === N || T.listener === N)
          --this._eventsCount === 0 ? this._events = /* @__PURE__ */ Object.create(null) : (delete G[v], G.removeListener && this.emit("removeListener", v, T.listener || N));
        else if (typeof T != "function") {
          for ($ = -1, J = T.length - 1; J >= 0; J--)
            if (T[J] === N || T[J].listener === N) {
              st = T[J].listener, $ = J;
              break;
            }
          if ($ < 0)
            return this;
          $ === 0 ? T.shift() : C(T, $), T.length === 1 && (G[v] = T[0]), G.removeListener !== void 0 && this.emit("removeListener", v, st || N);
        }
        return this;
      }, f.prototype.off = f.prototype.removeListener, f.prototype.removeAllListeners = function(v) {
        var N, T, G;
        if (T = this._events, T === void 0)
          return this;
        if (T.removeListener === void 0)
          return arguments.length === 0 ? (this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0) : T[v] !== void 0 && (--this._eventsCount === 0 ? this._events = /* @__PURE__ */ Object.create(null) : delete T[v]), this;
        if (arguments.length === 0) {
          var $ = Object.keys(T), J;
          for (G = 0; G < $.length; ++G)
            J = $[G], J !== "removeListener" && this.removeAllListeners(J);
          return this.removeAllListeners("removeListener"), this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0, this;
        }
        if (N = T[v], typeof N == "function")
          this.removeListener(v, N);
        else if (N !== void 0)
          for (G = N.length - 1; G >= 0; G--)
            this.removeListener(v, N[G]);
        return this;
      };
      function _(v, N, T) {
        var G = v._events;
        if (G === void 0)
          return [];
        var $ = G[N];
        return $ === void 0 ? [] : typeof $ == "function" ? T ? [$.listener || $] : [$] : T ? j($) : k($, $.length);
      }
      f.prototype.listeners = function(v) {
        return _(this, v, !0);
      }, f.prototype.rawListeners = function(v) {
        return _(this, v, !1);
      }, f.listenerCount = function(v, N) {
        return typeof v.listenerCount == "function" ? v.listenerCount(N) : S.call(v, N);
      }, f.prototype.listenerCount = S;
      function S(v) {
        var N = this._events;
        if (N !== void 0) {
          var T = N[v];
          if (typeof T == "function")
            return 1;
          if (T !== void 0)
            return T.length;
        }
        return 0;
      }
      f.prototype.eventNames = function() {
        return this._eventsCount > 0 ? u(this._events) : [];
      };
      function k(v, N) {
        for (var T = new Array(N), G = 0; G < N; ++G)
          T[G] = v[G];
        return T;
      }
      function C(v, N) {
        for (; N + 1 < v.length; N++)
          v[N] = v[N + 1];
        v.pop();
      }
      function j(v) {
        for (var N = new Array(v.length), T = 0; T < N.length; ++T)
          N[T] = v[T].listener || v[T];
        return N;
      }
      function O(v, N) {
        return new Promise(function(T, G) {
          function $(st) {
            v.removeListener(N, J), G(st);
          }
          function J() {
            typeof v.removeListener == "function" && v.removeListener("error", $), T([].slice.call(arguments));
          }
          P(v, N, J, { once: !0 }), N !== "error" && I(v, $, { once: !0 });
        });
      }
      function I(v, N, T) {
        typeof v.on == "function" && P(v, "error", N, T);
      }
      function P(v, N, T, G) {
        if (typeof v.on == "function")
          G.once ? v.once(N, T) : v.on(N, T);
        else if (typeof v.addEventListener == "function")
          v.addEventListener(N, function $(J) {
            G.once && v.removeEventListener(N, $), T(J);
          });
        else
          throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof v);
      }
    }, {}], 36: [function(t, a, e) {
      var i = t("is-callable"), o = Object.prototype.toString, u = Object.prototype.hasOwnProperty, h = function(s, g, m) {
        for (var b = 0, w = s.length; b < w; b++)
          u.call(s, b) && (m == null ? g(s[b], b, s) : g.call(m, s[b], b, s));
      }, p = function(s, g, m) {
        for (var b = 0, w = s.length; b < w; b++)
          m == null ? g(s.charAt(b), b, s) : g.call(m, s.charAt(b), b, s);
      }, f = function(s, g, m) {
        for (var b in s)
          u.call(s, b) && (m == null ? g(s[b], b, s) : g.call(m, s[b], b, s));
      }, d = function(s, g, m) {
        if (!i(g))
          throw new TypeError("iterator must be a function");
        var b;
        arguments.length >= 3 && (b = m), o.call(s) === "[object Array]" ? h(s, g, b) : typeof s == "string" ? p(s, g, b) : f(s, g, b);
      };
      a.exports = d;
    }, { "is-callable": 48 }], 37: [function(t, a, e) {
      var i = "Function.prototype.bind called on incompatible ", o = Array.prototype.slice, u = Object.prototype.toString, h = "[object Function]";
      a.exports = function(p) {
        var f = this;
        if (typeof f != "function" || u.call(f) !== h)
          throw new TypeError(i + f);
        for (var d = o.call(arguments, 1), s, g = function() {
          if (this instanceof s) {
            var S = f.apply(
              this,
              d.concat(o.call(arguments))
            );
            return Object(S) === S ? S : this;
          } else
            return f.apply(
              p,
              d.concat(o.call(arguments))
            );
        }, m = Math.max(0, f.length - d.length), b = [], w = 0; w < m; w++)
          b.push("$" + w);
        if (s = Function("binder", "return function (" + b.join(",") + "){ return binder.apply(this,arguments); }")(g), f.prototype) {
          var _ = function() {
          };
          _.prototype = f.prototype, s.prototype = new _(), _.prototype = null;
        }
        return s;
      };
    }, {}], 38: [function(t, a, e) {
      var i = t("./implementation");
      a.exports = Function.prototype.bind || i;
    }, { "./implementation": 37 }], 39: [function(t, a, e) {
      var i, o = SyntaxError, u = Function, h = TypeError, p = function(D) {
        try {
          return u('"use strict"; return (' + D + ").constructor;")();
        } catch {
        }
      }, f = Object.getOwnPropertyDescriptor;
      if (f)
        try {
          f({}, "");
        } catch {
          f = null;
        }
      var d = function() {
        throw new h();
      }, s = f ? (function() {
        try {
          return arguments.callee, d;
        } catch {
          try {
            return f(arguments, "callee").get;
          } catch {
            return d;
          }
        }
      })() : d, g = t("has-symbols")(), m = Object.getPrototypeOf || function(D) {
        return D.__proto__;
      }, b = {}, w = typeof Uint8Array > "u" ? i : m(Uint8Array), _ = {
        "%AggregateError%": typeof AggregateError > "u" ? i : AggregateError,
        "%Array%": Array,
        "%ArrayBuffer%": typeof ArrayBuffer > "u" ? i : ArrayBuffer,
        "%ArrayIteratorPrototype%": g ? m([][Symbol.iterator]()) : i,
        "%AsyncFromSyncIteratorPrototype%": i,
        "%AsyncFunction%": b,
        "%AsyncGenerator%": b,
        "%AsyncGeneratorFunction%": b,
        "%AsyncIteratorPrototype%": b,
        "%Atomics%": typeof Atomics > "u" ? i : Atomics,
        "%BigInt%": typeof BigInt > "u" ? i : BigInt,
        "%BigInt64Array%": typeof BigInt64Array > "u" ? i : BigInt64Array,
        "%BigUint64Array%": typeof BigUint64Array > "u" ? i : BigUint64Array,
        "%Boolean%": Boolean,
        "%DataView%": typeof DataView > "u" ? i : DataView,
        "%Date%": Date,
        "%decodeURI%": decodeURI,
        "%decodeURIComponent%": decodeURIComponent,
        "%encodeURI%": encodeURI,
        "%encodeURIComponent%": encodeURIComponent,
        "%Error%": Error,
        "%eval%": eval,
        // eslint-disable-line no-eval
        "%EvalError%": EvalError,
        "%Float32Array%": typeof Float32Array > "u" ? i : Float32Array,
        "%Float64Array%": typeof Float64Array > "u" ? i : Float64Array,
        "%FinalizationRegistry%": typeof FinalizationRegistry > "u" ? i : FinalizationRegistry,
        "%Function%": u,
        "%GeneratorFunction%": b,
        "%Int8Array%": typeof Int8Array > "u" ? i : Int8Array,
        "%Int16Array%": typeof Int16Array > "u" ? i : Int16Array,
        "%Int32Array%": typeof Int32Array > "u" ? i : Int32Array,
        "%isFinite%": isFinite,
        "%isNaN%": isNaN,
        "%IteratorPrototype%": g ? m(m([][Symbol.iterator]())) : i,
        "%JSON%": typeof JSON == "object" ? JSON : i,
        "%Map%": typeof Map > "u" ? i : Map,
        "%MapIteratorPrototype%": typeof Map > "u" || !g ? i : m((/* @__PURE__ */ new Map())[Symbol.iterator]()),
        "%Math%": Math,
        "%Number%": Number,
        "%Object%": Object,
        "%parseFloat%": parseFloat,
        "%parseInt%": parseInt,
        "%Promise%": typeof Promise > "u" ? i : Promise,
        "%Proxy%": typeof Proxy > "u" ? i : Proxy,
        "%RangeError%": RangeError,
        "%ReferenceError%": ReferenceError,
        "%Reflect%": typeof Reflect > "u" ? i : Reflect,
        "%RegExp%": RegExp,
        "%Set%": typeof Set > "u" ? i : Set,
        "%SetIteratorPrototype%": typeof Set > "u" || !g ? i : m((/* @__PURE__ */ new Set())[Symbol.iterator]()),
        "%SharedArrayBuffer%": typeof SharedArrayBuffer > "u" ? i : SharedArrayBuffer,
        "%String%": String,
        "%StringIteratorPrototype%": g ? m(""[Symbol.iterator]()) : i,
        "%Symbol%": g ? Symbol : i,
        "%SyntaxError%": o,
        "%ThrowTypeError%": s,
        "%TypedArray%": w,
        "%TypeError%": h,
        "%Uint8Array%": typeof Uint8Array > "u" ? i : Uint8Array,
        "%Uint8ClampedArray%": typeof Uint8ClampedArray > "u" ? i : Uint8ClampedArray,
        "%Uint16Array%": typeof Uint16Array > "u" ? i : Uint16Array,
        "%Uint32Array%": typeof Uint32Array > "u" ? i : Uint32Array,
        "%URIError%": URIError,
        "%WeakMap%": typeof WeakMap > "u" ? i : WeakMap,
        "%WeakRef%": typeof WeakRef > "u" ? i : WeakRef,
        "%WeakSet%": typeof WeakSet > "u" ? i : WeakSet
      };
      try {
        null.error;
      } catch (D) {
        var S = m(m(D));
        _["%Error.prototype%"] = S;
      }
      var k = function D(E) {
        var Z;
        if (E === "%AsyncFunction%")
          Z = p("async function () {}");
        else if (E === "%GeneratorFunction%")
          Z = p("function* () {}");
        else if (E === "%AsyncGeneratorFunction%")
          Z = p("async function* () {}");
        else if (E === "%AsyncGenerator%") {
          var nt = D("%AsyncGeneratorFunction%");
          nt && (Z = nt.prototype);
        } else if (E === "%AsyncIteratorPrototype%") {
          var ut = D("%AsyncGenerator%");
          ut && (Z = m(ut.prototype));
        }
        return _[E] = Z, Z;
      }, C = {
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
      }, j = t("function-bind"), O = t("has"), I = j.call(Function.call, Array.prototype.concat), P = j.call(Function.apply, Array.prototype.splice), v = j.call(Function.call, String.prototype.replace), N = j.call(Function.call, String.prototype.slice), T = j.call(Function.call, RegExp.prototype.exec), G = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g, $ = /\\(\\)?/g, J = function(D) {
        var E = N(D, 0, 1), Z = N(D, -1);
        if (E === "%" && Z !== "%")
          throw new o("invalid intrinsic syntax, expected closing `%`");
        if (Z === "%" && E !== "%")
          throw new o("invalid intrinsic syntax, expected opening `%`");
        var nt = [];
        return v(D, G, function(ut, Et, it, U) {
          nt[nt.length] = it ? v(U, $, "$1") : Et || ut;
        }), nt;
      }, st = function(D, E) {
        var Z = D, nt;
        if (O(C, Z) && (nt = C[Z], Z = "%" + nt[0] + "%"), O(_, Z)) {
          var ut = _[Z];
          if (ut === b && (ut = k(Z)), typeof ut > "u" && !E)
            throw new h("intrinsic " + D + " exists, but is not available. Please file an issue!");
          return {
            alias: nt,
            name: Z,
            value: ut
          };
        }
        throw new o("intrinsic " + D + " does not exist!");
      };
      a.exports = function(D, E) {
        if (typeof D != "string" || D.length === 0)
          throw new h("intrinsic name must be a non-empty string");
        if (arguments.length > 1 && typeof E != "boolean")
          throw new h('"allowMissing" argument must be a boolean');
        if (T(/^%?[^%]*%?$/, D) === null)
          throw new o("`%` may not be present anywhere but at the beginning and end of the intrinsic name");
        var Z = J(D), nt = Z.length > 0 ? Z[0] : "", ut = st("%" + nt + "%", E), Et = ut.name, it = ut.value, U = !1, W = ut.alias;
        W && (nt = W[0], P(Z, I([0, 1], W)));
        for (var V = 1, ft = !0; V < Z.length; V += 1) {
          var q = Z[V], Y = N(q, 0, 1), Q = N(q, -1);
          if ((Y === '"' || Y === "'" || Y === "`" || Q === '"' || Q === "'" || Q === "`") && Y !== Q)
            throw new o("property names with quotes must have matching quotes");
          if ((q === "constructor" || !ft) && (U = !0), nt += "." + q, Et = "%" + nt + "%", O(_, Et))
            it = _[Et];
          else if (it != null) {
            if (!(q in it)) {
              if (!E)
                throw new h("base intrinsic for " + D + " exists, but the property is not available.");
              return;
            }
            if (f && V + 1 >= Z.length) {
              var ct = f(it, q);
              ft = !!ct, ft && "get" in ct && !("originalValue" in ct.get) ? it = ct.get : it = it[q];
            } else
              ft = O(it, q), it = it[q];
            ft && !U && (_[Et] = it);
          }
        }
        return it;
      };
    }, { "function-bind": 38, has: 44, "has-symbols": 41 }], 40: [function(t, a, e) {
      var i = t("get-intrinsic"), o = i("%Object.getOwnPropertyDescriptor%", !0);
      if (o)
        try {
          o([], "length");
        } catch {
          o = null;
        }
      a.exports = o;
    }, { "get-intrinsic": 39 }], 41: [function(t, a, e) {
      var i = typeof Symbol < "u" && Symbol, o = t("./shams");
      a.exports = function() {
        return typeof i != "function" || typeof Symbol != "function" || typeof i("foo") != "symbol" || typeof Symbol("bar") != "symbol" ? !1 : o();
      };
    }, { "./shams": 42 }], 42: [function(t, a, e) {
      a.exports = function() {
        if (typeof Symbol != "function" || typeof Object.getOwnPropertySymbols != "function")
          return !1;
        if (typeof Symbol.iterator == "symbol")
          return !0;
        var i = {}, o = Symbol("test"), u = Object(o);
        if (typeof o == "string" || Object.prototype.toString.call(o) !== "[object Symbol]" || Object.prototype.toString.call(u) !== "[object Symbol]")
          return !1;
        var h = 42;
        i[o] = h;
        for (o in i)
          return !1;
        if (typeof Object.keys == "function" && Object.keys(i).length !== 0 || typeof Object.getOwnPropertyNames == "function" && Object.getOwnPropertyNames(i).length !== 0)
          return !1;
        var p = Object.getOwnPropertySymbols(i);
        if (p.length !== 1 || p[0] !== o || !Object.prototype.propertyIsEnumerable.call(i, o))
          return !1;
        if (typeof Object.getOwnPropertyDescriptor == "function") {
          var f = Object.getOwnPropertyDescriptor(i, o);
          if (f.value !== h || f.enumerable !== !0)
            return !1;
        }
        return !0;
      };
    }, {}], 43: [function(t, a, e) {
      var i = t("has-symbols/shams");
      a.exports = function() {
        return i() && !!Symbol.toStringTag;
      };
    }, { "has-symbols/shams": 42 }], 44: [function(t, a, e) {
      var i = t("function-bind");
      a.exports = i.call(Function.call, Object.prototype.hasOwnProperty);
    }, { "function-bind": 38 }], 45: [function(t, a, e) {
      /*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
      e.read = function(i, o, u, h, p) {
        var f, d, s = p * 8 - h - 1, g = (1 << s) - 1, m = g >> 1, b = -7, w = u ? p - 1 : 0, _ = u ? -1 : 1, S = i[o + w];
        for (w += _, f = S & (1 << -b) - 1, S >>= -b, b += s; b > 0; f = f * 256 + i[o + w], w += _, b -= 8)
          ;
        for (d = f & (1 << -b) - 1, f >>= -b, b += h; b > 0; d = d * 256 + i[o + w], w += _, b -= 8)
          ;
        if (f === 0)
          f = 1 - m;
        else {
          if (f === g)
            return d ? NaN : (S ? -1 : 1) * (1 / 0);
          d = d + Math.pow(2, h), f = f - m;
        }
        return (S ? -1 : 1) * d * Math.pow(2, f - h);
      }, e.write = function(i, o, u, h, p, f) {
        var d, s, g, m = f * 8 - p - 1, b = (1 << m) - 1, w = b >> 1, _ = p === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0, S = h ? 0 : f - 1, k = h ? 1 : -1, C = o < 0 || o === 0 && 1 / o < 0 ? 1 : 0;
        for (o = Math.abs(o), isNaN(o) || o === 1 / 0 ? (s = isNaN(o) ? 1 : 0, d = b) : (d = Math.floor(Math.log(o) / Math.LN2), o * (g = Math.pow(2, -d)) < 1 && (d--, g *= 2), d + w >= 1 ? o += _ / g : o += _ * Math.pow(2, 1 - w), o * g >= 2 && (d++, g /= 2), d + w >= b ? (s = 0, d = b) : d + w >= 1 ? (s = (o * g - 1) * Math.pow(2, p), d = d + w) : (s = o * Math.pow(2, w - 1) * Math.pow(2, p), d = 0)); p >= 8; i[u + S] = s & 255, S += k, s /= 256, p -= 8)
          ;
        for (d = d << p | s, m += p; m > 0; i[u + S] = d & 255, S += k, d /= 256, m -= 8)
          ;
        i[u + S - k] |= C * 128;
      };
    }, {}], 46: [function(t, a, e) {
      typeof Object.create == "function" ? a.exports = function(i, o) {
        o && (i.super_ = o, i.prototype = Object.create(o.prototype, {
          constructor: {
            value: i,
            enumerable: !1,
            writable: !0,
            configurable: !0
          }
        }));
      } : a.exports = function(i, o) {
        if (o) {
          i.super_ = o;
          var u = function() {
          };
          u.prototype = o.prototype, i.prototype = new u(), i.prototype.constructor = i;
        }
      };
    }, {}], 47: [function(t, a, e) {
      var i = t("has-tostringtag/shams")(), o = t("call-bind/callBound"), u = o("Object.prototype.toString"), h = function(d) {
        return i && d && typeof d == "object" && Symbol.toStringTag in d ? !1 : u(d) === "[object Arguments]";
      }, p = function(d) {
        return h(d) ? !0 : d !== null && typeof d == "object" && typeof d.length == "number" && d.length >= 0 && u(d) !== "[object Array]" && u(d.callee) === "[object Function]";
      }, f = (function() {
        return h(arguments);
      })();
      h.isLegacyArguments = p, a.exports = f ? h : p;
    }, { "call-bind/callBound": 33, "has-tostringtag/shams": 43 }], 48: [function(t, a, e) {
      var i = Function.prototype.toString, o = typeof Reflect == "object" && Reflect !== null && Reflect.apply, u, h;
      if (typeof o == "function" && typeof Object.defineProperty == "function")
        try {
          u = Object.defineProperty({}, "length", {
            get: function() {
              throw h;
            }
          }), h = {}, o(function() {
            throw 42;
          }, null, u);
        } catch (I) {
          I !== h && (o = null);
        }
      else
        o = null;
      var p = /^\s*class\b/, f = function(I) {
        try {
          var P = i.call(I);
          return p.test(P);
        } catch {
          return !1;
        }
      }, d = function(I) {
        try {
          return f(I) ? !1 : (i.call(I), !0);
        } catch {
          return !1;
        }
      }, s = Object.prototype.toString, g = "[object Object]", m = "[object Function]", b = "[object GeneratorFunction]", w = "[object HTMLAllCollection]", _ = "[object HTML document.all class]", S = "[object HTMLCollection]", k = typeof Symbol == "function" && !!Symbol.toStringTag, C = !(0 in [,]), j = function() {
        return !1;
      };
      if (typeof document == "object") {
        var O = document.all;
        s.call(O) === s.call(document.all) && (j = function(I) {
          if ((C || !I) && (typeof I > "u" || typeof I == "object"))
            try {
              var P = s.call(I);
              return (P === w || P === _ || P === S || P === g) && I("") == null;
            } catch {
            }
          return !1;
        });
      }
      a.exports = o ? function(I) {
        if (j(I))
          return !0;
        if (!I || typeof I != "function" && typeof I != "object")
          return !1;
        try {
          o(I, null, u);
        } catch (P) {
          if (P !== h)
            return !1;
        }
        return !f(I) && d(I);
      } : function(I) {
        if (j(I))
          return !0;
        if (!I || typeof I != "function" && typeof I != "object")
          return !1;
        if (k)
          return d(I);
        if (f(I))
          return !1;
        var P = s.call(I);
        return P !== m && P !== b && !/^\[object HTML/.test(P) ? !1 : d(I);
      };
    }, {}], 49: [function(t, a, e) {
      var i = Object.prototype.toString, o = Function.prototype.toString, u = /^\s*(?:function)?\*/, h = t("has-tostringtag/shams")(), p = Object.getPrototypeOf, f = function() {
        if (!h)
          return !1;
        try {
          return Function("return function*() {}")();
        } catch {
        }
      }, d;
      a.exports = function(s) {
        if (typeof s != "function")
          return !1;
        if (u.test(o.call(s)))
          return !0;
        if (!h) {
          var g = i.call(s);
          return g === "[object GeneratorFunction]";
        }
        if (!p)
          return !1;
        if (typeof d > "u") {
          var m = f();
          d = m ? p(m) : !1;
        }
        return p(s) === d;
      };
    }, { "has-tostringtag/shams": 43 }], 50: [function(t, a, e) {
      (function(i) {
        (function() {
          var o = t("for-each"), u = t("available-typed-arrays"), h = t("call-bind/callBound"), p = h("Object.prototype.toString"), f = t("has-tostringtag/shams")(), d = t("gopd"), s = typeof globalThis > "u" ? i : globalThis, g = u(), m = h("Array.prototype.indexOf", !0) || function(k, C) {
            for (var j = 0; j < k.length; j += 1)
              if (k[j] === C)
                return j;
            return -1;
          }, b = h("String.prototype.slice"), w = {}, _ = Object.getPrototypeOf;
          f && d && _ && o(g, function(k) {
            var C = new s[k]();
            if (Symbol.toStringTag in C) {
              var j = _(C), O = d(j, Symbol.toStringTag);
              if (!O) {
                var I = _(j);
                O = d(I, Symbol.toStringTag);
              }
              w[k] = O.get;
            }
          });
          var S = function(k) {
            var C = !1;
            return o(w, function(j, O) {
              if (!C)
                try {
                  C = j.call(k) === O;
                } catch {
                }
            }), C;
          };
          a.exports = function(k) {
            if (!k || typeof k != "object")
              return !1;
            if (!f || !(Symbol.toStringTag in k)) {
              var C = b(p(k), 8, -1);
              return m(g, C) > -1;
            }
            return d ? S(k) : !1;
          };
        }).call(this);
      }).call(this, typeof ee < "u" ? ee : typeof self < "u" ? self : typeof window < "u" ? window : {});
    }, { "available-typed-arrays": 27, "call-bind/callBound": 33, "for-each": 36, gopd: 40, "has-tostringtag/shams": 43 }], 51: [function(t, a, e) {
      var i = Object.getOwnPropertySymbols, o = Object.prototype.hasOwnProperty, u = Object.prototype.propertyIsEnumerable;
      function h(f) {
        if (f == null)
          throw new TypeError("Object.assign cannot be called with null or undefined");
        return Object(f);
      }
      function p() {
        try {
          if (!Object.assign)
            return !1;
          var f = new String("abc");
          if (f[5] = "de", Object.getOwnPropertyNames(f)[0] === "5")
            return !1;
          for (var d = {}, s = 0; s < 10; s++)
            d["_" + String.fromCharCode(s)] = s;
          var g = Object.getOwnPropertyNames(d).map(function(b) {
            return d[b];
          });
          if (g.join("") !== "0123456789")
            return !1;
          var m = {};
          return "abcdefghijklmnopqrst".split("").forEach(function(b) {
            m[b] = b;
          }), Object.keys(Object.assign({}, m)).join("") === "abcdefghijklmnopqrst";
        } catch {
          return !1;
        }
      }
      a.exports = p() ? Object.assign : function(f, d) {
        for (var s, g = h(f), m, b = 1; b < arguments.length; b++) {
          s = Object(arguments[b]);
          for (var w in s)
            o.call(s, w) && (g[w] = s[w]);
          if (i) {
            m = i(s);
            for (var _ = 0; _ < m.length; _++)
              u.call(s, m[_]) && (g[m[_]] = s[m[_]]);
          }
        }
        return g;
      };
    }, {}], 52: [function(t, a, e) {
      var i = typeof Uint8Array < "u" && typeof Uint16Array < "u" && typeof Int32Array < "u";
      function o(p, f) {
        return Object.prototype.hasOwnProperty.call(p, f);
      }
      e.assign = function(p) {
        for (var f = Array.prototype.slice.call(arguments, 1); f.length; ) {
          var d = f.shift();
          if (d) {
            if (typeof d != "object")
              throw new TypeError(d + "must be non-object");
            for (var s in d)
              o(d, s) && (p[s] = d[s]);
          }
        }
        return p;
      }, e.shrinkBuf = function(p, f) {
        return p.length === f ? p : p.subarray ? p.subarray(0, f) : (p.length = f, p);
      };
      var u = {
        arraySet: function(p, f, d, s, g) {
          if (f.subarray && p.subarray) {
            p.set(f.subarray(d, d + s), g);
            return;
          }
          for (var m = 0; m < s; m++)
            p[g + m] = f[d + m];
        },
        // Join array of chunks to single array.
        flattenChunks: function(p) {
          var f, d, s, g, m, b;
          for (s = 0, f = 0, d = p.length; f < d; f++)
            s += p[f].length;
          for (b = new Uint8Array(s), g = 0, f = 0, d = p.length; f < d; f++)
            m = p[f], b.set(m, g), g += m.length;
          return b;
        }
      }, h = {
        arraySet: function(p, f, d, s, g) {
          for (var m = 0; m < s; m++)
            p[g + m] = f[d + m];
        },
        // Join array of chunks to single array.
        flattenChunks: function(p) {
          return [].concat.apply([], p);
        }
      };
      e.setTyped = function(p) {
        p ? (e.Buf8 = Uint8Array, e.Buf16 = Uint16Array, e.Buf32 = Int32Array, e.assign(e, u)) : (e.Buf8 = Array, e.Buf16 = Array, e.Buf32 = Array, e.assign(e, h));
      }, e.setTyped(i);
    }, {}], 53: [function(t, a, e) {
      function i(o, u, h, p) {
        for (var f = o & 65535 | 0, d = o >>> 16 & 65535 | 0, s = 0; h !== 0; ) {
          s = h > 2e3 ? 2e3 : h, h -= s;
          do
            f = f + u[p++] | 0, d = d + f | 0;
          while (--s);
          f %= 65521, d %= 65521;
        }
        return f | d << 16 | 0;
      }
      a.exports = i;
    }, {}], 54: [function(t, a, e) {
      a.exports = {
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
    }, {}], 55: [function(t, a, e) {
      function i() {
        for (var h, p = [], f = 0; f < 256; f++) {
          h = f;
          for (var d = 0; d < 8; d++)
            h = h & 1 ? 3988292384 ^ h >>> 1 : h >>> 1;
          p[f] = h;
        }
        return p;
      }
      var o = i();
      function u(h, p, f, d) {
        var s = o, g = d + f;
        h ^= -1;
        for (var m = d; m < g; m++)
          h = h >>> 8 ^ s[(h ^ p[m]) & 255];
        return h ^ -1;
      }
      a.exports = u;
    }, {}], 56: [function(t, a, e) {
      var i = t("../utils/common"), o = t("./trees"), u = t("./adler32"), h = t("./crc32"), p = t("./messages"), f = 0, d = 1, s = 3, g = 4, m = 5, b = 0, w = 1, _ = -2, S = -3, k = -5, C = -1, j = 1, O = 2, I = 3, P = 4, v = 0, N = 2, T = 8, G = 9, $ = 15, J = 8, st = 29, D = 256, E = D + 1 + st, Z = 30, nt = 19, ut = 2 * E + 1, Et = 15, it = 3, U = 258, W = U + it + 1, V = 32, ft = 42, q = 69, Y = 73, Q = 91, ct = 103, bt = 113, gt = 666, z = 1, X = 2, ot = 3, vt = 4, wt = 3;
      function B(c, rt) {
        return c.msg = p[rt], rt;
      }
      function F(c) {
        return (c << 1) - (c > 4 ? 9 : 0);
      }
      function l(c) {
        for (var rt = c.length; --rt >= 0; )
          c[rt] = 0;
      }
      function y(c) {
        var rt = c.state, at = rt.pending;
        at > c.avail_out && (at = c.avail_out), at !== 0 && (i.arraySet(c.output, rt.pending_buf, rt.pending_out, at, c.next_out), c.next_out += at, rt.pending_out += at, c.total_out += at, c.avail_out -= at, rt.pending -= at, rt.pending === 0 && (rt.pending_out = 0));
      }
      function A(c, rt) {
        o._tr_flush_block(c, c.block_start >= 0 ? c.block_start : -1, c.strstart - c.block_start, rt), c.block_start = c.strstart, y(c.strm);
      }
      function L(c, rt) {
        c.pending_buf[c.pending++] = rt;
      }
      function tt(c, rt) {
        c.pending_buf[c.pending++] = rt >>> 8 & 255, c.pending_buf[c.pending++] = rt & 255;
      }
      function ht(c, rt, at, R) {
        var H = c.avail_in;
        return H > R && (H = R), H === 0 ? 0 : (c.avail_in -= H, i.arraySet(rt, c.input, c.next_in, H, at), c.state.wrap === 1 ? c.adler = u(c.adler, rt, H, at) : c.state.wrap === 2 && (c.adler = h(c.adler, rt, H, at)), c.next_in += H, c.total_in += H, H);
      }
      function xt(c, rt) {
        var at = c.max_chain_length, R = c.strstart, H, et, Pt = c.prev_length, At = c.nice_match, St = c.strstart > c.w_size - W ? c.strstart - (c.w_size - W) : 0, jt = c.window, ge = c.w_mask, Ht = c.prev, Ft = c.strstart + U, Kt = jt[R + Pt - 1], te = jt[R + Pt];
        c.prev_length >= c.good_match && (at >>= 2), At > c.lookahead && (At = c.lookahead);
        do
          if (H = rt, !(jt[H + Pt] !== te || jt[H + Pt - 1] !== Kt || jt[H] !== jt[R] || jt[++H] !== jt[R + 1])) {
            R += 2, H++;
            do
              ;
            while (jt[++R] === jt[++H] && jt[++R] === jt[++H] && jt[++R] === jt[++H] && jt[++R] === jt[++H] && jt[++R] === jt[++H] && jt[++R] === jt[++H] && jt[++R] === jt[++H] && jt[++R] === jt[++H] && R < Ft);
            if (et = U - (Ft - R), R = Ft - U, et > Pt) {
              if (c.match_start = rt, Pt = et, et >= At)
                break;
              Kt = jt[R + Pt - 1], te = jt[R + Pt];
            }
          }
        while ((rt = Ht[rt & ge]) > St && --at !== 0);
        return Pt <= c.lookahead ? Pt : c.lookahead;
      }
      function It(c) {
        var rt = c.w_size, at, R, H, et, Pt;
        do {
          if (et = c.window_size - c.lookahead - c.strstart, c.strstart >= rt + (rt - W)) {
            i.arraySet(c.window, c.window, rt, rt, 0), c.match_start -= rt, c.strstart -= rt, c.block_start -= rt, R = c.hash_size, at = R;
            do
              H = c.head[--at], c.head[at] = H >= rt ? H - rt : 0;
            while (--R);
            R = rt, at = R;
            do
              H = c.prev[--at], c.prev[at] = H >= rt ? H - rt : 0;
            while (--R);
            et += rt;
          }
          if (c.strm.avail_in === 0)
            break;
          if (R = ht(c.strm, c.window, c.strstart + c.lookahead, et), c.lookahead += R, c.lookahead + c.insert >= it)
            for (Pt = c.strstart - c.insert, c.ins_h = c.window[Pt], c.ins_h = (c.ins_h << c.hash_shift ^ c.window[Pt + 1]) & c.hash_mask; c.insert && (c.ins_h = (c.ins_h << c.hash_shift ^ c.window[Pt + it - 1]) & c.hash_mask, c.prev[Pt & c.w_mask] = c.head[c.ins_h], c.head[c.ins_h] = Pt, Pt++, c.insert--, !(c.lookahead + c.insert < it)); )
              ;
        } while (c.lookahead < W && c.strm.avail_in !== 0);
      }
      function Zt(c, rt) {
        var at = 65535;
        for (at > c.pending_buf_size - 5 && (at = c.pending_buf_size - 5); ; ) {
          if (c.lookahead <= 1) {
            if (It(c), c.lookahead === 0 && rt === f)
              return z;
            if (c.lookahead === 0)
              break;
          }
          c.strstart += c.lookahead, c.lookahead = 0;
          var R = c.block_start + at;
          if ((c.strstart === 0 || c.strstart >= R) && (c.lookahead = c.strstart - R, c.strstart = R, A(c, !1), c.strm.avail_out === 0) || c.strstart - c.block_start >= c.w_size - W && (A(c, !1), c.strm.avail_out === 0))
            return z;
        }
        return c.insert = 0, rt === g ? (A(c, !0), c.strm.avail_out === 0 ? ot : vt) : (c.strstart > c.block_start && (A(c, !1), c.strm.avail_out), z);
      }
      function Tt(c, rt) {
        for (var at, R; ; ) {
          if (c.lookahead < W) {
            if (It(c), c.lookahead < W && rt === f)
              return z;
            if (c.lookahead === 0)
              break;
          }
          if (at = 0, c.lookahead >= it && (c.ins_h = (c.ins_h << c.hash_shift ^ c.window[c.strstart + it - 1]) & c.hash_mask, at = c.prev[c.strstart & c.w_mask] = c.head[c.ins_h], c.head[c.ins_h] = c.strstart), at !== 0 && c.strstart - at <= c.w_size - W && (c.match_length = xt(c, at)), c.match_length >= it)
            if (R = o._tr_tally(c, c.strstart - c.match_start, c.match_length - it), c.lookahead -= c.match_length, c.match_length <= c.max_lazy_match && c.lookahead >= it) {
              c.match_length--;
              do
                c.strstart++, c.ins_h = (c.ins_h << c.hash_shift ^ c.window[c.strstart + it - 1]) & c.hash_mask, at = c.prev[c.strstart & c.w_mask] = c.head[c.ins_h], c.head[c.ins_h] = c.strstart;
              while (--c.match_length !== 0);
              c.strstart++;
            } else
              c.strstart += c.match_length, c.match_length = 0, c.ins_h = c.window[c.strstart], c.ins_h = (c.ins_h << c.hash_shift ^ c.window[c.strstart + 1]) & c.hash_mask;
          else
            R = o._tr_tally(c, 0, c.window[c.strstart]), c.lookahead--, c.strstart++;
          if (R && (A(c, !1), c.strm.avail_out === 0))
            return z;
        }
        return c.insert = c.strstart < it - 1 ? c.strstart : it - 1, rt === g ? (A(c, !0), c.strm.avail_out === 0 ? ot : vt) : c.last_lit && (A(c, !1), c.strm.avail_out === 0) ? z : X;
      }
      function Nt(c, rt) {
        for (var at, R, H; ; ) {
          if (c.lookahead < W) {
            if (It(c), c.lookahead < W && rt === f)
              return z;
            if (c.lookahead === 0)
              break;
          }
          if (at = 0, c.lookahead >= it && (c.ins_h = (c.ins_h << c.hash_shift ^ c.window[c.strstart + it - 1]) & c.hash_mask, at = c.prev[c.strstart & c.w_mask] = c.head[c.ins_h], c.head[c.ins_h] = c.strstart), c.prev_length = c.match_length, c.prev_match = c.match_start, c.match_length = it - 1, at !== 0 && c.prev_length < c.max_lazy_match && c.strstart - at <= c.w_size - W && (c.match_length = xt(c, at), c.match_length <= 5 && (c.strategy === j || c.match_length === it && c.strstart - c.match_start > 4096) && (c.match_length = it - 1)), c.prev_length >= it && c.match_length <= c.prev_length) {
            H = c.strstart + c.lookahead - it, R = o._tr_tally(c, c.strstart - 1 - c.prev_match, c.prev_length - it), c.lookahead -= c.prev_length - 1, c.prev_length -= 2;
            do
              ++c.strstart <= H && (c.ins_h = (c.ins_h << c.hash_shift ^ c.window[c.strstart + it - 1]) & c.hash_mask, at = c.prev[c.strstart & c.w_mask] = c.head[c.ins_h], c.head[c.ins_h] = c.strstart);
            while (--c.prev_length !== 0);
            if (c.match_available = 0, c.match_length = it - 1, c.strstart++, R && (A(c, !1), c.strm.avail_out === 0))
              return z;
          } else if (c.match_available) {
            if (R = o._tr_tally(c, 0, c.window[c.strstart - 1]), R && A(c, !1), c.strstart++, c.lookahead--, c.strm.avail_out === 0)
              return z;
          } else
            c.match_available = 1, c.strstart++, c.lookahead--;
        }
        return c.match_available && (R = o._tr_tally(c, 0, c.window[c.strstart - 1]), c.match_available = 0), c.insert = c.strstart < it - 1 ? c.strstart : it - 1, rt === g ? (A(c, !0), c.strm.avail_out === 0 ? ot : vt) : c.last_lit && (A(c, !1), c.strm.avail_out === 0) ? z : X;
      }
      function qt(c, rt) {
        for (var at, R, H, et, Pt = c.window; ; ) {
          if (c.lookahead <= U) {
            if (It(c), c.lookahead <= U && rt === f)
              return z;
            if (c.lookahead === 0)
              break;
          }
          if (c.match_length = 0, c.lookahead >= it && c.strstart > 0 && (H = c.strstart - 1, R = Pt[H], R === Pt[++H] && R === Pt[++H] && R === Pt[++H])) {
            et = c.strstart + U;
            do
              ;
            while (R === Pt[++H] && R === Pt[++H] && R === Pt[++H] && R === Pt[++H] && R === Pt[++H] && R === Pt[++H] && R === Pt[++H] && R === Pt[++H] && H < et);
            c.match_length = U - (et - H), c.match_length > c.lookahead && (c.match_length = c.lookahead);
          }
          if (c.match_length >= it ? (at = o._tr_tally(c, 1, c.match_length - it), c.lookahead -= c.match_length, c.strstart += c.match_length, c.match_length = 0) : (at = o._tr_tally(c, 0, c.window[c.strstart]), c.lookahead--, c.strstart++), at && (A(c, !1), c.strm.avail_out === 0))
            return z;
        }
        return c.insert = 0, rt === g ? (A(c, !0), c.strm.avail_out === 0 ? ot : vt) : c.last_lit && (A(c, !1), c.strm.avail_out === 0) ? z : X;
      }
      function Jt(c, rt) {
        for (var at; ; ) {
          if (c.lookahead === 0 && (It(c), c.lookahead === 0)) {
            if (rt === f)
              return z;
            break;
          }
          if (c.match_length = 0, at = o._tr_tally(c, 0, c.window[c.strstart]), c.lookahead--, c.strstart++, at && (A(c, !1), c.strm.avail_out === 0))
            return z;
        }
        return c.insert = 0, rt === g ? (A(c, !0), c.strm.avail_out === 0 ? ot : vt) : c.last_lit && (A(c, !1), c.strm.avail_out === 0) ? z : X;
      }
      function Wt(c, rt, at, R, H) {
        this.good_length = c, this.max_lazy = rt, this.nice_length = at, this.max_chain = R, this.func = H;
      }
      var Vt;
      Vt = [
        /*      good lazy nice chain */
        new Wt(0, 0, 0, 0, Zt),
        /* 0 store only */
        new Wt(4, 4, 8, 4, Tt),
        /* 1 max speed, no lazy matches */
        new Wt(4, 5, 16, 8, Tt),
        /* 2 */
        new Wt(4, 6, 32, 32, Tt),
        /* 3 */
        new Wt(4, 4, 16, 16, Nt),
        /* 4 lazy matches */
        new Wt(8, 16, 32, 32, Nt),
        /* 5 */
        new Wt(8, 16, 128, 128, Nt),
        /* 6 */
        new Wt(8, 32, 128, 256, Nt),
        /* 7 */
        new Wt(32, 128, 258, 1024, Nt),
        /* 8 */
        new Wt(32, 258, 258, 4096, Nt)
        /* 9 max compression */
      ];
      function ae(c) {
        c.window_size = 2 * c.w_size, l(c.head), c.max_lazy_match = Vt[c.level].max_lazy, c.good_match = Vt[c.level].good_length, c.nice_match = Vt[c.level].nice_length, c.max_chain_length = Vt[c.level].max_chain, c.strstart = 0, c.block_start = 0, c.lookahead = 0, c.insert = 0, c.match_length = c.prev_length = it - 1, c.match_available = 0, c.ins_h = 0;
      }
      function M() {
        this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = T, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new i.Buf16(ut * 2), this.dyn_dtree = new i.Buf16((2 * Z + 1) * 2), this.bl_tree = new i.Buf16((2 * nt + 1) * 2), l(this.dyn_ltree), l(this.dyn_dtree), l(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new i.Buf16(Et + 1), this.heap = new i.Buf16(2 * E + 1), l(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new i.Buf16(2 * E + 1), l(this.depth), this.l_buf = 0, this.lit_bufsize = 0, this.last_lit = 0, this.d_buf = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
      }
      function dt(c) {
        var rt;
        return !c || !c.state ? B(c, _) : (c.total_in = c.total_out = 0, c.data_type = N, rt = c.state, rt.pending = 0, rt.pending_out = 0, rt.wrap < 0 && (rt.wrap = -rt.wrap), rt.status = rt.wrap ? ft : bt, c.adler = rt.wrap === 2 ? 0 : 1, rt.last_flush = f, o._tr_init(rt), b);
      }
      function _t(c) {
        var rt = dt(c);
        return rt === b && ae(c.state), rt;
      }
      function kt(c, rt) {
        return !c || !c.state || c.state.wrap !== 2 ? _ : (c.state.gzhead = rt, b);
      }
      function K(c, rt, at, R, H, et) {
        if (!c)
          return _;
        var Pt = 1;
        if (rt === C && (rt = 6), R < 0 ? (Pt = 0, R = -R) : R > 15 && (Pt = 2, R -= 16), H < 1 || H > G || at !== T || R < 8 || R > 15 || rt < 0 || rt > 9 || et < 0 || et > P)
          return B(c, _);
        R === 8 && (R = 9);
        var At = new M();
        return c.state = At, At.strm = c, At.wrap = Pt, At.gzhead = null, At.w_bits = R, At.w_size = 1 << At.w_bits, At.w_mask = At.w_size - 1, At.hash_bits = H + 7, At.hash_size = 1 << At.hash_bits, At.hash_mask = At.hash_size - 1, At.hash_shift = ~~((At.hash_bits + it - 1) / it), At.window = new i.Buf8(At.w_size * 2), At.head = new i.Buf16(At.hash_size), At.prev = new i.Buf16(At.w_size), At.lit_bufsize = 1 << H + 6, At.pending_buf_size = At.lit_bufsize * 4, At.pending_buf = new i.Buf8(At.pending_buf_size), At.d_buf = 1 * At.lit_bufsize, At.l_buf = 3 * At.lit_bufsize, At.level = rt, At.strategy = et, At.method = at, _t(c);
      }
      function lt(c, rt) {
        return K(c, rt, T, $, J, v);
      }
      function x(c, rt) {
        var at, R, H, et;
        if (!c || !c.state || rt > m || rt < 0)
          return c ? B(c, _) : _;
        if (R = c.state, !c.output || !c.input && c.avail_in !== 0 || R.status === gt && rt !== g)
          return B(c, c.avail_out === 0 ? k : _);
        if (R.strm = c, at = R.last_flush, R.last_flush = rt, R.status === ft)
          if (R.wrap === 2)
            c.adler = 0, L(R, 31), L(R, 139), L(R, 8), R.gzhead ? (L(
              R,
              (R.gzhead.text ? 1 : 0) + (R.gzhead.hcrc ? 2 : 0) + (R.gzhead.extra ? 4 : 0) + (R.gzhead.name ? 8 : 0) + (R.gzhead.comment ? 16 : 0)
            ), L(R, R.gzhead.time & 255), L(R, R.gzhead.time >> 8 & 255), L(R, R.gzhead.time >> 16 & 255), L(R, R.gzhead.time >> 24 & 255), L(R, R.level === 9 ? 2 : R.strategy >= O || R.level < 2 ? 4 : 0), L(R, R.gzhead.os & 255), R.gzhead.extra && R.gzhead.extra.length && (L(R, R.gzhead.extra.length & 255), L(R, R.gzhead.extra.length >> 8 & 255)), R.gzhead.hcrc && (c.adler = h(c.adler, R.pending_buf, R.pending, 0)), R.gzindex = 0, R.status = q) : (L(R, 0), L(R, 0), L(R, 0), L(R, 0), L(R, 0), L(R, R.level === 9 ? 2 : R.strategy >= O || R.level < 2 ? 4 : 0), L(R, wt), R.status = bt);
          else {
            var Pt = T + (R.w_bits - 8 << 4) << 8, At = -1;
            R.strategy >= O || R.level < 2 ? At = 0 : R.level < 6 ? At = 1 : R.level === 6 ? At = 2 : At = 3, Pt |= At << 6, R.strstart !== 0 && (Pt |= V), Pt += 31 - Pt % 31, R.status = bt, tt(R, Pt), R.strstart !== 0 && (tt(R, c.adler >>> 16), tt(R, c.adler & 65535)), c.adler = 1;
          }
        if (R.status === q)
          if (R.gzhead.extra) {
            for (H = R.pending; R.gzindex < (R.gzhead.extra.length & 65535) && !(R.pending === R.pending_buf_size && (R.gzhead.hcrc && R.pending > H && (c.adler = h(c.adler, R.pending_buf, R.pending - H, H)), y(c), H = R.pending, R.pending === R.pending_buf_size)); )
              L(R, R.gzhead.extra[R.gzindex] & 255), R.gzindex++;
            R.gzhead.hcrc && R.pending > H && (c.adler = h(c.adler, R.pending_buf, R.pending - H, H)), R.gzindex === R.gzhead.extra.length && (R.gzindex = 0, R.status = Y);
          } else
            R.status = Y;
        if (R.status === Y)
          if (R.gzhead.name) {
            H = R.pending;
            do {
              if (R.pending === R.pending_buf_size && (R.gzhead.hcrc && R.pending > H && (c.adler = h(c.adler, R.pending_buf, R.pending - H, H)), y(c), H = R.pending, R.pending === R.pending_buf_size)) {
                et = 1;
                break;
              }
              R.gzindex < R.gzhead.name.length ? et = R.gzhead.name.charCodeAt(R.gzindex++) & 255 : et = 0, L(R, et);
            } while (et !== 0);
            R.gzhead.hcrc && R.pending > H && (c.adler = h(c.adler, R.pending_buf, R.pending - H, H)), et === 0 && (R.gzindex = 0, R.status = Q);
          } else
            R.status = Q;
        if (R.status === Q)
          if (R.gzhead.comment) {
            H = R.pending;
            do {
              if (R.pending === R.pending_buf_size && (R.gzhead.hcrc && R.pending > H && (c.adler = h(c.adler, R.pending_buf, R.pending - H, H)), y(c), H = R.pending, R.pending === R.pending_buf_size)) {
                et = 1;
                break;
              }
              R.gzindex < R.gzhead.comment.length ? et = R.gzhead.comment.charCodeAt(R.gzindex++) & 255 : et = 0, L(R, et);
            } while (et !== 0);
            R.gzhead.hcrc && R.pending > H && (c.adler = h(c.adler, R.pending_buf, R.pending - H, H)), et === 0 && (R.status = ct);
          } else
            R.status = ct;
        if (R.status === ct && (R.gzhead.hcrc ? (R.pending + 2 > R.pending_buf_size && y(c), R.pending + 2 <= R.pending_buf_size && (L(R, c.adler & 255), L(R, c.adler >> 8 & 255), c.adler = 0, R.status = bt)) : R.status = bt), R.pending !== 0) {
          if (y(c), c.avail_out === 0)
            return R.last_flush = -1, b;
        } else if (c.avail_in === 0 && F(rt) <= F(at) && rt !== g)
          return B(c, k);
        if (R.status === gt && c.avail_in !== 0)
          return B(c, k);
        if (c.avail_in !== 0 || R.lookahead !== 0 || rt !== f && R.status !== gt) {
          var St = R.strategy === O ? Jt(R, rt) : R.strategy === I ? qt(R, rt) : Vt[R.level].func(R, rt);
          if ((St === ot || St === vt) && (R.status = gt), St === z || St === ot)
            return c.avail_out === 0 && (R.last_flush = -1), b;
          if (St === X && (rt === d ? o._tr_align(R) : rt !== m && (o._tr_stored_block(R, 0, 0, !1), rt === s && (l(R.head), R.lookahead === 0 && (R.strstart = 0, R.block_start = 0, R.insert = 0))), y(c), c.avail_out === 0))
            return R.last_flush = -1, b;
        }
        return rt !== g ? b : R.wrap <= 0 ? w : (R.wrap === 2 ? (L(R, c.adler & 255), L(R, c.adler >> 8 & 255), L(R, c.adler >> 16 & 255), L(R, c.adler >> 24 & 255), L(R, c.total_in & 255), L(R, c.total_in >> 8 & 255), L(R, c.total_in >> 16 & 255), L(R, c.total_in >> 24 & 255)) : (tt(R, c.adler >>> 16), tt(R, c.adler & 65535)), y(c), R.wrap > 0 && (R.wrap = -R.wrap), R.pending !== 0 ? b : w);
      }
      function pt(c) {
        var rt;
        return !c || !c.state ? _ : (rt = c.state.status, rt !== ft && rt !== q && rt !== Y && rt !== Q && rt !== ct && rt !== bt && rt !== gt ? B(c, _) : (c.state = null, rt === bt ? B(c, S) : b));
      }
      function Rt(c, rt) {
        var at = rt.length, R, H, et, Pt, At, St, jt, ge;
        if (!c || !c.state || (R = c.state, Pt = R.wrap, Pt === 2 || Pt === 1 && R.status !== ft || R.lookahead))
          return _;
        for (Pt === 1 && (c.adler = u(c.adler, rt, at, 0)), R.wrap = 0, at >= R.w_size && (Pt === 0 && (l(R.head), R.strstart = 0, R.block_start = 0, R.insert = 0), ge = new i.Buf8(R.w_size), i.arraySet(ge, rt, at - R.w_size, R.w_size, 0), rt = ge, at = R.w_size), At = c.avail_in, St = c.next_in, jt = c.input, c.avail_in = at, c.next_in = 0, c.input = rt, It(R); R.lookahead >= it; ) {
          H = R.strstart, et = R.lookahead - (it - 1);
          do
            R.ins_h = (R.ins_h << R.hash_shift ^ R.window[H + it - 1]) & R.hash_mask, R.prev[H & R.w_mask] = R.head[R.ins_h], R.head[R.ins_h] = H, H++;
          while (--et);
          R.strstart = H, R.lookahead = it - 1, It(R);
        }
        return R.strstart += R.lookahead, R.block_start = R.strstart, R.insert = R.lookahead, R.lookahead = 0, R.match_length = R.prev_length = it - 1, R.match_available = 0, c.next_in = St, c.input = jt, c.avail_in = At, R.wrap = Pt, b;
      }
      e.deflateInit = lt, e.deflateInit2 = K, e.deflateReset = _t, e.deflateResetKeep = dt, e.deflateSetHeader = kt, e.deflate = x, e.deflateEnd = pt, e.deflateSetDictionary = Rt, e.deflateInfo = "pako deflate (from Nodeca project)";
    }, { "../utils/common": 52, "./adler32": 53, "./crc32": 55, "./messages": 60, "./trees": 61 }], 57: [function(t, a, e) {
      var i = 30, o = 12;
      a.exports = function(u, h) {
        var p, f, d, s, g, m, b, w, _, S, k, C, j, O, I, P, v, N, T, G, $, J, st, D, E;
        p = u.state, f = u.next_in, D = u.input, d = f + (u.avail_in - 5), s = u.next_out, E = u.output, g = s - (h - u.avail_out), m = s + (u.avail_out - 257), b = p.dmax, w = p.wsize, _ = p.whave, S = p.wnext, k = p.window, C = p.hold, j = p.bits, O = p.lencode, I = p.distcode, P = (1 << p.lenbits) - 1, v = (1 << p.distbits) - 1;
        t:
          do {
            j < 15 && (C += D[f++] << j, j += 8, C += D[f++] << j, j += 8), N = O[C & P];
            e:
              for (; ; ) {
                if (T = N >>> 24, C >>>= T, j -= T, T = N >>> 16 & 255, T === 0)
                  E[s++] = N & 65535;
                else if (T & 16) {
                  G = N & 65535, T &= 15, T && (j < T && (C += D[f++] << j, j += 8), G += C & (1 << T) - 1, C >>>= T, j -= T), j < 15 && (C += D[f++] << j, j += 8, C += D[f++] << j, j += 8), N = I[C & v];
                  r:
                    for (; ; ) {
                      if (T = N >>> 24, C >>>= T, j -= T, T = N >>> 16 & 255, T & 16) {
                        if ($ = N & 65535, T &= 15, j < T && (C += D[f++] << j, j += 8, j < T && (C += D[f++] << j, j += 8)), $ += C & (1 << T) - 1, $ > b) {
                          u.msg = "invalid distance too far back", p.mode = i;
                          break t;
                        }
                        if (C >>>= T, j -= T, T = s - g, $ > T) {
                          if (T = $ - T, T > _ && p.sane) {
                            u.msg = "invalid distance too far back", p.mode = i;
                            break t;
                          }
                          if (J = 0, st = k, S === 0) {
                            if (J += w - T, T < G) {
                              G -= T;
                              do
                                E[s++] = k[J++];
                              while (--T);
                              J = s - $, st = E;
                            }
                          } else if (S < T) {
                            if (J += w + S - T, T -= S, T < G) {
                              G -= T;
                              do
                                E[s++] = k[J++];
                              while (--T);
                              if (J = 0, S < G) {
                                T = S, G -= T;
                                do
                                  E[s++] = k[J++];
                                while (--T);
                                J = s - $, st = E;
                              }
                            }
                          } else if (J += S - T, T < G) {
                            G -= T;
                            do
                              E[s++] = k[J++];
                            while (--T);
                            J = s - $, st = E;
                          }
                          for (; G > 2; )
                            E[s++] = st[J++], E[s++] = st[J++], E[s++] = st[J++], G -= 3;
                          G && (E[s++] = st[J++], G > 1 && (E[s++] = st[J++]));
                        } else {
                          J = s - $;
                          do
                            E[s++] = E[J++], E[s++] = E[J++], E[s++] = E[J++], G -= 3;
                          while (G > 2);
                          G && (E[s++] = E[J++], G > 1 && (E[s++] = E[J++]));
                        }
                      } else if (T & 64) {
                        u.msg = "invalid distance code", p.mode = i;
                        break t;
                      } else {
                        N = I[(N & 65535) + (C & (1 << T) - 1)];
                        continue r;
                      }
                      break;
                    }
                } else if (T & 64)
                  if (T & 32) {
                    p.mode = o;
                    break t;
                  } else {
                    u.msg = "invalid literal/length code", p.mode = i;
                    break t;
                  }
                else {
                  N = O[(N & 65535) + (C & (1 << T) - 1)];
                  continue e;
                }
                break;
              }
          } while (f < d && s < m);
        G = j >> 3, f -= G, j -= G << 3, C &= (1 << j) - 1, u.next_in = f, u.next_out = s, u.avail_in = f < d ? 5 + (d - f) : 5 - (f - d), u.avail_out = s < m ? 257 + (m - s) : 257 - (s - m), p.hold = C, p.bits = j;
      };
    }, {}], 58: [function(t, a, e) {
      var i = t("../utils/common"), o = t("./adler32"), u = t("./crc32"), h = t("./inffast"), p = t("./inftrees"), f = 0, d = 1, s = 2, g = 4, m = 5, b = 6, w = 0, _ = 1, S = 2, k = -2, C = -3, j = -4, O = -5, I = 8, P = 1, v = 2, N = 3, T = 4, G = 5, $ = 6, J = 7, st = 8, D = 9, E = 10, Z = 11, nt = 12, ut = 13, Et = 14, it = 15, U = 16, W = 17, V = 18, ft = 19, q = 20, Y = 21, Q = 22, ct = 23, bt = 24, gt = 25, z = 26, X = 27, ot = 28, vt = 29, wt = 30, B = 31, F = 32, l = 852, y = 592, A = 15, L = A;
      function tt(K) {
        return (K >>> 24 & 255) + (K >>> 8 & 65280) + ((K & 65280) << 8) + ((K & 255) << 24);
      }
      function ht() {
        this.mode = 0, this.last = !1, this.wrap = 0, this.havedict = !1, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new i.Buf16(320), this.work = new i.Buf16(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
      }
      function xt(K) {
        var lt;
        return !K || !K.state ? k : (lt = K.state, K.total_in = K.total_out = lt.total = 0, K.msg = "", lt.wrap && (K.adler = lt.wrap & 1), lt.mode = P, lt.last = 0, lt.havedict = 0, lt.dmax = 32768, lt.head = null, lt.hold = 0, lt.bits = 0, lt.lencode = lt.lendyn = new i.Buf32(l), lt.distcode = lt.distdyn = new i.Buf32(y), lt.sane = 1, lt.back = -1, w);
      }
      function It(K) {
        var lt;
        return !K || !K.state ? k : (lt = K.state, lt.wsize = 0, lt.whave = 0, lt.wnext = 0, xt(K));
      }
      function Zt(K, lt) {
        var x, pt;
        return !K || !K.state || (pt = K.state, lt < 0 ? (x = 0, lt = -lt) : (x = (lt >> 4) + 1, lt < 48 && (lt &= 15)), lt && (lt < 8 || lt > 15)) ? k : (pt.window !== null && pt.wbits !== lt && (pt.window = null), pt.wrap = x, pt.wbits = lt, It(K));
      }
      function Tt(K, lt) {
        var x, pt;
        return K ? (pt = new ht(), K.state = pt, pt.window = null, x = Zt(K, lt), x !== w && (K.state = null), x) : k;
      }
      function Nt(K) {
        return Tt(K, L);
      }
      var qt = !0, Jt, Wt;
      function Vt(K) {
        if (qt) {
          var lt;
          for (Jt = new i.Buf32(512), Wt = new i.Buf32(32), lt = 0; lt < 144; )
            K.lens[lt++] = 8;
          for (; lt < 256; )
            K.lens[lt++] = 9;
          for (; lt < 280; )
            K.lens[lt++] = 7;
          for (; lt < 288; )
            K.lens[lt++] = 8;
          for (p(d, K.lens, 0, 288, Jt, 0, K.work, { bits: 9 }), lt = 0; lt < 32; )
            K.lens[lt++] = 5;
          p(s, K.lens, 0, 32, Wt, 0, K.work, { bits: 5 }), qt = !1;
        }
        K.lencode = Jt, K.lenbits = 9, K.distcode = Wt, K.distbits = 5;
      }
      function ae(K, lt, x, pt) {
        var Rt, c = K.state;
        return c.window === null && (c.wsize = 1 << c.wbits, c.wnext = 0, c.whave = 0, c.window = new i.Buf8(c.wsize)), pt >= c.wsize ? (i.arraySet(c.window, lt, x - c.wsize, c.wsize, 0), c.wnext = 0, c.whave = c.wsize) : (Rt = c.wsize - c.wnext, Rt > pt && (Rt = pt), i.arraySet(c.window, lt, x - pt, Rt, c.wnext), pt -= Rt, pt ? (i.arraySet(c.window, lt, x - pt, pt, 0), c.wnext = pt, c.whave = c.wsize) : (c.wnext += Rt, c.wnext === c.wsize && (c.wnext = 0), c.whave < c.wsize && (c.whave += Rt))), 0;
      }
      function M(K, lt) {
        var x, pt, Rt, c, rt, at, R, H, et, Pt, At, St, jt, ge, Ht = 0, Ft, Kt, te, oe, He, Ve, Yt, le, Qt = new i.Buf8(4), me, pe, Zr = (
          /* permutation of code lengths */
          [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]
        );
        if (!K || !K.state || !K.output || !K.input && K.avail_in !== 0)
          return k;
        x = K.state, x.mode === nt && (x.mode = ut), rt = K.next_out, Rt = K.output, R = K.avail_out, c = K.next_in, pt = K.input, at = K.avail_in, H = x.hold, et = x.bits, Pt = at, At = R, le = w;
        t:
          for (; ; )
            switch (x.mode) {
              case P:
                if (x.wrap === 0) {
                  x.mode = ut;
                  break;
                }
                for (; et < 16; ) {
                  if (at === 0)
                    break t;
                  at--, H += pt[c++] << et, et += 8;
                }
                if (x.wrap & 2 && H === 35615) {
                  x.check = 0, Qt[0] = H & 255, Qt[1] = H >>> 8 & 255, x.check = u(x.check, Qt, 2, 0), H = 0, et = 0, x.mode = v;
                  break;
                }
                if (x.flags = 0, x.head && (x.head.done = !1), !(x.wrap & 1) || /* check if zlib header allowed */
                (((H & 255) << 8) + (H >> 8)) % 31) {
                  K.msg = "incorrect header check", x.mode = wt;
                  break;
                }
                if ((H & 15) !== I) {
                  K.msg = "unknown compression method", x.mode = wt;
                  break;
                }
                if (H >>>= 4, et -= 4, Yt = (H & 15) + 8, x.wbits === 0)
                  x.wbits = Yt;
                else if (Yt > x.wbits) {
                  K.msg = "invalid window size", x.mode = wt;
                  break;
                }
                x.dmax = 1 << Yt, K.adler = x.check = 1, x.mode = H & 512 ? E : nt, H = 0, et = 0;
                break;
              case v:
                for (; et < 16; ) {
                  if (at === 0)
                    break t;
                  at--, H += pt[c++] << et, et += 8;
                }
                if (x.flags = H, (x.flags & 255) !== I) {
                  K.msg = "unknown compression method", x.mode = wt;
                  break;
                }
                if (x.flags & 57344) {
                  K.msg = "unknown header flags set", x.mode = wt;
                  break;
                }
                x.head && (x.head.text = H >> 8 & 1), x.flags & 512 && (Qt[0] = H & 255, Qt[1] = H >>> 8 & 255, x.check = u(x.check, Qt, 2, 0)), H = 0, et = 0, x.mode = N;
              case N:
                for (; et < 32; ) {
                  if (at === 0)
                    break t;
                  at--, H += pt[c++] << et, et += 8;
                }
                x.head && (x.head.time = H), x.flags & 512 && (Qt[0] = H & 255, Qt[1] = H >>> 8 & 255, Qt[2] = H >>> 16 & 255, Qt[3] = H >>> 24 & 255, x.check = u(x.check, Qt, 4, 0)), H = 0, et = 0, x.mode = T;
              case T:
                for (; et < 16; ) {
                  if (at === 0)
                    break t;
                  at--, H += pt[c++] << et, et += 8;
                }
                x.head && (x.head.xflags = H & 255, x.head.os = H >> 8), x.flags & 512 && (Qt[0] = H & 255, Qt[1] = H >>> 8 & 255, x.check = u(x.check, Qt, 2, 0)), H = 0, et = 0, x.mode = G;
              case G:
                if (x.flags & 1024) {
                  for (; et < 16; ) {
                    if (at === 0)
                      break t;
                    at--, H += pt[c++] << et, et += 8;
                  }
                  x.length = H, x.head && (x.head.extra_len = H), x.flags & 512 && (Qt[0] = H & 255, Qt[1] = H >>> 8 & 255, x.check = u(x.check, Qt, 2, 0)), H = 0, et = 0;
                } else
                  x.head && (x.head.extra = null);
                x.mode = $;
              case $:
                if (x.flags & 1024 && (St = x.length, St > at && (St = at), St && (x.head && (Yt = x.head.extra_len - x.length, x.head.extra || (x.head.extra = new Array(x.head.extra_len)), i.arraySet(
                  x.head.extra,
                  pt,
                  c,
                  // extra field is limited to 65536 bytes
                  // - no need for additional size check
                  St,
                  /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
                  Yt
                )), x.flags & 512 && (x.check = u(x.check, pt, St, c)), at -= St, c += St, x.length -= St), x.length))
                  break t;
                x.length = 0, x.mode = J;
              case J:
                if (x.flags & 2048) {
                  if (at === 0)
                    break t;
                  St = 0;
                  do
                    Yt = pt[c + St++], x.head && Yt && x.length < 65536 && (x.head.name += String.fromCharCode(Yt));
                  while (Yt && St < at);
                  if (x.flags & 512 && (x.check = u(x.check, pt, St, c)), at -= St, c += St, Yt)
                    break t;
                } else
                  x.head && (x.head.name = null);
                x.length = 0, x.mode = st;
              case st:
                if (x.flags & 4096) {
                  if (at === 0)
                    break t;
                  St = 0;
                  do
                    Yt = pt[c + St++], x.head && Yt && x.length < 65536 && (x.head.comment += String.fromCharCode(Yt));
                  while (Yt && St < at);
                  if (x.flags & 512 && (x.check = u(x.check, pt, St, c)), at -= St, c += St, Yt)
                    break t;
                } else
                  x.head && (x.head.comment = null);
                x.mode = D;
              case D:
                if (x.flags & 512) {
                  for (; et < 16; ) {
                    if (at === 0)
                      break t;
                    at--, H += pt[c++] << et, et += 8;
                  }
                  if (H !== (x.check & 65535)) {
                    K.msg = "header crc mismatch", x.mode = wt;
                    break;
                  }
                  H = 0, et = 0;
                }
                x.head && (x.head.hcrc = x.flags >> 9 & 1, x.head.done = !0), K.adler = x.check = 0, x.mode = nt;
                break;
              case E:
                for (; et < 32; ) {
                  if (at === 0)
                    break t;
                  at--, H += pt[c++] << et, et += 8;
                }
                K.adler = x.check = tt(H), H = 0, et = 0, x.mode = Z;
              case Z:
                if (x.havedict === 0)
                  return K.next_out = rt, K.avail_out = R, K.next_in = c, K.avail_in = at, x.hold = H, x.bits = et, S;
                K.adler = x.check = 1, x.mode = nt;
              case nt:
                if (lt === m || lt === b)
                  break t;
              case ut:
                if (x.last) {
                  H >>>= et & 7, et -= et & 7, x.mode = X;
                  break;
                }
                for (; et < 3; ) {
                  if (at === 0)
                    break t;
                  at--, H += pt[c++] << et, et += 8;
                }
                switch (x.last = H & 1, H >>>= 1, et -= 1, H & 3) {
                  case 0:
                    x.mode = Et;
                    break;
                  case 1:
                    if (Vt(x), x.mode = q, lt === b) {
                      H >>>= 2, et -= 2;
                      break t;
                    }
                    break;
                  case 2:
                    x.mode = W;
                    break;
                  case 3:
                    K.msg = "invalid block type", x.mode = wt;
                }
                H >>>= 2, et -= 2;
                break;
              case Et:
                for (H >>>= et & 7, et -= et & 7; et < 32; ) {
                  if (at === 0)
                    break t;
                  at--, H += pt[c++] << et, et += 8;
                }
                if ((H & 65535) !== (H >>> 16 ^ 65535)) {
                  K.msg = "invalid stored block lengths", x.mode = wt;
                  break;
                }
                if (x.length = H & 65535, H = 0, et = 0, x.mode = it, lt === b)
                  break t;
              case it:
                x.mode = U;
              case U:
                if (St = x.length, St) {
                  if (St > at && (St = at), St > R && (St = R), St === 0)
                    break t;
                  i.arraySet(Rt, pt, c, St, rt), at -= St, c += St, R -= St, rt += St, x.length -= St;
                  break;
                }
                x.mode = nt;
                break;
              case W:
                for (; et < 14; ) {
                  if (at === 0)
                    break t;
                  at--, H += pt[c++] << et, et += 8;
                }
                if (x.nlen = (H & 31) + 257, H >>>= 5, et -= 5, x.ndist = (H & 31) + 1, H >>>= 5, et -= 5, x.ncode = (H & 15) + 4, H >>>= 4, et -= 4, x.nlen > 286 || x.ndist > 30) {
                  K.msg = "too many length or distance symbols", x.mode = wt;
                  break;
                }
                x.have = 0, x.mode = V;
              case V:
                for (; x.have < x.ncode; ) {
                  for (; et < 3; ) {
                    if (at === 0)
                      break t;
                    at--, H += pt[c++] << et, et += 8;
                  }
                  x.lens[Zr[x.have++]] = H & 7, H >>>= 3, et -= 3;
                }
                for (; x.have < 19; )
                  x.lens[Zr[x.have++]] = 0;
                if (x.lencode = x.lendyn, x.lenbits = 7, me = { bits: x.lenbits }, le = p(f, x.lens, 0, 19, x.lencode, 0, x.work, me), x.lenbits = me.bits, le) {
                  K.msg = "invalid code lengths set", x.mode = wt;
                  break;
                }
                x.have = 0, x.mode = ft;
              case ft:
                for (; x.have < x.nlen + x.ndist; ) {
                  for (; Ht = x.lencode[H & (1 << x.lenbits) - 1], Ft = Ht >>> 24, Kt = Ht >>> 16 & 255, te = Ht & 65535, !(Ft <= et); ) {
                    if (at === 0)
                      break t;
                    at--, H += pt[c++] << et, et += 8;
                  }
                  if (te < 16)
                    H >>>= Ft, et -= Ft, x.lens[x.have++] = te;
                  else {
                    if (te === 16) {
                      for (pe = Ft + 2; et < pe; ) {
                        if (at === 0)
                          break t;
                        at--, H += pt[c++] << et, et += 8;
                      }
                      if (H >>>= Ft, et -= Ft, x.have === 0) {
                        K.msg = "invalid bit length repeat", x.mode = wt;
                        break;
                      }
                      Yt = x.lens[x.have - 1], St = 3 + (H & 3), H >>>= 2, et -= 2;
                    } else if (te === 17) {
                      for (pe = Ft + 3; et < pe; ) {
                        if (at === 0)
                          break t;
                        at--, H += pt[c++] << et, et += 8;
                      }
                      H >>>= Ft, et -= Ft, Yt = 0, St = 3 + (H & 7), H >>>= 3, et -= 3;
                    } else {
                      for (pe = Ft + 7; et < pe; ) {
                        if (at === 0)
                          break t;
                        at--, H += pt[c++] << et, et += 8;
                      }
                      H >>>= Ft, et -= Ft, Yt = 0, St = 11 + (H & 127), H >>>= 7, et -= 7;
                    }
                    if (x.have + St > x.nlen + x.ndist) {
                      K.msg = "invalid bit length repeat", x.mode = wt;
                      break;
                    }
                    for (; St--; )
                      x.lens[x.have++] = Yt;
                  }
                }
                if (x.mode === wt)
                  break;
                if (x.lens[256] === 0) {
                  K.msg = "invalid code -- missing end-of-block", x.mode = wt;
                  break;
                }
                if (x.lenbits = 9, me = { bits: x.lenbits }, le = p(d, x.lens, 0, x.nlen, x.lencode, 0, x.work, me), x.lenbits = me.bits, le) {
                  K.msg = "invalid literal/lengths set", x.mode = wt;
                  break;
                }
                if (x.distbits = 6, x.distcode = x.distdyn, me = { bits: x.distbits }, le = p(s, x.lens, x.nlen, x.ndist, x.distcode, 0, x.work, me), x.distbits = me.bits, le) {
                  K.msg = "invalid distances set", x.mode = wt;
                  break;
                }
                if (x.mode = q, lt === b)
                  break t;
              case q:
                x.mode = Y;
              case Y:
                if (at >= 6 && R >= 258) {
                  K.next_out = rt, K.avail_out = R, K.next_in = c, K.avail_in = at, x.hold = H, x.bits = et, h(K, At), rt = K.next_out, Rt = K.output, R = K.avail_out, c = K.next_in, pt = K.input, at = K.avail_in, H = x.hold, et = x.bits, x.mode === nt && (x.back = -1);
                  break;
                }
                for (x.back = 0; Ht = x.lencode[H & (1 << x.lenbits) - 1], Ft = Ht >>> 24, Kt = Ht >>> 16 & 255, te = Ht & 65535, !(Ft <= et); ) {
                  if (at === 0)
                    break t;
                  at--, H += pt[c++] << et, et += 8;
                }
                if (Kt && !(Kt & 240)) {
                  for (oe = Ft, He = Kt, Ve = te; Ht = x.lencode[Ve + ((H & (1 << oe + He) - 1) >> oe)], Ft = Ht >>> 24, Kt = Ht >>> 16 & 255, te = Ht & 65535, !(oe + Ft <= et); ) {
                    if (at === 0)
                      break t;
                    at--, H += pt[c++] << et, et += 8;
                  }
                  H >>>= oe, et -= oe, x.back += oe;
                }
                if (H >>>= Ft, et -= Ft, x.back += Ft, x.length = te, Kt === 0) {
                  x.mode = z;
                  break;
                }
                if (Kt & 32) {
                  x.back = -1, x.mode = nt;
                  break;
                }
                if (Kt & 64) {
                  K.msg = "invalid literal/length code", x.mode = wt;
                  break;
                }
                x.extra = Kt & 15, x.mode = Q;
              case Q:
                if (x.extra) {
                  for (pe = x.extra; et < pe; ) {
                    if (at === 0)
                      break t;
                    at--, H += pt[c++] << et, et += 8;
                  }
                  x.length += H & (1 << x.extra) - 1, H >>>= x.extra, et -= x.extra, x.back += x.extra;
                }
                x.was = x.length, x.mode = ct;
              case ct:
                for (; Ht = x.distcode[H & (1 << x.distbits) - 1], Ft = Ht >>> 24, Kt = Ht >>> 16 & 255, te = Ht & 65535, !(Ft <= et); ) {
                  if (at === 0)
                    break t;
                  at--, H += pt[c++] << et, et += 8;
                }
                if (!(Kt & 240)) {
                  for (oe = Ft, He = Kt, Ve = te; Ht = x.distcode[Ve + ((H & (1 << oe + He) - 1) >> oe)], Ft = Ht >>> 24, Kt = Ht >>> 16 & 255, te = Ht & 65535, !(oe + Ft <= et); ) {
                    if (at === 0)
                      break t;
                    at--, H += pt[c++] << et, et += 8;
                  }
                  H >>>= oe, et -= oe, x.back += oe;
                }
                if (H >>>= Ft, et -= Ft, x.back += Ft, Kt & 64) {
                  K.msg = "invalid distance code", x.mode = wt;
                  break;
                }
                x.offset = te, x.extra = Kt & 15, x.mode = bt;
              case bt:
                if (x.extra) {
                  for (pe = x.extra; et < pe; ) {
                    if (at === 0)
                      break t;
                    at--, H += pt[c++] << et, et += 8;
                  }
                  x.offset += H & (1 << x.extra) - 1, H >>>= x.extra, et -= x.extra, x.back += x.extra;
                }
                if (x.offset > x.dmax) {
                  K.msg = "invalid distance too far back", x.mode = wt;
                  break;
                }
                x.mode = gt;
              case gt:
                if (R === 0)
                  break t;
                if (St = At - R, x.offset > St) {
                  if (St = x.offset - St, St > x.whave && x.sane) {
                    K.msg = "invalid distance too far back", x.mode = wt;
                    break;
                  }
                  St > x.wnext ? (St -= x.wnext, jt = x.wsize - St) : jt = x.wnext - St, St > x.length && (St = x.length), ge = x.window;
                } else
                  ge = Rt, jt = rt - x.offset, St = x.length;
                St > R && (St = R), R -= St, x.length -= St;
                do
                  Rt[rt++] = ge[jt++];
                while (--St);
                x.length === 0 && (x.mode = Y);
                break;
              case z:
                if (R === 0)
                  break t;
                Rt[rt++] = x.length, R--, x.mode = Y;
                break;
              case X:
                if (x.wrap) {
                  for (; et < 32; ) {
                    if (at === 0)
                      break t;
                    at--, H |= pt[c++] << et, et += 8;
                  }
                  if (At -= R, K.total_out += At, x.total += At, At && (K.adler = x.check = /*UPDATE(state.check, put - _out, _out);*/
                  x.flags ? u(x.check, Rt, At, rt - At) : o(x.check, Rt, At, rt - At)), At = R, (x.flags ? H : tt(H)) !== x.check) {
                    K.msg = "incorrect data check", x.mode = wt;
                    break;
                  }
                  H = 0, et = 0;
                }
                x.mode = ot;
              case ot:
                if (x.wrap && x.flags) {
                  for (; et < 32; ) {
                    if (at === 0)
                      break t;
                    at--, H += pt[c++] << et, et += 8;
                  }
                  if (H !== (x.total & 4294967295)) {
                    K.msg = "incorrect length check", x.mode = wt;
                    break;
                  }
                  H = 0, et = 0;
                }
                x.mode = vt;
              case vt:
                le = _;
                break t;
              case wt:
                le = C;
                break t;
              case B:
                return j;
              case F:
              default:
                return k;
            }
        return K.next_out = rt, K.avail_out = R, K.next_in = c, K.avail_in = at, x.hold = H, x.bits = et, (x.wsize || At !== K.avail_out && x.mode < wt && (x.mode < X || lt !== g)) && ae(K, K.output, K.next_out, At - K.avail_out), Pt -= K.avail_in, At -= K.avail_out, K.total_in += Pt, K.total_out += At, x.total += At, x.wrap && At && (K.adler = x.check = /*UPDATE(state.check, strm.next_out - _out, _out);*/
        x.flags ? u(x.check, Rt, At, K.next_out - At) : o(x.check, Rt, At, K.next_out - At)), K.data_type = x.bits + (x.last ? 64 : 0) + (x.mode === nt ? 128 : 0) + (x.mode === q || x.mode === it ? 256 : 0), (Pt === 0 && At === 0 || lt === g) && le === w && (le = O), le;
      }
      function dt(K) {
        if (!K || !K.state)
          return k;
        var lt = K.state;
        return lt.window && (lt.window = null), K.state = null, w;
      }
      function _t(K, lt) {
        var x;
        return !K || !K.state || (x = K.state, !(x.wrap & 2)) ? k : (x.head = lt, lt.done = !1, w);
      }
      function kt(K, lt) {
        var x = lt.length, pt, Rt, c;
        return !K || !K.state || (pt = K.state, pt.wrap !== 0 && pt.mode !== Z) ? k : pt.mode === Z && (Rt = 1, Rt = o(Rt, lt, x, 0), Rt !== pt.check) ? C : (c = ae(K, lt, x, x), c ? (pt.mode = B, j) : (pt.havedict = 1, w));
      }
      e.inflateReset = It, e.inflateReset2 = Zt, e.inflateResetKeep = xt, e.inflateInit = Nt, e.inflateInit2 = Tt, e.inflate = M, e.inflateEnd = dt, e.inflateGetHeader = _t, e.inflateSetDictionary = kt, e.inflateInfo = "pako inflate (from Nodeca project)";
    }, { "../utils/common": 52, "./adler32": 53, "./crc32": 55, "./inffast": 57, "./inftrees": 59 }], 59: [function(t, a, e) {
      var i = t("../utils/common"), o = 15, u = 852, h = 592, p = 0, f = 1, d = 2, s = [
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
      ], g = [
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
      ], b = [
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
      a.exports = function(w, _, S, k, C, j, O, I) {
        var P = I.bits, v = 0, N = 0, T = 0, G = 0, $ = 0, J = 0, st = 0, D = 0, E = 0, Z = 0, nt, ut, Et, it, U, W = null, V = 0, ft, q = new i.Buf16(o + 1), Y = new i.Buf16(o + 1), Q = null, ct = 0, bt, gt, z;
        for (v = 0; v <= o; v++)
          q[v] = 0;
        for (N = 0; N < k; N++)
          q[_[S + N]]++;
        for ($ = P, G = o; G >= 1 && q[G] === 0; G--)
          ;
        if ($ > G && ($ = G), G === 0)
          return C[j++] = 1 << 24 | 64 << 16 | 0, C[j++] = 1 << 24 | 64 << 16 | 0, I.bits = 1, 0;
        for (T = 1; T < G && q[T] === 0; T++)
          ;
        for ($ < T && ($ = T), D = 1, v = 1; v <= o; v++)
          if (D <<= 1, D -= q[v], D < 0)
            return -1;
        if (D > 0 && (w === p || G !== 1))
          return -1;
        for (Y[1] = 0, v = 1; v < o; v++)
          Y[v + 1] = Y[v] + q[v];
        for (N = 0; N < k; N++)
          _[S + N] !== 0 && (O[Y[_[S + N]]++] = N);
        if (w === p ? (W = Q = O, ft = 19) : w === f ? (W = s, V -= 257, Q = g, ct -= 257, ft = 256) : (W = m, Q = b, ft = -1), Z = 0, N = 0, v = T, U = j, J = $, st = 0, Et = -1, E = 1 << $, it = E - 1, w === f && E > u || w === d && E > h)
          return 1;
        for (; ; ) {
          bt = v - st, O[N] < ft ? (gt = 0, z = O[N]) : O[N] > ft ? (gt = Q[ct + O[N]], z = W[V + O[N]]) : (gt = 96, z = 0), nt = 1 << v - st, ut = 1 << J, T = ut;
          do
            ut -= nt, C[U + (Z >> st) + ut] = bt << 24 | gt << 16 | z | 0;
          while (ut !== 0);
          for (nt = 1 << v - 1; Z & nt; )
            nt >>= 1;
          if (nt !== 0 ? (Z &= nt - 1, Z += nt) : Z = 0, N++, --q[v] === 0) {
            if (v === G)
              break;
            v = _[S + O[N]];
          }
          if (v > $ && (Z & it) !== Et) {
            for (st === 0 && (st = $), U += T, J = v - st, D = 1 << J; J + st < G && (D -= q[J + st], !(D <= 0)); )
              J++, D <<= 1;
            if (E += 1 << J, w === f && E > u || w === d && E > h)
              return 1;
            Et = Z & it, C[Et] = $ << 24 | J << 16 | U - j | 0;
          }
        }
        return Z !== 0 && (C[U + Z] = v - st << 24 | 64 << 16 | 0), I.bits = $, 0;
      };
    }, { "../utils/common": 52 }], 60: [function(t, a, e) {
      a.exports = {
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
    }, {}], 61: [function(t, a, e) {
      var i = t("../utils/common"), o = 4, u = 0, h = 1, p = 2;
      function f(M) {
        for (var dt = M.length; --dt >= 0; )
          M[dt] = 0;
      }
      var d = 0, s = 1, g = 2, m = 3, b = 258, w = 29, _ = 256, S = _ + 1 + w, k = 30, C = 19, j = 2 * S + 1, O = 15, I = 16, P = 7, v = 256, N = 16, T = 17, G = 18, $ = (
        /* extra bits for each length code */
        [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0]
      ), J = (
        /* extra bits for each distance code */
        [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13]
      ), st = (
        /* extra bits for each bit length code */
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7]
      ), D = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15], E = 512, Z = new Array((S + 2) * 2);
      f(Z);
      var nt = new Array(k * 2);
      f(nt);
      var ut = new Array(E);
      f(ut);
      var Et = new Array(b - m + 1);
      f(Et);
      var it = new Array(w);
      f(it);
      var U = new Array(k);
      f(U);
      function W(M, dt, _t, kt, K) {
        this.static_tree = M, this.extra_bits = dt, this.extra_base = _t, this.elems = kt, this.max_length = K, this.has_stree = M && M.length;
      }
      var V, ft, q;
      function Y(M, dt) {
        this.dyn_tree = M, this.max_code = 0, this.stat_desc = dt;
      }
      function Q(M) {
        return M < 256 ? ut[M] : ut[256 + (M >>> 7)];
      }
      function ct(M, dt) {
        M.pending_buf[M.pending++] = dt & 255, M.pending_buf[M.pending++] = dt >>> 8 & 255;
      }
      function bt(M, dt, _t) {
        M.bi_valid > I - _t ? (M.bi_buf |= dt << M.bi_valid & 65535, ct(M, M.bi_buf), M.bi_buf = dt >> I - M.bi_valid, M.bi_valid += _t - I) : (M.bi_buf |= dt << M.bi_valid & 65535, M.bi_valid += _t);
      }
      function gt(M, dt, _t) {
        bt(
          M,
          _t[dt * 2],
          _t[dt * 2 + 1]
          /*.Len*/
        );
      }
      function z(M, dt) {
        var _t = 0;
        do
          _t |= M & 1, M >>>= 1, _t <<= 1;
        while (--dt > 0);
        return _t >>> 1;
      }
      function X(M) {
        M.bi_valid === 16 ? (ct(M, M.bi_buf), M.bi_buf = 0, M.bi_valid = 0) : M.bi_valid >= 8 && (M.pending_buf[M.pending++] = M.bi_buf & 255, M.bi_buf >>= 8, M.bi_valid -= 8);
      }
      function ot(M, dt) {
        var _t = dt.dyn_tree, kt = dt.max_code, K = dt.stat_desc.static_tree, lt = dt.stat_desc.has_stree, x = dt.stat_desc.extra_bits, pt = dt.stat_desc.extra_base, Rt = dt.stat_desc.max_length, c, rt, at, R, H, et, Pt = 0;
        for (R = 0; R <= O; R++)
          M.bl_count[R] = 0;
        for (_t[M.heap[M.heap_max] * 2 + 1] = 0, c = M.heap_max + 1; c < j; c++)
          rt = M.heap[c], R = _t[_t[rt * 2 + 1] * 2 + 1] + 1, R > Rt && (R = Rt, Pt++), _t[rt * 2 + 1] = R, !(rt > kt) && (M.bl_count[R]++, H = 0, rt >= pt && (H = x[rt - pt]), et = _t[rt * 2], M.opt_len += et * (R + H), lt && (M.static_len += et * (K[rt * 2 + 1] + H)));
        if (Pt !== 0) {
          do {
            for (R = Rt - 1; M.bl_count[R] === 0; )
              R--;
            M.bl_count[R]--, M.bl_count[R + 1] += 2, M.bl_count[Rt]--, Pt -= 2;
          } while (Pt > 0);
          for (R = Rt; R !== 0; R--)
            for (rt = M.bl_count[R]; rt !== 0; )
              at = M.heap[--c], !(at > kt) && (_t[at * 2 + 1] !== R && (M.opt_len += (R - _t[at * 2 + 1]) * _t[at * 2], _t[at * 2 + 1] = R), rt--);
        }
      }
      function vt(M, dt, _t) {
        var kt = new Array(O + 1), K = 0, lt, x;
        for (lt = 1; lt <= O; lt++)
          kt[lt] = K = K + _t[lt - 1] << 1;
        for (x = 0; x <= dt; x++) {
          var pt = M[x * 2 + 1];
          pt !== 0 && (M[x * 2] = z(kt[pt]++, pt));
        }
      }
      function wt() {
        var M, dt, _t, kt, K, lt = new Array(O + 1);
        for (_t = 0, kt = 0; kt < w - 1; kt++)
          for (it[kt] = _t, M = 0; M < 1 << $[kt]; M++)
            Et[_t++] = kt;
        for (Et[_t - 1] = kt, K = 0, kt = 0; kt < 16; kt++)
          for (U[kt] = K, M = 0; M < 1 << J[kt]; M++)
            ut[K++] = kt;
        for (K >>= 7; kt < k; kt++)
          for (U[kt] = K << 7, M = 0; M < 1 << J[kt] - 7; M++)
            ut[256 + K++] = kt;
        for (dt = 0; dt <= O; dt++)
          lt[dt] = 0;
        for (M = 0; M <= 143; )
          Z[M * 2 + 1] = 8, M++, lt[8]++;
        for (; M <= 255; )
          Z[M * 2 + 1] = 9, M++, lt[9]++;
        for (; M <= 279; )
          Z[M * 2 + 1] = 7, M++, lt[7]++;
        for (; M <= 287; )
          Z[M * 2 + 1] = 8, M++, lt[8]++;
        for (vt(Z, S + 1, lt), M = 0; M < k; M++)
          nt[M * 2 + 1] = 5, nt[M * 2] = z(M, 5);
        V = new W(Z, $, _ + 1, S, O), ft = new W(nt, J, 0, k, O), q = new W(new Array(0), st, 0, C, P);
      }
      function B(M) {
        var dt;
        for (dt = 0; dt < S; dt++)
          M.dyn_ltree[dt * 2] = 0;
        for (dt = 0; dt < k; dt++)
          M.dyn_dtree[dt * 2] = 0;
        for (dt = 0; dt < C; dt++)
          M.bl_tree[dt * 2] = 0;
        M.dyn_ltree[v * 2] = 1, M.opt_len = M.static_len = 0, M.last_lit = M.matches = 0;
      }
      function F(M) {
        M.bi_valid > 8 ? ct(M, M.bi_buf) : M.bi_valid > 0 && (M.pending_buf[M.pending++] = M.bi_buf), M.bi_buf = 0, M.bi_valid = 0;
      }
      function l(M, dt, _t, kt) {
        F(M), ct(M, _t), ct(M, ~_t), i.arraySet(M.pending_buf, M.window, dt, _t, M.pending), M.pending += _t;
      }
      function y(M, dt, _t, kt) {
        var K = dt * 2, lt = _t * 2;
        return M[K] < M[lt] || M[K] === M[lt] && kt[dt] <= kt[_t];
      }
      function A(M, dt, _t) {
        for (var kt = M.heap[_t], K = _t << 1; K <= M.heap_len && (K < M.heap_len && y(dt, M.heap[K + 1], M.heap[K], M.depth) && K++, !y(dt, kt, M.heap[K], M.depth)); )
          M.heap[_t] = M.heap[K], _t = K, K <<= 1;
        M.heap[_t] = kt;
      }
      function L(M, dt, _t) {
        var kt, K, lt = 0, x, pt;
        if (M.last_lit !== 0)
          do
            kt = M.pending_buf[M.d_buf + lt * 2] << 8 | M.pending_buf[M.d_buf + lt * 2 + 1], K = M.pending_buf[M.l_buf + lt], lt++, kt === 0 ? gt(M, K, dt) : (x = Et[K], gt(M, x + _ + 1, dt), pt = $[x], pt !== 0 && (K -= it[x], bt(M, K, pt)), kt--, x = Q(kt), gt(M, x, _t), pt = J[x], pt !== 0 && (kt -= U[x], bt(M, kt, pt)));
          while (lt < M.last_lit);
        gt(M, v, dt);
      }
      function tt(M, dt) {
        var _t = dt.dyn_tree, kt = dt.stat_desc.static_tree, K = dt.stat_desc.has_stree, lt = dt.stat_desc.elems, x, pt, Rt = -1, c;
        for (M.heap_len = 0, M.heap_max = j, x = 0; x < lt; x++)
          _t[x * 2] !== 0 ? (M.heap[++M.heap_len] = Rt = x, M.depth[x] = 0) : _t[x * 2 + 1] = 0;
        for (; M.heap_len < 2; )
          c = M.heap[++M.heap_len] = Rt < 2 ? ++Rt : 0, _t[c * 2] = 1, M.depth[c] = 0, M.opt_len--, K && (M.static_len -= kt[c * 2 + 1]);
        for (dt.max_code = Rt, x = M.heap_len >> 1; x >= 1; x--)
          A(M, _t, x);
        c = lt;
        do
          x = M.heap[
            1
            /*SMALLEST*/
          ], M.heap[
            1
            /*SMALLEST*/
          ] = M.heap[M.heap_len--], A(
            M,
            _t,
            1
            /*SMALLEST*/
          ), pt = M.heap[
            1
            /*SMALLEST*/
          ], M.heap[--M.heap_max] = x, M.heap[--M.heap_max] = pt, _t[c * 2] = _t[x * 2] + _t[pt * 2], M.depth[c] = (M.depth[x] >= M.depth[pt] ? M.depth[x] : M.depth[pt]) + 1, _t[x * 2 + 1] = _t[pt * 2 + 1] = c, M.heap[
            1
            /*SMALLEST*/
          ] = c++, A(
            M,
            _t,
            1
            /*SMALLEST*/
          );
        while (M.heap_len >= 2);
        M.heap[--M.heap_max] = M.heap[
          1
          /*SMALLEST*/
        ], ot(M, dt), vt(_t, Rt, M.bl_count);
      }
      function ht(M, dt, _t) {
        var kt, K = -1, lt, x = dt[1], pt = 0, Rt = 7, c = 4;
        for (x === 0 && (Rt = 138, c = 3), dt[(_t + 1) * 2 + 1] = 65535, kt = 0; kt <= _t; kt++)
          lt = x, x = dt[(kt + 1) * 2 + 1], !(++pt < Rt && lt === x) && (pt < c ? M.bl_tree[lt * 2] += pt : lt !== 0 ? (lt !== K && M.bl_tree[lt * 2]++, M.bl_tree[N * 2]++) : pt <= 10 ? M.bl_tree[T * 2]++ : M.bl_tree[G * 2]++, pt = 0, K = lt, x === 0 ? (Rt = 138, c = 3) : lt === x ? (Rt = 6, c = 3) : (Rt = 7, c = 4));
      }
      function xt(M, dt, _t) {
        var kt, K = -1, lt, x = dt[1], pt = 0, Rt = 7, c = 4;
        for (x === 0 && (Rt = 138, c = 3), kt = 0; kt <= _t; kt++)
          if (lt = x, x = dt[(kt + 1) * 2 + 1], !(++pt < Rt && lt === x)) {
            if (pt < c)
              do
                gt(M, lt, M.bl_tree);
              while (--pt !== 0);
            else
              lt !== 0 ? (lt !== K && (gt(M, lt, M.bl_tree), pt--), gt(M, N, M.bl_tree), bt(M, pt - 3, 2)) : pt <= 10 ? (gt(M, T, M.bl_tree), bt(M, pt - 3, 3)) : (gt(M, G, M.bl_tree), bt(M, pt - 11, 7));
            pt = 0, K = lt, x === 0 ? (Rt = 138, c = 3) : lt === x ? (Rt = 6, c = 3) : (Rt = 7, c = 4);
          }
      }
      function It(M) {
        var dt;
        for (ht(M, M.dyn_ltree, M.l_desc.max_code), ht(M, M.dyn_dtree, M.d_desc.max_code), tt(M, M.bl_desc), dt = C - 1; dt >= 3 && M.bl_tree[D[dt] * 2 + 1] === 0; dt--)
          ;
        return M.opt_len += 3 * (dt + 1) + 5 + 5 + 4, dt;
      }
      function Zt(M, dt, _t, kt) {
        var K;
        for (bt(M, dt - 257, 5), bt(M, _t - 1, 5), bt(M, kt - 4, 4), K = 0; K < kt; K++)
          bt(M, M.bl_tree[D[K] * 2 + 1], 3);
        xt(M, M.dyn_ltree, dt - 1), xt(M, M.dyn_dtree, _t - 1);
      }
      function Tt(M) {
        var dt = 4093624447, _t;
        for (_t = 0; _t <= 31; _t++, dt >>>= 1)
          if (dt & 1 && M.dyn_ltree[_t * 2] !== 0)
            return u;
        if (M.dyn_ltree[18] !== 0 || M.dyn_ltree[20] !== 0 || M.dyn_ltree[26] !== 0)
          return h;
        for (_t = 32; _t < _; _t++)
          if (M.dyn_ltree[_t * 2] !== 0)
            return h;
        return u;
      }
      var Nt = !1;
      function qt(M) {
        Nt || (wt(), Nt = !0), M.l_desc = new Y(M.dyn_ltree, V), M.d_desc = new Y(M.dyn_dtree, ft), M.bl_desc = new Y(M.bl_tree, q), M.bi_buf = 0, M.bi_valid = 0, B(M);
      }
      function Jt(M, dt, _t, kt) {
        bt(M, (d << 1) + (kt ? 1 : 0), 3), l(M, dt, _t);
      }
      function Wt(M) {
        bt(M, s << 1, 3), gt(M, v, Z), X(M);
      }
      function Vt(M, dt, _t, kt) {
        var K, lt, x = 0;
        M.level > 0 ? (M.strm.data_type === p && (M.strm.data_type = Tt(M)), tt(M, M.l_desc), tt(M, M.d_desc), x = It(M), K = M.opt_len + 3 + 7 >>> 3, lt = M.static_len + 3 + 7 >>> 3, lt <= K && (K = lt)) : K = lt = _t + 5, _t + 4 <= K && dt !== -1 ? Jt(M, dt, _t, kt) : M.strategy === o || lt === K ? (bt(M, (s << 1) + (kt ? 1 : 0), 3), L(M, Z, nt)) : (bt(M, (g << 1) + (kt ? 1 : 0), 3), Zt(M, M.l_desc.max_code + 1, M.d_desc.max_code + 1, x + 1), L(M, M.dyn_ltree, M.dyn_dtree)), B(M), kt && F(M);
      }
      function ae(M, dt, _t) {
        return M.pending_buf[M.d_buf + M.last_lit * 2] = dt >>> 8 & 255, M.pending_buf[M.d_buf + M.last_lit * 2 + 1] = dt & 255, M.pending_buf[M.l_buf + M.last_lit] = _t & 255, M.last_lit++, dt === 0 ? M.dyn_ltree[_t * 2]++ : (M.matches++, dt--, M.dyn_ltree[(Et[_t] + _ + 1) * 2]++, M.dyn_dtree[Q(dt) * 2]++), M.last_lit === M.lit_bufsize - 1;
      }
      e._tr_init = qt, e._tr_stored_block = Jt, e._tr_flush_block = Vt, e._tr_tally = ae, e._tr_align = Wt;
    }, { "../utils/common": 52 }], 62: [function(t, a, e) {
      function i() {
        this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
      }
      a.exports = i;
    }, {}], 63: [function(t, a, e) {
      var i = a.exports = {}, o, u;
      function h() {
        throw new Error("setTimeout has not been defined");
      }
      function p() {
        throw new Error("clearTimeout has not been defined");
      }
      (function() {
        try {
          typeof setTimeout == "function" ? o = setTimeout : o = h;
        } catch {
          o = h;
        }
        try {
          typeof clearTimeout == "function" ? u = clearTimeout : u = p;
        } catch {
          u = p;
        }
      })();
      function f(C) {
        if (o === setTimeout)
          return setTimeout(C, 0);
        if ((o === h || !o) && setTimeout)
          return o = setTimeout, setTimeout(C, 0);
        try {
          return o(C, 0);
        } catch {
          try {
            return o.call(null, C, 0);
          } catch {
            return o.call(this, C, 0);
          }
        }
      }
      function d(C) {
        if (u === clearTimeout)
          return clearTimeout(C);
        if ((u === p || !u) && clearTimeout)
          return u = clearTimeout, clearTimeout(C);
        try {
          return u(C);
        } catch {
          try {
            return u.call(null, C);
          } catch {
            return u.call(this, C);
          }
        }
      }
      var s = [], g = !1, m, b = -1;
      function w() {
        !g || !m || (g = !1, m.length ? s = m.concat(s) : b = -1, s.length && _());
      }
      function _() {
        if (!g) {
          var C = f(w);
          g = !0;
          for (var j = s.length; j; ) {
            for (m = s, s = []; ++b < j; )
              m && m[b].run();
            b = -1, j = s.length;
          }
          m = null, g = !1, d(C);
        }
      }
      i.nextTick = function(C) {
        var j = new Array(arguments.length - 1);
        if (arguments.length > 1)
          for (var O = 1; O < arguments.length; O++)
            j[O - 1] = arguments[O];
        s.push(new S(C, j)), s.length === 1 && !g && f(_);
      };
      function S(C, j) {
        this.fun = C, this.array = j;
      }
      S.prototype.run = function() {
        this.fun.apply(null, this.array);
      }, i.title = "browser", i.browser = !0, i.env = {}, i.argv = [], i.version = "", i.versions = {};
      function k() {
      }
      i.on = k, i.addListener = k, i.once = k, i.off = k, i.removeListener = k, i.removeAllListeners = k, i.emit = k, i.prependListener = k, i.prependOnceListener = k, i.listeners = function(C) {
        return [];
      }, i.binding = function(C) {
        throw new Error("process.binding is not supported");
      }, i.cwd = function() {
        return "/";
      }, i.chdir = function(C) {
        throw new Error("process.chdir is not supported");
      }, i.umask = function() {
        return 0;
      };
    }, {}], 64: [function(t, a, e) {
      /*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
      var i = t("buffer"), o = i.Buffer;
      function u(p, f) {
        for (var d in p)
          f[d] = p[d];
      }
      o.from && o.alloc && o.allocUnsafe && o.allocUnsafeSlow ? a.exports = i : (u(i, e), e.Buffer = h);
      function h(p, f, d) {
        return o(p, f, d);
      }
      h.prototype = Object.create(o.prototype), u(o, h), h.from = function(p, f, d) {
        if (typeof p == "number")
          throw new TypeError("Argument must not be a number");
        return o(p, f, d);
      }, h.alloc = function(p, f, d) {
        if (typeof p != "number")
          throw new TypeError("Argument must be a number");
        var s = o(p);
        return f !== void 0 ? typeof d == "string" ? s.fill(f, d) : s.fill(f) : s.fill(0), s;
      }, h.allocUnsafe = function(p) {
        if (typeof p != "number")
          throw new TypeError("Argument must be a number");
        return o(p);
      }, h.allocUnsafeSlow = function(p) {
        if (typeof p != "number")
          throw new TypeError("Argument must be a number");
        return i.SlowBuffer(p);
      };
    }, { buffer: 32 }], 65: [function(t, a, e) {
      a.exports = u;
      var i = t("events").EventEmitter, o = t("inherits");
      o(u, i), u.Readable = t("readable-stream/lib/_stream_readable.js"), u.Writable = t("readable-stream/lib/_stream_writable.js"), u.Duplex = t("readable-stream/lib/_stream_duplex.js"), u.Transform = t("readable-stream/lib/_stream_transform.js"), u.PassThrough = t("readable-stream/lib/_stream_passthrough.js"), u.finished = t("readable-stream/lib/internal/streams/end-of-stream.js"), u.pipeline = t("readable-stream/lib/internal/streams/pipeline.js"), u.Stream = u;
      function u() {
        i.call(this);
      }
      u.prototype.pipe = function(h, p) {
        var f = this;
        function d(S) {
          h.writable && h.write(S) === !1 && f.pause && f.pause();
        }
        f.on("data", d);
        function s() {
          f.readable && f.resume && f.resume();
        }
        h.on("drain", s), !h._isStdio && (!p || p.end !== !1) && (f.on("end", m), f.on("close", b));
        var g = !1;
        function m() {
          g || (g = !0, h.end());
        }
        function b() {
          g || (g = !0, typeof h.destroy == "function" && h.destroy());
        }
        function w(S) {
          if (_(), i.listenerCount(this, "error") === 0)
            throw S;
        }
        f.on("error", w), h.on("error", w);
        function _() {
          f.removeListener("data", d), h.removeListener("drain", s), f.removeListener("end", m), f.removeListener("close", b), f.removeListener("error", w), h.removeListener("error", w), f.removeListener("end", _), f.removeListener("close", _), h.removeListener("close", _);
        }
        return f.on("end", _), f.on("close", _), h.on("close", _), h.emit("pipe", f), h;
      };
    }, { events: 35, inherits: 46, "readable-stream/lib/_stream_duplex.js": 67, "readable-stream/lib/_stream_passthrough.js": 68, "readable-stream/lib/_stream_readable.js": 69, "readable-stream/lib/_stream_transform.js": 70, "readable-stream/lib/_stream_writable.js": 71, "readable-stream/lib/internal/streams/end-of-stream.js": 75, "readable-stream/lib/internal/streams/pipeline.js": 77 }], 66: [function(t, a, e) {
      function i(s, g) {
        s.prototype = Object.create(g.prototype), s.prototype.constructor = s, s.__proto__ = g;
      }
      var o = {};
      function u(s, g, m) {
        m || (m = Error);
        function b(_, S, k) {
          return typeof g == "string" ? g : g(_, S, k);
        }
        var w = /* @__PURE__ */ (function(_) {
          i(S, _);
          function S(k, C, j) {
            return _.call(this, b(k, C, j)) || this;
          }
          return S;
        })(m);
        w.prototype.name = m.name, w.prototype.code = s, o[s] = w;
      }
      function h(s, g) {
        if (Array.isArray(s)) {
          var m = s.length;
          return s = s.map(function(b) {
            return String(b);
          }), m > 2 ? "one of ".concat(g, " ").concat(s.slice(0, m - 1).join(", "), ", or ") + s[m - 1] : m === 2 ? "one of ".concat(g, " ").concat(s[0], " or ").concat(s[1]) : "of ".concat(g, " ").concat(s[0]);
        } else
          return "of ".concat(g, " ").concat(String(s));
      }
      function p(s, g, m) {
        return s.substr(0, g.length) === g;
      }
      function f(s, g, m) {
        return (m === void 0 || m > s.length) && (m = s.length), s.substring(m - g.length, m) === g;
      }
      function d(s, g, m) {
        return typeof m != "number" && (m = 0), m + g.length > s.length ? !1 : s.indexOf(g, m) !== -1;
      }
      u("ERR_INVALID_OPT_VALUE", function(s, g) {
        return 'The value "' + g + '" is invalid for option "' + s + '"';
      }, TypeError), u("ERR_INVALID_ARG_TYPE", function(s, g, m) {
        var b;
        typeof g == "string" && p(g, "not ") ? (b = "must not be", g = g.replace(/^not /, "")) : b = "must be";
        var w;
        if (f(s, " argument"))
          w = "The ".concat(s, " ").concat(b, " ").concat(h(g, "type"));
        else {
          var _ = d(s, ".") ? "property" : "argument";
          w = 'The "'.concat(s, '" ').concat(_, " ").concat(b, " ").concat(h(g, "type"));
        }
        return w += ". Received type ".concat(typeof m), w;
      }, TypeError), u("ERR_STREAM_PUSH_AFTER_EOF", "stream.push() after EOF"), u("ERR_METHOD_NOT_IMPLEMENTED", function(s) {
        return "The " + s + " method is not implemented";
      }), u("ERR_STREAM_PREMATURE_CLOSE", "Premature close"), u("ERR_STREAM_DESTROYED", function(s) {
        return "Cannot call " + s + " after a stream was destroyed";
      }), u("ERR_MULTIPLE_CALLBACK", "Callback called multiple times"), u("ERR_STREAM_CANNOT_PIPE", "Cannot pipe, not readable"), u("ERR_STREAM_WRITE_AFTER_END", "write after end"), u("ERR_STREAM_NULL_VALUES", "May not write null values to stream", TypeError), u("ERR_UNKNOWN_ENCODING", function(s) {
        return "Unknown encoding: " + s;
      }, TypeError), u("ERR_STREAM_UNSHIFT_AFTER_END_EVENT", "stream.unshift() after end event"), a.exports.codes = o;
    }, {}], 67: [function(t, a, e) {
      (function(i) {
        (function() {
          var o = Object.keys || function(b) {
            var w = [];
            for (var _ in b)
              w.push(_);
            return w;
          };
          a.exports = s;
          var u = t("./_stream_readable"), h = t("./_stream_writable");
          t("inherits")(s, u);
          for (var p = o(h.prototype), f = 0; f < p.length; f++) {
            var d = p[f];
            s.prototype[d] || (s.prototype[d] = h.prototype[d]);
          }
          function s(b) {
            if (!(this instanceof s))
              return new s(b);
            u.call(this, b), h.call(this, b), this.allowHalfOpen = !0, b && (b.readable === !1 && (this.readable = !1), b.writable === !1 && (this.writable = !1), b.allowHalfOpen === !1 && (this.allowHalfOpen = !1, this.once("end", g)));
          }
          Object.defineProperty(s.prototype, "writableHighWaterMark", {
            // making it explicit this property is not enumerable
            // because otherwise some prototype manipulation in
            // userland will fail
            enumerable: !1,
            get: function() {
              return this._writableState.highWaterMark;
            }
          }), Object.defineProperty(s.prototype, "writableBuffer", {
            // making it explicit this property is not enumerable
            // because otherwise some prototype manipulation in
            // userland will fail
            enumerable: !1,
            get: function() {
              return this._writableState && this._writableState.getBuffer();
            }
          }), Object.defineProperty(s.prototype, "writableLength", {
            // making it explicit this property is not enumerable
            // because otherwise some prototype manipulation in
            // userland will fail
            enumerable: !1,
            get: function() {
              return this._writableState.length;
            }
          });
          function g() {
            this._writableState.ended || i.nextTick(m, this);
          }
          function m(b) {
            b.end();
          }
          Object.defineProperty(s.prototype, "destroyed", {
            // making it explicit this property is not enumerable
            // because otherwise some prototype manipulation in
            // userland will fail
            enumerable: !1,
            get: function() {
              return this._readableState === void 0 || this._writableState === void 0 ? !1 : this._readableState.destroyed && this._writableState.destroyed;
            },
            set: function(b) {
              this._readableState === void 0 || this._writableState === void 0 || (this._readableState.destroyed = b, this._writableState.destroyed = b);
            }
          });
        }).call(this);
      }).call(this, t("_process"));
    }, { "./_stream_readable": 69, "./_stream_writable": 71, _process: 63, inherits: 46 }], 68: [function(t, a, e) {
      a.exports = o;
      var i = t("./_stream_transform");
      t("inherits")(o, i);
      function o(u) {
        if (!(this instanceof o))
          return new o(u);
        i.call(this, u);
      }
      o.prototype._transform = function(u, h, p) {
        p(null, u);
      };
    }, { "./_stream_transform": 70, inherits: 46 }], 69: [function(t, a, e) {
      (function(i, o) {
        (function() {
          a.exports = D;
          var u;
          D.ReadableState = st, t("events").EventEmitter;
          var h = function(B, F) {
            return B.listeners(F).length;
          }, p = t("./internal/streams/stream"), f = t("buffer").Buffer, d = o.Uint8Array || function() {
          };
          function s(B) {
            return f.from(B);
          }
          function g(B) {
            return f.isBuffer(B) || B instanceof d;
          }
          var m = t("util"), b;
          m && m.debuglog ? b = m.debuglog("stream") : b = function() {
          };
          var w = t("./internal/streams/buffer_list"), _ = t("./internal/streams/destroy"), S = t("./internal/streams/state"), k = S.getHighWaterMark, C = t("../errors").codes, j = C.ERR_INVALID_ARG_TYPE, O = C.ERR_STREAM_PUSH_AFTER_EOF, I = C.ERR_METHOD_NOT_IMPLEMENTED, P = C.ERR_STREAM_UNSHIFT_AFTER_END_EVENT, v, N, T;
          t("inherits")(D, p);
          var G = _.errorOrDestroy, $ = ["error", "close", "destroy", "pause", "resume"];
          function J(B, F, l) {
            if (typeof B.prependListener == "function")
              return B.prependListener(F, l);
            !B._events || !B._events[F] ? B.on(F, l) : Array.isArray(B._events[F]) ? B._events[F].unshift(l) : B._events[F] = [l, B._events[F]];
          }
          function st(B, F, l) {
            u = u || t("./_stream_duplex"), B = B || {}, typeof l != "boolean" && (l = F instanceof u), this.objectMode = !!B.objectMode, l && (this.objectMode = this.objectMode || !!B.readableObjectMode), this.highWaterMark = k(this, B, "readableHighWaterMark", l), this.buffer = new w(), this.length = 0, this.pipes = null, this.pipesCount = 0, this.flowing = null, this.ended = !1, this.endEmitted = !1, this.reading = !1, this.sync = !0, this.needReadable = !1, this.emittedReadable = !1, this.readableListening = !1, this.resumeScheduled = !1, this.paused = !0, this.emitClose = B.emitClose !== !1, this.autoDestroy = !!B.autoDestroy, this.destroyed = !1, this.defaultEncoding = B.defaultEncoding || "utf8", this.awaitDrain = 0, this.readingMore = !1, this.decoder = null, this.encoding = null, B.encoding && (v || (v = t("string_decoder/").StringDecoder), this.decoder = new v(B.encoding), this.encoding = B.encoding);
          }
          function D(B) {
            if (u = u || t("./_stream_duplex"), !(this instanceof D))
              return new D(B);
            var F = this instanceof u;
            this._readableState = new st(B, this, F), this.readable = !0, B && (typeof B.read == "function" && (this._read = B.read), typeof B.destroy == "function" && (this._destroy = B.destroy)), p.call(this);
          }
          Object.defineProperty(D.prototype, "destroyed", {
            // making it explicit this property is not enumerable
            // because otherwise some prototype manipulation in
            // userland will fail
            enumerable: !1,
            get: function() {
              return this._readableState === void 0 ? !1 : this._readableState.destroyed;
            },
            set: function(B) {
              this._readableState && (this._readableState.destroyed = B);
            }
          }), D.prototype.destroy = _.destroy, D.prototype._undestroy = _.undestroy, D.prototype._destroy = function(B, F) {
            F(B);
          }, D.prototype.push = function(B, F) {
            var l = this._readableState, y;
            return l.objectMode ? y = !0 : typeof B == "string" && (F = F || l.defaultEncoding, F !== l.encoding && (B = f.from(B, F), F = ""), y = !0), E(this, B, F, !1, y);
          }, D.prototype.unshift = function(B) {
            return E(this, B, null, !0, !1);
          };
          function E(B, F, l, y, A) {
            b("readableAddChunk", F);
            var L = B._readableState;
            if (F === null)
              L.reading = !1, U(B, L);
            else {
              var tt;
              if (A || (tt = nt(L, F)), tt)
                G(B, tt);
              else if (L.objectMode || F && F.length > 0)
                if (typeof F != "string" && !L.objectMode && Object.getPrototypeOf(F) !== f.prototype && (F = s(F)), y)
                  L.endEmitted ? G(B, new P()) : Z(B, L, F, !0);
                else if (L.ended)
                  G(B, new O());
                else {
                  if (L.destroyed)
                    return !1;
                  L.reading = !1, L.decoder && !l ? (F = L.decoder.write(F), L.objectMode || F.length !== 0 ? Z(B, L, F, !1) : ft(B, L)) : Z(B, L, F, !1);
                }
              else
                y || (L.reading = !1, ft(B, L));
            }
            return !L.ended && (L.length < L.highWaterMark || L.length === 0);
          }
          function Z(B, F, l, y) {
            F.flowing && F.length === 0 && !F.sync ? (F.awaitDrain = 0, B.emit("data", l)) : (F.length += F.objectMode ? 1 : l.length, y ? F.buffer.unshift(l) : F.buffer.push(l), F.needReadable && W(B)), ft(B, F);
          }
          function nt(B, F) {
            var l;
            return !g(F) && typeof F != "string" && F !== void 0 && !B.objectMode && (l = new j("chunk", ["string", "Buffer", "Uint8Array"], F)), l;
          }
          D.prototype.isPaused = function() {
            return this._readableState.flowing === !1;
          }, D.prototype.setEncoding = function(B) {
            v || (v = t("string_decoder/").StringDecoder);
            var F = new v(B);
            this._readableState.decoder = F, this._readableState.encoding = this._readableState.decoder.encoding;
            for (var l = this._readableState.buffer.head, y = ""; l !== null; )
              y += F.write(l.data), l = l.next;
            return this._readableState.buffer.clear(), y !== "" && this._readableState.buffer.push(y), this._readableState.length = y.length, this;
          };
          var ut = 1073741824;
          function Et(B) {
            return B >= ut ? B = ut : (B--, B |= B >>> 1, B |= B >>> 2, B |= B >>> 4, B |= B >>> 8, B |= B >>> 16, B++), B;
          }
          function it(B, F) {
            return B <= 0 || F.length === 0 && F.ended ? 0 : F.objectMode ? 1 : B !== B ? F.flowing && F.length ? F.buffer.head.data.length : F.length : (B > F.highWaterMark && (F.highWaterMark = Et(B)), B <= F.length ? B : F.ended ? F.length : (F.needReadable = !0, 0));
          }
          D.prototype.read = function(B) {
            b("read", B), B = parseInt(B, 10);
            var F = this._readableState, l = B;
            if (B !== 0 && (F.emittedReadable = !1), B === 0 && F.needReadable && ((F.highWaterMark !== 0 ? F.length >= F.highWaterMark : F.length > 0) || F.ended))
              return b("read: emitReadable", F.length, F.ended), F.length === 0 && F.ended ? ot(this) : W(this), null;
            if (B = it(B, F), B === 0 && F.ended)
              return F.length === 0 && ot(this), null;
            var y = F.needReadable;
            b("need readable", y), (F.length === 0 || F.length - B < F.highWaterMark) && (y = !0, b("length less than watermark", y)), F.ended || F.reading ? (y = !1, b("reading or ended", y)) : y && (b("do read"), F.reading = !0, F.sync = !0, F.length === 0 && (F.needReadable = !0), this._read(F.highWaterMark), F.sync = !1, F.reading || (B = it(l, F)));
            var A;
            return B > 0 ? A = X(B, F) : A = null, A === null ? (F.needReadable = F.length <= F.highWaterMark, B = 0) : (F.length -= B, F.awaitDrain = 0), F.length === 0 && (F.ended || (F.needReadable = !0), l !== B && F.ended && ot(this)), A !== null && this.emit("data", A), A;
          };
          function U(B, F) {
            if (b("onEofChunk"), !F.ended) {
              if (F.decoder) {
                var l = F.decoder.end();
                l && l.length && (F.buffer.push(l), F.length += F.objectMode ? 1 : l.length);
              }
              F.ended = !0, F.sync ? W(B) : (F.needReadable = !1, F.emittedReadable || (F.emittedReadable = !0, V(B)));
            }
          }
          function W(B) {
            var F = B._readableState;
            b("emitReadable", F.needReadable, F.emittedReadable), F.needReadable = !1, F.emittedReadable || (b("emitReadable", F.flowing), F.emittedReadable = !0, i.nextTick(V, B));
          }
          function V(B) {
            var F = B._readableState;
            b("emitReadable_", F.destroyed, F.length, F.ended), !F.destroyed && (F.length || F.ended) && (B.emit("readable"), F.emittedReadable = !1), F.needReadable = !F.flowing && !F.ended && F.length <= F.highWaterMark, z(B);
          }
          function ft(B, F) {
            F.readingMore || (F.readingMore = !0, i.nextTick(q, B, F));
          }
          function q(B, F) {
            for (; !F.reading && !F.ended && (F.length < F.highWaterMark || F.flowing && F.length === 0); ) {
              var l = F.length;
              if (b("maybeReadMore read 0"), B.read(0), l === F.length)
                break;
            }
            F.readingMore = !1;
          }
          D.prototype._read = function(B) {
            G(this, new I("_read()"));
          }, D.prototype.pipe = function(B, F) {
            var l = this, y = this._readableState;
            switch (y.pipesCount) {
              case 0:
                y.pipes = B;
                break;
              case 1:
                y.pipes = [y.pipes, B];
                break;
              default:
                y.pipes.push(B);
                break;
            }
            y.pipesCount += 1, b("pipe count=%d opts=%j", y.pipesCount, F);
            var A = (!F || F.end !== !1) && B !== i.stdout && B !== i.stderr, L = A ? ht : Wt;
            y.endEmitted ? i.nextTick(L) : l.once("end", L), B.on("unpipe", tt);
            function tt(Vt, ae) {
              b("onunpipe"), Vt === l && ae && ae.hasUnpiped === !1 && (ae.hasUnpiped = !0, Zt());
            }
            function ht() {
              b("onend"), B.end();
            }
            var xt = Y(l);
            B.on("drain", xt);
            var It = !1;
            function Zt() {
              b("cleanup"), B.removeListener("close", qt), B.removeListener("finish", Jt), B.removeListener("drain", xt), B.removeListener("error", Nt), B.removeListener("unpipe", tt), l.removeListener("end", ht), l.removeListener("end", Wt), l.removeListener("data", Tt), It = !0, y.awaitDrain && (!B._writableState || B._writableState.needDrain) && xt();
            }
            l.on("data", Tt);
            function Tt(Vt) {
              b("ondata");
              var ae = B.write(Vt);
              b("dest.write", ae), ae === !1 && ((y.pipesCount === 1 && y.pipes === B || y.pipesCount > 1 && wt(y.pipes, B) !== -1) && !It && (b("false write response, pause", y.awaitDrain), y.awaitDrain++), l.pause());
            }
            function Nt(Vt) {
              b("onerror", Vt), Wt(), B.removeListener("error", Nt), h(B, "error") === 0 && G(B, Vt);
            }
            J(B, "error", Nt);
            function qt() {
              B.removeListener("finish", Jt), Wt();
            }
            B.once("close", qt);
            function Jt() {
              b("onfinish"), B.removeListener("close", qt), Wt();
            }
            B.once("finish", Jt);
            function Wt() {
              b("unpipe"), l.unpipe(B);
            }
            return B.emit("pipe", l), y.flowing || (b("pipe resume"), l.resume()), B;
          };
          function Y(B) {
            return function() {
              var F = B._readableState;
              b("pipeOnDrain", F.awaitDrain), F.awaitDrain && F.awaitDrain--, F.awaitDrain === 0 && h(B, "data") && (F.flowing = !0, z(B));
            };
          }
          D.prototype.unpipe = function(B) {
            var F = this._readableState, l = {
              hasUnpiped: !1
            };
            if (F.pipesCount === 0)
              return this;
            if (F.pipesCount === 1)
              return B && B !== F.pipes ? this : (B || (B = F.pipes), F.pipes = null, F.pipesCount = 0, F.flowing = !1, B && B.emit("unpipe", this, l), this);
            if (!B) {
              var y = F.pipes, A = F.pipesCount;
              F.pipes = null, F.pipesCount = 0, F.flowing = !1;
              for (var L = 0; L < A; L++)
                y[L].emit("unpipe", this, {
                  hasUnpiped: !1
                });
              return this;
            }
            var tt = wt(F.pipes, B);
            return tt === -1 ? this : (F.pipes.splice(tt, 1), F.pipesCount -= 1, F.pipesCount === 1 && (F.pipes = F.pipes[0]), B.emit("unpipe", this, l), this);
          }, D.prototype.on = function(B, F) {
            var l = p.prototype.on.call(this, B, F), y = this._readableState;
            return B === "data" ? (y.readableListening = this.listenerCount("readable") > 0, y.flowing !== !1 && this.resume()) : B === "readable" && !y.endEmitted && !y.readableListening && (y.readableListening = y.needReadable = !0, y.flowing = !1, y.emittedReadable = !1, b("on readable", y.length, y.reading), y.length ? W(this) : y.reading || i.nextTick(ct, this)), l;
          }, D.prototype.addListener = D.prototype.on, D.prototype.removeListener = function(B, F) {
            var l = p.prototype.removeListener.call(this, B, F);
            return B === "readable" && i.nextTick(Q, this), l;
          }, D.prototype.removeAllListeners = function(B) {
            var F = p.prototype.removeAllListeners.apply(this, arguments);
            return (B === "readable" || B === void 0) && i.nextTick(Q, this), F;
          };
          function Q(B) {
            var F = B._readableState;
            F.readableListening = B.listenerCount("readable") > 0, F.resumeScheduled && !F.paused ? F.flowing = !0 : B.listenerCount("data") > 0 && B.resume();
          }
          function ct(B) {
            b("readable nexttick read 0"), B.read(0);
          }
          D.prototype.resume = function() {
            var B = this._readableState;
            return B.flowing || (b("resume"), B.flowing = !B.readableListening, bt(this, B)), B.paused = !1, this;
          };
          function bt(B, F) {
            F.resumeScheduled || (F.resumeScheduled = !0, i.nextTick(gt, B, F));
          }
          function gt(B, F) {
            b("resume", F.reading), F.reading || B.read(0), F.resumeScheduled = !1, B.emit("resume"), z(B), F.flowing && !F.reading && B.read(0);
          }
          D.prototype.pause = function() {
            return b("call pause flowing=%j", this._readableState.flowing), this._readableState.flowing !== !1 && (b("pause"), this._readableState.flowing = !1, this.emit("pause")), this._readableState.paused = !0, this;
          };
          function z(B) {
            var F = B._readableState;
            for (b("flow", F.flowing); F.flowing && B.read() !== null; )
              ;
          }
          D.prototype.wrap = function(B) {
            var F = this, l = this._readableState, y = !1;
            B.on("end", function() {
              if (b("wrapped end"), l.decoder && !l.ended) {
                var tt = l.decoder.end();
                tt && tt.length && F.push(tt);
              }
              F.push(null);
            }), B.on("data", function(tt) {
              if (b("wrapped data"), l.decoder && (tt = l.decoder.write(tt)), !(l.objectMode && tt == null) && !(!l.objectMode && (!tt || !tt.length))) {
                var ht = F.push(tt);
                ht || (y = !0, B.pause());
              }
            });
            for (var A in B)
              this[A] === void 0 && typeof B[A] == "function" && (this[A] = /* @__PURE__ */ (function(tt) {
                return function() {
                  return B[tt].apply(B, arguments);
                };
              })(A));
            for (var L = 0; L < $.length; L++)
              B.on($[L], this.emit.bind(this, $[L]));
            return this._read = function(tt) {
              b("wrapped _read", tt), y && (y = !1, B.resume());
            }, this;
          }, typeof Symbol == "function" && (D.prototype[Symbol.asyncIterator] = function() {
            return N === void 0 && (N = t("./internal/streams/async_iterator")), N(this);
          }), Object.defineProperty(D.prototype, "readableHighWaterMark", {
            // making it explicit this property is not enumerable
            // because otherwise some prototype manipulation in
            // userland will fail
            enumerable: !1,
            get: function() {
              return this._readableState.highWaterMark;
            }
          }), Object.defineProperty(D.prototype, "readableBuffer", {
            // making it explicit this property is not enumerable
            // because otherwise some prototype manipulation in
            // userland will fail
            enumerable: !1,
            get: function() {
              return this._readableState && this._readableState.buffer;
            }
          }), Object.defineProperty(D.prototype, "readableFlowing", {
            // making it explicit this property is not enumerable
            // because otherwise some prototype manipulation in
            // userland will fail
            enumerable: !1,
            get: function() {
              return this._readableState.flowing;
            },
            set: function(B) {
              this._readableState && (this._readableState.flowing = B);
            }
          }), D._fromList = X, Object.defineProperty(D.prototype, "readableLength", {
            // making it explicit this property is not enumerable
            // because otherwise some prototype manipulation in
            // userland will fail
            enumerable: !1,
            get: function() {
              return this._readableState.length;
            }
          });
          function X(B, F) {
            if (F.length === 0)
              return null;
            var l;
            return F.objectMode ? l = F.buffer.shift() : !B || B >= F.length ? (F.decoder ? l = F.buffer.join("") : F.buffer.length === 1 ? l = F.buffer.first() : l = F.buffer.concat(F.length), F.buffer.clear()) : l = F.buffer.consume(B, F.decoder), l;
          }
          function ot(B) {
            var F = B._readableState;
            b("endReadable", F.endEmitted), F.endEmitted || (F.ended = !0, i.nextTick(vt, F, B));
          }
          function vt(B, F) {
            if (b("endReadableNT", B.endEmitted, B.length), !B.endEmitted && B.length === 0 && (B.endEmitted = !0, F.readable = !1, F.emit("end"), B.autoDestroy)) {
              var l = F._writableState;
              (!l || l.autoDestroy && l.finished) && F.destroy();
            }
          }
          typeof Symbol == "function" && (D.from = function(B, F) {
            return T === void 0 && (T = t("./internal/streams/from")), T(D, B, F);
          });
          function wt(B, F) {
            for (var l = 0, y = B.length; l < y; l++)
              if (B[l] === F)
                return l;
            return -1;
          }
        }).call(this);
      }).call(this, t("_process"), typeof ee < "u" ? ee : typeof self < "u" ? self : typeof window < "u" ? window : {});
    }, { "../errors": 66, "./_stream_duplex": 67, "./internal/streams/async_iterator": 72, "./internal/streams/buffer_list": 73, "./internal/streams/destroy": 74, "./internal/streams/from": 76, "./internal/streams/state": 78, "./internal/streams/stream": 79, _process: 63, buffer: 32, events: 35, inherits: 46, "string_decoder/": 80, util: 29 }], 70: [function(t, a, e) {
      a.exports = s;
      var i = t("../errors").codes, o = i.ERR_METHOD_NOT_IMPLEMENTED, u = i.ERR_MULTIPLE_CALLBACK, h = i.ERR_TRANSFORM_ALREADY_TRANSFORMING, p = i.ERR_TRANSFORM_WITH_LENGTH_0, f = t("./_stream_duplex");
      t("inherits")(s, f);
      function d(b, w) {
        var _ = this._transformState;
        _.transforming = !1;
        var S = _.writecb;
        if (S === null)
          return this.emit("error", new u());
        _.writechunk = null, _.writecb = null, w != null && this.push(w), S(b);
        var k = this._readableState;
        k.reading = !1, (k.needReadable || k.length < k.highWaterMark) && this._read(k.highWaterMark);
      }
      function s(b) {
        if (!(this instanceof s))
          return new s(b);
        f.call(this, b), this._transformState = {
          afterTransform: d.bind(this),
          needTransform: !1,
          transforming: !1,
          writecb: null,
          writechunk: null,
          writeencoding: null
        }, this._readableState.needReadable = !0, this._readableState.sync = !1, b && (typeof b.transform == "function" && (this._transform = b.transform), typeof b.flush == "function" && (this._flush = b.flush)), this.on("prefinish", g);
      }
      function g() {
        var b = this;
        typeof this._flush == "function" && !this._readableState.destroyed ? this._flush(function(w, _) {
          m(b, w, _);
        }) : m(this, null, null);
      }
      s.prototype.push = function(b, w) {
        return this._transformState.needTransform = !1, f.prototype.push.call(this, b, w);
      }, s.prototype._transform = function(b, w, _) {
        _(new o("_transform()"));
      }, s.prototype._write = function(b, w, _) {
        var S = this._transformState;
        if (S.writecb = _, S.writechunk = b, S.writeencoding = w, !S.transforming) {
          var k = this._readableState;
          (S.needTransform || k.needReadable || k.length < k.highWaterMark) && this._read(k.highWaterMark);
        }
      }, s.prototype._read = function(b) {
        var w = this._transformState;
        w.writechunk !== null && !w.transforming ? (w.transforming = !0, this._transform(w.writechunk, w.writeencoding, w.afterTransform)) : w.needTransform = !0;
      }, s.prototype._destroy = function(b, w) {
        f.prototype._destroy.call(this, b, function(_) {
          w(_);
        });
      };
      function m(b, w, _) {
        if (w)
          return b.emit("error", w);
        if (_ != null && b.push(_), b._writableState.length)
          throw new p();
        if (b._transformState.transforming)
          throw new h();
        return b.push(null);
      }
    }, { "../errors": 66, "./_stream_duplex": 67, inherits: 46 }], 71: [function(t, a, e) {
      (function(i, o) {
        (function() {
          a.exports = st;
          function u(z) {
            var X = this;
            this.next = null, this.entry = null, this.finish = function() {
              gt(X, z);
            };
          }
          var h;
          st.WritableState = $;
          var p = {
            deprecate: t("util-deprecate")
          }, f = t("./internal/streams/stream"), d = t("buffer").Buffer, s = o.Uint8Array || function() {
          };
          function g(z) {
            return d.from(z);
          }
          function m(z) {
            return d.isBuffer(z) || z instanceof s;
          }
          var b = t("./internal/streams/destroy"), w = t("./internal/streams/state"), _ = w.getHighWaterMark, S = t("../errors").codes, k = S.ERR_INVALID_ARG_TYPE, C = S.ERR_METHOD_NOT_IMPLEMENTED, j = S.ERR_MULTIPLE_CALLBACK, O = S.ERR_STREAM_CANNOT_PIPE, I = S.ERR_STREAM_DESTROYED, P = S.ERR_STREAM_NULL_VALUES, v = S.ERR_STREAM_WRITE_AFTER_END, N = S.ERR_UNKNOWN_ENCODING, T = b.errorOrDestroy;
          t("inherits")(st, f);
          function G() {
          }
          function $(z, X, ot) {
            h = h || t("./_stream_duplex"), z = z || {}, typeof ot != "boolean" && (ot = X instanceof h), this.objectMode = !!z.objectMode, ot && (this.objectMode = this.objectMode || !!z.writableObjectMode), this.highWaterMark = _(this, z, "writableHighWaterMark", ot), this.finalCalled = !1, this.needDrain = !1, this.ending = !1, this.ended = !1, this.finished = !1, this.destroyed = !1;
            var vt = z.decodeStrings === !1;
            this.decodeStrings = !vt, this.defaultEncoding = z.defaultEncoding || "utf8", this.length = 0, this.writing = !1, this.corked = 0, this.sync = !0, this.bufferProcessing = !1, this.onwrite = function(wt) {
              U(X, wt);
            }, this.writecb = null, this.writelen = 0, this.bufferedRequest = null, this.lastBufferedRequest = null, this.pendingcb = 0, this.prefinished = !1, this.errorEmitted = !1, this.emitClose = z.emitClose !== !1, this.autoDestroy = !!z.autoDestroy, this.bufferedRequestCount = 0, this.corkedRequestsFree = new u(this);
          }
          $.prototype.getBuffer = function() {
            for (var z = this.bufferedRequest, X = []; z; )
              X.push(z), z = z.next;
            return X;
          }, (function() {
            try {
              Object.defineProperty($.prototype, "buffer", {
                get: p.deprecate(function() {
                  return this.getBuffer();
                }, "_writableState.buffer is deprecated. Use _writableState.getBuffer instead.", "DEP0003")
              });
            } catch {
            }
          })();
          var J;
          typeof Symbol == "function" && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] == "function" ? (J = Function.prototype[Symbol.hasInstance], Object.defineProperty(st, Symbol.hasInstance, {
            value: function(z) {
              return J.call(this, z) ? !0 : this !== st ? !1 : z && z._writableState instanceof $;
            }
          })) : J = function(z) {
            return z instanceof this;
          };
          function st(z) {
            h = h || t("./_stream_duplex");
            var X = this instanceof h;
            if (!X && !J.call(st, this))
              return new st(z);
            this._writableState = new $(z, this, X), this.writable = !0, z && (typeof z.write == "function" && (this._write = z.write), typeof z.writev == "function" && (this._writev = z.writev), typeof z.destroy == "function" && (this._destroy = z.destroy), typeof z.final == "function" && (this._final = z.final)), f.call(this);
          }
          st.prototype.pipe = function() {
            T(this, new O());
          };
          function D(z, X) {
            var ot = new v();
            T(z, ot), i.nextTick(X, ot);
          }
          function E(z, X, ot, vt) {
            var wt;
            return ot === null ? wt = new P() : typeof ot != "string" && !X.objectMode && (wt = new k("chunk", ["string", "Buffer"], ot)), wt ? (T(z, wt), i.nextTick(vt, wt), !1) : !0;
          }
          st.prototype.write = function(z, X, ot) {
            var vt = this._writableState, wt = !1, B = !vt.objectMode && m(z);
            return B && !d.isBuffer(z) && (z = g(z)), typeof X == "function" && (ot = X, X = null), B ? X = "buffer" : X || (X = vt.defaultEncoding), typeof ot != "function" && (ot = G), vt.ending ? D(this, ot) : (B || E(this, vt, z, ot)) && (vt.pendingcb++, wt = nt(this, vt, B, z, X, ot)), wt;
          }, st.prototype.cork = function() {
            this._writableState.corked++;
          }, st.prototype.uncork = function() {
            var z = this._writableState;
            z.corked && (z.corked--, !z.writing && !z.corked && !z.bufferProcessing && z.bufferedRequest && ft(this, z));
          }, st.prototype.setDefaultEncoding = function(z) {
            if (typeof z == "string" && (z = z.toLowerCase()), !(["hex", "utf8", "utf-8", "ascii", "binary", "base64", "ucs2", "ucs-2", "utf16le", "utf-16le", "raw"].indexOf((z + "").toLowerCase()) > -1))
              throw new N(z);
            return this._writableState.defaultEncoding = z, this;
          }, Object.defineProperty(st.prototype, "writableBuffer", {
            // making it explicit this property is not enumerable
            // because otherwise some prototype manipulation in
            // userland will fail
            enumerable: !1,
            get: function() {
              return this._writableState && this._writableState.getBuffer();
            }
          });
          function Z(z, X, ot) {
            return !z.objectMode && z.decodeStrings !== !1 && typeof X == "string" && (X = d.from(X, ot)), X;
          }
          Object.defineProperty(st.prototype, "writableHighWaterMark", {
            // making it explicit this property is not enumerable
            // because otherwise some prototype manipulation in
            // userland will fail
            enumerable: !1,
            get: function() {
              return this._writableState.highWaterMark;
            }
          });
          function nt(z, X, ot, vt, wt, B) {
            if (!ot) {
              var F = Z(X, vt, wt);
              vt !== F && (ot = !0, wt = "buffer", vt = F);
            }
            var l = X.objectMode ? 1 : vt.length;
            X.length += l;
            var y = X.length < X.highWaterMark;
            if (y || (X.needDrain = !0), X.writing || X.corked) {
              var A = X.lastBufferedRequest;
              X.lastBufferedRequest = {
                chunk: vt,
                encoding: wt,
                isBuf: ot,
                callback: B,
                next: null
              }, A ? A.next = X.lastBufferedRequest : X.bufferedRequest = X.lastBufferedRequest, X.bufferedRequestCount += 1;
            } else
              ut(z, X, !1, l, vt, wt, B);
            return y;
          }
          function ut(z, X, ot, vt, wt, B, F) {
            X.writelen = vt, X.writecb = F, X.writing = !0, X.sync = !0, X.destroyed ? X.onwrite(new I("write")) : ot ? z._writev(wt, X.onwrite) : z._write(wt, B, X.onwrite), X.sync = !1;
          }
          function Et(z, X, ot, vt, wt) {
            --X.pendingcb, ot ? (i.nextTick(wt, vt), i.nextTick(ct, z, X), z._writableState.errorEmitted = !0, T(z, vt)) : (wt(vt), z._writableState.errorEmitted = !0, T(z, vt), ct(z, X));
          }
          function it(z) {
            z.writing = !1, z.writecb = null, z.length -= z.writelen, z.writelen = 0;
          }
          function U(z, X) {
            var ot = z._writableState, vt = ot.sync, wt = ot.writecb;
            if (typeof wt != "function")
              throw new j();
            if (it(ot), X)
              Et(z, ot, vt, X, wt);
            else {
              var B = q(ot) || z.destroyed;
              !B && !ot.corked && !ot.bufferProcessing && ot.bufferedRequest && ft(z, ot), vt ? i.nextTick(W, z, ot, B, wt) : W(z, ot, B, wt);
            }
          }
          function W(z, X, ot, vt) {
            ot || V(z, X), X.pendingcb--, vt(), ct(z, X);
          }
          function V(z, X) {
            X.length === 0 && X.needDrain && (X.needDrain = !1, z.emit("drain"));
          }
          function ft(z, X) {
            X.bufferProcessing = !0;
            var ot = X.bufferedRequest;
            if (z._writev && ot && ot.next) {
              var vt = X.bufferedRequestCount, wt = new Array(vt), B = X.corkedRequestsFree;
              B.entry = ot;
              for (var F = 0, l = !0; ot; )
                wt[F] = ot, ot.isBuf || (l = !1), ot = ot.next, F += 1;
              wt.allBuffers = l, ut(z, X, !0, X.length, wt, "", B.finish), X.pendingcb++, X.lastBufferedRequest = null, B.next ? (X.corkedRequestsFree = B.next, B.next = null) : X.corkedRequestsFree = new u(X), X.bufferedRequestCount = 0;
            } else {
              for (; ot; ) {
                var y = ot.chunk, A = ot.encoding, L = ot.callback, tt = X.objectMode ? 1 : y.length;
                if (ut(z, X, !1, tt, y, A, L), ot = ot.next, X.bufferedRequestCount--, X.writing)
                  break;
              }
              ot === null && (X.lastBufferedRequest = null);
            }
            X.bufferedRequest = ot, X.bufferProcessing = !1;
          }
          st.prototype._write = function(z, X, ot) {
            ot(new C("_write()"));
          }, st.prototype._writev = null, st.prototype.end = function(z, X, ot) {
            var vt = this._writableState;
            return typeof z == "function" ? (ot = z, z = null, X = null) : typeof X == "function" && (ot = X, X = null), z != null && this.write(z, X), vt.corked && (vt.corked = 1, this.uncork()), vt.ending || bt(this, vt, ot), this;
          }, Object.defineProperty(st.prototype, "writableLength", {
            // making it explicit this property is not enumerable
            // because otherwise some prototype manipulation in
            // userland will fail
            enumerable: !1,
            get: function() {
              return this._writableState.length;
            }
          });
          function q(z) {
            return z.ending && z.length === 0 && z.bufferedRequest === null && !z.finished && !z.writing;
          }
          function Y(z, X) {
            z._final(function(ot) {
              X.pendingcb--, ot && T(z, ot), X.prefinished = !0, z.emit("prefinish"), ct(z, X);
            });
          }
          function Q(z, X) {
            !X.prefinished && !X.finalCalled && (typeof z._final == "function" && !X.destroyed ? (X.pendingcb++, X.finalCalled = !0, i.nextTick(Y, z, X)) : (X.prefinished = !0, z.emit("prefinish")));
          }
          function ct(z, X) {
            var ot = q(X);
            if (ot && (Q(z, X), X.pendingcb === 0 && (X.finished = !0, z.emit("finish"), X.autoDestroy))) {
              var vt = z._readableState;
              (!vt || vt.autoDestroy && vt.endEmitted) && z.destroy();
            }
            return ot;
          }
          function bt(z, X, ot) {
            X.ending = !0, ct(z, X), ot && (X.finished ? i.nextTick(ot) : z.once("finish", ot)), X.ended = !0, z.writable = !1;
          }
          function gt(z, X, ot) {
            var vt = z.entry;
            for (z.entry = null; vt; ) {
              var wt = vt.callback;
              X.pendingcb--, wt(ot), vt = vt.next;
            }
            X.corkedRequestsFree.next = z;
          }
          Object.defineProperty(st.prototype, "destroyed", {
            // making it explicit this property is not enumerable
            // because otherwise some prototype manipulation in
            // userland will fail
            enumerable: !1,
            get: function() {
              return this._writableState === void 0 ? !1 : this._writableState.destroyed;
            },
            set: function(z) {
              this._writableState && (this._writableState.destroyed = z);
            }
          }), st.prototype.destroy = b.destroy, st.prototype._undestroy = b.undestroy, st.prototype._destroy = function(z, X) {
            X(z);
          };
        }).call(this);
      }).call(this, t("_process"), typeof ee < "u" ? ee : typeof self < "u" ? self : typeof window < "u" ? window : {});
    }, { "../errors": 66, "./_stream_duplex": 67, "./internal/streams/destroy": 74, "./internal/streams/state": 78, "./internal/streams/stream": 79, _process: 63, buffer: 32, inherits: 46, "util-deprecate": 81 }], 72: [function(t, a, e) {
      (function(i) {
        (function() {
          var o;
          function u(I, P, v) {
            return P in I ? Object.defineProperty(I, P, { value: v, enumerable: !0, configurable: !0, writable: !0 }) : I[P] = v, I;
          }
          var h = t("./end-of-stream"), p = Symbol("lastResolve"), f = Symbol("lastReject"), d = Symbol("error"), s = Symbol("ended"), g = Symbol("lastPromise"), m = Symbol("handlePromise"), b = Symbol("stream");
          function w(I, P) {
            return {
              value: I,
              done: P
            };
          }
          function _(I) {
            var P = I[p];
            if (P !== null) {
              var v = I[b].read();
              v !== null && (I[g] = null, I[p] = null, I[f] = null, P(w(v, !1)));
            }
          }
          function S(I) {
            i.nextTick(_, I);
          }
          function k(I, P) {
            return function(v, N) {
              I.then(function() {
                if (P[s]) {
                  v(w(void 0, !0));
                  return;
                }
                P[m](v, N);
              }, N);
            };
          }
          var C = Object.getPrototypeOf(function() {
          }), j = Object.setPrototypeOf((o = {
            get stream() {
              return this[b];
            },
            next: function() {
              var I = this, P = this[d];
              if (P !== null)
                return Promise.reject(P);
              if (this[s])
                return Promise.resolve(w(void 0, !0));
              if (this[b].destroyed)
                return new Promise(function(G, $) {
                  i.nextTick(function() {
                    I[d] ? $(I[d]) : G(w(void 0, !0));
                  });
                });
              var v = this[g], N;
              if (v)
                N = new Promise(k(v, this));
              else {
                var T = this[b].read();
                if (T !== null)
                  return Promise.resolve(w(T, !1));
                N = new Promise(this[m]);
              }
              return this[g] = N, N;
            }
          }, u(o, Symbol.asyncIterator, function() {
            return this;
          }), u(o, "return", function() {
            var I = this;
            return new Promise(function(P, v) {
              I[b].destroy(null, function(N) {
                if (N) {
                  v(N);
                  return;
                }
                P(w(void 0, !0));
              });
            });
          }), o), C), O = function(I) {
            var P, v = Object.create(j, (P = {}, u(P, b, {
              value: I,
              writable: !0
            }), u(P, p, {
              value: null,
              writable: !0
            }), u(P, f, {
              value: null,
              writable: !0
            }), u(P, d, {
              value: null,
              writable: !0
            }), u(P, s, {
              value: I._readableState.endEmitted,
              writable: !0
            }), u(P, m, {
              value: function(N, T) {
                var G = v[b].read();
                G ? (v[g] = null, v[p] = null, v[f] = null, N(w(G, !1))) : (v[p] = N, v[f] = T);
              },
              writable: !0
            }), P));
            return v[g] = null, h(I, function(N) {
              if (N && N.code !== "ERR_STREAM_PREMATURE_CLOSE") {
                var T = v[f];
                T !== null && (v[g] = null, v[p] = null, v[f] = null, T(N)), v[d] = N;
                return;
              }
              var G = v[p];
              G !== null && (v[g] = null, v[p] = null, v[f] = null, G(w(void 0, !0))), v[s] = !0;
            }), I.on("readable", S.bind(null, v)), v;
          };
          a.exports = O;
        }).call(this);
      }).call(this, t("_process"));
    }, { "./end-of-stream": 75, _process: 63 }], 73: [function(t, a, e) {
      function i(_, S) {
        var k = Object.keys(_);
        if (Object.getOwnPropertySymbols) {
          var C = Object.getOwnPropertySymbols(_);
          S && (C = C.filter(function(j) {
            return Object.getOwnPropertyDescriptor(_, j).enumerable;
          })), k.push.apply(k, C);
        }
        return k;
      }
      function o(_) {
        for (var S = 1; S < arguments.length; S++) {
          var k = arguments[S] != null ? arguments[S] : {};
          S % 2 ? i(Object(k), !0).forEach(function(C) {
            u(_, C, k[C]);
          }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(_, Object.getOwnPropertyDescriptors(k)) : i(Object(k)).forEach(function(C) {
            Object.defineProperty(_, C, Object.getOwnPropertyDescriptor(k, C));
          });
        }
        return _;
      }
      function u(_, S, k) {
        return S in _ ? Object.defineProperty(_, S, { value: k, enumerable: !0, configurable: !0, writable: !0 }) : _[S] = k, _;
      }
      function h(_, S) {
        if (!(_ instanceof S))
          throw new TypeError("Cannot call a class as a function");
      }
      function p(_, S) {
        for (var k = 0; k < S.length; k++) {
          var C = S[k];
          C.enumerable = C.enumerable || !1, C.configurable = !0, "value" in C && (C.writable = !0), Object.defineProperty(_, C.key, C);
        }
      }
      function f(_, S, k) {
        return S && p(_.prototype, S), _;
      }
      var d = t("buffer"), s = d.Buffer, g = t("util"), m = g.inspect, b = m && m.custom || "inspect";
      function w(_, S, k) {
        s.prototype.copy.call(_, S, k);
      }
      a.exports = /* @__PURE__ */ (function() {
        function _() {
          h(this, _), this.head = null, this.tail = null, this.length = 0;
        }
        return f(_, [{
          key: "push",
          value: function(S) {
            var k = {
              data: S,
              next: null
            };
            this.length > 0 ? this.tail.next = k : this.head = k, this.tail = k, ++this.length;
          }
        }, {
          key: "unshift",
          value: function(S) {
            var k = {
              data: S,
              next: this.head
            };
            this.length === 0 && (this.tail = k), this.head = k, ++this.length;
          }
        }, {
          key: "shift",
          value: function() {
            if (this.length !== 0) {
              var S = this.head.data;
              return this.length === 1 ? this.head = this.tail = null : this.head = this.head.next, --this.length, S;
            }
          }
        }, {
          key: "clear",
          value: function() {
            this.head = this.tail = null, this.length = 0;
          }
        }, {
          key: "join",
          value: function(S) {
            if (this.length === 0)
              return "";
            for (var k = this.head, C = "" + k.data; k = k.next; )
              C += S + k.data;
            return C;
          }
        }, {
          key: "concat",
          value: function(S) {
            if (this.length === 0)
              return s.alloc(0);
            for (var k = s.allocUnsafe(S >>> 0), C = this.head, j = 0; C; )
              w(C.data, k, j), j += C.data.length, C = C.next;
            return k;
          }
          // Consumes a specified amount of bytes or characters from the buffered data.
        }, {
          key: "consume",
          value: function(S, k) {
            var C;
            return S < this.head.data.length ? (C = this.head.data.slice(0, S), this.head.data = this.head.data.slice(S)) : S === this.head.data.length ? C = this.shift() : C = k ? this._getString(S) : this._getBuffer(S), C;
          }
        }, {
          key: "first",
          value: function() {
            return this.head.data;
          }
          // Consumes a specified amount of characters from the buffered data.
        }, {
          key: "_getString",
          value: function(S) {
            var k = this.head, C = 1, j = k.data;
            for (S -= j.length; k = k.next; ) {
              var O = k.data, I = S > O.length ? O.length : S;
              if (I === O.length ? j += O : j += O.slice(0, S), S -= I, S === 0) {
                I === O.length ? (++C, k.next ? this.head = k.next : this.head = this.tail = null) : (this.head = k, k.data = O.slice(I));
                break;
              }
              ++C;
            }
            return this.length -= C, j;
          }
          // Consumes a specified amount of bytes from the buffered data.
        }, {
          key: "_getBuffer",
          value: function(S) {
            var k = s.allocUnsafe(S), C = this.head, j = 1;
            for (C.data.copy(k), S -= C.data.length; C = C.next; ) {
              var O = C.data, I = S > O.length ? O.length : S;
              if (O.copy(k, k.length - S, 0, I), S -= I, S === 0) {
                I === O.length ? (++j, C.next ? this.head = C.next : this.head = this.tail = null) : (this.head = C, C.data = O.slice(I));
                break;
              }
              ++j;
            }
            return this.length -= j, k;
          }
          // Make sure the linked list only shows the minimal necessary information.
        }, {
          key: b,
          value: function(S, k) {
            return m(this, o({}, k, {
              // Only inspect one level.
              depth: 0,
              // It should not recurse.
              customInspect: !1
            }));
          }
        }]), _;
      })();
    }, { buffer: 32, util: 29 }], 74: [function(t, a, e) {
      (function(i) {
        (function() {
          function o(s, g) {
            var m = this, b = this._readableState && this._readableState.destroyed, w = this._writableState && this._writableState.destroyed;
            return b || w ? (g ? g(s) : s && (this._writableState ? this._writableState.errorEmitted || (this._writableState.errorEmitted = !0, i.nextTick(f, this, s)) : i.nextTick(f, this, s)), this) : (this._readableState && (this._readableState.destroyed = !0), this._writableState && (this._writableState.destroyed = !0), this._destroy(s || null, function(_) {
              !g && _ ? m._writableState ? m._writableState.errorEmitted ? i.nextTick(h, m) : (m._writableState.errorEmitted = !0, i.nextTick(u, m, _)) : i.nextTick(u, m, _) : g ? (i.nextTick(h, m), g(_)) : i.nextTick(h, m);
            }), this);
          }
          function u(s, g) {
            f(s, g), h(s);
          }
          function h(s) {
            s._writableState && !s._writableState.emitClose || s._readableState && !s._readableState.emitClose || s.emit("close");
          }
          function p() {
            this._readableState && (this._readableState.destroyed = !1, this._readableState.reading = !1, this._readableState.ended = !1, this._readableState.endEmitted = !1), this._writableState && (this._writableState.destroyed = !1, this._writableState.ended = !1, this._writableState.ending = !1, this._writableState.finalCalled = !1, this._writableState.prefinished = !1, this._writableState.finished = !1, this._writableState.errorEmitted = !1);
          }
          function f(s, g) {
            s.emit("error", g);
          }
          function d(s, g) {
            var m = s._readableState, b = s._writableState;
            m && m.autoDestroy || b && b.autoDestroy ? s.destroy(g) : s.emit("error", g);
          }
          a.exports = {
            destroy: o,
            undestroy: p,
            errorOrDestroy: d
          };
        }).call(this);
      }).call(this, t("_process"));
    }, { _process: 63 }], 75: [function(t, a, e) {
      var i = t("../../../errors").codes.ERR_STREAM_PREMATURE_CLOSE;
      function o(f) {
        var d = !1;
        return function() {
          if (!d) {
            d = !0;
            for (var s = arguments.length, g = new Array(s), m = 0; m < s; m++)
              g[m] = arguments[m];
            f.apply(this, g);
          }
        };
      }
      function u() {
      }
      function h(f) {
        return f.setHeader && typeof f.abort == "function";
      }
      function p(f, d, s) {
        if (typeof d == "function")
          return p(f, null, d);
        d || (d = {}), s = o(s || u);
        var g = d.readable || d.readable !== !1 && f.readable, m = d.writable || d.writable !== !1 && f.writable, b = function() {
          f.writable || _();
        }, w = f._writableState && f._writableState.finished, _ = function() {
          m = !1, w = !0, g || s.call(f);
        }, S = f._readableState && f._readableState.endEmitted, k = function() {
          g = !1, S = !0, m || s.call(f);
        }, C = function(I) {
          s.call(f, I);
        }, j = function() {
          var I;
          if (g && !S)
            return (!f._readableState || !f._readableState.ended) && (I = new i()), s.call(f, I);
          if (m && !w)
            return (!f._writableState || !f._writableState.ended) && (I = new i()), s.call(f, I);
        }, O = function() {
          f.req.on("finish", _);
        };
        return h(f) ? (f.on("complete", _), f.on("abort", j), f.req ? O() : f.on("request", O)) : m && !f._writableState && (f.on("end", b), f.on("close", b)), f.on("end", k), f.on("finish", _), d.error !== !1 && f.on("error", C), f.on("close", j), function() {
          f.removeListener("complete", _), f.removeListener("abort", j), f.removeListener("request", O), f.req && f.req.removeListener("finish", _), f.removeListener("end", b), f.removeListener("close", b), f.removeListener("finish", _), f.removeListener("end", k), f.removeListener("error", C), f.removeListener("close", j);
        };
      }
      a.exports = p;
    }, { "../../../errors": 66 }], 76: [function(t, a, e) {
      a.exports = function() {
        throw new Error("Readable.from is not available in the browser");
      };
    }, {}], 77: [function(t, a, e) {
      var i;
      function o(_) {
        var S = !1;
        return function() {
          S || (S = !0, _.apply(void 0, arguments));
        };
      }
      var u = t("../../../errors").codes, h = u.ERR_MISSING_ARGS, p = u.ERR_STREAM_DESTROYED;
      function f(_) {
        if (_)
          throw _;
      }
      function d(_) {
        return _.setHeader && typeof _.abort == "function";
      }
      function s(_, S, k, C) {
        C = o(C);
        var j = !1;
        _.on("close", function() {
          j = !0;
        }), i === void 0 && (i = t("./end-of-stream")), i(_, {
          readable: S,
          writable: k
        }, function(I) {
          if (I)
            return C(I);
          j = !0, C();
        });
        var O = !1;
        return function(I) {
          if (!j && !O) {
            if (O = !0, d(_))
              return _.abort();
            if (typeof _.destroy == "function")
              return _.destroy();
            C(I || new p("pipe"));
          }
        };
      }
      function g(_) {
        _();
      }
      function m(_, S) {
        return _.pipe(S);
      }
      function b(_) {
        return !_.length || typeof _[_.length - 1] != "function" ? f : _.pop();
      }
      function w() {
        for (var _ = arguments.length, S = new Array(_), k = 0; k < _; k++)
          S[k] = arguments[k];
        var C = b(S);
        if (Array.isArray(S[0]) && (S = S[0]), S.length < 2)
          throw new h("streams");
        var j, O = S.map(function(I, P) {
          var v = P < S.length - 1, N = P > 0;
          return s(I, v, N, function(T) {
            j || (j = T), T && O.forEach(g), !v && (O.forEach(g), C(j));
          });
        });
        return S.reduce(m);
      }
      a.exports = w;
    }, { "../../../errors": 66, "./end-of-stream": 75 }], 78: [function(t, a, e) {
      var i = t("../../../errors").codes.ERR_INVALID_OPT_VALUE;
      function o(h, p, f) {
        return h.highWaterMark != null ? h.highWaterMark : p ? h[f] : null;
      }
      function u(h, p, f, d) {
        var s = o(p, d, f);
        if (s != null) {
          if (!(isFinite(s) && Math.floor(s) === s) || s < 0) {
            var g = d ? f : "highWaterMark";
            throw new i(g, s);
          }
          return Math.floor(s);
        }
        return h.objectMode ? 16 : 16 * 1024;
      }
      a.exports = {
        getHighWaterMark: u
      };
    }, { "../../../errors": 66 }], 79: [function(t, a, e) {
      a.exports = t("events").EventEmitter;
    }, { events: 35 }], 80: [function(t, a, e) {
      var i = t("safe-buffer").Buffer, o = i.isEncoding || function(O) {
        switch (O = "" + O, O && O.toLowerCase()) {
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
      function u(O) {
        if (!O)
          return "utf8";
        for (var I; ; )
          switch (O) {
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
              return O;
            default:
              if (I)
                return;
              O = ("" + O).toLowerCase(), I = !0;
          }
      }
      function h(O) {
        var I = u(O);
        if (typeof I != "string" && (i.isEncoding === o || !o(O)))
          throw new Error("Unknown encoding: " + O);
        return I || O;
      }
      e.StringDecoder = p;
      function p(O) {
        this.encoding = h(O);
        var I;
        switch (this.encoding) {
          case "utf16le":
            this.text = w, this.end = _, I = 4;
            break;
          case "utf8":
            this.fillLast = g, I = 4;
            break;
          case "base64":
            this.text = S, this.end = k, I = 3;
            break;
          default:
            this.write = C, this.end = j;
            return;
        }
        this.lastNeed = 0, this.lastTotal = 0, this.lastChar = i.allocUnsafe(I);
      }
      p.prototype.write = function(O) {
        if (O.length === 0)
          return "";
        var I, P;
        if (this.lastNeed) {
          if (I = this.fillLast(O), I === void 0)
            return "";
          P = this.lastNeed, this.lastNeed = 0;
        } else
          P = 0;
        return P < O.length ? I ? I + this.text(O, P) : this.text(O, P) : I || "";
      }, p.prototype.end = b, p.prototype.text = m, p.prototype.fillLast = function(O) {
        if (this.lastNeed <= O.length)
          return O.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed), this.lastChar.toString(this.encoding, 0, this.lastTotal);
        O.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, O.length), this.lastNeed -= O.length;
      };
      function f(O) {
        return O <= 127 ? 0 : O >> 5 === 6 ? 2 : O >> 4 === 14 ? 3 : O >> 3 === 30 ? 4 : O >> 6 === 2 ? -1 : -2;
      }
      function d(O, I, P) {
        var v = I.length - 1;
        if (v < P)
          return 0;
        var N = f(I[v]);
        return N >= 0 ? (N > 0 && (O.lastNeed = N - 1), N) : --v < P || N === -2 ? 0 : (N = f(I[v]), N >= 0 ? (N > 0 && (O.lastNeed = N - 2), N) : --v < P || N === -2 ? 0 : (N = f(I[v]), N >= 0 ? (N > 0 && (N === 2 ? N = 0 : O.lastNeed = N - 3), N) : 0));
      }
      function s(O, I, P) {
        if ((I[0] & 192) !== 128)
          return O.lastNeed = 0, "�";
        if (O.lastNeed > 1 && I.length > 1) {
          if ((I[1] & 192) !== 128)
            return O.lastNeed = 1, "�";
          if (O.lastNeed > 2 && I.length > 2 && (I[2] & 192) !== 128)
            return O.lastNeed = 2, "�";
        }
      }
      function g(O) {
        var I = this.lastTotal - this.lastNeed, P = s(this, O);
        if (P !== void 0)
          return P;
        if (this.lastNeed <= O.length)
          return O.copy(this.lastChar, I, 0, this.lastNeed), this.lastChar.toString(this.encoding, 0, this.lastTotal);
        O.copy(this.lastChar, I, 0, O.length), this.lastNeed -= O.length;
      }
      function m(O, I) {
        var P = d(this, O, I);
        if (!this.lastNeed)
          return O.toString("utf8", I);
        this.lastTotal = P;
        var v = O.length - (P - this.lastNeed);
        return O.copy(this.lastChar, 0, v), O.toString("utf8", I, v);
      }
      function b(O) {
        var I = O && O.length ? this.write(O) : "";
        return this.lastNeed ? I + "�" : I;
      }
      function w(O, I) {
        if ((O.length - I) % 2 === 0) {
          var P = O.toString("utf16le", I);
          if (P) {
            var v = P.charCodeAt(P.length - 1);
            if (v >= 55296 && v <= 56319)
              return this.lastNeed = 2, this.lastTotal = 4, this.lastChar[0] = O[O.length - 2], this.lastChar[1] = O[O.length - 1], P.slice(0, -1);
          }
          return P;
        }
        return this.lastNeed = 1, this.lastTotal = 2, this.lastChar[0] = O[O.length - 1], O.toString("utf16le", I, O.length - 1);
      }
      function _(O) {
        var I = O && O.length ? this.write(O) : "";
        if (this.lastNeed) {
          var P = this.lastTotal - this.lastNeed;
          return I + this.lastChar.toString("utf16le", 0, P);
        }
        return I;
      }
      function S(O, I) {
        var P = (O.length - I) % 3;
        return P === 0 ? O.toString("base64", I) : (this.lastNeed = 3 - P, this.lastTotal = 3, P === 1 ? this.lastChar[0] = O[O.length - 1] : (this.lastChar[0] = O[O.length - 2], this.lastChar[1] = O[O.length - 1]), O.toString("base64", I, O.length - P));
      }
      function k(O) {
        var I = O && O.length ? this.write(O) : "";
        return this.lastNeed ? I + this.lastChar.toString("base64", 0, 3 - this.lastNeed) : I;
      }
      function C(O) {
        return O.toString(this.encoding);
      }
      function j(O) {
        return O && O.length ? this.write(O) : "";
      }
    }, { "safe-buffer": 64 }], 81: [function(t, a, e) {
      (function(i) {
        (function() {
          a.exports = o;
          function o(h, p) {
            if (u("noDeprecation"))
              return h;
            var f = !1;
            function d() {
              if (!f) {
                if (u("throwDeprecation"))
                  throw new Error(p);
                u("traceDeprecation") ? console.trace(p) : console.warn(p), f = !0;
              }
              return h.apply(this, arguments);
            }
            return d;
          }
          function u(h) {
            try {
              if (!i.localStorage)
                return !1;
            } catch {
              return !1;
            }
            var p = i.localStorage[h];
            return p == null ? !1 : String(p).toLowerCase() === "true";
          }
        }).call(this);
      }).call(this, typeof ee < "u" ? ee : typeof self < "u" ? self : typeof window < "u" ? window : {});
    }, {}], 82: [function(t, a, e) {
      arguments[4][25][0].apply(e, arguments);
    }, { dup: 25 }], 83: [function(t, a, e) {
      var i = t("is-arguments"), o = t("is-generator-function"), u = t("which-typed-array"), h = t("is-typed-array");
      function p(L) {
        return L.call.bind(L);
      }
      var f = typeof BigInt < "u", d = typeof Symbol < "u", s = p(Object.prototype.toString), g = p(Number.prototype.valueOf), m = p(String.prototype.valueOf), b = p(Boolean.prototype.valueOf);
      if (f)
        var w = p(BigInt.prototype.valueOf);
      if (d)
        var _ = p(Symbol.prototype.valueOf);
      function S(L, tt) {
        if (typeof L != "object")
          return !1;
        try {
          return tt(L), !0;
        } catch {
          return !1;
        }
      }
      e.isArgumentsObject = i, e.isGeneratorFunction = o, e.isTypedArray = h;
      function k(L) {
        return typeof Promise < "u" && L instanceof Promise || L !== null && typeof L == "object" && typeof L.then == "function" && typeof L.catch == "function";
      }
      e.isPromise = k;
      function C(L) {
        return typeof ArrayBuffer < "u" && ArrayBuffer.isView ? ArrayBuffer.isView(L) : h(L) || q(L);
      }
      e.isArrayBufferView = C;
      function j(L) {
        return u(L) === "Uint8Array";
      }
      e.isUint8Array = j;
      function O(L) {
        return u(L) === "Uint8ClampedArray";
      }
      e.isUint8ClampedArray = O;
      function I(L) {
        return u(L) === "Uint16Array";
      }
      e.isUint16Array = I;
      function P(L) {
        return u(L) === "Uint32Array";
      }
      e.isUint32Array = P;
      function v(L) {
        return u(L) === "Int8Array";
      }
      e.isInt8Array = v;
      function N(L) {
        return u(L) === "Int16Array";
      }
      e.isInt16Array = N;
      function T(L) {
        return u(L) === "Int32Array";
      }
      e.isInt32Array = T;
      function G(L) {
        return u(L) === "Float32Array";
      }
      e.isFloat32Array = G;
      function $(L) {
        return u(L) === "Float64Array";
      }
      e.isFloat64Array = $;
      function J(L) {
        return u(L) === "BigInt64Array";
      }
      e.isBigInt64Array = J;
      function st(L) {
        return u(L) === "BigUint64Array";
      }
      e.isBigUint64Array = st;
      function D(L) {
        return s(L) === "[object Map]";
      }
      D.working = typeof Map < "u" && D(/* @__PURE__ */ new Map());
      function E(L) {
        return typeof Map > "u" ? !1 : D.working ? D(L) : L instanceof Map;
      }
      e.isMap = E;
      function Z(L) {
        return s(L) === "[object Set]";
      }
      Z.working = typeof Set < "u" && Z(/* @__PURE__ */ new Set());
      function nt(L) {
        return typeof Set > "u" ? !1 : Z.working ? Z(L) : L instanceof Set;
      }
      e.isSet = nt;
      function ut(L) {
        return s(L) === "[object WeakMap]";
      }
      ut.working = typeof WeakMap < "u" && ut(/* @__PURE__ */ new WeakMap());
      function Et(L) {
        return typeof WeakMap > "u" ? !1 : ut.working ? ut(L) : L instanceof WeakMap;
      }
      e.isWeakMap = Et;
      function it(L) {
        return s(L) === "[object WeakSet]";
      }
      it.working = typeof WeakSet < "u" && it(/* @__PURE__ */ new WeakSet());
      function U(L) {
        return it(L);
      }
      e.isWeakSet = U;
      function W(L) {
        return s(L) === "[object ArrayBuffer]";
      }
      W.working = typeof ArrayBuffer < "u" && W(new ArrayBuffer());
      function V(L) {
        return typeof ArrayBuffer > "u" ? !1 : W.working ? W(L) : L instanceof ArrayBuffer;
      }
      e.isArrayBuffer = V;
      function ft(L) {
        return s(L) === "[object DataView]";
      }
      ft.working = typeof ArrayBuffer < "u" && typeof DataView < "u" && ft(new DataView(new ArrayBuffer(1), 0, 1));
      function q(L) {
        return typeof DataView > "u" ? !1 : ft.working ? ft(L) : L instanceof DataView;
      }
      e.isDataView = q;
      var Y = typeof SharedArrayBuffer < "u" ? SharedArrayBuffer : void 0;
      function Q(L) {
        return s(L) === "[object SharedArrayBuffer]";
      }
      function ct(L) {
        return typeof Y > "u" ? !1 : (typeof Q.working > "u" && (Q.working = Q(new Y())), Q.working ? Q(L) : L instanceof Y);
      }
      e.isSharedArrayBuffer = ct;
      function bt(L) {
        return s(L) === "[object AsyncFunction]";
      }
      e.isAsyncFunction = bt;
      function gt(L) {
        return s(L) === "[object Map Iterator]";
      }
      e.isMapIterator = gt;
      function z(L) {
        return s(L) === "[object Set Iterator]";
      }
      e.isSetIterator = z;
      function X(L) {
        return s(L) === "[object Generator]";
      }
      e.isGeneratorObject = X;
      function ot(L) {
        return s(L) === "[object WebAssembly.Module]";
      }
      e.isWebAssemblyCompiledModule = ot;
      function vt(L) {
        return S(L, g);
      }
      e.isNumberObject = vt;
      function wt(L) {
        return S(L, m);
      }
      e.isStringObject = wt;
      function B(L) {
        return S(L, b);
      }
      e.isBooleanObject = B;
      function F(L) {
        return f && S(L, w);
      }
      e.isBigIntObject = F;
      function l(L) {
        return d && S(L, _);
      }
      e.isSymbolObject = l;
      function y(L) {
        return vt(L) || wt(L) || B(L) || F(L) || l(L);
      }
      e.isBoxedPrimitive = y;
      function A(L) {
        return typeof Uint8Array < "u" && (V(L) || ct(L));
      }
      e.isAnyArrayBuffer = A, ["isProxy", "isExternal", "isModuleNamespaceObject"].forEach(function(L) {
        Object.defineProperty(e, L, {
          enumerable: !1,
          value: function() {
            throw new Error(L + " is not supported in userland");
          }
        });
      });
    }, { "is-arguments": 47, "is-generator-function": 49, "is-typed-array": 50, "which-typed-array": 85 }], 84: [function(t, a, e) {
      (function(i) {
        (function() {
          var o = Object.getOwnPropertyDescriptors || function(q) {
            for (var Y = Object.keys(q), Q = {}, ct = 0; ct < Y.length; ct++)
              Q[Y[ct]] = Object.getOwnPropertyDescriptor(q, Y[ct]);
            return Q;
          }, u = /%[sdj%]/g;
          e.format = function(q) {
            if (!N(q)) {
              for (var Y = [], Q = 0; Q < arguments.length; Q++)
                Y.push(d(arguments[Q]));
              return Y.join(" ");
            }
            for (var Q = 1, ct = arguments, bt = ct.length, gt = String(q).replace(u, function(ot) {
              if (ot === "%%")
                return "%";
              if (Q >= bt)
                return ot;
              switch (ot) {
                case "%s":
                  return String(ct[Q++]);
                case "%d":
                  return Number(ct[Q++]);
                case "%j":
                  try {
                    return JSON.stringify(ct[Q++]);
                  } catch {
                    return "[Circular]";
                  }
                default:
                  return ot;
              }
            }), z = ct[Q]; Q < bt; z = ct[++Q])
              I(z) || !J(z) ? gt += " " + z : gt += " " + d(z);
            return gt;
          }, e.deprecate = function(q, Y) {
            if (typeof i < "u" && i.noDeprecation === !0)
              return q;
            if (typeof i > "u")
              return function() {
                return e.deprecate(q, Y).apply(this, arguments);
              };
            var Q = !1;
            function ct() {
              if (!Q) {
                if (i.throwDeprecation)
                  throw new Error(Y);
                i.traceDeprecation ? console.trace(Y) : console.error(Y), Q = !0;
              }
              return q.apply(this, arguments);
            }
            return ct;
          };
          var h = {}, p = /^$/;
          if (i.env.NODE_DEBUG) {
            var f = i.env.NODE_DEBUG;
            f = f.replace(/[|\\{}()[\]^$+?.]/g, "\\$&").replace(/\*/g, ".*").replace(/,/g, "$|^").toUpperCase(), p = new RegExp("^" + f + "$", "i");
          }
          e.debuglog = function(q) {
            if (q = q.toUpperCase(), !h[q])
              if (p.test(q)) {
                var Y = i.pid;
                h[q] = function() {
                  var Q = e.format.apply(e, arguments);
                  console.error("%s %d: %s", q, Y, Q);
                };
              } else
                h[q] = function() {
                };
            return h[q];
          };
          function d(q, Y) {
            var Q = {
              seen: [],
              stylize: g
            };
            return arguments.length >= 3 && (Q.depth = arguments[2]), arguments.length >= 4 && (Q.colors = arguments[3]), O(Y) ? Q.showHidden = Y : Y && e._extend(Q, Y), G(Q.showHidden) && (Q.showHidden = !1), G(Q.depth) && (Q.depth = 2), G(Q.colors) && (Q.colors = !1), G(Q.customInspect) && (Q.customInspect = !0), Q.colors && (Q.stylize = s), b(Q, q, Q.depth);
          }
          e.inspect = d, d.colors = {
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
          }, d.styles = {
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
          function s(q, Y) {
            var Q = d.styles[Y];
            return Q ? "\x1B[" + d.colors[Q][0] + "m" + q + "\x1B[" + d.colors[Q][1] + "m" : q;
          }
          function g(q, Y) {
            return q;
          }
          function m(q) {
            var Y = {};
            return q.forEach(function(Q, ct) {
              Y[Q] = !0;
            }), Y;
          }
          function b(q, Y, Q) {
            if (q.customInspect && Y && E(Y.inspect) && // Filter out the util module, it's inspect function is special
            Y.inspect !== e.inspect && // Also filter out any prototype objects using the circular check.
            !(Y.constructor && Y.constructor.prototype === Y)) {
              var ct = Y.inspect(Q, q);
              return N(ct) || (ct = b(q, ct, Q)), ct;
            }
            var bt = w(q, Y);
            if (bt)
              return bt;
            var gt = Object.keys(Y), z = m(gt);
            if (q.showHidden && (gt = Object.getOwnPropertyNames(Y)), D(Y) && (gt.indexOf("message") >= 0 || gt.indexOf("description") >= 0))
              return _(Y);
            if (gt.length === 0) {
              if (E(Y)) {
                var X = Y.name ? ": " + Y.name : "";
                return q.stylize("[Function" + X + "]", "special");
              }
              if ($(Y))
                return q.stylize(RegExp.prototype.toString.call(Y), "regexp");
              if (st(Y))
                return q.stylize(Date.prototype.toString.call(Y), "date");
              if (D(Y))
                return _(Y);
            }
            var ot = "", vt = !1, wt = ["{", "}"];
            if (j(Y) && (vt = !0, wt = ["[", "]"]), E(Y)) {
              var B = Y.name ? ": " + Y.name : "";
              ot = " [Function" + B + "]";
            }
            if ($(Y) && (ot = " " + RegExp.prototype.toString.call(Y)), st(Y) && (ot = " " + Date.prototype.toUTCString.call(Y)), D(Y) && (ot = " " + _(Y)), gt.length === 0 && (!vt || Y.length == 0))
              return wt[0] + ot + wt[1];
            if (Q < 0)
              return $(Y) ? q.stylize(RegExp.prototype.toString.call(Y), "regexp") : q.stylize("[Object]", "special");
            q.seen.push(Y);
            var F;
            return vt ? F = S(q, Y, Q, z, gt) : F = gt.map(function(l) {
              return k(q, Y, Q, z, l, vt);
            }), q.seen.pop(), C(F, ot, wt);
          }
          function w(q, Y) {
            if (G(Y))
              return q.stylize("undefined", "undefined");
            if (N(Y)) {
              var Q = "'" + JSON.stringify(Y).replace(/^"|"$/g, "").replace(/'/g, "\\'").replace(/\\"/g, '"') + "'";
              return q.stylize(Q, "string");
            }
            if (v(Y))
              return q.stylize("" + Y, "number");
            if (O(Y))
              return q.stylize("" + Y, "boolean");
            if (I(Y))
              return q.stylize("null", "null");
          }
          function _(q) {
            return "[" + Error.prototype.toString.call(q) + "]";
          }
          function S(q, Y, Q, ct, bt) {
            for (var gt = [], z = 0, X = Y.length; z < X; ++z)
              U(Y, String(z)) ? gt.push(k(
                q,
                Y,
                Q,
                ct,
                String(z),
                !0
              )) : gt.push("");
            return bt.forEach(function(ot) {
              ot.match(/^\d+$/) || gt.push(k(
                q,
                Y,
                Q,
                ct,
                ot,
                !0
              ));
            }), gt;
          }
          function k(q, Y, Q, ct, bt, gt) {
            var z, X, ot;
            if (ot = Object.getOwnPropertyDescriptor(Y, bt) || { value: Y[bt] }, ot.get ? ot.set ? X = q.stylize("[Getter/Setter]", "special") : X = q.stylize("[Getter]", "special") : ot.set && (X = q.stylize("[Setter]", "special")), U(ct, bt) || (z = "[" + bt + "]"), X || (q.seen.indexOf(ot.value) < 0 ? (I(Q) ? X = b(q, ot.value, null) : X = b(q, ot.value, Q - 1), X.indexOf(`
`) > -1 && (gt ? X = X.split(`
`).map(function(vt) {
              return "  " + vt;
            }).join(`
`).slice(2) : X = `
` + X.split(`
`).map(function(vt) {
              return "   " + vt;
            }).join(`
`))) : X = q.stylize("[Circular]", "special")), G(z)) {
              if (gt && bt.match(/^\d+$/))
                return X;
              z = JSON.stringify("" + bt), z.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/) ? (z = z.slice(1, -1), z = q.stylize(z, "name")) : (z = z.replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'"), z = q.stylize(z, "string"));
            }
            return z + ": " + X;
          }
          function C(q, Y, Q) {
            var ct = q.reduce(function(bt, gt) {
              return gt.indexOf(`
`) >= 0, bt + gt.replace(/\u001b\[\d\d?m/g, "").length + 1;
            }, 0);
            return ct > 60 ? Q[0] + (Y === "" ? "" : Y + `
 `) + " " + q.join(`,
  `) + " " + Q[1] : Q[0] + Y + " " + q.join(", ") + " " + Q[1];
          }
          e.types = t("./support/types");
          function j(q) {
            return Array.isArray(q);
          }
          e.isArray = j;
          function O(q) {
            return typeof q == "boolean";
          }
          e.isBoolean = O;
          function I(q) {
            return q === null;
          }
          e.isNull = I;
          function P(q) {
            return q == null;
          }
          e.isNullOrUndefined = P;
          function v(q) {
            return typeof q == "number";
          }
          e.isNumber = v;
          function N(q) {
            return typeof q == "string";
          }
          e.isString = N;
          function T(q) {
            return typeof q == "symbol";
          }
          e.isSymbol = T;
          function G(q) {
            return q === void 0;
          }
          e.isUndefined = G;
          function $(q) {
            return J(q) && nt(q) === "[object RegExp]";
          }
          e.isRegExp = $, e.types.isRegExp = $;
          function J(q) {
            return typeof q == "object" && q !== null;
          }
          e.isObject = J;
          function st(q) {
            return J(q) && nt(q) === "[object Date]";
          }
          e.isDate = st, e.types.isDate = st;
          function D(q) {
            return J(q) && (nt(q) === "[object Error]" || q instanceof Error);
          }
          e.isError = D, e.types.isNativeError = D;
          function E(q) {
            return typeof q == "function";
          }
          e.isFunction = E;
          function Z(q) {
            return q === null || typeof q == "boolean" || typeof q == "number" || typeof q == "string" || typeof q == "symbol" || // ES6 symbol
            typeof q > "u";
          }
          e.isPrimitive = Z, e.isBuffer = t("./support/isBuffer");
          function nt(q) {
            return Object.prototype.toString.call(q);
          }
          function ut(q) {
            return q < 10 ? "0" + q.toString(10) : q.toString(10);
          }
          var Et = [
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
          function it() {
            var q = /* @__PURE__ */ new Date(), Y = [
              ut(q.getHours()),
              ut(q.getMinutes()),
              ut(q.getSeconds())
            ].join(":");
            return [q.getDate(), Et[q.getMonth()], Y].join(" ");
          }
          e.log = function() {
            console.log("%s - %s", it(), e.format.apply(e, arguments));
          }, e.inherits = t("inherits"), e._extend = function(q, Y) {
            if (!Y || !J(Y))
              return q;
            for (var Q = Object.keys(Y), ct = Q.length; ct--; )
              q[Q[ct]] = Y[Q[ct]];
            return q;
          };
          function U(q, Y) {
            return Object.prototype.hasOwnProperty.call(q, Y);
          }
          var W = typeof Symbol < "u" ? Symbol("util.promisify.custom") : void 0;
          e.promisify = function(q) {
            if (typeof q != "function")
              throw new TypeError('The "original" argument must be of type Function');
            if (W && q[W]) {
              var Y = q[W];
              if (typeof Y != "function")
                throw new TypeError('The "util.promisify.custom" argument must be of type Function');
              return Object.defineProperty(Y, W, {
                value: Y,
                enumerable: !1,
                writable: !1,
                configurable: !0
              }), Y;
            }
            function Y() {
              for (var Q, ct, bt = new Promise(function(X, ot) {
                Q = X, ct = ot;
              }), gt = [], z = 0; z < arguments.length; z++)
                gt.push(arguments[z]);
              gt.push(function(X, ot) {
                X ? ct(X) : Q(ot);
              });
              try {
                q.apply(this, gt);
              } catch (X) {
                ct(X);
              }
              return bt;
            }
            return Object.setPrototypeOf(Y, Object.getPrototypeOf(q)), W && Object.defineProperty(Y, W, {
              value: Y,
              enumerable: !1,
              writable: !1,
              configurable: !0
            }), Object.defineProperties(
              Y,
              o(q)
            );
          }, e.promisify.custom = W;
          function V(q, Y) {
            if (!q) {
              var Q = new Error("Promise was rejected with a falsy value");
              Q.reason = q, q = Q;
            }
            return Y(q);
          }
          function ft(q) {
            if (typeof q != "function")
              throw new TypeError('The "original" argument must be of type Function');
            function Y() {
              for (var Q = [], ct = 0; ct < arguments.length; ct++)
                Q.push(arguments[ct]);
              var bt = Q.pop();
              if (typeof bt != "function")
                throw new TypeError("The last argument must be of type Function");
              var gt = this, z = function() {
                return bt.apply(gt, arguments);
              };
              q.apply(this, Q).then(
                function(X) {
                  i.nextTick(z.bind(null, null, X));
                },
                function(X) {
                  i.nextTick(V.bind(null, X, z));
                }
              );
            }
            return Object.setPrototypeOf(Y, Object.getPrototypeOf(q)), Object.defineProperties(
              Y,
              o(q)
            ), Y;
          }
          e.callbackify = ft;
        }).call(this);
      }).call(this, t("_process"));
    }, { "./support/isBuffer": 82, "./support/types": 83, _process: 63, inherits: 46 }], 85: [function(t, a, e) {
      (function(i) {
        (function() {
          var o = t("for-each"), u = t("available-typed-arrays"), h = t("call-bind/callBound"), p = t("gopd"), f = h("Object.prototype.toString"), d = t("has-tostringtag/shams")(), s = typeof globalThis > "u" ? i : globalThis, g = u(), m = h("String.prototype.slice"), b = {}, w = Object.getPrototypeOf;
          d && p && w && o(g, function(k) {
            if (typeof s[k] == "function") {
              var C = new s[k]();
              if (Symbol.toStringTag in C) {
                var j = w(C), O = p(j, Symbol.toStringTag);
                if (!O) {
                  var I = w(j);
                  O = p(I, Symbol.toStringTag);
                }
                b[k] = O.get;
              }
            }
          });
          var _ = function(k) {
            var C = !1;
            return o(b, function(j, O) {
              if (!C)
                try {
                  var I = j.call(k);
                  I === O && (C = I);
                } catch {
                }
            }), C;
          }, S = t("is-typed-array");
          a.exports = function(k) {
            return S(k) ? !d || !(Symbol.toStringTag in k) ? m(f(k), 8, -1) : _(k) : !1;
          };
        }).call(this);
      }).call(this, typeof ee < "u" ? ee : typeof self < "u" ? self : typeof window < "u" ? window : {});
    }, { "available-typed-arrays": 27, "call-bind/callBound": 33, "for-each": 36, gopd: 40, "has-tostringtag/shams": 43, "is-typed-array": 50 }] }, {}, [20])(20);
  });
})(ja);
const Fa = (n) => {
  const { data: { position: r, color: t }, bounds: a } = n, e = 4, { width: i, height: o, data: u } = r, h = t == null ? void 0 : t.data, p = [], { min: f, max: d } = a, s = d.clone().sub(f);
  for (let g = 0; g < o; g++)
    for (let m = 0; m < i; m++) {
      const b = (g * i + m) * e, w = u[b] / 256, _ = u[b + 1] / 256, S = u[b + 2] / 256;
      if (u[b + 3] <= 0)
        break;
      const k = h !== void 0 ? { r: h[b], g: h[b + 1], b: h[b + 2], a: h[b + 3] } : void 0;
      p.push({
        position: new Lt(w, _, S).multiply(s).add(f),
        color: k
      });
    }
  return p;
};
var be = { jsx: yt, jsxs: Gt, Fragment: ln };
const Qe = {
  Default: 0,
  Loading: 1,
  Loaded: 2
};
function Vn(n) {
  const {
    meta: r,
    loader: t,
    parser: a,
    pointColorHandler: e,
    lod: i,
    coordinate: o,
    bounds: u,
    onUpdateState: h,
    color: p,
    opacity: f,
    pointSize: d,
    minPointSize: s,
    lodPointScale: g,
    circle: m,
    lodHelper: b,
    frustumCulled: w,
    ..._
  } = n, S = se(null), [k, C] = zt(!1), [j, O] = zt(Qe.Default), [I, P] = zt({}), v = Ut(() => `${o.x}-${o.y}-${o.z}`, [o]), N = Ut(() => {
    const it = r.coordinates[i][v], { min: U, max: W } = it, V = new Lt(U[0], U[1], U[2]), ft = new Lt(W[0], W[1], W[2]), q = ft.clone().sub(V);
    return {
      min: V,
      max: ft,
      size: q
    };
  }, [r, i, v]);
  ie(() => {
    h == null || h({
      coordinate: o,
      state: j
    });
  }, [o, j, h]);
  const T = Ut(() => u.getSize(new Lt()), [u]), G = Bt(
    (it, U, W) => {
      const V = o.clone().multiplyScalar(2).clone().add(new Lt(it, U, W)), ft = `${V.x}-${V.y}-${V.z}`;
      return {
        position: V,
        key: ft
      };
    },
    [o]
  ), $ = Bt(() => {
    const { min: it } = u, U = new Lt();
    u.getSize(U);
    const { x: W, y: V, z: ft } = U, q = W * 0.5, Y = V * 0.5, Q = ft * 0.5, ct = new Lt(q, Y, Q), bt = {};
    for (let gt = 0; gt <= 1; gt += 1)
      for (let z = 0; z <= 1; z += 1)
        for (let X = 0; X <= 1; X += 1) {
          const ot = it.clone().add(ct.clone().multiply(new Lt(X, z, gt))), vt = it.clone().add(ct.clone().multiply(new Lt(X + 1, z + 1, gt + 1))), { key: wt } = G(X, z, gt);
          bt[wt] = new xe(ot, vt);
        }
    return bt;
  }, [u, i, G]), J = Ut(() => {
    const it = $(), U = i + 1, W = [];
    for (let V = 0; V <= 1; V += 1)
      for (let ft = 0; ft <= 1; ft += 1)
        for (let q = 0; q <= 1; q += 1) {
          const { position: Y, key: Q } = G(q, ft, V), ct = it[Q], bt = U in r.coordinates && Q in r.coordinates[U];
          W.push({
            lod: U,
            coordinate: Y,
            bounds: ct,
            exists: bt
          });
        }
    return W;
  }, [r, u, i, $, G]), [st, D] = zt([]), E = Bt(
    (it) => {
      const { points: U, grid: W } = it, V = W.map((q) => ({
        points: [],
        bounds: q.bounds
      }));
      U.forEach((q) => {
        var Y;
        (Y = V.find((Q) => Q.bounds.containsPoint(q.position))) == null || Y.points.push(q);
      });
      const ft = V.map((q) => {
        const { points: Y } = q, Q = 1 / 256;
        return {
          position: new Float32Array(
            Y.map((ct) => ct.position.toArray()).flat()
          ),
          color: e === void 0 ? new Float32Array(
            Y.map((ct) => {
              var bt, gt, z;
              return [
                (((bt = ct.color) == null ? void 0 : bt.r) ?? 255) * Q,
                (((gt = ct.color) == null ? void 0 : gt.g) ?? 255) * Q,
                (((z = ct.color) == null ? void 0 : z.b) ?? 255) * Q
              ];
            }).flat()
          ) : new Float32Array(Y.map((ct) => e({
            point: ct,
            lod: i,
            bounds: u
          })).flat())
        };
      });
      D(ft);
    },
    [e, u, i]
  );
  ie(() => {
    if (J.length > 0) {
      O(Qe.Loading);
      const it = {
        lod: i,
        coordinate: o
      };
      t({ address: it, color: !0 }).then((U) => {
        const W = a({
          data: U,
          address: it,
          bounds: N
        });
        E({
          points: W,
          grid: J
        }), O(Qe.Loaded);
      });
    }
  }, [r, N, t, i, o, a, E, J]), Rr(({ camera: it }) => {
    if (i >= r.lod)
      return;
    const { current: U } = S;
    if (U === null)
      return;
    const { min: W, max: V } = u, ft = [
      new Lt(W.x, W.y, W.z),
      new Lt(V.x, W.y, W.z),
      new Lt(V.x, W.y, V.z),
      new Lt(W.x, W.y, V.z),
      new Lt(W.x, V.y, W.z),
      new Lt(V.x, V.y, W.z),
      new Lt(V.x, V.y, V.z),
      new Lt(W.x, V.y, V.z)
    ].map((ct) => U.localToWorld(ct.clone())), q = new xe().setFromPoints(ft), Y = Math.max(...T.toArray()) / 2, Q = q.distanceToPoint(it.position) < Y || q.containsPoint(it.position);
    C(Q);
  });
  const Z = Bt(
    (it) => {
      const { coordinate: U, state: W } = it;
      P((V) => ({
        ...V,
        [`${U.x}-${U.y}-${U.z}`]: W
      }));
    },
    []
  ), nt = Ut(() => {
    const it = d ?? 5;
    if (g !== !1) {
      const U = 2 ** (J.filter((W) => W.exists).length > 0 ? i : i - 1);
      return it / U;
    }
    return it;
  }, [r, d, g, i, J]), ut = Ut(() => p ?? new fn("white"), [p]), Et = Bt((it) => {
    const { vertexShader: U, fragmentShader: W } = it;
    {
      const V = U.split(`
`);
      V.pop();
      const ft = s ?? 0;
      V.push(`gl_PointSize = max(gl_PointSize, ${ft.toFixed(2)});`), V.push("}"), it.vertexShader = V.join(`
`);
    }
    {
      const V = W.split(`
`);
      V.pop(), V.push("if (distance(gl_PointCoord, vec2(0.5, 0.5)) > 0.5) { discard; }"), V.push("}"), it.fragmentShader = V.join(`
`);
    }
  }, [s]);
  return /* @__PURE__ */ be.jsxs("group", { ref: S, children: [
    b === !0 && /* @__PURE__ */ be.jsx("box3Helper", { args: [u, 16711680] }),
    J.map((it, U) => {
      const W = it.coordinate.toArray().join("-"), { exists: V } = it;
      return /* @__PURE__ */ be.jsxs("group", { frustumCulled: !1, children: [
        k && V ? /* @__PURE__ */ be.jsx(
          Vn,
          {
            meta: r,
            loader: t,
            parser: a,
            pointColorHandler: e,
            onUpdateState: Z,
            color: p,
            opacity: f,
            pointSize: d,
            minPointSize: s,
            circle: m,
            lodHelper: b,
            frustumCulled: w,
            ..._,
            ...it
          }
        ) : null,
        st[U] !== void 0 ? /* @__PURE__ */ be.jsx(
          hi,
          {
            visible: !V || !k || I[W] !== Qe.Loaded,
            positions: st[U].position,
            colors: st[U].color,
            frustumCulled: w,
            children: /* @__PURE__ */ be.jsx(
              "pointsMaterial",
              {
                color: ut,
                vertexColors: !0,
                sizeAttenuation: !0,
                size: nt,
                opacity: f ?? 1,
                transparent: f !== void 0 && f < 1,
                onBeforeCompile: Et,
                ..._
              }
            )
          }
        ) : null
      ] }, `${i}-${W}`);
    })
  ] });
}
function Ua(n) {
  const { meta: r, loader: t, parser: a, pointColorHandler: e, ...i } = n, o = Ut(() => {
    if (r !== null) {
      const { min: p, max: f } = r.bounds, d = new xe(new Lt().fromArray(p), new Lt().fromArray(f)), s = new Lt();
      d.getSize(s);
      const g = Math.max(s.x, s.y, s.z), m = new Lt(g, g, g);
      return new xe(d.min.clone(), d.min.clone().add(m));
    }
    return new xe();
  }, [r]), u = Ut(() => {
    const p = o.getSize(new Lt());
    return [p.x, p.y, p.z, 1, 1, 1];
  }, [o]), h = Ut(() => new Lt(), []);
  return /* @__PURE__ */ be.jsxs("group", { children: [
    /* @__PURE__ */ be.jsx(ui, { position: o.getCenter(new Lt()), args: u, visible: !1, children: /* @__PURE__ */ be.jsx("meshStandardMaterial", { color: "tomato", transparent: !0, opacity: 0.2 }) }),
    /* @__PURE__ */ be.jsx(
      Vn,
      {
        meta: r,
        loader: t,
        parser: a,
        pointColorHandler: e,
        lod: 0,
        coordinate: h,
        bounds: o,
        ...i
      }
    )
  ] });
}
const za = {
  // 右手系 Z Up → 変換不要
  RIGHT_HANDED_Z_UP: { rotation: [0, 0, 0], scale: [1, 1, 1] },
  // 右手系 Y Up → X軸周りに +90° 回転して Y→Z へ
  RIGHT_HANDED_Y_UP: { rotation: [Math.PI / 2, 0, 0], scale: [1, 1, 1] },
  // 右手系 X Up → Y軸周りに -90° 回転して X→Z へ
  RIGHT_HANDED_X_UP: { rotation: [0, -Math.PI / 2, 0], scale: [1, 1, 1] },
  // 左手系 Z Up → X軸ミラーで右手系に変換
  LEFT_HANDED_Z_UP: { rotation: [0, 0, 0], scale: [-1, 1, 1] },
  // 左手系 Y Up → X軸周りに +90° 回転 + X軸ミラー
  LEFT_HANDED_Y_UP: { rotation: [Math.PI / 2, 0, 0], scale: [-1, 1, 1] },
  // 左手系 X Up → Y軸周りに -90° 回転 + X軸ミラー
  LEFT_HANDED_X_UP: { rotation: [0, -Math.PI / 2, 0], scale: [-1, 1, 1] }
}, on = (n, r, t) => Math.min(t, Math.max(r, n)), Za = ({
  file: n,
  meta: r,
  referencePoint: t,
  selected: a = !1,
  translation: e,
  rotation: i,
  inspectorPointSize: o,
  inspectorOpacity: u,
  inspectorCoordinateSystem: h
}) => {
  const { client: p, project: f } = Ge(), [d, s] = zt(!1), [g, m] = zt(!1), b = se(null), w = Bt(
    (v) => {
      const { address: N, color: T } = v, { lod: G, coordinate: $ } = N;
      return new Promise(async (J, st) => {
        const D = new Wr(), E = `${$.x}-${$.y}-${$.z}`, Z = {
          contractId: f.contractId,
          contractFileId: n.id,
          level: G,
          addr: E
        }, nt = await (p == null ? void 0 : p.getContractFileImagePosition(Z));
        if (nt === void 0) {
          st(new Error("Failed to load PNG buffer"));
          return;
        }
        const ut = D.parse(nt);
        ut.on("parsed", async () => {
          if (T) {
            const Et = await (p == null ? void 0 : p.getContractFileImageColor(Z));
            if (Et === void 0) {
              st(new Error("Failed to load PNG buffer"));
              return;
            }
            const U = new Wr().parse(Et);
            U.on("parsed", () => {
              J({
                position: ut,
                color: U
              });
            });
          } else
            J({
              position: ut
            });
        });
      });
    },
    [p, f, n]
  );
  ie(() => {
    (async () => {
      if ((r == null ? void 0 : r.version) !== void 0)
        try {
          const {
            position: { data: v }
          } = await w({
            address: {
              lod: 0,
              coordinate: {
                x: 0,
                y: 0,
                z: 0
              }
            }
          }), { length: N } = v, T = Array.from({ length: N / 4 }).some((G, $) => {
            const J = v[$ * 4 + 3];
            return J !== 0 && J !== 255;
          });
          m(T);
        } catch (v) {
          console.warn(v);
        }
      s(!0);
    })();
  }, [r, w]);
  const _ = Ut(() => {
    if (t == null) return r;
    const { min: v, max: N } = r.bounds, T = new Lt().fromArray(v).add(t), G = new Lt().fromArray(N).add(t);
    return {
      ...r,
      bounds: {
        min: T.toArray(),
        max: G.toArray()
      }
    };
  }, [r, t]), S = Bt(
    (v) => {
      const N = t ?? new Lt();
      return Fa(v).map((G) => (G.position.add(N), G));
    },
    [t]
  ), k = Ut(() => Dt.scale("Spectral"), []), C = Bt(
    (v) => {
      const N = k(v), [T, G, $] = N.rgb(!1);
      return [T / 255, G / 255, $ / 255];
    },
    [k]
  ), j = Bt(
    ({ point: v }) => {
      const { color: N } = v;
      let T;
      if (N !== void 0) {
        const { r: G, g: $, b: J, a: st } = N;
        g ? T = C(st / 255) : T = [G / 255, $ / 255, J / 255];
      } else
        T = [1, 1, 1];
      if (a) {
        const G = [0.12941176470588237, 0.5882352941176471, 0.9529411764705882], $ = 0.3;
        return [
          T[0] * (1 - $) + G[0] * $,
          T[1] * (1 - $) + G[1] * $,
          T[2] * (1 - $) + G[2] * $
        ];
      }
      return T;
    },
    [C, g, a]
  ), O = Ut(() => {
    const v = r.bounds, N = v.max[0] - v.min[0], T = v.max[1] - v.min[1], G = v.max[2] - v.min[2];
    return qa({ size: { x: N, y: T, z: G } });
  }, [r]), I = Ut(() => (O ?? 1) * 0.1, [O]);
  ie(() => {
    const v = b.current;
    v && (o === void 0 && u === void 0 || v.traverse((N) => {
      var G, $, J, st;
      const T = N.material;
      if (T) {
        if (o !== void 0) {
          const D = on(o, 0, 5);
          typeof T.size == "number" && (T.size = D, T.needsUpdate = !0), (($ = (G = T.uniforms) == null ? void 0 : G.pointSize) == null ? void 0 : $.value) !== void 0 && (T.uniforms.pointSize.value = D);
        }
        if (u !== void 0) {
          const D = on(u, 0, 100) / 100;
          ((st = (J = T.uniforms) == null ? void 0 : J.opacity) == null ? void 0 : st.value) !== void 0 && (T.uniforms.opacity.value = D), typeof T.opacity == "number" && (T.opacity = D, D < 1 && T.transparent !== !0 && (T.transparent = !0), T.needsUpdate = !0);
        }
      }
    }));
  }, [o, u]);
  const P = Ut(() => {
    if (h)
      return za[h];
  }, [h]);
  return d ? /* @__PURE__ */ yt(
    "group",
    {
      ref: b,
      position: [e.x, e.y, e.z],
      rotation: [
        i.x * (Math.PI / 180),
        i.y * (Math.PI / 180),
        i.z * (Math.PI / 180),
        "XYZ"
      ],
      children: /* @__PURE__ */ yt(
        "group",
        {
          rotation: P ? new Qn(P.rotation[0], P.rotation[1], P.rotation[2], "XYZ") : void 0,
          scale: P ? P.scale : void 0,
          children: /* @__PURE__ */ yt(
            Ua,
            {
              frustumCulled: !1,
              meta: _,
              loader: w,
              parser: S,
              pointColorHandler: j,
              pointSize: O,
              minPointSize: I
            }
          )
        }
      )
    }
  ) : null;
};
function qa(n) {
  const { x: r, y: t, z: a } = n.size, { min: e, max: i } = n, u = Math.max(r, t, a) / 128 * 3;
  return Math.min(Math.max(e ?? u, u), i ?? u);
}
const Wa = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  maxHeight: "calc(100% - 40px)",
  width: 600,
  bgcolor: "background.paper",
  boxShadow: 12,
  borderRadius: 4,
  p: 4,
  overflowY: "auto"
}, Ga = (n) => {
  const { children: r, boxSx: t, ...a } = n;
  return /* @__PURE__ */ yt(oi, { ...a, children: /* @__PURE__ */ yt(fe, { component: "div", sx: { ...Wa, ...t }, children: r }) });
}, Ha = ({
  value: n,
  onChange: r
}) => {
  const t = Ut(
    () => [
      {
        label: "スキャン番号",
        key: "no"
      },
      {
        label: "取得時間",
        key: "time"
      },
      {
        label: "取得方法",
        key: "method"
      },
      {
        label: "利用機器",
        key: "equipment"
      },
      {
        label: "作業者",
        key: "person"
      },
      {
        label: "対象構造物",
        key: "crs"
      }
    ],
    []
  ), a = Bt(
    (e, i) => {
      r == null || r({
        key: i,
        value: e.target.value
      });
    },
    [r]
  );
  return /* @__PURE__ */ Gt(
    Lr,
    {
      sx: {
        marginBottom: 3,
        width: 1
      },
      children: [
        /* @__PURE__ */ yt(
          hn,
          {
            id: "file-variant",
            sx: {
              fontWeight: "bold",
              marginBottom: 1
            },
            children: "施工現場情報"
          }
        ),
        t.map((e) => /* @__PURE__ */ yt(
          er,
          {
            id: `point-cloud-attribute-${e.key}`,
            size: "small",
            label: e.label,
            value: (n == null ? void 0 : n[e.key]) ?? "",
            onChange: (i) => a(i, e.key),
            sx: {
              marginBottom: 1
            }
          },
          `point-cloud-attribute-${e.key}`
        ))
      ]
    }
  );
}, Va = (n) => {
  const { client: r } = Ge(), { contractId: t, onUploaded: a, ...e } = n, i = se(null), [o, u] = zt(null), [h, p] = zt(!1), [f, d] = zt(""), [s, g] = zt({}), m = Ut(() => ".las,.laz,.csv,.txt,.xyz,.e57", []), b = Bt(
    (_) => {
      const { files: S } = _.target;
      if (S !== null) {
        const k = Array.from(S);
        if (k.length > 10) {
          d("アップロードできるファイル数は10個までです");
          return;
        }
        d(""), u(k[0]);
      }
    },
    []
  ), w = Bt(() => {
    o !== null && (p(!0), o.arrayBuffer().then((_) => r == null ? void 0 : r.uploadContractFile({
      contractId: t,
      name: o.name,
      buffer: _,
      pointCloudAttribute: s
    })).then((_) => {
      _ !== void 0 && (a == null || a(_));
    }).catch((_) => {
      console.error(_);
    }).finally(() => {
      p(!1);
    }));
  }, [t, r, o, s, a]);
  return /* @__PURE__ */ yt(Ga, { ...e, children: /* @__PURE__ */ yt(
    fe,
    {
      component: "div",
      sx: {
        width: 1,
        height: 1
      },
      children: h ? /* @__PURE__ */ yt(
        fe,
        {
          component: "div",
          sx: {
            width: 1,
            height: 1,
            flexDirection: "column"
          },
          display: "flex",
          children: /* @__PURE__ */ yt(
            Ue,
            {
              variant: "h6",
              sx: {
                fontWeight: "bold",
                marginBottom: 3
              },
              children: "ファイルをアップロードしています"
            }
          )
        }
      ) : /* @__PURE__ */ Gt(
        fe,
        {
          component: "div",
          display: "flex",
          flexDirection: "column",
          gap: 1,
          sx: {
            width: 1,
            height: 1
          },
          children: [
            /* @__PURE__ */ yt(
              Ue,
              {
                variant: "h6",
                sx: {
                  fontWeight: "bold",
                  marginBottom: 2
                },
                children: "ファイルをアップロードする"
              }
            ),
            /* @__PURE__ */ Gt(Lr, { children: [
              /* @__PURE__ */ yt(
                hn,
                {
                  id: "file-uploading",
                  sx: {
                    fontWeight: "bold",
                    marginBottom: 1
                  },
                  children: "ファイルを選択する"
                }
              ),
              /* @__PURE__ */ yt(
                rr,
                {
                  variant: "outlined",
                  startIcon: /* @__PURE__ */ yt(wi, {}),
                  sx: {
                    width: "auto"
                  },
                  onClick: () => {
                    var _;
                    (_ = i.current) == null || _.click();
                  },
                  children: "ファイルを選択する"
                }
              ),
              /* @__PURE__ */ yt(
                "input",
                {
                  multiple: !1,
                  type: "file",
                  accept: m,
                  onChange: b,
                  style: { display: "none" },
                  ref: i
                }
              ),
              /* @__PURE__ */ yt(ai, { error: !0, children: f })
            ] }),
            o !== null && /* @__PURE__ */ Gt(fe, { width: 1, children: [
              /* @__PURE__ */ yt(
                Ue,
                {
                  variant: "body1",
                  sx: {
                    marginRight: 1
                  },
                  children: o.name
                }
              ),
              /* @__PURE__ */ yt(
                Ha,
                {
                  value: s,
                  onChange: (_) => {
                    g((S) => ({
                      ...S,
                      [_.key]: _.value
                    }));
                  }
                }
              )
            ] }),
            /* @__PURE__ */ yt(
              fe,
              {
                component: "div",
                sx: {
                  width: 1,
                  marginTop: 1,
                  textAlign: "right"
                },
                children: /* @__PURE__ */ yt(
                  rr,
                  {
                    variant: "contained",
                    onClick: w,
                    disabled: o === null,
                    children: "アップロードする"
                  }
                )
              }
            )
          ]
        }
      )
    }
  ) });
}, Ya = ({ contractId: n, onUploaded: r }) => {
  const t = ze.useSelector((p) => p), a = ze.useActorRef(), [e, i] = zt({
    file: !1
  }), o = Bt(
    (p) => () => {
      i((f) => ({ ...f, [p]: !1 }));
    },
    []
  ), u = Ut(() => [
    {
      icon: /* @__PURE__ */ yt(vi, {}),
      text: "ファイル",
      onClick: () => {
        i({ file: !0 }), a.send({ type: "IDLE" });
      }
    },
    /*
    {
      icon: <Palette />,
      text: "外観",
      selected: state.matches("appearance"),
    },
    */
    {
      icon: /* @__PURE__ */ yt(Ei, {}),
      text: "基準点",
      selected: t.matches("reference_point"),
      onClick: () => {
        t.matches("reference_point") ? a.send({ type: "IDLE" }) : a.send({ type: "REFERENCE_POINT" });
      }
    }
    /*
    {
      icon: <OpenWith />,
      text: "移動",
      selected: state.matches("transform.position"),
    },
    {
      icon: <RotateLeft />,
      text: "回転",
      selected: state.matches("transform.rotation"),
    },
    {
      icon: <SquareFoot />,
      text: "寸法",
      selected: state.matches("metric"),
    },
    {
      icon: <ThreeDRotation />,
      text: "モデリング",
      selected: state.matches("modeling"),
    },
    */
  ], [t, a]), h = Bt(() => {
    r == null || r(), o("file")();
  }, [r, o]);
  return /* @__PURE__ */ Gt(
    Pr,
    {
      dense: !0,
      sx: {
        flex: "0 0 auto"
      },
      children: [
        u.map((p, f) => /* @__PURE__ */ Gt(dn, { onClick: p.onClick, selected: p.selected, children: [
          /* @__PURE__ */ yt(si, { children: p.icon }),
          /* @__PURE__ */ yt(li, { primary: p.text })
        ] }, f)),
        /* @__PURE__ */ yt(
          Va,
          {
            contractId: n,
            open: e.file ?? !1,
            onUploaded: h,
            onClose: o("file")
          }
        )
      ]
    }
  );
}, Xa = ({ point: n }) => /* @__PURE__ */ Gt(
  fe,
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
      /* @__PURE__ */ yt(
        Ue,
        {
          variant: "caption",
          sx: {
            marginRight: 1,
            marginTop: "2px"
          },
          children: "基準点"
        }
      ),
      /* @__PURE__ */ Gt(
        "code",
        {
          style: {
            fontSize: "0.75em"
          },
          children: [
            "(",
            vr(n.x),
            ", ",
            vr(n.y),
            ", ",
            vr(n.z),
            ")"
          ]
        }
      )
    ]
  }
), vr = (n) => Math.floor(n * 10) / 10, $a = ({
  onFileFocus: n,
  onFileDelete: r
}) => {
  const { client: t, project: a } = Ge(), { toggleVisibility: e, containers: i } = Ir(), [o, u] = zt(null), h = o !== null, p = Bt(
    (s, g) => {
      u({ el: s, container: g });
    },
    []
  ), f = Bt(() => {
    u(null);
  }, []), d = Bt(
    (s) => {
      const { id: g } = s;
      a === void 0 || g === void 0 || t == null || t.getContractFileDownloadUrl(a.contractId, g).then((m) => {
        const { presignedURL: b } = m;
        b !== void 0 && window.open(b, "_blank");
      });
    },
    [t, a]
  );
  return /* @__PURE__ */ Gt(ln, { children: [
    i.map((s) => {
      const { file: g, visible: m } = s;
      return /* @__PURE__ */ Gt(Ar, { children: [
        /* @__PURE__ */ yt(Ue, { variant: "body2", marginRight: 2, children: g.name }),
        /* @__PURE__ */ Gt(fe, { children: [
          /* @__PURE__ */ yt(lr, { title: "ファイルを表示", disableInteractive: !0, children: /* @__PURE__ */ yt(
            fr,
            {
              size: "small",
              onClick: () => {
                e(s);
              },
              children: m ? /* @__PURE__ */ yt(Ai, {}) : /* @__PURE__ */ yt(Si, {})
            }
          ) }),
          /* @__PURE__ */ yt(lr, { title: "ファイルの中心に移動", disableInteractive: !0, children: /* @__PURE__ */ yt(
            fr,
            {
              size: "small",
              disabled: !m,
              onClick: () => {
                n(g);
              },
              children: /* @__PURE__ */ yt(xi, {})
            }
          ) }),
          /* @__PURE__ */ yt(lr, { title: "ファイルの詳細", children: /* @__PURE__ */ yt(
            fr,
            {
              size: "small",
              onClick: (b) => {
                p(b.currentTarget, s);
              },
              children: /* @__PURE__ */ yt(ki, {})
            }
          ) })
        ] })
      ] }, g.id);
    }),
    /* @__PURE__ */ yt(fi, { anchorEl: o == null ? void 0 : o.el, open: h, onClose: f, children: /* @__PURE__ */ Gt(Pr, { dense: !0, children: [
      /* @__PURE__ */ yt(
        dn,
        {
          onClick: () => {
            o !== null && d(o.container.file);
          },
          children: "ダウンロード"
        }
      ),
      // eslint-disable-next-line no-constant-binary-expression
      !1
    ] }) })
  ] });
}, Ka = () => {
  const n = ze.useActorRef(), { point: r, change: t, save: a } = Cr(), e = Bt(
    (u) => (h) => {
      const {
        target: { value: p }
      } = h, f = Number(p);
      if (!Number.isNaN(f)) {
        const d = r.clone();
        d.setComponent(u, f), t(d);
      }
    },
    [r, t]
  ), i = Bt(() => {
    a(r);
  }, [r, a]), o = Bt(() => {
    n.send({ type: "IDLE" });
  }, [n]);
  return /* @__PURE__ */ yt(
    fe,
    {
      component: "div",
      sx: {
        width: 1,
        height: 1
      },
      children: /* @__PURE__ */ Gt(ci, { children: [
        /* @__PURE__ */ yt(Ar, { children: /* @__PURE__ */ Gt(
          Lr,
          {
            sx: {
              width: 1
            },
            children: [
              /* @__PURE__ */ yt(
                er,
                {
                  id: "x",
                  label: "X",
                  size: "small",
                  fullWidth: !0,
                  sx: {
                    marginBottom: 1
                  },
                  type: "number",
                  value: r.x,
                  onChange: e(0)
                }
              ),
              /* @__PURE__ */ yt(
                er,
                {
                  id: "y",
                  label: "Y",
                  size: "small",
                  fullWidth: !0,
                  sx: {
                    marginBottom: 1
                  },
                  type: "number",
                  value: r.y,
                  onChange: e(1)
                }
              ),
              /* @__PURE__ */ yt(
                er,
                {
                  id: "z",
                  label: "Z",
                  size: "small",
                  fullWidth: !0,
                  type: "number",
                  value: r.z,
                  onChange: e(2)
                }
              )
            ]
          }
        ) }),
        /* @__PURE__ */ Gt(Ar, { sx: { display: "flex", flexDirection: "column" }, children: [
          /* @__PURE__ */ yt(
            rr,
            {
              sx: { marginBottom: 1 },
              variant: "contained",
              fullWidth: !0,
              startIcon: /* @__PURE__ */ yt(Li, {}),
              onClick: i,
              children: "保存"
            }
          ),
          /* @__PURE__ */ yt(
            rr,
            {
              variant: "outlined",
              fullWidth: !0,
              startIcon: /* @__PURE__ */ yt(Pi, {}),
              onClick: o,
              children: "閉じる"
            }
          )
        ] })
      ] })
    }
  );
}, Ja = ({ onFileFocus: n, onFileDelete: r }) => {
  const t = ze.useSelector((a) => a);
  return /* @__PURE__ */ yt(
    Pr,
    {
      dense: !0,
      sx: {
        flex: "0 0 auto"
      },
      children: t.matches("reference_point") ? /* @__PURE__ */ yt(Ka, {}) : /* @__PURE__ */ yt(
        $a,
        {
          onFileFocus: n,
          onFileDelete: r
        }
      )
    }
  );
}, Qa = "RCDE_VIEWER_CMD", tr = (n, r, t) => Math.min(t, Math.max(r, n)), ts = (n, r) => {
  const t = new Lt(1 / n.direction.x, 1 / n.direction.y, 1 / n.direction.z), a = (r.min.x - n.origin.x) * t.x, e = (r.max.x - n.origin.x) * t.x, i = (r.min.y - n.origin.y) * t.y, o = (r.max.y - n.origin.y) * t.y, u = (r.min.z - n.origin.z) * t.z, h = (r.max.z - n.origin.z) * t.z, p = Math.max(Math.max(Math.min(a, e), Math.min(i, o)), Math.min(u, h)), f = Math.min(Math.min(Math.max(a, e), Math.max(i, o)), Math.max(u, h));
  if (f < 0 || p > f)
    return null;
  const d = p > 0 ? p : f;
  return n.origin.clone().add(n.direction.clone().multiplyScalar(d));
}, es = ({ views: n, referencePoint: r, onContractFileClick: t }) => {
  const { camera: a, gl: e } = Or(), i = Ut(() => new ei(), []), o = Bt((u) => {
    if (!t) return;
    const h = e.domElement.getBoundingClientRect(), p = (u.clientX - h.left) / h.width * 2 - 1, f = -((u.clientY - h.top) / h.height) * 2 + 1;
    i.setFromCamera(new Fe(p, f), a);
    const d = i.ray;
    let s = null;
    for (const g of n) {
      const m = g.boundingBox.clone();
      m.translate(r);
      const b = ts(d, m);
      if (b) {
        const w = d.origin.distanceTo(b);
        (!s || w < s.distance) && (s = { view: g, distance: w });
      }
    }
    s ? t(s.view.file, s.view.boundingBox) : t(void 0, void 0);
  }, [n, r, t, a, e, i]);
  return ie(() => {
    const u = e.domElement;
    return u.addEventListener("click", o), () => {
      u.removeEventListener("click", o);
    };
  }, [e, o]), null;
}, rs = (n) => {
  const { load: r, containers: t } = Ir(), { app: a, constructionId: e, contractId: i, contractFileIds: o, r3f: u, children: h, positionOffsetComponent: p, showLeftSider: f = !0, showRightSider: d = !0, selectedFileId: s, onContractFileClick: g } = n, { initialize: m, client: b, project: w, setProject: _ } = Ge(), { point: S, change: k } = Cr(), [C, j] = zt([]), O = se(null), I = se(null), P = se(null), [v, N] = zt({
    pointSize: 2,
    opacity: 100
  }), [T, G] = zt({}), [$, J] = zt({}), st = o ? JSON.stringify(o) : void 0, D = Ut(() => o, [st]);
  ie(() => {
    m(a);
  }, [a, m]), ie(() => {
    _({ constructionId: e, contractId: i });
  }, [e, i, _]);
  const E = Bt(async () => {
    if (!(!b || !i))
      try {
        const U = await b.getContractFileList({ contractId: i }), W = (U == null ? void 0 : U.contractFiles) ?? [];
        r(W, D);
      } catch (U) {
        console.warn("[Viewer] getContractFileList threw:", U), r([], D);
      }
  }, [b, i, D, r]);
  ie(() => {
    b && i && E();
  }, [b, i, E]);
  const Z = Ut(() => ({
    fov: 40,
    position: new Lt(1, 2, 1).multiplyScalar(100),
    up: new Lt(0, 0, 1),
    near: 0.1,
    far: 1e3 * 5
  }), []);
  ie(() => {
    if (w === void 0) return;
    const U = t.filter((W) => W.visible).map((W) => {
      const V = W.file.id;
      return V === void 0 ? Promise.resolve(void 0) : b == null ? void 0 : b.getContractFileMetadata({ ...w, contractFileId: V }).then((ft) => {
        const q = ft, { min: Y, max: Q } = q.bounds, ct = new xe(new Lt().fromArray(Y), new Lt().fromArray(Q));
        return { file: W.file, meta: q, boundingBox: ct };
      }).catch((ft) => {
        console.error(ft);
      });
    });
    Promise.all(U).then((W) => {
      j(W.filter((V) => V !== void 0));
    });
  }, [t, w, b]);
  const nt = Bt((U) => {
    const W = C.find((ft) => ft.file.id === U.id);
    if (!W) return;
    const V = W.boundingBox.getCenter(new Lt());
    k(V.negate());
  }, [C, k]), ut = Bt((U) => {
    console.log(U);
  }, []), Et = Bt(() => {
    E();
  }, [E]), it = Bt((U, W, V) => {
    if (!U) return;
    const ft = tr(W, 0, 5), q = tr(V, 0, 100) / 100;
    U.traverse((Y) => {
      var ct, bt;
      const Q = Y.material;
      Q && (typeof Q.size == "number" && (Q.size = ft, Q.needsUpdate = !0), Q.uniforms && (((ct = Q.uniforms.pointSize) == null ? void 0 : ct.value) !== void 0 && (Q.uniforms.pointSize.value = ft), ((bt = Q.uniforms.opacity) == null ? void 0 : bt.value) !== void 0 && (Q.uniforms.opacity.value = q)), typeof Q.opacity == "number" && (Q.opacity = q, q < 1 && Q.transparent !== !0 && (Q.transparent = !0), Q.needsUpdate = !0));
    });
  }, []);
  return ie(() => {
    it(O.current, v.pointSize, v.opacity);
  }, [v, it]), ie(() => {
    const U = (W) => {
      var ft, q, Y, Q, ct, bt;
      if (!(W != null && W.data) || W.data.channel !== Qa) return;
      const V = W.data.cmd;
      if (V.type === "SET_TRANSFORM") {
        const { fileId: gt, translation: z, rotation: X } = V.payload;
        G((ot) => ({
          ...ot,
          [gt]: {
            translation: z,
            rotation: X
          }
        }));
      } else if (V.type === "SET_APPEARANCE") {
        const gt = V.payload.upAxis, z = V.payload.coordinateSystem, X = tr(V.payload.pointSize ?? v.pointSize, 0, 5), ot = tr(V.payload.opacity ?? v.opacity, 0, 100), vt = V.payload.fileId;
        if (vt !== void 0 ? J((wt) => {
          var B;
          return {
            ...wt,
            [vt]: {
              pointSize: X,
              opacity: ot,
              coordinateSystem: z ?? ((B = wt[vt]) == null ? void 0 : B.coordinateSystem)
            }
          };
        }) : N({ pointSize: X, opacity: ot }), gt) {
          const wt = I.current;
          wt && (gt === "Y" ? wt.up.set(0, 1, 0) : wt.up.set(0, 0, 1), (ft = wt.updateProjectionMatrix) == null || ft.call(wt)), (Y = (q = P.current) == null ? void 0 : q.update) == null || Y.call(q);
        }
      } else if (V.type === "RESET") {
        const gt = O.current;
        gt && (gt.position.set(0, 0, 0), gt.rotation.set(0, 0, 0, "XYZ")), N({ pointSize: 2, opacity: 100 }), J({}), G({});
        const z = I.current;
        z && (z.up.set(0, 0, 1), (Q = z.updateProjectionMatrix) == null || Q.call(z)), (bt = (ct = P.current) == null ? void 0 : ct.update) == null || bt.call(ct);
      }
    };
    return window.addEventListener("message", U), () => window.removeEventListener("message", U);
  }, [v.pointSize, v.opacity]), /* @__PURE__ */ Gt(fe, { width: 1, height: 1, display: "flex", children: [
    f && /* @__PURE__ */ yt(Ya, { contractId: i, onUploaded: Et }),
    /* @__PURE__ */ Gt(fe, { width: 1, height: 1, flex: 1, position: "relative", overflow: "hidden", children: [
      /* @__PURE__ */ Gt(_i, { camera: Z, ...u == null ? void 0 : u.canvas, children: [
        /* @__PURE__ */ yt("perspectiveCamera", { ref: I }),
        (u == null ? void 0 : u.map) !== !1 && /* @__PURE__ */ yt(di, { ref: P, makeDefault: !0, screenSpacePanning: !0 }),
        (u == null ? void 0 : u.light) !== !1 && /* @__PURE__ */ yt("ambientLight", { intensity: 0.5 }),
        (u == null ? void 0 : u.grid) !== !1 && /* @__PURE__ */ yt(
          pi,
          {
            args: [10, 10],
            quaternion: new cn().setFromAxisAngle(new Lt(1, 0, 0), Math.PI / 2),
            infiniteGrid: !0,
            followCamera: !0,
            fadeDistance: 1e3,
            cellSize: 10,
            sectionSize: 50,
            sectionColor: new fn("#6f6f6f"),
            side: ti
          }
        ),
        (u == null ? void 0 : u.gizmo) !== !1 && /* @__PURE__ */ yt(bi, { alignment: "top-right", margin: [80, 80], children: /* @__PURE__ */ yt(yi, { axisColors: ["#9d4b4b", "#2f7f4f", "#3b5b9d"], labelColor: "white" }) }),
        /* @__PURE__ */ Gt("group", { ref: O, children: [
          C.map((U) => {
            const W = U.file.id, V = W !== void 0 ? T[W] : void 0, ft = W !== void 0 ? $[W] : void 0;
            return /* @__PURE__ */ yt(
              Za,
              {
                file: U.file,
                meta: U.meta,
                referencePoint: S,
                selected: W === s,
                translation: (V == null ? void 0 : V.translation) ?? { x: 0, y: 0, z: 0 },
                rotation: (V == null ? void 0 : V.rotation) ?? { x: 0, y: 0, z: 0 },
                inspectorPointSize: ft == null ? void 0 : ft.pointSize,
                inspectorOpacity: ft == null ? void 0 : ft.opacity,
                inspectorCoordinateSystem: ft == null ? void 0 : ft.coordinateSystem
              },
              W
            );
          }),
          /* @__PURE__ */ yt("group", { position: S, children: p }),
          /* @__PURE__ */ yt("group", { children: h }),
          g && /* @__PURE__ */ yt(es, { views: C, referencePoint: S, onContractFileClick: g })
        ] })
      ] }),
      /* @__PURE__ */ yt(
        fe,
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
          children: /* @__PURE__ */ yt(Xa, { point: S })
        }
      )
    ] }),
    d && /* @__PURE__ */ yt(Ja, { onFileFocus: nt, onFileDelete: ut })
  ] });
}, Ls = (n) => /* @__PURE__ */ yt(ze.Provider, { children: /* @__PURE__ */ yt(Oi, { children: /* @__PURE__ */ yt(Ii, { children: /* @__PURE__ */ yt(Ci, { children: /* @__PURE__ */ yt(rs, { ...n }) }) }) }) }), Ps = {
  RightHandedXUp: "RIGHT_HANDED_X_UP",
  LeftHandedXUp: "LEFT_HANDED_X_UP",
  RightHandedYUp: "RIGHT_HANDED_Y_UP",
  LeftHandedYUp: "LEFT_HANDED_Y_UP",
  RightHandedZUp: "RIGHT_HANDED_Z_UP",
  LeftHandedZUp: "LEFT_HANDED_Z_UP"
}, Yn = "RCDE_VIEWER_CMD";
function Er(n) {
  typeof window > "u" || window.postMessage({ channel: Yn, cmd: n }, "*");
}
const Rs = {
  setTransform(n) {
    Er({ type: "SET_TRANSFORM", payload: n });
  },
  setAppearance(n) {
    Er({ type: "SET_APPEARANCE", payload: n });
  },
  reset() {
    Er({ type: "RESET" });
  },
  addListener(n) {
    if (typeof window > "u") return () => {
    };
    const r = (t) => {
      !(t != null && t.data) || t.data.channel !== Yn || n(t.data.cmd);
    };
    return window.addEventListener("message", r), () => window.removeEventListener("message", r);
  }
}, Xn = We({
  points: [],
  setPoints: () => {
  },
  isActive: !1,
  setIsActive: () => {
  }
}), Os = ({ children: n }) => {
  const [r, t] = zt([]), [a, e] = zt(!1);
  return /* @__PURE__ */ yt(
    Xn.Provider,
    {
      value: {
        points: r,
        setPoints: t,
        isActive: a,
        setIsActive: e
      },
      children: n
    }
  );
}, Is = () => {
  const n = qe(Xn);
  if (!n)
    throw new Error("useMeasurement must be used within a MeasurementProvider");
  return n;
};
class je {
  constructor(r, t, a, e, i) {
    this.x = r, this.y = t, this.w = a, this.h = e, this.data = i;
  }
  contains(r) {
    return r.x >= this.x && r.x <= this.x + this.w && r.y >= this.y && r.y <= this.y + this.h;
  }
  intersects(r) {
    return !(r.x > this.x + this.w || r.x + r.w < this.x || r.y > this.y + this.h || r.y + r.h < this.y);
  }
}
class ns {
  constructor(r, t, a, e) {
    this.x = r, this.y = t, this.r = a, this.rPow2 = this.r * this.r, this.data = e;
  }
  euclideanDistancePow2(r, t) {
    return Math.pow(r.x - t.x, 2) + Math.pow(r.y - t.y, 2);
  }
  contains(r) {
    return this.euclideanDistancePow2(r, this) <= this.rPow2;
  }
  intersects(r) {
    const t = this.x - Math.max(r.x, Math.min(this.x, r.x + r.w)), a = this.y - Math.max(r.y, Math.min(this.y, r.y + r.h));
    return t * t + a * a <= this.rPow2;
  }
}
class is {
  constructor(r, t, a) {
    this.x = r, this.y = t, this.data = a;
  }
}
const os = { capacity: 4, removeEmptyNodes: !1, maximumDepth: -1, arePointsEqual: (n, r) => n.x === r.x && n.y === r.y };
class Oe {
  constructor(r, t, a = []) {
    this.container = r, this.config = Object.assign({}, os, t), this.isDivided = !1, this.points = [];
    for (const e of a) this.insertRecursive(e);
  }
  getTree() {
    let r;
    return r = this.isDivided ? { ne: this.ne.getTree(), nw: this.nw.getTree(), se: this.se.getTree(), sw: this.sw.getTree() } : this.getNodePointAmount(), r;
  }
  getAllPoints() {
    const r = [];
    return this.getAllPointsRecursive(r), r;
  }
  getAllPointsRecursive(r) {
    this.isDivided ? (this.ne.getAllPointsRecursive(r), this.nw.getAllPointsRecursive(r), this.se.getAllPointsRecursive(r), this.sw.getAllPointsRecursive(r)) : Array.prototype.push.apply(r, this.points.slice());
  }
  getNodePointAmount() {
    return this.points.length;
  }
  divide() {
    const r = this.config.maximumDepth === -1 ? -1 : this.config.maximumDepth - 1, t = Object.assign({}, this.config, { maximumDepth: r });
    this.isDivided = !0;
    const a = this.container.x, e = this.container.y, i = this.container.w / 2, o = this.container.h / 2;
    this.ne = new Oe(new je(a + i, e, i, o), t), this.nw = new Oe(new je(a, e, i, o), t), this.se = new Oe(new je(a + i, e + o, i, o), t), this.sw = new Oe(new je(a, e + o, i, o), t), this.insert(this.points.slice()), this.points.length = 0, this.points = [];
  }
  remove(r) {
    if (Array.isArray(r)) for (const t of r) this.removeRecursive(t);
    else this.removeRecursive(r);
  }
  removeRecursive(r) {
    if (this.container.contains(r)) if (this.isDivided) this.ne.removeRecursive(r), this.nw.removeRecursive(r), this.se.removeRecursive(r), this.sw.removeRecursive(r), this.config.removeEmptyNodes && (this.ne.getNodePointAmount() !== 0 || this.ne.isDivided || this.nw.getNodePointAmount() !== 0 || this.nw.isDivided || this.se.getNodePointAmount() !== 0 || this.se.isDivided || this.sw.getNodePointAmount() !== 0 || this.sw.isDivided || (this.isDivided = !1, delete this.ne, delete this.nw, delete this.se, delete this.sw));
    else
      for (let t = this.points.length - 1; t >= 0; t--) this.config.arePointsEqual(r, this.points[t]) && this.points.splice(t, 1);
  }
  insert(r) {
    if (Array.isArray(r)) {
      let t = !0;
      for (const a of r) t = t && this.insertRecursive(a);
      return t;
    }
    return this.insertRecursive(r);
  }
  insertRecursive(r) {
    if (!this.container.contains(r)) return !1;
    if (!this.isDivided) {
      if (this.getNodePointAmount() < this.config.capacity || this.config.maximumDepth === 0) return this.points.push(r), !0;
      (this.config.maximumDepth === -1 || this.config.maximumDepth > 0) && this.divide();
    }
    return !!this.isDivided && (this.ne.insertRecursive(r) || this.nw.insertRecursive(r) || this.se.insertRecursive(r) || this.sw.insertRecursive(r));
  }
  query(r) {
    const t = [];
    return this.queryRecursive(r, t), t;
  }
  queryRecursive(r, t) {
    if (r.intersects(this.container)) if (this.isDivided) this.ne.queryRecursive(r, t), this.nw.queryRecursive(r, t), this.se.queryRecursive(r, t), this.sw.queryRecursive(r, t);
    else {
      const a = this.points.filter(((e) => r.contains(e)));
      Array.prototype.push.apply(t, a);
    }
  }
  clear() {
    this.points = [], this.isDivided = !1, delete this.ne, delete this.nw, delete this.se, delete this.sw;
  }
}
const an = (n) => {
  const { points: r, camera: t } = n, a = new Oe(new je(-1, -1, 2, 2)), e = /* @__PURE__ */ new Map(), i = 1e4;
  return r.forEach((o, u) => {
    const h = o.clone().project(t), p = Math.round(h.x * i) / i, f = Math.round(h.y * i) / i;
    if (p < -1 || p > 1 || f < -1 || f > 1)
      return;
    const d = `${p},${f}`;
    if (!e.has(d)) {
      const s = new is(p, f, { id: u });
      e.set(d, s), a.insert(s);
    }
  }), {
    tree: a
  };
}, as = (n, r, t) => {
  const a = r.query(new ns(n.x, n.y, 0.05));
  if (a.length > 0) {
    const e = ss(n, a), { id: i } = e.data;
    return t[i].clone();
  }
}, ss = (n, r) => {
  const t = r.map((e) => {
    const i = n.x - e.x, o = n.y - e.y;
    return i * i + o * o;
  }), a = Math.min(...t);
  return r[t.indexOf(a)];
}, ls = (n) => {
  const { canvas: r } = n;
  return Bt(
    (t) => {
      const a = new Fe(t.clientX, t.clientY), { x: e, y: i, width: o, height: u } = r.getBoundingClientRect();
      return a.sub(new Fe(e, i)), new Fe(
        a.x / o * 2 - 1,
        -(a.y / u) * 2 + 1
      );
    },
    [r]
  );
}, fs = 180 / Math.PI, cs = (n, r, t) => {
  const { width: a, height: e } = n.getBoundingClientRect(), i = t.clone().project(r);
  return new Lt((i.x + 1) / 2 * a, -(i.y - 1) / 2 * e, 0);
}, us = ({
  points: n,
  referencePoint: r,
  edit: t
}) => {
  const { camera: a } = Or(), [e, i] = zt(null), [o, u] = zt([]), [h, p] = zt([]), f = se(new un()), d = se(0), s = se(""), g = Ut(() => n !== void 0 ? n : [], [n]), m = Ut(() => r !== void 0 ? r : new Lt(), [r]), b = Bt(
    (w) => {
      const _ = g.map((C) => C.clone().add(m));
      if (e === null || _.length < 1) return [];
      const S = _.map((C) => cs(e, w, C));
      t && u(S);
      const k = Array.from(Array(S.length - 1).keys()).map(
        (C) => {
          const j = _[C], O = _[C + 1], I = j.distanceTo(O);
          return {
            from: S[C],
            to: S[C + 1],
            length: I
          };
        }
      );
      p(k);
    },
    [e, t, m, g]
  );
  return ie(() => {
    e !== null && g.length > 0 && b(a);
  }, [g, e, a, b]), Rr(({ camera: w }) => {
    const _ = d.current !== g.length, S = g.map((C) => `${C.x.toFixed(3)},${C.y.toFixed(3)},${C.z.toFixed(3)}`).join("|"), k = s.current !== S;
    (!f.current.equals(w.matrixWorld) || _ || k) && e !== null && (f.current.copy(w.matrixWorld), d.current = g.length, s.current = S, b(w));
  }), /* @__PURE__ */ Gt(
    gi,
    {
      as: "div",
      ref: i,
      fullscreen: !0,
      style: {
        pointerEvents: "none",
        userSelect: "none"
      },
      zIndexRange: [0, 100],
      children: [
        o.map((w, _) => /* @__PURE__ */ yt(
          hs,
          {
            position: w,
            color: "white"
          },
          `metrics-point-${_}`
        )),
        h.map((w, _) => /* @__PURE__ */ yt(ds, { ...w }, `metrics-line-${_}`))
      ]
    }
  );
}, hs = ({ position: n, color: r }) => /* @__PURE__ */ yt(
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
    children: /* @__PURE__ */ yt("svg", { width: "100%", height: "100%", children: /* @__PURE__ */ yt(
      "circle",
      {
        cx: n.x,
        cy: n.y,
        r: 5,
        fill: r,
        stroke: "black"
      }
    ) })
  }
), ds = ({ from: n, to: r, length: t }) => {
  const a = Ut(() => {
    const e = r.clone().sub(n), i = e.length(), o = new Lt(e.y, -e.x, 0), u = new Lt(), h = e.clone().normalize(), p = Math.PI * 0.15, f = Math.min(i * 0.25, 10), d = 15, g = Math.min(
      1,
      (i - d) / (40 - d)
    ), m = h.clone().applyAxisAngle(new Lt(0, 0, 1), p).setLength(f), b = h.clone().applyAxisAngle(new Lt(0, 0, 1), -p).setLength(f), w = r.clone().add(u), _ = w.clone().add(m.clone().negate()), S = w.clone().add(b.clone().negate()), k = n.clone().add(u), C = k.clone().add(m), j = k.clone().add(b), O = o.clone().setLength(10), I = n.clone().add(r).multiplyScalar(0.5).add(O), v = new Fe(h.x, h.y).negate().angle() * fs;
    return {
      head: w,
      tail: k,
      headLeft: _,
      headRight: S,
      tailLeft: C,
      tailRight: j,
      opacity: g,
      angle: v,
      labelPosition: I
    };
  }, [n, r, t]);
  return /* @__PURE__ */ Gt(
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
        /* @__PURE__ */ yt("svg", { width: "100%", height: "100%", children: /* @__PURE__ */ Gt(
          "g",
          {
            style: {
              stroke: "black",
              strokeWidth: 2
            },
            children: [
              /* @__PURE__ */ yt(
                "line",
                {
                  x1: a.head.x,
                  y1: a.head.y,
                  x2: a.tail.x,
                  y2: a.tail.y
                }
              ),
              /* @__PURE__ */ yt(
                "line",
                {
                  x1: a.head.x,
                  y1: a.head.y,
                  x2: a.headLeft.x,
                  y2: a.headLeft.y
                }
              ),
              /* @__PURE__ */ yt(
                "line",
                {
                  x1: a.head.x,
                  y1: a.head.y,
                  x2: a.headRight.x,
                  y2: a.headRight.y
                }
              ),
              /* @__PURE__ */ yt(
                "line",
                {
                  x1: a.tail.x,
                  y1: a.tail.y,
                  x2: a.tailLeft.x,
                  y2: a.tailLeft.y
                }
              ),
              /* @__PURE__ */ yt(
                "line",
                {
                  x1: a.tail.x,
                  y1: a.tail.y,
                  x2: a.tailRight.x,
                  y2: a.tailRight.y
                }
              )
            ]
          }
        ) }),
        /* @__PURE__ */ Gt(
          "span",
          {
            style: {
              position: "absolute",
              left: `${a.labelPosition.x}px`,
              top: `${a.labelPosition.y}px`,
              transform: `translate(-50%, -50%) rotate(${a.angle}deg)`,
              color: "black",
              fontSize: "14px",
              fontWeight: "bold"
            },
            children: [
              t.toFixed(2),
              "m"
            ]
          }
        )
      ]
    }
  );
}, sn = (n, r = 10) => {
  const t = [];
  return n.traverse((a) => {
    if (a instanceof ri || a.type === "Points" || a.type === "points") {
      const i = a.geometry.getAttribute("position");
      if (i)
        for (let o = 0; o < i.count; o += r) {
          const u = new Lt(
            i.getX(o),
            i.getY(o),
            i.getZ(o)
          );
          u.applyMatrix4(a.matrixWorld), t.push(u);
        }
    }
  }), t;
}, Cs = ({ onChange: n, externalAppEditedPoints: r }) => {
  const t = se(null), [a, e] = zt(null), [i, o] = zt([]);
  Cr();
  const u = se(null), h = se([]), p = se(new un()), { camera: f, gl: d, scene: s } = Or(), g = d.domElement, m = ls({ canvas: g }), b = Ut(() => r && r.length > 0 ? r : a !== null ? [...i, a] : [...i], [r, i, a]);
  Rr(() => {
    if (!p.current.equals(f.matrixWorld)) {
      p.current.copy(f.matrixWorld);
      const _ = sn(s);
      if (_.length > 0) {
        h.current = _;
        const S = an({ camera: f, points: _ });
        u.current = S.tree;
      }
    }
  }), ie(() => {
    const _ = setTimeout(() => {
      const S = sn(s);
      if (S.length > 0) {
        h.current = S;
        const k = an({ camera: f, points: S });
        u.current = k.tree;
      }
    }, 500);
    return () => clearTimeout(_);
  }, [f, s]);
  const w = Bt(
    (_) => !u.current || h.current.length === 0 ? void 0 : as(_, u.current, h.current),
    []
  );
  return ie(() => {
    const _ = (O) => {
      O.stopPropagation();
      const I = t.current;
      if (I !== null) {
        const P = [...i, I];
        o(P), n == null || n(P), t.current = null, P.length >= 2 && setTimeout(() => {
          o([]);
        }, 2e3);
      }
    }, S = (O) => {
      const I = m(O), P = w({ x: I.x, y: I.y });
      P !== void 0 && (t.current = P, e(P));
    }, k = (O) => {
      O.key === "Escape" && (o([]), e(null), t.current = null);
    }, C = (O) => {
      O.preventDefault(), O.stopPropagation(), o([]), e(null), t.current = null;
    }, j = (O) => {
      O.stopPropagation(), O.stopImmediatePropagation();
    };
    return g.addEventListener("mousedown", _, { capture: !0 }), g.addEventListener("click", j, { capture: !0 }), g.addEventListener("mousemove", S), window.addEventListener("keydown", k), g.addEventListener("contextmenu", C, { capture: !0 }), () => {
      g.removeEventListener("mousedown", _, { capture: !0 }), g.removeEventListener("click", j, { capture: !0 }), g.removeEventListener("mousemove", S), window.removeEventListener("keydown", k), g.removeEventListener("contextmenu", C, { capture: !0 });
    };
  }, [g, m, w, i, o, n]), /* @__PURE__ */ yt(
    us,
    {
      edit: !0,
      points: b
    }
  );
}, Ms = ({
  length: n = 10,
  width: r = 0.2,
  visible: t = !0,
  point: a
}) => {
  const e = Ut(() => a ? a instanceof Lt ? a : new Lt(a.x, a.y, a.z) : null, [a]), i = Ut(
    () => [
      { direction: new Lt(1, 0, 0), color: "#ff0000", label: "X" },
      // Red for X
      { direction: new Lt(0, 1, 0), color: "#00ff00", label: "Y" },
      // Green for Y
      { direction: new Lt(0, 0, 1), color: "#0000ff", label: "Z" }
      // Blue for Z
    ],
    []
  );
  return !t || !e ? null : /* @__PURE__ */ yt("group", { position: e, children: i.map((o) => /* @__PURE__ */ yt(
    "arrowHelper",
    {
      args: [o.direction, new Lt(0, 0, 0), n, o.color, n * 0.2, r]
    },
    o.label
  )) });
}, $n = We({
  clippingPlanes: [],
  setClippingPlanes: () => {
  }
}), Ts = ({ children: n }) => {
  const [r, t] = zt([]);
  return /* @__PURE__ */ yt(
    $n.Provider,
    {
      value: {
        clippingPlanes: r,
        setClippingPlanes: t
      },
      children: n
    }
  );
}, ps = () => {
  const n = qe($n);
  if (!n)
    throw new Error("useClippingPlanes must be used within a ClippingPlanesProvider");
  return n;
}, Ns = () => {
  const [n, r] = zt(
    new qr().setFromNormalAndCoplanarPoint(
      new Lt(0, 0, -1),
      new Lt()
    )
  ), { setClippingPlanes: t } = ps();
  ie(() => (t([n]), () => {
    t([]);
  }), [n, t]);
  const a = Bt((e) => {
    const i = new Lt(), o = new cn();
    e.decompose(i, o, new Lt());
    const u = new Lt(0, 0, -1);
    u.applyQuaternion(o).normalize();
    const h = new qr().setFromNormalAndCoplanarPoint(u, i);
    r(h);
  }, []);
  return /* @__PURE__ */ yt(mi, { scale: 50, fixed: !0, disableScaling: !0, onDrag: a, children: /* @__PURE__ */ yt(bs, { size: 100 }) });
}, bs = ({ size: n, color: r = "yellow", opacity: t = 0.85 }) => {
  const a = Ut(() => {
    const o = [
      new Lt(-n / 2, -n / 2, 0),
      new Lt(n / 2, -n / 2, 0),
      new Lt(n / 2, n / 2, 0),
      new Lt(-n / 2, n / 2, 0)
    ];
    return [...o, o[0]];
  }, [n]), e = Ut(() => [
    new Lt(-n / 2, -n / 2, 0),
    new Lt(n / 2, n / 2, 0)
  ], [n]), i = Ut(() => [
    new Lt(n / 2, -n / 2, 0),
    new Lt(-n / 2, n / 2, 0)
  ], [n]);
  return /* @__PURE__ */ Gt("group", { children: [
    /* @__PURE__ */ yt(cr, { points: a, color: r, transparent: !0, opacity: t }),
    /* @__PURE__ */ yt(cr, { points: e, color: r, transparent: !0, opacity: t }),
    /* @__PURE__ */ yt(cr, { points: i, color: r, transparent: !0, opacity: t })
  ] });
};
export {
  Oi as ClientProvider,
  $n as ClippingPlanesContext,
  Ts as ClippingPlanesProvider,
  Za as ContractFileView,
  Ii as ContractFilesProvider,
  Ps as CoordinateSystem,
  Ns as CrossSectionHandler,
  bs as CrossSectionPlane,
  ze as GlobalStateContext,
  Xn as MeasurementContext,
  Cs as MeasurementHandler,
  Os as MeasurementProvider,
  us as MeasurementView,
  Ls as RCDE,
  Ri as RCDEClient,
  Ms as ReferencePointAxis,
  Ci as ReferencePointProvider,
  rs as Viewer,
  Rs as ViewerBridge,
  Ge as useClient,
  ps as useClippingPlanes,
  Ir as useContractFiles,
  Is as useMeasurement,
  Cr as useReferencePoint
};
