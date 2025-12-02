const applyClearing = (() => {

  const global: any = globalThis;

  // Prevent multiple installations...
  const memSym = Symbol.for('clearing:mem');
  if (global[memSym]) return;
  global[memSym] = true;

  const symNames = [ 'add', 'at', 'apart', 'assert', 'bind', 'bits', 'built', 'char', 'code', 'count', 'cut', 'dive', 'empty', 'fire', 'group', 'has', 'hasHead', 'hasTail', 'indent', 'isInt', 'limn', 'lower', 'mod', 'map', 'mapk', 'merge', 'padHead', 'padTail', 'rem', 'find', 'slash', 'slice', 'suppress', 'toArr', 'toNum', 'toObj', 'toStr', 'upper' ] as const;
  const syms = Object.fromEntries(symNames.map(term => [ term, Symbol(`clearing:${term}`) ]));
  
  const sovereign = v => v;
  
  Object.assign(global, {
    
    // Reference native constructors
    AsyncFunction: (async () => {}).constructor,
    GeneratorFunction: (function*(){})().constructor,
    AsyncGeneratorFunction: (async function*(){})().constructor,
    
    // Symbols
    ...syms,
    
    // Forms
    getFormName: f => {
      if (f === null) return 'Null';
      if (f === undefined) return 'Undef';
      if (f !== f) return 'UndefNum';
      return Object.getPrototypeOf(f)?.constructor.name ?? 'Prototypeless'; // e.g. `getFormName(Object.plain()) === 'Prototypeless'`
    },
    getForm: f => Object.getPrototypeOf(f)?.constructor ?? null,
    isForm: (fact, Form) => {
      
      // NaN only matches against the NaN primitive (not the Number Form)
      if (fact !== fact) return Form !== Form;
      if (fact == null) return false;
      return Object.getPrototypeOf(fact).constructor === Form;
      
    },
    hasForm: (fact, Form) => fact instanceof Form,
    
    // Utility
    skip: undefined,
    sovereign,
    then: (val: MaybePromise<any>, rsv=Function.stub, rjc?: (...args: any[]) => any) => {
      
      // Act on `val` regardless of whether it's a Promise or an immediate
      // value; return `rsv(val)` either immediately or as a Promise;
      
      // Promises are returned with `then`/`fail` handling
      if (hasForm(val, Promise)) return val.then(rsv).catch(rjc);
      
      // No `rjc` means no `try`/`catch` handling
      if (!rjc) return rsv(val);
      
      try { return rsv(val); } catch(err) { return rjc(err); }
      
    },
    safe: (val: () => MaybePromise<any>, acc = Function.stub, rjc?: (...args: any[]) => any) => {
      try        { return then(val(), acc, rjc); }
      catch(err) { if (!rjc) throw err; return rjc(err); }
    },
    
    // Jsfn
    jsfn: {
      encode: sovereign(<T extends Jsfn>(dec: T /* `val` is still not allowed to have cycles! */, opts?: { encodeFn?: (fn: Fn) => string }) => {
        
        const encodeFn = opts?.encodeFn ?? (fn => fn.toString());
        const hoists: string[] = [];
        const serializeObjKey = (key: string) => {
          if (/^[$_a-zA-Z][$_a-zA-Z]+$/.test(key)) return key;
          return `'${key.replaceAll(`'`, `\\'`)}'`;
        };
        const serialize = (val: Jsfn): string => {
          
          if (isForm(val, Object) && Object.keys(val).sort().join(',') === 'args,form,hoist' && hasForm((val as any).form, Function)) {
            const { args, form, hoist } = val as any;
            hoists.push(hoist);
            return `new ${hoist.split('::').at(-1)!}(${args.map(a => serialize(a)).join(', ')})`;
          }
          if (isForm(val, Array))     return '[' + val.map   ((v   ) =>                          serialize(v))  .join(',') + ']';
          if (isForm(val, Object))    return '{' + val[toArr]((v, k) => `${serializeObjKey(k)}:${serialize(v)}`).join(',') + '}';
          if (hasForm(val, Function)) return encodeFn(val);
          
          return JSON.stringify(val);
          
        };
        
        return {
          // Note `str` is stringified, but it isn't json - it's js, in string representation!!
          // This representation is actually very simple - in order to run the js represented by
          // `str`, all hoists need to be imported in the context
          hoists,
          str: serialize(dec)
        };
        
      })
    },
    
  });
  
  const protoDefs = (Cls, def) => {
    
    const protoVals: { key: string | symbol, val: any }[] = [];
    const classVals: { key: string, val: any }[] = [];
    for (const key of Reflect.ownKeys(def) /* includes symbols!! */) {
      if      (!isForm(key, String)) protoVals.push({ key, val: def[key] });
      else if (key.startsWith('$'))  classVals.push({ key: key.slice(1), val: def[key] });
      else if (key.endsWith('->'))   protoVals.push({ key: def[key], val: Cls.prototype[key.slice(0, -2)] });
    }
    
    // Assign class properties
    Object.assign(Cls, Object.fromEntries(classVals.map(({ key, val }) => [ key, val ])));
    
    // Avoid making more properties available on `global` - if a typo winds up referring to a
    // global property, the bug which results can be highly unexpected!
    // TODO: Note, we don't want to populate the global namespace, *but* we still populate all the
    // symbols keyed by string name on `global` (note the *symbol* is keyed by its *string name* on
    // `global` - i.e., `global['toArr']` results in `Symbol('clearing.toArr')`! This results in
    // many dozens of keys being populated in global namespace... should probably move these
    // symbols to a module import instead :(
    if (Cls === global.constructor) for (const entry of protoVals) if (isForm(entry.key, String)) global[entry.key] = skip;
    
    // Assign proto properties
    Object.defineProperties(Cls.prototype, Object.fromEntries(
      protoVals
        .map(({ key, val }) => [ key, { enumerable: false, writable: true, value: val } ])
    ));
    
  };
  protoDefs(Object, {
    
    $stub: Object.freeze({}),
    $plain: obj => obj ? Object.assign(Object.create(null), obj) : Object.create(null),
    
    'hasOwnProperty->': has,
    
    * [apart](this: Obj, dive=[]) {
      
      // Breaks apart a "structured" object into a flat list of dive keys paired with values; every
      // value in the original object appears alongside the "dive" (chain of keys to recursively
      // apply) required to dereference it
      
      for (const [ k, val ] of this) {
        if (isForm(val, Object)) yield* val[apart]([ ...dive, k ]);
        else                     yield { dive: [ ...dive, k ], val };
      }
      
    },
    [at](this: Obj, cmps, def=skip) {
      let ptr = this;
      if (!isForm(cmps, Array)) cmps = [ cmps ];
      for (const c of cmps) {
        if (ptr[has](c)) ptr = ptr[c];
        else             return def;
      }
      return ptr;
    },
    [built](this: Obj, diveFromKey = (key: string) => key.split('.')) {
      
      // The reverse operation of `apart` - takes a flat list of (dive, value) pairs and produces a
      // structured object
      
      const result = {};
      for (const [ k, v ] of this as Itr<Obj>) {
        const dive = diveFromKey(k);
        const last = dive.pop()!;
        let ptr: Obj = result;
        for (const cmp of dive) ptr = ptr[at](cmp) ?? (ptr[cmp] = {});
        ptr[last] = isForm(v, Object) ? v[built]() : v;
      }
      return result;
    },
    [count](this: Obj) { let c = 0; for (const k in this) c++; return c; },
    [dive](this: Obj, cmps, def=skip) { return this[at](cmps, def); },
    
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
    [toArr](this: Obj, fn) { // Iterator: (val, k) => [ k, v ]
      const ret: any[] = [];
      for (const k in this) { const r = fn(this[k], k); if (r !== skip) ret.push(r); }
      return ret;
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
        const t = fn(v, k);
        if (!ret[has](t)) ret[t] = {};
        ret[t][k] = v;
      }
      return ret;
      
    },
    [merge](this: Obj, o) { // Modifies `this` in-place
      for (const [ k, v ] of o) {
        // `skip` can be passed to remove properties
        if (v === skip) { delete this[k]; continue; }
        
        // Incoming non-Object properties are simple
        if (!isForm(v, Object)) { this[k] = v; continue; }
        
        // `v` is an Object; existing non-Object replaced with `{}`
        if (!this[has](k) || !isForm(this[k], Object)) this[k] = {};
        
        // And simply recurse!
        this[k][merge](v);
      }
      return this;
    },
    
    * [Symbol.iterator](this: Obj) { for (const k in this) yield [ k, this[k] ]; }
    
  });
  protoDefs(Array, {
    
    $stub: Object.freeze([]),
    
    'includes->': has,
    
    [has](this: any[], v: any) { return this.includes(v); },
    [map](this: any[], it) { // Iterator: (val, ind) => val
      const ret: any[] = [];
      const len = this.length;
      for (let i = 0; i < len; i++) { const r = it(this[i], i); if (r !== skip) ret.push(r); }
      return ret;
    },
    [toArr](this: any[], it) { return this[map](it); },
    [toObj](this: any[], it) { // Iterator: (val, ind) => [ key0, val0 ]
      const ret: any[] = [];
      const len = this.length;
      for (let i = 0; i < len; i++) { const r = it(this[i], i); if (r !== skip) ret.push(r); }
      return Object.fromEntries(ret);
    },
    
    [find](f) { // Iterator: (val, ind) => bool; returns { found=false, val=null, ind=null }
      const n = this.length;
      for (let i = 0; i < n; i++) if (f(this[i], i)) return { found: true, val: this[i], ind: i };
      return { found: false, val: null, ind: null };
    },
    [empty]() { return !this.length; },
    [add](...args) { this.push(...args); return args[0]; },
    [rem](val) { const ind = this.indexOf(val); if (ind > -1) this.splice(ind, 1); },
    [count]() { return this.length; },
    [group](fn) { // Iterator: val => '<categoryTerm>'
      
      //  [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ].group(n => {
      //    if (n < 4) return 'small';
      //    if (n < 8) return 'medium';
      //    return 'big';
      //  });
      //  >> { small: [ 1, 2, 3 ], medium: [ 4, 5, 6, 7 ], big: [ 8, 9, 10 ] }
      
      const ret = {};
      for (const elem of this) { const t = fn(elem); if (!ret[has](t)) ret[t] = []; ret[t].push(elem); }
      return ret;
      
    }
    
  });
  protoDefs(String, {
    
    $baseline: (str, seq='| ') => {
      
      return str.split('\n')[map](ln => {
        const ind = ln.indexOf(seq);
        if (ind === -1) return skip;
        return ln.slice(ind + seq.length);
      }).join('\n');
      
    },
    $charset: str => {
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
    $base32: '0123456789abcdefghijklmnopqrstuv',
    $base36: '0123456789abcdefghijklmnopqrstuvwxyz',
    $base62: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
    $base64: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_',
    $base64Std: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/',
    
    'includes->': has,
    'startsWith->': hasHead,
    'endsWith->': hasTail,
    'padStart->': padHead,
    'padEnd->': padTail,
    'toUpperCase->': upper,
    'toLowerCase->': lower,
    
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
    [code](ind=0) { return this.charCodeAt(ind); },
    [count]() { return this.length; },
    [indent](...args /* amt=2, char=' ' | indentStr=' '.repeat(2) */) {
      
      if (!this) return this; // No-op on empty String (otherwise it would transform a 0-line string to a 1-line string)
      let indentStr: string;
      if (isForm(args[0], String)) { indentStr = args[0]; }
      else                         { const [ amt=2, char=' ' ] = args; indentStr = char.repeat(amt); }
      return this.split('\n')[map](ln => `${indentStr}${ln}`).join('\n');
      
    },
    [toNum](charset: string | CharSet=String.base62) {
      
      if (isForm(charset, String)) charset = String.charset(charset);
      
      const base = charset.size;
      if (base === 1n) return this.count();
      
      let sum = 0n;
      const n = this.length;
      for (let ind = 0; ind < n; ind++)
        // Earlier values of `i` represent higher places same as with written numbers further left
        // digits are more significant
        // The value of the place `i` is `ind - 1`
        sum += (base ** BigInt(n - ind - 1)) * charset.charVal(this[ind]);
      return sum;
      
    }
    
  });
  protoDefs(Number, {
    
    $int32: Math.pow(2, 32),
    $int64: Math.pow(2, 64),
    
    [char]() { return String.fromCharCode(this); },
    [toArr](fn) { const arr = new Array(this || 0); for (let i = 0; i < this; i++) arr[i] = fn(i); return arr; },
    [toObj](fn) { // Iterator: n => [ key, val ]
      const ret: [ string, any ][] = [];
      for (let i = 0; i < this; i++) { const r = fn(i); if (r !== skip) ret.push(r); }
      return Object.fromEntries(ret);
    },
    [toStr](charset: string | CharSet, padLen=0) {
      
      // Note that base-1 requires 0 to map to the empty string. This also
      // means that, for `n >= 1`:
      //      |       (n).encodeStr(singleChr)
      // is always equivalent to
      //      |       singleChr.repeat(n - 1)
      
      if (isForm(charset, String)) charset = String.charset(charset);
      
      const base = charset.size;
      if (base === 1n && padLen) throw Error(`pad with base-1 encoding`);
      
      if (this !== this) return (base === 1n) ? '' : charset[0].repeat(Math.max(padLen, 1));
      
      let num = this.constructor === BigInt ? (this as bigint) : BigInt(Math.floor(this));
      const digits: string[] = [];
      while (num) { digits.push(charset.valChar(num % base)); num /= base; }
      return digits.reverse().join('')[padHead](padLen, charset.str[0]);
      
    },
    [isInt]() { return this === Math.round(this); }, // No bitwise shortcut - it disrupts Infinity
    * [Symbol.iterator]() { Error.assert({ n: this }, args => args.n.isInteger()); for (let i = 0; i < this; i++) yield i; },
    * [bits]() { let n = this >= 0 ? this : -this; while (n) { yield n & 1; n = n >> 1; } },
    
    [map]: undefined // Prevent `Number(...).map`
    
  });
  protoDefs(BigInt, { [toStr]: Number.prototype[toStr] });
  protoDefs(Function, {
    
    $stub: v => v,
    [bind](...args) { return this.bind(null, ...args); }
    
  });
  protoDefs(Error, {
    
    $stackTraceLimit: 150,
    $assert: (args: any, fn: (args: any) => boolean) => {
      if (fn(args)) return;
      
      throw Error('assert failed')[mod]({
        fn: `false === (${
          fn.toString().replace(/[\s]+/, ' ')
        })(args)`,
        args
      });
    },
    
    [mod](this: Error, props: any = {} /* { cause, msg, message, ...more } */) {
      
      if (isForm(props, Function)) props = props(this.message, this);
      if (isForm(props, String)) props = { message: props };
      
      const { cause = null, msg = null, message = msg ?? this.message, ...moreProps } = props;
      
      // - Assign `cause` to transfer props like fs "code" props, etc. - watch out, `cause` may be
      //   an Array or Object!
      // - Assign `moreProps` to transfer any other properties
      // - Add `message` prop
      // - Only add `cause` prop if `cause` is non-null
      
      return Object.assign(this, hasForm(cause, Error) ? cause : {}, moreProps, cause ? { message, cause } : { message });
      
    },
    [fire](this: Error, props /* { cause, msg, message, ...more } */) { throw this[mod](props); },
    [suppress](this: Error) {
      this[Symbol.for('clearing.err.suppressed')] = true;
      
      if (this.cause) {
        const causes = hasForm(this.cause, Error) ? [ this.cause ] : this.cause;
        for (const err of causes as Error[]) err[suppress]();
      }
      
      return this;
    },
    [limn](this: Error, seen = new Map()): ReturnType<Error[typeof limn]> {
      if (seen.has(this)) return seen.get(this);
      seen.set(this, 'cycle(Error)');
      
      const { message, stack, cause, ...props } = this as Error & { cause?: Error };
      return {
        form: getFormName(this),
        msg: message,
        trace: stack?.split('\n').slice(1)[map](v => v.trim() ?? skip) ?? [],
        ...props,
        cause: !cause ? null : cause[limn](seen)
      };
    }
    
  });
  
  protoDefs(Promise, {
    
    $resolve: Promise.resolve,
    $reject: Promise.reject,
    $all: Promise.all,
    $allArr: Promise.all,
    $later: (resolve, reject) => {
      const p = new Promise((...a) => [ resolve, reject ] = a);
      return Object.assign(p, { resolve, reject });
    },
    $allObj: (obj) => {
      
      // Need to get `keys` here in case `obj` mutates before resolution
      const keys = Object.keys(obj);
      return Promise.allArr(Object.values(obj)).then(vals => {
        const ret = {};
        for (const [ i, k ] of keys.entries()) if (vals[i] !== skip) ret[k] = vals[i];
        return ret;
      });
        
    }
    
  });
  protoDefs(Set, {
    
    $stub: { count: () => 0, add: Function.stub, rem: Function.stub, has: () => false, values: () => Array.stub },
    
    'delete->': rem,
    
    [map](this: Set<any>, fn) { // Iterator: (val, ind) => val0
      const ret: any[] = [];
      let ind = 0;
      for (const item of this) { const r = fn(item, ind++); if (r !== skip) ret.push(r); }
      return ret;
    },
    [find](this: Set<any>, fn) { // Iterator: (val) => bool; returns { found, val }
      for (const val of this) if (fn(val)) return { found: true, val };
      return { found: false, val: null };
    },
    [count](this: Set<any>) { return this.size; },
    [empty](this: Set<any>) { return !this.size; },
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
    
    $stub: { count: () => 0, set: Function.stub, rem: Function.stub, has: () => false, values: () => Array.stub },
    
    'set->': add,
    'delete->': rem,
    
    [map](this: Map<any, any>, fn) { // Iterator: (val, key) => [ key0, val0 ]
      const ret: any = [];
      for (const [ k, v ] of this) { const r = fn(v, k); if (r !== skip) ret.push(r); }
      return Object.fromEntries(ret);
    },
    [find](this: Map<any, any>, fn) { // Iterator: (val, key) => bool; returns { found, val, key }
      for (const [ k, v ] of this) if (fn(v, k)) return { found: true, val: v, key: k };
      return { found: false, val: null, key: null };
    },
    [count](this: Map<any, any>) { return this.size; },
    [empty](this: Map<any, any>) { return !this.size; },
    [toObj](this: Map<any, any>, fn) {
      const ret: any = [];
      for (const [ k, v ] of this) { const r = fn(v, k); if (r !== skip) ret.push(r); }
      return Object.fromEntries(ret);
    },
    [toArr](this: Map<any, any>, fn) { // Iterator: (val, key) => val0
      const ret: any[] = [];
      for (const [ k, v ] of this) { const r = fn(v, k); if (r !== skip) ret.push(r); }
      return ret;
    }
    
  });
  protoDefs(GeneratorFunction, {
    [toArr](fn) { return [ ...this ][map](fn); },
    [toObj](fn) {
      const ret = {};
      for (const v of this) { const r = fn(v); if (r !== skip) ret[r[0]] = r[1]; }
      return ret;
    }
  });
  
});
applyClearing();
export default applyClearing;