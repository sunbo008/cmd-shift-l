window.__ModuleLoader__.load({ id: "@dsh-plugin/cmd-shift-l", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.ts
var index_exports = {};
__export(index_exports, {
  NS: () => NS,
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);

// node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/util.js
function jsonStringifyReplacer(_, value) {
  if (typeof value === "bigint")
    return value.toString();
  return value;
}
var Cached = class {
  constructor(getter) {
    this._getter = getter;
    this._value = void 0;
  }
  get value() {
    const getter = this._getter;
    if (getter !== void 0) {
      this._value = getter();
      this._getter = void 0;
    }
    return this._value;
  }
};
function cached(getter) {
  return new Cached(getter);
}
function cleanRegex(source) {
  const start = source.startsWith("^") ? 1 : 0;
  const end = source.endsWith("$") ? source.length - 1 : source.length;
  return source.slice(start, end);
}
function assignProp(target, prop, value) {
  Object.defineProperty(target, prop, {
    value,
    writable: true,
    enumerable: true,
    configurable: true
  });
}
var captureStackTrace = "captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => {
};
function isObject(data) {
  return typeof data === "object" && data !== null && !Array.isArray(data);
}
function isPlainObject(o) {
  if (isObject(o) === false)
    return false;
  const ctor = o.constructor;
  if (ctor === void 0)
    return true;
  if (typeof ctor !== "function")
    return true;
  const prot = ctor.prototype;
  if (isObject(prot) === false)
    return false;
  if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) {
    return false;
  }
  return true;
}
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function clone(inst, def, params) {
  const cl = new inst._zod.constr(def ?? inst._zod.def);
  if (!def || params?.parent)
    cl._zod.parent = inst;
  return cl;
}
function normalizeParams(_params) {
  const params = _params;
  if (!params)
    return {};
  if (typeof params === "string")
    return { error: () => params };
  if (params?.message !== void 0) {
    if (params?.error !== void 0)
      throw new Error("Cannot specify both `message` and `error` params");
    params.error = params.message;
  }
  delete params.message;
  if (typeof params.error === "string")
    return { ...params, error: () => params.error };
  return params;
}
function optionalKeys(shape) {
  return Object.keys(shape).filter((k) => {
    return shape[k]._zod.optin !== void 0 && shape[k]._zod.optout === "optional";
  });
}
function aborted(x, startIndex = 0) {
  if (x.aborted === true)
    return true;
  for (let i = startIndex; i < x.issues.length; i++) {
    if (x.issues[i]?.continue !== true) {
      return true;
    }
  }
  return false;
}
function explicitlyAborted(x, startIndex = 0) {
  if (x.aborted === true)
    return true;
  for (let i = startIndex; i < x.issues.length; i++) {
    if (x.issues[i]?.continue === false) {
      return true;
    }
  }
  return false;
}
function prefixIssues(path, issues) {
  return issues.map((iss) => {
    var _a2;
    (_a2 = iss).path ?? (_a2.path = []);
    iss.path.unshift(path);
    return iss;
  });
}
function unwrapMessage(message) {
  return typeof message === "string" ? message : message?.message;
}
function attachSchema(issues, start, inst) {
  var _a2;
  for (let i = start; i < issues.length; i++) {
    (_a2 = issues[i]).schema ?? (_a2.schema = inst);
  }
}
function finalizeIssue(iss, ctx, config2) {
  var _a2;
  const traits = iss.inst?._zod?.traits;
  if (traits?.has("$ZodType")) {
    if (traits.has("$ZodCheck"))
      (_a2 = iss).schema ?? (_a2.schema = iss.inst);
    else
      iss.schema = iss.inst;
  }
  const schemaError = iss.schema !== iss.inst ? iss.schema?._zod.def?.error : void 0;
  const message = iss.message ? iss.message : unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(schemaError?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config2.customError?.(iss)) ?? unwrapMessage(config2.localeError?.(iss)) ?? "Invalid input";
  const full = {};
  for (const k of Object.keys(iss)) {
    if (k === "inst" || k === "schema" || k === "continue" || k === "input" || k === "__proto__")
      continue;
    full[k] = iss[k];
  }
  full.path ?? (full.path = []);
  full.message = message;
  if (ctx?.reportInput) {
    full.input = iss.input;
  }
  return full;
}
function members(proto, table) {
  for (const key in table) {
    const desc = Object.getOwnPropertyDescriptor(table, key);
    if (desc.get)
      Object.defineProperty(proto, key, { ...desc, enumerable: false });
    else
      defineBound(proto, key, desc.value);
  }
}
function own(inst, key, value, enumerable = true) {
  Object.defineProperty(inst, key, { configurable: true, writable: true, enumerable, value });
  return value;
}
function hide(inst, key, value) {
  return own(inst, key, value, false);
}
function defineBound(proto, key, fn) {
  Object.defineProperty(proto, key, {
    configurable: true,
    get() {
      return this == null ? fn : own(this, key, fn.bind(this));
    },
    set(value) {
      own(this, key, value);
    }
  });
}
function claim(inst, sentinel) {
  const proto = Object.getPrototypeOf(inst);
  return sentinel in proto ? void 0 : proto;
}
var installing;
var broke = false;
var breaker = {
  configurable: true,
  get() {
    broke = true;
    return void 0;
  }
};
function defineLazyInternal(inst, key, compute) {
  const proto = Object.getPrototypeOf(inst._zod);
  if (key in proto && installing !== inst._zod) {
    installing = void 0;
    return;
  }
  installing = inst._zod;
  Object.defineProperty(proto, key, {
    configurable: true,
    get() {
      Object.defineProperty(this, key, breaker);
      const outer = broke;
      broke = false;
      try {
        const value = compute(this);
        if (broke)
          delete this[key];
        else
          Object.defineProperty(this, key, { configurable: true, writable: true, value });
        broke = broke || outer;
        return value;
      } catch (err) {
        delete this[key];
        broke = broke || outer;
        throw err;
      }
    },
    set(value) {
      Object.defineProperty(this, key, { configurable: true, writable: true, value });
    }
  });
}
function installLazyProp(inst, key, make, enumerable) {
  const proto = claim(inst, key);
  if (!proto)
    return;
  Object.defineProperty(proto, key, {
    configurable: true,
    get() {
      const desc = { configurable: true, writable: true, enumerable, value: void 0 };
      Object.defineProperty(this, key, desc);
      desc.value = make(this);
      Object.defineProperty(this, key, desc);
      return desc.value;
    },
    set(value) {
      Object.defineProperty(this, key, { configurable: true, writable: true, enumerable, value });
    }
  });
}

// node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/core.js
var _a;
var _zodDesc = { value: void 0, enumerable: false };
var _E = "captureStackTrace" in Error ? Error : null;
function newError(Definition) {
  const E = _E;
  if (E) {
    const saved = E.stackTraceLimit;
    if (typeof saved === "number") {
      try {
        E.stackTraceLimit = 0;
      } catch {
        _E = null;
        return new Definition();
      }
      try {
        return new Definition();
      } finally {
        E.stackTraceLimit = saved;
      }
    }
  }
  return new Definition();
}
// @__NO_SIDE_EFFECTS__
function $constructor(name, initializer2, proto, params) {
  const zodProto = {};
  function Internals(def) {
    this.def = def;
    this.constr = _;
    this.traits = /* @__PURE__ */ new Set();
  }
  Internals.prototype = zodProto;
  const protoMembers = proto;
  const initialized = protoMembers && /* @__PURE__ */ new WeakSet();
  function init(inst, def) {
    if (!inst._zod) {
      _zodDesc.value = new Internals(def);
      try {
        Object.defineProperty(inst, "_zod", _zodDesc);
      } finally {
        _zodDesc.value = void 0;
      }
    } else if (inst._zod.traits.has(name)) {
      return;
    }
    inst._zod.traits.add(name);
    initializer2(inst, def);
    if (initialized) {
      const own2 = Object.getPrototypeOf(inst);
      const ctorProto = inst._zod.constr.prototype;
      let up = own2;
      while (up && up !== ctorProto)
        up = Object.getPrototypeOf(up);
      const target = up ?? own2;
      if (!initialized.has(target)) {
        initialized.add(target);
        members(target, protoMembers);
      }
    }
    const proto2 = _.prototype;
    for (const k in proto2) {
      if (!Object.prototype.hasOwnProperty.call(proto2, k))
        continue;
      if (!(k in inst)) {
        inst[k] = proto2[k].bind(inst);
      }
    }
  }
  const Parent = params?.Parent ?? Object;
  class Definition extends Parent {
  }
  Object.defineProperty(Definition, "name", { value: name });
  function _(def) {
    const inst = params?.Parent ? newError(Definition) : this;
    init(inst, def);
    const deferred = inst._zod.deferred;
    if (deferred) {
      for (const fn of deferred) {
        fn();
      }
      inst._zod.deferred = void 0;
    }
    const pp = globalThis.__zod_globalConfig?.postProcessor;
    if (pp)
      pp(inst);
    return inst;
  }
  Object.defineProperty(_, "init", { value: init });
  Object.defineProperty(_, Symbol.hasInstance, {
    value: (inst) => {
      if (params?.Parent && inst instanceof params.Parent)
        return true;
      return inst?._zod?.traits?.has(name);
    }
  });
  Object.defineProperty(_, "name", { value: name });
  return _;
}
var $ZodAsyncError = class extends Error {
  constructor() {
    super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
  }
};
(_a = globalThis).__zod_globalConfig ?? (_a.__zod_globalConfig = {});
var globalConfig = globalThis.__zod_globalConfig;
function config(newConfig) {
  if (newConfig)
    Object.assign(globalConfig, newConfig);
  return globalConfig;
}

// node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/errors.js
function _getMessage() {
  const internals = this._zod;
  internals.message ?? (internals.message = JSON.stringify(internals.def, jsonStringifyReplacer, 2));
  return internals.message;
}
function _setMessage(value) {
  this._zod.message = value;
}
var _messageDesc = {
  get: _getMessage,
  set: _setMessage,
  enumerable: true,
  configurable: true
};
var _issuesDesc = { value: void 0, enumerable: false };
var _installedToString = /* @__PURE__ */ new WeakSet([Object.prototype, Error.prototype]);
var initializer = (inst, def) => {
  inst.name = "$ZodError";
  _issuesDesc.value = def;
  Object.defineProperty(inst, "issues", _issuesDesc);
  _issuesDesc.value = void 0;
  Object.defineProperty(inst, "message", _messageDesc);
  const proto = Object.getPrototypeOf(inst);
  if (!_installedToString.has(proto)) {
    _installedToString.add(proto);
    Object.defineProperty(proto, "toString", {
      configurable: true,
      enumerable: false,
      get() {
        const value = () => this.message;
        Object.defineProperty(this, "toString", { value, configurable: true, writable: true });
        return value;
      },
      set(value) {
        Object.defineProperty(this, "toString", { value, configurable: true, writable: true });
      }
    });
  }
};
var $ZodError = $constructor("$ZodError", initializer);
var $ZodRealError = $constructor("$ZodError", initializer, void 0, {
  Parent: Error
});

// node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/parse.js
var _parse = (_Err) => {
  const fn = (schema, value, _ctx, _params) => {
    const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
    const result = schema._zod.run({ value, issues: [] }, ctx);
    if (result instanceof Promise) {
      throw new $ZodAsyncError();
    }
    if (result.issues.length) {
      const e = new (_params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
      captureStackTrace(e, _params?.callee ?? fn);
      throw e;
    }
    return result.value;
  };
  return fn;
};
var parse = /* @__PURE__ */ _parse($ZodRealError);
var _parseAsync = (_Err) => {
  const fn = async (schema, value, _ctx, params) => {
    const ctx = _ctx ? { ..._ctx, async: true } : { async: true };
    let result = schema._zod.run({ value, issues: [] }, ctx);
    if (result instanceof Promise)
      result = await result;
    if (result.issues.length) {
      const e = new (params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
      captureStackTrace(e, params?.callee ?? fn);
      throw e;
    }
    return result.value;
  };
  return fn;
};
var parseAsync = /* @__PURE__ */ _parseAsync($ZodRealError);
var _safeParse = (_Err) => (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
  const result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise) {
    throw new $ZodAsyncError();
  }
  return result.issues.length ? failure(_Err, result.issues, ctx) : { success: true, data: result.value };
};
var safeParse = /* @__PURE__ */ _safeParse($ZodRealError);
function failure(Err, issues, ctx) {
  let error;
  return {
    success: false,
    get error() {
      if (!error) {
        error = new Err(issues.map((iss) => finalizeIssue(iss, ctx, config())));
        issues = void 0;
        ctx = void 0;
      }
      return error;
    },
    set error(e) {
      error = e;
      issues = void 0;
      ctx = void 0;
    }
  };
}
var _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, async: true } : { async: true };
  let result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise)
    result = await result;
  return result.issues.length ? failure(_Err, result.issues, ctx) : { success: true, data: result.value };
};
var safeParseAsync = /* @__PURE__ */ _safeParseAsync($ZodRealError);

