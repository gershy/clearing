declare global {

  // Util
  type Fn<A=any[], T=any> = (...args: A) => T;
  type Obj<V = any> = { [typeof iden]: 'obj' } & { [k: string]: V };
  
  type ObjMode<O extends { [K: string]: any }> = O extends { [K in infer KK]: any } ? (string extends KK ? 'map' : 'rec') : never;
  type ObjKeys<O extends Obj> = Extract<keyof O, string>; // | `${Extract<keyof O, number>}`; // TODO: num -> str conversion... smart??
  type ObjVals<O extends Obj> = O[Extract<keyof O, string>];
  type Arr<V = any> = V[];
  type MaybeFn<T> = T | ((...args: any[]) => T);
  type ResolveFn<T> = T extends ((...args: any[]) => any) ? ReturnType<T> : T;
  type Itr<O extends Obj> = Iterable<[ ObjKeys<O>, ObjVals<O> ]>;
  type Json = null | boolean | number | string | Json[] | { [K: string]: Json };
  type Skip = undefined;
  type SkipNever<V> = V extends Skip ? Skip extends V ? never : V : V; // 0 extends (1 & T) ? any : V extends Skip ? Skip extends V ? never : V : V; // Only thing that doesn't work is `SkipNever<any>`
  type Endable = { end: () => MaybePromise<unknown> };
  type Callable = ((...args: any[]) => any) | { new (...args: any): any };
  type SovereignFn<T extends Callable = Callable> = T; // & { _svrn: 1 };
  type Assign<A, B> = Omit<A, keyof B> & B;
  type UGH = any; // Use when necessary to escape typing because typescript has failed us
  
  type Dive<O extends Obj, K extends readonly string[], D = undefined> =
      K extends [ infer K0, ...infer KM ]
        ? K0 extends keyof O
          ? (ObjMode<O> extends 'map' ? D : never) | (
              KM extends []
                ? O[K0]
                : Dive<O[K0], KM, D>
            )
          : D
        : never
  
  // Function args have reversed assignability from typical inheritance; they are the key for
  // converting a union to an intersection: https://stackoverflow.com/a/50375286/830905
  // // type Combine<U> =
  // //     (U extends any ? (x: U) => void : never) extends (x: infer I) => void
  // //       ? I
  // //       : never;
  // type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;
  // type Combine<Union> = Expand<(Union extends any ? (x: Union) => void : never) extends (x: infer Combined) => void ? Combined : never>;
  // // type Combine0 = { a: number, b?: string } | { a?: number, b: string };
  // type Combine1 = Combine<Combine0>;
  
  // Jsfn
  // Implements "jsfn" which is "json" but with functions allowed within the payload too! (Overall,
  // pronounced "jay-sfun"). This is implemented simply using `fn.toString()` + `eval(fnString)`. The
  // encoded format stores a list of all paths within the json which are stringified functions. The
  // decoding process simply calls `JSON.parse`, loops through every stringified path, and expands
  // the stringified values with `eval`. Of course, these functions should only be used with trusted
  // data!
  type Hoist =  `<repo>/${string}` | `@aws/${string}`; // TODO: More imports??
  type JsfnInst<Cls extends { new (...args: any[]): any }> = { // "jsfn instance"
    hoist: `${Hoist}::${string}`,
    form: Cls,
    args: ConstructorParameters<Cls> & Jsfn
  };
  
  type Jsfn = null | boolean | number | string | SovereignFn | JsfnInst<any> | Jsfn[] | { [K: string]: Jsfn };
  type JsfnDecoded<T extends Jsfn, N extends string = ''> =
    N extends '+++++'
      ? '<TOO DEEP>'
      : T extends null
        ? T
        : T extends boolean
          ? T
          : T extends number
            ? T
            : T extends string
              ? T
              : T extends SovereignFn<infer Fn>
                ? Fn
                : T extends JsfnInst<any>
                  ? InstanceType<T['form']>
                  : T extends { [K: string]: Jsfn }
                    ? { [K in keyof T]: T[K] extends Jsfn ? JsfnDecoded<T[K], `+${N}`> : never }
                    : T extends Jsfn[]
                      ? { [K in keyof T]: T[K] extends Jsfn ? JsfnDecoded<T[K], `+${N}`> : never }
                      : Jsfn;
  
  type JsfnEncoded<T extends Jsfn> = string & { _jsfn: T };
  
  type ObjLeafs<O> = O extends Obj ? { [K in keyof O]: ObjLeafs<O[K]> }[keyof O] : O;
  // type ObjLeafs0 = ObjLeafs<{ a: string, b: { c: number }, d: null, e: { f: { g: undefined } } }>;
  
  type CharSet = { str: string, size: bigint, charVal: (c: string) => bigint, valChar: (n: bigint) => string };

  type MaybePromise<T> = T | Promise<T>;

  // Expose native classes
  const AsyncGeneratorFunction: any;
  const GeneratorFunction: any;
  
  // Globals
  const skip: Skip;
  const window: any;
  const skip: Skip;
  const AsyncGeneratorFunction: typeof AsyncGeneratorFunction;
  const GeneratorFunction: typeof GeneratorFunction;
  const isForm: typeof isForm;
  const hasForm: typeof hasForm;
  
  // Utility
  const sovereign: <Fn extends (...args: any) => any>(val: Fn) => Fn & { _svrn: 1 };
  const then: <V, G, B = never>(val: MaybePromise<V>, resolve: (val: V) => G, reject?: (err: any) => B) => MaybePromise<G | B>;
  const safe: <V, G, B = never>(fn: () => MaybePromise<V>, resolve: (val: V) => G, reject?: (err: any) => B) => MaybePromise<G | B>;
  
  // Forms
  const isForm: {
    (val: unknown, num:    BooleanConstructor):  val is boolean,
    (val: unknown, num:    NumberConstructor):   val is number,
    (val: unknown, str:    StringConstructor):   val is string,
    (val: unknown, buff:   BufferConstructor):   val is Buffer,
    (val: unknown, arr:    ArrayConstructor):    val is any[],
    (val: unknown, obj:    ObjectConstructor):   val is Obj<unknown>,
    (val: unknown, fn:     FunctionConstructor): val is Fn,
    (val: unknown, fn:     SymbolConstructor):   val is symbol,
    <T>(val: unknown, prm: PromiseConstructor):  val is Promise<T>,
    <C>(val: unknown, cls: C):                   val is InstanceType<C>
  };
  const getForm: {
    (val: number):               NumberConstructor,
    (val: string):               StringConstructor,
    (val: Buffer):               BufferConstructor,
    (val: any[]):                ArrayConstructor,
    (val: { [K: string]: any }): ObjectConstructor,
    (val: (...a: any[]) => any): FunctionConstructor,
    (val: Promise<any>):         PromiseConstructor,
    <T>(val: T):                 { new (...args: any[]): T }
  };
  const hasForm: {
    (val: any, fnc: FunctionConstructor): val is (...args: any) => any,
    (val: any, obj: ObjectConstructor): val is { [K: string]: any },
    (val: any, str: StringConstructor): val is string,
    (val: any, num: NumberConstructor): val is number,
    (val: any, arr: ArrayConstructor): val is any[],
    (val: any, arr: BufferConstructor): val is Buffer,
    <T>(val: any, prm: PromiseConstructor): val is Promise<T>,
    <C>(val: unknown, cls: C): val is InstanceType<C>
  };
  const getFormName: (f: any) => string;
  
  const jsfn: {
    encode: SovereignFn<
      <Data extends Jsfn>(dec: Data, opts?: { encodeFn?: (fn: Fn) => string }) => {
        hoists: `<repo>/${string}::${string}`[],
        str: JsfnEncoded<Data>;
      }
    >
  };
  
  const add:      unique symbol;
  const allow: unique symbol;
  const at:       unique symbol;
  const apart:    unique symbol;
  const assert:   unique symbol;
  const bind:     unique symbol;
  const bits:     unique symbol;
  const built:    unique symbol;
  const char:     unique symbol;
  const code:     unique symbol;
  const count:    unique symbol;
  const cut:      unique symbol;
  const dive:     unique symbol;
  const empty:    unique symbol;
  const fire:     unique symbol;
  const group:    unique symbol;
  const has:      unique symbol;
  const hasHead:  unique symbol;
  const hasTail:  unique symbol;
  const indent:   unique symbol;
  const isInt:    unique symbol;
  const limn:     unique symbol;
  const lower:    unique symbol;
  const mod:      unique symbol;
  const map:      unique symbol;
  const mapk:     unique symbol;
  const merge:    unique symbol;
  const padHead:  unique symbol;
  const padTail:  unique symbol;
  const rem:      unique symbol;
  const find:     unique symbol;
  const slash:    unique symbol;
  const slice:    unique symbol;
  const suppress: unique symbol;
  const toArr:    unique symbol;
  const toNum:    unique symbol;
  const toObj:    unique symbol;
  const toStr:    unique symbol;
  const upper:    unique symbol;
  
  // Typing only
  const iden: unique symbol; // associate types with their *direct* constructor
  
  interface JSON { parse: (val: Buffer) => any };

  interface ProtoWithSymbols {
    [add]:      undefined
    [at]:       undefined
    [apart]:    undefined
    [assert]:   undefined
    [bind]:     undefined
    [built]:    undefined
    [count]:    undefined
    [cut]:      undefined
    [dive]:     undefined
    [empty]:    undefined
    [fire]:     undefined
    [group]:    undefined
    [has]:      undefined
    [hasHead]:  undefined
    [hasTail]:  undefined
    [indent]:   undefined
    [limn]:     undefined
    [lower]:    undefined
    [mod]:      undefined
    [map]:      undefined
    [mapk]:     undefined
    [merge]:    undefined
    [padHead]:  undefined
    [padTail]:  undefined
    [rem]:      undefined
    [find]:     undefined
    [slash]:    undefined
    [slice]:    undefined
    [suppress]: undefined
    [toArr]:    undefined
    [toNum]:    undefined
    [toObj]:    undefined
    [toStr]:    undefined
    [upper]:    undefined
  };
  
  interface ErrorConstructor {
    assert: {
      <R, V = any>(args: V, fn: (args: V) => boolean): asserts args is R,
    }
  };
  interface Error extends ProtoWithSymbols {
    [mod]:      (props: { [K: string]: any }) => Error,
    [fire]:     (props?: { [K: string]: any }) => never,
    [suppress]: () => Error,
    
    [limn]: (seen?: Map) => (Obj<Json> & {
      form: string,
      msg: string,
      trace: string[],
      cause: null | ReturnType<Error[typeof limn]>
    })
  };
  
  interface ArrayConstructor {
    stub: any[]
  };
  interface Array<T> extends ProtoWithSymbols {
    [iden]: 'arr',
    [has]: (val: unknown) => boolean,
    [map]: {
      <
        Fn extends (v: T, i: number) => any
      >(
        fn: Fn
      ): Exclude<ReturnType<Fn>, Skip>[]
    },
    [add]:   <TT extends T>(val: TT) => void,
    [rem]:   <TT extends T>(val: TT) => void,
    [count]: () => number,
    [empty]: (this: any[]) => this is never[],
    [toObj]: <Fn extends (v: T, n: number) => Skip | readonly [string, any], R = Exclude<ReturnType<Fn>, Skip>>(fn: Fn) => { [K in R[0]]: R[1] },
    [find]:  (fn: (val: T, n: number) => any) => ({ found: true, val: T, ind: number } | { found: false, val: null, ind: null }),
    [group]: <G extends string>(fn: (v: T) => G) => { [K in G]?: T[] }
  };
  
  interface FunctionConstructor {
    stub: <T>(a: T, ...args: any[]) => T
  };
  interface Function extends ProtoWithSymbols {
    [iden]: 'fnc',
    [bind]: {
      <
        Fn extends (this: any, ...args: any[]) => any,
        To
      >(
        this: Fn,
        to: To
      ): ((this: To, ...args: Parameters<Fn>) => ReturnType<Fn>)
    }
  };
  
  interface GeneratorFunctionConstructor {};
  interface Generator<T> extends ProtoWithSymbols {
    [toArr]: {
      <
        Fn extends (v: T) => any
      >(
        fn: Fn
      ):
        ReturnType<Fn>[],
    }
  };
  
  interface NumberConstructor {
    int32: number
  };
  interface Number extends ProtoWithSymbols {
    [iden]: 'num',
    [toStr]: (str: string | CharSet, len?: number) => string,
    [toArr]: <T>(fn: (n: number) => T) => T[],
    [map]: undefined // Prevent calling `map` on `Number` - use `toStr` instead!
  };
  
  interface BigIntConstructor {};
  interface BigInt extends ProtoWithSymbols {
    [toStr]: (str: string | CharSet, len?: number) => string
  };
  
  interface ObjectConstructor {
    plain: (obj?: any) => any,
  };
  
  interface Object extends ProtoWithSymbols {
    [iden]: 'obj',
    [empty]: {
      <
        O extends Obj
      >(
        this: O
      ): ObjMode<O> extends 'rec'
        ? never & '<rec>.empty is invalid'
        : this is Obj<never>,
    },
    
    [at]: {
      <
        O extends Obj,
        K extends string | string[],
        D extends any = undefined
      >(
        this: O,
        k: string | string[],
        def?: D
      ): Dive<O, K extends string[] ? K : [ K ], D>,
    },
    [has]: {
      // <O extends Obj>(this: O, k: string): boolean,
      // <O extends Obj>(this: O, k: string): k is (ObjMode<O> extends 'rec' ? keyof O : any),
      // <O extends Obj>(this: O, k: string): k is (ObjMode<O> extends 'rec' ? keyof O : any),
      
      // <O extends Obj, K extends keyof any>(this: O, k: K): this is { [K]: O[keyof O] }
      
      <O extends Obj>(this: O, k: unknown): k is keyof O
      
    },
    [map]: {
      <
        O extends Obj,
        Fn extends (v: ObjVals<O>, k: ObjKeys<O>) => any
      >(
        this: O,
        fn: Fn
      ): { [K in keyof O]: Exclude<ReturnType<Fn>, Skip> },
    },
    [mapk]: {
      <
        O extends Obj,
        Fn extends (v: O[keyof O], k: ObjKeys<O>) => undefined | [ string, any ]
      >(
        this: O,
        fn: Fn
      ): { [K in Exclude<ReturnType<Fn>, Skip>[0]]: Exclude<ReturnType<Fn>, Skip>[1] },
    },
    [merge]: {
      <
        O1 extends Obj,
        O2 extends Obj
      >(
        this: readonly O1,
        val:  readonly O2
      ): O1 & O2,
    },
    [slice]: {
      <O extends Obj, K extends readonly (keyof O)[]>(this: O, keys: K): { [P in K[number]]: SkipNever<O[P]> }
    },
    [slash]: {
      <
        O extends Obj,
        T extends readonly (keyof O)[]
      >(
        this: O,
        keys: T
      ): { [K in keyof O as Exclude<keyof O, T[number]>]: O[K] }
    },
    [toArr]: {
      <
        O extends Obj,
        Fn extends (v: O[keyof O], k: ObjKeys<O>) => any
      >(
        this: O,
        fn: Fn
      ): Exclude<ReturnType<Fn>, Skip>[],
    },
    [built]: {
      (this: Obj<any>): any
      // <O extends Obj>(this: O): Obj<ObjLeafs<O>>,
    },
    [apart]: {
      // Iterates all terminal values in an object tree, along with the dive key needed to access them
      <O extends Obj>(this: O): Generator<{ dive: string[], val: any }>,
    },
    [dive]: {
      <O extends Obj, Cmps extends (keyof any)[], D extends any = Skip>(this: O, cmps: readonly Cmps, def: D): Dive<O, Cmps> | D,
    },
    [count]: {
      <O extends Obj>(this: O): number,
    },
    [Symbol.iterator]: {
      <O extends Obj>(this: O): Iterator<[ ObjKeys<O>, ObjVals<O> ]>
    },
    $$inspect: <V>(this: V) => { v: V }
  };
  
  interface PromiseConstructor {
    // <T>(fn: (resolve: (v: T) => void, reject: (err: any) => void) => any): Promise<T>,
    later: <T=void>() => PromiseLater<T>,
    allArr: PromiseConstructor['all'],
    allObj: <O extends { [K: keyof any]: Promise<any> }>(obj: O) => { [K in keyof O]: Awaited<O[K]> }
  };
  interface Promise<T> {};
  interface PromiseLater<T=void> extends Promise<T>, ProtoWithSymbols  {
    resolve: T extends void ? () => void : (v: T) => void,
    reject: (err: any) => void
  };
  
  interface SetConstructor {};
  interface Set<T> extends ProtoWithSymbols {
    [toArr]: <V>(fn: (val: T, ind: number) => V) => V[],
    [rem]:   (val: T) => void
  };
  
  
  interface MapConstructor {};
  interface Map<K, V> extends ProtoWithSymbols {
    [add]:   (k: K, v: V) => void,
    [toArr]: <T>(fn: (val: V, key: K) => T) => T[],
    [toObj]: <T>(fn: (val: V, key: K) => T) => { [Key in K]: T },
    [rem]:   (key: K) => void
  };
  
  interface StringConstructor {
    charset: (str: string) => CharSet,
    base32: string,
    base36: string,
    base62: string,
    base64: string,
    base64Std: string,
    baseline: (str: string) => string,
  };
  interface String extends ProtoWithSymbols {
    [count](): number,
    [has](s: string): boolean,
    [padHead](n: number, s?: string): string,
    [padTail](n: number, s?: string): string,
    [toNum]: (chrs: string | CharSet) => bigint,
    [hasHead]<H extends string>(this: string, head: H): this is `${H}${string}`,
    [hasTail]<T extends string>(this: string, tail: T): this is `${string}${T}`,
    [upper]<S extends string>(this: S): Uppercase<S>,
    [lower]<S extends string>(this: S): Lowercase<S>,
    [cut]: {
      (str: string, cuts: 1): [ string, string ],
      (str: string, cuts: 2): [ string, string, string ],
      (str: string, cuts: 3): [ string, string, string, string ],
      (str: string, cuts: 4): [ string, string, string, string, string ],
      (str: string, cuts?: number): string[]
    },
    [indent]: {
      (amount: number, char?: string): string,
      (str: string): string
    }
  };

}

export {};

// Type testing - these aren't exported!
type Dive0 = Dive<{ a: { b: { c: 'xyz' } } }, [ 'a', 'b', 'c' ]>;
type Dive1 = Dive<{ a: { b: { c: 'xyz' } } }, [ 'a', 'b' ]>;
type Dive2 = Dive<{ a: { b: { c: 'xyz' } } }, [ 'a', 'b', 'd' ]>;