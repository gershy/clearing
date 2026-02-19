declare global {

  // Util
  type Fn<A=any[], T=any> = (...args: A) => T;
  type Obj<V = any> = { [typeof iden]: 'obj' } & { [k: string]: V };
  
  // Differentiate between "map" and "rec" ("record") - maps have arbitrary keys; recs have fixed keys
  type ObjMode<O extends { [K: string]: any }> = O extends { [K in infer KK]: any } ? (string extends KK ? 'map' : 'rec') : never;
  type ObjKeys<O extends Obj> = Extract<keyof O, string> | `${Extract<keyof O, number>}`; // Convert numbers to strings; ignores symbols
  type ObjVals<O extends Obj> = O[Extract<keyof O, string>];
  
  type Itr<O extends Obj> = Iterable<[ ObjKeys<O>, ObjVals<O> ]>;
  type Json = null | boolean | number | string | Json[] | { [K: string]: Json };
  type Skip = undefined;
  type SkipNever<V> = V extends Skip ? Skip extends V ? never : V : V; // 0 extends (1 & T) ? any : V extends Skip ? Skip extends V ? never : V : V; // Only thing that doesn't work is `SkipNever<any>`
  type UGH = any; // Use when necessary to escape typing because typescript has failed us
  
  type Dive<O extends Obj, K extends readonly string[], D = undefined> =
    K extends [ infer K0, ...infer KM ]
      ? K0 extends keyof O
        ? (ObjMode<O> extends 'map' ? D : never) | Dive<O[K0], KM, D>
        : D
      : O; // If `K` doesn't extend an array with a single item, it's an empty array - so use the current value
  
  type CharSet = {
    str: string,
    size: bigint,
    charVal: (c: string) => bigint,
    valChar: (n: bigint) => string
  };

  type MaybePromise<T> = T | Promise<T>;

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
    <C>(i: unknown, cls: C):                   i is InstanceType<C>
  };
  const clearing: {
    
    getClsName: (i: any) => string,
    getCls: {
      (i: number):               NumberConstructor,
      (i: string):               StringConstructor,
      (i: Buffer):               BufferConstructor,
      (i: any[]):                ArrayConstructor,
      (i: { [K: string]: any }): ObjectConstructor,
      (i: (...a: any[]) => any): FunctionConstructor,
      (i: Promise<any>):         PromiseConstructor,
      <T>(i: T):                 { new (...args: any[]): T }
    },
    isCls: ClsCheck,
    inCls: ClsCheck,
    
    skip: Skip
    
  };
  
  // <SYMBOLS>
  const add:       unique symbol;
  const allArr:    unique symbol;
  const allObj:    unique symbol;
  const at:        unique symbol;
  const assert:    unique symbol;
  const base32:    unique symbol;
  const base36:    unique symbol;
  const base62:    unique symbol;
  const base64Std: unique symbol;
  const base64Url: unique symbol;
  const baseline:  unique symbol;
  const bind:      unique symbol;
  const bits:      unique symbol;
  const char:      unique symbol;
  const charset:   unique symbol;
  const code:      unique symbol;
  const count:     unique symbol;
  const cut:       unique symbol;
  const dive:      unique symbol;
  const empty:     unique symbol;
  const find:      unique symbol;
  const fire:      unique symbol;
  const group:     unique symbol;
  const has:       unique symbol;
  const hasHead:   unique symbol;
  const hasTail:   unique symbol;
  const indent:    unique symbol;
  const int32:     unique symbol;
  const int64:     unique symbol;
  const isInt:     unique symbol;
  const later:     unique symbol;
  const limn:      unique symbol;
  const lower:     unique symbol;
  const map:       unique symbol;
  const mapk:      unique symbol;
  const merge:     unique symbol;
  const mod:       unique symbol;
  const padHead:   unique symbol;
  const padTail:   unique symbol;
  const rem:       unique symbol;
  const slash:     unique symbol;
  const slice:     unique symbol;
  const suppress:  unique symbol;
  const toArr:     unique symbol;
  const toNum:     unique symbol;
  const toObj:     unique symbol;
  const toStr:     unique symbol;
  const upper:     unique symbol;
  // </SYMBOLS>
  
  // Typing only
  const iden: unique symbol; // associate types with their *direct* constructor
  
  interface JSON { parse: (val: Buffer) => any };

  interface ProtoWithSymbols {
    [add]:      undefined
    [at]:       undefined
    [assert]:   undefined
    [bind]:     undefined
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
    [assert]: {
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
  
  interface ArrayConstructor {};
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
    [add]:   <TT extends T>(val: TT) => TT,
    [rem]:   <TT extends T>(val: TT) => void,
    [count]: () => number,
    [empty]: (this: any[]) => this is never[],
    [toObj]: <Fn extends (v: T, n: number) => Skip | readonly [string, any], R = Exclude<ReturnType<Fn>, Skip>>(fn: Fn) => { [K in R[0]]: R[1] },
    [find]:  (fn: (val: T, n: number) => any) => ({ found: true, val: T, ind: number } | { found: false, val: null, ind: null }),
    [group]: <G extends string>(fn: (v: T) => Skip | G) => { [K in G]?: T[] }
  };
  
  interface FunctionConstructor {};
  interface Function extends ProtoWithSymbols {
    [iden]: 'fnc',
    [bind]: {
      <
        Fn extends (...args: any[]) => any,
        To
      >(
        this: Fn,
        to: To
      ): ((...args: Parameters<Fn> extends [ infer A0, ...infer AM ] ? AM : never) => ReturnType<Fn>)
    }
  };
  
  interface NumberConstructor {
    [int32]: number
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
  
  interface ObjectConstructor {};
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
        k: K,
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
    [count]: {
      <O extends Obj>(this: O): number,
    },
    [group]: {
      <O extends Obj, G extends string>(fn: (v: T) => Skip | G): { [K in G]?: Optional<O> }
    },
    [Symbol.iterator]: {
      <O extends Obj>(this: O): Iterator<[ ObjKeys<O>, ObjVals<O> ]>
    },
    $$inspect: <V>(this: V) => { v: V }
  };
  
  interface PromiseConstructor {
    [allArr]: PromiseConstructor['all'],
    [allObj]: <O extends { [K: keyof any]: Promise<any> }>(obj: O) => { [K in keyof O]: Awaited<O[K]> },
    [later]: <T=void>() => PromiseLater<T>
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
    [base32]:    string,
    [base36]:    string,
    [base62]:    string,
    [base64]:    string,
    [base64Std]: string,
    [baseline]:  (str: string) => string,
    [charset]:   (str: string) => CharSet,
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

