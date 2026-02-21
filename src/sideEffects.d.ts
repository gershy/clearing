declare global {

  // Util
  type Fn<A extends any[] = any[], T = any> = (...args: A) => T;
  type Obj<V = any> = { [k: string]: V };
  
  // Differentiate between "map" and "rec" ("record") - maps have arbitrary keys; recs have fixed keys
  type ObjMode<O extends { [K: string]: any }> = O extends { [K in infer KK]: any } ? (string extends KK ? 'map' : 'rec') : never;
  type ObjKeys<O extends Obj> = Extract<keyof O, string> | `${Extract<keyof O, number>}`; // Convert numbers to strings; ignores symbols
  type ObjVals<O extends Obj> = O[Extract<keyof O, string>];
  
  type Json = null | boolean | number | string | Json[] | { [K: string]: Json };
  type Skip = undefined;
  type SkipNever<V> = V extends Skip ? Skip extends V ? never : V : V;
  
  type Dive<O extends Obj, K extends readonly string[], D = undefined> =
    K extends [ infer K0 extends string, ...infer KM extends string[] ]
      ? K0 extends keyof O
        ? (ObjMode<O> extends 'map' ? D : never) | Dive<O[K0], KM, D>
        : D
      : O;
  
  type CharSet = {
    str: string,
    size: bigint,
    charVal: (c: string) => bigint,
    valChar: (n: bigint) => string
  };
  
  // <SYMBOLS> :: declarations :: /const ([a-zA-Z0-9]+)[ ]*[:][ ]*unique symbol;/
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
  
  // Adding symbol properties to Object.prototype will cause typescript to think these properties
  // are also available for extending types, e.g. Array - to avoid this we merge in an object which
  // defines every symbol as `undefined`!
  type SymbolsProto = {
    // <SYMBOLS> :: SymbolsProto :: /\[([a-zA-Z0-9]+)\][ ]*[:][ ]*undefined
    [add]:       undefined,
    [allArr]:    undefined,
    [allObj]:    undefined,
    [at]:        undefined,
    [assert]:    undefined,
    [base32]:    undefined,
    [base36]:    undefined,
    [base62]:    undefined,
    [base64Std]: undefined,
    [base64Url]: undefined,
    [baseline]:  undefined,
    [bind]:      undefined,
    [bits]:      undefined,
    [char]:      undefined,
    [charset]:   undefined,
    [code]:      undefined,
    [count]:     undefined,
    [cut]:       undefined,
    [dive]:      undefined,
    [empty]:     undefined,
    [find]:      undefined,
    [fire]:      undefined,
    [group]:     undefined,
    [has]:       undefined,
    [hasHead]:   undefined,
    [hasTail]:   undefined,
    [indent]:    undefined,
    [int32]:     undefined,
    [int64]:     undefined,
    [isInt]:     undefined,
    [later]:     undefined,
    [limn]:      undefined,
    [lower]:     undefined,
    [map]:       undefined,
    [mapk]:      undefined,
    [merge]:     undefined,
    [mod]:       undefined,
    [padHead]:   undefined,
    [padTail]:   undefined,
    [rem]:       undefined,
    [slash]:     undefined,
    [slice]:     undefined,
    [suppress]:  undefined,
    [toArr]:     undefined,
    [toNum]:     undefined,
    [toObj]:     undefined,
    [toStr]:     undefined,
    [upper]:     undefined
    // </SYMBOLS>
  };
  
  interface ErrorConstructor {
    [assert]: <V = any>(args: V, fn: (args: V) => boolean) => void
  }
  interface Error extends SymbolsProto {
    [mod]:      (props: { [K: string]: any }) => Error,
    [fire]:     (props?: { [K: string]: any }) => never,
    [suppress]: () => Error,
    [limn]: (seen?: Map<any, any>) => (Obj<Json> & {
      form: string,
      msg: string,
      trace: string[],
      cause: null | ReturnType<Error[typeof limn]>
    })
  }
  
  interface ArrayConstructor {}
  interface Array<T> extends SymbolsProto {
    [has]: (val: unknown) => boolean,
    [map]: <Fn extends (v: T, i: number) => any>(fn: Fn) => Exclude<ReturnType<Fn>, Skip>[],
    [add]: <TT extends T>(val: TT) => TT,
    [rem]: <TT extends T>(val: TT) => void,
    [count]: () => number,
    [empty]: () => boolean,
    [toObj]: <R extends readonly [string, any]>(fn: (v: T, n: number) => Skip | R) => { [K: string]: any },
    [find]: (fn: (val: T, n: number) => any) => ({ found: true, val: T, ind: number } | { found: false, val: null, ind: null }),
    [group]: <G extends string>(fn: (v: T) => Skip | G) => { [K in G]?: T[] }
  }
  
  interface FunctionConstructor {}
  interface Function extends SymbolsProto {
    [bind]: <Fn extends (...args: any[]) => any, To>(this: Fn, to: To) => ((...args: Parameters<Fn> extends [ infer A0, ...infer AM ] ? AM : never) => ReturnType<Fn>)
  }
  
  interface NumberConstructor {
    [int32]: number,
    [int64]: number
  }
  interface Number extends SymbolsProto {
    [char]: () => string,
    [isInt]: () => boolean,
    [toStr]: (str: string | CharSet, len?: number) => string,
    [toArr]: <T>(fn: (n: number) => T) => T[],
    [toObj]: <R extends readonly [string, any]>(fn: (n: number) => Skip | R) => { [K: string]: any },
    [bits]: () => Generator<number>,
    [Symbol.iterator]: () => Generator<number>
  }
  
  interface BigIntConstructor {}
  interface BigInt extends SymbolsProto {
    [toStr]: (str: string | CharSet, len?: number) => string
  }
  
  interface ObjectConstructor {}
  interface Object {
    [empty]: () => boolean,
    [at]: <O extends Obj, K extends string | string[], D extends any = undefined>(this: O, k: K, def?: D) => Dive<O, K extends string[] ? K : [ K ], D>,
    [has]: <O extends Obj>(this: O, k: unknown) => k is keyof O,
    [map]: <O extends Obj, Fn extends (v: ObjVals<O>, k: ObjKeys<O>) => any>(this: O, fn: Fn) => { [K in keyof O]: Exclude<ReturnType<Fn>, Skip> },
    [mapk]: <O extends Obj, Fn extends (v: O[keyof O], k: ObjKeys<O>) => undefined | [ string, any ]>(this: O, fn: Fn) => { [K: string]: any },
    [merge]: <O1 extends Obj, O2 extends Obj>(this: O1, val: O2) => O1 & O2,
    [slice]: <O extends Obj, K extends readonly (keyof O)[]>(this: O, keys: K) => { [P in K[number]]: SkipNever<O[P]> },
    [slash]: <O extends Obj, T extends readonly (keyof O)[]>(this: O, keys: T) => { [K in keyof O as Exclude<keyof O, T[number]>]: O[K] },
    [toArr]: <O extends Obj, Fn extends (v: O[keyof O], k: ObjKeys<O>) => any>(this: O, fn: Fn) => Exclude<ReturnType<Fn>, Skip>[],
    [count]: () => number,
    [group]: <O extends Obj, G extends string>(this: O, fn: (v: O[keyof O]) => Skip | G) => { [K in G]?: Partial<O> },
    [Symbol.iterator]: <O extends Obj>(this: O) => Iterator<[ ObjKeys<O>, ObjVals<O> ]>
  }
  
  interface PromiseConstructor {
    [allArr]: PromiseConstructor['all'],
    [allObj]: <O extends { [K: string]: Promise<any> }>(obj: O) => Promise<{ [K in keyof O]: Awaited<O[K]> }>,
    [later]: <T=void>() => PromiseLater<T>
  }
  interface Promise<T> {}
  interface PromiseLater<T=void> extends Promise<T> {
    resolve: T extends void ? () => void : (v: T) => void,
    reject: (err: any) => void
  }
  
  interface SetConstructor {}
  interface Set<T> extends SymbolsProto {
    [count]: () => number,
    [empty]: () => boolean,
    [find]: (fn: (val: T) => any) => ({ found: true, val: T } | { found: false, val: null }),
    [map]: <V>(fn: (val: T, ind: number) => V) => Exclude<V, Skip>[],
    [toArr]: <V>(fn: (val: T, ind: number) => V) => Exclude<V, Skip>[],
    [toObj]: <R extends readonly [string, any]>(fn: (val: T) => Skip | R) => { [K: string]: any },
    [rem]: (val: T) => void
  }

  interface MapConstructor {}
  interface Map<K, V> extends SymbolsProto {
    [add]: (k: K, v: V) => void,
    [count]: () => number,
    [empty]: () => boolean,
    [find]: (fn: (val: V, key: K) => any) => ({ found: true, val: V, key: K } | { found: false, val: null, key: null }),
    [map]: <T>(fn: (val: V, key: K) => Skip | readonly [string, any]) => { [Key: string]: any },
    [toArr]: <T>(fn: (val: V, key: K) => T) => Exclude<T, Skip>[],
    [toObj]: <T>(fn: (val: V, key: K) => Skip | readonly [string, any]) => { [Key: string]: any },
    [rem]: (key: K) => void
  }

  interface StringConstructor {
    [base32]:    string,
    [base36]:    string,
    [base62]:    string,
    [base64Url]: string,
    [base64Std]: string,
    [baseline]:  (str: string) => string,
    [charset]:   (str: string) => CharSet,
  }
  interface String extends SymbolsProto {
    [code]: (ind?: number) => number,
    [count]: () => number,
    [has]: (s: string) => boolean,
    [padHead]: (n: number, s?: string) => string,
    [padTail]: (n: number, s?: string) => string,
    [toNum]: (chrs: string | CharSet) => bigint,
    [hasHead]: <H extends string>(this: string, head: H) => this is `${H}${string}`,
    [hasTail]: <T extends string>(this: string, tail: T) => this is `${string}${T}`,
    [upper]: <S extends string>(this: S) => Uppercase<S>,
    [lower]: <S extends string>(this: S) => Lowercase<S>,
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
  }

}

export {};

