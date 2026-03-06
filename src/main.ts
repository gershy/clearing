type ClsCheck = {
  (i: unknown, num:    BooleanConstructor):  i is boolean,
  (i: unknown, num:    NumberConstructor):   i is number,
  (i: unknown, str:    StringConstructor):   i is string,
  (i: unknown, buff:   BufferConstructor):   i is Buffer,
  (i: unknown, arr:    ArrayConstructor):    i is any[],
  (i: unknown, obj:    ObjectConstructor):   i is Obj<unknown>,
  (i: unknown, fn:     FunctionConstructor): i is Fn,
  (i: unknown, fn:     SymbolConstructor):   i is symbol,
  <T>(i: unknown, prm: PromiseConstructor):  i is Promise<T>,
  <C extends abstract new (...args: any) => any>(i: unknown, cls: C): i is InstanceType<C>
};

export const getClsName = i => {
  if (i === null)      return 'Null';
  if (i === undefined) return 'Undef';
  if (i !== i)         return 'Nan';
  return Object.getPrototypeOf(i)?.constructor.name ?? 'Prototypeless';
};
export const getCls = i => Object.getPrototypeOf(i)?.constructor ?? null;
export const isCls: ClsCheck = (i, C): i is any => {
  
  // NaN only matches against the NaN primitive (not the Number Form)
  if (i !== i)   return C !== C;
  
  // `null` and `undefined` only match to themselves
  if (i == null) return i === C;
  
  // Otherwise strictly check the constructor
  return Object.getPrototypeOf(i).constructor === C;
  
};
export const inCls: ClsCheck = (i, C): i is any => i instanceof C;
export const skip = undefined;

type Then = {
  <V, R0 = V, R1 = never>(val: Promise<V>, rsv?: (v: V) => R0, rjc?: (e: any) => R1): Promise<R0 | R1>,
  <V, R0 = V, R1 = never>(val: V,          rsv?: (v: V) => R0, rjc?: (e: any) => R1): R0 | R1;
};
export const then: Then = <V, R0 = V, R1 = never>(
  val: Promise<V> | V,
  rsv: (v: V) => R0 = (v => v as any),
  rjc: (e: any) => R1 = ((e): any => { throw e; })
): Promise<R0 | R1> | R0 | R1 => {
  
  // Act on `val` regardless of whether it's a Promise or immediate value; return `rsv(val)`
  // either immediately or as a Promise
  
  if (inCls(val, Promise)) return val.then(rsv).catch(rjc);
  
  try        { return rsv(val); }
  catch(err) { return rjc(err); }
  
};

type Safe = {
  <V, R0 = never>(fn: () => Promise<V>, rjc?: (e: any) => R0): Promise<V | R0>,
  <V, R0 = never>(fn: () =>          V, rjc?: (e: any) => R0): Promise<V | R0>
};
export const safe: Safe = <V, R0 = never>(
  fn:  () => Promise<V> | V,
  rjc: ((e: any) => R0) = e => { throw e; }
): Promise<V | R0> | V | R0 => {
  
  // Execute a function which returns a value either synchronously or asynchronously; in both cases
  // allows errors occurring from function execution to be handled
  
  try        { return then(fn(), v => v, rjc); }
  catch(err) { return rjc(err); }
  
};