// node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/regexes.js
var anyString = /^[\s\S]{0,}$/;
var number = /^-?\d+(?:\.\d+)?$/;
var boolean = /^(?:true|false)$/i;

// node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/versions.js
var version = {
  major: 4,
  minor: 6,
  patch: 5
};

// node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/schemas.js
var $ZodType = /* @__PURE__ */ $constructor("$ZodType", (inst, def) => {
  var _a2;
  inst ?? (inst = {});
  inst._zod.def = def;
  inst._zod.bag = inst._zod.bag || {};
  inst._zod.version = version;
  const defChecks = inst._zod.def.checks;
  const checks = inst._zod.traits.has("$ZodCheck") ? [inst, ...defChecks ?? []] : defChecks?.length ? [...defChecks] : [];
  for (const ch of checks) {
    for (const fn of ch._zod.onattach) {
      fn(inst);
    }
  }
  if (checks.length === 0) {
    (_a2 = inst._zod).deferred ?? (_a2.deferred = []);
    inst._zod.deferred?.push(() => {
      inst._zod.run = inst._zod.parse;
    });
  } else {
    const runChecks = (payload, checks2, ctx) => {
      if (payload.memo)
        return payload;
      let isAborted = aborted(payload);
      let asyncResult;
      for (const ch of checks2) {
        if (ch._zod.def.when) {
          if (explicitlyAborted(payload))
            continue;
          const shouldRun = ch._zod.def.when(payload);
          if (!shouldRun)
            continue;
        } else if (isAborted) {
          continue;
        }
        const currLen = payload.issues.length;
        const _ = ch._zod.check(payload);
        if (_ instanceof Promise && ctx?.async === false) {
          throw new $ZodAsyncError();
        }
        if (asyncResult || _ instanceof Promise) {
          asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
            await _;
            const nextLen = payload.issues.length;
            if (nextLen === currLen)
              return;
            attachSchema(payload.issues, currLen, inst);
            if (!isAborted)
              isAborted = aborted(payload, currLen);
          });
        } else {
          const nextLen = payload.issues.length;
          if (nextLen === currLen)
            continue;
          attachSchema(payload.issues, currLen, inst);
          if (!isAborted)
            isAborted = aborted(payload, currLen);
        }
      }
      if (asyncResult) {
        return asyncResult.then(() => {
          return payload;
        });
      }
      return payload;
    };
    const handleCanaryResult = (canary, payload, ctx) => {
      if (aborted(canary)) {
        canary.aborted = true;
        return canary;
      }
      const checkResult = runChecks(payload, checks, ctx);
      if (checkResult instanceof Promise) {
        if (ctx.async === false)
          throw new $ZodAsyncError();
        return checkResult.then((checkResult2) => inst._zod.parse(checkResult2, ctx));
      }
      return inst._zod.parse(checkResult, ctx);
    };
    inst._zod.run = (payload, ctx) => {
      if (ctx.skipChecks) {
        return inst._zod.parse(payload, ctx);
      }
      if (ctx.direction === "backward") {
        const canary = inst._zod.parse({ value: payload.value, issues: [] }, { ...ctx, skipChecks: true });
        if (canary instanceof Promise) {
          return canary.then((canary2) => {
            return handleCanaryResult(canary2, payload, ctx);
          });
        }
        return handleCanaryResult(canary, payload, ctx);
      }
      const result = inst._zod.parse(payload, ctx);
      if (result instanceof Promise) {
        if (ctx.async === false)
          throw new $ZodAsyncError();
        return result.then((result2) => runChecks(result2, checks, ctx));
      }
      return runChecks(result, checks, ctx);
    };
  }
}, {
  // Wrappers extend this by installing a richer factory over it; reading it eagerly would defeat the laziness.
  get "~standard"() {
    return hide(this, "~standard", standardProps(this));
  },
  set "~standard"(value) {
    own(this, "~standard", value);
  }
});
var toStandardResult = (r, ctx) => r.issues.length ? { issues: r.issues.map((iss) => finalizeIssue(iss, ctx, config())) } : { value: r.value };
async function validateAsync(inst, value) {
  const ctx = { async: true };
  return toStandardResult(await inst._zod.run({ value, issues: [] }, ctx), ctx);
}
function standardProps(inst) {
  return {
    validate: (value) => {
      const ctx = { async: false };
      try {
        const r = inst._zod.run({ value, issues: [] }, ctx);
        if (!(r instanceof Promise))
          return toStandardResult(r, ctx);
      } catch (_) {
      }
      return validateAsync(inst, value);
    },
    vendor: "zod",
    version: 1
  };
}
var $ZodString = /* @__PURE__ */ $constructor("$ZodString", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = def.pattern ?? anyString;
  inst._zod.parse = (payload, _) => {
    if (def.coerce)
      try {
        payload.value = String(payload.value);
      } catch (_2) {
      }
    if (typeof payload.value === "string")
      return payload;
    payload.issues.push({
      expected: "string",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
var $ZodNumber = /* @__PURE__ */ $constructor("$ZodNumber", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = number;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = Number(payload.value);
      } catch (_) {
      }
    const input = payload.value;
    if (typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)) {
      return payload;
    }
    const received = typeof input === "number" ? Number.isNaN(input) ? "NaN" : !Number.isFinite(input) ? String(input) : void 0 : void 0;
    payload.issues.push({
      expected: "number",
      code: "invalid_type",
      input,
      inst,
      ...received ? { received } : {}
    });
    return payload;
  };
});
var $ZodBoolean = /* @__PURE__ */ $constructor("$ZodBoolean", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = boolean;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = Boolean(payload.value);
      } catch (_) {
      }
    const input = payload.value;
    if (typeof input === "boolean")
      return payload;
    payload.issues.push({
      expected: "boolean",
      code: "invalid_type",
      input,
      inst
    });
    return payload;
  };
});
var $ZodUnknown = /* @__PURE__ */ $constructor("$ZodUnknown", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload) => payload;
});
function handleArrayResult(result, final, index) {
  if (result.issues.length) {
    final.issues.push(...prefixIssues(index, result.issues));
  }
  final.value[index] = result.value;
}
var $ZodArray = /* @__PURE__ */ $constructor("$ZodArray", (inst, def) => {
  $ZodType.init(inst, def);
  const memo = globalConfig.memoizer;
  memo?.attach(inst);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!Array.isArray(input)) {
      payload.issues.push({
        expected: "array",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    payload.value = memo ? memo.alloc(inst, payload, Array(input.length), ctx) : Array(input.length);
    const proms = [];
    const abortEarly = ctx?.abortEarly;
    for (let i = 0; i < input.length; i++) {
      const item = input[i];
      const result = def.element._zod.run({
        value: item,
        issues: []
      }, ctx);
      if (result instanceof Promise) {
        proms.push(result.then((result2) => handleArrayResult(result2, payload, i)));
      } else {
        handleArrayResult(result, payload, i);
        if (abortEarly && result.issues.length !== 0 && aborted(result))
          break;
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }
    return payload;
  };
});
function handlePropertyResult(result, final, key, input, optin, optout) {
  const isPresent = key in input;
  const isOptionalOut = optout === "optional";
  if (!isPresent && isOptionalOut && optin === "optional") {
    return;
  }
  if (result.issues.length) {
    if (optin !== void 0 && isOptionalOut && !isPresent) {
      return;
    }
    final.issues.push(...prefixIssues(key, result.issues));
  }
  if (!isPresent && optin === void 0) {
    if (!result.issues.length) {
      final.issues.push({
        code: "invalid_type",
        expected: "nonoptional",
        input: void 0,
        path: [key]
      });
    }
    return;
  }
  if (result.value === void 0) {
    if (isPresent || optin === "defaulted" && !isOptionalOut) {
      final.value[key] = void 0;
    }
  } else {
    final.value[key] = result.value;
  }
}
var NO_SYMBOL_KEYS = [];
function normalizeDef(def) {
  const keys = Object.keys(def.shape);
  const ownSymbols = Object.getOwnPropertySymbols(def.shape);
  const symbolKeys = ownSymbols.length ? ownSymbols : NO_SYMBOL_KEYS;
  const allKeys = symbolKeys.length ? [...keys, ...symbolKeys] : keys;
  for (const k of allKeys) {
    if (!def.shape?.[k]?._zod?.traits?.has("$ZodType")) {
      throw new Error(`Invalid element at key "${String(k)}": expected a Zod schema`);
    }
  }
  const okeys = optionalKeys(def.shape);
  return {
    ...def,
    allKeys,
    symbolKeys,
    // string-only: handleCatchall matches it against `for...in`, which never yields a symbol
    keySet: new Set(keys),
    numKeys: keys.length,
    optionalKeys: new Set(okeys)
  };
}
function handleCatchall(proms, input, payload, ctx, def, inst, abortEarly) {
  const unrecognized = [];
  const keySet = def.keySet;
  const _catchall = def.catchall._zod;
  const t = _catchall.def.type;
  const optin = _catchall.optin;
  const optout = _catchall.optout;
  let seen = 0;
  for (const key in input) {
    if (abortEarly && payload.issues.length !== seen) {
      if (aborted(payload, seen))
        break;
      seen = payload.issues.length;
    }
    if (keySet.has(key))
      continue;
    if (key === "__proto__") {
      if (t === "never")
        unrecognized.push(key);
      continue;
    }
    if (t === "never") {
      unrecognized.push(key);
      continue;
    }
    const r = _catchall.run({ value: input[key], issues: [] }, ctx);
    if (r instanceof Promise) {
      proms.push(r.then((r2) => handlePropertyResult(r2, payload, key, input, optin, optout)));
    } else {
      handlePropertyResult(r, payload, key, input, optin, optout);
    }
  }
  if (unrecognized.length) {
    payload.issues.push({
      code: "unrecognized_keys",
      keys: unrecognized,
      input,
      inst,
      // Describes the shape of the input, not the validity of the parsed value, so it never aborts. The parse still fails; the schema's own checks just get to run first, and an enclosing intersection can reconcile the key against a sibling operand.
      continue: true
    });
  }
  if (!proms.length)
    return payload;
  return Promise.all(proms).then(() => {
    return payload;
  });
}
var $ZodObject = /* @__PURE__ */ $constructor("$ZodObject", (inst, def) => {
  $ZodType.init(inst, def);
  const desc = Object.getOwnPropertyDescriptor(def, "shape");
  const sh = desc?.get ? desc.get.raw : def.shape ?? {};
  if (sh) {
    const get = () => {
      const newSh = { ...sh };
      Object.defineProperty(def, "shape", { value: newSh });
      get.raw = newSh;
      return newSh;
    };
    get.raw = sh;
    Object.defineProperty(def, "shape", { get });
  }
  const _normalized = cached(() => normalizeDef(def));
  defineLazyInternal(inst, "propValues", (zod) => {
    const shape = zod.def.shape;
    const propValues = {};
    for (const key in shape) {
      const field = shape[key]._zod;
      if (field.values) {
        if (!Object.prototype.hasOwnProperty.call(propValues, key)) {
          assignProp(propValues, key, /* @__PURE__ */ new Set());
        }
        for (const v of field.values)
          propValues[key].add(v);
        if (field.optin !== void 0)
          propValues[key].add(void 0);
      }
    }
    return propValues;
  });
  const isObject2 = isObject;
  const catchall = def.catchall;
  let value;
  const memo = globalConfig.memoizer;
  memo?.attach(inst);
  inst._zod.parse = (payload, ctx) => {
    value ?? (value = _normalized.value);
    const input = payload.value;
    if (!isObject2(input)) {
      payload.issues.push({
        expected: "object",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    payload.value = memo ? memo.alloc(inst, payload, {}, ctx) : {};
    const proms = [];
    const shape = value.shape;
    const abortEarly = ctx?.abortEarly;
    let seen = payload.issues.length;
    for (const key of value.allKeys) {
      if (abortEarly && payload.issues.length !== seen) {
        if (aborted(payload, seen))
          break;
        seen = payload.issues.length;
      }
      if (key === "__proto__")
        continue;
      const el = shape[key];
      const optin = el._zod.optin;
      const optout = el._zod.optout;
      const r = el._zod.run({ value: input[key], issues: [] }, ctx);
      if (r instanceof Promise) {
        proms.push(r.then((r2) => handlePropertyResult(r2, payload, key, input, optin, optout)));
      } else {
        handlePropertyResult(r, payload, key, input, optin, optout);
      }
    }
    if (!catchall) {
      return proms.length ? Promise.all(proms).then(() => payload) : payload;
    }
    return handleCatchall(proms, input, payload, ctx, _normalized.value, inst, abortEarly === true);
  };
});
function handleUnionResults(results, final, inst, ctx) {
  for (const result of results) {
    if (result.issues.length === 0) {
      final.value = result.value;
      return final;
    }
  }
  const nonaborted = results.filter((r) => !aborted(r));
  if (nonaborted.length === 1) {
    final.value = nonaborted[0].value;
    return nonaborted[0];
  }
  final.issues.push({
    code: "invalid_union",
    input: final.value,
    inst,
    errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  });
  return final;
}
var $ZodUnion = /* @__PURE__ */ $constructor("$ZodUnion", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "optin", (zod) => zod.def.options.some((o) => o._zod.optin === "defaulted") ? "defaulted" : zod.def.options.some((o) => o._zod.optin !== void 0) ? "optional" : void 0);
  defineLazyInternal(inst, "optout", (zod) => zod.def.options.some((o) => o._zod.optout === "optional") ? "optional" : void 0);
  defineLazyInternal(inst, "values", (zod) => {
    if (zod.def.options.every((o) => o._zod.values)) {
      return new Set(zod.def.options.flatMap((option) => Array.from(option._zod.values)));
    }
    return void 0;
  });
  defineLazyInternal(inst, "pattern", (zod) => {
    if (zod.def.options.every((o) => o._zod.pattern)) {
      const patterns = zod.def.options.map((o) => o._zod.pattern);
      return new RegExp(`^(${patterns.map((p) => cleanRegex(p.source)).join("|")})$`);
    }
    return void 0;
  });
  const first = def.options.length === 1 ? def.options[0]._zod.run : null;
  inst._zod.parse = (payload, ctx) => {
    if (first) {
      return first(payload, ctx);
    }
    let async = false;
    const results = [];
    for (const option of def.options) {
      const result = option._zod.run({
        value: payload.value,
        issues: []
      }, ctx);
      if (result instanceof Promise) {
        results.push(result);
        async = true;
      } else {
        if (result.issues.length === 0)
          return result;
        results.push(result);
      }
    }
    if (!async)
      return handleUnionResults(results, payload, inst, ctx);
    return Promise.all(results).then((results2) => {
      return handleUnionResults(results2, payload, inst, ctx);
    });
  };
});
var $ZodIntersection = /* @__PURE__ */ $constructor("$ZodIntersection", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    const left = def.left._zod.run({ value: input, issues: [] }, ctx);
    const right = def.right._zod.run({ value: input, issues: [] }, ctx);
    const async = left instanceof Promise || right instanceof Promise;
    if (async) {
      return Promise.all([left, right]).then(([left2, right2]) => {
        return handleIntersectionResults(payload, left2, right2);
      });
    }
    return handleIntersectionResults(payload, left, right);
  };
});
function mergeValues(a, b) {
  if (a === b) {
    return { valid: true, data: a };
  }
  if (a instanceof Date && b instanceof Date && +a === +b) {
    return { valid: true, data: a };
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const bKeys = Object.keys(b);
    const sharedKeys = Object.keys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    if (Object.prototype.hasOwnProperty.call(newObj, "__proto__"))
      delete newObj.__proto__;
    for (const key of sharedKeys) {
      if (key === "__proto__")
        continue;
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return {
          valid: false,
          mergeErrorPath: [key, ...sharedValue.mergeErrorPath]
        };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return { valid: false, mergeErrorPath: [] };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return {
          valid: false,
          mergeErrorPath: [index, ...sharedValue.mergeErrorPath]
        };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  }
  return { valid: false, mergeErrorPath: [] };
}
function handleIntersectionResults(result, left, right) {
  const unrecKeys = /* @__PURE__ */ new Map();
  let unrecIssue;
  const keyIssues = /* @__PURE__ */ new Map();
  const collect = (iss, side) => {
    let keys;
    if (iss.code === "unrecognized_keys" && !iss.path?.length) {
      unrecIssue ?? (unrecIssue = iss);
      keys = iss.keys;
    } else if (iss.code === "invalid_key" && iss.origin === "record" && iss.path?.length === 1) {
      const k = String(iss.path[0]);
      if (!keyIssues.has(k))
        keyIssues.set(k, iss);
      keys = [k];
    } else {
      return false;
    }
    for (const k of keys) {
      if (!unrecKeys.has(k))
        unrecKeys.set(k, {});
      unrecKeys.get(k)[side] = true;
    }
    return true;
  };
  for (const iss of left.issues) {
    if (!collect(iss, "l"))
      result.issues.push(iss);
  }
  for (const iss of right.issues) {
    if (!collect(iss, "r"))
      result.issues.push(iss);
  }
  const bothKeys = [...unrecKeys].filter(([, f]) => f.l && f.r).map(([k]) => k);
  if (bothKeys.length) {
    const aggregated = unrecIssue ? bothKeys.filter((k) => unrecIssue.keys.includes(k)) : [];
    if (aggregated.length)
      result.issues.push({ ...unrecIssue, keys: aggregated });
    for (const k of bothKeys) {
      if (!aggregated.includes(k) && keyIssues.has(k))
        result.issues.push(keyIssues.get(k));
    }
  }
  const merged = mergeValues(left.value, right.value);
  if (!merged.valid) {
    if (aborted(result))
      return result;
    throw new Error(`Unmergable intersection. Error path: ${JSON.stringify(merged.mergeErrorPath)}`);
  }
  result.value = merged.data;
  return result;
}
var $ZodLiteral = /* @__PURE__ */ $constructor("$ZodLiteral", (inst, def) => {
  $ZodType.init(inst, def);
  const values = new Set(def.values);
  inst._zod.values = values;
  defineLazyInternal(inst, "pattern", (zod) => {
    const vals = zod.def.values;
    return new RegExp(vals.length ? `^(${vals.map((o) => typeof o === "string" ? escapeRegex(o) : o ? escapeRegex(o.toString()) : String(o)).join("|")})$` : "^[^\\s\\S]$");
  });
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (values.has(input)) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_value",
      values: def.values,
      input,
      inst
    });
    return payload;
  };
});
function handleOptionalResult(payload, result) {
  payload.value = result.issues.length ? void 0 : result.value;
  return payload;
}
var $ZodOptional = /* @__PURE__ */ $constructor("$ZodOptional", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional");
  inst._zod.optout = "optional";
  defineLazyInternal(inst, "values", (zod) => {
    const values = zod.def.innerType._zod.values;
    return values ? /* @__PURE__ */ new Set([...values, void 0]) : void 0;
  });
  defineLazyInternal(inst, "pattern", (zod) => {
    const pattern = zod.def.innerType._zod.pattern;
    return pattern ? new RegExp(`^(${cleanRegex(pattern.source)})?$`) : void 0;
  });
  inst._zod.parse = (payload, ctx) => {
    if (payload.value === void 0) {
      if (def.innerType._zod.optin !== "defaulted")
        return payload;
      const result = def.innerType._zod.run({ value: payload.value, issues: [] }, ctx);
      if (result instanceof Promise)
        return result.then((result2) => handleOptionalResult(payload, result2));
      return handleOptionalResult(payload, result);
    }
    return def.innerType._zod.run(payload, ctx);
  };
});

