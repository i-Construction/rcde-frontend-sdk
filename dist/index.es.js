"use client";
var ii = Object.defineProperty;
var oi = (n, r, t) => r in n ? ii(n, r, { enumerable: !0, configurable: !0, writable: !0, value: t }) : n[r] = t;
var ze = (n, r, t) => oi(n, typeof r != "symbol" ? r + "" : r, t);
import { jsx as _t, jsxs as ee, Fragment as ai } from "react/jsx-runtime";
import yn, { useState as Xt, useCallback as Ht, useContext as $e, createContext as Ye, useMemo as Yt, useRef as he, useEffect as ue } from "react";
import { Vector3 as Lt, Box3 as Oe, Color as bn, Euler as si, DoubleSide as li, Quaternion as gn, Raycaster as fi, Vector2 as We, Matrix4 as mn, Points as ci, Plane as $r } from "three";
import { createActorContext as ui } from "@xstate/react";
import { createMachine as hi } from "xstate";
import { Modal as di, Box as de, FormControl as Cr, FormLabel as _n, TextField as or, Typography as Ge, Button as ar, FormHelperText as pi, MenuList as Tr, MenuItem as wn, ListItemIcon as yi, ListItemText as bi, ListItem as Pr, Tooltip as hr, IconButton as dr, Menu as gi, List as mi } from "@mui/material";
import { Box as _i, Points as wi, MapControls as vi, Grid as Ei, GizmoHelper as Si, GizmoViewport as Ai, Html as ki, PivotControls as xi, Line as pr } from "@react-three/drei";
import { useFrame as Mr, Canvas as Pi, useThree as Dr } from "@react-three/fiber";
import { PNG as Yr } from "pngjs/browser";
import { Add as Ri, InsertDriveFile as Oi, Adjust as Li, Visibility as Ii, VisibilityOff as Ci, CenterFocusStrong as Ti, MoreHoriz as Mi, Save as Di, Close as ji } from "@mui/icons-material";
class Bi {
  constructor(r = {}) {
    ze(this, "baseUrl");
    ze(this, "token");
    ze(this, "authType");
    ze(this, "fetchImpl");
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
const vn = Ye(void 0), Fi = ({ children: n }) => {
  const [r, t] = Xt(), [a, e] = Xt(), i = Ht(
    (o) => {
      const u = new Bi({
        accessToken: o.token,
        baseUrl: o.baseUrl,
        authType: o.authType
      });
      t(u);
    },
    []
  );
  return /* @__PURE__ */ _t(vn.Provider, { value: { client: r, initialize: i, project: a, setProject: e }, children: n });
}, Xe = () => {
  const n = $e(vn);
  if (!n)
    throw new Error("useClient must be used within a ClientProvider");
  return n;
}, En = Ye(void 0), Ni = ({
  children: n
}) => {
  const [r, t] = Xt([]), a = Ht((i, o) => {
    t(
      i.map((u) => ({
        file: u,
        visible: o === void 0 ? !0 : u.id !== void 0 && o.includes(u.id)
      }))
    );
  }, []), e = Ht((i) => {
    t(
      (o) => o.map(
        (u) => u.file.id === i.file.id ? {
          ...u,
          visible: !u.visible
        } : u
      )
    );
  }, []);
  return /* @__PURE__ */ _t(
    En.Provider,
    {
      value: { load: a, toggleVisibility: e, containers: r },
      children: n
    }
  );
}, jr = () => {
  const n = $e(En);
  if (!n)
    throw new Error(
      "useContractFiles must be used within a ContractFilesProvider"
    );
  return n;
}, Sn = Ye(void 0), Ui = ({ children: n }) => {
  const [r, t] = Xt(new Lt(0, 0, 0)), { client: a, project: e } = Xe(), { containers: i } = jr(), o = Ht((p) => {
    t(p);
  }, [t]), u = Ht((p) => {
    t(p);
  }, [t]), h = Ht(async (p) => {
    if (!(!a || !e || !i.find((d) => d.file.id === p)))
      try {
        const s = await a.getContractFileMetadata({
          ...e,
          contractFileId: p
        }), { min: g, max: m } = s.bounds, w = new Oe(
          new Lt().fromArray(g),
          new Lt().fromArray(m)
        ).getCenter(new Lt());
        o(w.negate());
      } catch (d) {
        console.error("[useReferencePoint] Failed to focus file:", d);
      }
  }, [a, e, i, o]);
  return /* @__PURE__ */ _t(Sn.Provider, { value: { point: r, change: o, save: u, focusFileById: h }, children: n });
}, Br = () => {
  const n = $e(Sn);
  if (!n)
    throw new Error("useReferencePoint must be used within a ReferencePointProvider");
  return n;
}, zi = hi(
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
), He = ui(zi), { min: Zi, max: qi } = Math, Le = (n, r = 0, t = 1) => Zi(qi(r, n), t), Fr = (n) => {
  n._clipped = !1, n._unclipped = n.slice(0);
  for (let r = 0; r <= 3; r++)
    r < 3 ? ((n[r] < 0 || n[r] > 255) && (n._clipped = !0), n[r] = Le(n[r], 0, 255)) : r === 3 && (n[r] = Le(n[r], 0, 1));
  return n;
}, An = {};
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
  An[`[object ${n}]`] = n.toLowerCase();
function qt(n) {
  return An[Object.prototype.toString.call(n)] || "object";
}
const Ft = (n, r = null) => n.length >= 3 ? Array.prototype.slice.call(n) : qt(n[0]) == "object" && r ? r.split("").filter((t) => n[0][t] !== void 0).map((t) => n[0][t]) : n[0].slice(0), Be = (n) => {
  if (n.length < 2) return null;
  const r = n.length - 1;
  return qt(n[r]) == "string" ? n[r].toLowerCase() : null;
}, { PI: cr, min: kn, max: xn } = Math, pe = (n) => Math.round(n * 100) / 100, Rr = (n) => Math.round(n * 100) / 100, Ae = cr * 2, yr = cr / 3, Wi = cr / 180, Gi = 180 / cr;
function Pn(n) {
  return [...n.slice(0, 3).reverse(), ...n.slice(3)];
}
const Bt = {
  format: {},
  autodetect: []
};
class vt {
  constructor(...r) {
    const t = this;
    if (qt(r[0]) === "object" && r[0].constructor && r[0].constructor === this.constructor)
      return r[0];
    let a = Be(r), e = !1;
    if (!a) {
      e = !0, Bt.sorted || (Bt.autodetect = Bt.autodetect.sort((i, o) => o.p - i.p), Bt.sorted = !0);
      for (let i of Bt.autodetect)
        if (a = i.test(...r), a) break;
    }
    if (Bt.format[a]) {
      const i = Bt.format[a].apply(
        null,
        e ? r : r.slice(0, -1)
      );
      t._rgb = Fr(i);
    } else
      throw new Error("unknown format: " + r);
    t._rgb.length === 3 && t._rgb.push(1);
  }
  toString() {
    return qt(this.hex) == "function" ? this.hex() : `[${this._rgb.join(",")}]`;
  }
}
const Hi = "3.2.0", Gt = (...n) => new vt(...n);
Gt.version = Hi;
const De = {
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
}, Vi = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, $i = /^#?([A-Fa-f0-9]{8}|[A-Fa-f0-9]{4})$/, Rn = (n) => {
  if (n.match(Vi)) {
    (n.length === 4 || n.length === 7) && (n = n.substr(1)), n.length === 3 && (n = n.split(""), n = n[0] + n[0] + n[1] + n[1] + n[2] + n[2]);
    const r = parseInt(n, 16), t = r >> 16, a = r >> 8 & 255, e = r & 255;
    return [t, a, e, 1];
  }
  if (n.match($i)) {
    (n.length === 5 || n.length === 9) && (n = n.substr(1)), n.length === 4 && (n = n.split(""), n = n[0] + n[0] + n[1] + n[1] + n[2] + n[2] + n[3] + n[3]);
    const r = parseInt(n, 16), t = r >> 24 & 255, a = r >> 16 & 255, e = r >> 8 & 255, i = Math.round((r & 255) / 255 * 100) / 100;
    return [t, a, e, i];
  }
  throw new Error(`unknown hex color: ${n}`);
}, { round: Ke } = Math, On = (...n) => {
  let [r, t, a, e] = Ft(n, "rgba"), i = Be(n) || "auto";
  e === void 0 && (e = 1), i === "auto" && (i = e < 1 ? "rgba" : "rgb"), r = Ke(r), t = Ke(t), a = Ke(a);
  let u = "000000" + (r << 16 | t << 8 | a).toString(16);
  u = u.substr(u.length - 6);
  let h = "0" + Ke(e * 255).toString(16);
  switch (h = h.substr(h.length - 2), i.toLowerCase()) {
    case "rgba":
      return `#${u}${h}`;
    case "argb":
      return `#${h}${u}`;
    default:
      return `#${u}`;
  }
};
vt.prototype.name = function() {
  const n = On(this._rgb, "rgb");
  for (let r of Object.keys(De))
    if (De[r] === n) return r.toLowerCase();
  return n;
};
Bt.format.named = (n) => {
  if (n = n.toLowerCase(), De[n]) return Rn(De[n]);
  throw new Error("unknown color name: " + n);
};
Bt.autodetect.push({
  p: 5,
  test: (n, ...r) => {
    if (!r.length && qt(n) === "string" && De[n.toLowerCase()])
      return "named";
  }
});
vt.prototype.alpha = function(n, r = !1) {
  return n !== void 0 && qt(n) === "number" ? r ? (this._rgb[3] = n, this) : new vt([this._rgb[0], this._rgb[1], this._rgb[2], n], "rgb") : this._rgb[3];
};
vt.prototype.clipped = function() {
  return this._rgb._clipped || !1;
};
const we = {
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
}, Yi = /* @__PURE__ */ new Map([
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
function ke(n) {
  const r = Yi.get(String(n).toLowerCase());
  if (!r)
    throw new Error("unknown Lab illuminant " + n);
  we.labWhitePoint = n, we.Xn = r[0], we.Zn = r[1];
}
function Ve() {
  return we.labWhitePoint;
}
const Nr = (...n) => {
  n = Ft(n, "lab");
  const [r, t, a] = n, [e, i, o] = Xi(r, t, a), [u, h, p] = Ln(e, i, o);
  return [u, h, p, n.length > 3 ? n[3] : 1];
}, Xi = (n, r, t) => {
  const { kE: a, kK: e, kKE: i, Xn: o, Yn: u, Zn: h } = we, p = (n + 16) / 116, f = 2e-3 * r + p, d = p - 5e-3 * t, s = f * f * f, g = d * d * d, m = s > a ? s : (116 * f - 16) / e, y = n > i ? Math.pow((n + 16) / 116, 3) : n / e, w = g > a ? g : (116 * d - 16) / e, _ = m * o, E = y * u, x = w * h;
  return [_, E, x];
}, br = (n) => {
  const r = Math.sign(n);
  return n = Math.abs(n), (n <= 31308e-7 ? n * 12.92 : 1.055 * Math.pow(n, 1 / 2.4) - 0.055) * r;
}, Ln = (n, r, t) => {
  const { MtxAdaptMa: a, MtxAdaptMaI: e, MtxXYZ2RGB: i, RefWhiteRGB: o, Xn: u, Yn: h, Zn: p } = we, f = u * a.m00 + h * a.m10 + p * a.m20, d = u * a.m01 + h * a.m11 + p * a.m21, s = u * a.m02 + h * a.m12 + p * a.m22, g = o.X * a.m00 + o.Y * a.m10 + o.Z * a.m20, m = o.X * a.m01 + o.Y * a.m11 + o.Z * a.m21, y = o.X * a.m02 + o.Y * a.m12 + o.Z * a.m22, w = (n * a.m00 + r * a.m10 + t * a.m20) * (g / f), _ = (n * a.m01 + r * a.m11 + t * a.m21) * (m / d), E = (n * a.m02 + r * a.m12 + t * a.m22) * (y / s), x = w * e.m00 + _ * e.m10 + E * e.m20, C = w * e.m01 + _ * e.m11 + E * e.m21, F = w * e.m02 + _ * e.m12 + E * e.m22, L = br(
    x * i.m00 + C * i.m10 + F * i.m20
  ), I = br(
    x * i.m01 + C * i.m11 + F * i.m21
  ), R = br(
    x * i.m02 + C * i.m12 + F * i.m22
  );
  return [L * 255, I * 255, R * 255];
}, Ur = (...n) => {
  const [r, t, a, ...e] = Ft(n, "rgb"), [i, o, u] = In(r, t, a), [h, p, f] = Ki(i, o, u);
  return [h, p, f, ...e.length > 0 && e[0] < 1 ? [e[0]] : []];
};
function Ki(n, r, t) {
  const { Xn: a, Yn: e, Zn: i, kE: o, kK: u } = we, h = n / a, p = r / e, f = t / i, d = h > o ? Math.pow(h, 1 / 3) : (u * h + 16) / 116, s = p > o ? Math.pow(p, 1 / 3) : (u * p + 16) / 116, g = f > o ? Math.pow(f, 1 / 3) : (u * f + 16) / 116;
  return [116 * s - 16, 500 * (d - s), 200 * (s - g)];
}
function gr(n) {
  const r = Math.sign(n);
  return n = Math.abs(n), (n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4)) * r;
}
const In = (n, r, t) => {
  n = gr(n / 255), r = gr(r / 255), t = gr(t / 255);
  const { MtxRGB2XYZ: a, MtxAdaptMa: e, MtxAdaptMaI: i, Xn: o, Yn: u, Zn: h, As: p, Bs: f, Cs: d } = we;
  let s = n * a.m00 + r * a.m10 + t * a.m20, g = n * a.m01 + r * a.m11 + t * a.m21, m = n * a.m02 + r * a.m12 + t * a.m22;
  const y = o * e.m00 + u * e.m10 + h * e.m20, w = o * e.m01 + u * e.m11 + h * e.m21, _ = o * e.m02 + u * e.m12 + h * e.m22;
  let E = s * e.m00 + g * e.m10 + m * e.m20, x = s * e.m01 + g * e.m11 + m * e.m21, C = s * e.m02 + g * e.m12 + m * e.m22;
  return E *= y / p, x *= w / f, C *= _ / d, s = E * i.m00 + x * i.m10 + C * i.m20, g = E * i.m01 + x * i.m11 + C * i.m21, m = E * i.m02 + x * i.m12 + C * i.m22, [s, g, m];
};
vt.prototype.lab = function() {
  return Ur(this._rgb);
};
const Ji = (...n) => new vt(...n, "lab");
Object.assign(Gt, { lab: Ji, getLabWhitePoint: Ve, setLabWhitePoint: ke });
Bt.format.lab = Nr;
Bt.autodetect.push({
  p: 2,
  test: (...n) => {
    if (n = Ft(n, "lab"), qt(n) === "array" && n.length === 3)
      return "lab";
  }
});
vt.prototype.darken = function(n = 1) {
  const r = this, t = r.lab();
  return t[0] -= we.Kn * n, new vt(t, "lab").alpha(r.alpha(), !0);
};
vt.prototype.brighten = function(n = 1) {
  return this.darken(-n);
};
vt.prototype.darker = vt.prototype.darken;
vt.prototype.brighter = vt.prototype.brighten;
vt.prototype.get = function(n) {
  const [r, t] = n.split("."), a = this[r]();
  if (t) {
    const e = r.indexOf(t) - (r.substr(0, 2) === "ok" ? 2 : 0);
    if (e > -1) return a[e];
    throw new Error(`unknown channel ${t} in mode ${r}`);
  } else
    return a;
};
const { pow: Qi } = Math, to = 1e-7, eo = 20;
vt.prototype.luminance = function(n, r = "rgb") {
  if (n !== void 0 && qt(n) === "number") {
    if (n === 0)
      return new vt([0, 0, 0, this._rgb[3]], "rgb");
    if (n === 1)
      return new vt([255, 255, 255, this._rgb[3]], "rgb");
    let t = this.luminance(), a = eo;
    const e = (o, u) => {
      const h = o.interpolate(u, 0.5, r), p = h.luminance();
      return Math.abs(n - p) < to || !a-- ? h : p > n ? e(o, h) : e(h, u);
    }, i = (t > n ? e(new vt([0, 0, 0]), this) : e(this, new vt([255, 255, 255]))).rgb();
    return new vt([...i, this._rgb[3]]);
  }
  return ro(...this._rgb.slice(0, 3));
};
const ro = (n, r, t) => (n = mr(n), r = mr(r), t = mr(t), 0.2126 * n + 0.7152 * r + 0.0722 * t), mr = (n) => (n /= 255, n <= 0.03928 ? n / 12.92 : Qi((n + 0.055) / 1.055, 2.4)), le = {}, je = (n, r, t = 0.5, ...a) => {
  let e = a[0] || "lrgb";
  if (!le[e] && !a.length && (e = Object.keys(le)[0]), !le[e])
    throw new Error(`interpolation mode ${e} is not defined`);
  return qt(n) !== "object" && (n = new vt(n)), qt(r) !== "object" && (r = new vt(r)), le[e](n, r, t).alpha(
    n.alpha() + t * (r.alpha() - n.alpha())
  );
};
vt.prototype.mix = vt.prototype.interpolate = function(n, r = 0.5, ...t) {
  return je(this, n, r, ...t);
};
vt.prototype.premultiply = function(n = !1) {
  const r = this._rgb, t = r[3];
  return n ? (this._rgb = [r[0] * t, r[1] * t, r[2] * t, t], this) : new vt([r[0] * t, r[1] * t, r[2] * t, t], "rgb");
};
const { sin: no, cos: io } = Math, Cn = (...n) => {
  let [r, t, a] = Ft(n, "lch");
  return isNaN(a) && (a = 0), a = a * Wi, [r, io(a) * t, no(a) * t];
}, zr = (...n) => {
  n = Ft(n, "lch");
  const [r, t, a] = n, [e, i, o] = Cn(r, t, a), [u, h, p] = Nr(e, i, o);
  return [u, h, p, n.length > 3 ? n[3] : 1];
}, oo = (...n) => {
  const r = Pn(Ft(n, "hcl"));
  return zr(...r);
}, { sqrt: ao, atan2: so, round: lo } = Math, Tn = (...n) => {
  const [r, t, a] = Ft(n, "lab"), e = ao(t * t + a * a);
  let i = (so(a, t) * Gi + 360) % 360;
  return lo(e * 1e4) === 0 && (i = Number.NaN), [r, e, i];
}, Zr = (...n) => {
  const [r, t, a, ...e] = Ft(n, "rgb"), [i, o, u] = Ur(r, t, a), [h, p, f] = Tn(i, o, u);
  return [h, p, f, ...e.length > 0 && e[0] < 1 ? [e[0]] : []];
};
vt.prototype.lch = function() {
  return Zr(this._rgb);
};
vt.prototype.hcl = function() {
  return Pn(Zr(this._rgb));
};
const fo = (...n) => new vt(...n, "lch"), co = (...n) => new vt(...n, "hcl");
Object.assign(Gt, { lch: fo, hcl: co });
Bt.format.lch = zr;
Bt.format.hcl = oo;
["lch", "hcl"].forEach(
  (n) => Bt.autodetect.push({
    p: 2,
    test: (...r) => {
      if (r = Ft(r, n), qt(r) === "array" && r.length === 3)
        return n;
    }
  })
);
vt.prototype.saturate = function(n = 1) {
  const r = this, t = r.lch();
  return t[1] += we.Kn * n, t[1] < 0 && (t[1] = 0), new vt(t, "lch").alpha(r.alpha(), !0);
};
vt.prototype.desaturate = function(n = 1) {
  return this.saturate(-n);
};
vt.prototype.set = function(n, r, t = !1) {
  const [a, e] = n.split("."), i = this[a]();
  if (e) {
    const o = a.indexOf(e) - (a.substr(0, 2) === "ok" ? 2 : 0);
    if (o > -1) {
      if (qt(r) == "string")
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
      else if (qt(r) === "number")
        i[o] = r;
      else
        throw new Error("unsupported value for Color.set");
      const u = new vt(i, a);
      return t ? (this._rgb = u._rgb, this) : u;
    }
    throw new Error(`unknown channel ${e} in mode ${a}`);
  } else
    return i;
};
vt.prototype.tint = function(n = 0.5, ...r) {
  return je(this, "white", n, ...r);
};
vt.prototype.shade = function(n = 0.5, ...r) {
  return je(this, "black", n, ...r);
};
const uo = (n, r, t) => {
  const a = n._rgb, e = r._rgb;
  return new vt(
    a[0] + t * (e[0] - a[0]),
    a[1] + t * (e[1] - a[1]),
    a[2] + t * (e[2] - a[2]),
    "rgb"
  );
};
le.rgb = uo;
const { sqrt: _r, pow: Ie } = Math, ho = (n, r, t) => {
  const [a, e, i] = n._rgb, [o, u, h] = r._rgb;
  return new vt(
    _r(Ie(a, 2) * (1 - t) + Ie(o, 2) * t),
    _r(Ie(e, 2) * (1 - t) + Ie(u, 2) * t),
    _r(Ie(i, 2) * (1 - t) + Ie(h, 2) * t),
    "rgb"
  );
};
le.lrgb = ho;
const po = (n, r, t) => {
  const a = n.lab(), e = r.lab();
  return new vt(
    a[0] + t * (e[0] - a[0]),
    a[1] + t * (e[1] - a[1]),
    a[2] + t * (e[2] - a[2]),
    "lab"
  );
};
le.lab = po;
const Fe = (n, r, t, a) => {
  let e, i;
  a === "hsl" ? (e = n.hsl(), i = r.hsl()) : a === "hsv" ? (e = n.hsv(), i = r.hsv()) : a === "hcg" ? (e = n.hcg(), i = r.hcg()) : a === "hsi" ? (e = n.hsi(), i = r.hsi()) : a === "lch" || a === "hcl" ? (a = "hcl", e = n.hcl(), i = r.hcl()) : a === "oklch" && (e = n.oklch().reverse(), i = r.oklch().reverse());
  let o, u, h, p, f, d;
  (a.substr(0, 1) === "h" || a === "oklch") && ([o, h, f] = e, [u, p, d] = i);
  let s, g, m, y;
  return !isNaN(o) && !isNaN(u) ? (u > o && u - o > 180 ? y = u - (o + 360) : u < o && o - u > 180 ? y = u + 360 - o : y = u - o, g = o + t * y) : isNaN(o) ? isNaN(u) ? g = Number.NaN : (g = u, (f == 1 || f == 0) && a != "hsv" && (s = p)) : (g = o, (d == 1 || d == 0) && a != "hsv" && (s = h)), s === void 0 && (s = h + t * (p - h)), m = f + t * (d - f), a === "oklch" ? new vt([m, s, g], a) : new vt([g, s, m], a);
}, Mn = (n, r, t) => Fe(n, r, t, "lch");
le.lch = Mn;
le.hcl = Mn;
const yo = (n) => {
  if (qt(n) == "number" && n >= 0 && n <= 16777215) {
    const r = n >> 16, t = n >> 8 & 255, a = n & 255;
    return [r, t, a, 1];
  }
  throw new Error("unknown num color: " + n);
}, bo = (...n) => {
  const [r, t, a] = Ft(n, "rgb");
  return (r << 16) + (t << 8) + a;
};
vt.prototype.num = function() {
  return bo(this._rgb);
};
const go = (...n) => new vt(...n, "num");
Object.assign(Gt, { num: go });
Bt.format.num = yo;
Bt.autodetect.push({
  p: 5,
  test: (...n) => {
    if (n.length === 1 && qt(n[0]) === "number" && n[0] >= 0 && n[0] <= 16777215)
      return "num";
  }
});
const mo = (n, r, t) => {
  const a = n.num(), e = r.num();
  return new vt(a + t * (e - a), "num");
};
le.num = mo;
const { floor: _o } = Math, wo = (...n) => {
  n = Ft(n, "hcg");
  let [r, t, a] = n, e, i, o;
  a = a * 255;
  const u = t * 255;
  if (t === 0)
    e = i = o = a;
  else {
    r === 360 && (r = 0), r > 360 && (r -= 360), r < 0 && (r += 360), r /= 60;
    const h = _o(r), p = r - h, f = a * (1 - t), d = f + u * (1 - p), s = f + u * p, g = f + u;
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
}, vo = (...n) => {
  const [r, t, a] = Ft(n, "rgb"), e = kn(r, t, a), i = xn(r, t, a), o = i - e, u = o * 100 / 255, h = e / (255 - o) * 100;
  let p;
  return o === 0 ? p = Number.NaN : (r === i && (p = (t - a) / o), t === i && (p = 2 + (a - r) / o), a === i && (p = 4 + (r - t) / o), p *= 60, p < 0 && (p += 360)), [p, u, h];
};
vt.prototype.hcg = function() {
  return vo(this._rgb);
};
const Eo = (...n) => new vt(...n, "hcg");
Gt.hcg = Eo;
Bt.format.hcg = wo;
Bt.autodetect.push({
  p: 1,
  test: (...n) => {
    if (n = Ft(n, "hcg"), qt(n) === "array" && n.length === 3)
      return "hcg";
  }
});
const So = (n, r, t) => Fe(n, r, t, "hcg");
le.hcg = So;
const { cos: Ce } = Math, Ao = (...n) => {
  n = Ft(n, "hsi");
  let [r, t, a] = n, e, i, o;
  return isNaN(r) && (r = 0), isNaN(t) && (t = 0), r > 360 && (r -= 360), r < 0 && (r += 360), r /= 360, r < 1 / 3 ? (o = (1 - t) / 3, e = (1 + t * Ce(Ae * r) / Ce(yr - Ae * r)) / 3, i = 1 - (o + e)) : r < 2 / 3 ? (r -= 1 / 3, e = (1 - t) / 3, i = (1 + t * Ce(Ae * r) / Ce(yr - Ae * r)) / 3, o = 1 - (e + i)) : (r -= 2 / 3, i = (1 - t) / 3, o = (1 + t * Ce(Ae * r) / Ce(yr - Ae * r)) / 3, e = 1 - (i + o)), e = Le(a * e * 3), i = Le(a * i * 3), o = Le(a * o * 3), [e * 255, i * 255, o * 255, n.length > 3 ? n[3] : 1];
}, { min: ko, sqrt: xo, acos: Po } = Math, Ro = (...n) => {
  let [r, t, a] = Ft(n, "rgb");
  r /= 255, t /= 255, a /= 255;
  let e;
  const i = ko(r, t, a), o = (r + t + a) / 3, u = o > 0 ? 1 - i / o : 0;
  return u === 0 ? e = NaN : (e = (r - t + (r - a)) / 2, e /= xo((r - t) * (r - t) + (r - a) * (t - a)), e = Po(e), a > t && (e = Ae - e), e /= Ae), [e * 360, u, o];
};
vt.prototype.hsi = function() {
  return Ro(this._rgb);
};
const Oo = (...n) => new vt(...n, "hsi");
Gt.hsi = Oo;
Bt.format.hsi = Ao;
Bt.autodetect.push({
  p: 2,
  test: (...n) => {
    if (n = Ft(n, "hsi"), qt(n) === "array" && n.length === 3)
      return "hsi";
  }
});
const Lo = (n, r, t) => Fe(n, r, t, "hsi");
le.hsi = Lo;
const Or = (...n) => {
  n = Ft(n, "hsl");
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
}, Dn = (...n) => {
  n = Ft(n, "rgba");
  let [r, t, a] = n;
  r /= 255, t /= 255, a /= 255;
  const e = kn(r, t, a), i = xn(r, t, a), o = (i + e) / 2;
  let u, h;
  return i === e ? (u = 0, h = Number.NaN) : u = o < 0.5 ? (i - e) / (i + e) : (i - e) / (2 - i - e), r == i ? h = (t - a) / (i - e) : t == i ? h = 2 + (a - r) / (i - e) : a == i && (h = 4 + (r - t) / (i - e)), h *= 60, h < 0 && (h += 360), n.length > 3 && n[3] !== void 0 ? [h, u, o, n[3]] : [h, u, o];
};
vt.prototype.hsl = function() {
  return Dn(this._rgb);
};
const Io = (...n) => new vt(...n, "hsl");
Gt.hsl = Io;
Bt.format.hsl = Or;
Bt.autodetect.push({
  p: 2,
  test: (...n) => {
    if (n = Ft(n, "hsl"), qt(n) === "array" && n.length === 3)
      return "hsl";
  }
});
const Co = (n, r, t) => Fe(n, r, t, "hsl");
le.hsl = Co;
const { floor: To } = Math, Mo = (...n) => {
  n = Ft(n, "hsv");
  let [r, t, a] = n, e, i, o;
  if (a *= 255, t === 0)
    e = i = o = a;
  else {
    r === 360 && (r = 0), r > 360 && (r -= 360), r < 0 && (r += 360), r /= 60;
    const u = To(r), h = r - u, p = a * (1 - t), f = a * (1 - t * h), d = a * (1 - t * (1 - h));
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
}, { min: Do, max: jo } = Math, Bo = (...n) => {
  n = Ft(n, "rgb");
  let [r, t, a] = n;
  const e = Do(r, t, a), i = jo(r, t, a), o = i - e;
  let u, h, p;
  return p = i / 255, i === 0 ? (u = Number.NaN, h = 0) : (h = o / i, r === i && (u = (t - a) / o), t === i && (u = 2 + (a - r) / o), a === i && (u = 4 + (r - t) / o), u *= 60, u < 0 && (u += 360)), [u, h, p];
};
vt.prototype.hsv = function() {
  return Bo(this._rgb);
};
const Fo = (...n) => new vt(...n, "hsv");
Gt.hsv = Fo;
Bt.format.hsv = Mo;
Bt.autodetect.push({
  p: 2,
  test: (...n) => {
    if (n = Ft(n, "hsv"), qt(n) === "array" && n.length === 3)
      return "hsv";
  }
});
const No = (n, r, t) => Fe(n, r, t, "hsv");
le.hsv = No;
function sr(n, r) {
  let t = n.length;
  Array.isArray(n[0]) || (n = [n]), Array.isArray(r[0]) || (r = r.map((o) => [o]));
  let a = r[0].length, e = r[0].map((o, u) => r.map((h) => h[u])), i = n.map(
    (o) => e.map((u) => Array.isArray(o) ? o.reduce((h, p, f) => h + p * (u[f] || 0), 0) : u.reduce((h, p) => h + p * o, 0))
  );
  return t === 1 && (i = i[0]), a === 1 ? i.map((o) => o[0]) : i;
}
const qr = (...n) => {
  n = Ft(n, "lab");
  const [r, t, a, ...e] = n, [i, o, u] = Uo([r, t, a]), [h, p, f] = Ln(i, o, u);
  return [h, p, f, ...e.length > 0 && e[0] < 1 ? [e[0]] : []];
};
function Uo(n) {
  var r = [
    [1.2268798758459243, -0.5578149944602171, 0.2813910456659647],
    [-0.0405757452148008, 1.112286803280317, -0.0717110580655164],
    [-0.0763729366746601, -0.4214933324022432, 1.5869240198367816]
  ], t = [
    [1, 0.3963377773761749, 0.2158037573099136],
    [1, -0.1055613458156586, -0.0638541728258133],
    [1, -0.0894841775298119, -1.2914855480194092]
  ], a = sr(t, n);
  return sr(
    r,
    a.map((e) => e ** 3)
  );
}
const Wr = (...n) => {
  const [r, t, a, ...e] = Ft(n, "rgb"), i = In(r, t, a);
  return [...zo(i), ...e.length > 0 && e[0] < 1 ? [e[0]] : []];
};
function zo(n) {
  const r = [
    [0.819022437996703, 0.3619062600528904, -0.1288737815209879],
    [0.0329836539323885, 0.9292868615863434, 0.0361446663506424],
    [0.0481771893596242, 0.2642395317527308, 0.6335478284694309]
  ], t = [
    [0.210454268309314, 0.7936177747023054, -0.0040720430116193],
    [1.9779985324311684, -2.42859224204858, 0.450593709617411],
    [0.0259040424655478, 0.7827717124575296, -0.8086757549230774]
  ], a = sr(r, n);
  return sr(
    t,
    a.map((e) => Math.cbrt(e))
  );
}
vt.prototype.oklab = function() {
  return Wr(this._rgb);
};
const Zo = (...n) => new vt(...n, "oklab");
Object.assign(Gt, { oklab: Zo });
Bt.format.oklab = qr;
Bt.autodetect.push({
  p: 2,
  test: (...n) => {
    if (n = Ft(n, "oklab"), qt(n) === "array" && n.length === 3)
      return "oklab";
  }
});
const qo = (n, r, t) => {
  const a = n.oklab(), e = r.oklab();
  return new vt(
    a[0] + t * (e[0] - a[0]),
    a[1] + t * (e[1] - a[1]),
    a[2] + t * (e[2] - a[2]),
    "oklab"
  );
};
le.oklab = qo;
const Wo = (n, r, t) => Fe(n, r, t, "oklch");
le.oklch = Wo;
const { pow: wr, sqrt: vr, PI: Er, cos: Xr, sin: Kr, atan2: Go } = Math, Ho = (n, r = "lrgb", t = null) => {
  const a = n.length;
  t || (t = Array.from(new Array(a)).map(() => 1));
  const e = a / t.reduce(function(d, s) {
    return d + s;
  });
  if (t.forEach((d, s) => {
    t[s] *= e;
  }), n = n.map((d) => new vt(d)), r === "lrgb")
    return Vo(n, t);
  const i = n.shift(), o = i.get(r), u = [];
  let h = 0, p = 0;
  for (let d = 0; d < o.length; d++)
    if (o[d] = (o[d] || 0) * t[0], u.push(isNaN(o[d]) ? 0 : t[0]), r.charAt(d) === "h" && !isNaN(o[d])) {
      const s = o[d] / 180 * Er;
      h += Xr(s) * t[0], p += Kr(s) * t[0];
    }
  let f = i.alpha() * t[0];
  n.forEach((d, s) => {
    const g = d.get(r);
    f += d.alpha() * t[s + 1];
    for (let m = 0; m < o.length; m++)
      if (!isNaN(g[m]))
        if (u[m] += t[s + 1], r.charAt(m) === "h") {
          const y = g[m] / 180 * Er;
          h += Xr(y) * t[s + 1], p += Kr(y) * t[s + 1];
        } else
          o[m] += g[m] * t[s + 1];
  });
  for (let d = 0; d < o.length; d++)
    if (r.charAt(d) === "h") {
      let s = Go(p / u[d], h / u[d]) / Er * 180;
      for (; s < 0; ) s += 360;
      for (; s >= 360; ) s -= 360;
      o[d] = s;
    } else
      o[d] = o[d] / u[d];
  return f /= a, new vt(o, r).alpha(f > 0.99999 ? 1 : f, !0);
}, Vo = (n, r) => {
  const t = n.length, a = [0, 0, 0, 0];
  for (let e = 0; e < n.length; e++) {
    const i = n[e], o = r[e] / t, u = i._rgb;
    a[0] += wr(u[0], 2) * o, a[1] += wr(u[1], 2) * o, a[2] += wr(u[2], 2) * o, a[3] += u[3] * o;
  }
  return a[0] = vr(a[0]), a[1] = vr(a[1]), a[2] = vr(a[2]), a[3] > 0.9999999 && (a[3] = 1), new vt(Fr(a));
}, { pow: $o } = Math;
function lr(n) {
  let r = "rgb", t = Gt("#ccc"), a = 0, e = [0, 1], i = [0, 1], o = [], u = [0, 0], h = !1, p = [], f = !1, d = 0, s = 1, g = !1, m = {}, y = !0, w = 1;
  const _ = function(R) {
    if (R = R || ["#fff", "#000"], R && qt(R) === "string" && Gt.brewer && Gt.brewer[R.toLowerCase()] && (R = Gt.brewer[R.toLowerCase()]), qt(R) === "array") {
      R.length === 1 && (R = [R[0], R[0]]), R = R.slice(0);
      for (let v = 0; v < R.length; v++)
        R[v] = Gt(R[v]);
      o.length = 0;
      for (let v = 0; v < R.length; v++)
        o.push(v / (R.length - 1));
    }
    return L(), p = R;
  }, E = function(R) {
    if (h != null) {
      const v = h.length - 1;
      let D = 0;
      for (; D < v && R >= h[D]; )
        D++;
      return D - 1;
    }
    return 0;
  };
  let x = (R) => R, C = (R) => R;
  const F = function(R, v) {
    let D, M;
    if (v == null && (v = !1), isNaN(R) || R === null)
      return t;
    v ? M = R : h && h.length > 2 ? M = E(R) / (h.length - 2) : s !== d ? M = (R - d) / (s - d) : M = 1, M = C(M), v || (M = x(M)), w !== 1 && (M = $o(M, w)), M = u[0] + M * (1 - u[0] - u[1]), M = Le(M, 0, 1);
    const H = Math.floor(M * 1e4);
    if (y && m[H])
      D = m[H];
    else {
      if (qt(p) === "array")
        for (let Y = 0; Y < o.length; Y++) {
          const Q = o[Y];
          if (M <= Q) {
            D = p[Y];
            break;
          }
          if (M >= Q && Y === o.length - 1) {
            D = p[Y];
            break;
          }
          if (M > Q && M < o[Y + 1]) {
            M = (M - Q) / (o[Y + 1] - Q), D = Gt.interpolate(
              p[Y],
              p[Y + 1],
              M,
              r
            );
            break;
          }
        }
      else qt(p) === "function" && (D = p(M));
      y && (m[H] = D);
    }
    return D;
  };
  var L = () => m = {};
  _(n);
  const I = function(R) {
    const v = Gt(F(R));
    return f && v[f] ? v[f]() : v;
  };
  return I.classes = function(R) {
    if (R != null) {
      if (qt(R) === "array")
        h = R, e = [R[0], R[R.length - 1]];
      else {
        const v = Gt.analyze(e);
        R === 0 ? h = [v.min, v.max] : h = Gt.limits(v, "e", R);
      }
      return I;
    }
    return h;
  }, I.domain = function(R) {
    if (!arguments.length)
      return i;
    i = R.slice(0), d = R[0], s = R[R.length - 1], o = [];
    const v = p.length;
    if (R.length === v && d !== s)
      for (let D of Array.from(R))
        o.push((D - d) / (s - d));
    else {
      for (let D = 0; D < v; D++)
        o.push(D / (v - 1));
      if (R.length > 2) {
        const D = R.map((H, Y) => Y / (R.length - 1)), M = R.map((H) => (H - d) / (s - d));
        M.every((H, Y) => D[Y] === H) || (C = (H) => {
          if (H <= 0 || H >= 1) return H;
          let Y = 0;
          for (; H >= M[Y + 1]; ) Y++;
          const Q = (H - M[Y]) / (M[Y + 1] - M[Y]);
          return D[Y] + Q * (D[Y + 1] - D[Y]);
        });
      }
    }
    return e = [d, s], I;
  }, I.mode = function(R) {
    return arguments.length ? (r = R, L(), I) : r;
  }, I.range = function(R, v) {
    return _(R), I;
  }, I.out = function(R) {
    return f = R, I;
  }, I.spread = function(R) {
    return arguments.length ? (a = R, I) : a;
  }, I.correctLightness = function(R) {
    return R == null && (R = !0), g = R, L(), g ? x = function(v) {
      const D = F(0, !0).lab()[0], M = F(1, !0).lab()[0], H = D > M;
      let Y = F(v, !0).lab()[0];
      const Q = D + (M - D) * v;
      let st = Y - Q, j = 0, S = 1, q = 20;
      for (; Math.abs(st) > 0.01 && q-- > 0; )
        (function() {
          return H && (st *= -1), st < 0 ? (j = v, v += (S - v) * 0.5) : (S = v, v += (j - v) * 0.5), Y = F(v, !0).lab()[0], st = Y - Q;
        })();
      return v;
    } : x = (v) => v, I;
  }, I.padding = function(R) {
    return R != null ? (qt(R) === "number" && (R = [R, R]), u = R, I) : u;
  }, I.colors = function(R, v) {
    arguments.length < 2 && (v = "hex");
    let D = [];
    if (arguments.length === 0)
      D = p.slice(0);
    else if (R === 1)
      D = [I(0.5)];
    else if (R > 1) {
      const M = e[0], H = e[1] - M;
      D = Yo(0, R).map(
        (Y) => I(M + Y / (R - 1) * H)
      );
    } else {
      n = [];
      let M = [];
      if (h && h.length > 2)
        for (let H = 1, Y = h.length, Q = 1 <= Y; Q ? H < Y : H > Y; Q ? H++ : H--)
          M.push((h[H - 1] + h[H]) * 0.5);
      else
        M = e;
      D = M.map((H) => I(H));
    }
    return Gt[v] && (D = D.map((M) => M[v]())), D;
  }, I.cache = function(R) {
    return R != null ? (y = R, I) : y;
  }, I.gamma = function(R) {
    return R != null ? (w = R, I) : w;
  }, I.nodata = function(R) {
    return R != null ? (t = Gt(R), I) : t;
  }, I;
}
function Yo(n, r, t) {
  let a = [], e = n < r, i = r;
  for (let o = n; e ? o < i : o > i; e ? o++ : o--)
    a.push(o);
  return a;
}
const Xo = function(n) {
  let r = [1, 1];
  for (let t = 1; t < n; t++) {
    let a = [1];
    for (let e = 1; e <= r.length; e++)
      a[e] = (r[e] || 0) + r[e - 1];
    r = a;
  }
  return r;
}, Ko = function(n) {
  let r, t, a, e;
  if (n = n.map((i) => new vt(i)), n.length === 2)
    [t, a] = n.map((i) => i.lab()), r = function(i) {
      const o = [0, 1, 2].map((u) => t[u] + i * (a[u] - t[u]));
      return new vt(o, "lab");
    };
  else if (n.length === 3)
    [t, a, e] = n.map((i) => i.lab()), r = function(i) {
      const o = [0, 1, 2].map(
        (u) => (1 - i) * (1 - i) * t[u] + 2 * (1 - i) * i * a[u] + i * i * e[u]
      );
      return new vt(o, "lab");
    };
  else if (n.length === 4) {
    let i;
    [t, a, e, i] = n.map((o) => o.lab()), r = function(o) {
      const u = [0, 1, 2].map(
        (h) => (1 - o) * (1 - o) * (1 - o) * t[h] + 3 * (1 - o) * (1 - o) * o * a[h] + 3 * (1 - o) * o * o * e[h] + o * o * o * i[h]
      );
      return new vt(u, "lab");
    };
  } else if (n.length >= 5) {
    let i, o, u;
    i = n.map((h) => h.lab()), u = n.length - 1, o = Xo(u), r = function(h) {
      const p = 1 - h, f = [0, 1, 2].map(
        (d) => i.reduce(
          (s, g, m) => s + o[m] * p ** (u - m) * h ** m * g[d],
          0
        )
      );
      return new vt(f, "lab");
    };
  } else
    throw new RangeError("No point in running bezier with only one color.");
  return r;
}, Jo = (n) => {
  const r = Ko(n);
  return r.scale = () => lr(r), r;
}, { round: jn } = Math;
vt.prototype.rgb = function(n = !0) {
  return n === !1 ? this._rgb.slice(0, 3) : this._rgb.slice(0, 3).map(jn);
};
vt.prototype.rgba = function(n = !0) {
  return this._rgb.slice(0, 4).map((r, t) => t < 3 ? n === !1 ? r : jn(r) : r);
};
const Qo = (...n) => new vt(...n, "rgb");
Object.assign(Gt, { rgb: Qo });
Bt.format.rgb = (...n) => {
  const r = Ft(n, "rgba");
  return r[3] === void 0 && (r[3] = 1), r;
};
Bt.autodetect.push({
  p: 3,
  test: (...n) => {
    if (n = Ft(n, "rgba"), qt(n) === "array" && (n.length === 3 || n.length === 4 && qt(n[3]) == "number" && n[3] >= 0 && n[3] <= 1))
      return "rgb";
  }
});
const me = (n, r, t) => {
  if (!me[t])
    throw new Error("unknown blend mode " + t);
  return me[t](n, r);
}, Pe = (n) => (r, t) => {
  const a = Gt(t).rgb(), e = Gt(r).rgb();
  return Gt.rgb(n(a, e));
}, Re = (n) => (r, t) => {
  const a = [];
  return a[0] = n(r[0], t[0]), a[1] = n(r[1], t[1]), a[2] = n(r[2], t[2]), a;
}, ta = (n) => n, ea = (n, r) => n * r / 255, ra = (n, r) => n > r ? r : n, na = (n, r) => n > r ? n : r, ia = (n, r) => 255 * (1 - (1 - n / 255) * (1 - r / 255)), oa = (n, r) => r < 128 ? 2 * n * r / 255 : 255 * (1 - 2 * (1 - n / 255) * (1 - r / 255)), aa = (n, r) => 255 * (1 - (1 - r / 255) / (n / 255)), sa = (n, r) => n === 255 ? 255 : (n = 255 * (r / 255) / (1 - n / 255), n > 255 ? 255 : n);
me.normal = Pe(Re(ta));
me.multiply = Pe(Re(ea));
me.screen = Pe(Re(ia));
me.overlay = Pe(Re(oa));
me.darken = Pe(Re(ra));
me.lighten = Pe(Re(na));
me.dodge = Pe(Re(sa));
me.burn = Pe(Re(aa));
const { pow: la, sin: fa, cos: ca } = Math;
function ua(n = 300, r = -1.5, t = 1, a = 1, e = [0, 1]) {
  let i = 0, o;
  qt(e) === "array" ? o = e[1] - e[0] : (o = 0, e = [e, e]);
  const u = function(h) {
    const p = Ae * ((n + 120) / 360 + r * h), f = la(e[0] + o * h, a), s = (i !== 0 ? t[0] + h * i : t) * f * (1 - f) / 2, g = ca(p), m = fa(p), y = f + s * (-0.14861 * g + 1.78277 * m), w = f + s * (-0.29227 * g - 0.90649 * m), _ = f + s * (1.97294 * g);
    return Gt(Fr([y * 255, w * 255, _ * 255, 1]));
  };
  return u.start = function(h) {
    return h == null ? n : (n = h, u);
  }, u.rotations = function(h) {
    return h == null ? r : (r = h, u);
  }, u.gamma = function(h) {
    return h == null ? a : (a = h, u);
  }, u.hue = function(h) {
    return h == null ? t : (t = h, qt(t) === "array" ? (i = t[1] - t[0], i === 0 && (t = t[1])) : i = 0, u);
  }, u.lightness = function(h) {
    return h == null ? e : (qt(h) === "array" ? (e = h, o = h[1] - h[0]) : (e = [h, h], o = 0), u);
  }, u.scale = () => Gt.scale(u), u.hue(t), u;
}
const ha = "0123456789abcdef", { floor: da, random: pa } = Math, ya = (n = pa) => {
  let r = "#";
  for (let t = 0; t < 6; t++)
    r += ha.charAt(da(n() * 16));
  return new vt(r, "hex");
}, { log: Jr, pow: ba, floor: ga, abs: ma } = Math;
function Bn(n, r = null) {
  const t = {
    min: Number.MAX_VALUE,
    max: Number.MAX_VALUE * -1,
    sum: 0,
    values: [],
    count: 0
  };
  return qt(n) === "object" && (n = Object.values(n)), n.forEach((a) => {
    r && qt(a) === "object" && (a = a[r]), a != null && !isNaN(a) && (t.values.push(a), t.sum += a, a < t.min && (t.min = a), a > t.max && (t.max = a), t.count += 1);
  }), t.domain = [t.min, t.max], t.limits = (a, e) => Fn(t, a, e), t;
}
function Fn(n, r = "equal", t = 7) {
  qt(n) == "array" && (n = Bn(n));
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
    const u = Math.LOG10E * Jr(a), h = Math.LOG10E * Jr(e);
    o.push(a);
    for (let p = 1; p < t; p++)
      o.push(ba(10, u + p / t * (h - u)));
    o.push(e);
  } else if (r.substr(0, 1) === "q") {
    o.push(a);
    for (let u = 1; u < t; u++) {
      const h = (i.length - 1) * u / t, p = ga(h);
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
        const E = i[_];
        let x = Number.MAX_VALUE, C;
        for (let F = 0; F < t; F++) {
          const L = ma(g[F] - E);
          L < x && (x = L, C = F), f[C]++, p[_] = C;
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
    let y = [];
    for (let w = 0; w < t; w++)
      y.push(m[w][0]), y.push(m[w][m[w].length - 1]);
    y = y.sort((w, _) => w - _), o.push(y[0]);
    for (let w = 1; w < y.length; w += 2) {
      const _ = y[w];
      !isNaN(_) && o.indexOf(_) === -1 && o.push(_);
    }
  }
  return o;
}
const _a = (n, r) => {
  n = new vt(n), r = new vt(r);
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
const Qr = 0.027, wa = 5e-4, va = 0.1, tn = 1.14, Je = 0.022, en = 1.414, Ea = (n, r) => {
  n = new vt(n), r = new vt(r), n.alpha() < 1 && (n = je(r, n, n.alpha(), "rgb"));
  const t = rn(...n.rgb()), a = rn(...r.rgb()), e = t >= Je ? t : t + Math.pow(Je - t, en), i = a >= Je ? a : a + Math.pow(Je - a, en), o = Math.pow(i, 0.56) - Math.pow(e, 0.57), u = Math.pow(i, 0.65) - Math.pow(e, 0.62), h = Math.abs(i - e) < wa ? 0 : e < i ? o * tn : u * tn;
  return (Math.abs(h) < va ? 0 : h > 0 ? h - Qr : h + Qr) * 100;
};
function rn(n, r, t) {
  return 0.2126729 * Math.pow(n / 255, 2.4) + 0.7151522 * Math.pow(r / 255, 2.4) + 0.072175 * Math.pow(t / 255, 2.4);
}
const { sqrt: Se, pow: ie, min: Sa, max: Aa, atan2: nn, abs: on, cos: Qe, sin: an, exp: ka, PI: sn } = Math;
function xa(n, r, t = 1, a = 1, e = 1) {
  var i = function(U) {
    return 360 * U / (2 * sn);
  }, o = function(U) {
    return 2 * sn * U / 360;
  };
  n = new vt(n), r = new vt(r);
  const [u, h, p] = Array.from(n.lab()), [f, d, s] = Array.from(r.lab()), g = (u + f) / 2, m = Se(ie(h, 2) + ie(p, 2)), y = Se(ie(d, 2) + ie(s, 2)), w = (m + y) / 2, _ = 0.5 * (1 - Se(ie(w, 7) / (ie(w, 7) + ie(25, 7)))), E = h * (1 + _), x = d * (1 + _), C = Se(ie(E, 2) + ie(p, 2)), F = Se(ie(x, 2) + ie(s, 2)), L = (C + F) / 2, I = i(nn(p, E)), R = i(nn(s, x)), v = I >= 0 ? I : I + 360, D = R >= 0 ? R : R + 360, M = on(v - D) > 180 ? (v + D + 360) / 2 : (v + D) / 2, H = 1 - 0.17 * Qe(o(M - 30)) + 0.24 * Qe(o(2 * M)) + 0.32 * Qe(o(3 * M + 6)) - 0.2 * Qe(o(4 * M - 63));
  let Y = D - v;
  Y = on(Y) <= 180 ? Y : D <= v ? Y + 360 : Y - 360, Y = 2 * Se(C * F) * an(o(Y) / 2);
  const Q = f - u, st = F - C, j = 1 + 0.015 * ie(g - 50, 2) / Se(20 + ie(g - 50, 2)), S = 1 + 0.045 * L, q = 1 + 0.015 * L * H, it = 30 * ka(-ie((M - 275) / 25, 2)), kt = -(2 * Se(ie(L, 7) / (ie(L, 7) + ie(25, 7)))) * an(2 * o(it)), ot = Se(
    ie(Q / (t * j), 2) + ie(st / (a * S), 2) + ie(Y / (e * q), 2) + kt * (st / (a * S)) * (Y / (e * q))
  );
  return Aa(0, Sa(100, ot));
}
function Pa(n, r, t = "lab") {
  n = new vt(n), r = new vt(r);
  const a = n.get(t), e = r.get(t);
  let i = 0;
  for (let o in a) {
    const u = (a[o] || 0) - (e[o] || 0);
    i += u * u;
  }
  return Math.sqrt(i);
}
const Ra = (...n) => {
  try {
    return new vt(...n), !0;
  } catch {
    return !1;
  }
}, Oa = {
  cool() {
    return lr([Gt.hsl(180, 1, 0.9), Gt.hsl(250, 0.7, 0.4)]);
  },
  hot() {
    return lr(["#000", "#f00", "#ff0", "#fff"]).mode(
      "rgb"
    );
  }
}, Lr = {
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
}, Nn = Object.keys(Lr), ln = new Map(Nn.map((n) => [n.toLowerCase(), n])), La = typeof Proxy == "function" ? new Proxy(Lr, {
  get(n, r) {
    const t = r.toLowerCase();
    if (ln.has(t))
      return n[ln.get(t)];
  },
  getOwnPropertyNames() {
    return Object.getOwnPropertyNames(Nn);
  }
}) : Lr, Ia = (...n) => {
  n = Ft(n, "cmyk");
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
}, { max: fn } = Math, Ca = (...n) => {
  let [r, t, a] = Ft(n, "rgb");
  r = r / 255, t = t / 255, a = a / 255;
  const e = 1 - fn(r, fn(t, a)), i = e < 1 ? 1 / (1 - e) : 0, o = (1 - r - e) * i, u = (1 - t - e) * i, h = (1 - a - e) * i;
  return [o, u, h, e];
};
vt.prototype.cmyk = function() {
  return Ca(this._rgb);
};
const Ta = (...n) => new vt(...n, "cmyk");
Object.assign(Gt, { cmyk: Ta });
Bt.format.cmyk = Ia;
Bt.autodetect.push({
  p: 2,
  test: (...n) => {
    if (n = Ft(n, "cmyk"), qt(n) === "array" && n.length === 4)
      return "cmyk";
  }
});
const Ma = (...n) => {
  const r = Ft(n, "hsla");
  let t = Be(n) || "lsa";
  return r[0] = pe(r[0] || 0) + "deg", r[1] = pe(r[1] * 100) + "%", r[2] = pe(r[2] * 100) + "%", t === "hsla" || r.length > 3 && r[3] < 1 ? (r[3] = "/ " + (r.length > 3 ? r[3] : 1), t = "hsla") : r.length = 3, `${t.substr(0, 3)}(${r.join(" ")})`;
}, Da = (...n) => {
  const r = Ft(n, "lab");
  let t = Be(n) || "lab";
  return r[0] = pe(r[0]) + "%", r[1] = pe(r[1]), r[2] = pe(r[2]), t === "laba" || r.length > 3 && r[3] < 1 ? r[3] = "/ " + (r.length > 3 ? r[3] : 1) : r.length = 3, `lab(${r.join(" ")})`;
}, ja = (...n) => {
  const r = Ft(n, "lch");
  let t = Be(n) || "lab";
  return r[0] = pe(r[0]) + "%", r[1] = pe(r[1]), r[2] = isNaN(r[2]) ? "none" : pe(r[2]) + "deg", t === "lcha" || r.length > 3 && r[3] < 1 ? r[3] = "/ " + (r.length > 3 ? r[3] : 1) : r.length = 3, `lch(${r.join(" ")})`;
}, Ba = (...n) => {
  const r = Ft(n, "lab");
  return r[0] = pe(r[0] * 100) + "%", r[1] = Rr(r[1]), r[2] = Rr(r[2]), r.length > 3 && r[3] < 1 ? r[3] = "/ " + (r.length > 3 ? r[3] : 1) : r.length = 3, `oklab(${r.join(" ")})`;
}, Un = (...n) => {
  const [r, t, a, ...e] = Ft(n, "rgb"), [i, o, u] = Wr(r, t, a), [h, p, f] = Tn(i, o, u);
  return [h, p, f, ...e.length > 0 && e[0] < 1 ? [e[0]] : []];
}, Fa = (...n) => {
  const r = Ft(n, "lch");
  return r[0] = pe(r[0] * 100) + "%", r[1] = Rr(r[1]), r[2] = isNaN(r[2]) ? "none" : pe(r[2]) + "deg", r.length > 3 && r[3] < 1 ? r[3] = "/ " + (r.length > 3 ? r[3] : 1) : r.length = 3, `oklch(${r.join(" ")})`;
}, { round: Sr } = Math, Na = (...n) => {
  const r = Ft(n, "rgba");
  let t = Be(n) || "rgb";
  if (t.substr(0, 3) === "hsl")
    return Ma(Dn(r), t);
  if (t.substr(0, 3) === "lab") {
    const a = Ve();
    ke("d50");
    const e = Da(Ur(r), t);
    return ke(a), e;
  }
  if (t.substr(0, 3) === "lch") {
    const a = Ve();
    ke("d50");
    const e = ja(Zr(r), t);
    return ke(a), e;
  }
  return t.substr(0, 5) === "oklab" ? Ba(Wr(r)) : t.substr(0, 5) === "oklch" ? Fa(Un(r)) : (r[0] = Sr(r[0]), r[1] = Sr(r[1]), r[2] = Sr(r[2]), (t === "rgba" || r.length > 3 && r[3] < 1) && (r[3] = "/ " + (r.length > 3 ? r[3] : 1), t = "rgba"), `${t.substr(0, 3)}(${r.slice(0, t === "rgb" ? 3 : 4).join(" ")})`);
}, zn = (...n) => {
  n = Ft(n, "lch");
  const [r, t, a, ...e] = n, [i, o, u] = Cn(r, t, a), [h, p, f] = qr(i, o, u);
  return [h, p, f, ...e.length > 0 && e[0] < 1 ? [e[0]] : []];
}, xe = /((?:-?\d+)|(?:-?\d+(?:\.\d+)?)%|none)/.source, ge = /((?:-?(?:\d+(?:\.\d*)?|\.\d+)%?)|none)/.source, fr = /((?:-?(?:\d+(?:\.\d*)?|\.\d+)%)|none)/.source, ye = /\s*/.source, Ne = /\s+/.source, Gr = /\s*,\s*/.source, ur = /((?:-?(?:\d+(?:\.\d*)?|\.\d+)(?:deg)?)|none)/.source, Ue = /\s*(?:\/\s*((?:[01]|[01]?\.\d+)|\d+(?:\.\d+)?%))?/.source, Zn = new RegExp(
  "^rgba?\\(" + ye + [xe, xe, xe].join(Ne) + Ue + "\\)$"
), qn = new RegExp(
  "^rgb\\(" + ye + [xe, xe, xe].join(Gr) + ye + "\\)$"
), Wn = new RegExp(
  "^rgba\\(" + ye + [xe, xe, xe, ge].join(Gr) + ye + "\\)$"
), Gn = new RegExp(
  "^hsla?\\(" + ye + [ur, fr, fr].join(Ne) + Ue + "\\)$"
), Hn = new RegExp(
  "^hsl?\\(" + ye + [ur, fr, fr].join(Gr) + ye + "\\)$"
), Vn = /^hsla\(\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)%\s*,\s*(-?\d+(?:\.\d+)?)%\s*,\s*([01]|[01]?\.\d+)\)$/, $n = new RegExp(
  "^lab\\(" + ye + [ge, ge, ge].join(Ne) + Ue + "\\)$"
), Yn = new RegExp(
  "^lch\\(" + ye + [ge, ge, ur].join(Ne) + Ue + "\\)$"
), Xn = new RegExp(
  "^oklab\\(" + ye + [ge, ge, ge].join(Ne) + Ue + "\\)$"
), Kn = new RegExp(
  "^oklch\\(" + ye + [ge, ge, ur].join(Ne) + Ue + "\\)$"
), { round: Jn } = Math, Te = (n) => n.map((r, t) => t <= 2 ? Le(Jn(r), 0, 255) : r), oe = (n, r = 0, t = 100, a = !1) => (typeof n == "string" && n.endsWith("%") && (n = parseFloat(n.substring(0, n.length - 1)) / 100, a ? n = r + (n + 1) * 0.5 * (t - r) : n = r + n * (t - r)), +n), ce = (n, r) => n === "none" ? r : n, Hr = (n) => {
  if (n = n.toLowerCase().trim(), n === "transparent")
    return [0, 0, 0, 0];
  let r;
  if (Bt.format.named)
    try {
      return Bt.format.named(n);
    } catch {
    }
  if ((r = n.match(Zn)) || (r = n.match(qn))) {
    let t = r.slice(1, 4);
    for (let e = 0; e < 3; e++)
      t[e] = +oe(ce(t[e], 0), 0, 255);
    t = Te(t);
    const a = r[4] !== void 0 ? +oe(r[4], 0, 1) : 1;
    return t[3] = a, t;
  }
  if (r = n.match(Wn)) {
    const t = r.slice(1, 5);
    for (let a = 0; a < 4; a++)
      t[a] = +oe(t[a], 0, 255);
    return t;
  }
  if ((r = n.match(Gn)) || (r = n.match(Hn))) {
    const t = r.slice(1, 4);
    t[0] = +ce(t[0].replace("deg", ""), 0), t[1] = +oe(ce(t[1], 0), 0, 100) * 0.01, t[2] = +oe(ce(t[2], 0), 0, 100) * 0.01;
    const a = Te(Or(t)), e = r[4] !== void 0 ? +oe(r[4], 0, 1) : 1;
    return a[3] = e, a;
  }
  if (r = n.match(Vn)) {
    const t = r.slice(1, 4);
    t[1] *= 0.01, t[2] *= 0.01;
    const a = Or(t);
    for (let e = 0; e < 3; e++)
      a[e] = Jn(a[e]);
    return a[3] = +r[4], a;
  }
  if (r = n.match($n)) {
    const t = r.slice(1, 4);
    t[0] = oe(ce(t[0], 0), 0, 100), t[1] = oe(ce(t[1], 0), -125, 125, !0), t[2] = oe(ce(t[2], 0), -125, 125, !0);
    const a = Ve();
    ke("d50");
    const e = Te(Nr(t));
    ke(a);
    const i = r[4] !== void 0 ? +oe(r[4], 0, 1) : 1;
    return e[3] = i, e;
  }
  if (r = n.match(Yn)) {
    const t = r.slice(1, 4);
    t[0] = oe(t[0], 0, 100), t[1] = oe(ce(t[1], 0), 0, 150, !1), t[2] = +ce(t[2].replace("deg", ""), 0);
    const a = Ve();
    ke("d50");
    const e = Te(zr(t));
    ke(a);
    const i = r[4] !== void 0 ? +oe(r[4], 0, 1) : 1;
    return e[3] = i, e;
  }
  if (r = n.match(Xn)) {
    const t = r.slice(1, 4);
    t[0] = oe(ce(t[0], 0), 0, 1), t[1] = oe(ce(t[1], 0), -0.4, 0.4, !0), t[2] = oe(ce(t[2], 0), -0.4, 0.4, !0);
    const a = Te(qr(t)), e = r[4] !== void 0 ? +oe(r[4], 0, 1) : 1;
    return a[3] = e, a;
  }
  if (r = n.match(Kn)) {
    const t = r.slice(1, 4);
    t[0] = oe(ce(t[0], 0), 0, 1), t[1] = oe(ce(t[1], 0), 0, 0.4, !1), t[2] = +ce(t[2].replace("deg", ""), 0);
    const a = Te(zn(t)), e = r[4] !== void 0 ? +oe(r[4], 0, 1) : 1;
    return a[3] = e, a;
  }
};
Hr.test = (n) => (
  // modern
  Zn.test(n) || Gn.test(n) || $n.test(n) || Yn.test(n) || Xn.test(n) || Kn.test(n) || // legacy
  qn.test(n) || Wn.test(n) || Hn.test(n) || Vn.test(n) || n === "transparent"
);
vt.prototype.css = function(n) {
  return Na(this._rgb, n);
};
const Ua = (...n) => new vt(...n, "css");
Gt.css = Ua;
Bt.format.css = Hr;
Bt.autodetect.push({
  p: 5,
  test: (n, ...r) => {
    if (!r.length && qt(n) === "string" && Hr.test(n))
      return "css";
  }
});
Bt.format.gl = (...n) => {
  const r = Ft(n, "rgba");
  return r[0] *= 255, r[1] *= 255, r[2] *= 255, r;
};
const za = (...n) => new vt(...n, "gl");
Gt.gl = za;
vt.prototype.gl = function() {
  const n = this._rgb;
  return [n[0] / 255, n[1] / 255, n[2] / 255, n[3]];
};
vt.prototype.hex = function(n) {
  return On(this._rgb, n);
};
const Za = (...n) => new vt(...n, "hex");
Gt.hex = Za;
Bt.format.hex = Rn;
Bt.autodetect.push({
  p: 4,
  test: (n, ...r) => {
    if (!r.length && qt(n) === "string" && [3, 4, 5, 6, 7, 8, 9].indexOf(n.length) >= 0)
      return "hex";
  }
});
const { log: tr } = Math, Qn = (n) => {
  const r = n / 100;
  let t, a, e;
  return r < 66 ? (t = 255, a = r < 6 ? 0 : -155.25485562709179 - 0.44596950469579133 * (a = r - 2) + 104.49216199393888 * tr(a), e = r < 20 ? 0 : -254.76935184120902 + 0.8274096064007395 * (e = r - 10) + 115.67994401066147 * tr(e)) : (t = 351.97690566805693 + 0.114206453784165 * (t = r - 55) - 40.25366309332127 * tr(t), a = 325.4494125711974 + 0.07943456536662342 * (a = r - 50) - 28.0852963507957 * tr(a), e = 255), [t, a, e, 1];
}, { round: qa } = Math, Wa = (...n) => {
  const r = Ft(n, "rgb"), t = r[0], a = r[2];
  let e = 1e3, i = 4e4;
  const o = 0.4;
  let u;
  for (; i - e > o; ) {
    u = (i + e) * 0.5;
    const h = Qn(u);
    h[2] / h[0] >= a / t ? i = u : e = u;
  }
  return qa(u);
};
vt.prototype.temp = vt.prototype.kelvin = vt.prototype.temperature = function() {
  return Wa(this._rgb);
};
const Ar = (...n) => new vt(...n, "temp");
Object.assign(Gt, { temp: Ar, kelvin: Ar, temperature: Ar });
Bt.format.temp = Bt.format.kelvin = Bt.format.temperature = Qn;
vt.prototype.oklch = function() {
  return Un(this._rgb);
};
const Ga = (...n) => new vt(...n, "oklch");
Object.assign(Gt, { oklch: Ga });
Bt.format.oklch = zn;
Bt.autodetect.push({
  p: 2,
  test: (...n) => {
    if (n = Ft(n, "oklch"), qt(n) === "array" && n.length === 3)
      return "oklch";
  }
});
Object.assign(Gt, {
  analyze: Bn,
  average: Ho,
  bezier: Jo,
  blend: me,
  brewer: La,
  Color: vt,
  colors: De,
  contrast: _a,
  contrastAPCA: Ea,
  cubehelix: ua,
  deltaE: xa,
  distance: Pa,
  input: Bt,
  interpolate: je,
  limits: Fn,
  mix: je,
  random: ya,
  scale: lr,
  scales: Oa,
  valid: Ra
});
var se = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function er(n) {
  throw new Error('Could not dynamically require "' + n + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
}
var Ha = { exports: {} };
(function(n, r) {
  (function(t) {
    n.exports = t();
  })(function() {
    return (/* @__PURE__ */ (function() {
      function t(a, e, i) {
        function o(p, f) {
          if (!e[p]) {
            if (!a[p]) {
              var d = typeof er == "function" && er;
              if (!f && d)
                return d(p, !0);
              if (u)
                return u(p, !0);
              var s = new Error("Cannot find module '" + p + "'");
              throw s.code = "MODULE_NOT_FOUND", s;
            }
            var g = e[p] = { exports: {} };
            a[p][0].call(g.exports, function(m) {
              var y = a[p][1][m];
              return o(y || m);
            }, g, g.exports, t, a, e, i);
          }
          return e[p].exports;
        }
        for (var u = typeof er == "function" && er, h = 0; h < i.length; h++)
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
            function(s, g, m, y) {
              if (y === g.length)
                throw new Error("Ran out of data");
              let w = g[y];
              s[m] = w, s[m + 1] = w, s[m + 2] = w, s[m + 3] = 255;
            },
            // 2 - LA
            // 0: 0, 1: 0, 2: 0, 3: 1
            function(s, g, m, y) {
              if (y + 1 >= g.length)
                throw new Error("Ran out of data");
              let w = g[y];
              s[m] = w, s[m + 1] = w, s[m + 2] = w, s[m + 3] = g[y + 1];
            },
            // 3 - RGB
            // 0: 0, 1: 1, 2: 2, 3: 0xff
            function(s, g, m, y) {
              if (y + 2 >= g.length)
                throw new Error("Ran out of data");
              s[m] = g[y], s[m + 1] = g[y + 1], s[m + 2] = g[y + 2], s[m + 3] = 255;
            },
            // 4 - RGBA
            // 0: 0, 1: 1, 2: 2, 3: 3
            function(s, g, m, y) {
              if (y + 3 >= g.length)
                throw new Error("Ran out of data");
              s[m] = g[y], s[m + 1] = g[y + 1], s[m + 2] = g[y + 2], s[m + 3] = g[y + 3];
            }
          ], h = [
            // 0 - dummy entry
            function() {
            },
            // 1 - L
            // 0: 0, 1: 0, 2: 0, 3: 0xff
            function(s, g, m, y) {
              let w = g[0];
              s[m] = w, s[m + 1] = w, s[m + 2] = w, s[m + 3] = y;
            },
            // 2 - LA
            // 0: 0, 1: 0, 2: 0, 3: 1
            function(s, g, m) {
              let y = g[0];
              s[m] = y, s[m + 1] = y, s[m + 2] = y, s[m + 3] = g[1];
            },
            // 3 - RGB
            // 0: 0, 1: 1, 2: 2, 3: 0xff
            function(s, g, m, y) {
              s[m] = g[0], s[m + 1] = g[1], s[m + 2] = g[2], s[m + 3] = y;
            },
            // 4 - RGBA
            // 0: 0, 1: 1, 2: 2, 3: 3
            function(s, g, m) {
              s[m] = g[0], s[m + 1] = g[1], s[m + 2] = g[2], s[m + 3] = g[3];
            }
          ];
          function p(s, g) {
            let m = [], y = 0;
            function w() {
              if (y === s.length)
                throw new Error("Ran out of data");
              let _ = s[y];
              y++;
              let E, x, C, F, L, I, R, v;
              switch (g) {
                default:
                  throw new Error("unrecognised depth");
                case 16:
                  R = s[y], y++, m.push((_ << 8) + R);
                  break;
                case 4:
                  R = _ & 15, v = _ >> 4, m.push(v, R);
                  break;
                case 2:
                  L = _ & 3, I = _ >> 2 & 3, R = _ >> 4 & 3, v = _ >> 6 & 3, m.push(v, R, I, L);
                  break;
                case 1:
                  E = _ & 1, x = _ >> 1 & 1, C = _ >> 2 & 1, F = _ >> 3 & 1, L = _ >> 4 & 1, I = _ >> 5 & 1, R = _ >> 6 & 1, v = _ >> 7 & 1, m.push(v, R, I, L, F, C, x, E);
                  break;
              }
            }
            return {
              get: function(_) {
                for (; m.length < _; )
                  w();
                let E = m.slice(0, _);
                return m = m.slice(_), E;
              },
              resetAfterLine: function() {
                m.length = 0;
              },
              end: function() {
                if (y !== s.length)
                  throw new Error("extra data found");
              }
            };
          }
          function f(s, g, m, y, w, _) {
            let E = s.width, x = s.height, C = s.index;
            for (let F = 0; F < x; F++)
              for (let L = 0; L < E; L++) {
                let I = m(L, F, C);
                u[y](g, w, I, _), _ += y;
              }
            return _;
          }
          function d(s, g, m, y, w, _) {
            let E = s.width, x = s.height, C = s.index;
            for (let F = 0; F < x; F++) {
              for (let L = 0; L < E; L++) {
                let I = w.get(y), R = m(L, F, C);
                h[y](g, I, R, _);
              }
              w.resetAfterLine();
            }
          }
          e.dataToBitMap = function(s, g) {
            let m = g.width, y = g.height, w = g.depth, _ = g.bpp, E = g.interlace, x;
            w !== 8 && (x = p(s, w));
            let C;
            w <= 8 ? C = i.alloc(m * y * 4) : C = new Uint16Array(m * y * 4);
            let F = Math.pow(2, w) - 1, L = 0, I, R;
            if (E)
              I = o.getImagePasses(m, y), R = o.getInterlaceIterator(m, y);
            else {
              let v = 0;
              R = function() {
                let D = v;
                return v += 4, D;
              }, I = [{ width: m, height: y }];
            }
            for (let v = 0; v < I.length; v++)
              w === 8 ? L = f(
                I[v],
                C,
                R,
                _,
                s,
                L
              ) : d(
                I[v],
                C,
                R,
                _,
                x,
                F
              );
            if (w === 8) {
              if (L !== s.length)
                throw new Error("extra data found");
            } else
              x.end();
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
              let F = (function() {
                let L = new ArrayBuffer(2);
                return new DataView(L).setInt16(
                  0,
                  256,
                  !0
                  /* littleEndian */
                ), new Int16Array(L)[0] !== 256;
              })();
              if (f.bitDepth === 8 || f.bitDepth === 16 && F)
                return u;
            }
            let s = f.bitDepth !== 16 ? u : new Uint16Array(u.buffer), g = 255, m = o.COLORTYPE_TO_BPP_MAP[f.inputColorType];
            m === 4 && !f.inputHasAlpha && (m = 3);
            let y = o.COLORTYPE_TO_BPP_MAP[f.colorType];
            f.bitDepth === 16 && (g = 65535, y *= 2);
            let w = i.alloc(h * p * y), _ = 0, E = 0, x = f.bgColor || {};
            x.red === void 0 && (x.red = g), x.green === void 0 && (x.green = g), x.blue === void 0 && (x.blue = g);
            function C() {
              let F, L, I, R = g;
              switch (f.inputColorType) {
                case o.COLORTYPE_COLOR_ALPHA:
                  R = s[_ + 3], F = s[_], L = s[_ + 1], I = s[_ + 2];
                  break;
                case o.COLORTYPE_COLOR:
                  F = s[_], L = s[_ + 1], I = s[_ + 2];
                  break;
                case o.COLORTYPE_ALPHA:
                  R = s[_ + 1], F = s[_], L = F, I = F;
                  break;
                case o.COLORTYPE_GRAYSCALE:
                  F = s[_], L = F, I = F;
                  break;
                default:
                  throw new Error(
                    "input color type:" + f.inputColorType + " is not supported at present"
                  );
              }
              return f.inputHasAlpha && (d || (R /= g, F = Math.min(
                Math.max(Math.round((1 - R) * x.red + R * F), 0),
                g
              ), L = Math.min(
                Math.max(Math.round((1 - R) * x.green + R * L), 0),
                g
              ), I = Math.min(
                Math.max(Math.round((1 - R) * x.blue + R * I), 0),
                g
              ))), { red: F, green: L, blue: I, alpha: R };
            }
            for (let F = 0; F < p; F++)
              for (let L = 0; L < h; L++) {
                let I = C();
                switch (f.colorType) {
                  case o.COLORTYPE_COLOR_ALPHA:
                  case o.COLORTYPE_COLOR:
                    f.bitDepth === 8 ? (w[E] = I.red, w[E + 1] = I.green, w[E + 2] = I.blue, d && (w[E + 3] = I.alpha)) : (w.writeUInt16BE(I.red, E), w.writeUInt16BE(I.green, E + 2), w.writeUInt16BE(I.blue, E + 4), d && w.writeUInt16BE(I.alpha, E + 6));
                    break;
                  case o.COLORTYPE_ALPHA:
                  case o.COLORTYPE_GRAYSCALE: {
                    let R = (I.red + I.green + I.blue) / 3;
                    f.bitDepth === 8 ? (w[E] = R, d && (w[E + 1] = I.alpha)) : (w.writeUInt16BE(R, E), d && w.writeUInt16BE(I.alpha, E + 2));
                    break;
                  }
                  default:
                    throw new Error("unrecognised color Type " + f.colorType);
                }
                _ += m, E += y;
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
              let m = this._buffers[s++], y = Math.min(m.length, f.length - d);
              m.copy(g, d, 0, y), d += y, y !== m.length && (this._buffers[--s] = m.slice(y));
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
          function u(x, C, F, L, I) {
            for (let R = 0; R < F; R++)
              L[I + R] = x[C + R];
          }
          function h(x, C, F) {
            let L = 0, I = C + F;
            for (let R = C; R < I; R++)
              L += Math.abs(x[R]);
            return L;
          }
          function p(x, C, F, L, I, R) {
            for (let v = 0; v < F; v++) {
              let D = v >= R ? x[C + v - R] : 0, M = x[C + v] - D;
              L[I + v] = M;
            }
          }
          function f(x, C, F, L) {
            let I = 0;
            for (let R = 0; R < F; R++) {
              let v = R >= L ? x[C + R - L] : 0, D = x[C + R] - v;
              I += Math.abs(D);
            }
            return I;
          }
          function d(x, C, F, L, I) {
            for (let R = 0; R < F; R++) {
              let v = C > 0 ? x[C + R - F] : 0, D = x[C + R] - v;
              L[I + R] = D;
            }
          }
          function s(x, C, F) {
            let L = 0, I = C + F;
            for (let R = C; R < I; R++) {
              let v = C > 0 ? x[R - F] : 0, D = x[R] - v;
              L += Math.abs(D);
            }
            return L;
          }
          function g(x, C, F, L, I, R) {
            for (let v = 0; v < F; v++) {
              let D = v >= R ? x[C + v - R] : 0, M = C > 0 ? x[C + v - F] : 0, H = x[C + v] - (D + M >> 1);
              L[I + v] = H;
            }
          }
          function m(x, C, F, L) {
            let I = 0;
            for (let R = 0; R < F; R++) {
              let v = R >= L ? x[C + R - L] : 0, D = C > 0 ? x[C + R - F] : 0, M = x[C + R] - (v + D >> 1);
              I += Math.abs(M);
            }
            return I;
          }
          function y(x, C, F, L, I, R) {
            for (let v = 0; v < F; v++) {
              let D = v >= R ? x[C + v - R] : 0, M = C > 0 ? x[C + v - F] : 0, H = C > 0 && v >= R ? x[C + v - (F + R)] : 0, Y = x[C + v] - o(D, M, H);
              L[I + v] = Y;
            }
          }
          function w(x, C, F, L) {
            let I = 0;
            for (let R = 0; R < F; R++) {
              let v = R >= L ? x[C + R - L] : 0, D = C > 0 ? x[C + R - F] : 0, M = C > 0 && R >= L ? x[C + R - (F + L)] : 0, H = x[C + R] - o(v, D, M);
              I += Math.abs(H);
            }
            return I;
          }
          let _ = {
            0: u,
            1: p,
            2: d,
            3: g,
            4: y
          }, E = {
            0: h,
            1: f,
            2: s,
            3: m,
            4: w
          };
          a.exports = function(x, C, F, L, I) {
            let R;
            if (!("filterType" in L) || L.filterType === -1)
              R = [0, 1, 2, 3, 4];
            else if (typeof L.filterType == "number")
              R = [L.filterType];
            else
              throw new Error("unrecognised filter types");
            L.bitDepth === 16 && (I *= 2);
            let v = C * I, D = 0, M = 0, H = i.alloc((v + 1) * F), Y = R[0];
            for (let Q = 0; Q < F; Q++) {
              if (R.length > 1) {
                let st = 1 / 0;
                for (let j = 0; j < R.length; j++) {
                  let S = E[R[j]](x, M, v, I);
                  S < st && (Y = R[j], st = S);
                }
              }
              H[D] = Y, D++, _[Y](x, M, v, H, D, I), D += v, M += v;
            }
            return H;
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
            let s = f.width, g = f.height, m = f.interlace, y = f.bpp, w = f.depth;
            if (this.read = d.read, this.write = d.write, this.complete = d.complete, this._imageIndex = 0, this._images = [], m) {
              let _ = o.getImagePasses(s, g);
              for (let E = 0; E < _.length; E++)
                this._images.push({
                  byteWidth: h(_[E].width, y, w),
                  height: _[E].height,
                  lineIndex: 0
                });
            } else
              this._images.push({
                byteWidth: h(s, y, w),
                height: g,
                lineIndex: 0
              });
            w === 8 ? this._xComparison = y : w === 16 ? this._xComparison = y * 2 : this._xComparison = 1;
          };
          p.prototype.start = function() {
            this.read(
              this._images[this._imageIndex].byteWidth + 1,
              this._reverseFilterLine.bind(this)
            );
          }, p.prototype._unFilterType1 = function(f, d, s) {
            let g = this._xComparison, m = g - 1;
            for (let y = 0; y < s; y++) {
              let w = f[1 + y], _ = y > m ? d[y - g] : 0;
              d[y] = w + _;
            }
          }, p.prototype._unFilterType2 = function(f, d, s) {
            let g = this._lastLine;
            for (let m = 0; m < s; m++) {
              let y = f[1 + m], w = g ? g[m] : 0;
              d[m] = y + w;
            }
          }, p.prototype._unFilterType3 = function(f, d, s) {
            let g = this._xComparison, m = g - 1, y = this._lastLine;
            for (let w = 0; w < s; w++) {
              let _ = f[1 + w], E = y ? y[w] : 0, x = w > m ? d[w - g] : 0, C = Math.floor((x + E) / 2);
              d[w] = _ + C;
            }
          }, p.prototype._unFilterType4 = function(f, d, s) {
            let g = this._xComparison, m = g - 1, y = this._lastLine;
            for (let w = 0; w < s; w++) {
              let _ = f[1 + w], E = y ? y[w] : 0, x = w > m ? d[w - g] : 0, C = w > m && y ? y[w - g] : 0, F = u(x, E, C);
              d[w] = _ + F;
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
            for (let y = 0; y < s; y++)
              for (let w = 0; w < d; w++) {
                let _ = g[p[m]];
                if (!_)
                  throw new Error("index " + p[m] + " not in palette");
                for (let E = 0; E < 4; E++)
                  f[m + E] = _[E];
                m += 4;
              }
          }
          function u(p, f, d, s, g) {
            let m = 0;
            for (let y = 0; y < s; y++)
              for (let w = 0; w < d; w++) {
                let _ = !1;
                if (g.length === 1 ? g[0] === p[m] && (_ = !0) : g[0] === p[m] && g[1] === p[m + 1] && g[2] === p[m + 2] && (_ = !0), _)
                  for (let E = 0; E < 4; E++)
                    f[m + E] = 0;
                m += 4;
              }
          }
          function h(p, f, d, s, g) {
            let m = 255, y = Math.pow(2, g) - 1, w = 0;
            for (let _ = 0; _ < s; _++)
              for (let E = 0; E < d; E++) {
                for (let x = 0; x < 4; x++)
                  f[w + x] = Math.floor(
                    p[w + x] * m / y + 0.5
                  );
                w += 4;
              }
          }
          a.exports = function(p, f, d = !1) {
            let s = f.depth, g = f.width, m = f.height, y = f.colorType, w = f.transColor, _ = f.palette, E = p;
            return y === 3 ? o(p, E, g, m, _) : (w && u(p, E, g, m, w), s !== 8 && !d && (s === 16 && (E = i.alloc(g * m * 4)), h(p, E, g, m, s))), E;
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
          let m = i[g], y = d * m.x.length, w = s * m.y.length;
          for (let _ = 0; _ < m.x.length && m.x[_] < p; _++)
            y++;
          for (let _ = 0; _ < m.y.length && m.y[_] < f; _++)
            w++;
          y > 0 && w > 0 && h.push({ width: y, height: w, index: g });
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
            let y = this._packer.filterData(d, s, g);
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
            ), this._deflate.end(y);
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
            let y = g.filterData(
              f.data,
              f.width,
              f.height
            ), w = u.deflateSync(
              y,
              g.getDeflateOptions()
            );
            if (y = null, !w || !w.length)
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
            let y = h(s, g, m, this._options), w = o.COLORTYPE_TO_BPP_MAP[this._options.colorType];
            return p(y, g, m, this._options, w);
          }, d.prototype._packChunk = function(s, g) {
            let m = g ? g.length : 0, y = i.alloc(m + 12);
            return y.writeUInt32BE(m, 0), y.writeUInt32BE(s, 4), g && g.copy(y, 8), y.writeInt32BE(
              u.crc32(y.slice(4, y.length - 4)),
              y.length - 4
            ), y;
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
            let m = ((this._bitmapInfo.width * this._bitmapInfo.bpp * this._bitmapInfo.depth + 7 >> 3) + 1) * this._bitmapInfo.height, y = Math.max(m, o.Z_MIN_CHUNK);
            this._inflate = o.createInflate({ chunkSize: y });
            let w = m, _ = this.emit.bind(this, "error");
            this._inflate.on("error", function(x) {
              w && _(x);
            }), this._filter.on("complete", this._complete.bind(this));
            let E = this._filter.write.bind(this._filter);
            this._inflate.on("data", function(x) {
              w && (x.length > w && (x = x.slice(0, w)), w -= x.length, E(x));
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
          let y = f.dataToBitMap(g, this._bitmapInfo);
          m = d(
            y,
            this._bitmapInfo,
            this._options.skipRescale
          ), y = null;
        } catch (y) {
          this._handleError(y);
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
          a.exports = function(m, y) {
            if (!o)
              throw new Error(
                "To use the sync capability of this library in old node versions, please pin pngjs to v2.3.0"
              );
            let w;
            function _(S) {
              w = S;
            }
            let E;
            function x(S) {
              E = S;
            }
            function C(S) {
              E.transColor = S;
            }
            function F(S) {
              E.palette = S;
            }
            function L() {
              E.alpha = !0;
            }
            let I;
            function R(S) {
              I = S;
            }
            let v = [];
            function D(S) {
              v.push(S);
            }
            let M = new p(m);
            if (new d(y, {
              read: M.read.bind(M),
              error: _,
              metadata: x,
              gamma: R,
              palette: F,
              transColor: C,
              inflateData: D,
              simpleTransparency: L
            }).start(), M.process(), w)
              throw w;
            let H = i.concat(v);
            v.length = 0;
            let Y;
            if (E.interlace)
              Y = u.inflateSync(H);
            else {
              let S = ((E.width * E.bpp * E.depth + 7 >> 3) + 1) * E.height;
              Y = h(H, {
                chunkSize: S,
                maxLength: S
              });
            }
            if (H = null, !Y || !Y.length)
              throw new Error("bad png - invalid inflate data response");
            let Q = f.process(Y, E);
            H = null;
            let st = s.dataToBitMap(Q, E);
            Q = null;
            let j = g(
              st,
              E,
              y.skipRescale
            );
            return E.data = j, E.gamma = I || 0, E;
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
            let f = p.readUInt32BE(0), d = p.readUInt32BE(4), s = p[8], g = p[9], m = p[10], y = p[11], w = p[12];
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
            if (y !== 0) {
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
              let y, w;
              y = (function(_) {
                this.removeListener("error", w), this.data = _, m(null, this);
              }).bind(this), w = (function(_) {
                this.removeListener("parsed", y), m(_, null);
              }).bind(this), this.once("parsed", y), this.once("error", w);
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
          }, s.bitblt = function(g, m, y, w, _, E, x, C) {
            if (y |= 0, w |= 0, _ |= 0, E |= 0, x |= 0, C |= 0, y > g.width || w > g.height || y + _ > g.width || w + E > g.height)
              throw new Error("bitblt reading outside image");
            if (x > m.width || C > m.height || x + _ > m.width || C + E > m.height)
              throw new Error("bitblt writing outside image");
            for (let F = 0; F < E; F++)
              g.data.copy(
                m.data,
                (C + F) * m.width + x << 2,
                (w + F) * g.width + y << 2,
                (w + F) * g.width + y + _ << 2
              );
          }, s.prototype.bitblt = function(g, m, y, w, _, E, x) {
            return s.bitblt(this, g, m, y, w, _, E, x), this;
          }, s.adjustGamma = function(g) {
            if (g.gamma) {
              for (let m = 0; m < g.height; m++)
                for (let y = 0; y < g.width; y++) {
                  let w = g.width * m + y << 2;
                  for (let _ = 0; _ < 3; _++) {
                    let E = g.data[w + _] / 255;
                    E = Math.pow(E, 1 / 2.2 / g.gamma), g.data[w + _] = Math.round(E * 255);
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
          d.prototype._processChunk = function(w, _, E) {
            if (typeof E == "function")
              return h.Inflate._processChunk.call(this, w, _, E);
            let x = this, C = w && w.length, F = this._chunkSize - this._offset, L = this._maxLength, I = 0, R = [], v = 0, D;
            this.on("error", function(Q) {
              D = Q;
            });
            function M(Q, st) {
              if (x._hadError)
                return;
              let j = F - st;
              if (u(j >= 0, "have should not go down"), j > 0) {
                let S = x._buffer.slice(x._offset, x._offset + j);
                if (x._offset += j, S.length > L && (S = S.slice(0, L)), R.push(S), v += S.length, L -= S.length, L === 0)
                  return !1;
              }
              return (st === 0 || x._offset >= x._chunkSize) && (F = x._chunkSize, x._offset = 0, x._buffer = o.allocUnsafe(x._chunkSize)), st === 0 ? (I += C - Q, C = Q, !0) : !1;
            }
            u(this._handle, "zlib binding closed");
            let H;
            do
              H = this._handle.writeSync(
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
                F
              ), H = H || this._writeState;
            while (!this._hadError && M(H[0], H[1]));
            if (this._hadError)
              throw D;
            if (v >= f)
              throw g(this), new RangeError(
                "Cannot create final Buffer. It would be larger than 0x" + f.toString(16) + " bytes"
              );
            let Y = o.concat(R, v);
            return g(this), Y;
          }, p.inherits(d, h.Inflate);
          function m(w, _) {
            if (typeof _ == "string" && (_ = o.from(_)), !(_ instanceof o))
              throw new TypeError("Not a string or buffer");
            let E = w._finishFlushFlag;
            return E == null && (E = h.Z_FINISH), w._processChunk(_, E);
          }
          function y(w, _) {
            return m(new d(_), w);
          }
          a.exports = e = y, e.Inflate = d, e.createInflate = s, e.inflateSync = y;
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
          function u(j, S) {
            if (j === S)
              return 0;
            for (var q = j.length, it = S.length, dt = 0, kt = Math.min(q, it); dt < kt; ++dt)
              if (j[dt] !== S[dt]) {
                q = j[dt], it = S[dt];
                break;
              }
            return q < it ? -1 : it < q ? 1 : 0;
          }
          function h(j) {
            return i.Buffer && typeof i.Buffer.isBuffer == "function" ? i.Buffer.isBuffer(j) : !!(j != null && j._isBuffer);
          }
          var p = t("util/"), f = Object.prototype.hasOwnProperty, d = Array.prototype.slice, s = (function() {
            return (function() {
            }).name === "foo";
          })();
          function g(j) {
            return Object.prototype.toString.call(j);
          }
          function m(j) {
            return h(j) || typeof i.ArrayBuffer != "function" ? !1 : typeof ArrayBuffer.isView == "function" ? ArrayBuffer.isView(j) : j ? !!(j instanceof DataView || j.buffer && j.buffer instanceof ArrayBuffer) : !1;
          }
          var y = a.exports = L, w = /\s*function\s+([^\(\s]*)\s*/;
          function _(j) {
            if (p.isFunction(j)) {
              if (s)
                return j.name;
              var S = j.toString(), q = S.match(w);
              return q && q[1];
            }
          }
          y.AssertionError = function(j) {
            this.name = "AssertionError", this.actual = j.actual, this.expected = j.expected, this.operator = j.operator, j.message ? (this.message = j.message, this.generatedMessage = !1) : (this.message = C(this), this.generatedMessage = !0);
            var S = j.stackStartFunction || F;
            if (Error.captureStackTrace)
              Error.captureStackTrace(this, S);
            else {
              var q = new Error();
              if (q.stack) {
                var it = q.stack, dt = _(S), kt = it.indexOf(`
` + dt);
                if (kt >= 0) {
                  var ot = it.indexOf(`
`, kt + 1);
                  it = it.substring(ot + 1);
                }
                this.stack = it;
              }
            }
          }, p.inherits(y.AssertionError, Error);
          function E(j, S) {
            return typeof j == "string" ? j.length < S ? j : j.slice(0, S) : j;
          }
          function x(j) {
            if (s || !p.isFunction(j))
              return p.inspect(j);
            var S = _(j), q = S ? ": " + S : "";
            return "[Function" + q + "]";
          }
          function C(j) {
            return E(x(j.actual), 128) + " " + j.operator + " " + E(x(j.expected), 128);
          }
          function F(j, S, q, it, dt) {
            throw new y.AssertionError({
              message: q,
              actual: j,
              expected: S,
              operator: it,
              stackStartFunction: dt
            });
          }
          y.fail = F;
          function L(j, S) {
            j || F(j, !0, S, "==", y.ok);
          }
          y.ok = L, y.equal = function(j, S, q) {
            j != S && F(j, S, q, "==", y.equal);
          }, y.notEqual = function(j, S, q) {
            j == S && F(j, S, q, "!=", y.notEqual);
          }, y.deepEqual = function(j, S, q) {
            I(j, S, !1) || F(j, S, q, "deepEqual", y.deepEqual);
          }, y.deepStrictEqual = function(j, S, q) {
            I(j, S, !0) || F(j, S, q, "deepStrictEqual", y.deepStrictEqual);
          };
          function I(j, S, q, it) {
            if (j === S)
              return !0;
            if (h(j) && h(S))
              return u(j, S) === 0;
            if (p.isDate(j) && p.isDate(S))
              return j.getTime() === S.getTime();
            if (p.isRegExp(j) && p.isRegExp(S))
              return j.source === S.source && j.global === S.global && j.multiline === S.multiline && j.lastIndex === S.lastIndex && j.ignoreCase === S.ignoreCase;
            if ((j === null || typeof j != "object") && (S === null || typeof S != "object"))
              return q ? j === S : j == S;
            if (m(j) && m(S) && g(j) === g(S) && !(j instanceof Float32Array || j instanceof Float64Array))
              return u(
                new Uint8Array(j.buffer),
                new Uint8Array(S.buffer)
              ) === 0;
            if (h(j) !== h(S))
              return !1;
            it = it || { actual: [], expected: [] };
            var dt = it.actual.indexOf(j);
            return dt !== -1 && dt === it.expected.indexOf(S) ? !0 : (it.actual.push(j), it.expected.push(S), v(j, S, q, it));
          }
          function R(j) {
            return Object.prototype.toString.call(j) == "[object Arguments]";
          }
          function v(j, S, q, it) {
            if (j == null || S === null || S === void 0)
              return !1;
            if (p.isPrimitive(j) || p.isPrimitive(S))
              return j === S;
            if (q && Object.getPrototypeOf(j) !== Object.getPrototypeOf(S))
              return !1;
            var dt = R(j), kt = R(S);
            if (dt && !kt || !dt && kt)
              return !1;
            if (dt)
              return j = d.call(j), S = d.call(S), I(j, S, q);
            var ot = st(j), U = st(S), G, $;
            if (ot.length !== U.length)
              return !1;
            for (ot.sort(), U.sort(), $ = ot.length - 1; $ >= 0; $--)
              if (ot[$] !== U[$])
                return !1;
            for ($ = ot.length - 1; $ >= 0; $--)
              if (G = ot[$], !I(j[G], S[G], q, it))
                return !1;
            return !0;
          }
          y.notDeepEqual = function(j, S, q) {
            I(j, S, !1) && F(j, S, q, "notDeepEqual", y.notDeepEqual);
          }, y.notDeepStrictEqual = D;
          function D(j, S, q) {
            I(j, S, !0) && F(j, S, q, "notDeepStrictEqual", D);
          }
          y.strictEqual = function(j, S, q) {
            j !== S && F(j, S, q, "===", y.strictEqual);
          }, y.notStrictEqual = function(j, S, q) {
            j === S && F(j, S, q, "!==", y.notStrictEqual);
          };
          function M(j, S) {
            if (!j || !S)
              return !1;
            if (Object.prototype.toString.call(S) == "[object RegExp]")
              return S.test(j);
            try {
              if (j instanceof S)
                return !0;
            } catch {
            }
            return Error.isPrototypeOf(S) ? !1 : S.call({}, j) === !0;
          }
          function H(j) {
            var S;
            try {
              j();
            } catch (q) {
              S = q;
            }
            return S;
          }
          function Y(j, S, q, it) {
            var dt;
            if (typeof S != "function")
              throw new TypeError('"block" argument must be a function');
            typeof q == "string" && (it = q, q = null), dt = H(S), it = (q && q.name ? " (" + q.name + ")." : ".") + (it ? " " + it : "."), j && !dt && F(dt, q, "Missing expected exception" + it);
            var kt = typeof it == "string", ot = !j && p.isError(dt), U = !j && dt && !q;
            if ((ot && kt && M(dt, q) || U) && F(dt, q, "Got unwanted exception" + it), j && dt && q && !M(dt, q) || !j && dt)
              throw dt;
          }
          y.throws = function(j, S, q) {
            Y(!0, j, S, q);
          }, y.doesNotThrow = function(j, S, q) {
            Y(!1, j, S, q);
          }, y.ifError = function(j) {
            if (j)
              throw j;
          };
          function Q(j, S) {
            j || F(j, !0, S, "==", Q);
          }
          y.strict = o(Q, y, {
            equal: y.strictEqual,
            deepEqual: y.deepStrictEqual,
            notEqual: y.notStrictEqual,
            notDeepEqual: y.notDeepStrictEqual
          }), y.strict.strict = y.strict;
          var st = Object.keys || function(j) {
            var S = [];
            for (var q in j)
              f.call(j, q) && S.push(q);
            return S;
          };
        }).call(this);
      }).call(this, typeof se < "u" ? se : typeof self < "u" ? self : typeof window < "u" ? window : {});
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
              for (var G = [], $ = 0; $ < arguments.length; $++)
                G.push(f(arguments[$]));
              return G.join(" ");
            }
            for (var $ = 1, ct = arguments, W = ct.length, X = String(U).replace(u, function(gt) {
              if (gt === "%%")
                return "%";
              if ($ >= W)
                return gt;
              switch (gt) {
                case "%s":
                  return String(ct[$++]);
                case "%d":
                  return Number(ct[$++]);
                case "%j":
                  try {
                    return JSON.stringify(ct[$++]);
                  } catch {
                    return "[Circular]";
                  }
                default:
                  return gt;
              }
            }), tt = ct[$]; $ < W; tt = ct[++$])
              L(tt) || !Y(tt) ? X += " " + tt : X += " " + f(tt);
            return X;
          }, e.deprecate = function(U, G) {
            if (M(o.process))
              return function() {
                return e.deprecate(U, G).apply(this, arguments);
              };
            if (i.noDeprecation === !0)
              return U;
            var $ = !1;
            function ct() {
              if (!$) {
                if (i.throwDeprecation)
                  throw new Error(G);
                i.traceDeprecation ? console.trace(G) : console.error(G), $ = !0;
              }
              return U.apply(this, arguments);
            }
            return ct;
          };
          var h = {}, p;
          e.debuglog = function(U) {
            if (M(p) && (p = i.env.NODE_DEBUG || ""), U = U.toUpperCase(), !h[U])
              if (new RegExp("\\b" + U + "\\b", "i").test(p)) {
                var G = i.pid;
                h[U] = function() {
                  var $ = e.format.apply(e, arguments);
                  console.error("%s %d: %s", U, G, $);
                };
              } else
                h[U] = function() {
                };
            return h[U];
          };
          function f(U, G) {
            var $ = {
              seen: [],
              stylize: s
            };
            return arguments.length >= 3 && ($.depth = arguments[2]), arguments.length >= 4 && ($.colors = arguments[3]), F(G) ? $.showHidden = G : G && e._extend($, G), M($.showHidden) && ($.showHidden = !1), M($.depth) && ($.depth = 2), M($.colors) && ($.colors = !1), M($.customInspect) && ($.customInspect = !0), $.colors && ($.stylize = d), m($, U, $.depth);
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
          function d(U, G) {
            var $ = f.styles[G];
            return $ ? "\x1B[" + f.colors[$][0] + "m" + U + "\x1B[" + f.colors[$][1] + "m" : U;
          }
          function s(U, G) {
            return U;
          }
          function g(U) {
            var G = {};
            return U.forEach(function($, ct) {
              G[$] = !0;
            }), G;
          }
          function m(U, G, $) {
            if (U.customInspect && G && j(G.inspect) && // Filter out the util module, it's inspect function is special
            G.inspect !== e.inspect && // Also filter out any prototype objects using the circular check.
            !(G.constructor && G.constructor.prototype === G)) {
              var ct = G.inspect($, U);
              return v(ct) || (ct = m(U, ct, $)), ct;
            }
            var W = y(U, G);
            if (W)
              return W;
            var X = Object.keys(G), tt = g(X);
            if (U.showHidden && (X = Object.getOwnPropertyNames(G)), st(G) && (X.indexOf("message") >= 0 || X.indexOf("description") >= 0))
              return w(G);
            if (X.length === 0) {
              if (j(G)) {
                var ut = G.name ? ": " + G.name : "";
                return U.stylize("[Function" + ut + "]", "special");
              }
              if (H(G))
                return U.stylize(RegExp.prototype.toString.call(G), "regexp");
              if (Q(G))
                return U.stylize(Date.prototype.toString.call(G), "date");
              if (st(G))
                return w(G);
            }
            var gt = "", mt = !1, z = ["{", "}"];
            if (C(G) && (mt = !0, z = ["[", "]"]), j(G)) {
              var J = G.name ? ": " + G.name : "";
              gt = " [Function" + J + "]";
            }
            if (H(G) && (gt = " " + RegExp.prototype.toString.call(G)), Q(G) && (gt = " " + Date.prototype.toUTCString.call(G)), st(G) && (gt = " " + w(G)), X.length === 0 && (!mt || G.length == 0))
              return z[0] + gt + z[1];
            if ($ < 0)
              return H(G) ? U.stylize(RegExp.prototype.toString.call(G), "regexp") : U.stylize("[Object]", "special");
            U.seen.push(G);
            var nt;
            return mt ? nt = _(U, G, $, tt, X) : nt = X.map(function(St) {
              return E(U, G, $, tt, St, mt);
            }), U.seen.pop(), x(nt, gt, z);
          }
          function y(U, G) {
            if (M(G))
              return U.stylize("undefined", "undefined");
            if (v(G)) {
              var $ = "'" + JSON.stringify(G).replace(/^"|"$/g, "").replace(/'/g, "\\'").replace(/\\"/g, '"') + "'";
              return U.stylize($, "string");
            }
            if (R(G))
              return U.stylize("" + G, "number");
            if (F(G))
              return U.stylize("" + G, "boolean");
            if (L(G))
              return U.stylize("null", "null");
          }
          function w(U) {
            return "[" + Error.prototype.toString.call(U) + "]";
          }
          function _(U, G, $, ct, W) {
            for (var X = [], tt = 0, ut = G.length; tt < ut; ++tt)
              ot(G, String(tt)) ? X.push(E(
                U,
                G,
                $,
                ct,
                String(tt),
                !0
              )) : X.push("");
            return W.forEach(function(gt) {
              gt.match(/^\d+$/) || X.push(E(
                U,
                G,
                $,
                ct,
                gt,
                !0
              ));
            }), X;
          }
          function E(U, G, $, ct, W, X) {
            var tt, ut, gt;
            if (gt = Object.getOwnPropertyDescriptor(G, W) || { value: G[W] }, gt.get ? gt.set ? ut = U.stylize("[Getter/Setter]", "special") : ut = U.stylize("[Getter]", "special") : gt.set && (ut = U.stylize("[Setter]", "special")), ot(ct, W) || (tt = "[" + W + "]"), ut || (U.seen.indexOf(gt.value) < 0 ? (L($) ? ut = m(U, gt.value, null) : ut = m(U, gt.value, $ - 1), ut.indexOf(`
`) > -1 && (X ? ut = ut.split(`
`).map(function(mt) {
              return "  " + mt;
            }).join(`
`).substr(2) : ut = `
` + ut.split(`
`).map(function(mt) {
              return "   " + mt;
            }).join(`
`))) : ut = U.stylize("[Circular]", "special")), M(tt)) {
              if (X && W.match(/^\d+$/))
                return ut;
              tt = JSON.stringify("" + W), tt.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/) ? (tt = tt.substr(1, tt.length - 2), tt = U.stylize(tt, "name")) : (tt = tt.replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'"), tt = U.stylize(tt, "string"));
            }
            return tt + ": " + ut;
          }
          function x(U, G, $) {
            var ct = U.reduce(function(W, X) {
              return X.indexOf(`
`) >= 0, W + X.replace(/\u001b\[\d\d?m/g, "").length + 1;
            }, 0);
            return ct > 60 ? $[0] + (G === "" ? "" : G + `
 `) + " " + U.join(`,
  `) + " " + $[1] : $[0] + G + " " + U.join(", ") + " " + $[1];
          }
          function C(U) {
            return Array.isArray(U);
          }
          e.isArray = C;
          function F(U) {
            return typeof U == "boolean";
          }
          e.isBoolean = F;
          function L(U) {
            return U === null;
          }
          e.isNull = L;
          function I(U) {
            return U == null;
          }
          e.isNullOrUndefined = I;
          function R(U) {
            return typeof U == "number";
          }
          e.isNumber = R;
          function v(U) {
            return typeof U == "string";
          }
          e.isString = v;
          function D(U) {
            return typeof U == "symbol";
          }
          e.isSymbol = D;
          function M(U) {
            return U === void 0;
          }
          e.isUndefined = M;
          function H(U) {
            return Y(U) && q(U) === "[object RegExp]";
          }
          e.isRegExp = H;
          function Y(U) {
            return typeof U == "object" && U !== null;
          }
          e.isObject = Y;
          function Q(U) {
            return Y(U) && q(U) === "[object Date]";
          }
          e.isDate = Q;
          function st(U) {
            return Y(U) && (q(U) === "[object Error]" || U instanceof Error);
          }
          e.isError = st;
          function j(U) {
            return typeof U == "function";
          }
          e.isFunction = j;
          function S(U) {
            return U === null || typeof U == "boolean" || typeof U == "number" || typeof U == "string" || typeof U == "symbol" || // ES6 symbol
            typeof U > "u";
          }
          e.isPrimitive = S, e.isBuffer = t("./support/isBuffer");
          function q(U) {
            return Object.prototype.toString.call(U);
          }
          function it(U) {
            return U < 10 ? "0" + U.toString(10) : U.toString(10);
          }
          var dt = [
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
          function kt() {
            var U = /* @__PURE__ */ new Date(), G = [
              it(U.getHours()),
              it(U.getMinutes()),
              it(U.getSeconds())
            ].join(":");
            return [U.getDate(), dt[U.getMonth()], G].join(" ");
          }
          e.log = function() {
            console.log("%s - %s", kt(), e.format.apply(e, arguments));
          }, e.inherits = t("inherits"), e._extend = function(U, G) {
            if (!G || !Y(G))
              return U;
            for (var $ = Object.keys(G), ct = $.length; ct--; )
              U[$[ct]] = G[$[ct]];
            return U;
          };
          function ot(U, G) {
            return Object.prototype.hasOwnProperty.call(U, G);
          }
        }).call(this);
      }).call(this, t("_process"), typeof se < "u" ? se : typeof self < "u" ? self : typeof window < "u" ? window : {});
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
      }).call(this, typeof se < "u" ? se : typeof self < "u" ? self : typeof window < "u" ? window : {});
    }, {}], 28: [function(t, a, e) {
      e.byteLength = s, e.toByteArray = m, e.fromByteArray = _;
      for (var i = [], o = [], u = typeof Uint8Array < "u" ? Uint8Array : Array, h = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", p = 0, f = h.length; p < f; ++p)
        i[p] = h[p], o[h.charCodeAt(p)] = p;
      o[45] = 62, o[95] = 63;
      function d(E) {
        var x = E.length;
        if (x % 4 > 0)
          throw new Error("Invalid string. Length must be a multiple of 4");
        var C = E.indexOf("=");
        C === -1 && (C = x);
        var F = C === x ? 0 : 4 - C % 4;
        return [C, F];
      }
      function s(E) {
        var x = d(E), C = x[0], F = x[1];
        return (C + F) * 3 / 4 - F;
      }
      function g(E, x, C) {
        return (x + C) * 3 / 4 - C;
      }
      function m(E) {
        var x, C = d(E), F = C[0], L = C[1], I = new u(g(E, F, L)), R = 0, v = L > 0 ? F - 4 : F, D;
        for (D = 0; D < v; D += 4)
          x = o[E.charCodeAt(D)] << 18 | o[E.charCodeAt(D + 1)] << 12 | o[E.charCodeAt(D + 2)] << 6 | o[E.charCodeAt(D + 3)], I[R++] = x >> 16 & 255, I[R++] = x >> 8 & 255, I[R++] = x & 255;
        return L === 2 && (x = o[E.charCodeAt(D)] << 2 | o[E.charCodeAt(D + 1)] >> 4, I[R++] = x & 255), L === 1 && (x = o[E.charCodeAt(D)] << 10 | o[E.charCodeAt(D + 1)] << 4 | o[E.charCodeAt(D + 2)] >> 2, I[R++] = x >> 8 & 255, I[R++] = x & 255), I;
      }
      function y(E) {
        return i[E >> 18 & 63] + i[E >> 12 & 63] + i[E >> 6 & 63] + i[E & 63];
      }
      function w(E, x, C) {
        for (var F, L = [], I = x; I < C; I += 3)
          F = (E[I] << 16 & 16711680) + (E[I + 1] << 8 & 65280) + (E[I + 2] & 255), L.push(y(F));
        return L.join("");
      }
      function _(E) {
        for (var x, C = E.length, F = C % 3, L = [], I = 16383, R = 0, v = C - F; R < v; R += I)
          L.push(w(E, R, R + I > v ? v : R + I));
        return F === 1 ? (x = E[C - 1], L.push(
          i[x >> 2] + i[x << 4 & 63] + "=="
        )) : F === 2 && (x = (E[C - 2] << 8) + E[C - 1], L.push(
          i[x >> 10] + i[x >> 4 & 63] + i[x << 2 & 63] + "="
        )), L.join("");
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
          function y(w) {
            if (typeof w != "number" || w < e.DEFLATE || w > e.UNZIP)
              throw new TypeError("Bad argument");
            this.dictionary = null, this.err = 0, this.flush = 0, this.init_done = !1, this.level = 0, this.memLevel = 0, this.mode = w, this.strategy = 0, this.windowBits = 0, this.write_in_progress = !1, this.pending_close = !1, this.gzip_id_bytes_read = 0;
          }
          y.prototype.close = function() {
            if (this.write_in_progress) {
              this.pending_close = !0;
              return;
            }
            this.pending_close = !1, u(this.init_done, "close before init"), u(this.mode <= e.UNZIP), this.mode === e.DEFLATE || this.mode === e.GZIP || this.mode === e.DEFLATERAW ? p.deflateEnd(this.strm) : (this.mode === e.INFLATE || this.mode === e.GUNZIP || this.mode === e.INFLATERAW || this.mode === e.UNZIP) && f.inflateEnd(this.strm), this.mode = e.NONE, this.dictionary = null;
          }, y.prototype.write = function(w, _, E, x, C, F, L) {
            return this._write(!0, w, _, E, x, C, F, L);
          }, y.prototype.writeSync = function(w, _, E, x, C, F, L) {
            return this._write(!1, w, _, E, x, C, F, L);
          }, y.prototype._write = function(w, _, E, x, C, F, L, I) {
            if (u.equal(arguments.length, 8), u(this.init_done, "write before init"), u(this.mode !== e.NONE, "already finalized"), u.equal(!1, this.write_in_progress, "write already in progress"), u.equal(!1, this.pending_close, "close is pending"), this.write_in_progress = !0, u.equal(!1, _ === void 0, "must provide flush value"), this.write_in_progress = !0, _ !== e.Z_NO_FLUSH && _ !== e.Z_PARTIAL_FLUSH && _ !== e.Z_SYNC_FLUSH && _ !== e.Z_FULL_FLUSH && _ !== e.Z_FINISH && _ !== e.Z_BLOCK)
              throw new Error("Invalid flush value");
            if (E == null && (E = o.alloc(0), C = 0, x = 0), this.strm.avail_in = C, this.strm.input = E, this.strm.next_in = x, this.strm.avail_out = I, this.strm.output = F, this.strm.next_out = L, this.flush = _, !w)
              return this._process(), this._checkError() ? this._afterSync() : void 0;
            var R = this;
            return i.nextTick(function() {
              R._process(), R._after();
            }), this;
          }, y.prototype._afterSync = function() {
            var w = this.strm.avail_out, _ = this.strm.avail_in;
            return this.write_in_progress = !1, [_, w];
          }, y.prototype._process = function() {
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
          }, y.prototype._checkError = function() {
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
          }, y.prototype._after = function() {
            if (this._checkError()) {
              var w = this.strm.avail_out, _ = this.strm.avail_in;
              this.write_in_progress = !1, this.callback(_, w), this.pending_close && this.close();
            }
          }, y.prototype._error = function(w) {
            this.strm.msg && (w = this.strm.msg), this.onerror(
              w,
              this.err
              // no hope of rescue.
            ), this.write_in_progress = !1, this.pending_close && this.close();
          }, y.prototype.init = function(w, _, E, x, C) {
            u(arguments.length === 4 || arguments.length === 5, "init(windowBits, level, memLevel, strategy, [dictionary])"), u(w >= 8 && w <= 15, "invalid windowBits"), u(_ >= -1 && _ <= 9, "invalid compression level"), u(E >= 1 && E <= 9, "invalid memlevel"), u(x === e.Z_FILTERED || x === e.Z_HUFFMAN_ONLY || x === e.Z_RLE || x === e.Z_FIXED || x === e.Z_DEFAULT_STRATEGY, "invalid strategy"), this._init(_, w, E, x, C), this._setDictionary();
          }, y.prototype.params = function() {
            throw new Error("deflateParams Not supported");
          }, y.prototype.reset = function() {
            this._reset(), this._setDictionary();
          }, y.prototype._init = function(w, _, E, x, C) {
            switch (this.level = w, this.windowBits = _, this.memLevel = E, this.strategy = x, this.flush = e.Z_NO_FLUSH, this.err = e.Z_OK, (this.mode === e.GZIP || this.mode === e.GUNZIP) && (this.windowBits += 16), this.mode === e.UNZIP && (this.windowBits += 32), (this.mode === e.DEFLATERAW || this.mode === e.INFLATERAW) && (this.windowBits = -1 * this.windowBits), this.strm = new h(), this.mode) {
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
          }, y.prototype._setDictionary = function() {
            if (this.dictionary != null) {
              switch (this.err = e.Z_OK, this.mode) {
                case e.DEFLATE:
                case e.DEFLATERAW:
                  this.err = p.deflateSetDictionary(this.strm, this.dictionary);
                  break;
              }
              this.err !== e.Z_OK && this._error("Failed to set dictionary");
            }
          }, y.prototype._reset = function() {
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
          }, e.Zlib = y;
        }).call(this);
      }).call(this, t("_process"), t("buffer").Buffer);
    }, { _process: 63, assert: 23, buffer: 32, "pako/lib/zlib/constants": 54, "pako/lib/zlib/deflate.js": 56, "pako/lib/zlib/inflate.js": 58, "pako/lib/zlib/zstream": 62 }], 31: [function(t, a, e) {
      (function(i) {
        (function() {
          var o = t("buffer").Buffer, u = t("stream").Transform, h = t("./binding"), p = t("util"), f = t("assert").ok, d = t("buffer").kMaxLength, s = "Cannot create final Buffer. It would be larger than 0x" + d.toString(16) + " bytes";
          h.Z_MIN_WINDOWBITS = 8, h.Z_MAX_WINDOWBITS = 15, h.Z_DEFAULT_WINDOWBITS = 15, h.Z_MIN_CHUNK = 64, h.Z_MAX_CHUNK = 1 / 0, h.Z_DEFAULT_CHUNK = 16 * 1024, h.Z_MIN_MEMLEVEL = 1, h.Z_MAX_MEMLEVEL = 9, h.Z_DEFAULT_MEMLEVEL = 8, h.Z_MIN_LEVEL = -1, h.Z_MAX_LEVEL = 9, h.Z_DEFAULT_LEVEL = h.Z_DEFAULT_COMPRESSION;
          for (var g = Object.keys(h), m = 0; m < g.length; m++) {
            var y = g[m];
            y.match(/^Z/) && Object.defineProperty(e, y, {
              enumerable: !0,
              value: h[y],
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
          }, _ = Object.keys(w), E = 0; E < _.length; E++) {
            var x = _[E];
            w[w[x]] = x;
          }
          Object.defineProperty(e, "codes", {
            enumerable: !0,
            value: Object.freeze(w),
            writable: !1
          }), e.Deflate = L, e.Inflate = I, e.Gzip = R, e.Gunzip = v, e.DeflateRaw = D, e.InflateRaw = M, e.Unzip = H, e.createDeflate = function(S) {
            return new L(S);
          }, e.createInflate = function(S) {
            return new I(S);
          }, e.createDeflateRaw = function(S) {
            return new D(S);
          }, e.createInflateRaw = function(S) {
            return new M(S);
          }, e.createGzip = function(S) {
            return new R(S);
          }, e.createGunzip = function(S) {
            return new v(S);
          }, e.createUnzip = function(S) {
            return new H(S);
          }, e.deflate = function(S, q, it) {
            return typeof q == "function" && (it = q, q = {}), C(new L(q), S, it);
          }, e.deflateSync = function(S, q) {
            return F(new L(q), S);
          }, e.gzip = function(S, q, it) {
            return typeof q == "function" && (it = q, q = {}), C(new R(q), S, it);
          }, e.gzipSync = function(S, q) {
            return F(new R(q), S);
          }, e.deflateRaw = function(S, q, it) {
            return typeof q == "function" && (it = q, q = {}), C(new D(q), S, it);
          }, e.deflateRawSync = function(S, q) {
            return F(new D(q), S);
          }, e.unzip = function(S, q, it) {
            return typeof q == "function" && (it = q, q = {}), C(new H(q), S, it);
          }, e.unzipSync = function(S, q) {
            return F(new H(q), S);
          }, e.inflate = function(S, q, it) {
            return typeof q == "function" && (it = q, q = {}), C(new I(q), S, it);
          }, e.inflateSync = function(S, q) {
            return F(new I(q), S);
          }, e.gunzip = function(S, q, it) {
            return typeof q == "function" && (it = q, q = {}), C(new v(q), S, it);
          }, e.gunzipSync = function(S, q) {
            return F(new v(q), S);
          }, e.inflateRaw = function(S, q, it) {
            return typeof q == "function" && (it = q, q = {}), C(new M(q), S, it);
          }, e.inflateRawSync = function(S, q) {
            return F(new M(q), S);
          };
          function C(S, q, it) {
            var dt = [], kt = 0;
            S.on("error", U), S.on("end", G), S.end(q), ot();
            function ot() {
              for (var $; ($ = S.read()) !== null; )
                dt.push($), kt += $.length;
              S.once("readable", ot);
            }
            function U($) {
              S.removeListener("end", G), S.removeListener("readable", ot), it($);
            }
            function G() {
              var $, ct = null;
              kt >= d ? ct = new RangeError(s) : $ = o.concat(dt, kt), dt = [], S.close(), it(ct, $);
            }
          }
          function F(S, q) {
            if (typeof q == "string" && (q = o.from(q)), !o.isBuffer(q))
              throw new TypeError("Not a string or buffer");
            var it = S._finishFlushFlag;
            return S._processChunk(q, it);
          }
          function L(S) {
            if (!(this instanceof L))
              return new L(S);
            Q.call(this, S, h.DEFLATE);
          }
          function I(S) {
            if (!(this instanceof I))
              return new I(S);
            Q.call(this, S, h.INFLATE);
          }
          function R(S) {
            if (!(this instanceof R))
              return new R(S);
            Q.call(this, S, h.GZIP);
          }
          function v(S) {
            if (!(this instanceof v))
              return new v(S);
            Q.call(this, S, h.GUNZIP);
          }
          function D(S) {
            if (!(this instanceof D))
              return new D(S);
            Q.call(this, S, h.DEFLATERAW);
          }
          function M(S) {
            if (!(this instanceof M))
              return new M(S);
            Q.call(this, S, h.INFLATERAW);
          }
          function H(S) {
            if (!(this instanceof H))
              return new H(S);
            Q.call(this, S, h.UNZIP);
          }
          function Y(S) {
            return S === h.Z_NO_FLUSH || S === h.Z_PARTIAL_FLUSH || S === h.Z_SYNC_FLUSH || S === h.Z_FULL_FLUSH || S === h.Z_FINISH || S === h.Z_BLOCK;
          }
          function Q(S, q) {
            var it = this;
            if (this._opts = S = S || {}, this._chunkSize = S.chunkSize || e.Z_DEFAULT_CHUNK, u.call(this, S), S.flush && !Y(S.flush))
              throw new Error("Invalid flush flag: " + S.flush);
            if (S.finishFlush && !Y(S.finishFlush))
              throw new Error("Invalid flush flag: " + S.finishFlush);
            if (this._flushFlag = S.flush || h.Z_NO_FLUSH, this._finishFlushFlag = typeof S.finishFlush < "u" ? S.finishFlush : h.Z_FINISH, S.chunkSize && (S.chunkSize < e.Z_MIN_CHUNK || S.chunkSize > e.Z_MAX_CHUNK))
              throw new Error("Invalid chunk size: " + S.chunkSize);
            if (S.windowBits && (S.windowBits < e.Z_MIN_WINDOWBITS || S.windowBits > e.Z_MAX_WINDOWBITS))
              throw new Error("Invalid windowBits: " + S.windowBits);
            if (S.level && (S.level < e.Z_MIN_LEVEL || S.level > e.Z_MAX_LEVEL))
              throw new Error("Invalid compression level: " + S.level);
            if (S.memLevel && (S.memLevel < e.Z_MIN_MEMLEVEL || S.memLevel > e.Z_MAX_MEMLEVEL))
              throw new Error("Invalid memLevel: " + S.memLevel);
            if (S.strategy && S.strategy != e.Z_FILTERED && S.strategy != e.Z_HUFFMAN_ONLY && S.strategy != e.Z_RLE && S.strategy != e.Z_FIXED && S.strategy != e.Z_DEFAULT_STRATEGY)
              throw new Error("Invalid strategy: " + S.strategy);
            if (S.dictionary && !o.isBuffer(S.dictionary))
              throw new Error("Invalid dictionary: it should be a Buffer instance");
            this._handle = new h.Zlib(q);
            var dt = this;
            this._hadError = !1, this._handle.onerror = function(U, G) {
              st(dt), dt._hadError = !0;
              var $ = new Error(U);
              $.errno = G, $.code = e.codes[G], dt.emit("error", $);
            };
            var kt = e.Z_DEFAULT_COMPRESSION;
            typeof S.level == "number" && (kt = S.level);
            var ot = e.Z_DEFAULT_STRATEGY;
            typeof S.strategy == "number" && (ot = S.strategy), this._handle.init(S.windowBits || e.Z_DEFAULT_WINDOWBITS, kt, S.memLevel || e.Z_DEFAULT_MEMLEVEL, ot, S.dictionary), this._buffer = o.allocUnsafe(this._chunkSize), this._offset = 0, this._level = kt, this._strategy = ot, this.once("end", this.close), Object.defineProperty(this, "_closed", {
              get: function() {
                return !it._handle;
              },
              configurable: !0,
              enumerable: !0
            });
          }
          p.inherits(Q, u), Q.prototype.params = function(S, q, it) {
            if (S < e.Z_MIN_LEVEL || S > e.Z_MAX_LEVEL)
              throw new RangeError("Invalid compression level: " + S);
            if (q != e.Z_FILTERED && q != e.Z_HUFFMAN_ONLY && q != e.Z_RLE && q != e.Z_FIXED && q != e.Z_DEFAULT_STRATEGY)
              throw new TypeError("Invalid strategy: " + q);
            if (this._level !== S || this._strategy !== q) {
              var dt = this;
              this.flush(h.Z_SYNC_FLUSH, function() {
                f(dt._handle, "zlib binding closed"), dt._handle.params(S, q), dt._hadError || (dt._level = S, dt._strategy = q, it && it());
              });
            } else
              i.nextTick(it);
          }, Q.prototype.reset = function() {
            return f(this._handle, "zlib binding closed"), this._handle.reset();
          }, Q.prototype._flush = function(S) {
            this._transform(o.alloc(0), "", S);
          }, Q.prototype.flush = function(S, q) {
            var it = this, dt = this._writableState;
            (typeof S == "function" || S === void 0 && !q) && (q = S, S = h.Z_FULL_FLUSH), dt.ended ? q && i.nextTick(q) : dt.ending ? q && this.once("end", q) : dt.needDrain ? q && this.once("drain", function() {
              return it.flush(S, q);
            }) : (this._flushFlag = S, this.write(o.alloc(0), "", q));
          }, Q.prototype.close = function(S) {
            st(this, S), i.nextTick(j, this);
          };
          function st(S, q) {
            q && i.nextTick(q), S._handle && (S._handle.close(), S._handle = null);
          }
          function j(S) {
            S.emit("close");
          }
          Q.prototype._transform = function(S, q, it) {
            var dt, kt = this._writableState, ot = kt.ending || kt.ended, U = ot && (!S || kt.length === S.length);
            if (S !== null && !o.isBuffer(S))
              return it(new Error("invalid input"));
            if (!this._handle)
              return it(new Error("zlib binding closed"));
            U ? dt = this._finishFlushFlag : (dt = this._flushFlag, S.length >= kt.length && (this._flushFlag = this._opts.flush || h.Z_NO_FLUSH)), this._processChunk(S, dt, it);
          }, Q.prototype._processChunk = function(S, q, it) {
            var dt = S && S.length, kt = this._chunkSize - this._offset, ot = 0, U = this, G = typeof it == "function";
            if (!G) {
              var $ = [], ct = 0, W;
              this.on("error", function(mt) {
                W = mt;
              }), f(this._handle, "zlib binding closed");
              do
                var X = this._handle.writeSync(
                  q,
                  S,
                  // in
                  ot,
                  // in_off
                  dt,
                  // in_len
                  this._buffer,
                  // out
                  this._offset,
                  //out_off
                  kt
                );
              while (!this._hadError && gt(X[0], X[1]));
              if (this._hadError)
                throw W;
              if (ct >= d)
                throw st(this), new RangeError(s);
              var tt = o.concat($, ct);
              return st(this), tt;
            }
            f(this._handle, "zlib binding closed");
            var ut = this._handle.write(
              q,
              S,
              // in
              ot,
              // in_off
              dt,
              // in_len
              this._buffer,
              // out
              this._offset,
              //out_off
              kt
            );
            ut.buffer = S, ut.callback = gt;
            function gt(mt, z) {
              if (this && (this.buffer = null, this.callback = null), !U._hadError) {
                var J = kt - z;
                if (f(J >= 0, "have should not go down"), J > 0) {
                  var nt = U._buffer.slice(U._offset, U._offset + J);
                  U._offset += J, G ? U.push(nt) : ($.push(nt), ct += nt.length);
                }
                if ((z === 0 || U._offset >= U._chunkSize) && (kt = U._chunkSize, U._offset = 0, U._buffer = o.allocUnsafe(U._chunkSize)), z === 0) {
                  if (ot += dt - mt, dt = mt, !G)
                    return !0;
                  var St = U._handle.write(q, S, ot, dt, U._buffer, U._offset, U._chunkSize);
                  St.callback = gt, St.buffer = S;
                  return;
                }
                if (!G)
                  return !1;
                it();
              }
            }
          }, p.inherits(L, Q), p.inherits(I, Q), p.inherits(R, Q), p.inherits(v, Q), p.inherits(D, Q), p.inherits(M, Q), p.inherits(H, Q);
        }).call(this);
      }).call(this, t("_process"));
    }, { "./binding": 30, _process: 63, assert: 23, buffer: 32, stream: 65, util: 84 }], 32: [function(t, a, e) {
      (function(i) {
        (function() {
          var o = t("base64-js"), u = t("ieee754");
          e.Buffer = d, e.SlowBuffer = F, e.INSPECT_MAX_BYTES = 50;
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
            var b = new Uint8Array(l);
            return b.__proto__ = d.prototype, b;
          }
          function d(l, b, A) {
            if (typeof l == "number") {
              if (typeof b == "string")
                throw new TypeError(
                  'The "string" argument must be of type string. Received type number'
                );
              return y(l);
            }
            return s(l, b, A);
          }
          typeof Symbol < "u" && Symbol.species != null && d[Symbol.species] === d && Object.defineProperty(d, Symbol.species, {
            value: null,
            configurable: !0,
            enumerable: !1,
            writable: !1
          }), d.poolSize = 8192;
          function s(l, b, A) {
            if (typeof l == "string")
              return w(l, b);
            if (ArrayBuffer.isView(l))
              return _(l);
            if (l == null)
              throw TypeError(
                "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof l
              );
            if (B(l, ArrayBuffer) || l && B(l.buffer, ArrayBuffer))
              return E(l, b, A);
            if (typeof l == "number")
              throw new TypeError(
                'The "value" argument must not be of type number. Received type number'
              );
            var P = l.valueOf && l.valueOf();
            if (P != null && P !== l)
              return d.from(P, b, A);
            var et = x(l);
            if (et)
              return et;
            if (typeof Symbol < "u" && Symbol.toPrimitive != null && typeof l[Symbol.toPrimitive] == "function")
              return d.from(
                l[Symbol.toPrimitive]("string"),
                b,
                A
              );
            throw new TypeError(
              "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof l
            );
          }
          d.from = function(l, b, A) {
            return s(l, b, A);
          }, d.prototype.__proto__ = Uint8Array.prototype, d.__proto__ = Uint8Array;
          function g(l) {
            if (typeof l != "number")
              throw new TypeError('"size" argument must be of type number');
            if (l < 0)
              throw new RangeError('The value "' + l + '" is invalid for option "size"');
          }
          function m(l, b, A) {
            return g(l), l <= 0 ? f(l) : b !== void 0 ? typeof A == "string" ? f(l).fill(b, A) : f(l).fill(b) : f(l);
          }
          d.alloc = function(l, b, A) {
            return m(l, b, A);
          };
          function y(l) {
            return g(l), f(l < 0 ? 0 : C(l) | 0);
          }
          d.allocUnsafe = function(l) {
            return y(l);
          }, d.allocUnsafeSlow = function(l) {
            return y(l);
          };
          function w(l, b) {
            if ((typeof b != "string" || b === "") && (b = "utf8"), !d.isEncoding(b))
              throw new TypeError("Unknown encoding: " + b);
            var A = L(l, b) | 0, P = f(A), et = P.write(l, b);
            return et !== A && (P = P.slice(0, et)), P;
          }
          function _(l) {
            for (var b = l.length < 0 ? 0 : C(l.length) | 0, A = f(b), P = 0; P < b; P += 1)
              A[P] = l[P] & 255;
            return A;
          }
          function E(l, b, A) {
            if (b < 0 || l.byteLength < b)
              throw new RangeError('"offset" is outside of buffer bounds');
            if (l.byteLength < b + (A || 0))
              throw new RangeError('"length" is outside of buffer bounds');
            var P;
            return b === void 0 && A === void 0 ? P = new Uint8Array(l) : A === void 0 ? P = new Uint8Array(l, b) : P = new Uint8Array(l, b, A), P.__proto__ = d.prototype, P;
          }
          function x(l) {
            if (d.isBuffer(l)) {
              var b = C(l.length) | 0, A = f(b);
              return A.length === 0 || l.copy(A, 0, 0, b), A;
            }
            if (l.length !== void 0)
              return typeof l.length != "number" || N(l.length) ? f(0) : _(l);
            if (l.type === "Buffer" && Array.isArray(l.data))
              return _(l.data);
          }
          function C(l) {
            if (l >= h)
              throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + h.toString(16) + " bytes");
            return l | 0;
          }
          function F(l) {
            return +l != l && (l = 0), d.alloc(+l);
          }
          d.isBuffer = function(l) {
            return l != null && l._isBuffer === !0 && l !== d.prototype;
          }, d.compare = function(l, b) {
            if (B(l, Uint8Array) && (l = d.from(l, l.offset, l.byteLength)), B(b, Uint8Array) && (b = d.from(b, b.offset, b.byteLength)), !d.isBuffer(l) || !d.isBuffer(b))
              throw new TypeError(
                'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
              );
            if (l === b)
              return 0;
            for (var A = l.length, P = b.length, et = 0, pt = Math.min(A, P); et < pt; ++et)
              if (l[et] !== b[et]) {
                A = l[et], P = b[et];
                break;
              }
            return A < P ? -1 : P < A ? 1 : 0;
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
          }, d.concat = function(l, b) {
            if (!Array.isArray(l))
              throw new TypeError('"list" argument must be an Array of Buffers');
            if (l.length === 0)
              return d.alloc(0);
            var A;
            if (b === void 0)
              for (b = 0, A = 0; A < l.length; ++A)
                b += l[A].length;
            var P = d.allocUnsafe(b), et = 0;
            for (A = 0; A < l.length; ++A) {
              var pt = l[A];
              if (B(pt, Uint8Array) && (pt = d.from(pt)), !d.isBuffer(pt))
                throw new TypeError('"list" argument must be an Array of Buffers');
              pt.copy(P, et), et += pt.length;
            }
            return P;
          };
          function L(l, b) {
            if (d.isBuffer(l))
              return l.length;
            if (ArrayBuffer.isView(l) || B(l, ArrayBuffer))
              return l.byteLength;
            if (typeof l != "string")
              throw new TypeError(
                'The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type ' + typeof l
              );
            var A = l.length, P = arguments.length > 2 && arguments[2] === !0;
            if (!P && A === 0)
              return 0;
            for (var et = !1; ; )
              switch (b) {
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
                  return St(l).length;
                default:
                  if (et)
                    return P ? -1 : z(l).length;
                  b = ("" + b).toLowerCase(), et = !0;
              }
          }
          d.byteLength = L;
          function I(l, b, A) {
            var P = !1;
            if ((b === void 0 || b < 0) && (b = 0), b > this.length || ((A === void 0 || A > this.length) && (A = this.length), A <= 0) || (A >>>= 0, b >>>= 0, A <= b))
              return "";
            for (l || (l = "utf8"); ; )
              switch (l) {
                case "hex":
                  return U(this, b, A);
                case "utf8":
                case "utf-8":
                  return q(this, b, A);
                case "ascii":
                  return kt(this, b, A);
                case "latin1":
                case "binary":
                  return ot(this, b, A);
                case "base64":
                  return S(this, b, A);
                case "ucs2":
                case "ucs-2":
                case "utf16le":
                case "utf-16le":
                  return G(this, b, A);
                default:
                  if (P)
                    throw new TypeError("Unknown encoding: " + l);
                  l = (l + "").toLowerCase(), P = !0;
              }
          }
          d.prototype._isBuffer = !0;
          function R(l, b, A) {
            var P = l[b];
            l[b] = l[A], l[A] = P;
          }
          d.prototype.swap16 = function() {
            var l = this.length;
            if (l % 2 !== 0)
              throw new RangeError("Buffer size must be a multiple of 16-bits");
            for (var b = 0; b < l; b += 2)
              R(this, b, b + 1);
            return this;
          }, d.prototype.swap32 = function() {
            var l = this.length;
            if (l % 4 !== 0)
              throw new RangeError("Buffer size must be a multiple of 32-bits");
            for (var b = 0; b < l; b += 4)
              R(this, b, b + 3), R(this, b + 1, b + 2);
            return this;
          }, d.prototype.swap64 = function() {
            var l = this.length;
            if (l % 8 !== 0)
              throw new RangeError("Buffer size must be a multiple of 64-bits");
            for (var b = 0; b < l; b += 8)
              R(this, b, b + 7), R(this, b + 1, b + 6), R(this, b + 2, b + 5), R(this, b + 3, b + 4);
            return this;
          }, d.prototype.toString = function() {
            var l = this.length;
            return l === 0 ? "" : arguments.length === 0 ? q(this, 0, l) : I.apply(this, arguments);
          }, d.prototype.toLocaleString = d.prototype.toString, d.prototype.equals = function(l) {
            if (!d.isBuffer(l))
              throw new TypeError("Argument must be a Buffer");
            return this === l ? !0 : d.compare(this, l) === 0;
          }, d.prototype.inspect = function() {
            var l = "", b = e.INSPECT_MAX_BYTES;
            return l = this.toString("hex", 0, b).replace(/(.{2})/g, "$1 ").trim(), this.length > b && (l += " ... "), "<Buffer " + l + ">";
          }, d.prototype.compare = function(l, b, A, P, et) {
            if (B(l, Uint8Array) && (l = d.from(l, l.offset, l.byteLength)), !d.isBuffer(l))
              throw new TypeError(
                'The "target" argument must be one of type Buffer or Uint8Array. Received type ' + typeof l
              );
            if (b === void 0 && (b = 0), A === void 0 && (A = l ? l.length : 0), P === void 0 && (P = 0), et === void 0 && (et = this.length), b < 0 || A > l.length || P < 0 || et > this.length)
              throw new RangeError("out of range index");
            if (P >= et && b >= A)
              return 0;
            if (P >= et)
              return -1;
            if (b >= A)
              return 1;
            if (b >>>= 0, A >>>= 0, P >>>= 0, et >>>= 0, this === l)
              return 0;
            for (var pt = et - P, Pt = A - b, Dt = Math.min(pt, Pt), Kt = this.slice(P, et), Nt = l.slice(b, A), Ut = 0; Ut < Dt; ++Ut)
              if (Kt[Ut] !== Nt[Ut]) {
                pt = Kt[Ut], Pt = Nt[Ut];
                break;
              }
            return pt < Pt ? -1 : Pt < pt ? 1 : 0;
          };
          function v(l, b, A, P, et) {
            if (l.length === 0)
              return -1;
            if (typeof A == "string" ? (P = A, A = 0) : A > 2147483647 ? A = 2147483647 : A < -2147483648 && (A = -2147483648), A = +A, N(A) && (A = et ? 0 : l.length - 1), A < 0 && (A = l.length + A), A >= l.length) {
              if (et)
                return -1;
              A = l.length - 1;
            } else if (A < 0)
              if (et)
                A = 0;
              else
                return -1;
            if (typeof b == "string" && (b = d.from(b, P)), d.isBuffer(b))
              return b.length === 0 ? -1 : D(l, b, A, P, et);
            if (typeof b == "number")
              return b = b & 255, typeof Uint8Array.prototype.indexOf == "function" ? et ? Uint8Array.prototype.indexOf.call(l, b, A) : Uint8Array.prototype.lastIndexOf.call(l, b, A) : D(l, [b], A, P, et);
            throw new TypeError("val must be string, number or Buffer");
          }
          function D(l, b, A, P, et) {
            var pt = 1, Pt = l.length, Dt = b.length;
            if (P !== void 0 && (P = String(P).toLowerCase(), P === "ucs2" || P === "ucs-2" || P === "utf16le" || P === "utf-16le")) {
              if (l.length < 2 || b.length < 2)
                return -1;
              pt = 2, Pt /= 2, Dt /= 2, A /= 2;
            }
            function Kt(te, ne) {
              return pt === 1 ? te[ne] : te.readUInt16BE(ne * pt);
            }
            var Nt;
            if (et) {
              var Ut = -1;
              for (Nt = A; Nt < Pt; Nt++)
                if (Kt(l, Nt) === Kt(b, Ut === -1 ? 0 : Nt - Ut)) {
                  if (Ut === -1 && (Ut = Nt), Nt - Ut + 1 === Dt)
                    return Ut * pt;
                } else
                  Ut !== -1 && (Nt -= Nt - Ut), Ut = -1;
            } else
              for (A + Dt > Pt && (A = Pt - Dt), Nt = A; Nt >= 0; Nt--) {
                for (var Jt = !0, ae = 0; ae < Dt; ae++)
                  if (Kt(l, Nt + ae) !== Kt(b, ae)) {
                    Jt = !1;
                    break;
                  }
                if (Jt)
                  return Nt;
              }
            return -1;
          }
          d.prototype.includes = function(l, b, A) {
            return this.indexOf(l, b, A) !== -1;
          }, d.prototype.indexOf = function(l, b, A) {
            return v(this, l, b, A, !0);
          }, d.prototype.lastIndexOf = function(l, b, A) {
            return v(this, l, b, A, !1);
          };
          function M(l, b, A, P) {
            A = Number(A) || 0;
            var et = l.length - A;
            P ? (P = Number(P), P > et && (P = et)) : P = et;
            var pt = b.length;
            P > pt / 2 && (P = pt / 2);
            for (var Pt = 0; Pt < P; ++Pt) {
              var Dt = parseInt(b.substr(Pt * 2, 2), 16);
              if (N(Dt))
                return Pt;
              l[A + Pt] = Dt;
            }
            return Pt;
          }
          function H(l, b, A, P) {
            return Et(z(b, l.length - A), l, A, P);
          }
          function Y(l, b, A, P) {
            return Et(J(b), l, A, P);
          }
          function Q(l, b, A, P) {
            return Y(l, b, A, P);
          }
          function st(l, b, A, P) {
            return Et(St(b), l, A, P);
          }
          function j(l, b, A, P) {
            return Et(nt(b, l.length - A), l, A, P);
          }
          d.prototype.write = function(l, b, A, P) {
            if (b === void 0)
              P = "utf8", A = this.length, b = 0;
            else if (A === void 0 && typeof b == "string")
              P = b, A = this.length, b = 0;
            else if (isFinite(b))
              b = b >>> 0, isFinite(A) ? (A = A >>> 0, P === void 0 && (P = "utf8")) : (P = A, A = void 0);
            else
              throw new Error(
                "Buffer.write(string, encoding, offset[, length]) is no longer supported"
              );
            var et = this.length - b;
            if ((A === void 0 || A > et) && (A = et), l.length > 0 && (A < 0 || b < 0) || b > this.length)
              throw new RangeError("Attempt to write outside buffer bounds");
            P || (P = "utf8");
            for (var pt = !1; ; )
              switch (P) {
                case "hex":
                  return M(this, l, b, A);
                case "utf8":
                case "utf-8":
                  return H(this, l, b, A);
                case "ascii":
                  return Y(this, l, b, A);
                case "latin1":
                case "binary":
                  return Q(this, l, b, A);
                case "base64":
                  return st(this, l, b, A);
                case "ucs2":
                case "ucs-2":
                case "utf16le":
                case "utf-16le":
                  return j(this, l, b, A);
                default:
                  if (pt)
                    throw new TypeError("Unknown encoding: " + P);
                  P = ("" + P).toLowerCase(), pt = !0;
              }
          }, d.prototype.toJSON = function() {
            return {
              type: "Buffer",
              data: Array.prototype.slice.call(this._arr || this, 0)
            };
          };
          function S(l, b, A) {
            return b === 0 && A === l.length ? o.fromByteArray(l) : o.fromByteArray(l.slice(b, A));
          }
          function q(l, b, A) {
            A = Math.min(l.length, A);
            for (var P = [], et = b; et < A; ) {
              var pt = l[et], Pt = null, Dt = pt > 239 ? 4 : pt > 223 ? 3 : pt > 191 ? 2 : 1;
              if (et + Dt <= A) {
                var Kt, Nt, Ut, Jt;
                switch (Dt) {
                  case 1:
                    pt < 128 && (Pt = pt);
                    break;
                  case 2:
                    Kt = l[et + 1], (Kt & 192) === 128 && (Jt = (pt & 31) << 6 | Kt & 63, Jt > 127 && (Pt = Jt));
                    break;
                  case 3:
                    Kt = l[et + 1], Nt = l[et + 2], (Kt & 192) === 128 && (Nt & 192) === 128 && (Jt = (pt & 15) << 12 | (Kt & 63) << 6 | Nt & 63, Jt > 2047 && (Jt < 55296 || Jt > 57343) && (Pt = Jt));
                    break;
                  case 4:
                    Kt = l[et + 1], Nt = l[et + 2], Ut = l[et + 3], (Kt & 192) === 128 && (Nt & 192) === 128 && (Ut & 192) === 128 && (Jt = (pt & 15) << 18 | (Kt & 63) << 12 | (Nt & 63) << 6 | Ut & 63, Jt > 65535 && Jt < 1114112 && (Pt = Jt));
                }
              }
              Pt === null ? (Pt = 65533, Dt = 1) : Pt > 65535 && (Pt -= 65536, P.push(Pt >>> 10 & 1023 | 55296), Pt = 56320 | Pt & 1023), P.push(Pt), et += Dt;
            }
            return dt(P);
          }
          var it = 4096;
          function dt(l) {
            var b = l.length;
            if (b <= it)
              return String.fromCharCode.apply(String, l);
            for (var A = "", P = 0; P < b; )
              A += String.fromCharCode.apply(
                String,
                l.slice(P, P += it)
              );
            return A;
          }
          function kt(l, b, A) {
            var P = "";
            A = Math.min(l.length, A);
            for (var et = b; et < A; ++et)
              P += String.fromCharCode(l[et] & 127);
            return P;
          }
          function ot(l, b, A) {
            var P = "";
            A = Math.min(l.length, A);
            for (var et = b; et < A; ++et)
              P += String.fromCharCode(l[et]);
            return P;
          }
          function U(l, b, A) {
            var P = l.length;
            (!b || b < 0) && (b = 0), (!A || A < 0 || A > P) && (A = P);
            for (var et = "", pt = b; pt < A; ++pt)
              et += mt(l[pt]);
            return et;
          }
          function G(l, b, A) {
            for (var P = l.slice(b, A), et = "", pt = 0; pt < P.length; pt += 2)
              et += String.fromCharCode(P[pt] + P[pt + 1] * 256);
            return et;
          }
          d.prototype.slice = function(l, b) {
            var A = this.length;
            l = ~~l, b = b === void 0 ? A : ~~b, l < 0 ? (l += A, l < 0 && (l = 0)) : l > A && (l = A), b < 0 ? (b += A, b < 0 && (b = 0)) : b > A && (b = A), b < l && (b = l);
            var P = this.subarray(l, b);
            return P.__proto__ = d.prototype, P;
          };
          function $(l, b, A) {
            if (l % 1 !== 0 || l < 0)
              throw new RangeError("offset is not uint");
            if (l + b > A)
              throw new RangeError("Trying to access beyond buffer length");
          }
          d.prototype.readUIntLE = function(l, b, A) {
            l = l >>> 0, b = b >>> 0, A || $(l, b, this.length);
            for (var P = this[l], et = 1, pt = 0; ++pt < b && (et *= 256); )
              P += this[l + pt] * et;
            return P;
          }, d.prototype.readUIntBE = function(l, b, A) {
            l = l >>> 0, b = b >>> 0, A || $(l, b, this.length);
            for (var P = this[l + --b], et = 1; b > 0 && (et *= 256); )
              P += this[l + --b] * et;
            return P;
          }, d.prototype.readUInt8 = function(l, b) {
            return l = l >>> 0, b || $(l, 1, this.length), this[l];
          }, d.prototype.readUInt16LE = function(l, b) {
            return l = l >>> 0, b || $(l, 2, this.length), this[l] | this[l + 1] << 8;
          }, d.prototype.readUInt16BE = function(l, b) {
            return l = l >>> 0, b || $(l, 2, this.length), this[l] << 8 | this[l + 1];
          }, d.prototype.readUInt32LE = function(l, b) {
            return l = l >>> 0, b || $(l, 4, this.length), (this[l] | this[l + 1] << 8 | this[l + 2] << 16) + this[l + 3] * 16777216;
          }, d.prototype.readUInt32BE = function(l, b) {
            return l = l >>> 0, b || $(l, 4, this.length), this[l] * 16777216 + (this[l + 1] << 16 | this[l + 2] << 8 | this[l + 3]);
          }, d.prototype.readIntLE = function(l, b, A) {
            l = l >>> 0, b = b >>> 0, A || $(l, b, this.length);
            for (var P = this[l], et = 1, pt = 0; ++pt < b && (et *= 256); )
              P += this[l + pt] * et;
            return et *= 128, P >= et && (P -= Math.pow(2, 8 * b)), P;
          }, d.prototype.readIntBE = function(l, b, A) {
            l = l >>> 0, b = b >>> 0, A || $(l, b, this.length);
            for (var P = b, et = 1, pt = this[l + --P]; P > 0 && (et *= 256); )
              pt += this[l + --P] * et;
            return et *= 128, pt >= et && (pt -= Math.pow(2, 8 * b)), pt;
          }, d.prototype.readInt8 = function(l, b) {
            return l = l >>> 0, b || $(l, 1, this.length), this[l] & 128 ? (255 - this[l] + 1) * -1 : this[l];
          }, d.prototype.readInt16LE = function(l, b) {
            l = l >>> 0, b || $(l, 2, this.length);
            var A = this[l] | this[l + 1] << 8;
            return A & 32768 ? A | 4294901760 : A;
          }, d.prototype.readInt16BE = function(l, b) {
            l = l >>> 0, b || $(l, 2, this.length);
            var A = this[l + 1] | this[l] << 8;
            return A & 32768 ? A | 4294901760 : A;
          }, d.prototype.readInt32LE = function(l, b) {
            return l = l >>> 0, b || $(l, 4, this.length), this[l] | this[l + 1] << 8 | this[l + 2] << 16 | this[l + 3] << 24;
          }, d.prototype.readInt32BE = function(l, b) {
            return l = l >>> 0, b || $(l, 4, this.length), this[l] << 24 | this[l + 1] << 16 | this[l + 2] << 8 | this[l + 3];
          }, d.prototype.readFloatLE = function(l, b) {
            return l = l >>> 0, b || $(l, 4, this.length), u.read(this, l, !0, 23, 4);
          }, d.prototype.readFloatBE = function(l, b) {
            return l = l >>> 0, b || $(l, 4, this.length), u.read(this, l, !1, 23, 4);
          }, d.prototype.readDoubleLE = function(l, b) {
            return l = l >>> 0, b || $(l, 8, this.length), u.read(this, l, !0, 52, 8);
          }, d.prototype.readDoubleBE = function(l, b) {
            return l = l >>> 0, b || $(l, 8, this.length), u.read(this, l, !1, 52, 8);
          };
          function ct(l, b, A, P, et, pt) {
            if (!d.isBuffer(l))
              throw new TypeError('"buffer" argument must be a Buffer instance');
            if (b > et || b < pt)
              throw new RangeError('"value" argument is out of bounds');
            if (A + P > l.length)
              throw new RangeError("Index out of range");
          }
          d.prototype.writeUIntLE = function(l, b, A, P) {
            if (l = +l, b = b >>> 0, A = A >>> 0, !P) {
              var et = Math.pow(2, 8 * A) - 1;
              ct(this, l, b, A, et, 0);
            }
            var pt = 1, Pt = 0;
            for (this[b] = l & 255; ++Pt < A && (pt *= 256); )
              this[b + Pt] = l / pt & 255;
            return b + A;
          }, d.prototype.writeUIntBE = function(l, b, A, P) {
            if (l = +l, b = b >>> 0, A = A >>> 0, !P) {
              var et = Math.pow(2, 8 * A) - 1;
              ct(this, l, b, A, et, 0);
            }
            var pt = A - 1, Pt = 1;
            for (this[b + pt] = l & 255; --pt >= 0 && (Pt *= 256); )
              this[b + pt] = l / Pt & 255;
            return b + A;
          }, d.prototype.writeUInt8 = function(l, b, A) {
            return l = +l, b = b >>> 0, A || ct(this, l, b, 1, 255, 0), this[b] = l & 255, b + 1;
          }, d.prototype.writeUInt16LE = function(l, b, A) {
            return l = +l, b = b >>> 0, A || ct(this, l, b, 2, 65535, 0), this[b] = l & 255, this[b + 1] = l >>> 8, b + 2;
          }, d.prototype.writeUInt16BE = function(l, b, A) {
            return l = +l, b = b >>> 0, A || ct(this, l, b, 2, 65535, 0), this[b] = l >>> 8, this[b + 1] = l & 255, b + 2;
          }, d.prototype.writeUInt32LE = function(l, b, A) {
            return l = +l, b = b >>> 0, A || ct(this, l, b, 4, 4294967295, 0), this[b + 3] = l >>> 24, this[b + 2] = l >>> 16, this[b + 1] = l >>> 8, this[b] = l & 255, b + 4;
          }, d.prototype.writeUInt32BE = function(l, b, A) {
            return l = +l, b = b >>> 0, A || ct(this, l, b, 4, 4294967295, 0), this[b] = l >>> 24, this[b + 1] = l >>> 16, this[b + 2] = l >>> 8, this[b + 3] = l & 255, b + 4;
          }, d.prototype.writeIntLE = function(l, b, A, P) {
            if (l = +l, b = b >>> 0, !P) {
              var et = Math.pow(2, 8 * A - 1);
              ct(this, l, b, A, et - 1, -et);
            }
            var pt = 0, Pt = 1, Dt = 0;
            for (this[b] = l & 255; ++pt < A && (Pt *= 256); )
              l < 0 && Dt === 0 && this[b + pt - 1] !== 0 && (Dt = 1), this[b + pt] = (l / Pt >> 0) - Dt & 255;
            return b + A;
          }, d.prototype.writeIntBE = function(l, b, A, P) {
            if (l = +l, b = b >>> 0, !P) {
              var et = Math.pow(2, 8 * A - 1);
              ct(this, l, b, A, et - 1, -et);
            }
            var pt = A - 1, Pt = 1, Dt = 0;
            for (this[b + pt] = l & 255; --pt >= 0 && (Pt *= 256); )
              l < 0 && Dt === 0 && this[b + pt + 1] !== 0 && (Dt = 1), this[b + pt] = (l / Pt >> 0) - Dt & 255;
            return b + A;
          }, d.prototype.writeInt8 = function(l, b, A) {
            return l = +l, b = b >>> 0, A || ct(this, l, b, 1, 127, -128), l < 0 && (l = 255 + l + 1), this[b] = l & 255, b + 1;
          }, d.prototype.writeInt16LE = function(l, b, A) {
            return l = +l, b = b >>> 0, A || ct(this, l, b, 2, 32767, -32768), this[b] = l & 255, this[b + 1] = l >>> 8, b + 2;
          }, d.prototype.writeInt16BE = function(l, b, A) {
            return l = +l, b = b >>> 0, A || ct(this, l, b, 2, 32767, -32768), this[b] = l >>> 8, this[b + 1] = l & 255, b + 2;
          }, d.prototype.writeInt32LE = function(l, b, A) {
            return l = +l, b = b >>> 0, A || ct(this, l, b, 4, 2147483647, -2147483648), this[b] = l & 255, this[b + 1] = l >>> 8, this[b + 2] = l >>> 16, this[b + 3] = l >>> 24, b + 4;
          }, d.prototype.writeInt32BE = function(l, b, A) {
            return l = +l, b = b >>> 0, A || ct(this, l, b, 4, 2147483647, -2147483648), l < 0 && (l = 4294967295 + l + 1), this[b] = l >>> 24, this[b + 1] = l >>> 16, this[b + 2] = l >>> 8, this[b + 3] = l & 255, b + 4;
          };
          function W(l, b, A, P, et, pt) {
            if (A + P > l.length)
              throw new RangeError("Index out of range");
            if (A < 0)
              throw new RangeError("Index out of range");
          }
          function X(l, b, A, P, et) {
            return b = +b, A = A >>> 0, et || W(l, b, A, 4), u.write(l, b, A, P, 23, 4), A + 4;
          }
          d.prototype.writeFloatLE = function(l, b, A) {
            return X(this, l, b, !0, A);
          }, d.prototype.writeFloatBE = function(l, b, A) {
            return X(this, l, b, !1, A);
          };
          function tt(l, b, A, P, et) {
            return b = +b, A = A >>> 0, et || W(l, b, A, 8), u.write(l, b, A, P, 52, 8), A + 8;
          }
          d.prototype.writeDoubleLE = function(l, b, A) {
            return tt(this, l, b, !0, A);
          }, d.prototype.writeDoubleBE = function(l, b, A) {
            return tt(this, l, b, !1, A);
          }, d.prototype.copy = function(l, b, A, P) {
            if (!d.isBuffer(l))
              throw new TypeError("argument should be a Buffer");
            if (A || (A = 0), !P && P !== 0 && (P = this.length), b >= l.length && (b = l.length), b || (b = 0), P > 0 && P < A && (P = A), P === A || l.length === 0 || this.length === 0)
              return 0;
            if (b < 0)
              throw new RangeError("targetStart out of bounds");
            if (A < 0 || A >= this.length)
              throw new RangeError("Index out of range");
            if (P < 0)
              throw new RangeError("sourceEnd out of bounds");
            P > this.length && (P = this.length), l.length - b < P - A && (P = l.length - b + A);
            var et = P - A;
            if (this === l && typeof Uint8Array.prototype.copyWithin == "function")
              this.copyWithin(b, A, P);
            else if (this === l && A < b && b < P)
              for (var pt = et - 1; pt >= 0; --pt)
                l[pt + b] = this[pt + A];
            else
              Uint8Array.prototype.set.call(
                l,
                this.subarray(A, P),
                b
              );
            return et;
          }, d.prototype.fill = function(l, b, A, P) {
            if (typeof l == "string") {
              if (typeof b == "string" ? (P = b, b = 0, A = this.length) : typeof A == "string" && (P = A, A = this.length), P !== void 0 && typeof P != "string")
                throw new TypeError("encoding must be a string");
              if (typeof P == "string" && !d.isEncoding(P))
                throw new TypeError("Unknown encoding: " + P);
              if (l.length === 1) {
                var et = l.charCodeAt(0);
                (P === "utf8" && et < 128 || P === "latin1") && (l = et);
              }
            } else
              typeof l == "number" && (l = l & 255);
            if (b < 0 || this.length < b || this.length < A)
              throw new RangeError("Out of range index");
            if (A <= b)
              return this;
            b = b >>> 0, A = A === void 0 ? this.length : A >>> 0, l || (l = 0);
            var pt;
            if (typeof l == "number")
              for (pt = b; pt < A; ++pt)
                this[pt] = l;
            else {
              var Pt = d.isBuffer(l) ? l : d.from(l, P), Dt = Pt.length;
              if (Dt === 0)
                throw new TypeError('The value "' + l + '" is invalid for argument "value"');
              for (pt = 0; pt < A - b; ++pt)
                this[pt + b] = Pt[pt % Dt];
            }
            return this;
          };
          var ut = /[^+/0-9A-Za-z-_]/g;
          function gt(l) {
            if (l = l.split("=")[0], l = l.trim().replace(ut, ""), l.length < 2)
              return "";
            for (; l.length % 4 !== 0; )
              l = l + "=";
            return l;
          }
          function mt(l) {
            return l < 16 ? "0" + l.toString(16) : l.toString(16);
          }
          function z(l, b) {
            b = b || 1 / 0;
            for (var A, P = l.length, et = null, pt = [], Pt = 0; Pt < P; ++Pt) {
              if (A = l.charCodeAt(Pt), A > 55295 && A < 57344) {
                if (!et) {
                  if (A > 56319) {
                    (b -= 3) > -1 && pt.push(239, 191, 189);
                    continue;
                  } else if (Pt + 1 === P) {
                    (b -= 3) > -1 && pt.push(239, 191, 189);
                    continue;
                  }
                  et = A;
                  continue;
                }
                if (A < 56320) {
                  (b -= 3) > -1 && pt.push(239, 191, 189), et = A;
                  continue;
                }
                A = (et - 55296 << 10 | A - 56320) + 65536;
              } else
                et && (b -= 3) > -1 && pt.push(239, 191, 189);
              if (et = null, A < 128) {
                if ((b -= 1) < 0)
                  break;
                pt.push(A);
              } else if (A < 2048) {
                if ((b -= 2) < 0)
                  break;
                pt.push(
                  A >> 6 | 192,
                  A & 63 | 128
                );
              } else if (A < 65536) {
                if ((b -= 3) < 0)
                  break;
                pt.push(
                  A >> 12 | 224,
                  A >> 6 & 63 | 128,
                  A & 63 | 128
                );
              } else if (A < 1114112) {
                if ((b -= 4) < 0)
                  break;
                pt.push(
                  A >> 18 | 240,
                  A >> 12 & 63 | 128,
                  A >> 6 & 63 | 128,
                  A & 63 | 128
                );
              } else
                throw new Error("Invalid code point");
            }
            return pt;
          }
          function J(l) {
            for (var b = [], A = 0; A < l.length; ++A)
              b.push(l.charCodeAt(A) & 255);
            return b;
          }
          function nt(l, b) {
            for (var A, P, et, pt = [], Pt = 0; Pt < l.length && !((b -= 2) < 0); ++Pt)
              A = l.charCodeAt(Pt), P = A >> 8, et = A % 256, pt.push(et), pt.push(P);
            return pt;
          }
          function St(l) {
            return o.toByteArray(gt(l));
          }
          function Et(l, b, A, P) {
            for (var et = 0; et < P && !(et + A >= b.length || et >= l.length); ++et)
              b[et + A] = l[et];
            return et;
          }
          function B(l, b) {
            return l instanceof b || l != null && l.constructor != null && l.constructor.name != null && l.constructor.name === b.name;
          }
          function N(l) {
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
        var y = p(i, h, arguments);
        if (f && d) {
          var w = f(y, "length");
          w.configurable && d(
            y,
            "length",
            { value: 1 + s(0, m.length - (arguments.length - 1)) }
          );
        }
        return y;
      };
      var g = function() {
        return p(i, u, arguments);
      };
      d ? d(a.exports, "apply", { value: g }) : a.exports.apply = g;
    }, { "function-bind": 38, "get-intrinsic": 39 }], 35: [function(t, a, e) {
      var i = typeof Reflect == "object" ? Reflect : null, o = i && typeof i.apply == "function" ? i.apply : function(v, D, M) {
        return Function.prototype.apply.call(v, D, M);
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
      a.exports = f, a.exports.once = L, f.EventEmitter = f, f.prototype._events = void 0, f.prototype._eventsCount = 0, f.prototype._maxListeners = void 0;
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
        for (var D = [], M = 1; M < arguments.length; M++)
          D.push(arguments[M]);
        var H = v === "error", Y = this._events;
        if (Y !== void 0)
          H = H && Y.error === void 0;
        else if (!H)
          return !1;
        if (H) {
          var Q;
          if (D.length > 0 && (Q = D[0]), Q instanceof Error)
            throw Q;
          var st = new Error("Unhandled error." + (Q ? " (" + Q.message + ")" : ""));
          throw st.context = Q, st;
        }
        var j = Y[v];
        if (j === void 0)
          return !1;
        if (typeof j == "function")
          o(j, this, D);
        else
          for (var S = j.length, q = x(j, S), M = 0; M < S; ++M)
            o(q[M], this, D);
        return !0;
      };
      function m(v, D, M, H) {
        var Y, Q, st;
        if (s(M), Q = v._events, Q === void 0 ? (Q = v._events = /* @__PURE__ */ Object.create(null), v._eventsCount = 0) : (Q.newListener !== void 0 && (v.emit(
          "newListener",
          D,
          M.listener ? M.listener : M
        ), Q = v._events), st = Q[D]), st === void 0)
          st = Q[D] = M, ++v._eventsCount;
        else if (typeof st == "function" ? st = Q[D] = H ? [M, st] : [st, M] : H ? st.unshift(M) : st.push(M), Y = g(v), Y > 0 && st.length > Y && !st.warned) {
          st.warned = !0;
          var j = new Error("Possible EventEmitter memory leak detected. " + st.length + " " + String(D) + " listeners added. Use emitter.setMaxListeners() to increase limit");
          j.name = "MaxListenersExceededWarning", j.emitter = v, j.type = D, j.count = st.length, h(j);
        }
        return v;
      }
      f.prototype.addListener = function(v, D) {
        return m(this, v, D, !1);
      }, f.prototype.on = f.prototype.addListener, f.prototype.prependListener = function(v, D) {
        return m(this, v, D, !0);
      };
      function y() {
        if (!this.fired)
          return this.target.removeListener(this.type, this.wrapFn), this.fired = !0, arguments.length === 0 ? this.listener.call(this.target) : this.listener.apply(this.target, arguments);
      }
      function w(v, D, M) {
        var H = { fired: !1, wrapFn: void 0, target: v, type: D, listener: M }, Y = y.bind(H);
        return Y.listener = M, H.wrapFn = Y, Y;
      }
      f.prototype.once = function(v, D) {
        return s(D), this.on(v, w(this, v, D)), this;
      }, f.prototype.prependOnceListener = function(v, D) {
        return s(D), this.prependListener(v, w(this, v, D)), this;
      }, f.prototype.removeListener = function(v, D) {
        var M, H, Y, Q, st;
        if (s(D), H = this._events, H === void 0)
          return this;
        if (M = H[v], M === void 0)
          return this;
        if (M === D || M.listener === D)
          --this._eventsCount === 0 ? this._events = /* @__PURE__ */ Object.create(null) : (delete H[v], H.removeListener && this.emit("removeListener", v, M.listener || D));
        else if (typeof M != "function") {
          for (Y = -1, Q = M.length - 1; Q >= 0; Q--)
            if (M[Q] === D || M[Q].listener === D) {
              st = M[Q].listener, Y = Q;
              break;
            }
          if (Y < 0)
            return this;
          Y === 0 ? M.shift() : C(M, Y), M.length === 1 && (H[v] = M[0]), H.removeListener !== void 0 && this.emit("removeListener", v, st || D);
        }
        return this;
      }, f.prototype.off = f.prototype.removeListener, f.prototype.removeAllListeners = function(v) {
        var D, M, H;
        if (M = this._events, M === void 0)
          return this;
        if (M.removeListener === void 0)
          return arguments.length === 0 ? (this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0) : M[v] !== void 0 && (--this._eventsCount === 0 ? this._events = /* @__PURE__ */ Object.create(null) : delete M[v]), this;
        if (arguments.length === 0) {
          var Y = Object.keys(M), Q;
          for (H = 0; H < Y.length; ++H)
            Q = Y[H], Q !== "removeListener" && this.removeAllListeners(Q);
          return this.removeAllListeners("removeListener"), this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0, this;
        }
        if (D = M[v], typeof D == "function")
          this.removeListener(v, D);
        else if (D !== void 0)
          for (H = D.length - 1; H >= 0; H--)
            this.removeListener(v, D[H]);
        return this;
      };
      function _(v, D, M) {
        var H = v._events;
        if (H === void 0)
          return [];
        var Y = H[D];
        return Y === void 0 ? [] : typeof Y == "function" ? M ? [Y.listener || Y] : [Y] : M ? F(Y) : x(Y, Y.length);
      }
      f.prototype.listeners = function(v) {
        return _(this, v, !0);
      }, f.prototype.rawListeners = function(v) {
        return _(this, v, !1);
      }, f.listenerCount = function(v, D) {
        return typeof v.listenerCount == "function" ? v.listenerCount(D) : E.call(v, D);
      }, f.prototype.listenerCount = E;
      function E(v) {
        var D = this._events;
        if (D !== void 0) {
          var M = D[v];
          if (typeof M == "function")
            return 1;
          if (M !== void 0)
            return M.length;
        }
        return 0;
      }
      f.prototype.eventNames = function() {
        return this._eventsCount > 0 ? u(this._events) : [];
      };
      function x(v, D) {
        for (var M = new Array(D), H = 0; H < D; ++H)
          M[H] = v[H];
        return M;
      }
      function C(v, D) {
        for (; D + 1 < v.length; D++)
          v[D] = v[D + 1];
        v.pop();
      }
      function F(v) {
        for (var D = new Array(v.length), M = 0; M < D.length; ++M)
          D[M] = v[M].listener || v[M];
        return D;
      }
      function L(v, D) {
        return new Promise(function(M, H) {
          function Y(st) {
            v.removeListener(D, Q), H(st);
          }
          function Q() {
            typeof v.removeListener == "function" && v.removeListener("error", Y), M([].slice.call(arguments));
          }
          R(v, D, Q, { once: !0 }), D !== "error" && I(v, Y, { once: !0 });
        });
      }
      function I(v, D, M) {
        typeof v.on == "function" && R(v, "error", D, M);
      }
      function R(v, D, M, H) {
        if (typeof v.on == "function")
          H.once ? v.once(D, M) : v.on(D, M);
        else if (typeof v.addEventListener == "function")
          v.addEventListener(D, function Y(Q) {
            H.once && v.removeEventListener(D, Y), M(Q);
          });
        else
          throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof v);
      }
    }, {}], 36: [function(t, a, e) {
      var i = t("is-callable"), o = Object.prototype.toString, u = Object.prototype.hasOwnProperty, h = function(s, g, m) {
        for (var y = 0, w = s.length; y < w; y++)
          u.call(s, y) && (m == null ? g(s[y], y, s) : g.call(m, s[y], y, s));
      }, p = function(s, g, m) {
        for (var y = 0, w = s.length; y < w; y++)
          m == null ? g(s.charAt(y), y, s) : g.call(m, s.charAt(y), y, s);
      }, f = function(s, g, m) {
        for (var y in s)
          u.call(s, y) && (m == null ? g(s[y], y, s) : g.call(m, s[y], y, s));
      }, d = function(s, g, m) {
        if (!i(g))
          throw new TypeError("iterator must be a function");
        var y;
        arguments.length >= 3 && (y = m), o.call(s) === "[object Array]" ? h(s, g, y) : typeof s == "string" ? p(s, g, y) : f(s, g, y);
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
            var E = f.apply(
              this,
              d.concat(o.call(arguments))
            );
            return Object(E) === E ? E : this;
          } else
            return f.apply(
              p,
              d.concat(o.call(arguments))
            );
        }, m = Math.max(0, f.length - d.length), y = [], w = 0; w < m; w++)
          y.push("$" + w);
        if (s = Function("binder", "return function (" + y.join(",") + "){ return binder.apply(this,arguments); }")(g), f.prototype) {
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
      var i, o = SyntaxError, u = Function, h = TypeError, p = function(j) {
        try {
          return u('"use strict"; return (' + j + ").constructor;")();
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
      })() : d, g = t("has-symbols")(), m = Object.getPrototypeOf || function(j) {
        return j.__proto__;
      }, y = {}, w = typeof Uint8Array > "u" ? i : m(Uint8Array), _ = {
        "%AggregateError%": typeof AggregateError > "u" ? i : AggregateError,
        "%Array%": Array,
        "%ArrayBuffer%": typeof ArrayBuffer > "u" ? i : ArrayBuffer,
        "%ArrayIteratorPrototype%": g ? m([][Symbol.iterator]()) : i,
        "%AsyncFromSyncIteratorPrototype%": i,
        "%AsyncFunction%": y,
        "%AsyncGenerator%": y,
        "%AsyncGeneratorFunction%": y,
        "%AsyncIteratorPrototype%": y,
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
        "%GeneratorFunction%": y,
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
      } catch (j) {
        var E = m(m(j));
        _["%Error.prototype%"] = E;
      }
      var x = function j(S) {
        var q;
        if (S === "%AsyncFunction%")
          q = p("async function () {}");
        else if (S === "%GeneratorFunction%")
          q = p("function* () {}");
        else if (S === "%AsyncGeneratorFunction%")
          q = p("async function* () {}");
        else if (S === "%AsyncGenerator%") {
          var it = j("%AsyncGeneratorFunction%");
          it && (q = it.prototype);
        } else if (S === "%AsyncIteratorPrototype%") {
          var dt = j("%AsyncGenerator%");
          dt && (q = m(dt.prototype));
        }
        return _[S] = q, q;
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
      }, F = t("function-bind"), L = t("has"), I = F.call(Function.call, Array.prototype.concat), R = F.call(Function.apply, Array.prototype.splice), v = F.call(Function.call, String.prototype.replace), D = F.call(Function.call, String.prototype.slice), M = F.call(Function.call, RegExp.prototype.exec), H = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g, Y = /\\(\\)?/g, Q = function(j) {
        var S = D(j, 0, 1), q = D(j, -1);
        if (S === "%" && q !== "%")
          throw new o("invalid intrinsic syntax, expected closing `%`");
        if (q === "%" && S !== "%")
          throw new o("invalid intrinsic syntax, expected opening `%`");
        var it = [];
        return v(j, H, function(dt, kt, ot, U) {
          it[it.length] = ot ? v(U, Y, "$1") : kt || dt;
        }), it;
      }, st = function(j, S) {
        var q = j, it;
        if (L(C, q) && (it = C[q], q = "%" + it[0] + "%"), L(_, q)) {
          var dt = _[q];
          if (dt === y && (dt = x(q)), typeof dt > "u" && !S)
            throw new h("intrinsic " + j + " exists, but is not available. Please file an issue!");
          return {
            alias: it,
            name: q,
            value: dt
          };
        }
        throw new o("intrinsic " + j + " does not exist!");
      };
      a.exports = function(j, S) {
        if (typeof j != "string" || j.length === 0)
          throw new h("intrinsic name must be a non-empty string");
        if (arguments.length > 1 && typeof S != "boolean")
          throw new h('"allowMissing" argument must be a boolean');
        if (M(/^%?[^%]*%?$/, j) === null)
          throw new o("`%` may not be present anywhere but at the beginning and end of the intrinsic name");
        var q = Q(j), it = q.length > 0 ? q[0] : "", dt = st("%" + it + "%", S), kt = dt.name, ot = dt.value, U = !1, G = dt.alias;
        G && (it = G[0], R(q, I([0, 1], G)));
        for (var $ = 1, ct = !0; $ < q.length; $ += 1) {
          var W = q[$], X = D(W, 0, 1), tt = D(W, -1);
          if ((X === '"' || X === "'" || X === "`" || tt === '"' || tt === "'" || tt === "`") && X !== tt)
            throw new o("property names with quotes must have matching quotes");
          if ((W === "constructor" || !ct) && (U = !0), it += "." + W, kt = "%" + it + "%", L(_, kt))
            ot = _[kt];
          else if (ot != null) {
            if (!(W in ot)) {
              if (!S)
                throw new h("base intrinsic for " + j + " exists, but the property is not available.");
              return;
            }
            if (f && $ + 1 >= q.length) {
              var ut = f(ot, W);
              ct = !!ut, ct && "get" in ut && !("originalValue" in ut.get) ? ot = ut.get : ot = ot[W];
            } else
              ct = L(ot, W), ot = ot[W];
            ct && !U && (_[kt] = ot);
          }
        }
        return ot;
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
        var f, d, s = p * 8 - h - 1, g = (1 << s) - 1, m = g >> 1, y = -7, w = u ? p - 1 : 0, _ = u ? -1 : 1, E = i[o + w];
        for (w += _, f = E & (1 << -y) - 1, E >>= -y, y += s; y > 0; f = f * 256 + i[o + w], w += _, y -= 8)
          ;
        for (d = f & (1 << -y) - 1, f >>= -y, y += h; y > 0; d = d * 256 + i[o + w], w += _, y -= 8)
          ;
        if (f === 0)
          f = 1 - m;
        else {
          if (f === g)
            return d ? NaN : (E ? -1 : 1) * (1 / 0);
          d = d + Math.pow(2, h), f = f - m;
        }
        return (E ? -1 : 1) * d * Math.pow(2, f - h);
      }, e.write = function(i, o, u, h, p, f) {
        var d, s, g, m = f * 8 - p - 1, y = (1 << m) - 1, w = y >> 1, _ = p === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0, E = h ? 0 : f - 1, x = h ? 1 : -1, C = o < 0 || o === 0 && 1 / o < 0 ? 1 : 0;
        for (o = Math.abs(o), isNaN(o) || o === 1 / 0 ? (s = isNaN(o) ? 1 : 0, d = y) : (d = Math.floor(Math.log(o) / Math.LN2), o * (g = Math.pow(2, -d)) < 1 && (d--, g *= 2), d + w >= 1 ? o += _ / g : o += _ * Math.pow(2, 1 - w), o * g >= 2 && (d++, g /= 2), d + w >= y ? (s = 0, d = y) : d + w >= 1 ? (s = (o * g - 1) * Math.pow(2, p), d = d + w) : (s = o * Math.pow(2, w - 1) * Math.pow(2, p), d = 0)); p >= 8; i[u + E] = s & 255, E += x, s /= 256, p -= 8)
          ;
        for (d = d << p | s, m += p; m > 0; i[u + E] = d & 255, E += x, d /= 256, m -= 8)
          ;
        i[u + E - x] |= C * 128;
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
          var R = i.call(I);
          return p.test(R);
        } catch {
          return !1;
        }
      }, d = function(I) {
        try {
          return f(I) ? !1 : (i.call(I), !0);
        } catch {
          return !1;
        }
      }, s = Object.prototype.toString, g = "[object Object]", m = "[object Function]", y = "[object GeneratorFunction]", w = "[object HTMLAllCollection]", _ = "[object HTML document.all class]", E = "[object HTMLCollection]", x = typeof Symbol == "function" && !!Symbol.toStringTag, C = !(0 in [,]), F = function() {
        return !1;
      };
      if (typeof document == "object") {
        var L = document.all;
        s.call(L) === s.call(document.all) && (F = function(I) {
          if ((C || !I) && (typeof I > "u" || typeof I == "object"))
            try {
              var R = s.call(I);
              return (R === w || R === _ || R === E || R === g) && I("") == null;
            } catch {
            }
          return !1;
        });
      }
      a.exports = o ? function(I) {
        if (F(I))
          return !0;
        if (!I || typeof I != "function" && typeof I != "object")
          return !1;
        try {
          o(I, null, u);
        } catch (R) {
          if (R !== h)
            return !1;
        }
        return !f(I) && d(I);
      } : function(I) {
        if (F(I))
          return !0;
        if (!I || typeof I != "function" && typeof I != "object")
          return !1;
        if (x)
          return d(I);
        if (f(I))
          return !1;
        var R = s.call(I);
        return R !== m && R !== y && !/^\[object HTML/.test(R) ? !1 : d(I);
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
          var o = t("for-each"), u = t("available-typed-arrays"), h = t("call-bind/callBound"), p = h("Object.prototype.toString"), f = t("has-tostringtag/shams")(), d = t("gopd"), s = typeof globalThis > "u" ? i : globalThis, g = u(), m = h("Array.prototype.indexOf", !0) || function(x, C) {
            for (var F = 0; F < x.length; F += 1)
              if (x[F] === C)
                return F;
            return -1;
          }, y = h("String.prototype.slice"), w = {}, _ = Object.getPrototypeOf;
          f && d && _ && o(g, function(x) {
            var C = new s[x]();
            if (Symbol.toStringTag in C) {
              var F = _(C), L = d(F, Symbol.toStringTag);
              if (!L) {
                var I = _(F);
                L = d(I, Symbol.toStringTag);
              }
              w[x] = L.get;
            }
          });
          var E = function(x) {
            var C = !1;
            return o(w, function(F, L) {
              if (!C)
                try {
                  C = F.call(x) === L;
                } catch {
                }
            }), C;
          };
          a.exports = function(x) {
            if (!x || typeof x != "object")
              return !1;
            if (!f || !(Symbol.toStringTag in x)) {
              var C = y(p(x), 8, -1);
              return m(g, C) > -1;
            }
            return d ? E(x) : !1;
          };
        }).call(this);
      }).call(this, typeof se < "u" ? se : typeof self < "u" ? self : typeof window < "u" ? window : {});
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
          var g = Object.getOwnPropertyNames(d).map(function(y) {
            return d[y];
          });
          if (g.join("") !== "0123456789")
            return !1;
          var m = {};
          return "abcdefghijklmnopqrst".split("").forEach(function(y) {
            m[y] = y;
          }), Object.keys(Object.assign({}, m)).join("") === "abcdefghijklmnopqrst";
        } catch {
          return !1;
        }
      }
      a.exports = p() ? Object.assign : function(f, d) {
        for (var s, g = h(f), m, y = 1; y < arguments.length; y++) {
          s = Object(arguments[y]);
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
          var f, d, s, g, m, y;
          for (s = 0, f = 0, d = p.length; f < d; f++)
            s += p[f].length;
          for (y = new Uint8Array(s), g = 0, f = 0, d = p.length; f < d; f++)
            m = p[f], y.set(m, g), g += m.length;
          return y;
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
      var i = t("../utils/common"), o = t("./trees"), u = t("./adler32"), h = t("./crc32"), p = t("./messages"), f = 0, d = 1, s = 3, g = 4, m = 5, y = 0, w = 1, _ = -2, E = -3, x = -5, C = -1, F = 1, L = 2, I = 3, R = 4, v = 0, D = 2, M = 8, H = 9, Y = 15, Q = 8, st = 29, j = 256, S = j + 1 + st, q = 30, it = 19, dt = 2 * S + 1, kt = 15, ot = 3, U = 258, G = U + ot + 1, $ = 32, ct = 42, W = 69, X = 73, tt = 91, ut = 103, gt = 113, mt = 666, z = 1, J = 2, nt = 3, St = 4, Et = 3;
      function B(c, at) {
        return c.msg = p[at], at;
      }
      function N(c) {
        return (c << 1) - (c > 4 ? 9 : 0);
      }
      function l(c) {
        for (var at = c.length; --at >= 0; )
          c[at] = 0;
      }
      function b(c) {
        var at = c.state, lt = at.pending;
        lt > c.avail_out && (lt = c.avail_out), lt !== 0 && (i.arraySet(c.output, at.pending_buf, at.pending_out, lt, c.next_out), c.next_out += lt, at.pending_out += lt, c.total_out += lt, c.avail_out -= lt, at.pending -= lt, at.pending === 0 && (at.pending_out = 0));
      }
      function A(c, at) {
        o._tr_flush_block(c, c.block_start >= 0 ? c.block_start : -1, c.strstart - c.block_start, at), c.block_start = c.strstart, b(c.strm);
      }
      function P(c, at) {
        c.pending_buf[c.pending++] = at;
      }
      function et(c, at) {
        c.pending_buf[c.pending++] = at >>> 8 & 255, c.pending_buf[c.pending++] = at & 255;
      }
      function pt(c, at, lt, O) {
        var V = c.avail_in;
        return V > O && (V = O), V === 0 ? 0 : (c.avail_in -= V, i.arraySet(at, c.input, c.next_in, V, lt), c.state.wrap === 1 ? c.adler = u(c.adler, at, V, lt) : c.state.wrap === 2 && (c.adler = h(c.adler, at, V, lt)), c.next_in += V, c.total_in += V, V);
      }
      function Pt(c, at) {
        var lt = c.max_chain_length, O = c.strstart, V, rt, Ct = c.prev_length, xt = c.nice_match, Ot = c.strstart > c.w_size - G ? c.strstart - (c.w_size - G) : 0, Wt = c.window, be = c.w_mask, Z = c.prev, ht = c.strstart + U, At = Wt[O + Ct - 1], It = Wt[O + Ct];
        c.prev_length >= c.good_match && (lt >>= 2), xt > c.lookahead && (xt = c.lookahead);
        do
          if (V = at, !(Wt[V + Ct] !== It || Wt[V + Ct - 1] !== At || Wt[V] !== Wt[O] || Wt[++V] !== Wt[O + 1])) {
            O += 2, V++;
            do
              ;
            while (Wt[++O] === Wt[++V] && Wt[++O] === Wt[++V] && Wt[++O] === Wt[++V] && Wt[++O] === Wt[++V] && Wt[++O] === Wt[++V] && Wt[++O] === Wt[++V] && Wt[++O] === Wt[++V] && Wt[++O] === Wt[++V] && O < ht);
            if (rt = U - (ht - O), O = ht - U, rt > Ct) {
              if (c.match_start = at, Ct = rt, rt >= xt)
                break;
              At = Wt[O + Ct - 1], It = Wt[O + Ct];
            }
          }
        while ((at = Z[at & be]) > Ot && --lt !== 0);
        return Ct <= c.lookahead ? Ct : c.lookahead;
      }
      function Dt(c) {
        var at = c.w_size, lt, O, V, rt, Ct;
        do {
          if (rt = c.window_size - c.lookahead - c.strstart, c.strstart >= at + (at - G)) {
            i.arraySet(c.window, c.window, at, at, 0), c.match_start -= at, c.strstart -= at, c.block_start -= at, O = c.hash_size, lt = O;
            do
              V = c.head[--lt], c.head[lt] = V >= at ? V - at : 0;
            while (--O);
            O = at, lt = O;
            do
              V = c.prev[--lt], c.prev[lt] = V >= at ? V - at : 0;
            while (--O);
            rt += at;
          }
          if (c.strm.avail_in === 0)
            break;
          if (O = pt(c.strm, c.window, c.strstart + c.lookahead, rt), c.lookahead += O, c.lookahead + c.insert >= ot)
            for (Ct = c.strstart - c.insert, c.ins_h = c.window[Ct], c.ins_h = (c.ins_h << c.hash_shift ^ c.window[Ct + 1]) & c.hash_mask; c.insert && (c.ins_h = (c.ins_h << c.hash_shift ^ c.window[Ct + ot - 1]) & c.hash_mask, c.prev[Ct & c.w_mask] = c.head[c.ins_h], c.head[c.ins_h] = Ct, Ct++, c.insert--, !(c.lookahead + c.insert < ot)); )
              ;
        } while (c.lookahead < G && c.strm.avail_in !== 0);
      }
      function Kt(c, at) {
        var lt = 65535;
        for (lt > c.pending_buf_size - 5 && (lt = c.pending_buf_size - 5); ; ) {
          if (c.lookahead <= 1) {
            if (Dt(c), c.lookahead === 0 && at === f)
              return z;
            if (c.lookahead === 0)
              break;
          }
          c.strstart += c.lookahead, c.lookahead = 0;
          var O = c.block_start + lt;
          if ((c.strstart === 0 || c.strstart >= O) && (c.lookahead = c.strstart - O, c.strstart = O, A(c, !1), c.strm.avail_out === 0) || c.strstart - c.block_start >= c.w_size - G && (A(c, !1), c.strm.avail_out === 0))
            return z;
        }
        return c.insert = 0, at === g ? (A(c, !0), c.strm.avail_out === 0 ? nt : St) : (c.strstart > c.block_start && (A(c, !1), c.strm.avail_out), z);
      }
      function Nt(c, at) {
        for (var lt, O; ; ) {
          if (c.lookahead < G) {
            if (Dt(c), c.lookahead < G && at === f)
              return z;
            if (c.lookahead === 0)
              break;
          }
          if (lt = 0, c.lookahead >= ot && (c.ins_h = (c.ins_h << c.hash_shift ^ c.window[c.strstart + ot - 1]) & c.hash_mask, lt = c.prev[c.strstart & c.w_mask] = c.head[c.ins_h], c.head[c.ins_h] = c.strstart), lt !== 0 && c.strstart - lt <= c.w_size - G && (c.match_length = Pt(c, lt)), c.match_length >= ot)
            if (O = o._tr_tally(c, c.strstart - c.match_start, c.match_length - ot), c.lookahead -= c.match_length, c.match_length <= c.max_lazy_match && c.lookahead >= ot) {
              c.match_length--;
              do
                c.strstart++, c.ins_h = (c.ins_h << c.hash_shift ^ c.window[c.strstart + ot - 1]) & c.hash_mask, lt = c.prev[c.strstart & c.w_mask] = c.head[c.ins_h], c.head[c.ins_h] = c.strstart;
              while (--c.match_length !== 0);
              c.strstart++;
            } else
              c.strstart += c.match_length, c.match_length = 0, c.ins_h = c.window[c.strstart], c.ins_h = (c.ins_h << c.hash_shift ^ c.window[c.strstart + 1]) & c.hash_mask;
          else
            O = o._tr_tally(c, 0, c.window[c.strstart]), c.lookahead--, c.strstart++;
          if (O && (A(c, !1), c.strm.avail_out === 0))
            return z;
        }
        return c.insert = c.strstart < ot - 1 ? c.strstart : ot - 1, at === g ? (A(c, !0), c.strm.avail_out === 0 ? nt : St) : c.last_lit && (A(c, !1), c.strm.avail_out === 0) ? z : J;
      }
      function Ut(c, at) {
        for (var lt, O, V; ; ) {
          if (c.lookahead < G) {
            if (Dt(c), c.lookahead < G && at === f)
              return z;
            if (c.lookahead === 0)
              break;
          }
          if (lt = 0, c.lookahead >= ot && (c.ins_h = (c.ins_h << c.hash_shift ^ c.window[c.strstart + ot - 1]) & c.hash_mask, lt = c.prev[c.strstart & c.w_mask] = c.head[c.ins_h], c.head[c.ins_h] = c.strstart), c.prev_length = c.match_length, c.prev_match = c.match_start, c.match_length = ot - 1, lt !== 0 && c.prev_length < c.max_lazy_match && c.strstart - lt <= c.w_size - G && (c.match_length = Pt(c, lt), c.match_length <= 5 && (c.strategy === F || c.match_length === ot && c.strstart - c.match_start > 4096) && (c.match_length = ot - 1)), c.prev_length >= ot && c.match_length <= c.prev_length) {
            V = c.strstart + c.lookahead - ot, O = o._tr_tally(c, c.strstart - 1 - c.prev_match, c.prev_length - ot), c.lookahead -= c.prev_length - 1, c.prev_length -= 2;
            do
              ++c.strstart <= V && (c.ins_h = (c.ins_h << c.hash_shift ^ c.window[c.strstart + ot - 1]) & c.hash_mask, lt = c.prev[c.strstart & c.w_mask] = c.head[c.ins_h], c.head[c.ins_h] = c.strstart);
            while (--c.prev_length !== 0);
            if (c.match_available = 0, c.match_length = ot - 1, c.strstart++, O && (A(c, !1), c.strm.avail_out === 0))
              return z;
          } else if (c.match_available) {
            if (O = o._tr_tally(c, 0, c.window[c.strstart - 1]), O && A(c, !1), c.strstart++, c.lookahead--, c.strm.avail_out === 0)
              return z;
          } else
            c.match_available = 1, c.strstart++, c.lookahead--;
        }
        return c.match_available && (O = o._tr_tally(c, 0, c.window[c.strstart - 1]), c.match_available = 0), c.insert = c.strstart < ot - 1 ? c.strstart : ot - 1, at === g ? (A(c, !0), c.strm.avail_out === 0 ? nt : St) : c.last_lit && (A(c, !1), c.strm.avail_out === 0) ? z : J;
      }
      function Jt(c, at) {
        for (var lt, O, V, rt, Ct = c.window; ; ) {
          if (c.lookahead <= U) {
            if (Dt(c), c.lookahead <= U && at === f)
              return z;
            if (c.lookahead === 0)
              break;
          }
          if (c.match_length = 0, c.lookahead >= ot && c.strstart > 0 && (V = c.strstart - 1, O = Ct[V], O === Ct[++V] && O === Ct[++V] && O === Ct[++V])) {
            rt = c.strstart + U;
            do
              ;
            while (O === Ct[++V] && O === Ct[++V] && O === Ct[++V] && O === Ct[++V] && O === Ct[++V] && O === Ct[++V] && O === Ct[++V] && O === Ct[++V] && V < rt);
            c.match_length = U - (rt - V), c.match_length > c.lookahead && (c.match_length = c.lookahead);
          }
          if (c.match_length >= ot ? (lt = o._tr_tally(c, 1, c.match_length - ot), c.lookahead -= c.match_length, c.strstart += c.match_length, c.match_length = 0) : (lt = o._tr_tally(c, 0, c.window[c.strstart]), c.lookahead--, c.strstart++), lt && (A(c, !1), c.strm.avail_out === 0))
            return z;
        }
        return c.insert = 0, at === g ? (A(c, !0), c.strm.avail_out === 0 ? nt : St) : c.last_lit && (A(c, !1), c.strm.avail_out === 0) ? z : J;
      }
      function ae(c, at) {
        for (var lt; ; ) {
          if (c.lookahead === 0 && (Dt(c), c.lookahead === 0)) {
            if (at === f)
              return z;
            break;
          }
          if (c.match_length = 0, lt = o._tr_tally(c, 0, c.window[c.strstart]), c.lookahead--, c.strstart++, lt && (A(c, !1), c.strm.avail_out === 0))
            return z;
        }
        return c.insert = 0, at === g ? (A(c, !0), c.strm.avail_out === 0 ? nt : St) : c.last_lit && (A(c, !1), c.strm.avail_out === 0) ? z : J;
      }
      function te(c, at, lt, O, V) {
        this.good_length = c, this.max_lazy = at, this.nice_length = lt, this.max_chain = O, this.func = V;
      }
      var ne;
      ne = [
        /*      good lazy nice chain */
        new te(0, 0, 0, 0, Kt),
        /* 0 store only */
        new te(4, 4, 8, 4, Nt),
        /* 1 max speed, no lazy matches */
        new te(4, 5, 16, 8, Nt),
        /* 2 */
        new te(4, 6, 32, 32, Nt),
        /* 3 */
        new te(4, 4, 16, 16, Ut),
        /* 4 lazy matches */
        new te(8, 16, 32, 32, Ut),
        /* 5 */
        new te(8, 16, 128, 128, Ut),
        /* 6 */
        new te(8, 32, 128, 256, Ut),
        /* 7 */
        new te(32, 128, 258, 1024, Ut),
        /* 8 */
        new te(32, 258, 258, 4096, Ut)
        /* 9 max compression */
      ];
      function fe(c) {
        c.window_size = 2 * c.w_size, l(c.head), c.max_lazy_match = ne[c.level].max_lazy, c.good_match = ne[c.level].good_length, c.nice_match = ne[c.level].nice_length, c.max_chain_length = ne[c.level].max_chain, c.strstart = 0, c.block_start = 0, c.lookahead = 0, c.insert = 0, c.match_length = c.prev_length = ot - 1, c.match_available = 0, c.ins_h = 0;
      }
      function T() {
        this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = M, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new i.Buf16(dt * 2), this.dyn_dtree = new i.Buf16((2 * q + 1) * 2), this.bl_tree = new i.Buf16((2 * it + 1) * 2), l(this.dyn_ltree), l(this.dyn_dtree), l(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new i.Buf16(kt + 1), this.heap = new i.Buf16(2 * S + 1), l(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new i.Buf16(2 * S + 1), l(this.depth), this.l_buf = 0, this.lit_bufsize = 0, this.last_lit = 0, this.d_buf = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
      }
      function yt(c) {
        var at;
        return !c || !c.state ? B(c, _) : (c.total_in = c.total_out = 0, c.data_type = D, at = c.state, at.pending = 0, at.pending_out = 0, at.wrap < 0 && (at.wrap = -at.wrap), at.status = at.wrap ? ct : gt, c.adler = at.wrap === 2 ? 0 : 1, at.last_flush = f, o._tr_init(at), y);
      }
      function wt(c) {
        var at = yt(c);
        return at === y && fe(c.state), at;
      }
      function Rt(c, at) {
        return !c || !c.state || c.state.wrap !== 2 ? _ : (c.state.gzhead = at, y);
      }
      function K(c, at, lt, O, V, rt) {
        if (!c)
          return _;
        var Ct = 1;
        if (at === C && (at = 6), O < 0 ? (Ct = 0, O = -O) : O > 15 && (Ct = 2, O -= 16), V < 1 || V > H || lt !== M || O < 8 || O > 15 || at < 0 || at > 9 || rt < 0 || rt > R)
          return B(c, _);
        O === 8 && (O = 9);
        var xt = new T();
        return c.state = xt, xt.strm = c, xt.wrap = Ct, xt.gzhead = null, xt.w_bits = O, xt.w_size = 1 << xt.w_bits, xt.w_mask = xt.w_size - 1, xt.hash_bits = V + 7, xt.hash_size = 1 << xt.hash_bits, xt.hash_mask = xt.hash_size - 1, xt.hash_shift = ~~((xt.hash_bits + ot - 1) / ot), xt.window = new i.Buf8(xt.w_size * 2), xt.head = new i.Buf16(xt.hash_size), xt.prev = new i.Buf16(xt.w_size), xt.lit_bufsize = 1 << V + 6, xt.pending_buf_size = xt.lit_bufsize * 4, xt.pending_buf = new i.Buf8(xt.pending_buf_size), xt.d_buf = 1 * xt.lit_bufsize, xt.l_buf = 3 * xt.lit_bufsize, xt.level = at, xt.strategy = rt, xt.method = lt, wt(c);
      }
      function ft(c, at) {
        return K(c, at, M, Y, Q, v);
      }
      function k(c, at) {
        var lt, O, V, rt;
        if (!c || !c.state || at > m || at < 0)
          return c ? B(c, _) : _;
        if (O = c.state, !c.output || !c.input && c.avail_in !== 0 || O.status === mt && at !== g)
          return B(c, c.avail_out === 0 ? x : _);
        if (O.strm = c, lt = O.last_flush, O.last_flush = at, O.status === ct)
          if (O.wrap === 2)
            c.adler = 0, P(O, 31), P(O, 139), P(O, 8), O.gzhead ? (P(
              O,
              (O.gzhead.text ? 1 : 0) + (O.gzhead.hcrc ? 2 : 0) + (O.gzhead.extra ? 4 : 0) + (O.gzhead.name ? 8 : 0) + (O.gzhead.comment ? 16 : 0)
            ), P(O, O.gzhead.time & 255), P(O, O.gzhead.time >> 8 & 255), P(O, O.gzhead.time >> 16 & 255), P(O, O.gzhead.time >> 24 & 255), P(O, O.level === 9 ? 2 : O.strategy >= L || O.level < 2 ? 4 : 0), P(O, O.gzhead.os & 255), O.gzhead.extra && O.gzhead.extra.length && (P(O, O.gzhead.extra.length & 255), P(O, O.gzhead.extra.length >> 8 & 255)), O.gzhead.hcrc && (c.adler = h(c.adler, O.pending_buf, O.pending, 0)), O.gzindex = 0, O.status = W) : (P(O, 0), P(O, 0), P(O, 0), P(O, 0), P(O, 0), P(O, O.level === 9 ? 2 : O.strategy >= L || O.level < 2 ? 4 : 0), P(O, Et), O.status = gt);
          else {
            var Ct = M + (O.w_bits - 8 << 4) << 8, xt = -1;
            O.strategy >= L || O.level < 2 ? xt = 0 : O.level < 6 ? xt = 1 : O.level === 6 ? xt = 2 : xt = 3, Ct |= xt << 6, O.strstart !== 0 && (Ct |= $), Ct += 31 - Ct % 31, O.status = gt, et(O, Ct), O.strstart !== 0 && (et(O, c.adler >>> 16), et(O, c.adler & 65535)), c.adler = 1;
          }
        if (O.status === W)
          if (O.gzhead.extra) {
            for (V = O.pending; O.gzindex < (O.gzhead.extra.length & 65535) && !(O.pending === O.pending_buf_size && (O.gzhead.hcrc && O.pending > V && (c.adler = h(c.adler, O.pending_buf, O.pending - V, V)), b(c), V = O.pending, O.pending === O.pending_buf_size)); )
              P(O, O.gzhead.extra[O.gzindex] & 255), O.gzindex++;
            O.gzhead.hcrc && O.pending > V && (c.adler = h(c.adler, O.pending_buf, O.pending - V, V)), O.gzindex === O.gzhead.extra.length && (O.gzindex = 0, O.status = X);
          } else
            O.status = X;
        if (O.status === X)
          if (O.gzhead.name) {
            V = O.pending;
            do {
              if (O.pending === O.pending_buf_size && (O.gzhead.hcrc && O.pending > V && (c.adler = h(c.adler, O.pending_buf, O.pending - V, V)), b(c), V = O.pending, O.pending === O.pending_buf_size)) {
                rt = 1;
                break;
              }
              O.gzindex < O.gzhead.name.length ? rt = O.gzhead.name.charCodeAt(O.gzindex++) & 255 : rt = 0, P(O, rt);
            } while (rt !== 0);
            O.gzhead.hcrc && O.pending > V && (c.adler = h(c.adler, O.pending_buf, O.pending - V, V)), rt === 0 && (O.gzindex = 0, O.status = tt);
          } else
            O.status = tt;
        if (O.status === tt)
          if (O.gzhead.comment) {
            V = O.pending;
            do {
              if (O.pending === O.pending_buf_size && (O.gzhead.hcrc && O.pending > V && (c.adler = h(c.adler, O.pending_buf, O.pending - V, V)), b(c), V = O.pending, O.pending === O.pending_buf_size)) {
                rt = 1;
                break;
              }
              O.gzindex < O.gzhead.comment.length ? rt = O.gzhead.comment.charCodeAt(O.gzindex++) & 255 : rt = 0, P(O, rt);
            } while (rt !== 0);
            O.gzhead.hcrc && O.pending > V && (c.adler = h(c.adler, O.pending_buf, O.pending - V, V)), rt === 0 && (O.status = ut);
          } else
            O.status = ut;
        if (O.status === ut && (O.gzhead.hcrc ? (O.pending + 2 > O.pending_buf_size && b(c), O.pending + 2 <= O.pending_buf_size && (P(O, c.adler & 255), P(O, c.adler >> 8 & 255), c.adler = 0, O.status = gt)) : O.status = gt), O.pending !== 0) {
          if (b(c), c.avail_out === 0)
            return O.last_flush = -1, y;
        } else if (c.avail_in === 0 && N(at) <= N(lt) && at !== g)
          return B(c, x);
        if (O.status === mt && c.avail_in !== 0)
          return B(c, x);
        if (c.avail_in !== 0 || O.lookahead !== 0 || at !== f && O.status !== mt) {
          var Ot = O.strategy === L ? ae(O, at) : O.strategy === I ? Jt(O, at) : ne[O.level].func(O, at);
          if ((Ot === nt || Ot === St) && (O.status = mt), Ot === z || Ot === nt)
            return c.avail_out === 0 && (O.last_flush = -1), y;
          if (Ot === J && (at === d ? o._tr_align(O) : at !== m && (o._tr_stored_block(O, 0, 0, !1), at === s && (l(O.head), O.lookahead === 0 && (O.strstart = 0, O.block_start = 0, O.insert = 0))), b(c), c.avail_out === 0))
            return O.last_flush = -1, y;
        }
        return at !== g ? y : O.wrap <= 0 ? w : (O.wrap === 2 ? (P(O, c.adler & 255), P(O, c.adler >> 8 & 255), P(O, c.adler >> 16 & 255), P(O, c.adler >> 24 & 255), P(O, c.total_in & 255), P(O, c.total_in >> 8 & 255), P(O, c.total_in >> 16 & 255), P(O, c.total_in >> 24 & 255)) : (et(O, c.adler >>> 16), et(O, c.adler & 65535)), b(c), O.wrap > 0 && (O.wrap = -O.wrap), O.pending !== 0 ? y : w);
      }
      function bt(c) {
        var at;
        return !c || !c.state ? _ : (at = c.state.status, at !== ct && at !== W && at !== X && at !== tt && at !== ut && at !== gt && at !== mt ? B(c, _) : (c.state = null, at === gt ? B(c, E) : y));
      }
      function Mt(c, at) {
        var lt = at.length, O, V, rt, Ct, xt, Ot, Wt, be;
        if (!c || !c.state || (O = c.state, Ct = O.wrap, Ct === 2 || Ct === 1 && O.status !== ct || O.lookahead))
          return _;
        for (Ct === 1 && (c.adler = u(c.adler, at, lt, 0)), O.wrap = 0, lt >= O.w_size && (Ct === 0 && (l(O.head), O.strstart = 0, O.block_start = 0, O.insert = 0), be = new i.Buf8(O.w_size), i.arraySet(be, at, lt - O.w_size, O.w_size, 0), at = be, lt = O.w_size), xt = c.avail_in, Ot = c.next_in, Wt = c.input, c.avail_in = lt, c.next_in = 0, c.input = at, Dt(O); O.lookahead >= ot; ) {
          V = O.strstart, rt = O.lookahead - (ot - 1);
          do
            O.ins_h = (O.ins_h << O.hash_shift ^ O.window[V + ot - 1]) & O.hash_mask, O.prev[V & O.w_mask] = O.head[O.ins_h], O.head[O.ins_h] = V, V++;
          while (--rt);
          O.strstart = V, O.lookahead = ot - 1, Dt(O);
        }
        return O.strstart += O.lookahead, O.block_start = O.strstart, O.insert = O.lookahead, O.lookahead = 0, O.match_length = O.prev_length = ot - 1, O.match_available = 0, c.next_in = Ot, c.input = Wt, c.avail_in = xt, O.wrap = Ct, y;
      }
      e.deflateInit = ft, e.deflateInit2 = K, e.deflateReset = wt, e.deflateResetKeep = yt, e.deflateSetHeader = Rt, e.deflate = k, e.deflateEnd = bt, e.deflateSetDictionary = Mt, e.deflateInfo = "pako deflate (from Nodeca project)";
    }, { "../utils/common": 52, "./adler32": 53, "./crc32": 55, "./messages": 60, "./trees": 61 }], 57: [function(t, a, e) {
      var i = 30, o = 12;
      a.exports = function(u, h) {
        var p, f, d, s, g, m, y, w, _, E, x, C, F, L, I, R, v, D, M, H, Y, Q, st, j, S;
        p = u.state, f = u.next_in, j = u.input, d = f + (u.avail_in - 5), s = u.next_out, S = u.output, g = s - (h - u.avail_out), m = s + (u.avail_out - 257), y = p.dmax, w = p.wsize, _ = p.whave, E = p.wnext, x = p.window, C = p.hold, F = p.bits, L = p.lencode, I = p.distcode, R = (1 << p.lenbits) - 1, v = (1 << p.distbits) - 1;
        t:
          do {
            F < 15 && (C += j[f++] << F, F += 8, C += j[f++] << F, F += 8), D = L[C & R];
            e:
              for (; ; ) {
                if (M = D >>> 24, C >>>= M, F -= M, M = D >>> 16 & 255, M === 0)
                  S[s++] = D & 65535;
                else if (M & 16) {
                  H = D & 65535, M &= 15, M && (F < M && (C += j[f++] << F, F += 8), H += C & (1 << M) - 1, C >>>= M, F -= M), F < 15 && (C += j[f++] << F, F += 8, C += j[f++] << F, F += 8), D = I[C & v];
                  r:
                    for (; ; ) {
                      if (M = D >>> 24, C >>>= M, F -= M, M = D >>> 16 & 255, M & 16) {
                        if (Y = D & 65535, M &= 15, F < M && (C += j[f++] << F, F += 8, F < M && (C += j[f++] << F, F += 8)), Y += C & (1 << M) - 1, Y > y) {
                          u.msg = "invalid distance too far back", p.mode = i;
                          break t;
                        }
                        if (C >>>= M, F -= M, M = s - g, Y > M) {
                          if (M = Y - M, M > _ && p.sane) {
                            u.msg = "invalid distance too far back", p.mode = i;
                            break t;
                          }
                          if (Q = 0, st = x, E === 0) {
                            if (Q += w - M, M < H) {
                              H -= M;
                              do
                                S[s++] = x[Q++];
                              while (--M);
                              Q = s - Y, st = S;
                            }
                          } else if (E < M) {
                            if (Q += w + E - M, M -= E, M < H) {
                              H -= M;
                              do
                                S[s++] = x[Q++];
                              while (--M);
                              if (Q = 0, E < H) {
                                M = E, H -= M;
                                do
                                  S[s++] = x[Q++];
                                while (--M);
                                Q = s - Y, st = S;
                              }
                            }
                          } else if (Q += E - M, M < H) {
                            H -= M;
                            do
                              S[s++] = x[Q++];
                            while (--M);
                            Q = s - Y, st = S;
                          }
                          for (; H > 2; )
                            S[s++] = st[Q++], S[s++] = st[Q++], S[s++] = st[Q++], H -= 3;
                          H && (S[s++] = st[Q++], H > 1 && (S[s++] = st[Q++]));
                        } else {
                          Q = s - Y;
                          do
                            S[s++] = S[Q++], S[s++] = S[Q++], S[s++] = S[Q++], H -= 3;
                          while (H > 2);
                          H && (S[s++] = S[Q++], H > 1 && (S[s++] = S[Q++]));
                        }
                      } else if (M & 64) {
                        u.msg = "invalid distance code", p.mode = i;
                        break t;
                      } else {
                        D = I[(D & 65535) + (C & (1 << M) - 1)];
                        continue r;
                      }
                      break;
                    }
                } else if (M & 64)
                  if (M & 32) {
                    p.mode = o;
                    break t;
                  } else {
                    u.msg = "invalid literal/length code", p.mode = i;
                    break t;
                  }
                else {
                  D = L[(D & 65535) + (C & (1 << M) - 1)];
                  continue e;
                }
                break;
              }
          } while (f < d && s < m);
        H = F >> 3, f -= H, F -= H << 3, C &= (1 << F) - 1, u.next_in = f, u.next_out = s, u.avail_in = f < d ? 5 + (d - f) : 5 - (f - d), u.avail_out = s < m ? 257 + (m - s) : 257 - (s - m), p.hold = C, p.bits = F;
      };
    }, {}], 58: [function(t, a, e) {
      var i = t("../utils/common"), o = t("./adler32"), u = t("./crc32"), h = t("./inffast"), p = t("./inftrees"), f = 0, d = 1, s = 2, g = 4, m = 5, y = 6, w = 0, _ = 1, E = 2, x = -2, C = -3, F = -4, L = -5, I = 8, R = 1, v = 2, D = 3, M = 4, H = 5, Y = 6, Q = 7, st = 8, j = 9, S = 10, q = 11, it = 12, dt = 13, kt = 14, ot = 15, U = 16, G = 17, $ = 18, ct = 19, W = 20, X = 21, tt = 22, ut = 23, gt = 24, mt = 25, z = 26, J = 27, nt = 28, St = 29, Et = 30, B = 31, N = 32, l = 852, b = 592, A = 15, P = A;
      function et(K) {
        return (K >>> 24 & 255) + (K >>> 8 & 65280) + ((K & 65280) << 8) + ((K & 255) << 24);
      }
      function pt() {
        this.mode = 0, this.last = !1, this.wrap = 0, this.havedict = !1, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new i.Buf16(320), this.work = new i.Buf16(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
      }
      function Pt(K) {
        var ft;
        return !K || !K.state ? x : (ft = K.state, K.total_in = K.total_out = ft.total = 0, K.msg = "", ft.wrap && (K.adler = ft.wrap & 1), ft.mode = R, ft.last = 0, ft.havedict = 0, ft.dmax = 32768, ft.head = null, ft.hold = 0, ft.bits = 0, ft.lencode = ft.lendyn = new i.Buf32(l), ft.distcode = ft.distdyn = new i.Buf32(b), ft.sane = 1, ft.back = -1, w);
      }
      function Dt(K) {
        var ft;
        return !K || !K.state ? x : (ft = K.state, ft.wsize = 0, ft.whave = 0, ft.wnext = 0, Pt(K));
      }
      function Kt(K, ft) {
        var k, bt;
        return !K || !K.state || (bt = K.state, ft < 0 ? (k = 0, ft = -ft) : (k = (ft >> 4) + 1, ft < 48 && (ft &= 15)), ft && (ft < 8 || ft > 15)) ? x : (bt.window !== null && bt.wbits !== ft && (bt.window = null), bt.wrap = k, bt.wbits = ft, Dt(K));
      }
      function Nt(K, ft) {
        var k, bt;
        return K ? (bt = new pt(), K.state = bt, bt.window = null, k = Kt(K, ft), k !== w && (K.state = null), k) : x;
      }
      function Ut(K) {
        return Nt(K, P);
      }
      var Jt = !0, ae, te;
      function ne(K) {
        if (Jt) {
          var ft;
          for (ae = new i.Buf32(512), te = new i.Buf32(32), ft = 0; ft < 144; )
            K.lens[ft++] = 8;
          for (; ft < 256; )
            K.lens[ft++] = 9;
          for (; ft < 280; )
            K.lens[ft++] = 7;
          for (; ft < 288; )
            K.lens[ft++] = 8;
          for (p(d, K.lens, 0, 288, ae, 0, K.work, { bits: 9 }), ft = 0; ft < 32; )
            K.lens[ft++] = 5;
          p(s, K.lens, 0, 32, te, 0, K.work, { bits: 5 }), Jt = !1;
        }
        K.lencode = ae, K.lenbits = 9, K.distcode = te, K.distbits = 5;
      }
      function fe(K, ft, k, bt) {
        var Mt, c = K.state;
        return c.window === null && (c.wsize = 1 << c.wbits, c.wnext = 0, c.whave = 0, c.window = new i.Buf8(c.wsize)), bt >= c.wsize ? (i.arraySet(c.window, ft, k - c.wsize, c.wsize, 0), c.wnext = 0, c.whave = c.wsize) : (Mt = c.wsize - c.wnext, Mt > bt && (Mt = bt), i.arraySet(c.window, ft, k - bt, Mt, c.wnext), bt -= Mt, bt ? (i.arraySet(c.window, ft, k - bt, bt, 0), c.wnext = bt, c.whave = c.wsize) : (c.wnext += Mt, c.wnext === c.wsize && (c.wnext = 0), c.whave < c.wsize && (c.whave += Mt))), 0;
      }
      function T(K, ft) {
        var k, bt, Mt, c, at, lt, O, V, rt, Ct, xt, Ot, Wt, be, Z = 0, ht, At, It, jt, Vt, Zt, Tt, Qt, zt = new i.Buf8(4), $t, re, ve = (
          /* permutation of code lengths */
          [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]
        );
        if (!K || !K.state || !K.output || !K.input && K.avail_in !== 0)
          return x;
        k = K.state, k.mode === it && (k.mode = dt), at = K.next_out, Mt = K.output, O = K.avail_out, c = K.next_in, bt = K.input, lt = K.avail_in, V = k.hold, rt = k.bits, Ct = lt, xt = O, Qt = w;
        t:
          for (; ; )
            switch (k.mode) {
              case R:
                if (k.wrap === 0) {
                  k.mode = dt;
                  break;
                }
                for (; rt < 16; ) {
                  if (lt === 0)
                    break t;
                  lt--, V += bt[c++] << rt, rt += 8;
                }
                if (k.wrap & 2 && V === 35615) {
                  k.check = 0, zt[0] = V & 255, zt[1] = V >>> 8 & 255, k.check = u(k.check, zt, 2, 0), V = 0, rt = 0, k.mode = v;
                  break;
                }
                if (k.flags = 0, k.head && (k.head.done = !1), !(k.wrap & 1) || /* check if zlib header allowed */
                (((V & 255) << 8) + (V >> 8)) % 31) {
                  K.msg = "incorrect header check", k.mode = Et;
                  break;
                }
                if ((V & 15) !== I) {
                  K.msg = "unknown compression method", k.mode = Et;
                  break;
                }
                if (V >>>= 4, rt -= 4, Tt = (V & 15) + 8, k.wbits === 0)
                  k.wbits = Tt;
                else if (Tt > k.wbits) {
                  K.msg = "invalid window size", k.mode = Et;
                  break;
                }
                k.dmax = 1 << Tt, K.adler = k.check = 1, k.mode = V & 512 ? S : it, V = 0, rt = 0;
                break;
              case v:
                for (; rt < 16; ) {
                  if (lt === 0)
                    break t;
                  lt--, V += bt[c++] << rt, rt += 8;
                }
                if (k.flags = V, (k.flags & 255) !== I) {
                  K.msg = "unknown compression method", k.mode = Et;
                  break;
                }
                if (k.flags & 57344) {
                  K.msg = "unknown header flags set", k.mode = Et;
                  break;
                }
                k.head && (k.head.text = V >> 8 & 1), k.flags & 512 && (zt[0] = V & 255, zt[1] = V >>> 8 & 255, k.check = u(k.check, zt, 2, 0)), V = 0, rt = 0, k.mode = D;
              case D:
                for (; rt < 32; ) {
                  if (lt === 0)
                    break t;
                  lt--, V += bt[c++] << rt, rt += 8;
                }
                k.head && (k.head.time = V), k.flags & 512 && (zt[0] = V & 255, zt[1] = V >>> 8 & 255, zt[2] = V >>> 16 & 255, zt[3] = V >>> 24 & 255, k.check = u(k.check, zt, 4, 0)), V = 0, rt = 0, k.mode = M;
              case M:
                for (; rt < 16; ) {
                  if (lt === 0)
                    break t;
                  lt--, V += bt[c++] << rt, rt += 8;
                }
                k.head && (k.head.xflags = V & 255, k.head.os = V >> 8), k.flags & 512 && (zt[0] = V & 255, zt[1] = V >>> 8 & 255, k.check = u(k.check, zt, 2, 0)), V = 0, rt = 0, k.mode = H;
              case H:
                if (k.flags & 1024) {
                  for (; rt < 16; ) {
                    if (lt === 0)
                      break t;
                    lt--, V += bt[c++] << rt, rt += 8;
                  }
                  k.length = V, k.head && (k.head.extra_len = V), k.flags & 512 && (zt[0] = V & 255, zt[1] = V >>> 8 & 255, k.check = u(k.check, zt, 2, 0)), V = 0, rt = 0;
                } else
                  k.head && (k.head.extra = null);
                k.mode = Y;
              case Y:
                if (k.flags & 1024 && (Ot = k.length, Ot > lt && (Ot = lt), Ot && (k.head && (Tt = k.head.extra_len - k.length, k.head.extra || (k.head.extra = new Array(k.head.extra_len)), i.arraySet(
                  k.head.extra,
                  bt,
                  c,
                  // extra field is limited to 65536 bytes
                  // - no need for additional size check
                  Ot,
                  /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
                  Tt
                )), k.flags & 512 && (k.check = u(k.check, bt, Ot, c)), lt -= Ot, c += Ot, k.length -= Ot), k.length))
                  break t;
                k.length = 0, k.mode = Q;
              case Q:
                if (k.flags & 2048) {
                  if (lt === 0)
                    break t;
                  Ot = 0;
                  do
                    Tt = bt[c + Ot++], k.head && Tt && k.length < 65536 && (k.head.name += String.fromCharCode(Tt));
                  while (Tt && Ot < lt);
                  if (k.flags & 512 && (k.check = u(k.check, bt, Ot, c)), lt -= Ot, c += Ot, Tt)
                    break t;
                } else
                  k.head && (k.head.name = null);
                k.length = 0, k.mode = st;
              case st:
                if (k.flags & 4096) {
                  if (lt === 0)
                    break t;
                  Ot = 0;
                  do
                    Tt = bt[c + Ot++], k.head && Tt && k.length < 65536 && (k.head.comment += String.fromCharCode(Tt));
                  while (Tt && Ot < lt);
                  if (k.flags & 512 && (k.check = u(k.check, bt, Ot, c)), lt -= Ot, c += Ot, Tt)
                    break t;
                } else
                  k.head && (k.head.comment = null);
                k.mode = j;
              case j:
                if (k.flags & 512) {
                  for (; rt < 16; ) {
                    if (lt === 0)
                      break t;
                    lt--, V += bt[c++] << rt, rt += 8;
                  }
                  if (V !== (k.check & 65535)) {
                    K.msg = "header crc mismatch", k.mode = Et;
                    break;
                  }
                  V = 0, rt = 0;
                }
                k.head && (k.head.hcrc = k.flags >> 9 & 1, k.head.done = !0), K.adler = k.check = 0, k.mode = it;
                break;
              case S:
                for (; rt < 32; ) {
                  if (lt === 0)
                    break t;
                  lt--, V += bt[c++] << rt, rt += 8;
                }
                K.adler = k.check = et(V), V = 0, rt = 0, k.mode = q;
              case q:
                if (k.havedict === 0)
                  return K.next_out = at, K.avail_out = O, K.next_in = c, K.avail_in = lt, k.hold = V, k.bits = rt, E;
                K.adler = k.check = 1, k.mode = it;
              case it:
                if (ft === m || ft === y)
                  break t;
              case dt:
                if (k.last) {
                  V >>>= rt & 7, rt -= rt & 7, k.mode = J;
                  break;
                }
                for (; rt < 3; ) {
                  if (lt === 0)
                    break t;
                  lt--, V += bt[c++] << rt, rt += 8;
                }
                switch (k.last = V & 1, V >>>= 1, rt -= 1, V & 3) {
                  case 0:
                    k.mode = kt;
                    break;
                  case 1:
                    if (ne(k), k.mode = W, ft === y) {
                      V >>>= 2, rt -= 2;
                      break t;
                    }
                    break;
                  case 2:
                    k.mode = G;
                    break;
                  case 3:
                    K.msg = "invalid block type", k.mode = Et;
                }
                V >>>= 2, rt -= 2;
                break;
              case kt:
                for (V >>>= rt & 7, rt -= rt & 7; rt < 32; ) {
                  if (lt === 0)
                    break t;
                  lt--, V += bt[c++] << rt, rt += 8;
                }
                if ((V & 65535) !== (V >>> 16 ^ 65535)) {
                  K.msg = "invalid stored block lengths", k.mode = Et;
                  break;
                }
                if (k.length = V & 65535, V = 0, rt = 0, k.mode = ot, ft === y)
                  break t;
              case ot:
                k.mode = U;
              case U:
                if (Ot = k.length, Ot) {
                  if (Ot > lt && (Ot = lt), Ot > O && (Ot = O), Ot === 0)
                    break t;
                  i.arraySet(Mt, bt, c, Ot, at), lt -= Ot, c += Ot, O -= Ot, at += Ot, k.length -= Ot;
                  break;
                }
                k.mode = it;
                break;
              case G:
                for (; rt < 14; ) {
                  if (lt === 0)
                    break t;
                  lt--, V += bt[c++] << rt, rt += 8;
                }
                if (k.nlen = (V & 31) + 257, V >>>= 5, rt -= 5, k.ndist = (V & 31) + 1, V >>>= 5, rt -= 5, k.ncode = (V & 15) + 4, V >>>= 4, rt -= 4, k.nlen > 286 || k.ndist > 30) {
                  K.msg = "too many length or distance symbols", k.mode = Et;
                  break;
                }
                k.have = 0, k.mode = $;
              case $:
                for (; k.have < k.ncode; ) {
                  for (; rt < 3; ) {
                    if (lt === 0)
                      break t;
                    lt--, V += bt[c++] << rt, rt += 8;
                  }
                  k.lens[ve[k.have++]] = V & 7, V >>>= 3, rt -= 3;
                }
                for (; k.have < 19; )
                  k.lens[ve[k.have++]] = 0;
                if (k.lencode = k.lendyn, k.lenbits = 7, $t = { bits: k.lenbits }, Qt = p(f, k.lens, 0, 19, k.lencode, 0, k.work, $t), k.lenbits = $t.bits, Qt) {
                  K.msg = "invalid code lengths set", k.mode = Et;
                  break;
                }
                k.have = 0, k.mode = ct;
              case ct:
                for (; k.have < k.nlen + k.ndist; ) {
                  for (; Z = k.lencode[V & (1 << k.lenbits) - 1], ht = Z >>> 24, At = Z >>> 16 & 255, It = Z & 65535, !(ht <= rt); ) {
                    if (lt === 0)
                      break t;
                    lt--, V += bt[c++] << rt, rt += 8;
                  }
                  if (It < 16)
                    V >>>= ht, rt -= ht, k.lens[k.have++] = It;
                  else {
                    if (It === 16) {
                      for (re = ht + 2; rt < re; ) {
                        if (lt === 0)
                          break t;
                        lt--, V += bt[c++] << rt, rt += 8;
                      }
                      if (V >>>= ht, rt -= ht, k.have === 0) {
                        K.msg = "invalid bit length repeat", k.mode = Et;
                        break;
                      }
                      Tt = k.lens[k.have - 1], Ot = 3 + (V & 3), V >>>= 2, rt -= 2;
                    } else if (It === 17) {
                      for (re = ht + 3; rt < re; ) {
                        if (lt === 0)
                          break t;
                        lt--, V += bt[c++] << rt, rt += 8;
                      }
                      V >>>= ht, rt -= ht, Tt = 0, Ot = 3 + (V & 7), V >>>= 3, rt -= 3;
                    } else {
                      for (re = ht + 7; rt < re; ) {
                        if (lt === 0)
                          break t;
                        lt--, V += bt[c++] << rt, rt += 8;
                      }
                      V >>>= ht, rt -= ht, Tt = 0, Ot = 11 + (V & 127), V >>>= 7, rt -= 7;
                    }
                    if (k.have + Ot > k.nlen + k.ndist) {
                      K.msg = "invalid bit length repeat", k.mode = Et;
                      break;
                    }
                    for (; Ot--; )
                      k.lens[k.have++] = Tt;
                  }
                }
                if (k.mode === Et)
                  break;
                if (k.lens[256] === 0) {
                  K.msg = "invalid code -- missing end-of-block", k.mode = Et;
                  break;
                }
                if (k.lenbits = 9, $t = { bits: k.lenbits }, Qt = p(d, k.lens, 0, k.nlen, k.lencode, 0, k.work, $t), k.lenbits = $t.bits, Qt) {
                  K.msg = "invalid literal/lengths set", k.mode = Et;
                  break;
                }
                if (k.distbits = 6, k.distcode = k.distdyn, $t = { bits: k.distbits }, Qt = p(s, k.lens, k.nlen, k.ndist, k.distcode, 0, k.work, $t), k.distbits = $t.bits, Qt) {
                  K.msg = "invalid distances set", k.mode = Et;
                  break;
                }
                if (k.mode = W, ft === y)
                  break t;
              case W:
                k.mode = X;
              case X:
                if (lt >= 6 && O >= 258) {
                  K.next_out = at, K.avail_out = O, K.next_in = c, K.avail_in = lt, k.hold = V, k.bits = rt, h(K, xt), at = K.next_out, Mt = K.output, O = K.avail_out, c = K.next_in, bt = K.input, lt = K.avail_in, V = k.hold, rt = k.bits, k.mode === it && (k.back = -1);
                  break;
                }
                for (k.back = 0; Z = k.lencode[V & (1 << k.lenbits) - 1], ht = Z >>> 24, At = Z >>> 16 & 255, It = Z & 65535, !(ht <= rt); ) {
                  if (lt === 0)
                    break t;
                  lt--, V += bt[c++] << rt, rt += 8;
                }
                if (At && !(At & 240)) {
                  for (jt = ht, Vt = At, Zt = It; Z = k.lencode[Zt + ((V & (1 << jt + Vt) - 1) >> jt)], ht = Z >>> 24, At = Z >>> 16 & 255, It = Z & 65535, !(jt + ht <= rt); ) {
                    if (lt === 0)
                      break t;
                    lt--, V += bt[c++] << rt, rt += 8;
                  }
                  V >>>= jt, rt -= jt, k.back += jt;
                }
                if (V >>>= ht, rt -= ht, k.back += ht, k.length = It, At === 0) {
                  k.mode = z;
                  break;
                }
                if (At & 32) {
                  k.back = -1, k.mode = it;
                  break;
                }
                if (At & 64) {
                  K.msg = "invalid literal/length code", k.mode = Et;
                  break;
                }
                k.extra = At & 15, k.mode = tt;
              case tt:
                if (k.extra) {
                  for (re = k.extra; rt < re; ) {
                    if (lt === 0)
                      break t;
                    lt--, V += bt[c++] << rt, rt += 8;
                  }
                  k.length += V & (1 << k.extra) - 1, V >>>= k.extra, rt -= k.extra, k.back += k.extra;
                }
                k.was = k.length, k.mode = ut;
              case ut:
                for (; Z = k.distcode[V & (1 << k.distbits) - 1], ht = Z >>> 24, At = Z >>> 16 & 255, It = Z & 65535, !(ht <= rt); ) {
                  if (lt === 0)
                    break t;
                  lt--, V += bt[c++] << rt, rt += 8;
                }
                if (!(At & 240)) {
                  for (jt = ht, Vt = At, Zt = It; Z = k.distcode[Zt + ((V & (1 << jt + Vt) - 1) >> jt)], ht = Z >>> 24, At = Z >>> 16 & 255, It = Z & 65535, !(jt + ht <= rt); ) {
                    if (lt === 0)
                      break t;
                    lt--, V += bt[c++] << rt, rt += 8;
                  }
                  V >>>= jt, rt -= jt, k.back += jt;
                }
                if (V >>>= ht, rt -= ht, k.back += ht, At & 64) {
                  K.msg = "invalid distance code", k.mode = Et;
                  break;
                }
                k.offset = It, k.extra = At & 15, k.mode = gt;
              case gt:
                if (k.extra) {
                  for (re = k.extra; rt < re; ) {
                    if (lt === 0)
                      break t;
                    lt--, V += bt[c++] << rt, rt += 8;
                  }
                  k.offset += V & (1 << k.extra) - 1, V >>>= k.extra, rt -= k.extra, k.back += k.extra;
                }
                if (k.offset > k.dmax) {
                  K.msg = "invalid distance too far back", k.mode = Et;
                  break;
                }
                k.mode = mt;
              case mt:
                if (O === 0)
                  break t;
                if (Ot = xt - O, k.offset > Ot) {
                  if (Ot = k.offset - Ot, Ot > k.whave && k.sane) {
                    K.msg = "invalid distance too far back", k.mode = Et;
                    break;
                  }
                  Ot > k.wnext ? (Ot -= k.wnext, Wt = k.wsize - Ot) : Wt = k.wnext - Ot, Ot > k.length && (Ot = k.length), be = k.window;
                } else
                  be = Mt, Wt = at - k.offset, Ot = k.length;
                Ot > O && (Ot = O), O -= Ot, k.length -= Ot;
                do
                  Mt[at++] = be[Wt++];
                while (--Ot);
                k.length === 0 && (k.mode = X);
                break;
              case z:
                if (O === 0)
                  break t;
                Mt[at++] = k.length, O--, k.mode = X;
                break;
              case J:
                if (k.wrap) {
                  for (; rt < 32; ) {
                    if (lt === 0)
                      break t;
                    lt--, V |= bt[c++] << rt, rt += 8;
                  }
                  if (xt -= O, K.total_out += xt, k.total += xt, xt && (K.adler = k.check = /*UPDATE(state.check, put - _out, _out);*/
                  k.flags ? u(k.check, Mt, xt, at - xt) : o(k.check, Mt, xt, at - xt)), xt = O, (k.flags ? V : et(V)) !== k.check) {
                    K.msg = "incorrect data check", k.mode = Et;
                    break;
                  }
                  V = 0, rt = 0;
                }
                k.mode = nt;
              case nt:
                if (k.wrap && k.flags) {
                  for (; rt < 32; ) {
                    if (lt === 0)
                      break t;
                    lt--, V += bt[c++] << rt, rt += 8;
                  }
                  if (V !== (k.total & 4294967295)) {
                    K.msg = "incorrect length check", k.mode = Et;
                    break;
                  }
                  V = 0, rt = 0;
                }
                k.mode = St;
              case St:
                Qt = _;
                break t;
              case Et:
                Qt = C;
                break t;
              case B:
                return F;
              case N:
              default:
                return x;
            }
        return K.next_out = at, K.avail_out = O, K.next_in = c, K.avail_in = lt, k.hold = V, k.bits = rt, (k.wsize || xt !== K.avail_out && k.mode < Et && (k.mode < J || ft !== g)) && fe(K, K.output, K.next_out, xt - K.avail_out), Ct -= K.avail_in, xt -= K.avail_out, K.total_in += Ct, K.total_out += xt, k.total += xt, k.wrap && xt && (K.adler = k.check = /*UPDATE(state.check, strm.next_out - _out, _out);*/
        k.flags ? u(k.check, Mt, xt, K.next_out - xt) : o(k.check, Mt, xt, K.next_out - xt)), K.data_type = k.bits + (k.last ? 64 : 0) + (k.mode === it ? 128 : 0) + (k.mode === W || k.mode === ot ? 256 : 0), (Ct === 0 && xt === 0 || ft === g) && Qt === w && (Qt = L), Qt;
      }
      function yt(K) {
        if (!K || !K.state)
          return x;
        var ft = K.state;
        return ft.window && (ft.window = null), K.state = null, w;
      }
      function wt(K, ft) {
        var k;
        return !K || !K.state || (k = K.state, !(k.wrap & 2)) ? x : (k.head = ft, ft.done = !1, w);
      }
      function Rt(K, ft) {
        var k = ft.length, bt, Mt, c;
        return !K || !K.state || (bt = K.state, bt.wrap !== 0 && bt.mode !== q) ? x : bt.mode === q && (Mt = 1, Mt = o(Mt, ft, k, 0), Mt !== bt.check) ? C : (c = fe(K, ft, k, k), c ? (bt.mode = B, F) : (bt.havedict = 1, w));
      }
      e.inflateReset = Dt, e.inflateReset2 = Kt, e.inflateResetKeep = Pt, e.inflateInit = Ut, e.inflateInit2 = Nt, e.inflate = T, e.inflateEnd = yt, e.inflateGetHeader = wt, e.inflateSetDictionary = Rt, e.inflateInfo = "pako inflate (from Nodeca project)";
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
      ], y = [
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
      a.exports = function(w, _, E, x, C, F, L, I) {
        var R = I.bits, v = 0, D = 0, M = 0, H = 0, Y = 0, Q = 0, st = 0, j = 0, S = 0, q = 0, it, dt, kt, ot, U, G = null, $ = 0, ct, W = new i.Buf16(o + 1), X = new i.Buf16(o + 1), tt = null, ut = 0, gt, mt, z;
        for (v = 0; v <= o; v++)
          W[v] = 0;
        for (D = 0; D < x; D++)
          W[_[E + D]]++;
        for (Y = R, H = o; H >= 1 && W[H] === 0; H--)
          ;
        if (Y > H && (Y = H), H === 0)
          return C[F++] = 1 << 24 | 64 << 16 | 0, C[F++] = 1 << 24 | 64 << 16 | 0, I.bits = 1, 0;
        for (M = 1; M < H && W[M] === 0; M++)
          ;
        for (Y < M && (Y = M), j = 1, v = 1; v <= o; v++)
          if (j <<= 1, j -= W[v], j < 0)
            return -1;
        if (j > 0 && (w === p || H !== 1))
          return -1;
        for (X[1] = 0, v = 1; v < o; v++)
          X[v + 1] = X[v] + W[v];
        for (D = 0; D < x; D++)
          _[E + D] !== 0 && (L[X[_[E + D]]++] = D);
        if (w === p ? (G = tt = L, ct = 19) : w === f ? (G = s, $ -= 257, tt = g, ut -= 257, ct = 256) : (G = m, tt = y, ct = -1), q = 0, D = 0, v = M, U = F, Q = Y, st = 0, kt = -1, S = 1 << Y, ot = S - 1, w === f && S > u || w === d && S > h)
          return 1;
        for (; ; ) {
          gt = v - st, L[D] < ct ? (mt = 0, z = L[D]) : L[D] > ct ? (mt = tt[ut + L[D]], z = G[$ + L[D]]) : (mt = 96, z = 0), it = 1 << v - st, dt = 1 << Q, M = dt;
          do
            dt -= it, C[U + (q >> st) + dt] = gt << 24 | mt << 16 | z | 0;
          while (dt !== 0);
          for (it = 1 << v - 1; q & it; )
            it >>= 1;
          if (it !== 0 ? (q &= it - 1, q += it) : q = 0, D++, --W[v] === 0) {
            if (v === H)
              break;
            v = _[E + L[D]];
          }
          if (v > Y && (q & ot) !== kt) {
            for (st === 0 && (st = Y), U += M, Q = v - st, j = 1 << Q; Q + st < H && (j -= W[Q + st], !(j <= 0)); )
              Q++, j <<= 1;
            if (S += 1 << Q, w === f && S > u || w === d && S > h)
              return 1;
            kt = q & ot, C[kt] = Y << 24 | Q << 16 | U - F | 0;
          }
        }
        return q !== 0 && (C[U + q] = v - st << 24 | 64 << 16 | 0), I.bits = Y, 0;
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
      function f(T) {
        for (var yt = T.length; --yt >= 0; )
          T[yt] = 0;
      }
      var d = 0, s = 1, g = 2, m = 3, y = 258, w = 29, _ = 256, E = _ + 1 + w, x = 30, C = 19, F = 2 * E + 1, L = 15, I = 16, R = 7, v = 256, D = 16, M = 17, H = 18, Y = (
        /* extra bits for each length code */
        [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0]
      ), Q = (
        /* extra bits for each distance code */
        [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13]
      ), st = (
        /* extra bits for each bit length code */
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7]
      ), j = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15], S = 512, q = new Array((E + 2) * 2);
      f(q);
      var it = new Array(x * 2);
      f(it);
      var dt = new Array(S);
      f(dt);
      var kt = new Array(y - m + 1);
      f(kt);
      var ot = new Array(w);
      f(ot);
      var U = new Array(x);
      f(U);
      function G(T, yt, wt, Rt, K) {
        this.static_tree = T, this.extra_bits = yt, this.extra_base = wt, this.elems = Rt, this.max_length = K, this.has_stree = T && T.length;
      }
      var $, ct, W;
      function X(T, yt) {
        this.dyn_tree = T, this.max_code = 0, this.stat_desc = yt;
      }
      function tt(T) {
        return T < 256 ? dt[T] : dt[256 + (T >>> 7)];
      }
      function ut(T, yt) {
        T.pending_buf[T.pending++] = yt & 255, T.pending_buf[T.pending++] = yt >>> 8 & 255;
      }
      function gt(T, yt, wt) {
        T.bi_valid > I - wt ? (T.bi_buf |= yt << T.bi_valid & 65535, ut(T, T.bi_buf), T.bi_buf = yt >> I - T.bi_valid, T.bi_valid += wt - I) : (T.bi_buf |= yt << T.bi_valid & 65535, T.bi_valid += wt);
      }
      function mt(T, yt, wt) {
        gt(
          T,
          wt[yt * 2],
          wt[yt * 2 + 1]
          /*.Len*/
        );
      }
      function z(T, yt) {
        var wt = 0;
        do
          wt |= T & 1, T >>>= 1, wt <<= 1;
        while (--yt > 0);
        return wt >>> 1;
      }
      function J(T) {
        T.bi_valid === 16 ? (ut(T, T.bi_buf), T.bi_buf = 0, T.bi_valid = 0) : T.bi_valid >= 8 && (T.pending_buf[T.pending++] = T.bi_buf & 255, T.bi_buf >>= 8, T.bi_valid -= 8);
      }
      function nt(T, yt) {
        var wt = yt.dyn_tree, Rt = yt.max_code, K = yt.stat_desc.static_tree, ft = yt.stat_desc.has_stree, k = yt.stat_desc.extra_bits, bt = yt.stat_desc.extra_base, Mt = yt.stat_desc.max_length, c, at, lt, O, V, rt, Ct = 0;
        for (O = 0; O <= L; O++)
          T.bl_count[O] = 0;
        for (wt[T.heap[T.heap_max] * 2 + 1] = 0, c = T.heap_max + 1; c < F; c++)
          at = T.heap[c], O = wt[wt[at * 2 + 1] * 2 + 1] + 1, O > Mt && (O = Mt, Ct++), wt[at * 2 + 1] = O, !(at > Rt) && (T.bl_count[O]++, V = 0, at >= bt && (V = k[at - bt]), rt = wt[at * 2], T.opt_len += rt * (O + V), ft && (T.static_len += rt * (K[at * 2 + 1] + V)));
        if (Ct !== 0) {
          do {
            for (O = Mt - 1; T.bl_count[O] === 0; )
              O--;
            T.bl_count[O]--, T.bl_count[O + 1] += 2, T.bl_count[Mt]--, Ct -= 2;
          } while (Ct > 0);
          for (O = Mt; O !== 0; O--)
            for (at = T.bl_count[O]; at !== 0; )
              lt = T.heap[--c], !(lt > Rt) && (wt[lt * 2 + 1] !== O && (T.opt_len += (O - wt[lt * 2 + 1]) * wt[lt * 2], wt[lt * 2 + 1] = O), at--);
        }
      }
      function St(T, yt, wt) {
        var Rt = new Array(L + 1), K = 0, ft, k;
        for (ft = 1; ft <= L; ft++)
          Rt[ft] = K = K + wt[ft - 1] << 1;
        for (k = 0; k <= yt; k++) {
          var bt = T[k * 2 + 1];
          bt !== 0 && (T[k * 2] = z(Rt[bt]++, bt));
        }
      }
      function Et() {
        var T, yt, wt, Rt, K, ft = new Array(L + 1);
        for (wt = 0, Rt = 0; Rt < w - 1; Rt++)
          for (ot[Rt] = wt, T = 0; T < 1 << Y[Rt]; T++)
            kt[wt++] = Rt;
        for (kt[wt - 1] = Rt, K = 0, Rt = 0; Rt < 16; Rt++)
          for (U[Rt] = K, T = 0; T < 1 << Q[Rt]; T++)
            dt[K++] = Rt;
        for (K >>= 7; Rt < x; Rt++)
          for (U[Rt] = K << 7, T = 0; T < 1 << Q[Rt] - 7; T++)
            dt[256 + K++] = Rt;
        for (yt = 0; yt <= L; yt++)
          ft[yt] = 0;
        for (T = 0; T <= 143; )
          q[T * 2 + 1] = 8, T++, ft[8]++;
        for (; T <= 255; )
          q[T * 2 + 1] = 9, T++, ft[9]++;
        for (; T <= 279; )
          q[T * 2 + 1] = 7, T++, ft[7]++;
        for (; T <= 287; )
          q[T * 2 + 1] = 8, T++, ft[8]++;
        for (St(q, E + 1, ft), T = 0; T < x; T++)
          it[T * 2 + 1] = 5, it[T * 2] = z(T, 5);
        $ = new G(q, Y, _ + 1, E, L), ct = new G(it, Q, 0, x, L), W = new G(new Array(0), st, 0, C, R);
      }
      function B(T) {
        var yt;
        for (yt = 0; yt < E; yt++)
          T.dyn_ltree[yt * 2] = 0;
        for (yt = 0; yt < x; yt++)
          T.dyn_dtree[yt * 2] = 0;
        for (yt = 0; yt < C; yt++)
          T.bl_tree[yt * 2] = 0;
        T.dyn_ltree[v * 2] = 1, T.opt_len = T.static_len = 0, T.last_lit = T.matches = 0;
      }
      function N(T) {
        T.bi_valid > 8 ? ut(T, T.bi_buf) : T.bi_valid > 0 && (T.pending_buf[T.pending++] = T.bi_buf), T.bi_buf = 0, T.bi_valid = 0;
      }
      function l(T, yt, wt, Rt) {
        N(T), ut(T, wt), ut(T, ~wt), i.arraySet(T.pending_buf, T.window, yt, wt, T.pending), T.pending += wt;
      }
      function b(T, yt, wt, Rt) {
        var K = yt * 2, ft = wt * 2;
        return T[K] < T[ft] || T[K] === T[ft] && Rt[yt] <= Rt[wt];
      }
      function A(T, yt, wt) {
        for (var Rt = T.heap[wt], K = wt << 1; K <= T.heap_len && (K < T.heap_len && b(yt, T.heap[K + 1], T.heap[K], T.depth) && K++, !b(yt, Rt, T.heap[K], T.depth)); )
          T.heap[wt] = T.heap[K], wt = K, K <<= 1;
        T.heap[wt] = Rt;
      }
      function P(T, yt, wt) {
        var Rt, K, ft = 0, k, bt;
        if (T.last_lit !== 0)
          do
            Rt = T.pending_buf[T.d_buf + ft * 2] << 8 | T.pending_buf[T.d_buf + ft * 2 + 1], K = T.pending_buf[T.l_buf + ft], ft++, Rt === 0 ? mt(T, K, yt) : (k = kt[K], mt(T, k + _ + 1, yt), bt = Y[k], bt !== 0 && (K -= ot[k], gt(T, K, bt)), Rt--, k = tt(Rt), mt(T, k, wt), bt = Q[k], bt !== 0 && (Rt -= U[k], gt(T, Rt, bt)));
          while (ft < T.last_lit);
        mt(T, v, yt);
      }
      function et(T, yt) {
        var wt = yt.dyn_tree, Rt = yt.stat_desc.static_tree, K = yt.stat_desc.has_stree, ft = yt.stat_desc.elems, k, bt, Mt = -1, c;
        for (T.heap_len = 0, T.heap_max = F, k = 0; k < ft; k++)
          wt[k * 2] !== 0 ? (T.heap[++T.heap_len] = Mt = k, T.depth[k] = 0) : wt[k * 2 + 1] = 0;
        for (; T.heap_len < 2; )
          c = T.heap[++T.heap_len] = Mt < 2 ? ++Mt : 0, wt[c * 2] = 1, T.depth[c] = 0, T.opt_len--, K && (T.static_len -= Rt[c * 2 + 1]);
        for (yt.max_code = Mt, k = T.heap_len >> 1; k >= 1; k--)
          A(T, wt, k);
        c = ft;
        do
          k = T.heap[
            1
            /*SMALLEST*/
          ], T.heap[
            1
            /*SMALLEST*/
          ] = T.heap[T.heap_len--], A(
            T,
            wt,
            1
            /*SMALLEST*/
          ), bt = T.heap[
            1
            /*SMALLEST*/
          ], T.heap[--T.heap_max] = k, T.heap[--T.heap_max] = bt, wt[c * 2] = wt[k * 2] + wt[bt * 2], T.depth[c] = (T.depth[k] >= T.depth[bt] ? T.depth[k] : T.depth[bt]) + 1, wt[k * 2 + 1] = wt[bt * 2 + 1] = c, T.heap[
            1
            /*SMALLEST*/
          ] = c++, A(
            T,
            wt,
            1
            /*SMALLEST*/
          );
        while (T.heap_len >= 2);
        T.heap[--T.heap_max] = T.heap[
          1
          /*SMALLEST*/
        ], nt(T, yt), St(wt, Mt, T.bl_count);
      }
      function pt(T, yt, wt) {
        var Rt, K = -1, ft, k = yt[1], bt = 0, Mt = 7, c = 4;
        for (k === 0 && (Mt = 138, c = 3), yt[(wt + 1) * 2 + 1] = 65535, Rt = 0; Rt <= wt; Rt++)
          ft = k, k = yt[(Rt + 1) * 2 + 1], !(++bt < Mt && ft === k) && (bt < c ? T.bl_tree[ft * 2] += bt : ft !== 0 ? (ft !== K && T.bl_tree[ft * 2]++, T.bl_tree[D * 2]++) : bt <= 10 ? T.bl_tree[M * 2]++ : T.bl_tree[H * 2]++, bt = 0, K = ft, k === 0 ? (Mt = 138, c = 3) : ft === k ? (Mt = 6, c = 3) : (Mt = 7, c = 4));
      }
      function Pt(T, yt, wt) {
        var Rt, K = -1, ft, k = yt[1], bt = 0, Mt = 7, c = 4;
        for (k === 0 && (Mt = 138, c = 3), Rt = 0; Rt <= wt; Rt++)
          if (ft = k, k = yt[(Rt + 1) * 2 + 1], !(++bt < Mt && ft === k)) {
            if (bt < c)
              do
                mt(T, ft, T.bl_tree);
              while (--bt !== 0);
            else
              ft !== 0 ? (ft !== K && (mt(T, ft, T.bl_tree), bt--), mt(T, D, T.bl_tree), gt(T, bt - 3, 2)) : bt <= 10 ? (mt(T, M, T.bl_tree), gt(T, bt - 3, 3)) : (mt(T, H, T.bl_tree), gt(T, bt - 11, 7));
            bt = 0, K = ft, k === 0 ? (Mt = 138, c = 3) : ft === k ? (Mt = 6, c = 3) : (Mt = 7, c = 4);
          }
      }
      function Dt(T) {
        var yt;
        for (pt(T, T.dyn_ltree, T.l_desc.max_code), pt(T, T.dyn_dtree, T.d_desc.max_code), et(T, T.bl_desc), yt = C - 1; yt >= 3 && T.bl_tree[j[yt] * 2 + 1] === 0; yt--)
          ;
        return T.opt_len += 3 * (yt + 1) + 5 + 5 + 4, yt;
      }
      function Kt(T, yt, wt, Rt) {
        var K;
        for (gt(T, yt - 257, 5), gt(T, wt - 1, 5), gt(T, Rt - 4, 4), K = 0; K < Rt; K++)
          gt(T, T.bl_tree[j[K] * 2 + 1], 3);
        Pt(T, T.dyn_ltree, yt - 1), Pt(T, T.dyn_dtree, wt - 1);
      }
      function Nt(T) {
        var yt = 4093624447, wt;
        for (wt = 0; wt <= 31; wt++, yt >>>= 1)
          if (yt & 1 && T.dyn_ltree[wt * 2] !== 0)
            return u;
        if (T.dyn_ltree[18] !== 0 || T.dyn_ltree[20] !== 0 || T.dyn_ltree[26] !== 0)
          return h;
        for (wt = 32; wt < _; wt++)
          if (T.dyn_ltree[wt * 2] !== 0)
            return h;
        return u;
      }
      var Ut = !1;
      function Jt(T) {
        Ut || (Et(), Ut = !0), T.l_desc = new X(T.dyn_ltree, $), T.d_desc = new X(T.dyn_dtree, ct), T.bl_desc = new X(T.bl_tree, W), T.bi_buf = 0, T.bi_valid = 0, B(T);
      }
      function ae(T, yt, wt, Rt) {
        gt(T, (d << 1) + (Rt ? 1 : 0), 3), l(T, yt, wt);
      }
      function te(T) {
        gt(T, s << 1, 3), mt(T, v, q), J(T);
      }
      function ne(T, yt, wt, Rt) {
        var K, ft, k = 0;
        T.level > 0 ? (T.strm.data_type === p && (T.strm.data_type = Nt(T)), et(T, T.l_desc), et(T, T.d_desc), k = Dt(T), K = T.opt_len + 3 + 7 >>> 3, ft = T.static_len + 3 + 7 >>> 3, ft <= K && (K = ft)) : K = ft = wt + 5, wt + 4 <= K && yt !== -1 ? ae(T, yt, wt, Rt) : T.strategy === o || ft === K ? (gt(T, (s << 1) + (Rt ? 1 : 0), 3), P(T, q, it)) : (gt(T, (g << 1) + (Rt ? 1 : 0), 3), Kt(T, T.l_desc.max_code + 1, T.d_desc.max_code + 1, k + 1), P(T, T.dyn_ltree, T.dyn_dtree)), B(T), Rt && N(T);
      }
      function fe(T, yt, wt) {
        return T.pending_buf[T.d_buf + T.last_lit * 2] = yt >>> 8 & 255, T.pending_buf[T.d_buf + T.last_lit * 2 + 1] = yt & 255, T.pending_buf[T.l_buf + T.last_lit] = wt & 255, T.last_lit++, yt === 0 ? T.dyn_ltree[wt * 2]++ : (T.matches++, yt--, T.dyn_ltree[(kt[wt] + _ + 1) * 2]++, T.dyn_dtree[tt(yt) * 2]++), T.last_lit === T.lit_bufsize - 1;
      }
      e._tr_init = Jt, e._tr_stored_block = ae, e._tr_flush_block = ne, e._tr_tally = fe, e._tr_align = te;
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
      var s = [], g = !1, m, y = -1;
      function w() {
        !g || !m || (g = !1, m.length ? s = m.concat(s) : y = -1, s.length && _());
      }
      function _() {
        if (!g) {
          var C = f(w);
          g = !0;
          for (var F = s.length; F; ) {
            for (m = s, s = []; ++y < F; )
              m && m[y].run();
            y = -1, F = s.length;
          }
          m = null, g = !1, d(C);
        }
      }
      i.nextTick = function(C) {
        var F = new Array(arguments.length - 1);
        if (arguments.length > 1)
          for (var L = 1; L < arguments.length; L++)
            F[L - 1] = arguments[L];
        s.push(new E(C, F)), s.length === 1 && !g && f(_);
      };
      function E(C, F) {
        this.fun = C, this.array = F;
      }
      E.prototype.run = function() {
        this.fun.apply(null, this.array);
      }, i.title = "browser", i.browser = !0, i.env = {}, i.argv = [], i.version = "", i.versions = {};
      function x() {
      }
      i.on = x, i.addListener = x, i.once = x, i.off = x, i.removeListener = x, i.removeAllListeners = x, i.emit = x, i.prependListener = x, i.prependOnceListener = x, i.listeners = function(C) {
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
        function d(E) {
          h.writable && h.write(E) === !1 && f.pause && f.pause();
        }
        f.on("data", d);
        function s() {
          f.readable && f.resume && f.resume();
        }
        h.on("drain", s), !h._isStdio && (!p || p.end !== !1) && (f.on("end", m), f.on("close", y));
        var g = !1;
        function m() {
          g || (g = !0, h.end());
        }
        function y() {
          g || (g = !0, typeof h.destroy == "function" && h.destroy());
        }
        function w(E) {
          if (_(), i.listenerCount(this, "error") === 0)
            throw E;
        }
        f.on("error", w), h.on("error", w);
        function _() {
          f.removeListener("data", d), h.removeListener("drain", s), f.removeListener("end", m), f.removeListener("close", y), f.removeListener("error", w), h.removeListener("error", w), f.removeListener("end", _), f.removeListener("close", _), h.removeListener("close", _);
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
        function y(_, E, x) {
          return typeof g == "string" ? g : g(_, E, x);
        }
        var w = /* @__PURE__ */ (function(_) {
          i(E, _);
          function E(x, C, F) {
            return _.call(this, y(x, C, F)) || this;
          }
          return E;
        })(m);
        w.prototype.name = m.name, w.prototype.code = s, o[s] = w;
      }
      function h(s, g) {
        if (Array.isArray(s)) {
          var m = s.length;
          return s = s.map(function(y) {
            return String(y);
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
        var y;
        typeof g == "string" && p(g, "not ") ? (y = "must not be", g = g.replace(/^not /, "")) : y = "must be";
        var w;
        if (f(s, " argument"))
          w = "The ".concat(s, " ").concat(y, " ").concat(h(g, "type"));
        else {
          var _ = d(s, ".") ? "property" : "argument";
          w = 'The "'.concat(s, '" ').concat(_, " ").concat(y, " ").concat(h(g, "type"));
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
          var o = Object.keys || function(y) {
            var w = [];
            for (var _ in y)
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
          function s(y) {
            if (!(this instanceof s))
              return new s(y);
            u.call(this, y), h.call(this, y), this.allowHalfOpen = !0, y && (y.readable === !1 && (this.readable = !1), y.writable === !1 && (this.writable = !1), y.allowHalfOpen === !1 && (this.allowHalfOpen = !1, this.once("end", g)));
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
          function m(y) {
            y.end();
          }
          Object.defineProperty(s.prototype, "destroyed", {
            // making it explicit this property is not enumerable
            // because otherwise some prototype manipulation in
            // userland will fail
            enumerable: !1,
            get: function() {
              return this._readableState === void 0 || this._writableState === void 0 ? !1 : this._readableState.destroyed && this._writableState.destroyed;
            },
            set: function(y) {
              this._readableState === void 0 || this._writableState === void 0 || (this._readableState.destroyed = y, this._writableState.destroyed = y);
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
          a.exports = j;
          var u;
          j.ReadableState = st, t("events").EventEmitter;
          var h = function(B, N) {
            return B.listeners(N).length;
          }, p = t("./internal/streams/stream"), f = t("buffer").Buffer, d = o.Uint8Array || function() {
          };
          function s(B) {
            return f.from(B);
          }
          function g(B) {
            return f.isBuffer(B) || B instanceof d;
          }
          var m = t("util"), y;
          m && m.debuglog ? y = m.debuglog("stream") : y = function() {
          };
          var w = t("./internal/streams/buffer_list"), _ = t("./internal/streams/destroy"), E = t("./internal/streams/state"), x = E.getHighWaterMark, C = t("../errors").codes, F = C.ERR_INVALID_ARG_TYPE, L = C.ERR_STREAM_PUSH_AFTER_EOF, I = C.ERR_METHOD_NOT_IMPLEMENTED, R = C.ERR_STREAM_UNSHIFT_AFTER_END_EVENT, v, D, M;
          t("inherits")(j, p);
          var H = _.errorOrDestroy, Y = ["error", "close", "destroy", "pause", "resume"];
          function Q(B, N, l) {
            if (typeof B.prependListener == "function")
              return B.prependListener(N, l);
            !B._events || !B._events[N] ? B.on(N, l) : Array.isArray(B._events[N]) ? B._events[N].unshift(l) : B._events[N] = [l, B._events[N]];
          }
          function st(B, N, l) {
            u = u || t("./_stream_duplex"), B = B || {}, typeof l != "boolean" && (l = N instanceof u), this.objectMode = !!B.objectMode, l && (this.objectMode = this.objectMode || !!B.readableObjectMode), this.highWaterMark = x(this, B, "readableHighWaterMark", l), this.buffer = new w(), this.length = 0, this.pipes = null, this.pipesCount = 0, this.flowing = null, this.ended = !1, this.endEmitted = !1, this.reading = !1, this.sync = !0, this.needReadable = !1, this.emittedReadable = !1, this.readableListening = !1, this.resumeScheduled = !1, this.paused = !0, this.emitClose = B.emitClose !== !1, this.autoDestroy = !!B.autoDestroy, this.destroyed = !1, this.defaultEncoding = B.defaultEncoding || "utf8", this.awaitDrain = 0, this.readingMore = !1, this.decoder = null, this.encoding = null, B.encoding && (v || (v = t("string_decoder/").StringDecoder), this.decoder = new v(B.encoding), this.encoding = B.encoding);
          }
          function j(B) {
            if (u = u || t("./_stream_duplex"), !(this instanceof j))
              return new j(B);
            var N = this instanceof u;
            this._readableState = new st(B, this, N), this.readable = !0, B && (typeof B.read == "function" && (this._read = B.read), typeof B.destroy == "function" && (this._destroy = B.destroy)), p.call(this);
          }
          Object.defineProperty(j.prototype, "destroyed", {
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
          }), j.prototype.destroy = _.destroy, j.prototype._undestroy = _.undestroy, j.prototype._destroy = function(B, N) {
            N(B);
          }, j.prototype.push = function(B, N) {
            var l = this._readableState, b;
            return l.objectMode ? b = !0 : typeof B == "string" && (N = N || l.defaultEncoding, N !== l.encoding && (B = f.from(B, N), N = ""), b = !0), S(this, B, N, !1, b);
          }, j.prototype.unshift = function(B) {
            return S(this, B, null, !0, !1);
          };
          function S(B, N, l, b, A) {
            y("readableAddChunk", N);
            var P = B._readableState;
            if (N === null)
              P.reading = !1, U(B, P);
            else {
              var et;
              if (A || (et = it(P, N)), et)
                H(B, et);
              else if (P.objectMode || N && N.length > 0)
                if (typeof N != "string" && !P.objectMode && Object.getPrototypeOf(N) !== f.prototype && (N = s(N)), b)
                  P.endEmitted ? H(B, new R()) : q(B, P, N, !0);
                else if (P.ended)
                  H(B, new L());
                else {
                  if (P.destroyed)
                    return !1;
                  P.reading = !1, P.decoder && !l ? (N = P.decoder.write(N), P.objectMode || N.length !== 0 ? q(B, P, N, !1) : ct(B, P)) : q(B, P, N, !1);
                }
              else
                b || (P.reading = !1, ct(B, P));
            }
            return !P.ended && (P.length < P.highWaterMark || P.length === 0);
          }
          function q(B, N, l, b) {
            N.flowing && N.length === 0 && !N.sync ? (N.awaitDrain = 0, B.emit("data", l)) : (N.length += N.objectMode ? 1 : l.length, b ? N.buffer.unshift(l) : N.buffer.push(l), N.needReadable && G(B)), ct(B, N);
          }
          function it(B, N) {
            var l;
            return !g(N) && typeof N != "string" && N !== void 0 && !B.objectMode && (l = new F("chunk", ["string", "Buffer", "Uint8Array"], N)), l;
          }
          j.prototype.isPaused = function() {
            return this._readableState.flowing === !1;
          }, j.prototype.setEncoding = function(B) {
            v || (v = t("string_decoder/").StringDecoder);
            var N = new v(B);
            this._readableState.decoder = N, this._readableState.encoding = this._readableState.decoder.encoding;
            for (var l = this._readableState.buffer.head, b = ""; l !== null; )
              b += N.write(l.data), l = l.next;
            return this._readableState.buffer.clear(), b !== "" && this._readableState.buffer.push(b), this._readableState.length = b.length, this;
          };
          var dt = 1073741824;
          function kt(B) {
            return B >= dt ? B = dt : (B--, B |= B >>> 1, B |= B >>> 2, B |= B >>> 4, B |= B >>> 8, B |= B >>> 16, B++), B;
          }
          function ot(B, N) {
            return B <= 0 || N.length === 0 && N.ended ? 0 : N.objectMode ? 1 : B !== B ? N.flowing && N.length ? N.buffer.head.data.length : N.length : (B > N.highWaterMark && (N.highWaterMark = kt(B)), B <= N.length ? B : N.ended ? N.length : (N.needReadable = !0, 0));
          }
          j.prototype.read = function(B) {
            y("read", B), B = parseInt(B, 10);
            var N = this._readableState, l = B;
            if (B !== 0 && (N.emittedReadable = !1), B === 0 && N.needReadable && ((N.highWaterMark !== 0 ? N.length >= N.highWaterMark : N.length > 0) || N.ended))
              return y("read: emitReadable", N.length, N.ended), N.length === 0 && N.ended ? nt(this) : G(this), null;
            if (B = ot(B, N), B === 0 && N.ended)
              return N.length === 0 && nt(this), null;
            var b = N.needReadable;
            y("need readable", b), (N.length === 0 || N.length - B < N.highWaterMark) && (b = !0, y("length less than watermark", b)), N.ended || N.reading ? (b = !1, y("reading or ended", b)) : b && (y("do read"), N.reading = !0, N.sync = !0, N.length === 0 && (N.needReadable = !0), this._read(N.highWaterMark), N.sync = !1, N.reading || (B = ot(l, N)));
            var A;
            return B > 0 ? A = J(B, N) : A = null, A === null ? (N.needReadable = N.length <= N.highWaterMark, B = 0) : (N.length -= B, N.awaitDrain = 0), N.length === 0 && (N.ended || (N.needReadable = !0), l !== B && N.ended && nt(this)), A !== null && this.emit("data", A), A;
          };
          function U(B, N) {
            if (y("onEofChunk"), !N.ended) {
              if (N.decoder) {
                var l = N.decoder.end();
                l && l.length && (N.buffer.push(l), N.length += N.objectMode ? 1 : l.length);
              }
              N.ended = !0, N.sync ? G(B) : (N.needReadable = !1, N.emittedReadable || (N.emittedReadable = !0, $(B)));
            }
          }
          function G(B) {
            var N = B._readableState;
            y("emitReadable", N.needReadable, N.emittedReadable), N.needReadable = !1, N.emittedReadable || (y("emitReadable", N.flowing), N.emittedReadable = !0, i.nextTick($, B));
          }
          function $(B) {
            var N = B._readableState;
            y("emitReadable_", N.destroyed, N.length, N.ended), !N.destroyed && (N.length || N.ended) && (B.emit("readable"), N.emittedReadable = !1), N.needReadable = !N.flowing && !N.ended && N.length <= N.highWaterMark, z(B);
          }
          function ct(B, N) {
            N.readingMore || (N.readingMore = !0, i.nextTick(W, B, N));
          }
          function W(B, N) {
            for (; !N.reading && !N.ended && (N.length < N.highWaterMark || N.flowing && N.length === 0); ) {
              var l = N.length;
              if (y("maybeReadMore read 0"), B.read(0), l === N.length)
                break;
            }
            N.readingMore = !1;
          }
          j.prototype._read = function(B) {
            H(this, new I("_read()"));
          }, j.prototype.pipe = function(B, N) {
            var l = this, b = this._readableState;
            switch (b.pipesCount) {
              case 0:
                b.pipes = B;
                break;
              case 1:
                b.pipes = [b.pipes, B];
                break;
              default:
                b.pipes.push(B);
                break;
            }
            b.pipesCount += 1, y("pipe count=%d opts=%j", b.pipesCount, N);
            var A = (!N || N.end !== !1) && B !== i.stdout && B !== i.stderr, P = A ? pt : te;
            b.endEmitted ? i.nextTick(P) : l.once("end", P), B.on("unpipe", et);
            function et(ne, fe) {
              y("onunpipe"), ne === l && fe && fe.hasUnpiped === !1 && (fe.hasUnpiped = !0, Kt());
            }
            function pt() {
              y("onend"), B.end();
            }
            var Pt = X(l);
            B.on("drain", Pt);
            var Dt = !1;
            function Kt() {
              y("cleanup"), B.removeListener("close", Jt), B.removeListener("finish", ae), B.removeListener("drain", Pt), B.removeListener("error", Ut), B.removeListener("unpipe", et), l.removeListener("end", pt), l.removeListener("end", te), l.removeListener("data", Nt), Dt = !0, b.awaitDrain && (!B._writableState || B._writableState.needDrain) && Pt();
            }
            l.on("data", Nt);
            function Nt(ne) {
              y("ondata");
              var fe = B.write(ne);
              y("dest.write", fe), fe === !1 && ((b.pipesCount === 1 && b.pipes === B || b.pipesCount > 1 && Et(b.pipes, B) !== -1) && !Dt && (y("false write response, pause", b.awaitDrain), b.awaitDrain++), l.pause());
            }
            function Ut(ne) {
              y("onerror", ne), te(), B.removeListener("error", Ut), h(B, "error") === 0 && H(B, ne);
            }
            Q(B, "error", Ut);
            function Jt() {
              B.removeListener("finish", ae), te();
            }
            B.once("close", Jt);
            function ae() {
              y("onfinish"), B.removeListener("close", Jt), te();
            }
            B.once("finish", ae);
            function te() {
              y("unpipe"), l.unpipe(B);
            }
            return B.emit("pipe", l), b.flowing || (y("pipe resume"), l.resume()), B;
          };
          function X(B) {
            return function() {
              var N = B._readableState;
              y("pipeOnDrain", N.awaitDrain), N.awaitDrain && N.awaitDrain--, N.awaitDrain === 0 && h(B, "data") && (N.flowing = !0, z(B));
            };
          }
          j.prototype.unpipe = function(B) {
            var N = this._readableState, l = {
              hasUnpiped: !1
            };
            if (N.pipesCount === 0)
              return this;
            if (N.pipesCount === 1)
              return B && B !== N.pipes ? this : (B || (B = N.pipes), N.pipes = null, N.pipesCount = 0, N.flowing = !1, B && B.emit("unpipe", this, l), this);
            if (!B) {
              var b = N.pipes, A = N.pipesCount;
              N.pipes = null, N.pipesCount = 0, N.flowing = !1;
              for (var P = 0; P < A; P++)
                b[P].emit("unpipe", this, {
                  hasUnpiped: !1
                });
              return this;
            }
            var et = Et(N.pipes, B);
            return et === -1 ? this : (N.pipes.splice(et, 1), N.pipesCount -= 1, N.pipesCount === 1 && (N.pipes = N.pipes[0]), B.emit("unpipe", this, l), this);
          }, j.prototype.on = function(B, N) {
            var l = p.prototype.on.call(this, B, N), b = this._readableState;
            return B === "data" ? (b.readableListening = this.listenerCount("readable") > 0, b.flowing !== !1 && this.resume()) : B === "readable" && !b.endEmitted && !b.readableListening && (b.readableListening = b.needReadable = !0, b.flowing = !1, b.emittedReadable = !1, y("on readable", b.length, b.reading), b.length ? G(this) : b.reading || i.nextTick(ut, this)), l;
          }, j.prototype.addListener = j.prototype.on, j.prototype.removeListener = function(B, N) {
            var l = p.prototype.removeListener.call(this, B, N);
            return B === "readable" && i.nextTick(tt, this), l;
          }, j.prototype.removeAllListeners = function(B) {
            var N = p.prototype.removeAllListeners.apply(this, arguments);
            return (B === "readable" || B === void 0) && i.nextTick(tt, this), N;
          };
          function tt(B) {
            var N = B._readableState;
            N.readableListening = B.listenerCount("readable") > 0, N.resumeScheduled && !N.paused ? N.flowing = !0 : B.listenerCount("data") > 0 && B.resume();
          }
          function ut(B) {
            y("readable nexttick read 0"), B.read(0);
          }
          j.prototype.resume = function() {
            var B = this._readableState;
            return B.flowing || (y("resume"), B.flowing = !B.readableListening, gt(this, B)), B.paused = !1, this;
          };
          function gt(B, N) {
            N.resumeScheduled || (N.resumeScheduled = !0, i.nextTick(mt, B, N));
          }
          function mt(B, N) {
            y("resume", N.reading), N.reading || B.read(0), N.resumeScheduled = !1, B.emit("resume"), z(B), N.flowing && !N.reading && B.read(0);
          }
          j.prototype.pause = function() {
            return y("call pause flowing=%j", this._readableState.flowing), this._readableState.flowing !== !1 && (y("pause"), this._readableState.flowing = !1, this.emit("pause")), this._readableState.paused = !0, this;
          };
          function z(B) {
            var N = B._readableState;
            for (y("flow", N.flowing); N.flowing && B.read() !== null; )
              ;
          }
          j.prototype.wrap = function(B) {
            var N = this, l = this._readableState, b = !1;
            B.on("end", function() {
              if (y("wrapped end"), l.decoder && !l.ended) {
                var et = l.decoder.end();
                et && et.length && N.push(et);
              }
              N.push(null);
            }), B.on("data", function(et) {
              if (y("wrapped data"), l.decoder && (et = l.decoder.write(et)), !(l.objectMode && et == null) && !(!l.objectMode && (!et || !et.length))) {
                var pt = N.push(et);
                pt || (b = !0, B.pause());
              }
            });
            for (var A in B)
              this[A] === void 0 && typeof B[A] == "function" && (this[A] = /* @__PURE__ */ (function(et) {
                return function() {
                  return B[et].apply(B, arguments);
                };
              })(A));
            for (var P = 0; P < Y.length; P++)
              B.on(Y[P], this.emit.bind(this, Y[P]));
            return this._read = function(et) {
              y("wrapped _read", et), b && (b = !1, B.resume());
            }, this;
          }, typeof Symbol == "function" && (j.prototype[Symbol.asyncIterator] = function() {
            return D === void 0 && (D = t("./internal/streams/async_iterator")), D(this);
          }), Object.defineProperty(j.prototype, "readableHighWaterMark", {
            // making it explicit this property is not enumerable
            // because otherwise some prototype manipulation in
            // userland will fail
            enumerable: !1,
            get: function() {
              return this._readableState.highWaterMark;
            }
          }), Object.defineProperty(j.prototype, "readableBuffer", {
            // making it explicit this property is not enumerable
            // because otherwise some prototype manipulation in
            // userland will fail
            enumerable: !1,
            get: function() {
              return this._readableState && this._readableState.buffer;
            }
          }), Object.defineProperty(j.prototype, "readableFlowing", {
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
          }), j._fromList = J, Object.defineProperty(j.prototype, "readableLength", {
            // making it explicit this property is not enumerable
            // because otherwise some prototype manipulation in
            // userland will fail
            enumerable: !1,
            get: function() {
              return this._readableState.length;
            }
          });
          function J(B, N) {
            if (N.length === 0)
              return null;
            var l;
            return N.objectMode ? l = N.buffer.shift() : !B || B >= N.length ? (N.decoder ? l = N.buffer.join("") : N.buffer.length === 1 ? l = N.buffer.first() : l = N.buffer.concat(N.length), N.buffer.clear()) : l = N.buffer.consume(B, N.decoder), l;
          }
          function nt(B) {
            var N = B._readableState;
            y("endReadable", N.endEmitted), N.endEmitted || (N.ended = !0, i.nextTick(St, N, B));
          }
          function St(B, N) {
            if (y("endReadableNT", B.endEmitted, B.length), !B.endEmitted && B.length === 0 && (B.endEmitted = !0, N.readable = !1, N.emit("end"), B.autoDestroy)) {
              var l = N._writableState;
              (!l || l.autoDestroy && l.finished) && N.destroy();
            }
          }
          typeof Symbol == "function" && (j.from = function(B, N) {
            return M === void 0 && (M = t("./internal/streams/from")), M(j, B, N);
          });
          function Et(B, N) {
            for (var l = 0, b = B.length; l < b; l++)
              if (B[l] === N)
                return l;
            return -1;
          }
        }).call(this);
      }).call(this, t("_process"), typeof se < "u" ? se : typeof self < "u" ? self : typeof window < "u" ? window : {});
    }, { "../errors": 66, "./_stream_duplex": 67, "./internal/streams/async_iterator": 72, "./internal/streams/buffer_list": 73, "./internal/streams/destroy": 74, "./internal/streams/from": 76, "./internal/streams/state": 78, "./internal/streams/stream": 79, _process: 63, buffer: 32, events: 35, inherits: 46, "string_decoder/": 80, util: 29 }], 70: [function(t, a, e) {
      a.exports = s;
      var i = t("../errors").codes, o = i.ERR_METHOD_NOT_IMPLEMENTED, u = i.ERR_MULTIPLE_CALLBACK, h = i.ERR_TRANSFORM_ALREADY_TRANSFORMING, p = i.ERR_TRANSFORM_WITH_LENGTH_0, f = t("./_stream_duplex");
      t("inherits")(s, f);
      function d(y, w) {
        var _ = this._transformState;
        _.transforming = !1;
        var E = _.writecb;
        if (E === null)
          return this.emit("error", new u());
        _.writechunk = null, _.writecb = null, w != null && this.push(w), E(y);
        var x = this._readableState;
        x.reading = !1, (x.needReadable || x.length < x.highWaterMark) && this._read(x.highWaterMark);
      }
      function s(y) {
        if (!(this instanceof s))
          return new s(y);
        f.call(this, y), this._transformState = {
          afterTransform: d.bind(this),
          needTransform: !1,
          transforming: !1,
          writecb: null,
          writechunk: null,
          writeencoding: null
        }, this._readableState.needReadable = !0, this._readableState.sync = !1, y && (typeof y.transform == "function" && (this._transform = y.transform), typeof y.flush == "function" && (this._flush = y.flush)), this.on("prefinish", g);
      }
      function g() {
        var y = this;
        typeof this._flush == "function" && !this._readableState.destroyed ? this._flush(function(w, _) {
          m(y, w, _);
        }) : m(this, null, null);
      }
      s.prototype.push = function(y, w) {
        return this._transformState.needTransform = !1, f.prototype.push.call(this, y, w);
      }, s.prototype._transform = function(y, w, _) {
        _(new o("_transform()"));
      }, s.prototype._write = function(y, w, _) {
        var E = this._transformState;
        if (E.writecb = _, E.writechunk = y, E.writeencoding = w, !E.transforming) {
          var x = this._readableState;
          (E.needTransform || x.needReadable || x.length < x.highWaterMark) && this._read(x.highWaterMark);
        }
      }, s.prototype._read = function(y) {
        var w = this._transformState;
        w.writechunk !== null && !w.transforming ? (w.transforming = !0, this._transform(w.writechunk, w.writeencoding, w.afterTransform)) : w.needTransform = !0;
      }, s.prototype._destroy = function(y, w) {
        f.prototype._destroy.call(this, y, function(_) {
          w(_);
        });
      };
      function m(y, w, _) {
        if (w)
          return y.emit("error", w);
        if (_ != null && y.push(_), y._writableState.length)
          throw new p();
        if (y._transformState.transforming)
          throw new h();
        return y.push(null);
      }
    }, { "../errors": 66, "./_stream_duplex": 67, inherits: 46 }], 71: [function(t, a, e) {
      (function(i, o) {
        (function() {
          a.exports = st;
          function u(z) {
            var J = this;
            this.next = null, this.entry = null, this.finish = function() {
              mt(J, z);
            };
          }
          var h;
          st.WritableState = Y;
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
          var y = t("./internal/streams/destroy"), w = t("./internal/streams/state"), _ = w.getHighWaterMark, E = t("../errors").codes, x = E.ERR_INVALID_ARG_TYPE, C = E.ERR_METHOD_NOT_IMPLEMENTED, F = E.ERR_MULTIPLE_CALLBACK, L = E.ERR_STREAM_CANNOT_PIPE, I = E.ERR_STREAM_DESTROYED, R = E.ERR_STREAM_NULL_VALUES, v = E.ERR_STREAM_WRITE_AFTER_END, D = E.ERR_UNKNOWN_ENCODING, M = y.errorOrDestroy;
          t("inherits")(st, f);
          function H() {
          }
          function Y(z, J, nt) {
            h = h || t("./_stream_duplex"), z = z || {}, typeof nt != "boolean" && (nt = J instanceof h), this.objectMode = !!z.objectMode, nt && (this.objectMode = this.objectMode || !!z.writableObjectMode), this.highWaterMark = _(this, z, "writableHighWaterMark", nt), this.finalCalled = !1, this.needDrain = !1, this.ending = !1, this.ended = !1, this.finished = !1, this.destroyed = !1;
            var St = z.decodeStrings === !1;
            this.decodeStrings = !St, this.defaultEncoding = z.defaultEncoding || "utf8", this.length = 0, this.writing = !1, this.corked = 0, this.sync = !0, this.bufferProcessing = !1, this.onwrite = function(Et) {
              U(J, Et);
            }, this.writecb = null, this.writelen = 0, this.bufferedRequest = null, this.lastBufferedRequest = null, this.pendingcb = 0, this.prefinished = !1, this.errorEmitted = !1, this.emitClose = z.emitClose !== !1, this.autoDestroy = !!z.autoDestroy, this.bufferedRequestCount = 0, this.corkedRequestsFree = new u(this);
          }
          Y.prototype.getBuffer = function() {
            for (var z = this.bufferedRequest, J = []; z; )
              J.push(z), z = z.next;
            return J;
          }, (function() {
            try {
              Object.defineProperty(Y.prototype, "buffer", {
                get: p.deprecate(function() {
                  return this.getBuffer();
                }, "_writableState.buffer is deprecated. Use _writableState.getBuffer instead.", "DEP0003")
              });
            } catch {
            }
          })();
          var Q;
          typeof Symbol == "function" && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] == "function" ? (Q = Function.prototype[Symbol.hasInstance], Object.defineProperty(st, Symbol.hasInstance, {
            value: function(z) {
              return Q.call(this, z) ? !0 : this !== st ? !1 : z && z._writableState instanceof Y;
            }
          })) : Q = function(z) {
            return z instanceof this;
          };
          function st(z) {
            h = h || t("./_stream_duplex");
            var J = this instanceof h;
            if (!J && !Q.call(st, this))
              return new st(z);
            this._writableState = new Y(z, this, J), this.writable = !0, z && (typeof z.write == "function" && (this._write = z.write), typeof z.writev == "function" && (this._writev = z.writev), typeof z.destroy == "function" && (this._destroy = z.destroy), typeof z.final == "function" && (this._final = z.final)), f.call(this);
          }
          st.prototype.pipe = function() {
            M(this, new L());
          };
          function j(z, J) {
            var nt = new v();
            M(z, nt), i.nextTick(J, nt);
          }
          function S(z, J, nt, St) {
            var Et;
            return nt === null ? Et = new R() : typeof nt != "string" && !J.objectMode && (Et = new x("chunk", ["string", "Buffer"], nt)), Et ? (M(z, Et), i.nextTick(St, Et), !1) : !0;
          }
          st.prototype.write = function(z, J, nt) {
            var St = this._writableState, Et = !1, B = !St.objectMode && m(z);
            return B && !d.isBuffer(z) && (z = g(z)), typeof J == "function" && (nt = J, J = null), B ? J = "buffer" : J || (J = St.defaultEncoding), typeof nt != "function" && (nt = H), St.ending ? j(this, nt) : (B || S(this, St, z, nt)) && (St.pendingcb++, Et = it(this, St, B, z, J, nt)), Et;
          }, st.prototype.cork = function() {
            this._writableState.corked++;
          }, st.prototype.uncork = function() {
            var z = this._writableState;
            z.corked && (z.corked--, !z.writing && !z.corked && !z.bufferProcessing && z.bufferedRequest && ct(this, z));
          }, st.prototype.setDefaultEncoding = function(z) {
            if (typeof z == "string" && (z = z.toLowerCase()), !(["hex", "utf8", "utf-8", "ascii", "binary", "base64", "ucs2", "ucs-2", "utf16le", "utf-16le", "raw"].indexOf((z + "").toLowerCase()) > -1))
              throw new D(z);
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
          function q(z, J, nt) {
            return !z.objectMode && z.decodeStrings !== !1 && typeof J == "string" && (J = d.from(J, nt)), J;
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
          function it(z, J, nt, St, Et, B) {
            if (!nt) {
              var N = q(J, St, Et);
              St !== N && (nt = !0, Et = "buffer", St = N);
            }
            var l = J.objectMode ? 1 : St.length;
            J.length += l;
            var b = J.length < J.highWaterMark;
            if (b || (J.needDrain = !0), J.writing || J.corked) {
              var A = J.lastBufferedRequest;
              J.lastBufferedRequest = {
                chunk: St,
                encoding: Et,
                isBuf: nt,
                callback: B,
                next: null
              }, A ? A.next = J.lastBufferedRequest : J.bufferedRequest = J.lastBufferedRequest, J.bufferedRequestCount += 1;
            } else
              dt(z, J, !1, l, St, Et, B);
            return b;
          }
          function dt(z, J, nt, St, Et, B, N) {
            J.writelen = St, J.writecb = N, J.writing = !0, J.sync = !0, J.destroyed ? J.onwrite(new I("write")) : nt ? z._writev(Et, J.onwrite) : z._write(Et, B, J.onwrite), J.sync = !1;
          }
          function kt(z, J, nt, St, Et) {
            --J.pendingcb, nt ? (i.nextTick(Et, St), i.nextTick(ut, z, J), z._writableState.errorEmitted = !0, M(z, St)) : (Et(St), z._writableState.errorEmitted = !0, M(z, St), ut(z, J));
          }
          function ot(z) {
            z.writing = !1, z.writecb = null, z.length -= z.writelen, z.writelen = 0;
          }
          function U(z, J) {
            var nt = z._writableState, St = nt.sync, Et = nt.writecb;
            if (typeof Et != "function")
              throw new F();
            if (ot(nt), J)
              kt(z, nt, St, J, Et);
            else {
              var B = W(nt) || z.destroyed;
              !B && !nt.corked && !nt.bufferProcessing && nt.bufferedRequest && ct(z, nt), St ? i.nextTick(G, z, nt, B, Et) : G(z, nt, B, Et);
            }
          }
          function G(z, J, nt, St) {
            nt || $(z, J), J.pendingcb--, St(), ut(z, J);
          }
          function $(z, J) {
            J.length === 0 && J.needDrain && (J.needDrain = !1, z.emit("drain"));
          }
          function ct(z, J) {
            J.bufferProcessing = !0;
            var nt = J.bufferedRequest;
            if (z._writev && nt && nt.next) {
              var St = J.bufferedRequestCount, Et = new Array(St), B = J.corkedRequestsFree;
              B.entry = nt;
              for (var N = 0, l = !0; nt; )
                Et[N] = nt, nt.isBuf || (l = !1), nt = nt.next, N += 1;
              Et.allBuffers = l, dt(z, J, !0, J.length, Et, "", B.finish), J.pendingcb++, J.lastBufferedRequest = null, B.next ? (J.corkedRequestsFree = B.next, B.next = null) : J.corkedRequestsFree = new u(J), J.bufferedRequestCount = 0;
            } else {
              for (; nt; ) {
                var b = nt.chunk, A = nt.encoding, P = nt.callback, et = J.objectMode ? 1 : b.length;
                if (dt(z, J, !1, et, b, A, P), nt = nt.next, J.bufferedRequestCount--, J.writing)
                  break;
              }
              nt === null && (J.lastBufferedRequest = null);
            }
            J.bufferedRequest = nt, J.bufferProcessing = !1;
          }
          st.prototype._write = function(z, J, nt) {
            nt(new C("_write()"));
          }, st.prototype._writev = null, st.prototype.end = function(z, J, nt) {
            var St = this._writableState;
            return typeof z == "function" ? (nt = z, z = null, J = null) : typeof J == "function" && (nt = J, J = null), z != null && this.write(z, J), St.corked && (St.corked = 1, this.uncork()), St.ending || gt(this, St, nt), this;
          }, Object.defineProperty(st.prototype, "writableLength", {
            // making it explicit this property is not enumerable
            // because otherwise some prototype manipulation in
            // userland will fail
            enumerable: !1,
            get: function() {
              return this._writableState.length;
            }
          });
          function W(z) {
            return z.ending && z.length === 0 && z.bufferedRequest === null && !z.finished && !z.writing;
          }
          function X(z, J) {
            z._final(function(nt) {
              J.pendingcb--, nt && M(z, nt), J.prefinished = !0, z.emit("prefinish"), ut(z, J);
            });
          }
          function tt(z, J) {
            !J.prefinished && !J.finalCalled && (typeof z._final == "function" && !J.destroyed ? (J.pendingcb++, J.finalCalled = !0, i.nextTick(X, z, J)) : (J.prefinished = !0, z.emit("prefinish")));
          }
          function ut(z, J) {
            var nt = W(J);
            if (nt && (tt(z, J), J.pendingcb === 0 && (J.finished = !0, z.emit("finish"), J.autoDestroy))) {
              var St = z._readableState;
              (!St || St.autoDestroy && St.endEmitted) && z.destroy();
            }
            return nt;
          }
          function gt(z, J, nt) {
            J.ending = !0, ut(z, J), nt && (J.finished ? i.nextTick(nt) : z.once("finish", nt)), J.ended = !0, z.writable = !1;
          }
          function mt(z, J, nt) {
            var St = z.entry;
            for (z.entry = null; St; ) {
              var Et = St.callback;
              J.pendingcb--, Et(nt), St = St.next;
            }
            J.corkedRequestsFree.next = z;
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
          }), st.prototype.destroy = y.destroy, st.prototype._undestroy = y.undestroy, st.prototype._destroy = function(z, J) {
            J(z);
          };
        }).call(this);
      }).call(this, t("_process"), typeof se < "u" ? se : typeof self < "u" ? self : typeof window < "u" ? window : {});
    }, { "../errors": 66, "./_stream_duplex": 67, "./internal/streams/destroy": 74, "./internal/streams/state": 78, "./internal/streams/stream": 79, _process: 63, buffer: 32, inherits: 46, "util-deprecate": 81 }], 72: [function(t, a, e) {
      (function(i) {
        (function() {
          var o;
          function u(I, R, v) {
            return R in I ? Object.defineProperty(I, R, { value: v, enumerable: !0, configurable: !0, writable: !0 }) : I[R] = v, I;
          }
          var h = t("./end-of-stream"), p = Symbol("lastResolve"), f = Symbol("lastReject"), d = Symbol("error"), s = Symbol("ended"), g = Symbol("lastPromise"), m = Symbol("handlePromise"), y = Symbol("stream");
          function w(I, R) {
            return {
              value: I,
              done: R
            };
          }
          function _(I) {
            var R = I[p];
            if (R !== null) {
              var v = I[y].read();
              v !== null && (I[g] = null, I[p] = null, I[f] = null, R(w(v, !1)));
            }
          }
          function E(I) {
            i.nextTick(_, I);
          }
          function x(I, R) {
            return function(v, D) {
              I.then(function() {
                if (R[s]) {
                  v(w(void 0, !0));
                  return;
                }
                R[m](v, D);
              }, D);
            };
          }
          var C = Object.getPrototypeOf(function() {
          }), F = Object.setPrototypeOf((o = {
            get stream() {
              return this[y];
            },
            next: function() {
              var I = this, R = this[d];
              if (R !== null)
                return Promise.reject(R);
              if (this[s])
                return Promise.resolve(w(void 0, !0));
              if (this[y].destroyed)
                return new Promise(function(H, Y) {
                  i.nextTick(function() {
                    I[d] ? Y(I[d]) : H(w(void 0, !0));
                  });
                });
              var v = this[g], D;
              if (v)
                D = new Promise(x(v, this));
              else {
                var M = this[y].read();
                if (M !== null)
                  return Promise.resolve(w(M, !1));
                D = new Promise(this[m]);
              }
              return this[g] = D, D;
            }
          }, u(o, Symbol.asyncIterator, function() {
            return this;
          }), u(o, "return", function() {
            var I = this;
            return new Promise(function(R, v) {
              I[y].destroy(null, function(D) {
                if (D) {
                  v(D);
                  return;
                }
                R(w(void 0, !0));
              });
            });
          }), o), C), L = function(I) {
            var R, v = Object.create(F, (R = {}, u(R, y, {
              value: I,
              writable: !0
            }), u(R, p, {
              value: null,
              writable: !0
            }), u(R, f, {
              value: null,
              writable: !0
            }), u(R, d, {
              value: null,
              writable: !0
            }), u(R, s, {
              value: I._readableState.endEmitted,
              writable: !0
            }), u(R, m, {
              value: function(D, M) {
                var H = v[y].read();
                H ? (v[g] = null, v[p] = null, v[f] = null, D(w(H, !1))) : (v[p] = D, v[f] = M);
              },
              writable: !0
            }), R));
            return v[g] = null, h(I, function(D) {
              if (D && D.code !== "ERR_STREAM_PREMATURE_CLOSE") {
                var M = v[f];
                M !== null && (v[g] = null, v[p] = null, v[f] = null, M(D)), v[d] = D;
                return;
              }
              var H = v[p];
              H !== null && (v[g] = null, v[p] = null, v[f] = null, H(w(void 0, !0))), v[s] = !0;
            }), I.on("readable", E.bind(null, v)), v;
          };
          a.exports = L;
        }).call(this);
      }).call(this, t("_process"));
    }, { "./end-of-stream": 75, _process: 63 }], 73: [function(t, a, e) {
      function i(_, E) {
        var x = Object.keys(_);
        if (Object.getOwnPropertySymbols) {
          var C = Object.getOwnPropertySymbols(_);
          E && (C = C.filter(function(F) {
            return Object.getOwnPropertyDescriptor(_, F).enumerable;
          })), x.push.apply(x, C);
        }
        return x;
      }
      function o(_) {
        for (var E = 1; E < arguments.length; E++) {
          var x = arguments[E] != null ? arguments[E] : {};
          E % 2 ? i(Object(x), !0).forEach(function(C) {
            u(_, C, x[C]);
          }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(_, Object.getOwnPropertyDescriptors(x)) : i(Object(x)).forEach(function(C) {
            Object.defineProperty(_, C, Object.getOwnPropertyDescriptor(x, C));
          });
        }
        return _;
      }
      function u(_, E, x) {
        return E in _ ? Object.defineProperty(_, E, { value: x, enumerable: !0, configurable: !0, writable: !0 }) : _[E] = x, _;
      }
      function h(_, E) {
        if (!(_ instanceof E))
          throw new TypeError("Cannot call a class as a function");
      }
      function p(_, E) {
        for (var x = 0; x < E.length; x++) {
          var C = E[x];
          C.enumerable = C.enumerable || !1, C.configurable = !0, "value" in C && (C.writable = !0), Object.defineProperty(_, C.key, C);
        }
      }
      function f(_, E, x) {
        return E && p(_.prototype, E), _;
      }
      var d = t("buffer"), s = d.Buffer, g = t("util"), m = g.inspect, y = m && m.custom || "inspect";
      function w(_, E, x) {
        s.prototype.copy.call(_, E, x);
      }
      a.exports = /* @__PURE__ */ (function() {
        function _() {
          h(this, _), this.head = null, this.tail = null, this.length = 0;
        }
        return f(_, [{
          key: "push",
          value: function(E) {
            var x = {
              data: E,
              next: null
            };
            this.length > 0 ? this.tail.next = x : this.head = x, this.tail = x, ++this.length;
          }
        }, {
          key: "unshift",
          value: function(E) {
            var x = {
              data: E,
              next: this.head
            };
            this.length === 0 && (this.tail = x), this.head = x, ++this.length;
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
            if (this.length === 0)
              return "";
            for (var x = this.head, C = "" + x.data; x = x.next; )
              C += E + x.data;
            return C;
          }
        }, {
          key: "concat",
          value: function(E) {
            if (this.length === 0)
              return s.alloc(0);
            for (var x = s.allocUnsafe(E >>> 0), C = this.head, F = 0; C; )
              w(C.data, x, F), F += C.data.length, C = C.next;
            return x;
          }
          // Consumes a specified amount of bytes or characters from the buffered data.
        }, {
          key: "consume",
          value: function(E, x) {
            var C;
            return E < this.head.data.length ? (C = this.head.data.slice(0, E), this.head.data = this.head.data.slice(E)) : E === this.head.data.length ? C = this.shift() : C = x ? this._getString(E) : this._getBuffer(E), C;
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
            var x = this.head, C = 1, F = x.data;
            for (E -= F.length; x = x.next; ) {
              var L = x.data, I = E > L.length ? L.length : E;
              if (I === L.length ? F += L : F += L.slice(0, E), E -= I, E === 0) {
                I === L.length ? (++C, x.next ? this.head = x.next : this.head = this.tail = null) : (this.head = x, x.data = L.slice(I));
                break;
              }
              ++C;
            }
            return this.length -= C, F;
          }
          // Consumes a specified amount of bytes from the buffered data.
        }, {
          key: "_getBuffer",
          value: function(E) {
            var x = s.allocUnsafe(E), C = this.head, F = 1;
            for (C.data.copy(x), E -= C.data.length; C = C.next; ) {
              var L = C.data, I = E > L.length ? L.length : E;
              if (L.copy(x, x.length - E, 0, I), E -= I, E === 0) {
                I === L.length ? (++F, C.next ? this.head = C.next : this.head = this.tail = null) : (this.head = C, C.data = L.slice(I));
                break;
              }
              ++F;
            }
            return this.length -= F, x;
          }
          // Make sure the linked list only shows the minimal necessary information.
        }, {
          key: y,
          value: function(E, x) {
            return m(this, o({}, x, {
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
            var m = this, y = this._readableState && this._readableState.destroyed, w = this._writableState && this._writableState.destroyed;
            return y || w ? (g ? g(s) : s && (this._writableState ? this._writableState.errorEmitted || (this._writableState.errorEmitted = !0, i.nextTick(f, this, s)) : i.nextTick(f, this, s)), this) : (this._readableState && (this._readableState.destroyed = !0), this._writableState && (this._writableState.destroyed = !0), this._destroy(s || null, function(_) {
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
            var m = s._readableState, y = s._writableState;
            m && m.autoDestroy || y && y.autoDestroy ? s.destroy(g) : s.emit("error", g);
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
        var g = d.readable || d.readable !== !1 && f.readable, m = d.writable || d.writable !== !1 && f.writable, y = function() {
          f.writable || _();
        }, w = f._writableState && f._writableState.finished, _ = function() {
          m = !1, w = !0, g || s.call(f);
        }, E = f._readableState && f._readableState.endEmitted, x = function() {
          g = !1, E = !0, m || s.call(f);
        }, C = function(I) {
          s.call(f, I);
        }, F = function() {
          var I;
          if (g && !E)
            return (!f._readableState || !f._readableState.ended) && (I = new i()), s.call(f, I);
          if (m && !w)
            return (!f._writableState || !f._writableState.ended) && (I = new i()), s.call(f, I);
        }, L = function() {
          f.req.on("finish", _);
        };
        return h(f) ? (f.on("complete", _), f.on("abort", F), f.req ? L() : f.on("request", L)) : m && !f._writableState && (f.on("end", y), f.on("close", y)), f.on("end", x), f.on("finish", _), d.error !== !1 && f.on("error", C), f.on("close", F), function() {
          f.removeListener("complete", _), f.removeListener("abort", F), f.removeListener("request", L), f.req && f.req.removeListener("finish", _), f.removeListener("end", y), f.removeListener("close", y), f.removeListener("finish", _), f.removeListener("end", x), f.removeListener("error", C), f.removeListener("close", F);
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
        var E = !1;
        return function() {
          E || (E = !0, _.apply(void 0, arguments));
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
      function s(_, E, x, C) {
        C = o(C);
        var F = !1;
        _.on("close", function() {
          F = !0;
        }), i === void 0 && (i = t("./end-of-stream")), i(_, {
          readable: E,
          writable: x
        }, function(I) {
          if (I)
            return C(I);
          F = !0, C();
        });
        var L = !1;
        return function(I) {
          if (!F && !L) {
            if (L = !0, d(_))
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
      function m(_, E) {
        return _.pipe(E);
      }
      function y(_) {
        return !_.length || typeof _[_.length - 1] != "function" ? f : _.pop();
      }
      function w() {
        for (var _ = arguments.length, E = new Array(_), x = 0; x < _; x++)
          E[x] = arguments[x];
        var C = y(E);
        if (Array.isArray(E[0]) && (E = E[0]), E.length < 2)
          throw new h("streams");
        var F, L = E.map(function(I, R) {
          var v = R < E.length - 1, D = R > 0;
          return s(I, v, D, function(M) {
            F || (F = M), M && L.forEach(g), !v && (L.forEach(g), C(F));
          });
        });
        return E.reduce(m);
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
      var i = t("safe-buffer").Buffer, o = i.isEncoding || function(L) {
        switch (L = "" + L, L && L.toLowerCase()) {
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
      function u(L) {
        if (!L)
          return "utf8";
        for (var I; ; )
          switch (L) {
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
              return L;
            default:
              if (I)
                return;
              L = ("" + L).toLowerCase(), I = !0;
          }
      }
      function h(L) {
        var I = u(L);
        if (typeof I != "string" && (i.isEncoding === o || !o(L)))
          throw new Error("Unknown encoding: " + L);
        return I || L;
      }
      e.StringDecoder = p;
      function p(L) {
        this.encoding = h(L);
        var I;
        switch (this.encoding) {
          case "utf16le":
            this.text = w, this.end = _, I = 4;
            break;
          case "utf8":
            this.fillLast = g, I = 4;
            break;
          case "base64":
            this.text = E, this.end = x, I = 3;
            break;
          default:
            this.write = C, this.end = F;
            return;
        }
        this.lastNeed = 0, this.lastTotal = 0, this.lastChar = i.allocUnsafe(I);
      }
      p.prototype.write = function(L) {
        if (L.length === 0)
          return "";
        var I, R;
        if (this.lastNeed) {
          if (I = this.fillLast(L), I === void 0)
            return "";
          R = this.lastNeed, this.lastNeed = 0;
        } else
          R = 0;
        return R < L.length ? I ? I + this.text(L, R) : this.text(L, R) : I || "";
      }, p.prototype.end = y, p.prototype.text = m, p.prototype.fillLast = function(L) {
        if (this.lastNeed <= L.length)
          return L.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed), this.lastChar.toString(this.encoding, 0, this.lastTotal);
        L.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, L.length), this.lastNeed -= L.length;
      };
      function f(L) {
        return L <= 127 ? 0 : L >> 5 === 6 ? 2 : L >> 4 === 14 ? 3 : L >> 3 === 30 ? 4 : L >> 6 === 2 ? -1 : -2;
      }
      function d(L, I, R) {
        var v = I.length - 1;
        if (v < R)
          return 0;
        var D = f(I[v]);
        return D >= 0 ? (D > 0 && (L.lastNeed = D - 1), D) : --v < R || D === -2 ? 0 : (D = f(I[v]), D >= 0 ? (D > 0 && (L.lastNeed = D - 2), D) : --v < R || D === -2 ? 0 : (D = f(I[v]), D >= 0 ? (D > 0 && (D === 2 ? D = 0 : L.lastNeed = D - 3), D) : 0));
      }
      function s(L, I, R) {
        if ((I[0] & 192) !== 128)
          return L.lastNeed = 0, "�";
        if (L.lastNeed > 1 && I.length > 1) {
          if ((I[1] & 192) !== 128)
            return L.lastNeed = 1, "�";
          if (L.lastNeed > 2 && I.length > 2 && (I[2] & 192) !== 128)
            return L.lastNeed = 2, "�";
        }
      }
      function g(L) {
        var I = this.lastTotal - this.lastNeed, R = s(this, L);
        if (R !== void 0)
          return R;
        if (this.lastNeed <= L.length)
          return L.copy(this.lastChar, I, 0, this.lastNeed), this.lastChar.toString(this.encoding, 0, this.lastTotal);
        L.copy(this.lastChar, I, 0, L.length), this.lastNeed -= L.length;
      }
      function m(L, I) {
        var R = d(this, L, I);
        if (!this.lastNeed)
          return L.toString("utf8", I);
        this.lastTotal = R;
        var v = L.length - (R - this.lastNeed);
        return L.copy(this.lastChar, 0, v), L.toString("utf8", I, v);
      }
      function y(L) {
        var I = L && L.length ? this.write(L) : "";
        return this.lastNeed ? I + "�" : I;
      }
      function w(L, I) {
        if ((L.length - I) % 2 === 0) {
          var R = L.toString("utf16le", I);
          if (R) {
            var v = R.charCodeAt(R.length - 1);
            if (v >= 55296 && v <= 56319)
              return this.lastNeed = 2, this.lastTotal = 4, this.lastChar[0] = L[L.length - 2], this.lastChar[1] = L[L.length - 1], R.slice(0, -1);
          }
          return R;
        }
        return this.lastNeed = 1, this.lastTotal = 2, this.lastChar[0] = L[L.length - 1], L.toString("utf16le", I, L.length - 1);
      }
      function _(L) {
        var I = L && L.length ? this.write(L) : "";
        if (this.lastNeed) {
          var R = this.lastTotal - this.lastNeed;
          return I + this.lastChar.toString("utf16le", 0, R);
        }
        return I;
      }
      function E(L, I) {
        var R = (L.length - I) % 3;
        return R === 0 ? L.toString("base64", I) : (this.lastNeed = 3 - R, this.lastTotal = 3, R === 1 ? this.lastChar[0] = L[L.length - 1] : (this.lastChar[0] = L[L.length - 2], this.lastChar[1] = L[L.length - 1]), L.toString("base64", I, L.length - R));
      }
      function x(L) {
        var I = L && L.length ? this.write(L) : "";
        return this.lastNeed ? I + this.lastChar.toString("base64", 0, 3 - this.lastNeed) : I;
      }
      function C(L) {
        return L.toString(this.encoding);
      }
      function F(L) {
        return L && L.length ? this.write(L) : "";
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
      }).call(this, typeof se < "u" ? se : typeof self < "u" ? self : typeof window < "u" ? window : {});
    }, {}], 82: [function(t, a, e) {
      arguments[4][25][0].apply(e, arguments);
    }, { dup: 25 }], 83: [function(t, a, e) {
      var i = t("is-arguments"), o = t("is-generator-function"), u = t("which-typed-array"), h = t("is-typed-array");
      function p(P) {
        return P.call.bind(P);
      }
      var f = typeof BigInt < "u", d = typeof Symbol < "u", s = p(Object.prototype.toString), g = p(Number.prototype.valueOf), m = p(String.prototype.valueOf), y = p(Boolean.prototype.valueOf);
      if (f)
        var w = p(BigInt.prototype.valueOf);
      if (d)
        var _ = p(Symbol.prototype.valueOf);
      function E(P, et) {
        if (typeof P != "object")
          return !1;
        try {
          return et(P), !0;
        } catch {
          return !1;
        }
      }
      e.isArgumentsObject = i, e.isGeneratorFunction = o, e.isTypedArray = h;
      function x(P) {
        return typeof Promise < "u" && P instanceof Promise || P !== null && typeof P == "object" && typeof P.then == "function" && typeof P.catch == "function";
      }
      e.isPromise = x;
      function C(P) {
        return typeof ArrayBuffer < "u" && ArrayBuffer.isView ? ArrayBuffer.isView(P) : h(P) || W(P);
      }
      e.isArrayBufferView = C;
      function F(P) {
        return u(P) === "Uint8Array";
      }
      e.isUint8Array = F;
      function L(P) {
        return u(P) === "Uint8ClampedArray";
      }
      e.isUint8ClampedArray = L;
      function I(P) {
        return u(P) === "Uint16Array";
      }
      e.isUint16Array = I;
      function R(P) {
        return u(P) === "Uint32Array";
      }
      e.isUint32Array = R;
      function v(P) {
        return u(P) === "Int8Array";
      }
      e.isInt8Array = v;
      function D(P) {
        return u(P) === "Int16Array";
      }
      e.isInt16Array = D;
      function M(P) {
        return u(P) === "Int32Array";
      }
      e.isInt32Array = M;
      function H(P) {
        return u(P) === "Float32Array";
      }
      e.isFloat32Array = H;
      function Y(P) {
        return u(P) === "Float64Array";
      }
      e.isFloat64Array = Y;
      function Q(P) {
        return u(P) === "BigInt64Array";
      }
      e.isBigInt64Array = Q;
      function st(P) {
        return u(P) === "BigUint64Array";
      }
      e.isBigUint64Array = st;
      function j(P) {
        return s(P) === "[object Map]";
      }
      j.working = typeof Map < "u" && j(/* @__PURE__ */ new Map());
      function S(P) {
        return typeof Map > "u" ? !1 : j.working ? j(P) : P instanceof Map;
      }
      e.isMap = S;
      function q(P) {
        return s(P) === "[object Set]";
      }
      q.working = typeof Set < "u" && q(/* @__PURE__ */ new Set());
      function it(P) {
        return typeof Set > "u" ? !1 : q.working ? q(P) : P instanceof Set;
      }
      e.isSet = it;
      function dt(P) {
        return s(P) === "[object WeakMap]";
      }
      dt.working = typeof WeakMap < "u" && dt(/* @__PURE__ */ new WeakMap());
      function kt(P) {
        return typeof WeakMap > "u" ? !1 : dt.working ? dt(P) : P instanceof WeakMap;
      }
      e.isWeakMap = kt;
      function ot(P) {
        return s(P) === "[object WeakSet]";
      }
      ot.working = typeof WeakSet < "u" && ot(/* @__PURE__ */ new WeakSet());
      function U(P) {
        return ot(P);
      }
      e.isWeakSet = U;
      function G(P) {
        return s(P) === "[object ArrayBuffer]";
      }
      G.working = typeof ArrayBuffer < "u" && G(new ArrayBuffer());
      function $(P) {
        return typeof ArrayBuffer > "u" ? !1 : G.working ? G(P) : P instanceof ArrayBuffer;
      }
      e.isArrayBuffer = $;
      function ct(P) {
        return s(P) === "[object DataView]";
      }
      ct.working = typeof ArrayBuffer < "u" && typeof DataView < "u" && ct(new DataView(new ArrayBuffer(1), 0, 1));
      function W(P) {
        return typeof DataView > "u" ? !1 : ct.working ? ct(P) : P instanceof DataView;
      }
      e.isDataView = W;
      var X = typeof SharedArrayBuffer < "u" ? SharedArrayBuffer : void 0;
      function tt(P) {
        return s(P) === "[object SharedArrayBuffer]";
      }
      function ut(P) {
        return typeof X > "u" ? !1 : (typeof tt.working > "u" && (tt.working = tt(new X())), tt.working ? tt(P) : P instanceof X);
      }
      e.isSharedArrayBuffer = ut;
      function gt(P) {
        return s(P) === "[object AsyncFunction]";
      }
      e.isAsyncFunction = gt;
      function mt(P) {
        return s(P) === "[object Map Iterator]";
      }
      e.isMapIterator = mt;
      function z(P) {
        return s(P) === "[object Set Iterator]";
      }
      e.isSetIterator = z;
      function J(P) {
        return s(P) === "[object Generator]";
      }
      e.isGeneratorObject = J;
      function nt(P) {
        return s(P) === "[object WebAssembly.Module]";
      }
      e.isWebAssemblyCompiledModule = nt;
      function St(P) {
        return E(P, g);
      }
      e.isNumberObject = St;
      function Et(P) {
        return E(P, m);
      }
      e.isStringObject = Et;
      function B(P) {
        return E(P, y);
      }
      e.isBooleanObject = B;
      function N(P) {
        return f && E(P, w);
      }
      e.isBigIntObject = N;
      function l(P) {
        return d && E(P, _);
      }
      e.isSymbolObject = l;
      function b(P) {
        return St(P) || Et(P) || B(P) || N(P) || l(P);
      }
      e.isBoxedPrimitive = b;
      function A(P) {
        return typeof Uint8Array < "u" && ($(P) || ut(P));
      }
      e.isAnyArrayBuffer = A, ["isProxy", "isExternal", "isModuleNamespaceObject"].forEach(function(P) {
        Object.defineProperty(e, P, {
          enumerable: !1,
          value: function() {
            throw new Error(P + " is not supported in userland");
          }
        });
      });
    }, { "is-arguments": 47, "is-generator-function": 49, "is-typed-array": 50, "which-typed-array": 85 }], 84: [function(t, a, e) {
      (function(i) {
        (function() {
          var o = Object.getOwnPropertyDescriptors || function(W) {
            for (var X = Object.keys(W), tt = {}, ut = 0; ut < X.length; ut++)
              tt[X[ut]] = Object.getOwnPropertyDescriptor(W, X[ut]);
            return tt;
          }, u = /%[sdj%]/g;
          e.format = function(W) {
            if (!D(W)) {
              for (var X = [], tt = 0; tt < arguments.length; tt++)
                X.push(d(arguments[tt]));
              return X.join(" ");
            }
            for (var tt = 1, ut = arguments, gt = ut.length, mt = String(W).replace(u, function(nt) {
              if (nt === "%%")
                return "%";
              if (tt >= gt)
                return nt;
              switch (nt) {
                case "%s":
                  return String(ut[tt++]);
                case "%d":
                  return Number(ut[tt++]);
                case "%j":
                  try {
                    return JSON.stringify(ut[tt++]);
                  } catch {
                    return "[Circular]";
                  }
                default:
                  return nt;
              }
            }), z = ut[tt]; tt < gt; z = ut[++tt])
              I(z) || !Q(z) ? mt += " " + z : mt += " " + d(z);
            return mt;
          }, e.deprecate = function(W, X) {
            if (typeof i < "u" && i.noDeprecation === !0)
              return W;
            if (typeof i > "u")
              return function() {
                return e.deprecate(W, X).apply(this, arguments);
              };
            var tt = !1;
            function ut() {
              if (!tt) {
                if (i.throwDeprecation)
                  throw new Error(X);
                i.traceDeprecation ? console.trace(X) : console.error(X), tt = !0;
              }
              return W.apply(this, arguments);
            }
            return ut;
          };
          var h = {}, p = /^$/;
          if (i.env.NODE_DEBUG) {
            var f = i.env.NODE_DEBUG;
            f = f.replace(/[|\\{}()[\]^$+?.]/g, "\\$&").replace(/\*/g, ".*").replace(/,/g, "$|^").toUpperCase(), p = new RegExp("^" + f + "$", "i");
          }
          e.debuglog = function(W) {
            if (W = W.toUpperCase(), !h[W])
              if (p.test(W)) {
                var X = i.pid;
                h[W] = function() {
                  var tt = e.format.apply(e, arguments);
                  console.error("%s %d: %s", W, X, tt);
                };
              } else
                h[W] = function() {
                };
            return h[W];
          };
          function d(W, X) {
            var tt = {
              seen: [],
              stylize: g
            };
            return arguments.length >= 3 && (tt.depth = arguments[2]), arguments.length >= 4 && (tt.colors = arguments[3]), L(X) ? tt.showHidden = X : X && e._extend(tt, X), H(tt.showHidden) && (tt.showHidden = !1), H(tt.depth) && (tt.depth = 2), H(tt.colors) && (tt.colors = !1), H(tt.customInspect) && (tt.customInspect = !0), tt.colors && (tt.stylize = s), y(tt, W, tt.depth);
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
          function s(W, X) {
            var tt = d.styles[X];
            return tt ? "\x1B[" + d.colors[tt][0] + "m" + W + "\x1B[" + d.colors[tt][1] + "m" : W;
          }
          function g(W, X) {
            return W;
          }
          function m(W) {
            var X = {};
            return W.forEach(function(tt, ut) {
              X[tt] = !0;
            }), X;
          }
          function y(W, X, tt) {
            if (W.customInspect && X && S(X.inspect) && // Filter out the util module, it's inspect function is special
            X.inspect !== e.inspect && // Also filter out any prototype objects using the circular check.
            !(X.constructor && X.constructor.prototype === X)) {
              var ut = X.inspect(tt, W);
              return D(ut) || (ut = y(W, ut, tt)), ut;
            }
            var gt = w(W, X);
            if (gt)
              return gt;
            var mt = Object.keys(X), z = m(mt);
            if (W.showHidden && (mt = Object.getOwnPropertyNames(X)), j(X) && (mt.indexOf("message") >= 0 || mt.indexOf("description") >= 0))
              return _(X);
            if (mt.length === 0) {
              if (S(X)) {
                var J = X.name ? ": " + X.name : "";
                return W.stylize("[Function" + J + "]", "special");
              }
              if (Y(X))
                return W.stylize(RegExp.prototype.toString.call(X), "regexp");
              if (st(X))
                return W.stylize(Date.prototype.toString.call(X), "date");
              if (j(X))
                return _(X);
            }
            var nt = "", St = !1, Et = ["{", "}"];
            if (F(X) && (St = !0, Et = ["[", "]"]), S(X)) {
              var B = X.name ? ": " + X.name : "";
              nt = " [Function" + B + "]";
            }
            if (Y(X) && (nt = " " + RegExp.prototype.toString.call(X)), st(X) && (nt = " " + Date.prototype.toUTCString.call(X)), j(X) && (nt = " " + _(X)), mt.length === 0 && (!St || X.length == 0))
              return Et[0] + nt + Et[1];
            if (tt < 0)
              return Y(X) ? W.stylize(RegExp.prototype.toString.call(X), "regexp") : W.stylize("[Object]", "special");
            W.seen.push(X);
            var N;
            return St ? N = E(W, X, tt, z, mt) : N = mt.map(function(l) {
              return x(W, X, tt, z, l, St);
            }), W.seen.pop(), C(N, nt, Et);
          }
          function w(W, X) {
            if (H(X))
              return W.stylize("undefined", "undefined");
            if (D(X)) {
              var tt = "'" + JSON.stringify(X).replace(/^"|"$/g, "").replace(/'/g, "\\'").replace(/\\"/g, '"') + "'";
              return W.stylize(tt, "string");
            }
            if (v(X))
              return W.stylize("" + X, "number");
            if (L(X))
              return W.stylize("" + X, "boolean");
            if (I(X))
              return W.stylize("null", "null");
          }
          function _(W) {
            return "[" + Error.prototype.toString.call(W) + "]";
          }
          function E(W, X, tt, ut, gt) {
            for (var mt = [], z = 0, J = X.length; z < J; ++z)
              U(X, String(z)) ? mt.push(x(
                W,
                X,
                tt,
                ut,
                String(z),
                !0
              )) : mt.push("");
            return gt.forEach(function(nt) {
              nt.match(/^\d+$/) || mt.push(x(
                W,
                X,
                tt,
                ut,
                nt,
                !0
              ));
            }), mt;
          }
          function x(W, X, tt, ut, gt, mt) {
            var z, J, nt;
            if (nt = Object.getOwnPropertyDescriptor(X, gt) || { value: X[gt] }, nt.get ? nt.set ? J = W.stylize("[Getter/Setter]", "special") : J = W.stylize("[Getter]", "special") : nt.set && (J = W.stylize("[Setter]", "special")), U(ut, gt) || (z = "[" + gt + "]"), J || (W.seen.indexOf(nt.value) < 0 ? (I(tt) ? J = y(W, nt.value, null) : J = y(W, nt.value, tt - 1), J.indexOf(`
`) > -1 && (mt ? J = J.split(`
`).map(function(St) {
              return "  " + St;
            }).join(`
`).slice(2) : J = `
` + J.split(`
`).map(function(St) {
              return "   " + St;
            }).join(`
`))) : J = W.stylize("[Circular]", "special")), H(z)) {
              if (mt && gt.match(/^\d+$/))
                return J;
              z = JSON.stringify("" + gt), z.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/) ? (z = z.slice(1, -1), z = W.stylize(z, "name")) : (z = z.replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'"), z = W.stylize(z, "string"));
            }
            return z + ": " + J;
          }
          function C(W, X, tt) {
            var ut = W.reduce(function(gt, mt) {
              return mt.indexOf(`
`) >= 0, gt + mt.replace(/\u001b\[\d\d?m/g, "").length + 1;
            }, 0);
            return ut > 60 ? tt[0] + (X === "" ? "" : X + `
 `) + " " + W.join(`,
  `) + " " + tt[1] : tt[0] + X + " " + W.join(", ") + " " + tt[1];
          }
          e.types = t("./support/types");
          function F(W) {
            return Array.isArray(W);
          }
          e.isArray = F;
          function L(W) {
            return typeof W == "boolean";
          }
          e.isBoolean = L;
          function I(W) {
            return W === null;
          }
          e.isNull = I;
          function R(W) {
            return W == null;
          }
          e.isNullOrUndefined = R;
          function v(W) {
            return typeof W == "number";
          }
          e.isNumber = v;
          function D(W) {
            return typeof W == "string";
          }
          e.isString = D;
          function M(W) {
            return typeof W == "symbol";
          }
          e.isSymbol = M;
          function H(W) {
            return W === void 0;
          }
          e.isUndefined = H;
          function Y(W) {
            return Q(W) && it(W) === "[object RegExp]";
          }
          e.isRegExp = Y, e.types.isRegExp = Y;
          function Q(W) {
            return typeof W == "object" && W !== null;
          }
          e.isObject = Q;
          function st(W) {
            return Q(W) && it(W) === "[object Date]";
          }
          e.isDate = st, e.types.isDate = st;
          function j(W) {
            return Q(W) && (it(W) === "[object Error]" || W instanceof Error);
          }
          e.isError = j, e.types.isNativeError = j;
          function S(W) {
            return typeof W == "function";
          }
          e.isFunction = S;
          function q(W) {
            return W === null || typeof W == "boolean" || typeof W == "number" || typeof W == "string" || typeof W == "symbol" || // ES6 symbol
            typeof W > "u";
          }
          e.isPrimitive = q, e.isBuffer = t("./support/isBuffer");
          function it(W) {
            return Object.prototype.toString.call(W);
          }
          function dt(W) {
            return W < 10 ? "0" + W.toString(10) : W.toString(10);
          }
          var kt = [
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
          function ot() {
            var W = /* @__PURE__ */ new Date(), X = [
              dt(W.getHours()),
              dt(W.getMinutes()),
              dt(W.getSeconds())
            ].join(":");
            return [W.getDate(), kt[W.getMonth()], X].join(" ");
          }
          e.log = function() {
            console.log("%s - %s", ot(), e.format.apply(e, arguments));
          }, e.inherits = t("inherits"), e._extend = function(W, X) {
            if (!X || !Q(X))
              return W;
            for (var tt = Object.keys(X), ut = tt.length; ut--; )
              W[tt[ut]] = X[tt[ut]];
            return W;
          };
          function U(W, X) {
            return Object.prototype.hasOwnProperty.call(W, X);
          }
          var G = typeof Symbol < "u" ? Symbol("util.promisify.custom") : void 0;
          e.promisify = function(W) {
            if (typeof W != "function")
              throw new TypeError('The "original" argument must be of type Function');
            if (G && W[G]) {
              var X = W[G];
              if (typeof X != "function")
                throw new TypeError('The "util.promisify.custom" argument must be of type Function');
              return Object.defineProperty(X, G, {
                value: X,
                enumerable: !1,
                writable: !1,
                configurable: !0
              }), X;
            }
            function X() {
              for (var tt, ut, gt = new Promise(function(J, nt) {
                tt = J, ut = nt;
              }), mt = [], z = 0; z < arguments.length; z++)
                mt.push(arguments[z]);
              mt.push(function(J, nt) {
                J ? ut(J) : tt(nt);
              });
              try {
                W.apply(this, mt);
              } catch (J) {
                ut(J);
              }
              return gt;
            }
            return Object.setPrototypeOf(X, Object.getPrototypeOf(W)), G && Object.defineProperty(X, G, {
              value: X,
              enumerable: !1,
              writable: !1,
              configurable: !0
            }), Object.defineProperties(
              X,
              o(W)
            );
          }, e.promisify.custom = G;
          function $(W, X) {
            if (!W) {
              var tt = new Error("Promise was rejected with a falsy value");
              tt.reason = W, W = tt;
            }
            return X(W);
          }
          function ct(W) {
            if (typeof W != "function")
              throw new TypeError('The "original" argument must be of type Function');
            function X() {
              for (var tt = [], ut = 0; ut < arguments.length; ut++)
                tt.push(arguments[ut]);
              var gt = tt.pop();
              if (typeof gt != "function")
                throw new TypeError("The last argument must be of type Function");
              var mt = this, z = function() {
                return gt.apply(mt, arguments);
              };
              W.apply(this, tt).then(
                function(J) {
                  i.nextTick(z.bind(null, null, J));
                },
                function(J) {
                  i.nextTick($.bind(null, J, z));
                }
              );
            }
            return Object.setPrototypeOf(X, Object.getPrototypeOf(W)), Object.defineProperties(
              X,
              o(W)
            ), X;
          }
          e.callbackify = ct;
        }).call(this);
      }).call(this, t("_process"));
    }, { "./support/isBuffer": 82, "./support/types": 83, _process: 63, inherits: 46 }], 85: [function(t, a, e) {
      (function(i) {
        (function() {
          var o = t("for-each"), u = t("available-typed-arrays"), h = t("call-bind/callBound"), p = t("gopd"), f = h("Object.prototype.toString"), d = t("has-tostringtag/shams")(), s = typeof globalThis > "u" ? i : globalThis, g = u(), m = h("String.prototype.slice"), y = {}, w = Object.getPrototypeOf;
          d && p && w && o(g, function(x) {
            if (typeof s[x] == "function") {
              var C = new s[x]();
              if (Symbol.toStringTag in C) {
                var F = w(C), L = p(F, Symbol.toStringTag);
                if (!L) {
                  var I = w(F);
                  L = p(I, Symbol.toStringTag);
                }
                y[x] = L.get;
              }
            }
          });
          var _ = function(x) {
            var C = !1;
            return o(y, function(F, L) {
              if (!C)
                try {
                  var I = F.call(x);
                  I === L && (C = I);
                } catch {
                }
            }), C;
          }, E = t("is-typed-array");
          a.exports = function(x) {
            return E(x) ? !d || !(Symbol.toStringTag in x) ? m(f(x), 8, -1) : _(x) : !1;
          };
        }).call(this);
      }).call(this, typeof se < "u" ? se : typeof self < "u" ? self : typeof window < "u" ? window : {});
    }, { "available-typed-arrays": 27, "call-bind/callBound": 33, "for-each": 36, gopd: 40, "has-tostringtag/shams": 43, "is-typed-array": 50 }] }, {}, [20])(20);
  });
})(Ha);
const Va = (n) => {
  const { data: { position: r, color: t }, bounds: a } = n, e = 4, { width: i, height: o, data: u } = r, h = t == null ? void 0 : t.data, p = [], { min: f, max: d } = a, s = d.clone().sub(f);
  for (let g = 0; g < o; g++)
    for (let m = 0; m < i; m++) {
      const y = (g * i + m) * e, w = u[y] / 256, _ = u[y + 1] / 256, E = u[y + 2] / 256;
      if (u[y + 3] <= 0)
        break;
      const x = h !== void 0 ? { r: h[y], g: h[y + 1], b: h[y + 2], a: h[y + 3] } : void 0;
      p.push({
        position: new Lt(w, _, E).multiply(s).add(f),
        color: x
      });
    }
  return p;
};
var Ir = { exports: {} }, Ze = {};
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var cn;
function $a() {
  if (cn)
    return Ze;
  cn = 1;
  var n = yn, r = Symbol.for("react.element"), t = Symbol.for("react.fragment"), a = Object.prototype.hasOwnProperty, e = n.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, i = { key: !0, ref: !0, __self: !0, __source: !0 };
  function o(u, h, p) {
    var f, d = {}, s = null, g = null;
    p !== void 0 && (s = "" + p), h.key !== void 0 && (s = "" + h.key), h.ref !== void 0 && (g = h.ref);
    for (f in h)
      a.call(h, f) && !i.hasOwnProperty(f) && (d[f] = h[f]);
    if (u && u.defaultProps)
      for (f in h = u.defaultProps, h)
        d[f] === void 0 && (d[f] = h[f]);
    return { $$typeof: r, type: u, key: s, ref: g, props: d, _owner: e.current };
  }
  return Ze.Fragment = t, Ze.jsx = o, Ze.jsxs = o, Ze;
}
var rr = {};
/**
 * @license React
 * react-jsx-runtime.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var un;
function Ya() {
  return un || (un = 1, process.env.NODE_ENV !== "production" && (function() {
    var n = yn, r = Symbol.for("react.element"), t = Symbol.for("react.portal"), a = Symbol.for("react.fragment"), e = Symbol.for("react.strict_mode"), i = Symbol.for("react.profiler"), o = Symbol.for("react.provider"), u = Symbol.for("react.context"), h = Symbol.for("react.forward_ref"), p = Symbol.for("react.suspense"), f = Symbol.for("react.suspense_list"), d = Symbol.for("react.memo"), s = Symbol.for("react.lazy"), g = Symbol.for("react.offscreen"), m = Symbol.iterator, y = "@@iterator";
    function w(Z) {
      if (Z === null || typeof Z != "object")
        return null;
      var ht = m && Z[m] || Z[y];
      return typeof ht == "function" ? ht : null;
    }
    var _ = n.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
    function E(Z) {
      {
        for (var ht = arguments.length, At = new Array(ht > 1 ? ht - 1 : 0), It = 1; It < ht; It++)
          At[It - 1] = arguments[It];
        x("error", Z, At);
      }
    }
    function x(Z, ht, At) {
      {
        var It = _.ReactDebugCurrentFrame, jt = It.getStackAddendum();
        jt !== "" && (ht += "%s", At = At.concat([jt]));
        var Vt = At.map(function(Zt) {
          return String(Zt);
        });
        Vt.unshift("Warning: " + ht), Function.prototype.apply.call(console[Z], console, Vt);
      }
    }
    var C = !1, F = !1, L = !1, I = !1, R = !1, v;
    v = Symbol.for("react.module.reference");
    function D(Z) {
      return !!(typeof Z == "string" || typeof Z == "function" || Z === a || Z === i || R || Z === e || Z === p || Z === f || I || Z === g || C || F || L || typeof Z == "object" && Z !== null && (Z.$$typeof === s || Z.$$typeof === d || Z.$$typeof === o || Z.$$typeof === u || Z.$$typeof === h || // This needs to include all possible module reference object
      // types supported by any Flight configuration anywhere since
      // we don't know which Flight build this will end up being used
      // with.
      Z.$$typeof === v || Z.getModuleId !== void 0));
    }
    function M(Z, ht, At) {
      var It = Z.displayName;
      if (It)
        return It;
      var jt = ht.displayName || ht.name || "";
      return jt !== "" ? At + "(" + jt + ")" : At;
    }
    function H(Z) {
      return Z.displayName || "Context";
    }
    function Y(Z) {
      if (Z == null)
        return null;
      if (typeof Z.tag == "number" && E("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), typeof Z == "function")
        return Z.displayName || Z.name || null;
      if (typeof Z == "string")
        return Z;
      switch (Z) {
        case a:
          return "Fragment";
        case t:
          return "Portal";
        case i:
          return "Profiler";
        case e:
          return "StrictMode";
        case p:
          return "Suspense";
        case f:
          return "SuspenseList";
      }
      if (typeof Z == "object")
        switch (Z.$$typeof) {
          case u:
            var ht = Z;
            return H(ht) + ".Consumer";
          case o:
            var At = Z;
            return H(At._context) + ".Provider";
          case h:
            return M(Z, Z.render, "ForwardRef");
          case d:
            var It = Z.displayName || null;
            return It !== null ? It : Y(Z.type) || "Memo";
          case s: {
            var jt = Z, Vt = jt._payload, Zt = jt._init;
            try {
              return Y(Zt(Vt));
            } catch {
              return null;
            }
          }
        }
      return null;
    }
    var Q = Object.assign, st = 0, j, S, q, it, dt, kt, ot;
    function U() {
    }
    U.__reactDisabledLog = !0;
    function G() {
      {
        if (st === 0) {
          j = console.log, S = console.info, q = console.warn, it = console.error, dt = console.group, kt = console.groupCollapsed, ot = console.groupEnd;
          var Z = {
            configurable: !0,
            enumerable: !0,
            value: U,
            writable: !0
          };
          Object.defineProperties(console, {
            info: Z,
            log: Z,
            warn: Z,
            error: Z,
            group: Z,
            groupCollapsed: Z,
            groupEnd: Z
          });
        }
        st++;
      }
    }
    function $() {
      {
        if (st--, st === 0) {
          var Z = {
            configurable: !0,
            enumerable: !0,
            writable: !0
          };
          Object.defineProperties(console, {
            log: Q({}, Z, {
              value: j
            }),
            info: Q({}, Z, {
              value: S
            }),
            warn: Q({}, Z, {
              value: q
            }),
            error: Q({}, Z, {
              value: it
            }),
            group: Q({}, Z, {
              value: dt
            }),
            groupCollapsed: Q({}, Z, {
              value: kt
            }),
            groupEnd: Q({}, Z, {
              value: ot
            })
          });
        }
        st < 0 && E("disabledDepth fell below zero. This is a bug in React. Please file an issue.");
      }
    }
    var ct = _.ReactCurrentDispatcher, W;
    function X(Z, ht, At) {
      {
        if (W === void 0)
          try {
            throw Error();
          } catch (jt) {
            var It = jt.stack.trim().match(/\n( *(at )?)/);
            W = It && It[1] || "";
          }
        return `
` + W + Z;
      }
    }
    var tt = !1, ut;
    {
      var gt = typeof WeakMap == "function" ? WeakMap : Map;
      ut = new gt();
    }
    function mt(Z, ht) {
      if (!Z || tt)
        return "";
      {
        var At = ut.get(Z);
        if (At !== void 0)
          return At;
      }
      var It;
      tt = !0;
      var jt = Error.prepareStackTrace;
      Error.prepareStackTrace = void 0;
      var Vt;
      Vt = ct.current, ct.current = null, G();
      try {
        if (ht) {
          var Zt = function() {
            throw Error();
          };
          if (Object.defineProperty(Zt.prototype, "props", {
            set: function() {
              throw Error();
            }
          }), typeof Reflect == "object" && Reflect.construct) {
            try {
              Reflect.construct(Zt, []);
            } catch (Ee) {
              It = Ee;
            }
            Reflect.construct(Z, [], Zt);
          } else {
            try {
              Zt.call();
            } catch (Ee) {
              It = Ee;
            }
            Z.call(Zt.prototype);
          }
        } else {
          try {
            throw Error();
          } catch (Ee) {
            It = Ee;
          }
          Z();
        }
      } catch (Ee) {
        if (Ee && It && typeof Ee.stack == "string") {
          for (var Tt = Ee.stack.split(`
`), Qt = It.stack.split(`
`), zt = Tt.length - 1, $t = Qt.length - 1; zt >= 1 && $t >= 0 && Tt[zt] !== Qt[$t]; )
            $t--;
          for (; zt >= 1 && $t >= 0; zt--, $t--)
            if (Tt[zt] !== Qt[$t]) {
              if (zt !== 1 || $t !== 1)
                do
                  if (zt--, $t--, $t < 0 || Tt[zt] !== Qt[$t]) {
                    var re = `
` + Tt[zt].replace(" at new ", " at ");
                    return Z.displayName && re.includes("<anonymous>") && (re = re.replace("<anonymous>", Z.displayName)), typeof Z == "function" && ut.set(Z, re), re;
                  }
                while (zt >= 1 && $t >= 0);
              break;
            }
        }
      } finally {
        tt = !1, ct.current = Vt, $(), Error.prepareStackTrace = jt;
      }
      var ve = Z ? Z.displayName || Z.name : "", Vr = ve ? X(ve) : "";
      return typeof Z == "function" && ut.set(Z, Vr), Vr;
    }
    function z(Z, ht, At) {
      return mt(Z, !1);
    }
    function J(Z) {
      var ht = Z.prototype;
      return !!(ht && ht.isReactComponent);
    }
    function nt(Z, ht, At) {
      if (Z == null)
        return "";
      if (typeof Z == "function")
        return mt(Z, J(Z));
      if (typeof Z == "string")
        return X(Z);
      switch (Z) {
        case p:
          return X("Suspense");
        case f:
          return X("SuspenseList");
      }
      if (typeof Z == "object")
        switch (Z.$$typeof) {
          case h:
            return z(Z.render);
          case d:
            return nt(Z.type, ht, At);
          case s: {
            var It = Z, jt = It._payload, Vt = It._init;
            try {
              return nt(Vt(jt), ht, At);
            } catch {
            }
          }
        }
      return "";
    }
    var St = Object.prototype.hasOwnProperty, Et = {}, B = _.ReactDebugCurrentFrame;
    function N(Z) {
      if (Z) {
        var ht = Z._owner, At = nt(Z.type, Z._source, ht ? ht.type : null);
        B.setExtraStackFrame(At);
      } else
        B.setExtraStackFrame(null);
    }
    function l(Z, ht, At, It, jt) {
      {
        var Vt = Function.call.bind(St);
        for (var Zt in Z)
          if (Vt(Z, Zt)) {
            var Tt = void 0;
            try {
              if (typeof Z[Zt] != "function") {
                var Qt = Error((It || "React class") + ": " + At + " type `" + Zt + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof Z[Zt] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.");
                throw Qt.name = "Invariant Violation", Qt;
              }
              Tt = Z[Zt](ht, Zt, It, At, null, "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED");
            } catch (zt) {
              Tt = zt;
            }
            Tt && !(Tt instanceof Error) && (N(jt), E("%s: type specification of %s `%s` is invalid; the type checker function must return `null` or an `Error` but returned a %s. You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument).", It || "React class", At, Zt, typeof Tt), N(null)), Tt instanceof Error && !(Tt.message in Et) && (Et[Tt.message] = !0, N(jt), E("Failed %s type: %s", At, Tt.message), N(null));
          }
      }
    }
    var b = Array.isArray;
    function A(Z) {
      return b(Z);
    }
    function P(Z) {
      {
        var ht = typeof Symbol == "function" && Symbol.toStringTag, At = ht && Z[Symbol.toStringTag] || Z.constructor.name || "Object";
        return At;
      }
    }
    function et(Z) {
      try {
        return pt(Z), !1;
      } catch {
        return !0;
      }
    }
    function pt(Z) {
      return "" + Z;
    }
    function Pt(Z) {
      if (et(Z))
        return E("The provided key is an unsupported type %s. This value must be coerced to a string before before using it here.", P(Z)), pt(Z);
    }
    var Dt = _.ReactCurrentOwner, Kt = {
      key: !0,
      ref: !0,
      __self: !0,
      __source: !0
    }, Nt, Ut;
    function Jt(Z) {
      if (St.call(Z, "ref")) {
        var ht = Object.getOwnPropertyDescriptor(Z, "ref").get;
        if (ht && ht.isReactWarning)
          return !1;
      }
      return Z.ref !== void 0;
    }
    function ae(Z) {
      if (St.call(Z, "key")) {
        var ht = Object.getOwnPropertyDescriptor(Z, "key").get;
        if (ht && ht.isReactWarning)
          return !1;
      }
      return Z.key !== void 0;
    }
    function te(Z, ht) {
      typeof Z.ref == "string" && Dt.current;
    }
    function ne(Z, ht) {
      {
        var At = function() {
          Nt || (Nt = !0, E("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", ht));
        };
        At.isReactWarning = !0, Object.defineProperty(Z, "key", {
          get: At,
          configurable: !0
        });
      }
    }
    function fe(Z, ht) {
      {
        var At = function() {
          Ut || (Ut = !0, E("%s: `ref` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", ht));
        };
        At.isReactWarning = !0, Object.defineProperty(Z, "ref", {
          get: At,
          configurable: !0
        });
      }
    }
    var T = function(Z, ht, At, It, jt, Vt, Zt) {
      var Tt = {
        // This tag allows us to uniquely identify this as a React Element
        $$typeof: r,
        // Built-in properties that belong on the element
        type: Z,
        key: ht,
        ref: At,
        props: Zt,
        // Record the component responsible for creating this element.
        _owner: Vt
      };
      return Tt._store = {}, Object.defineProperty(Tt._store, "validated", {
        configurable: !1,
        enumerable: !1,
        writable: !0,
        value: !1
      }), Object.defineProperty(Tt, "_self", {
        configurable: !1,
        enumerable: !1,
        writable: !1,
        value: It
      }), Object.defineProperty(Tt, "_source", {
        configurable: !1,
        enumerable: !1,
        writable: !1,
        value: jt
      }), Object.freeze && (Object.freeze(Tt.props), Object.freeze(Tt)), Tt;
    };
    function yt(Z, ht, At, It, jt) {
      {
        var Vt, Zt = {}, Tt = null, Qt = null;
        At !== void 0 && (Pt(At), Tt = "" + At), ae(ht) && (Pt(ht.key), Tt = "" + ht.key), Jt(ht) && (Qt = ht.ref, te(ht, jt));
        for (Vt in ht)
          St.call(ht, Vt) && !Kt.hasOwnProperty(Vt) && (Zt[Vt] = ht[Vt]);
        if (Z && Z.defaultProps) {
          var zt = Z.defaultProps;
          for (Vt in zt)
            Zt[Vt] === void 0 && (Zt[Vt] = zt[Vt]);
        }
        if (Tt || Qt) {
          var $t = typeof Z == "function" ? Z.displayName || Z.name || "Unknown" : Z;
          Tt && ne(Zt, $t), Qt && fe(Zt, $t);
        }
        return T(Z, Tt, Qt, jt, It, Dt.current, Zt);
      }
    }
    var wt = _.ReactCurrentOwner, Rt = _.ReactDebugCurrentFrame;
    function K(Z) {
      if (Z) {
        var ht = Z._owner, At = nt(Z.type, Z._source, ht ? ht.type : null);
        Rt.setExtraStackFrame(At);
      } else
        Rt.setExtraStackFrame(null);
    }
    var ft;
    ft = !1;
    function k(Z) {
      return typeof Z == "object" && Z !== null && Z.$$typeof === r;
    }
    function bt() {
      {
        if (wt.current) {
          var Z = Y(wt.current.type);
          if (Z)
            return `

Check the render method of \`` + Z + "`.";
        }
        return "";
      }
    }
    function Mt(Z) {
      return "";
    }
    var c = {};
    function at(Z) {
      {
        var ht = bt();
        if (!ht) {
          var At = typeof Z == "string" ? Z : Z.displayName || Z.name;
          At && (ht = `

Check the top-level render call using <` + At + ">.");
        }
        return ht;
      }
    }
    function lt(Z, ht) {
      {
        if (!Z._store || Z._store.validated || Z.key != null)
          return;
        Z._store.validated = !0;
        var At = at(ht);
        if (c[At])
          return;
        c[At] = !0;
        var It = "";
        Z && Z._owner && Z._owner !== wt.current && (It = " It was passed a child from " + Y(Z._owner.type) + "."), K(Z), E('Each child in a list should have a unique "key" prop.%s%s See https://reactjs.org/link/warning-keys for more information.', At, It), K(null);
      }
    }
    function O(Z, ht) {
      {
        if (typeof Z != "object")
          return;
        if (A(Z))
          for (var At = 0; At < Z.length; At++) {
            var It = Z[At];
            k(It) && lt(It, ht);
          }
        else if (k(Z))
          Z._store && (Z._store.validated = !0);
        else if (Z) {
          var jt = w(Z);
          if (typeof jt == "function" && jt !== Z.entries)
            for (var Vt = jt.call(Z), Zt; !(Zt = Vt.next()).done; )
              k(Zt.value) && lt(Zt.value, ht);
        }
      }
    }
    function V(Z) {
      {
        var ht = Z.type;
        if (ht == null || typeof ht == "string")
          return;
        var At;
        if (typeof ht == "function")
          At = ht.propTypes;
        else if (typeof ht == "object" && (ht.$$typeof === h || // Note: Memo only checks outer props here.
        // Inner props are checked in the reconciler.
        ht.$$typeof === d))
          At = ht.propTypes;
        else
          return;
        if (At) {
          var It = Y(ht);
          l(At, Z.props, "prop", It, Z);
        } else if (ht.PropTypes !== void 0 && !ft) {
          ft = !0;
          var jt = Y(ht);
          E("Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?", jt || "Unknown");
        }
        typeof ht.getDefaultProps == "function" && !ht.getDefaultProps.isReactClassApproved && E("getDefaultProps is only used on classic React.createClass definitions. Use a static property named `defaultProps` instead.");
      }
    }
    function rt(Z) {
      {
        for (var ht = Object.keys(Z.props), At = 0; At < ht.length; At++) {
          var It = ht[At];
          if (It !== "children" && It !== "key") {
            K(Z), E("Invalid prop `%s` supplied to `React.Fragment`. React.Fragment can only have `key` and `children` props.", It), K(null);
            break;
          }
        }
        Z.ref !== null && (K(Z), E("Invalid attribute `ref` supplied to `React.Fragment`."), K(null));
      }
    }
    function Ct(Z, ht, At, It, jt, Vt) {
      {
        var Zt = D(Z);
        if (!Zt) {
          var Tt = "";
          (Z === void 0 || typeof Z == "object" && Z !== null && Object.keys(Z).length === 0) && (Tt += " You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.");
          var Qt = Mt();
          Qt ? Tt += Qt : Tt += bt();
          var zt;
          Z === null ? zt = "null" : A(Z) ? zt = "array" : Z !== void 0 && Z.$$typeof === r ? (zt = "<" + (Y(Z.type) || "Unknown") + " />", Tt = " Did you accidentally export a JSX literal instead of a component?") : zt = typeof Z, E("React.jsx: type is invalid -- expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s", zt, Tt);
        }
        var $t = yt(Z, ht, At, jt, Vt);
        if ($t == null)
          return $t;
        if (Zt) {
          var re = ht.children;
          if (re !== void 0)
            if (It)
              if (A(re)) {
                for (var ve = 0; ve < re.length; ve++)
                  O(re[ve], Z);
                Object.freeze && Object.freeze(re);
              } else
                E("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");
            else
              O(re, Z);
        }
        return Z === a ? rt($t) : V($t), $t;
      }
    }
    function xt(Z, ht, At) {
      return Ct(Z, ht, At, !0);
    }
    function Ot(Z, ht, At) {
      return Ct(Z, ht, At, !1);
    }
    var Wt = Ot, be = xt;
    rr.Fragment = a, rr.jsx = Wt, rr.jsxs = be;
  })()), rr;
}
process.env.NODE_ENV === "production" ? Ir.exports = $a() : Ir.exports = Ya();
var _e = Ir.exports;
const nr = {
  Default: 0,
  Loading: 1,
  Loaded: 2
};
function ti(n) {
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
    lodHelper: y,
    frustumCulled: w,
    ..._
  } = n, E = he(null), [x, C] = Xt(!1), [F, L] = Xt(nr.Default), [I, R] = Xt({}), v = Yt(() => `${o.x}-${o.y}-${o.z}`, [o]), D = Yt(() => {
    const ot = r.coordinates[i][v], { min: U, max: G } = ot, $ = new Lt(U[0], U[1], U[2]), ct = new Lt(G[0], G[1], G[2]), W = ct.clone().sub($);
    return {
      min: $,
      max: ct,
      size: W
    };
  }, [r, i, v]);
  ue(() => {
    h == null || h({
      coordinate: o,
      state: F
    });
  }, [o, F, h]);
  const M = Yt(() => u.getSize(new Lt()), [u]), H = Ht(
    (ot, U, G) => {
      const $ = o.clone().multiplyScalar(2).clone().add(new Lt(ot, U, G)), ct = `${$.x}-${$.y}-${$.z}`;
      return {
        position: $,
        key: ct
      };
    },
    [o]
  ), Y = Ht(() => {
    const { min: ot } = u, U = new Lt();
    u.getSize(U);
    const { x: G, y: $, z: ct } = U, W = G * 0.5, X = $ * 0.5, tt = ct * 0.5, ut = new Lt(W, X, tt), gt = {};
    for (let mt = 0; mt <= 1; mt += 1)
      for (let z = 0; z <= 1; z += 1)
        for (let J = 0; J <= 1; J += 1) {
          const nt = ot.clone().add(ut.clone().multiply(new Lt(J, z, mt))), St = ot.clone().add(ut.clone().multiply(new Lt(J + 1, z + 1, mt + 1))), { key: Et } = H(J, z, mt);
          gt[Et] = new Oe(nt, St);
        }
    return gt;
  }, [u, i, H]), Q = Yt(() => {
    const ot = Y(), U = i + 1, G = [];
    for (let $ = 0; $ <= 1; $ += 1)
      for (let ct = 0; ct <= 1; ct += 1)
        for (let W = 0; W <= 1; W += 1) {
          const { position: X, key: tt } = H(W, ct, $), ut = ot[tt], gt = U in r.coordinates && tt in r.coordinates[U];
          G.push({
            lod: U,
            coordinate: X,
            bounds: ut,
            exists: gt
          });
        }
    return G;
  }, [r, u, i, Y, H]), [st, j] = Xt([]), S = Ht(
    (ot) => {
      const { points: U, grid: G } = ot, $ = G.map((W) => ({
        points: [],
        bounds: W.bounds
      }));
      U.forEach((W) => {
        var X;
        (X = $.find((tt) => tt.bounds.containsPoint(W.position))) == null || X.points.push(W);
      });
      const ct = $.map((W) => {
        const { points: X } = W, tt = 1 / 256;
        return {
          position: new Float32Array(
            X.map((ut) => ut.position.toArray()).flat()
          ),
          color: e === void 0 ? new Float32Array(
            X.map((ut) => {
              var gt, mt, z;
              return [
                (((gt = ut.color) == null ? void 0 : gt.r) ?? 255) * tt,
                (((mt = ut.color) == null ? void 0 : mt.g) ?? 255) * tt,
                (((z = ut.color) == null ? void 0 : z.b) ?? 255) * tt
              ];
            }).flat()
          ) : new Float32Array(X.map((ut) => e({
            point: ut,
            lod: i,
            bounds: u
          })).flat())
        };
      });
      j(ct);
    },
    [e, u, i]
  );
  ue(() => {
    if (Q.length > 0) {
      L(nr.Loading);
      const ot = {
        lod: i,
        coordinate: o
      };
      t({ address: ot, color: !0 }).then((U) => {
        const G = a({
          data: U,
          address: ot,
          bounds: D
        });
        S({
          points: G,
          grid: Q
        }), L(nr.Loaded);
      });
    }
  }, [r, D, t, i, o, a, S, Q]), Mr(({ camera: ot }) => {
    if (i >= r.lod)
      return;
    const { current: U } = E;
    if (U === null)
      return;
    const { min: G, max: $ } = u, ct = [
      new Lt(G.x, G.y, G.z),
      new Lt($.x, G.y, G.z),
      new Lt($.x, G.y, $.z),
      new Lt(G.x, G.y, $.z),
      new Lt(G.x, $.y, G.z),
      new Lt($.x, $.y, G.z),
      new Lt($.x, $.y, $.z),
      new Lt(G.x, $.y, $.z)
    ].map((ut) => U.localToWorld(ut.clone())), W = new Oe().setFromPoints(ct), X = Math.max(...M.toArray()) / 2, tt = W.distanceToPoint(ot.position) < X || W.containsPoint(ot.position);
    C(tt);
  });
  const q = Ht(
    (ot) => {
      const { coordinate: U, state: G } = ot;
      R(($) => ({
        ...$,
        [`${U.x}-${U.y}-${U.z}`]: G
      }));
    },
    []
  ), it = Yt(() => {
    const ot = d ?? 5;
    if (g !== !1) {
      const U = 2 ** (Q.filter((G) => G.exists).length > 0 ? i : i - 1);
      return ot / U;
    }
    return ot;
  }, [r, d, g, i, Q]), dt = Yt(() => p ?? new bn("white"), [p]), kt = Ht((ot) => {
    const { vertexShader: U, fragmentShader: G } = ot;
    {
      const $ = U.split(`
`);
      $.pop();
      const ct = s ?? 0;
      $.push(`gl_PointSize = max(gl_PointSize, ${ct.toFixed(2)});`), $.push("}"), ot.vertexShader = $.join(`
`);
    }
    {
      const $ = G.split(`
`);
      $.pop(), $.push("if (distance(gl_PointCoord, vec2(0.5, 0.5)) > 0.5) { discard; }"), $.push("}"), ot.fragmentShader = $.join(`
`);
    }
  }, [s]);
  return /* @__PURE__ */ _e.jsxs("group", { ref: E, children: [
    y === !0 && /* @__PURE__ */ _e.jsx("box3Helper", { args: [u, 16711680] }),
    Q.map((ot, U) => {
      const G = ot.coordinate.toArray().join("-"), { exists: $ } = ot;
      return /* @__PURE__ */ _e.jsxs("group", { frustumCulled: !1, children: [
        x && $ ? /* @__PURE__ */ _e.jsx(
          ti,
          {
            meta: r,
            loader: t,
            parser: a,
            pointColorHandler: e,
            onUpdateState: q,
            color: p,
            opacity: f,
            pointSize: d,
            minPointSize: s,
            circle: m,
            lodHelper: y,
            frustumCulled: w,
            ..._,
            ...ot
          }
        ) : null,
        st[U] !== void 0 ? /* @__PURE__ */ _e.jsx(
          wi,
          {
            visible: !$ || !x || I[G] !== nr.Loaded,
            positions: st[U].position,
            colors: st[U].color,
            frustumCulled: w,
            children: /* @__PURE__ */ _e.jsx(
              "pointsMaterial",
              {
                color: dt,
                vertexColors: !0,
                sizeAttenuation: !0,
                size: it,
                opacity: f ?? 1,
                transparent: f !== void 0 && f < 1,
                onBeforeCompile: kt,
                ..._
              }
            )
          }
        ) : null
      ] }, `${i}-${G}`);
    })
  ] });
}
function Xa(n) {
  const { meta: r, loader: t, parser: a, pointColorHandler: e, ...i } = n, o = Yt(() => {
    if (r !== null) {
      const { min: p, max: f } = r.bounds, d = new Oe(new Lt().fromArray(p), new Lt().fromArray(f)), s = new Lt();
      d.getSize(s);
      const g = Math.max(s.x, s.y, s.z), m = new Lt(g, g, g);
      return new Oe(d.min.clone(), d.min.clone().add(m));
    }
    return new Oe();
  }, [r]), u = Yt(() => {
    const p = o.getSize(new Lt());
    return [p.x, p.y, p.z, 1, 1, 1];
  }, [o]), h = Yt(() => new Lt(), []);
  return /* @__PURE__ */ _e.jsxs("group", { children: [
    /* @__PURE__ */ _e.jsx(_i, { position: o.getCenter(new Lt()), args: u, visible: !1, children: /* @__PURE__ */ _e.jsx("meshStandardMaterial", { color: "tomato", transparent: !0, opacity: 0.2 }) }),
    /* @__PURE__ */ _e.jsx(
      ti,
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
const Ka = {
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
}, hn = (n, r, t) => Math.min(t, Math.max(r, n)), Ja = ({
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
  const { client: p, project: f } = Xe(), [d, s] = Xt(!1), [g, m] = Xt(!1), y = he(null), w = Ht(
    (v) => {
      const { address: D, color: M } = v, { lod: H, coordinate: Y } = D;
      return new Promise(async (Q, st) => {
        const j = new Yr(), S = `${Y.x}-${Y.y}-${Y.z}`, q = {
          contractId: f.contractId,
          contractFileId: n.id,
          level: H,
          addr: S
        }, it = await (p == null ? void 0 : p.getContractFileImagePosition(q));
        if (it === void 0) {
          st(new Error("Failed to load PNG buffer"));
          return;
        }
        const dt = j.parse(it);
        dt.on("parsed", async () => {
          if (M) {
            const kt = await (p == null ? void 0 : p.getContractFileImageColor(q));
            if (kt === void 0) {
              st(new Error("Failed to load PNG buffer"));
              return;
            }
            const U = new Yr().parse(kt);
            U.on("parsed", () => {
              Q({
                position: dt,
                color: U
              });
            });
          } else
            Q({
              position: dt
            });
        });
      });
    },
    [p, f, n]
  );
  ue(() => {
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
          }), { length: D } = v, M = Array.from({ length: D / 4 }).some((H, Y) => {
            const Q = v[Y * 4 + 3];
            return Q !== 0 && Q !== 255;
          });
          m(M);
        } catch (v) {
          console.warn(v);
        }
      s(!0);
    })();
  }, [r, w]);
  const _ = Yt(() => {
    if (t == null) return r;
    const { min: v, max: D } = r.bounds, M = new Lt().fromArray(v).add(t), H = new Lt().fromArray(D).add(t);
    return {
      ...r,
      bounds: {
        min: M.toArray(),
        max: H.toArray()
      }
    };
  }, [r, t]), E = Ht(
    (v) => {
      const D = t ?? new Lt();
      return Va(v).map((H) => (H.position.add(D), H));
    },
    [t]
  ), x = Yt(() => Gt.scale("Spectral"), []), C = Ht(
    (v) => {
      const D = x(v), [M, H, Y] = D.rgb(!1);
      return [M / 255, H / 255, Y / 255];
    },
    [x]
  ), F = Ht(
    ({ point: v }) => {
      const { color: D } = v;
      let M;
      if (D !== void 0) {
        const { r: H, g: Y, b: Q, a: st } = D;
        g ? M = C(st / 255) : M = [H / 255, Y / 255, Q / 255];
      } else
        M = [1, 1, 1];
      if (a) {
        const H = [0.12941176470588237, 0.5882352941176471, 0.9529411764705882], Y = 0.3;
        return [
          M[0] * (1 - Y) + H[0] * Y,
          M[1] * (1 - Y) + H[1] * Y,
          M[2] * (1 - Y) + H[2] * Y
        ];
      }
      return M;
    },
    [C, g, a]
  ), L = Yt(() => {
    const v = r.bounds, D = v.max[0] - v.min[0], M = v.max[1] - v.min[1], H = v.max[2] - v.min[2];
    return Qa({ size: { x: D, y: M, z: H } });
  }, [r]), I = Yt(() => (L ?? 1) * 0.1, [L]);
  ue(() => {
    const v = y.current;
    v && (o === void 0 && u === void 0 || v.traverse((D) => {
      var H, Y, Q, st;
      const M = D.material;
      if (M) {
        if (o !== void 0) {
          const j = hn(o, 0, 5);
          typeof M.size == "number" && (M.size = j, M.needsUpdate = !0), ((Y = (H = M.uniforms) == null ? void 0 : H.pointSize) == null ? void 0 : Y.value) !== void 0 && (M.uniforms.pointSize.value = j);
        }
        if (u !== void 0) {
          const j = hn(u, 0, 100) / 100;
          ((st = (Q = M.uniforms) == null ? void 0 : Q.opacity) == null ? void 0 : st.value) !== void 0 && (M.uniforms.opacity.value = j), typeof M.opacity == "number" && (M.opacity = j, j < 1 && M.transparent !== !0 && (M.transparent = !0), M.needsUpdate = !0);
        }
      }
    }));
  }, [o, u]);
  const R = Yt(() => {
    if (h)
      return Ka[h];
  }, [h]);
  return d ? /* @__PURE__ */ _t(
    "group",
    {
      ref: y,
      position: [e.x, e.y, e.z],
      rotation: [
        i.x * (Math.PI / 180),
        i.y * (Math.PI / 180),
        i.z * (Math.PI / 180),
        "XYZ"
      ],
      children: /* @__PURE__ */ _t(
        "group",
        {
          rotation: R ? new si(R.rotation[0], R.rotation[1], R.rotation[2], "XYZ") : void 0,
          scale: R ? R.scale : void 0,
          children: /* @__PURE__ */ _t(
            Xa,
            {
              frustumCulled: !1,
              meta: _,
              loader: w,
              parser: E,
              pointColorHandler: F,
              pointSize: L,
              minPointSize: I
            }
          )
        }
      )
    }
  ) : null;
};
function Qa(n) {
  const { x: r, y: t, z: a } = n.size, { min: e, max: i } = n, u = Math.max(r, t, a) / 128 * 3;
  return Math.min(Math.max(e ?? u, u), i ?? u);
}
const ts = {
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
}, es = (n) => {
  const { children: r, boxSx: t, ...a } = n;
  return /* @__PURE__ */ _t(di, { ...a, children: /* @__PURE__ */ _t(de, { component: "div", sx: { ...ts, ...t }, children: r }) });
}, rs = ({
  value: n,
  onChange: r
}) => {
  const t = Yt(
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
  ), a = Ht(
    (e, i) => {
      r == null || r({
        key: i,
        value: e.target.value
      });
    },
    [r]
  );
  return /* @__PURE__ */ ee(
    Cr,
    {
      sx: {
        marginBottom: 3,
        width: 1
      },
      children: [
        /* @__PURE__ */ _t(
          _n,
          {
            id: "file-variant",
            sx: {
              fontWeight: "bold",
              marginBottom: 1
            },
            children: "施工現場情報"
          }
        ),
        t.map((e) => /* @__PURE__ */ _t(
          or,
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
}, ns = (n) => {
  const { client: r } = Xe(), { contractId: t, onUploaded: a, ...e } = n, i = he(null), [o, u] = Xt(null), [h, p] = Xt(!1), [f, d] = Xt(""), [s, g] = Xt({}), m = Yt(() => ".las,.laz,.csv,.txt,.xyz,.e57", []), y = Ht(
    (_) => {
      const { files: E } = _.target;
      if (E !== null) {
        const x = Array.from(E);
        if (x.length > 10) {
          d("アップロードできるファイル数は10個までです");
          return;
        }
        d(""), u(x[0]);
      }
    },
    []
  ), w = Ht(() => {
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
  return /* @__PURE__ */ _t(es, { ...e, children: /* @__PURE__ */ _t(
    de,
    {
      component: "div",
      sx: {
        width: 1,
        height: 1
      },
      children: h ? /* @__PURE__ */ _t(
        de,
        {
          component: "div",
          sx: {
            width: 1,
            height: 1,
            flexDirection: "column"
          },
          display: "flex",
          children: /* @__PURE__ */ _t(
            Ge,
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
      ) : /* @__PURE__ */ ee(
        de,
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
            /* @__PURE__ */ _t(
              Ge,
              {
                variant: "h6",
                sx: {
                  fontWeight: "bold",
                  marginBottom: 2
                },
                children: "ファイルをアップロードする"
              }
            ),
            /* @__PURE__ */ ee(Cr, { children: [
              /* @__PURE__ */ _t(
                _n,
                {
                  id: "file-uploading",
                  sx: {
                    fontWeight: "bold",
                    marginBottom: 1
                  },
                  children: "ファイルを選択する"
                }
              ),
              /* @__PURE__ */ _t(
                ar,
                {
                  variant: "outlined",
                  startIcon: /* @__PURE__ */ _t(Ri, {}),
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
              /* @__PURE__ */ _t(
                "input",
                {
                  multiple: !1,
                  type: "file",
                  accept: m,
                  onChange: y,
                  style: { display: "none" },
                  ref: i
                }
              ),
              /* @__PURE__ */ _t(pi, { error: !0, children: f })
            ] }),
            o !== null && /* @__PURE__ */ ee(de, { width: 1, children: [
              /* @__PURE__ */ _t(
                Ge,
                {
                  variant: "body1",
                  sx: {
                    marginRight: 1
                  },
                  children: o.name
                }
              ),
              /* @__PURE__ */ _t(
                rs,
                {
                  value: s,
                  onChange: (_) => {
                    g((E) => ({
                      ...E,
                      [_.key]: _.value
                    }));
                  }
                }
              )
            ] }),
            /* @__PURE__ */ _t(
              de,
              {
                component: "div",
                sx: {
                  width: 1,
                  marginTop: 1,
                  textAlign: "right"
                },
                children: /* @__PURE__ */ _t(
                  ar,
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
}, is = ({ contractId: n, onUploaded: r }) => {
  const t = He.useSelector((p) => p), a = He.useActorRef(), [e, i] = Xt({
    file: !1
  }), o = Ht(
    (p) => () => {
      i((f) => ({ ...f, [p]: !1 }));
    },
    []
  ), u = Yt(() => [
    {
      icon: /* @__PURE__ */ _t(Oi, {}),
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
      icon: /* @__PURE__ */ _t(Li, {}),
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
  ], [t, a]), h = Ht(() => {
    r == null || r(), o("file")();
  }, [r, o]);
  return /* @__PURE__ */ ee(
    Tr,
    {
      dense: !0,
      sx: {
        flex: "0 0 auto"
      },
      children: [
        u.map((p, f) => /* @__PURE__ */ ee(wn, { onClick: p.onClick, selected: p.selected, children: [
          /* @__PURE__ */ _t(yi, { children: p.icon }),
          /* @__PURE__ */ _t(bi, { primary: p.text })
        ] }, f)),
        /* @__PURE__ */ _t(
          ns,
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
}, os = ({ point: n }) => /* @__PURE__ */ ee(
  de,
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
      /* @__PURE__ */ _t(
        Ge,
        {
          variant: "caption",
          sx: {
            marginRight: 1,
            marginTop: "2px"
          },
          children: "基準点"
        }
      ),
      /* @__PURE__ */ ee(
        "code",
        {
          style: {
            fontSize: "0.75em"
          },
          children: [
            "(",
            kr(n.x),
            ", ",
            kr(n.y),
            ", ",
            kr(n.z),
            ")"
          ]
        }
      )
    ]
  }
), kr = (n) => Math.floor(n * 10) / 10, as = ({
  onFileFocus: n,
  onFileDelete: r
}) => {
  const { client: t, project: a } = Xe(), { toggleVisibility: e, containers: i } = jr(), [o, u] = Xt(null), h = o !== null, p = Ht(
    (s, g) => {
      u({ el: s, container: g });
    },
    []
  ), f = Ht(() => {
    u(null);
  }, []), d = Ht(
    (s) => {
      const { id: g } = s;
      a === void 0 || g === void 0 || t == null || t.getContractFileDownloadUrl(a.contractId, g).then((m) => {
        const { presignedURL: y } = m;
        y !== void 0 && window.open(y, "_blank");
      });
    },
    [t, a]
  );
  return /* @__PURE__ */ ee(ai, { children: [
    i.map((s) => {
      const { file: g, visible: m } = s;
      return /* @__PURE__ */ ee(Pr, { children: [
        /* @__PURE__ */ _t(Ge, { variant: "body2", marginRight: 2, children: g.name }),
        /* @__PURE__ */ ee(de, { children: [
          /* @__PURE__ */ _t(hr, { title: "ファイルを表示", disableInteractive: !0, children: /* @__PURE__ */ _t(
            dr,
            {
              size: "small",
              onClick: () => {
                e(s);
              },
              children: m ? /* @__PURE__ */ _t(Ii, {}) : /* @__PURE__ */ _t(Ci, {})
            }
          ) }),
          /* @__PURE__ */ _t(hr, { title: "ファイルの中心に移動", disableInteractive: !0, children: /* @__PURE__ */ _t(
            dr,
            {
              size: "small",
              disabled: !m,
              onClick: () => {
                n(g);
              },
              children: /* @__PURE__ */ _t(Ti, {})
            }
          ) }),
          /* @__PURE__ */ _t(hr, { title: "ファイルの詳細", children: /* @__PURE__ */ _t(
            dr,
            {
              size: "small",
              onClick: (y) => {
                p(y.currentTarget, s);
              },
              children: /* @__PURE__ */ _t(Mi, {})
            }
          ) })
        ] })
      ] }, g.id);
    }),
    /* @__PURE__ */ _t(gi, { anchorEl: o == null ? void 0 : o.el, open: h, onClose: f, children: /* @__PURE__ */ ee(Tr, { dense: !0, children: [
      /* @__PURE__ */ _t(
        wn,
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
}, ss = () => {
  const n = He.useActorRef(), { point: r, change: t, save: a } = Br(), e = Ht(
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
  ), i = Ht(() => {
    a(r);
  }, [r, a]), o = Ht(() => {
    n.send({ type: "IDLE" });
  }, [n]);
  return /* @__PURE__ */ _t(
    de,
    {
      component: "div",
      sx: {
        width: 1,
        height: 1
      },
      children: /* @__PURE__ */ ee(mi, { children: [
        /* @__PURE__ */ _t(Pr, { children: /* @__PURE__ */ ee(
          Cr,
          {
            sx: {
              width: 1
            },
            children: [
              /* @__PURE__ */ _t(
                or,
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
              /* @__PURE__ */ _t(
                or,
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
              /* @__PURE__ */ _t(
                or,
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
        /* @__PURE__ */ ee(Pr, { sx: { display: "flex", flexDirection: "column" }, children: [
          /* @__PURE__ */ _t(
            ar,
            {
              sx: { marginBottom: 1 },
              variant: "contained",
              fullWidth: !0,
              startIcon: /* @__PURE__ */ _t(Di, {}),
              onClick: i,
              children: "保存"
            }
          ),
          /* @__PURE__ */ _t(
            ar,
            {
              variant: "outlined",
              fullWidth: !0,
              startIcon: /* @__PURE__ */ _t(ji, {}),
              onClick: o,
              children: "閉じる"
            }
          )
        ] })
      ] })
    }
  );
}, ls = ({ onFileFocus: n, onFileDelete: r }) => {
  const t = He.useSelector((a) => a);
  return /* @__PURE__ */ _t(
    Tr,
    {
      dense: !0,
      sx: {
        flex: "0 0 auto"
      },
      children: t.matches("reference_point") ? /* @__PURE__ */ _t(ss, {}) : /* @__PURE__ */ _t(
        as,
        {
          onFileFocus: n,
          onFileDelete: r
        }
      )
    }
  );
}, fs = "RCDE_VIEWER_CMD", ir = (n, r, t) => Math.min(t, Math.max(r, n)), cs = (n, r) => {
  const t = new Lt(1 / n.direction.x, 1 / n.direction.y, 1 / n.direction.z), a = (r.min.x - n.origin.x) * t.x, e = (r.max.x - n.origin.x) * t.x, i = (r.min.y - n.origin.y) * t.y, o = (r.max.y - n.origin.y) * t.y, u = (r.min.z - n.origin.z) * t.z, h = (r.max.z - n.origin.z) * t.z, p = Math.max(Math.max(Math.min(a, e), Math.min(i, o)), Math.min(u, h)), f = Math.min(Math.min(Math.max(a, e), Math.max(i, o)), Math.max(u, h));
  if (f < 0 || p > f)
    return null;
  const d = p > 0 ? p : f;
  return n.origin.clone().add(n.direction.clone().multiplyScalar(d));
}, us = ({ views: n, referencePoint: r, onContractFileClick: t }) => {
  const { camera: a, gl: e } = Dr(), i = Yt(() => new fi(), []), o = Ht((u) => {
    if (!t) return;
    const h = e.domElement.getBoundingClientRect(), p = (u.clientX - h.left) / h.width * 2 - 1, f = -((u.clientY - h.top) / h.height) * 2 + 1;
    i.setFromCamera(new We(p, f), a);
    const d = i.ray;
    let s = null;
    for (const g of n) {
      const m = g.boundingBox.clone();
      m.translate(r);
      const y = cs(d, m);
      if (y) {
        const w = d.origin.distanceTo(y);
        (!s || w < s.distance) && (s = { view: g, distance: w });
      }
    }
    s ? t(s.view.file, s.view.boundingBox) : t(void 0, void 0);
  }, [n, r, t, a, e, i]);
  return ue(() => {
    const u = e.domElement;
    return u.addEventListener("click", o), () => {
      u.removeEventListener("click", o);
    };
  }, [e, o]), null;
}, hs = (n) => {
  const { load: r, containers: t } = jr(), { app: a, constructionId: e, contractId: i, contractFileIds: o, r3f: u, children: h, positionOffsetComponent: p, showLeftSider: f = !0, showRightSider: d = !0, selectedFileId: s, onContractFileClick: g } = n, { initialize: m, client: y, project: w, setProject: _ } = Xe(), { point: E, change: x } = Br(), [C, F] = Xt([]), L = he(null), I = he(null), R = he(null), [v, D] = Xt({
    pointSize: 2,
    opacity: 100
  }), [M, H] = Xt({}), [Y, Q] = Xt({}), st = o ? JSON.stringify(o) : void 0, j = Yt(() => o, [st]);
  ue(() => {
    m(a);
  }, [a, m]), ue(() => {
    _({ constructionId: e, contractId: i });
  }, [e, i, _]);
  const S = Ht(async () => {
    if (!(!y || !i))
      try {
        const U = await y.getContractFileList({ contractId: i }), G = (U == null ? void 0 : U.contractFiles) ?? [];
        r(G, j);
      } catch (U) {
        console.warn("[Viewer] getContractFileList threw:", U), r([], j);
      }
  }, [y, i, j, r]);
  ue(() => {
    y && i && S();
  }, [y, i, S]);
  const q = Yt(() => ({
    fov: 40,
    position: new Lt(1, 2, 1).multiplyScalar(100),
    up: new Lt(0, 0, 1),
    near: 0.1,
    far: 1e3 * 5
  }), []);
  ue(() => {
    if (w === void 0) return;
    const U = t.filter((G) => G.visible).map((G) => {
      const $ = G.file.id;
      return $ === void 0 ? Promise.resolve(void 0) : y == null ? void 0 : y.getContractFileMetadata({ ...w, contractFileId: $ }).then((ct) => {
        const W = ct, { min: X, max: tt } = W.bounds, ut = new Oe(new Lt().fromArray(X), new Lt().fromArray(tt));
        return { file: G.file, meta: W, boundingBox: ut };
      }).catch((ct) => {
        console.error(ct);
      });
    });
    Promise.all(U).then((G) => {
      F(G.filter(($) => $ !== void 0));
    });
  }, [t, w, y]);
  const it = Ht((U) => {
    const G = C.find((ct) => ct.file.id === U.id);
    if (!G) return;
    const $ = G.boundingBox.getCenter(new Lt());
    x($.negate());
  }, [C, x]), dt = Ht((U) => {
    console.log(U);
  }, []), kt = Ht(() => {
    S();
  }, [S]), ot = Ht((U, G, $) => {
    if (!U) return;
    const ct = ir(G, 0, 5), W = ir($, 0, 100) / 100;
    U.traverse((X) => {
      var ut, gt;
      const tt = X.material;
      tt && (typeof tt.size == "number" && (tt.size = ct, tt.needsUpdate = !0), tt.uniforms && (((ut = tt.uniforms.pointSize) == null ? void 0 : ut.value) !== void 0 && (tt.uniforms.pointSize.value = ct), ((gt = tt.uniforms.opacity) == null ? void 0 : gt.value) !== void 0 && (tt.uniforms.opacity.value = W)), typeof tt.opacity == "number" && (tt.opacity = W, W < 1 && tt.transparent !== !0 && (tt.transparent = !0), tt.needsUpdate = !0));
    });
  }, []);
  return ue(() => {
    ot(L.current, v.pointSize, v.opacity);
  }, [v, ot]), ue(() => {
    const U = (G) => {
      var ct, W, X, tt, ut, gt;
      if (!(G != null && G.data) || G.data.channel !== fs) return;
      const $ = G.data.cmd;
      if ($.type === "SET_TRANSFORM") {
        const { fileId: mt, translation: z, rotation: J } = $.payload;
        H((nt) => ({
          ...nt,
          [mt]: {
            translation: z,
            rotation: J
          }
        }));
      } else if ($.type === "SET_APPEARANCE") {
        const mt = $.payload.upAxis, z = $.payload.coordinateSystem, J = ir($.payload.pointSize ?? v.pointSize, 0, 5), nt = ir($.payload.opacity ?? v.opacity, 0, 100), St = $.payload.fileId;
        if (St !== void 0 ? Q((Et) => {
          var B;
          return {
            ...Et,
            [St]: {
              pointSize: J,
              opacity: nt,
              coordinateSystem: z ?? ((B = Et[St]) == null ? void 0 : B.coordinateSystem)
            }
          };
        }) : D({ pointSize: J, opacity: nt }), mt) {
          const Et = I.current;
          Et && (mt === "Y" ? Et.up.set(0, 1, 0) : Et.up.set(0, 0, 1), (ct = Et.updateProjectionMatrix) == null || ct.call(Et)), (X = (W = R.current) == null ? void 0 : W.update) == null || X.call(W);
        }
      } else if ($.type === "RESET") {
        const mt = L.current;
        mt && (mt.position.set(0, 0, 0), mt.rotation.set(0, 0, 0, "XYZ")), D({ pointSize: 2, opacity: 100 }), Q({}), H({});
        const z = I.current;
        z && (z.up.set(0, 0, 1), (tt = z.updateProjectionMatrix) == null || tt.call(z)), (gt = (ut = R.current) == null ? void 0 : ut.update) == null || gt.call(ut);
      }
    };
    return window.addEventListener("message", U), () => window.removeEventListener("message", U);
  }, [v.pointSize, v.opacity]), /* @__PURE__ */ ee(de, { width: 1, height: 1, display: "flex", children: [
    f && /* @__PURE__ */ _t(is, { contractId: i, onUploaded: kt }),
    /* @__PURE__ */ ee(de, { width: 1, height: 1, flex: 1, position: "relative", overflow: "hidden", children: [
      /* @__PURE__ */ ee(Pi, { camera: q, ...u == null ? void 0 : u.canvas, children: [
        /* @__PURE__ */ _t("perspectiveCamera", { ref: I }),
        (u == null ? void 0 : u.map) !== !1 && /* @__PURE__ */ _t(vi, { ref: R, makeDefault: !0, screenSpacePanning: !0 }),
        (u == null ? void 0 : u.light) !== !1 && /* @__PURE__ */ _t("ambientLight", { intensity: 0.5 }),
        (u == null ? void 0 : u.grid) !== !1 && /* @__PURE__ */ _t(
          Ei,
          {
            args: [10, 10],
            quaternion: new gn().setFromAxisAngle(new Lt(1, 0, 0), Math.PI / 2),
            infiniteGrid: !0,
            followCamera: !0,
            fadeDistance: 1e3,
            cellSize: 10,
            sectionSize: 50,
            sectionColor: new bn("#6f6f6f"),
            side: li
          }
        ),
        (u == null ? void 0 : u.gizmo) !== !1 && /* @__PURE__ */ _t(Si, { alignment: "top-right", margin: [80, 80], children: /* @__PURE__ */ _t(Ai, { axisColors: ["#9d4b4b", "#2f7f4f", "#3b5b9d"], labelColor: "white" }) }),
        /* @__PURE__ */ ee("group", { ref: L, children: [
          C.map((U) => {
            const G = U.file.id, $ = G !== void 0 ? M[G] : void 0, ct = G !== void 0 ? Y[G] : void 0;
            return /* @__PURE__ */ _t(
              Ja,
              {
                file: U.file,
                meta: U.meta,
                referencePoint: E,
                selected: G === s,
                translation: ($ == null ? void 0 : $.translation) ?? { x: 0, y: 0, z: 0 },
                rotation: ($ == null ? void 0 : $.rotation) ?? { x: 0, y: 0, z: 0 },
                inspectorPointSize: ct == null ? void 0 : ct.pointSize,
                inspectorOpacity: ct == null ? void 0 : ct.opacity,
                inspectorCoordinateSystem: ct == null ? void 0 : ct.coordinateSystem
              },
              G
            );
          }),
          /* @__PURE__ */ _t("group", { position: E, children: p }),
          /* @__PURE__ */ _t("group", { children: h }),
          g && /* @__PURE__ */ _t(us, { views: C, referencePoint: E, onContractFileClick: g })
        ] })
      ] }),
      /* @__PURE__ */ _t(
        de,
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
          children: /* @__PURE__ */ _t(os, { point: E })
        }
      )
    ] }),
    d && /* @__PURE__ */ _t(ls, { onFileFocus: it, onFileDelete: dt })
  ] });
}, Bs = (n) => /* @__PURE__ */ _t(He.Provider, { children: /* @__PURE__ */ _t(Fi, { children: /* @__PURE__ */ _t(Ni, { children: /* @__PURE__ */ _t(Ui, { children: /* @__PURE__ */ _t(hs, { ...n }) }) }) }) }), Fs = {
  RightHandedXUp: "RIGHT_HANDED_X_UP",
  LeftHandedXUp: "LEFT_HANDED_X_UP",
  RightHandedYUp: "RIGHT_HANDED_Y_UP",
  LeftHandedYUp: "LEFT_HANDED_Y_UP",
  RightHandedZUp: "RIGHT_HANDED_Z_UP",
  LeftHandedZUp: "LEFT_HANDED_Z_UP"
}, ei = "RCDE_VIEWER_CMD";
function xr(n) {
  typeof window > "u" || window.postMessage({ channel: ei, cmd: n }, "*");
}
const Ns = {
  setTransform(n) {
    xr({ type: "SET_TRANSFORM", payload: n });
  },
  setAppearance(n) {
    xr({ type: "SET_APPEARANCE", payload: n });
  },
  reset() {
    xr({ type: "RESET" });
  },
  addListener(n) {
    if (typeof window > "u") return () => {
    };
    const r = (t) => {
      !(t != null && t.data) || t.data.channel !== ei || n(t.data.cmd);
    };
    return window.addEventListener("message", r), () => window.removeEventListener("message", r);
  }
}, ri = Ye({
  points: [],
  setPoints: () => {
  },
  isActive: !1,
  setIsActive: () => {
  }
}), Us = ({ children: n }) => {
  const [r, t] = Xt([]), [a, e] = Xt(!1);
  return /* @__PURE__ */ _t(
    ri.Provider,
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
}, zs = () => {
  const n = $e(ri);
  if (!n)
    throw new Error("useMeasurement must be used within a MeasurementProvider");
  return n;
};
class qe {
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
class ds {
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
class ps {
  constructor(r, t, a) {
    this.x = r, this.y = t, this.data = a;
  }
}
const ys = { capacity: 4, removeEmptyNodes: !1, maximumDepth: -1, arePointsEqual: (n, r) => n.x === r.x && n.y === r.y };
class Me {
  constructor(r, t, a = []) {
    this.container = r, this.config = Object.assign({}, ys, t), this.isDivided = !1, this.points = [];
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
    this.ne = new Me(new qe(a + i, e, i, o), t), this.nw = new Me(new qe(a, e, i, o), t), this.se = new Me(new qe(a + i, e + o, i, o), t), this.sw = new Me(new qe(a, e + o, i, o), t), this.insert(this.points.slice()), this.points.length = 0, this.points = [];
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
const dn = (n) => {
  const { points: r, camera: t } = n, a = new Me(new qe(-1, -1, 2, 2)), e = /* @__PURE__ */ new Map(), i = 1e4;
  return r.forEach((o, u) => {
    const h = o.clone().project(t), p = Math.round(h.x * i) / i, f = Math.round(h.y * i) / i;
    if (p < -1 || p > 1 || f < -1 || f > 1)
      return;
    const d = `${p},${f}`;
    if (!e.has(d)) {
      const s = new ps(p, f, { id: u });
      e.set(d, s), a.insert(s);
    }
  }), {
    tree: a
  };
}, bs = (n, r, t) => {
  const a = r.query(new ds(n.x, n.y, 0.05));
  if (a.length > 0) {
    const e = gs(n, a), { id: i } = e.data;
    return t[i].clone();
  }
}, gs = (n, r) => {
  const t = r.map((e) => {
    const i = n.x - e.x, o = n.y - e.y;
    return i * i + o * o;
  }), a = Math.min(...t);
  return r[t.indexOf(a)];
}, ms = (n) => {
  const { canvas: r } = n;
  return Ht(
    (t) => {
      const a = new We(t.clientX, t.clientY), { x: e, y: i, width: o, height: u } = r.getBoundingClientRect();
      return a.sub(new We(e, i)), new We(
        a.x / o * 2 - 1,
        -(a.y / u) * 2 + 1
      );
    },
    [r]
  );
}, _s = 180 / Math.PI, ws = (n, r, t) => {
  const { width: a, height: e } = n.getBoundingClientRect(), i = t.clone().project(r);
  return new Lt((i.x + 1) / 2 * a, -(i.y - 1) / 2 * e, 0);
}, vs = ({
  points: n,
  referencePoint: r,
  edit: t
}) => {
  const { camera: a } = Dr(), [e, i] = Xt(null), [o, u] = Xt([]), [h, p] = Xt([]), f = he(new mn()), d = he(0), s = he(""), g = Yt(() => n !== void 0 ? n : [], [n]), m = Yt(() => r !== void 0 ? r : new Lt(), [r]), y = Ht(
    (w) => {
      const _ = g.map((C) => C.clone().add(m));
      if (e === null || _.length < 1) return [];
      const E = _.map((C) => ws(e, w, C));
      t && u(E);
      const x = Array.from(Array(E.length - 1).keys()).map(
        (C) => {
          const F = _[C], L = _[C + 1], I = F.distanceTo(L);
          return {
            from: E[C],
            to: E[C + 1],
            length: I
          };
        }
      );
      p(x);
    },
    [e, t, m, g]
  );
  return ue(() => {
    e !== null && g.length > 0 && y(a);
  }, [g, e, a, y]), Mr(({ camera: w }) => {
    const _ = d.current !== g.length, E = g.map((C) => `${C.x.toFixed(3)},${C.y.toFixed(3)},${C.z.toFixed(3)}`).join("|"), x = s.current !== E;
    (!f.current.equals(w.matrixWorld) || _ || x) && e !== null && (f.current.copy(w.matrixWorld), d.current = g.length, s.current = E, y(w));
  }), /* @__PURE__ */ ee(
    ki,
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
        o.map((w, _) => /* @__PURE__ */ _t(
          Es,
          {
            position: w,
            color: "white"
          },
          `metrics-point-${_}`
        )),
        h.map((w, _) => /* @__PURE__ */ _t(Ss, { ...w }, `metrics-line-${_}`))
      ]
    }
  );
}, Es = ({ position: n, color: r }) => /* @__PURE__ */ _t(
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
    children: /* @__PURE__ */ _t("svg", { width: "100%", height: "100%", children: /* @__PURE__ */ _t(
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
), Ss = ({ from: n, to: r, length: t }) => {
  const a = Yt(() => {
    const e = r.clone().sub(n), i = e.length(), o = new Lt(e.y, -e.x, 0), u = new Lt(), h = e.clone().normalize(), p = Math.PI * 0.15, f = Math.min(i * 0.25, 10), d = 15, g = Math.min(
      1,
      (i - d) / (40 - d)
    ), m = h.clone().applyAxisAngle(new Lt(0, 0, 1), p).setLength(f), y = h.clone().applyAxisAngle(new Lt(0, 0, 1), -p).setLength(f), w = r.clone().add(u), _ = w.clone().add(m.clone().negate()), E = w.clone().add(y.clone().negate()), x = n.clone().add(u), C = x.clone().add(m), F = x.clone().add(y), L = o.clone().setLength(10), I = n.clone().add(r).multiplyScalar(0.5).add(L), v = new We(h.x, h.y).negate().angle() * _s;
    return {
      head: w,
      tail: x,
      headLeft: _,
      headRight: E,
      tailLeft: C,
      tailRight: F,
      opacity: g,
      angle: v,
      labelPosition: I
    };
  }, [n, r, t]);
  return /* @__PURE__ */ ee(
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
        /* @__PURE__ */ _t("svg", { width: "100%", height: "100%", children: /* @__PURE__ */ ee(
          "g",
          {
            style: {
              stroke: "black",
              strokeWidth: 2
            },
            children: [
              /* @__PURE__ */ _t(
                "line",
                {
                  x1: a.head.x,
                  y1: a.head.y,
                  x2: a.tail.x,
                  y2: a.tail.y
                }
              ),
              /* @__PURE__ */ _t(
                "line",
                {
                  x1: a.head.x,
                  y1: a.head.y,
                  x2: a.headLeft.x,
                  y2: a.headLeft.y
                }
              ),
              /* @__PURE__ */ _t(
                "line",
                {
                  x1: a.head.x,
                  y1: a.head.y,
                  x2: a.headRight.x,
                  y2: a.headRight.y
                }
              ),
              /* @__PURE__ */ _t(
                "line",
                {
                  x1: a.tail.x,
                  y1: a.tail.y,
                  x2: a.tailLeft.x,
                  y2: a.tailLeft.y
                }
              ),
              /* @__PURE__ */ _t(
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
        /* @__PURE__ */ ee(
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
}, pn = (n, r = 10) => {
  const t = [];
  return n.traverse((a) => {
    if (a instanceof ci || a.type === "Points" || a.type === "points") {
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
}, Zs = ({ onChange: n, externalAppEditedPoints: r }) => {
  const t = he(null), [a, e] = Xt(null), [i, o] = Xt([]);
  Br();
  const u = he(null), h = he([]), p = he(new mn()), { camera: f, gl: d, scene: s } = Dr(), g = d.domElement, m = ms({ canvas: g }), y = Yt(() => r && r.length > 0 ? r : a !== null ? [...i, a] : [...i], [r, i, a]);
  Mr(() => {
    if (!p.current.equals(f.matrixWorld)) {
      p.current.copy(f.matrixWorld);
      const _ = pn(s);
      if (_.length > 0) {
        h.current = _;
        const E = dn({ camera: f, points: _ });
        u.current = E.tree;
      }
    }
  }), ue(() => {
    const _ = setTimeout(() => {
      const E = pn(s);
      if (E.length > 0) {
        h.current = E;
        const x = dn({ camera: f, points: E });
        u.current = x.tree;
      }
    }, 500);
    return () => clearTimeout(_);
  }, [f, s]);
  const w = Ht(
    (_) => !u.current || h.current.length === 0 ? void 0 : bs(_, u.current, h.current),
    []
  );
  return ue(() => {
    const _ = (L) => {
      L.stopPropagation();
      const I = t.current;
      if (I !== null) {
        const R = [...i, I];
        o(R), n == null || n(R), t.current = null, R.length >= 2 && setTimeout(() => {
          o([]);
        }, 2e3);
      }
    }, E = (L) => {
      const I = m(L), R = w({ x: I.x, y: I.y });
      R !== void 0 && (t.current = R, e(R));
    }, x = (L) => {
      L.key === "Escape" && (o([]), e(null), t.current = null);
    }, C = (L) => {
      L.preventDefault(), L.stopPropagation(), o([]), e(null), t.current = null;
    }, F = (L) => {
      L.stopPropagation(), L.stopImmediatePropagation();
    };
    return g.addEventListener("mousedown", _, { capture: !0 }), g.addEventListener("click", F, { capture: !0 }), g.addEventListener("mousemove", E), window.addEventListener("keydown", x), g.addEventListener("contextmenu", C, { capture: !0 }), () => {
      g.removeEventListener("mousedown", _, { capture: !0 }), g.removeEventListener("click", F, { capture: !0 }), g.removeEventListener("mousemove", E), window.removeEventListener("keydown", x), g.removeEventListener("contextmenu", C, { capture: !0 });
    };
  }, [g, m, w, i, o, n]), /* @__PURE__ */ _t(
    vs,
    {
      edit: !0,
      points: y
    }
  );
}, qs = ({
  length: n = 10,
  width: r = 0.2,
  visible: t = !0,
  point: a
}) => {
  const e = Yt(() => a ? a instanceof Lt ? a : new Lt(a.x, a.y, a.z) : null, [a]), i = Yt(
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
  return !t || !e ? null : /* @__PURE__ */ _t("group", { position: e, children: i.map((o) => /* @__PURE__ */ _t(
    "arrowHelper",
    {
      args: [o.direction, new Lt(0, 0, 0), n, o.color, n * 0.2, r]
    },
    o.label
  )) });
}, ni = Ye({
  clippingPlanes: [],
  setClippingPlanes: () => {
  }
}), Ws = ({ children: n }) => {
  const [r, t] = Xt([]);
  return /* @__PURE__ */ _t(
    ni.Provider,
    {
      value: {
        clippingPlanes: r,
        setClippingPlanes: t
      },
      children: n
    }
  );
}, As = () => {
  const n = $e(ni);
  if (!n)
    throw new Error("useClippingPlanes must be used within a ClippingPlanesProvider");
  return n;
}, Gs = () => {
  const [n, r] = Xt(
    new $r().setFromNormalAndCoplanarPoint(
      new Lt(0, 0, -1),
      new Lt()
    )
  ), { setClippingPlanes: t } = As();
  ue(() => (t([n]), () => {
    t([]);
  }), [n, t]);
  const a = Ht((e) => {
    const i = new Lt(), o = new gn();
    e.decompose(i, o, new Lt());
    const u = new Lt(0, 0, -1);
    u.applyQuaternion(o).normalize();
    const h = new $r().setFromNormalAndCoplanarPoint(u, i);
    r(h);
  }, []);
  return /* @__PURE__ */ _t(xi, { scale: 50, fixed: !0, disableScaling: !0, onDrag: a, children: /* @__PURE__ */ _t(ks, { size: 100 }) });
}, ks = ({ size: n, color: r = "yellow", opacity: t = 0.85 }) => {
  const a = Yt(() => {
    const o = [
      new Lt(-n / 2, -n / 2, 0),
      new Lt(n / 2, -n / 2, 0),
      new Lt(n / 2, n / 2, 0),
      new Lt(-n / 2, n / 2, 0)
    ];
    return [...o, o[0]];
  }, [n]), e = Yt(() => [
    new Lt(-n / 2, -n / 2, 0),
    new Lt(n / 2, n / 2, 0)
  ], [n]), i = Yt(() => [
    new Lt(n / 2, -n / 2, 0),
    new Lt(-n / 2, n / 2, 0)
  ], [n]);
  return /* @__PURE__ */ ee("group", { children: [
    /* @__PURE__ */ _t(pr, { points: a, color: r, transparent: !0, opacity: t }),
    /* @__PURE__ */ _t(pr, { points: e, color: r, transparent: !0, opacity: t }),
    /* @__PURE__ */ _t(pr, { points: i, color: r, transparent: !0, opacity: t })
  ] });
};
export {
  Fi as ClientProvider,
  ni as ClippingPlanesContext,
  Ws as ClippingPlanesProvider,
  Ja as ContractFileView,
  Ni as ContractFilesProvider,
  Fs as CoordinateSystem,
  Gs as CrossSectionHandler,
  ks as CrossSectionPlane,
  He as GlobalStateContext,
  ri as MeasurementContext,
  Zs as MeasurementHandler,
  Us as MeasurementProvider,
  vs as MeasurementView,
  Bs as RCDE,
  Bi as RCDEClient,
  qs as ReferencePointAxis,
  Ui as ReferencePointProvider,
  hs as Viewer,
  Ns as ViewerBridge,
  Xe as useClient,
  As as useClippingPlanes,
  jr as useContractFiles,
  zs as useMeasurement,
  Br as useReferencePoint
};