const applyClearing = (() => {

  const global: any = globalThis;

  // Prevent multiple installations...
  const pfx = '@gershy/clearing';
  const memSym = Symbol.for(`${pfx}:mem`);
  if (global[memSym]) return;
  global[memSym] = true;

  const symNames = [
    // <SYMBOLS> :: definitions :: /[']([a-zA-Z0-9]+)[']/
    'add',
    'allArr',
    'allObj',
    'at',
    'assert',
    'base32',
    'base36',
    'base62',
    'base64Std',
    'base64Url',
    'baseline',
    'bind',
    'bits',
    'char',
    'charset',
    'code',
    'count',
    'cut',
    'dive',
    'empty',
    'find',
    'fire',
    'group',
    'has',
    'hasHead',
    'hasTail',
    'indent',
    'int32',
    'int64',
    'isInt',
    'later',
    'limn',
    'lower',
    'map',
    'mapk',
    'merge',
    'mod',
    'padHead',
    'padTail',
    'rem',
    'slash',
    'slice',
    'suppress',
    'toArr',
    'toNum',
    'toObj',
    'toStr',
    'upper'
    // </SYMBOLS>
  ] as const;
  const syms = Object.fromEntries(symNames.map(term => [ term, Symbol(`${pfx}:${term}`) ]));
  
  Object.assign(global, { ...syms });
  
  const protoDefs = (Cls: any, def: any) => {
    
    let protoVals: [ symbol, any ][] = [];
    let classVals: [ symbol, any ][] = [];
    for (const key of Reflect.ownKeys(def)) {
      if (key !== '$' && !isCls(key, Symbol)) throw Object.assign(Error('invalid proto key'), { Cls, keyClsName: getClsName(key), key });
      
      if (key !== '$') {
        protoVals.push([ key, def[key] ]);
      } else {
        for (const k of Reflect.ownKeys(def[key])) {
          if (!isCls(k, Symbol)) throw Object.assign(Error('invalid class key'), { Cls, keyClsName: getClsName(k), key: k });
          classVals.push([ k, def[key][k] ]);
        }
      }
    }
    
    // Assign class properties
    for (const [ target, props ] of [ [ Cls, classVals ], [ Cls.prototype, protoVals ] ] as const)
      for (const [ sym, value ] of props)
        Object.defineProperty(target, sym, { enumerable: false, value });
    
  };
  protoDefs(Object, {
    
    [at](this: Obj, cmps: string | string[], def=skip) {
      let ptr = this;
      if (!isCls(cmps, Array)) cmps = [ cmps ];
      for (const c of cmps) {
        if (ptr[has](c)) ptr = ptr[c];
        else             return def;
      }
      return ptr;
    },
    [count](this: Obj) { let c = 0; for (const k in this) c++; return c; },
    [empty](this: Obj) { for (const k in this) return false; return true; },
    [group](this: Obj, fn: (v: any, key: string) => string) { // Iterator: (val, key) => '<groupTerm>'
      
      //  { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9, j: 10 }.group(n => {
      //    if (n < 4) return 'small';
      //    if (n < 8) return 'medium';
      //    return 'big';
      //  });
      //  >> { small: { a: 1, b: 2, c: 3 }, medium: { d: 4, e: 5, f: 6, g: 7 }, big: { h: 8, i: 9, j: 10 } }
      
      const ret = {};
      for (const [ k, v ] of this) {
        const g = fn(v, k);
        if (g === skip) continue;
        if (!ret[has](g)) ret[g] = {};
        ret[g][k] = v;
      }
      return ret;
      
    },
    [has]: Object.prototype.hasOwnProperty,
    [map](this: Obj, fn) { // Iterator: (val, key) => val
      const ret = Object.assign({}, this);
      for (const k in ret) { const v = fn(ret[k], k); if (v !== skip) ret[k] = v; else delete ret[k]; }
      return ret;
    },
    [mapk](this: Obj, fn) { // Iterator: (val, k) => [ k, v ]
      const arr: any[] = [];
      for (const k in this) { const r = fn(this[k], k); if (r !== skip) arr.push(r); }
      return Object.fromEntries(arr);
    },
    [merge](this: Obj, o) { // Modifies `this` in-place
      for (const [ k, v ] of o) {
        // `skip` can be passed to remove properties
        if (v === skip) { delete this[k]; continue; }
        
        // Incoming non-Object properties are simple
        if (!isCls(v, Object)) { this[k] = v; continue; }
        
        // `v` is an Object; existing non-Object replaced with `{}`
        if (!this[has](k) || !isCls(this[k], Object)) this[k] = {};
        
        // And simply recurse!
        this[k][merge](v);
      }
      return this;
    },
    [slash](this: Obj, p) {
      
      const obj = { ...this };
      for (const k of p) delete obj[k];
      return obj;
      
    },
    [slice](this: Obj, p: string[]) {
      
      // >> { a: 1, b: 2, c: 3, d: 4 }.slice([ 'b', 'd' ]);
      // { b: 2, d: 4 }
      return p[toObj](p => this[has](p) ? [ p, this[p] ] : skip);
      
    },
    [toArr](this: Obj, fn) { // Iterator: (val, k) => [ k, v ]
      const ret: any[] = [];
      for (const k in this) { const r = fn(this[k], k); if (r !== skip) ret.push(r); }
      return ret;
    },
    
    * [Symbol.iterator](this: Obj) { for (const k in this) yield [ k, this[k] ]; }
    
  });
  protoDefs(Array, {
    
    [add](...args) { this.push(...args); return args[0]; },
    [count]() { return this.length; },
    [empty]() { return !this.length; },
    [find](f) { // Iterator: (val, ind) => bool; returns { found=false, val=null, ind=null }
      const n = this.length;
      for (let i = 0; i < n; i++) if (f(this[i], i)) return { found: true, val: this[i], ind: i };
      return { found: false, val: null, ind: null };
    },
    [group](fn) { // Iterator: val => '<categoryTerm>'
      
      //  [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ].group(n => {
      //    if (n < 4) return 'small';
      //    if (n < 8) return 'medium';
      //    return 'big';
      //  });
      //  >> { small: [ 1, 2, 3 ], medium: [ 4, 5, 6, 7 ], big: [ 8, 9, 10 ] }
      
      const ret = {};
      for (const elem of this) {
        const g = fn(elem);
        if (g === skip) continue;
        if (!ret[has](g)) ret[g] = [];
        ret[g].push(elem);
      }
      return ret;
      
    },
    [has]: Array.prototype.includes,
    [map](this: any[], it) { // Iterator: (val, ind) => val
      const ret: any[] = [];
      const len = this.length;
      for (let i = 0; i < len; i++) { const r = it(this[i], i); if (r !== skip) ret.push(r); }
      return ret;
    },
    [rem](val) { const ind = this.indexOf(val); if (ind > -1) this.splice(ind, 1); },
    [toObj](this: any[], it) { // Iterator: (val, ind) => [ key0, val0 ]
      const ret: any[] = [];
      const len = this.length;
      for (let i = 0; i < len; i++) { const r = it(this[i], i); if (r !== skip) ret.push(r); }
      return Object.fromEntries(ret);
    }
    
  });
  protoDefs(String, {
    
    $: {
      
      [baseline]: (str, seq='| ') => {
        
        return str.split('\n')[map](ln => {
          const ind = ln.indexOf(seq);
          if (ind === -1) return skip;
          return ln.slice(ind + seq.length);
        }).join('\n');
        
      },
      [base32]:    '0123456789abcdefghijklmnopqrstuv',
      [base36]:    '0123456789abcdefghijklmnopqrstuvwxyz',
      [base62]:    '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
      [base64Url]:    '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_',
      [base64Std]: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/',
      [charset]: str => {
        const cache = new Map<string, bigint>();
        return {
          str,
          size: BigInt(str.length),
          charVal: (c: string) => {
            if (!cache.has(c)) {
              const ind = str.indexOf(c);
              if (ind < 0) throw Error('char outside charset')[mod]({ char: c });
              cache.set(c, BigInt(ind));
            }
            return cache.get(c);
          },
          valChar: (n: bigint) => {
            if (n < 0 || n >= str.length) throw Error('val outside charset');
            return str[n as any as number];
          }
        };
      },
        
    },
    
    [code](ind=0) { return this.charCodeAt(ind); },
    [count]() { return this.length; },
    [cut](delim, cuts=1) { // e.g. `cuts === 1` produces Array of length 2
      // `cuts` defines # of cuts (resulting array length is `num + 1`)
      const split = this.split(delim, cuts < Infinity ? cuts : skip);
      const numDelimsSplit = split.length - 1;
      const lenConsumed = 0
        + split.reduce((a, s) => a + s.length, 0)
        + delim.length * numDelimsSplit;
      
      return lenConsumed < this.length
        ? [ ...split, this.slice(lenConsumed + delim.length) ]
        : split;
    },
    [has]:     String.prototype.includes,
    [hasHead]: String.prototype.startsWith,
    [hasTail]: String.prototype.endsWith,
    [indent](...args /* amt=2, char=' ' | indentStr=' '.repeat(2) */) {
      
      if (!this) return this; // No-op on empty String (otherwise it would transform a 0-line string to a 1-line string)
      let indentStr: string;
      if (isCls(args[0], String)) { indentStr = args[0]; }
      else                         { const [ amt=2, char=' ' ] = args; indentStr = char.repeat(amt); }
      return this.split('\n')[map](ln => `${indentStr}${ln}`).join('\n');
      
    },
    [lower]:   String.prototype.toLowerCase,
    [padHead]: String.prototype.padStart,
    [padTail]: String.prototype.padEnd,
    [toNum](cs: string | CharSet=String[base62]) {
      
      if (isCls(cs, String)) cs = String[charset](cs);
      
      const base = cs.size;
      if (base === 1n) return this.count();
      
      let sum = 0n;
      const n = this.length;
      for (let ind = 0; ind < n; ind++)
        // Earlier values of `i` represent higher places same as with written numbers further left
        // digits are more significant
        // The value of the place `i` is `ind - 1`
        sum += (base ** BigInt(n - ind - 1)) * cs.charVal(this[ind]);
      return sum;
      
    },
    [upper]:   String.prototype.toUpperCase,
    
  });
  protoDefs(Number, {
    
    $: { [int32]: 2 ** 32, [int64]: 2 ** 64 },
    
    [char]() { return String.fromCharCode(this); },
    [isInt]() { return this === Math.round(this); }, // No bitwise shortcut - it disrupts Infinity
    [toArr](fn) { const arr = new Array(this || 0); for (let i = 0; i < this; i++) arr[i] = fn(i); return arr; },
    [toObj](fn) { // Iterator: n => [ key, val ]
      const ret: [ string, any ][] = [];
      for (let i = 0; i < this; i++) { const r = fn(i); if (r !== skip) ret.push(r); }
      return Object.fromEntries(ret);
    },
    [toStr](cs: string | CharSet, padLen=0) {
      
      // Note that base-1 requires 0 to map to the empty string. This also
      // means that, for `n >= 1`:
      //      |       (n).encodeStr(singleChr)
      // is always equivalent to
      //      |       singleChr.repeat(n - 1)
      
      if (isCls(cs, String)) cs = String[charset](cs);
      
      const base = cs.size;
      if (base === 1n && padLen) throw Error(`pad with base-1 encoding`);
      
      if (this !== this) return (base === 1n) ? '' : cs[0].repeat(Math.max(padLen, 1));
      
      let num = this.constructor === BigInt ? (this as bigint) : BigInt(Math.floor(this));
      const digits: string[] = [];
      while (num) { digits.push(cs.valChar(num % base)); num /= base; }
      return digits.reverse().join('')[padHead](padLen, cs.str[0]);
      
    },
    * [Symbol.iterator]() { for (let i = 0; i < this; i++) yield i; },
    * [bits]() { let n = this >= 0 ? this : -this; while (n) { yield n & 1; n = n >> 1; } }
    
  });
  protoDefs(BigInt, { [toStr]: Number.prototype[toStr] });
  protoDefs(Function, {
    
    [bind](...args) { return this.bind(null, ...args); }
    
  });
  protoDefs(Error, {
    
    $: {
      
      [assert]: (args: any, fn: (args: any) => boolean) => {
        if (fn(args)) return;
        
        throw Error('assert failed')[mod]({
          fn: `false === (${
            fn.toString().replace(/[\s]+/, ' ')
          })(args)`,
          args
        });
      },
      
    },
    
    [fire](this: Error, props /* { cause, msg, message, ...more } */) { throw this[mod](props); },
    [limn](this: Error, seen = new Map()): ReturnType<Error[typeof limn]> {
      if (seen.has(this)) return seen.get(this);
      seen.set(this, 'cycle(Error)');
      
      const { message, stack, cause, ...props } = this as Error & { cause?: Error };
      return {
        form: getClsName(this),
        msg: message,
        trace: stack?.split('\n').slice(1)[map](v => v.trim() ?? skip) ?? [],
        ...props,
        cause: !cause ? null : cause[limn](seen)
      };
    },
    [mod](this: Error, props: any = {} /* { cause, msg, message, ...more } */) {
      
      if (isCls(props, Function)) props = props(this.message, this);
      if (isCls(props, String)) props = { message: props };
      
      const { cause = null, msg = null, message = msg ?? this.message, ...moreProps } = props;
      
      // - Assign `cause` to transfer props like fs "code" props, etc. - watch out, `cause` may be
      //   an Array or Object!
      // - Assign `moreProps` to transfer any other properties
      // - Add `message` prop
      // - Only add `cause` prop if `cause` is non-null
      
      return Object.assign(this, inCls(cause, Error) ? cause : {}, moreProps, cause ? { message, cause } : { message });
      
    },
    [suppress](this: Error) {
      this[Symbol.for('@gershy.clearing.err.suppressed')] = true;
      
      if (this.cause) {
        const causes = inCls(this.cause, Error) ? [ this.cause ] : this.cause;
        for (const err of causes as Error[]) err[suppress]();
      }
      
      return this;
    }
    
  });
  protoDefs(Promise, {
    
    $: {
      [allArr]: Promise.all,
      [allObj]: (obj) => {
        
        // Need to get `keys` immediately, in case `obj` mutates before resolution
        const keys = Object.keys(obj);
        return Promise.all(Object.values(obj)).then(vals => {
          const ret = {};
          for (const [ i, k ] of keys.entries()) if (vals[i] !== skip) ret[k] = vals[i];
          return ret;
        });
          
      },
      [later]: (resolve, reject) => {
        const p = new Promise((...a) => [ resolve, reject ] = a);
        return Object.assign(p, { resolve, reject });
      }
    }
    
  });
  protoDefs(Set, {
    
    [count](this: Set<any>) { return this.size; },
    [empty](this: Set<any>) { return !this.size; },
    [find](this: Set<any>, fn) { // Iterator: (val) => bool; returns { found, val }
      for (const val of this) if (fn(val)) return { found: true, val };
      return { found: false, val: null };
    },
    [map](this: Set<any>, fn) { // Iterator: (val, ind) => val0
      const ret: any[] = [];
      let ind = 0;
      for (const item of this) { const r = fn(item, ind++); if (r !== skip) ret.push(r); }
      return ret;
    },
    [rem]: Set.prototype.delete,
    [toArr](this: Set<any>, fn) {
      const ret: any[] = [];
      let ind = 0;
      for (const item of this) { const r = fn(item, ind++); if (r !== skip) ret.push(r); }
      return ret;
    },
    [toObj](this: Set<any>, fn) {
      const ret: any[] = [];
      for (const item of this) { const r = fn(item); if (r !== skip) ret.push(r); }
      return Object.fromEntries(ret);
    }
    
  });
  protoDefs(Map, {
    
    [add]: Map.prototype.set,
    [count](this: Map<any, any>) { return this.size; },
    [empty](this: Map<any, any>) { return !this.size; },
    [find](this: Map<any, any>, fn) { // Iterator: (val, key) => bool; returns { found, val, key }
      for (const [ k, v ] of this) if (fn(v, k)) return { found: true, val: v, key: k };
      return { found: false, val: null, key: null };
    },
    [map](this: Map<any, any>, fn) { // Iterator: (val, key) => [ key0, val0 ]
      const ret: any = [];
      for (const [ k, v ] of this) { const r = fn(v, k); if (r !== skip) ret.push(r); }
      return Object.fromEntries(ret);
    },
    [rem]: Map.prototype.delete,
    [toArr](this: Map<any, any>, fn) { // Iterator: (val, key) => val0
      const ret: any[] = [];
      for (const [ k, v ] of this) { const r = fn(v, k); if (r !== skip) ret.push(r); }
      return ret;
    },
    [toObj](this: Map<any, any>, fn) {
      const ret: any = [];
      for (const [ k, v ] of this) { const r = fn(v, k); if (r !== skip) ret.push(r); }
      return Object.fromEntries(ret);
    }
    
  });
  
});
applyClearing();

export default applyClearing;