// node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/core/api.js
function snapshotChecks(def) {
  if (def.checks)
    def.checks = [...def.checks];
  return def;
}
// @__NO_SIDE_EFFECTS__
function _string(Class, params) {
  return new Class(snapshotChecks({ type: "string", ...normalizeParams(params) }));
}
// @__NO_SIDE_EFFECTS__
function _number(Class, params) {
  return new Class(snapshotChecks({ type: "number", checks: [], ...normalizeParams(params) }));
}
// @__NO_SIDE_EFFECTS__
function _boolean(Class, params) {
  return new Class({
    type: "boolean",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _unknown(Class) {
  return new Class({
    type: "unknown"
  });
}

// node_modules/.pnpm/zod@4.6.5/node_modules/zod/v4/mini/schemas.js
var ZodMiniType = /* @__PURE__ */ $constructor("ZodMiniType", (inst, def) => {
  if (!inst._zod)
    throw new Error("Uninitialized schema in ZodMiniType.");
  $ZodType.init(inst, def);
  inst.def = def;
  inst.type = def.type;
}, {
  // `with` is an alias for `check`: the same function object, not a wrapper.
  get with() {
    return this.check;
  },
  set with(value) {
    own(this, "with", value);
  },
  parse(data, params) {
    return parse(this, data, params, { callee: this.parse });
  },
  parseAsync(data, params) {
    return parseAsync(this, data, params, { callee: this.parseAsync });
  },
  safeParse(data, params) {
    return safeParse(this, data, params);
  },
  safeParseAsync(data, params) {
    return safeParseAsync(this, data, params);
  },
  check(...checks) {
    const def = this.def;
    return this.clone({
      ...def,
      checks: [
        ...def.checks ?? [],
        ...checks.map((ch) => typeof ch === "function" ? { _zod: { check: ch, def: { check: "custom" }, onattach: [] } } : ch)
      ]
    }, { parent: true });
  },
  clone(_def, params) {
    return clone(this, _def, params);
  },
  brand() {
    return this;
  },
  register(reg, meta2) {
    reg.add(this, meta2);
    return this;
  },
  apply(fn, ...args) {
    return args.length === 0 ? fn(this) : fn(this, ...args);
  }
});
var ZodMiniString = /* @__PURE__ */ $constructor("ZodMiniString", (inst, def) => {
  $ZodString.init(inst, def);
  ZodMiniType.init(inst, def);
});
// @__NO_SIDE_EFFECTS__
function string2(params) {
  return _string(ZodMiniString, params);
}
var ZodMiniNumber = /* @__PURE__ */ $constructor("ZodMiniNumber", (inst, def) => {
  $ZodNumber.init(inst, def);
  ZodMiniType.init(inst, def);
});
// @__NO_SIDE_EFFECTS__
function number2(params) {
  return _number(ZodMiniNumber, params);
}
var ZodMiniBoolean = /* @__PURE__ */ $constructor("ZodMiniBoolean", (inst, def) => {
  $ZodBoolean.init(inst, def);
  ZodMiniType.init(inst, def);
});
// @__NO_SIDE_EFFECTS__
function boolean2(params) {
  return _boolean(ZodMiniBoolean, params);
}
var ZodMiniUnknown = /* @__PURE__ */ $constructor("ZodMiniUnknown", (inst, def) => {
  $ZodUnknown.init(inst, def);
  ZodMiniType.init(inst, def);
});
// @__NO_SIDE_EFFECTS__
function unknown() {
  return _unknown(ZodMiniUnknown);
}
var ZodMiniArray = /* @__PURE__ */ $constructor("ZodMiniArray", (inst, def) => {
  $ZodArray.init(inst, def);
  ZodMiniType.init(inst, def);
});
// @__NO_SIDE_EFFECTS__
function array(element, params) {
  return new ZodMiniArray({
    type: "array",
    element,
    ...normalizeParams(params)
  });
}
var ZodMiniObject = /* @__PURE__ */ $constructor("ZodMiniObject", (inst, def) => {
  $ZodObject.init(inst, def);
  ZodMiniType.init(inst, def);
  installLazyProp(inst, "shape", (self) => self._zod.def.shape, false);
});
// @__NO_SIDE_EFFECTS__
function object(shape, params) {
  const def = {
    type: "object",
    shape: shape ?? {},
    ...normalizeParams(params)
  };
  return new ZodMiniObject(def);
}
var ZodMiniUnion = /* @__PURE__ */ $constructor("ZodMiniUnion", (inst, def) => {
  $ZodUnion.init(inst, def);
  ZodMiniType.init(inst, def);
});
// @__NO_SIDE_EFFECTS__
function union(options, params) {
  return new ZodMiniUnion({
    type: "union",
    options,
    ...normalizeParams(params)
  });
}
var ZodMiniIntersection = /* @__PURE__ */ $constructor("ZodMiniIntersection", (inst, def) => {
  $ZodIntersection.init(inst, def);
  ZodMiniType.init(inst, def);
});
// @__NO_SIDE_EFFECTS__
function intersection(left, right) {
  return new ZodMiniIntersection({
    type: "intersection",
    left,
    right
  });
}
var ZodMiniLiteral = /* @__PURE__ */ $constructor("ZodMiniLiteral", (inst, def) => {
  $ZodLiteral.init(inst, def);
  ZodMiniType.init(inst, def);
});
// @__NO_SIDE_EFFECTS__
function literal(value, params) {
  return new ZodMiniLiteral({
    type: "literal",
    values: Array.isArray(value) ? value : [value],
    ...normalizeParams(params)
  });
}
var ZodMiniOptional = /* @__PURE__ */ $constructor("ZodMiniOptional", (inst, def) => {
  $ZodOptional.init(inst, def);
  ZodMiniType.init(inst, def);
});
// @__NO_SIDE_EFFECTS__
function optional(innerType) {
  return new ZodMiniOptional({
    type: "optional",
    innerType
  });
}

// src/api/schemas.ts
var asZodType = (schema) => schema;
var sessionIdSchema = () => asZodType(intersection(string2(), unknown()));
var statusResultSchema = () => asZodType(object({
  codegraph: union([literal("ready"), literal("missing"), literal("error")]),
  message: optional(string2())
}));
var searchRequestSchema = () => asZodType(object({
  query: string2(),
  kinds: array(union([literal("file"), literal("content"), literal("symbol")])),
  limitPerKind: optional(number2())
}));
var legRequestSchema = () => asZodType(object({
  query: string2(),
  limitPerKind: optional(number2())
}));
var fileLegResultSchema = () => asZodType(object({
  hits: array(object({
    path: string2(),
    score: optional(number2())
  })),
  truncated: boolean2(),
  error: optional(string2())
}));
var symbolLegResultSchema = () => asZodType(object({
  hits: array(object({
    path: string2(),
    name: string2(),
    kind: string2(),
    line: optional(number2()),
    score: optional(number2())
  })),
  truncated: boolean2(),
  error: optional(string2())
}));
var contentLegResultSchema = () => asZodType(object({
  hits: array(object({
    path: string2(),
    line: number2(),
    preview: string2()
  })),
  truncated: boolean2(),
  error: optional(string2())
}));
var searchResultSchema = () => asZodType(object({
  files: array(object({
    path: string2(),
    score: optional(number2())
  })),
  symbols: array(object({
    path: string2(),
    name: string2(),
    kind: string2(),
    line: optional(number2()),
    score: optional(number2())
  })),
  content: array(object({
    path: string2(),
    line: number2(),
    preview: string2()
  })),
  truncated: boolean2(),
  errors: optional(object({
    file: optional(string2()),
    symbol: optional(string2()),
    content: optional(string2()),
    codegraph: optional(string2())
  }))
}));
var scopeLookup = {
  name: "workspaceFileScope",
  wire: "workspaceFileScopeId",
  source: "lookup",
  lookup: "workspaceFileScope",
  codec: {
    mode: "strict",
    typeSymbol: "@deepseek-ai/dsh-session/types#SessionId",
    create: sessionIdSchema
  }
};

// src/api/remote.ts
var legRequestParam = {
  name: "request",
  wire: "request",
  source: "json",
  codec: {
    mode: "strict",
    typeSymbol: "@dsh-plugin/cmd-shift-l#RemoteLegRequest",
    create: legRequestSchema
  }
};
var TYPERT_REMOTE = {
  package: "@dsh-plugin/cmd-shift-l",
  descriptors: [
    {
      id: "@dsh-plugin/cmd-shift-l#workspaceCodeSearch/status",
      service: "workspaceCodeSearchController",
      namespace: "workspaceCodeSearch",
      method: "status",
      invocation: { kind: "direct" },
      parameters: [scopeLookup],
      result: {
        mode: "strict",
        typeSymbol: "@dsh-plugin/cmd-shift-l#CodegraphStatus",
        create: statusResultSchema
      }
    },
    {
      id: "@dsh-plugin/cmd-shift-l#workspaceCodeSearch/search",
      service: "workspaceCodeSearchController",
      namespace: "workspaceCodeSearch",
      method: "search",
      invocation: { kind: "direct" },
      parameters: [
        scopeLookup,
        {
          name: "request",
          wire: "request",
          source: "json",
          codec: {
            mode: "strict",
            typeSymbol: "@dsh-plugin/cmd-shift-l#RemoteSearchRequest",
            create: searchRequestSchema
          }
        }
      ],
      cancellation: { parameter: "signal" },
      result: {
        mode: "strict",
        typeSymbol: "@dsh-plugin/cmd-shift-l#SearchResult",
        create: searchResultSchema
      }
    },
    {
      id: "@dsh-plugin/cmd-shift-l#workspaceCodeSearch/searchFiles",
      service: "workspaceCodeSearchController",
      namespace: "workspaceCodeSearch",
      method: "searchFiles",
      invocation: { kind: "direct" },
      parameters: [scopeLookup, legRequestParam],
      cancellation: { parameter: "signal" },
      result: {
        mode: "strict",
        typeSymbol: "@dsh-plugin/cmd-shift-l#FileLegResult",
        create: fileLegResultSchema
      }
    },
    {
      id: "@dsh-plugin/cmd-shift-l#workspaceCodeSearch/searchSymbols",
      service: "workspaceCodeSearchController",
      namespace: "workspaceCodeSearch",
      method: "searchSymbols",
      invocation: { kind: "direct" },
      parameters: [scopeLookup, legRequestParam],
      cancellation: { parameter: "signal" },
      result: {
        mode: "strict",
        typeSymbol: "@dsh-plugin/cmd-shift-l#SymbolLegResult",
        create: symbolLegResultSchema
      }
    },
    {
      id: "@dsh-plugin/cmd-shift-l#workspaceCodeSearch/searchContent",
      service: "workspaceCodeSearchController",
      namespace: "workspaceCodeSearch",
      method: "searchContent",
      invocation: { kind: "direct" },
      parameters: [scopeLookup, legRequestParam],
      cancellation: { parameter: "signal" },
      result: {
        mode: "strict",
        typeSymbol: "@dsh-plugin/cmd-shift-l#ContentLegResult",
        create: contentLegResultSchema
      }
    }
  ]
};
var remote_default = TYPERT_REMOTE;

// src/client/SearchModalHost.tsx
var import_react4 = require("react");

// src/client/DockStripSearchButton.tsx
var import_react2 = require("react");
var import_react_dom2 = require("react-dom");

// src/client/SearchToolbarButton.tsx
var import_react = require("react");
var import_react_dom = require("react-dom");

// src/client/SearchToolbarButton.module.css
var css = ".c22c463a4_button {\n  display: inline-flex;\n  flex: none;\n  align-items: center;\n  justify-content: center;\n  width: 28px;\n  height: 28px;\n  padding: 6px;\n  color: var(--dsw-alias-label-secondary, CanvasText);\n  line-height: 1;\n  background: transparent;\n  border: none;\n  border-radius: var(--dsw-radius-sm, 4px);\n  cursor: pointer;\n  transition: background-color 120ms ease, color 120ms ease;\n}\n\n.c22c463a4_button svg {\n  width: 15px;\n  height: 15px;\n  stroke-width: 1;\n}\n\n.c22c463a4_button:hover {\n  color: var(--dsw-alias-label-primary, CanvasText);\n  background: var(--dsw-alias-interactive-bg-hover, color-mix(in srgb, CanvasText 12%, transparent));\n}\n\n.c22c463a4_button:active {\n  color: var(--dsw-alias-label-primary, CanvasText);\n  background: var(--dsw-alias-interactive-bg-pressed, color-mix(in srgb, CanvasText 18%, transparent));\n}\n\n.c22c463a4_button:focus-visible {\n  outline: 1px solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary, Highlight));\n  outline-offset: 2px;\n}\n\n.c4b459824_tip {\n  position: fixed;\n  z-index: 10000;\n  display: inline-flex;\n  align-items: center;\n  gap: 8px;\n  padding: 4px 8px;\n  color: var(--dsw-alias-label-primary, CanvasText);\n  font: var(--dsw-font-caption, 12px/1.2 system-ui, sans-serif);\n  white-space: nowrap;\n  pointer-events: none;\n  background: var(--dsw-alias-bg-elevated, Canvas);\n  border: 1px solid var(--dsw-alias-border-subtle, color-mix(in srgb, CanvasText 16%, transparent));\n  border-radius: var(--dsw-radius-sm, 4px);\n  box-shadow: 0 4px 16px color-mix(in srgb, CanvasText 12%, transparent);\n  transform: translateX(-50%);\n}\n\n.ca9795b2b_tipLabel {\n  opacity: 0.85;\n}\n\n.cee0b36f4_tipKeys {\n  display: inline-flex;\n  align-items: center;\n  gap: 2px;\n}\n\n.c2c68a437_tipKey {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  min-width: 1.2em;\n  padding: 1px 4px;\n  font: inherit;\n  font-weight: 500;\n  line-height: 1.2;\n  background: var(--dsw-alias-interactive-bg-hover, color-mix(in srgb, CanvasText 8%, transparent));\n  border-radius: 3px;\n}\n\n.c2c7d4c77_tipSep {\n  display: inline-flex;\n  padding: 0 1px;\n  font: inherit;\n  opacity: 0.55;\n  background: transparent;\n}\n";
var tagId = "@dsh-plugin/cmd-shift-l/SearchToolbarButton.module.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
  const tag = document.createElement("style");
  tag.dataset.plugin = "@dsh-plugin/cmd-shift-l";
  tag.dataset.pluginCss = tagId;
  tag.textContent = css;
  document.head.appendChild(tag);
}
var SearchToolbarButton_default = { "button": "c22c463a4_button", "tip": "c4b459824_tip", "tipLabel": "ca9795b2b_tipLabel", "tipKeys": "cee0b36f4_tipKeys", "tipKey": "c2c68a437_tipKey", "tipSep": "c2c7d4c77_tipSep" };

// src/client/SearchToolbarButton.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var TIP_DELAY_MS = 3e3;
function SearchGlyph() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { width: "15", height: "15", viewBox: "0 0 16 16", fill: "none", "aria-hidden": "true", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "path",
      {
        d: "M6.58727 11.8586C9.55061 11.8586 11.9529 9.45637 11.9529 6.49304C11.9529 3.5297 9.55061 1.12744 6.58727 1.12744C3.62394 1.12744 1.22168 3.5297 1.22168 6.49304C1.22168 9.45637 3.62394 11.8586 6.58727 11.8586Z",
        stroke: "currentColor"
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M10.2991 10.3933L14.7783 14.8725", stroke: "currentColor" })
  ] });
}
function webShortcutKeys() {
  const apple = typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/i.test(navigator.platform);
  return apple ? ["\u2318", "\u21E7", "L"] : ["Ctrl", "+", "Shift", "+", "L"];
}
function SearchToolbarButton(props) {
  const buttonRef = (0, import_react.useRef)(null);
  const timerRef = (0, import_react.useRef)(null);
  const [tipPos, setTipPos] = (0, import_react.useState)(null);
  const keys = webShortcutKeys();
  const clearTipTimer = () => {
    if (timerRef.current === null) return;
    clearTimeout(timerRef.current);
    timerRef.current = null;
  };
  const hideTip = () => {
    clearTipTimer();
    setTipPos(null);
  };
  const showTip = () => {
    const el = buttonRef.current;
    if (el === null) return;
    const rect = el.getBoundingClientRect();
    setTipPos({
      left: rect.left + rect.width / 2,
      top: rect.bottom + 8
    });
  };
  (0, import_react.useEffect)(() => () => {
    clearTipTimer();
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "button",
      {
        ref: buttonRef,
        type: "button",
        className: SearchToolbarButton_default.button,
        onClick: (event) => {
          event.stopPropagation();
          hideTip();
          props.onClick();
        },
        onMouseEnter: () => {
          clearTipTimer();
          timerRef.current = setTimeout(() => {
            timerRef.current = null;
            showTip();
          }, TIP_DELAY_MS);
        },
        onMouseLeave: hideTip,
        onBlur: hideTip,
        "aria-label": props.label,
        "data-workspace-code-search-button": true,
        children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SearchGlyph, {})
      }
    ),
    tipPos !== null && (0, import_react_dom.createPortal)(
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "span",
        {
          className: SearchToolbarButton_default.tip,
          role: "tooltip",
          style: { left: tipPos.left, top: tipPos.top },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: SearchToolbarButton_default.tipLabel, children: props.label }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: SearchToolbarButton_default.tipKeys, "aria-hidden": "true", children: keys.map((key, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("kbd", { className: key === "+" ? SearchToolbarButton_default.tipSep : SearchToolbarButton_default.tipKey, children: key }, index)) })
          ]
        }
      ),
      document.body
    )
  ] });
}

// src/client/DockStripSearchButton.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var HOST_ATTR = "data-wcs-dock-search";
function DockStripSearchButton(props) {
  const [host, setHost] = (0, import_react2.useState)(null);
  (0, import_react2.useEffect)(() => {
    let disposed = false;
    let timer;
    const locateFill = () => {
      const chrome = document.querySelector("[data-dockkit-strip-chrome]");
      const strip = chrome?.closest("[data-dockkit-strip]");
      const fill = strip?.querySelector("[data-dockkit-strip-fill]");
      if (strip == null || fill == null) return void 0;
      return { strip, fill };
    };
    const ensureHost = () => {
      const located = locateFill();
      if (located === void 0) return null;
      const { strip, fill } = located;
      let next = strip.querySelector(`[${HOST_ATTR}]`);
      if (next === null) {
        next = document.createElement("div");
        next.setAttribute(HOST_ATTR, "");
        next.style.display = "flex";
        next.style.flex = "none";
        next.style.alignItems = "center";
        strip.insertBefore(next, fill);
      }
      return next;
    };
    const publish = (next) => {
      setHost((prev) => prev === next ? prev : next);
    };
    const pump = (delayMs) => {
      if (disposed) return;
      timer = setTimeout(() => {
        if (disposed) return;
        const next = ensureHost();
        publish(next);
        pump(next === null ? 150 : 5e3);
      }, delayMs);
    };
    publish(null);
    pump(500);
    return () => {
      disposed = true;
      if (timer !== void 0) clearTimeout(timer);
      document.querySelectorAll(`[${HOST_ATTR}]`).forEach((node) => {
        node.remove();
      });
      setHost(null);
    };
  }, []);
  if (host === null) return null;
  return (0, import_react_dom2.createPortal)(
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(SearchToolbarButton, { onClick: props.onClick, label: props.label }),
    host
  );
}

// src/client/SearchModal.tsx
var import_react3 = require("react");

// src/client/file-address.ts
var FILE_ADDRESS_PREFIX = "dsh-resource://file/";
function encodeSegment(segment) {
  return encodeURIComponent(segment).replace(/%3A/gi, ":");
}
function encodePath(path) {
  return path.split("/").map(encodeSegment).join("/");
}
function isAbsoluteWorkspacePath(path) {
  return path.startsWith("/") || /^[A-Za-z]:[/\\]/.test(path) || path.startsWith("\\\\");
}
function sessionFileAddress(sessionId, path) {
  const normalized = path.replace(/\\/g, "/").replace(/^(?:\.\/)+/, "");
  return `${FILE_ADDRESS_PREFIX}session/${encodeSegment(sessionId)}/${encodePath(normalized)}`;
}
function fileAddressFor(sessionId, cwd, path) {
  const normalized = path.replace(/\\/g, "/");
  if (!isAbsoluteWorkspacePath(normalized)) return sessionFileAddress(sessionId, normalized);
  const root = cwd === void 0 ? "" : cwd.replace(/\\/g, "/").replace(/\/+$/, "");
  if (root !== "" && normalized === root) return sessionFileAddress(sessionId, "");
  if (root !== "" && normalized.startsWith(`${root}/`)) {
    return sessionFileAddress(sessionId, normalized.slice(root.length + 1));
  }
  return sessionFileAddress(sessionId, normalized);
}

// src/client/search-controller.ts
var DEFAULT_CLIENT_TIMEOUT_MS = 15e3;
function emptyPartial() {
  return { files: [], symbols: [], content: [], truncated: false };
}
function kindsFromFlags(flags) {
  const kinds = [];
  if (flags.file) kinds.push("file");
  if (flags.symbol) kinds.push("symbol");
  if (flags.content) kinds.push("content");
  return kinds;
}
function shouldSkipSearch(query, kinds) {
  return query.trim().length === 0 || kinds.length === 0;
}
var SearchRequestController = class {
  constructor(remote, scope, config2, onUpdate, onError) {
    this.remote = remote;
    this.scope = scope;
    this.config = config2;
    this.onUpdate = onUpdate;
    this.onError = onError;
  }
  debounceTimer;
  clientTimeoutTimer;
  controller;
  issuedSeq = 0;
  /** Cancel in-flight work and timers. */
  dispose() {
    if (this.debounceTimer !== void 0) clearTimeout(this.debounceTimer);
    this.debounceTimer = void 0;
    this.clearClientTimeout();
    this.controller?.abort();
    this.controller = void 0;
  }
  /**
   * Schedule a search; empty query / empty kinds skip Remote.
   * @param query - raw input
   * @param kinds - enabled partitions
   */
  schedule(query, kinds) {
    if (this.debounceTimer !== void 0) clearTimeout(this.debounceTimer);
    this.debounceTimer = void 0;
    if (shouldSkipSearch(query, kinds)) {
      this.controller?.abort();
      this.controller = void 0;
      this.clearClientTimeout();
      this.onUpdate({
        searching: false,
        result: emptyPartial(),
        legs: { file: "idle", symbol: "idle", content: "idle" }
      });
      this.onError(void 0);
      return;
    }
    const trimmed = query.trim();
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = void 0;
      void this.run(trimmed, kinds);
    }, this.config.debounceMs);
  }
  async run(query, kinds) {
    this.controller?.abort();
    this.clearClientTimeout();
    const controller = new AbortController();
    this.controller = controller;
    const seq = ++this.issuedSeq;
    const kindSet = new Set(kinds);
    const legs = {
      file: kindSet.has("file") ? "running" : "idle",
      symbol: kindSet.has("symbol") ? "running" : "idle",
      content: kindSet.has("content") ? "running" : "idle"
    };
    let files = [];
    let symbols = [];
    let content = [];
    let truncated = false;
    const errors = {};
    const emit = (searching) => {
      if (seq !== this.issuedSeq) return;
      this.onUpdate({
        searching,
        result: {
          files,
          symbols,
          content,
          truncated,
          ...Object.keys(errors).length > 0 ? { errors } : {}
        },
        legs: { ...legs }
      });
    };
    emit(true);
    this.onError(void 0);
    const timeoutMs = this.config.clientTimeoutMs ?? DEFAULT_CLIENT_TIMEOUT_MS;
    this.clientTimeoutTimer = setTimeout(() => {
      this.clientTimeoutTimer = void 0;
      controller.abort();
      if (seq !== this.issuedSeq) return;
      this.onError(`Search timed out after ${String(timeoutMs)}ms`);
      emit(false);
    }, timeoutMs);
    const tasks = [];
    if (kindSet.has("file")) {
      tasks.push((async () => {
        try {
          const result = await this.remote.searchFiles(
            this.scope,
            { query },
            controller.signal
          );
          if (seq !== this.issuedSeq) return;
          files = result.hits;
          if (result.truncated) truncated = true;
          if (result.error !== void 0) errors.file = result.error;
          legs.file = result.error !== void 0 ? "error" : "done";
        } catch (error) {
          if (seq !== this.issuedSeq) return;
          if (controller.signal.aborted) {
            legs.file = "idle";
            return;
          }
          legs.file = "error";
          errors.file = error instanceof Error ? error.message : String(error);
        }
        emit(legs.file === "running" || legs.symbol === "running" || legs.content === "running");
      })());
    }
    if (kindSet.has("symbol")) {
      tasks.push((async () => {
        try {
          const result = await this.remote.searchSymbols(
            this.scope,
            { query },
            controller.signal
          );
          if (seq !== this.issuedSeq) return;
          symbols = result.hits;
          if (result.truncated) truncated = true;
          if (result.error !== void 0) errors.symbol = result.error;
          legs.symbol = result.error !== void 0 ? "error" : "done";
        } catch (error) {
          if (seq !== this.issuedSeq) return;
          if (controller.signal.aborted) {
            legs.symbol = "idle";
            return;
          }
          legs.symbol = "error";
          errors.symbol = error instanceof Error ? error.message : String(error);
        }
        emit(legs.file === "running" || legs.symbol === "running" || legs.content === "running");
      })());
    }
    if (kindSet.has("content")) {
      tasks.push((async () => {
        try {
          const result = await this.remote.searchContent(
            this.scope,
            { query },
            controller.signal
          );
          if (seq !== this.issuedSeq) return;
          content = result.hits;
          if (result.truncated) truncated = true;
          if (result.error !== void 0) {
            errors.content = result.error;
            legs.content = "error";
          } else {
            legs.content = "done";
          }
        } catch (error) {
          if (seq !== this.issuedSeq) return;
          if (controller.signal.aborted) {
            legs.content = "idle";
            return;
          }
          legs.content = "error";
          errors.content = error instanceof Error ? error.message : String(error);
        }
        emit(legs.file === "running" || legs.symbol === "running" || legs.content === "running");
      })());
    }
    try {
      await Promise.all(tasks);
    } finally {
      if (seq === this.issuedSeq) {
        this.clearClientTimeout();
        const still = legs.file === "running" || legs.symbol === "running" || legs.content === "running";
        if (still) {
          if (legs.file === "running") legs.file = "idle";
          if (legs.symbol === "running") legs.symbol = "idle";
          if (legs.content === "running") legs.content = "idle";
          emit(false);
        }
      }
    }
  }
  clearClientTimeout() {
    if (this.clientTimeoutTimer !== void 0) clearTimeout(this.clientTimeoutTimer);
    this.clientTimeoutTimer = void 0;
  }
};

// src/client/store.ts
function flattenHits(result) {
  if (result === void 0) return [];
  const rows = [];
  for (const hit of result.files) {
    rows.push({ kind: "file", path: hit.path, label: hit.path });
  }
  for (const hit of result.symbols) {
    rows.push({
      kind: "symbol",
      path: hit.path,
      ...hit.line === void 0 ? {} : { line: hit.line },
      label: `${hit.name} \xB7 ${hit.path}${hit.line === void 0 ? "" : `:${hit.line}`}`
    });
  }
  for (const hit of result.content) {
    rows.push({
      kind: "content",
      path: hit.path,
      line: hit.line,
      label: `${hit.path}:${hit.line}`,
      preview: hit.preview
    });
  }
  return rows;
}

// src/client/SearchModal.module.css
var css2 = ".cddd688b8_overlay {\n  position: fixed;\n  inset: 0;\n  z-index: 1000;\n  display: flex;\n  align-items: flex-start;\n  justify-content: center;\n  padding-top: 12vh;\n  background: color-mix(in srgb, CanvasText 35%, transparent);\n}\n\n.c1fd82946_dialog {\n  width: min(560px, 92vw);\n  max-height: 70vh;\n  display: flex;\n  flex-direction: column;\n  background: Canvas;\n  color: CanvasText;\n  border: 1px solid color-mix(in srgb, CanvasText 20%, transparent);\n  border-radius: 8px;\n  box-shadow: 0 12px 40px color-mix(in srgb, CanvasText 25%, transparent);\n  overflow: hidden;\n}\n\n.ce071abcd_header {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  padding: 12px 12px 8px;\n}\n\n.c802be7ea_title {\n  margin: 0;\n  font-size: 14px;\n  font-weight: 600;\n  flex: 1;\n}\n\n.cd8401a55_close {\n  border: 0;\n  background: transparent;\n  color: inherit;\n  cursor: pointer;\n  font-size: 18px;\n  line-height: 1;\n  padding: 4px 8px;\n}\n\n.ce7b4a2b4_input {\n  margin: 0 12px 8px;\n  padding: 8px 10px;\n  border: 1px solid color-mix(in srgb, CanvasText 25%, transparent);\n  border-radius: 6px;\n  font: inherit;\n  background: transparent;\n  color: inherit;\n}\n\n.c40a5ab27_toggles {\n  display: flex;\n  gap: 12px;\n  padding: 0 12px 8px;\n  font-size: 12px;\n}\n\n.c40a5ab27_toggles label {\n  display: inline-flex;\n  align-items: center;\n  gap: 4px;\n  cursor: pointer;\n  user-select: none;\n}\n\n.c9164ce08_banner {\n  margin: 0 12px 8px;\n  padding: 6px 8px;\n  font-size: 12px;\n  border-radius: 4px;\n  background: color-mix(in srgb, CanvasText 8%, transparent);\n}\n\n.c42a8eeb9_results {\n  flex: 1;\n  overflow: auto;\n  padding: 0 8px 8px;\n  min-height: 120px;\n}\n\n.c03f447c1_sectionTitle {\n  margin: 8px 4px 4px;\n  font-size: 11px;\n  font-weight: 600;\n  text-transform: uppercase;\n  opacity: 0.7;\n}\n\n.cf7725a7c_hit {\n  display: block;\n  width: 100%;\n  text-align: left;\n  border: 0;\n  background: transparent;\n  color: inherit;\n  font: inherit;\n  padding: 6px 8px;\n  border-radius: 4px;\n  cursor: pointer;\n}\n\n.cc69b1c04_hitSelected {\n  background: color-mix(in srgb, Highlight 35%, transparent);\n}\n\n.cc535ad33_preview {\n  display: block;\n  margin-top: 2px;\n  font-size: 12px;\n  opacity: 0.75;\n  white-space: pre-wrap;\n  word-break: break-all;\n}\n\n.c092af5f0_footer {\n  padding: 8px 12px;\n  font-size: 12px;\n  opacity: 0.8;\n  border-top: 1px solid color-mix(in srgb, CanvasText 12%, transparent);\n}\n\n.c9c1c050a_hint {\n  padding: 24px 12px;\n  text-align: center;\n  opacity: 0.65;\n  font-size: 13px;\n}\n";
var tagId2 = "@dsh-plugin/cmd-shift-l/SearchModal.module.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId2) + "]") === null) {
  const tag = document.createElement("style");
  tag.dataset.plugin = "@dsh-plugin/cmd-shift-l";
  tag.dataset.pluginCss = tagId2;
  tag.textContent = css2;
  document.head.appendChild(tag);
}
var SearchModal_default = { "overlay": "cddd688b8_overlay", "dialog": "c1fd82946_dialog", "header": "ce071abcd_header", "title": "c802be7ea_title", "close": "cd8401a55_close", "input": "ce7b4a2b4_input", "toggles": "c40a5ab27_toggles", "banner": "c9164ce08_banner", "results": "c42a8eeb9_results", "sectionTitle": "c03f447c1_sectionTitle", "hit": "cf7725a7c_hit", "hitSelected": "cc69b1c04_hitSelected", "preview": "cc535ad33_preview", "footer": "c092af5f0_footer", "hint": "c9c1c050a_hint" };

// src/client/SearchModal.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
function SearchModal({
  open,
  onClose,
  scope,
  remote,
  openResource,
  debounceMs,
  copy,
  initialStatus
}) {
  const [query, setQuery] = (0, import_react3.useState)("");
  const [kinds, setKinds] = (0, import_react3.useState)({ file: true, symbol: true, content: true });
  const [ui, setUi] = (0, import_react3.useState)();
  const [error, setError] = (0, import_react3.useState)();
  const [codegraph, setCodegraph] = (0, import_react3.useState)(initialStatus);
  const [selectedIndex, setSelectedIndex] = (0, import_react3.useState)(0);
  const inputRef = (0, import_react3.useRef)(null);
  const controllerRef = (0, import_react3.useRef)(void 0);
  const selectedKeyRef = (0, import_react3.useRef)(void 0);
  const searching = ui?.searching === true;
  const result = ui?.result;
  (0, import_react3.useEffect)(() => {
    if (!open) return;
    setQuery("");
    setUi(void 0);
    setError(void 0);
    setSelectedIndex(0);
    selectedKeyRef.current = void 0;
    setKinds({ file: true, symbol: true, content: true });
    setCodegraph(initialStatus);
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open, initialStatus, scope.sessionId, scope.workspaceRoot]);
  (0, import_react3.useEffect)(() => {
    if (!open) {
      controllerRef.current?.dispose();
      controllerRef.current = void 0;
      return;
    }
    const controller = new SearchRequestController(
      remote,
      scope,
      { debounceMs },
      (next) => {
        setUi(next);
        if (next.result.errors?.codegraph !== void 0) {
          setCodegraph({ codegraph: "error", message: next.result.errors.codegraph });
        }
      },
      (message) => {
        setError(message);
      }
    );
    controllerRef.current = controller;
    return () => {
      controller.dispose();
    };
  }, [open, remote, scope, debounceMs]);
  (0, import_react3.useEffect)(() => {
    if (!open) return;
    controllerRef.current?.schedule(query, kindsFromFlags(kinds));
  }, [open, query, kinds]);
  const rows = (0, import_react3.useMemo)(() => flattenHits(result), [result]);
  (0, import_react3.useEffect)(() => {
    if (rows.length === 0) {
      setSelectedIndex(0);
      selectedKeyRef.current = void 0;
      return;
    }
    const key = selectedKeyRef.current;
    if (key !== void 0) {
      const found = rows.findIndex((row) => rowKey(row) === key);
      if (found >= 0) {
        setSelectedIndex(found);
        return;
      }
    }
    setSelectedIndex((i) => Math.min(i, rows.length - 1));
  }, [rows]);
  (0, import_react3.useEffect)(() => {
    const row = rows[selectedIndex];
    selectedKeyRef.current = row === void 0 ? void 0 : rowKey(row);
  }, [rows, selectedIndex]);
  const openHit = (index) => {
    const hit = rows[index];
    if (hit === void 0) return;
    const address = fileAddressFor(scope.sessionId, scope.workspaceRoot, hit.path);
    openResource(address, hit.line === void 0 ? void 0 : { params: { line: hit.line } });
    onClose();
  };
  const onKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, Math.max(rows.length - 1, 0)));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      openHit(selectedIndex);
    }
  };
  if (!open) return null;
  const enabledKinds = kindsFromFlags(kinds);
  const banner = codegraphBanner(codegraph, copy);
  const showEmptyHint = !searching && query.trim().length === 0;
  const showKindsHint = enabledKinds.length === 0;
  const allLegsSettled = enabledKinds.every((kind) => {
    const status = ui?.legs[kind];
    return status === "done" || status === "error";
  });
  const showNoResults = allLegsSettled && query.trim().length > 0 && enabledKinds.length > 0 && rows.length === 0 && error === void 0;
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: SearchModal_default.overlay, role: "presentation", onMouseDown: (e) => {
    if (e.target === e.currentTarget) onClose();
  }, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
    "div",
    {
      className: SearchModal_default.dialog,
      role: "dialog",
      "aria-modal": "true",
      "aria-label": copy.title,
      onKeyDown,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: SearchModal_default.header, children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h2", { className: SearchModal_default.title, children: copy.title }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: SearchModal_default.close, "aria-label": "Close", onClick: onClose, children: "\xD7" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "input",
          {
            ref: inputRef,
            className: SearchModal_default.input,
            role: "textbox",
            value: query,
            placeholder: copy.placeholder,
            onChange: (e) => {
              setQuery(e.target.value);
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: SearchModal_default.toggles, children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            Toggle,
            {
              label: copy.kindFile,
              checked: kinds.file,
              onChange: (v) => {
                setKinds((k) => ({ ...k, file: v }));
              }
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            Toggle,
            {
              label: copy.kindSymbol,
              checked: kinds.symbol,
              onChange: (v) => {
                setKinds((k) => ({ ...k, symbol: v }));
              }
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            Toggle,
            {
              label: copy.kindContent,
              checked: kinds.content,
              onChange: (v) => {
                setKinds((k) => ({ ...k, content: v }));
              }
            }
          )
        ] }),
        banner !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: SearchModal_default.banner, role: "status", children: banner }),
        error !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: SearchModal_default.banner, role: "alert", children: error }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: SearchModal_default.results, children: [
          showEmptyHint && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: SearchModal_default.hint, children: copy.placeholder }),
          showKindsHint && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: SearchModal_default.hint, children: copy.openKindsHint }),
          showNoResults && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: SearchModal_default.hint, children: copy.noResults }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            ResultSections,
            {
              result,
              legs: ui?.legs,
              rows,
              selectedIndex,
              openHit,
              copy
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: SearchModal_default.footer, children: footerText(ui, copy) })
      ]
    }
  ) });
}
function rowKey(row) {
  return `${row.kind}:${row.path}:${String(row.line ?? "")}`;
}
function legMark(status, copy) {
  if (status === "running") return copy.legRunning;
  if (status === "done" || status === "error") return copy.legDone;
  return "";
}
function footerText(ui, copy) {
  if (ui === void 0) return null;
  if (ui.searching) {
    const parts = [
      `${copy.kindFile} ${legMark(ui.legs.file, copy)}`.trim(),
      `${copy.kindSymbol} ${legMark(ui.legs.symbol, copy)}`.trim(),
      `${copy.kindContent} ${legMark(ui.legs.content, copy)}`.trim()
    ];
    let text = `${copy.searchingLegs} \xB7 ${parts.join(" \xB7 ")}`;
    const progress = ui.contentProgress;
    if (progress !== void 0 && ui.legs.content === "running") {
      text += ` \xB7 ${copy.matchedCount.replace("{n}", String(progress.matched))}`;
      if (progress.etaSec !== void 0) {
        text += ` \xB7 ${copy.aboutEta.replace("{s}", String(progress.etaSec))}`;
      }
      if (progress.pathHint !== void 0) {
        const hint = progress.pathHint.length > 40 ? `\u2026${progress.pathHint.slice(-39)}` : progress.pathHint;
        text += ` \xB7 ${hint}`;
      }
    }
    return text;
  }
  return ui.result.truncated === true ? copy.truncated : null;
}
function Toggle(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      "input",
      {
        type: "checkbox",
        checked: props.checked,
        onChange: (e) => {
          props.onChange(e.target.checked);
        }
      }
    ),
    props.label
  ] });
}
function codegraphBanner(status, copy) {
  if (status === void 0 || status.codegraph === "ready") return void 0;
  if (status.codegraph === "missing") return copy.codegraphMissing;
  return status.message ?? copy.codegraphError;
}
function ResultSections(props) {
  const { result, legs, rows, selectedIndex, openHit, copy } = props;
  if (result === void 0) return null;
  const sections = [
    {
      title: copy.kindFile,
      kind: "file",
      ...result.errors?.file === void 0 ? {} : { error: result.errors.file },
      ...legs?.file === "running" ? { running: true } : {}
    },
    {
      title: copy.kindSymbol,
      kind: "symbol",
      ...result.errors?.symbol === void 0 ? {} : { error: result.errors.symbol },
      ...legs?.symbol === "running" ? { running: true } : {}
    },
    {
      title: copy.kindContent,
      kind: "content",
      ...result.errors?.content === void 0 ? {} : { error: result.errors.content },
      ...legs?.content === "running" ? { running: true } : {}
    }
  ];
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_jsx_runtime3.Fragment, { children: sections.map((section) => {
    const indices = rows.map((row, index) => row.kind === section.kind ? index : -1).filter((index) => index >= 0);
    if (indices.length === 0 && section.error === void 0 && section.running !== true) {
      return null;
    }
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: SearchModal_default.sectionTitle, children: [
        section.title,
        section.running === true ? ` ${copy.legRunning}` : ""
      ] }),
      section.error !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: SearchModal_default.banner, role: "status", children: section.error }),
      indices.map((index) => {
        const row = rows[index];
        const selected = index === selectedIndex;
        return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
          "button",
          {
            type: "button",
            className: selected ? `${SearchModal_default.hit} ${SearchModal_default.hitSelected}` : SearchModal_default.hit,
            onClick: () => {
              openHit(index);
            },
            children: [
              row.label,
              row.preview !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: SearchModal_default.preview, children: row.preview })
            ]
          },
          `${section.kind}-${index}-${row.label}`
        );
      })
    ] }, section.kind);
  }) });
}

// src/client/SearchModalHost.tsx
var import_jsx_runtime4 = require("react/jsx-runtime");
function SearchModalHost(props) {
  const { modal, remote, openResource, openSearch, debounceMs, copy } = props;
  const [snap, setSnap] = (0, import_react4.useState)(() => modal.getSnapshot());
  const [status, setStatus] = (0, import_react4.useState)();
  (0, import_react4.useEffect)(() => modal.subscribe(() => {
    setSnap(modal.getSnapshot());
  }), [modal]);
  (0, import_react4.useEffect)(() => {
    if (!snap.open || snap.scope === void 0) {
      setStatus(void 0);
      return;
    }
    let cancelled = false;
    void remote.status(snap.scope).then((next) => {
      if (!cancelled) setStatus(next);
    }).catch(() => {
      if (!cancelled) setStatus({ codegraph: "error" });
    });
    return () => {
      cancelled = true;
    };
  }, [snap.open, snap.generation, snap.scope, remote]);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(DockStripSearchButton, { onClick: openSearch, label: copy.shortcutLabel }),
    snap.open && snap.scope !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      SearchModal,
      {
        open: snap.open,
        onClose: () => {
          modal.close();
        },
        scope: snap.scope,
        remote,
        openResource,
        debounceMs,
        copy,
        ...status === void 0 ? {} : { initialStatus: status }
      }
    )
  ] });
}

// src/client/client-config.ts
var CLIENT_CONFIG_DEFAULTS = {
  debounceMs: 250
};
function resolveDebounceMs(config2 = {}) {
  const value = config2.debounceMs;
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) return value;
  return CLIENT_CONFIG_DEFAULTS.debounceMs;
}

// src/client/locales.ts
var zh = {
  title: "\u5DE5\u4F5C\u533A\u641C\u7D22",
  placeholder: "\u8F93\u5165\u4EE5\u641C\u7D22",
  kindFile: "\u6587\u4EF6",
  kindSymbol: "\u7B26\u53F7",
  kindContent: "\u5185\u5BB9",
  searching: "\u641C\u7D22\u4E2D\u2026",
  searchingLegs: "\u641C\u7D22\u4E2D",
  legRunning: "\u2026",
  legDone: "\u2713",
  matchedCount: "\u5339\u914D {n}",
  aboutEta: "\u7EA6 {s}s",
  noResults: "\u65E0\u7ED3\u679C",
  truncated: "\u7ED3\u679C\u5DF2\u622A\u65AD",
  codegraphMissing: "\u672A\u627E\u5230 codegraph \u7D22\u5F15\u3002\u5728\u5DE5\u4F5C\u533A\u8FD0\u884C codegraph init \u540E\u53EF\u641C\u6587\u4EF6\u4E0E\u7B26\u53F7\uFF1B\u5185\u5BB9\u641C\u7D22\u4ECD\u53EF\u7528\u3002",
  codegraphError: "codegraph \u7D22\u5F15\u4E0D\u53EF\u7528",
  codegraphStaleHint: "\u7D22\u5F15\u53EF\u80FD\u8FC7\u671F\uFF0C\u53EF\u91CD\u5EFA\u3002",
  openKindsHint: "\u8BF7\u81F3\u5C11\u6253\u5F00\u4E00\u7C7B\u641C\u7D22\u5F00\u5173",
  shortcutLabel: "\u5DE5\u4F5C\u533A\u641C\u7D22",
  shortcutNoSession: "\u65E0\u6D3B\u52A8\u4F1A\u8BDD\u65F6\u65E0\u6CD5\u641C\u7D22"
};
var en = {
  title: "Workspace search",
  placeholder: "Type to search",
  kindFile: "Files",
  kindSymbol: "Symbols",
  kindContent: "Content",
  searching: "Searching\u2026",
  searchingLegs: "Searching",
  legRunning: "\u2026",
  legDone: "\u2713",
  matchedCount: "matched {n}",
  aboutEta: "~{s}s",
  noResults: "No results",
  truncated: "Results truncated",
  codegraphMissing: "No codegraph index. Run codegraph init in the workspace for files/symbols; content search still works.",
  codegraphError: "codegraph index unavailable",
  codegraphStaleHint: "Index may be stale; rebuild if needed.",
  openKindsHint: "Enable at least one search kind",
  shortcutLabel: "Workspace search",
  shortcutNoSession: "No active session"
};

// src/client/modal-controller.ts
function createModalController() {
  let open = false;
  let scope;
  let generation = 0;
  const listeners = /* @__PURE__ */ new Set();
  const emit = () => {
    for (const listener of listeners) listener();
  };
  return {
    getSnapshot: () => ({ open, scope, generation }),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    open(next) {
      open = true;
      scope = next;
      generation += 1;
      emit();
    },
    close() {
      if (!open) return;
      open = false;
      emit();
    }
  };
}

// src/client/index.ts
var NS = "workspaceCodeSearch";
var inject = ["locale", "shortcuts", "slots", "sidebarRight", "remote", "sessions"];
async function apply(ctx, config2 = {}) {
  const debounceMs = resolveDebounceMs(config2);
  const face = ctx;
  const disposeRemote = await face.remote.$mount(remote_default);
  const ui = ctx.inject(
    ["locale", "shortcuts", "slots", "sidebarRight", "remote.workspaceCodeSearch", "sessions"],
    (scoped) => {
      registerUi(scoped, debounceMs);
    }
  );
  try {
    await ui;
  } catch (error) {
    await ui.dispose();
    await disposeRemote();
    throw error;
  }
  return async () => {
    await ui.dispose();
    await disposeRemote();
  };
}
function registerUi(face, debounceMs) {
  const { locale, shortcuts, slots, sidebarRight, sessions, remote } = face;
  const searchRemote = adaptRemote(remote.workspaceCodeSearch);
  face.effect(() => locale.register(NS, { zh, en }), "workspace-code-search: dictionaries");
  const t = locale.bind(NS);
  const modal = createModalController();
  const resolveScope = (target) => {
    const list = sessions.list.getSnapshot();
    const main = Object.values(list.byId).find((row) => (row.retainedBy.mainView ?? 0) > 0);
    if (main !== void 0) {
      const cwd = main.cwd?.trim();
      if (cwd !== void 0 && cwd.length > 0) {
        return { sessionId: main.id, workspaceRoot: cwd };
      }
    }
    const cmd = sidebarRight.commandTarget?.(target);
    if (cmd?.sessionId !== void 0 && cmd.sessionId !== "") {
      const row = list.byId[cmd.sessionId];
      const cwd = row?.cwd?.trim();
      if (cwd !== void 0 && cwd.length > 0) {
        return { sessionId: cmd.sessionId, workspaceRoot: cwd };
      }
    }
    return void 0;
  };
  face.effect(() => shortcuts.register({
    id: "workspace.codeSearch",
    label: () => t("shortcutLabel"),
    aliases: ["workspace search", "code search"],
    defaults: {
      // Desktop: VS Code–like find-in-files (session.fork uses primary+alt+F there).
      // Web: primary+shift+L — checked against dsh defaults + Chrome docs.
      //   Free in Chrome; conflicts: Safari sidebar, Bitwarden autofill (extension).
      //   Rejected earlier: Shift+F (session.fork), Alt+F (Chrome “Search the web”),
      //   Shift+H (Chrome homepage / macOS Finder Home).
      //   web:linux omitted — isWebBindingAllowed rejects primary+shift+KeyL there.
      "desktop:macos": { code: "KeyF", modifiers: ["primary", "shift"] },
      "desktop:windows": { code: "KeyF", modifiers: ["primary", "shift"] },
      "desktop:linux": { code: "KeyF", modifiers: ["primary", "shift"] },
      "web:macos": { code: "KeyL", modifiers: ["primary", "shift"] },
      "web:windows": { code: "KeyL", modifiers: ["primary", "shift"] }
    },
    regions: ["page", "editable", "terminal"],
    modals: [],
    resolve: ({ target }) => {
      const session = resolveScope(target);
      if (session === void 0) {
        return { status: "blocked", reason: t("shortcutNoSession") };
      }
      return {
        status: "handled",
        run: () => {
          modal.open(session);
        }
      };
    }
  }), "workspace-code-search: shortcut");
  const openSearch = () => {
    const session = resolveScope(null);
    if (session === void 0) return;
    modal.open(session);
  };
  slots.inject("shell.overlay", () => slots.register({
    name: "shell.overlay",
    id: "workspace-code-search",
    locale: NS,
    inject: () => ({
      modal,
      remote: searchRemote,
      openSearch,
      openResource: (address, options) => {
        sidebarRight.openResource(address, options);
      },
      debounceMs,
      copy: {
        title: t("title"),
        placeholder: t("placeholder"),
        kindFile: t("kindFile"),
        kindSymbol: t("kindSymbol"),
        kindContent: t("kindContent"),
        searching: t("searching"),
        searchingLegs: t("searchingLegs"),
        legRunning: t("legRunning"),
        legDone: t("legDone"),
        matchedCount: t("matchedCount"),
        aboutEta: t("aboutEta"),
        noResults: t("noResults"),
        truncated: t("truncated"),
        codegraphMissing: t("codegraphMissing"),
        codegraphError: t("codegraphError"),
        codegraphStaleHint: t("codegraphStaleHint"),
        openKindsHint: t("openKindsHint"),
        shortcutLabel: t("shortcutLabel"),
        shortcutNoSession: t("shortcutNoSession")
      }
    })
  }, SearchModalHost));
  face.effect(() => {
    const mounted = sidebarRight.mounted;
    if (mounted?.subscribe === void 0) return () => {
    };
    let last = mounted.getSnapshot();
    return mounted.subscribe(() => {
      const next = mounted.getSnapshot();
      if (next !== last) {
        last = next;
        modal.close();
      }
    });
  }, "workspace-code-search: close on sidebar session change");
  face.effect(() => {
    const list = sessions.list;
    let lastId;
    let lastCwd;
    const main = Object.values(list.getSnapshot().byId).find((row) => (row.retainedBy.mainView ?? 0) > 0);
    lastId = main?.id;
    lastCwd = main?.cwd;
    return list.subscribe(() => {
      const next = Object.values(list.getSnapshot().byId).find((row) => (row.retainedBy.mainView ?? 0) > 0);
      const nextId = next?.id;
      const nextCwd = next?.cwd;
      if (nextId !== lastId || nextCwd !== lastCwd) {
        lastId = nextId;
        lastCwd = nextCwd;
        modal.close();
      }
    });
  }, "workspace-code-search: close on session/cwd change");
}
function adaptRemote(ns) {
  return {
    async status(scope) {
      const result = await ns.status(scope.sessionId);
      if (!result.ok) throw result.error;
      return result.value;
    },
    async search(scope, request, signal) {
      const result = await ns.search(scope.sessionId, request, signal);
      if (!result.ok) throw result.error;
      return result.value;
    },
    async searchFiles(scope, request, signal) {
      const result = await ns.searchFiles(scope.sessionId, request, signal);
      if (!result.ok) throw result.error;
      return result.value;
    },
    async searchSymbols(scope, request, signal) {
      const result = await ns.searchSymbols(scope.sessionId, request, signal);
      if (!result.ok) throw result.error;
      return result.value;
    },
    async searchContent(scope, request, signal) {
      const result = await ns.searchContent(scope.sessionId, request, signal);
      if (!result.ok) throw result.error;
      return result.value;
    }
  };
}
return module.exports; } });
//# sourceMappingURL=client.js.map
