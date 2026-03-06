import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertEqual } from '../build/utils.test.ts';
import './main.ts';

// Type testing
(async () => {
  
  type Enforce<Provided, Expected extends Provided> = { provided: Provided, expected: Expected };
  
  type Tests = {
    
    1: Enforce<
      Dive<{ a: { b: { c: 'xyz' } } }, []>,
      { a: { b: { c: 'xyz' } } }
    >,
    
    2: Enforce<
      Dive<{ a: { b: { c: 'xyz' } } }, [ 'a', 'b', 'c' ]>,
      'xyz'
    >,

    3: Enforce<
      Dive<{ a: { b: { c: 'xyz' } } }, [ 'a', 'b' ]>,
      { c: 'xyz' }
    >,

    4: Enforce<
      Dive<{ a: { b: { c: 'xyz' } } }, [ 'a', 'b', 'd' ]>,
      undefined
    >,

    5: Enforce<
      Dive<{ a: { b: { c: 'xyz' } } }, [ 'a', 'c', 'b' ]>,
      undefined
    >
    
  };
  
})();

// Enforce symbol alignment for sideEffects.d.ts vs main.ts - typescript doesn't seem up to it!
(async () => {
  
  await (async () => {
    
    const getSymbolSets = function*(str: string) {
      
      let lines = str.split('\n');
      while (true) {
        
        const ind0 = lines.findIndex(ln => ln.includes('<SYMBOLS>'));
        const ind1 = lines.findIndex(ln => ln.includes('</SYMBOLS>'));
        
        if (ind0 === -1) break;
        
        const split = lines[ind0].split('::');
        const location = split[1].trim();
        const regBody = split[2].trim().slice('/'.length, -'/'.length);
        const symLines = lines.slice(ind0 + 1, ind1);
        lines = lines.slice(ind1 + 1);
        
        const reg = new RegExp(regBody);
        yield {
          location,
          lines: symLines
            .map(line => {
              
              line = line.trim();
              if (!line) return null;
              
              const match = line.match(reg);
              if (!match) throw Object.assign(Error('bad symbol line'), { fp, reg, line });
              
              return match[1];
              
            })
            .filter(ln => !!ln) as string[]
        };
        
      }
      
    };
    
    const fp = dirname(fileURLToPath(import.meta.url));
    const fileDataArr = await Promise.all(
      [ 'sideEffects.d.ts', 'main.ts' ]
        .map(fd => readFile(join(fp, fd), 'utf8'))
    );
    const symSets = fileDataArr.map(fileData => [ ...getSymbolSets(fileData) ]).flat(1);
    
    const maxLen = Math.max(...symSets.map(symSet => symSet.lines.length));
    for (const symSet of symSets)
      while (symSet.lines.length < maxLen)
        symSet.lines.push('<end of syms>');
    
    for (let i = 0; i < maxLen; i++) {
      
      const syms = symSets.map(symSet => symSet.lines[i]);
      if (!syms.every(sym => sym === syms[0]))
        throw Object.assign(Error('symbol mismatch'), {
          index: i,
          syms: symSets.map(symSet => ({ location: symSet.location, sym: symSet.lines[i] }))
        });
      
    }
    
  })();
  
})();

// Test cases
(async () => {
  
  const cases = [
    
    // Object
    
    {
      name: 'Object.prototype[at]',
      fn: async () => {
        
        const obj0 = { a: { b: { c: 'z' } } };
        
        const v0 = obj0[at]([ 'a', 'b' ] as const);
        if (v0 !== obj0.a.b) throw Error('failed');
        
        const v1 = obj0[at]([ 'a', 'b', 'c', 'd' ]);
        if (v1 !== undefined) throw Error('failed');
        
        const v2 = obj0[at]([ 'z' ]);
        if (v2 !== undefined) throw Error('failed');
        
        const obj1 = {};
        const v3 = obj1[at]([]);
        if (v3 !== obj1) throw Error('failed');
        
        const v4 = obj1[at]([ 'a' ]);
        if (v4 !== undefined) throw Error('failed');
        
        const v5 = obj1[at]([ 'a' ], 'hihi');
        if (v5 !== 'hihi') throw Error('failed');
        
      }
    },
    
    {
      name: 'Object.prototype[count]',
      fn: async () => {
        if (({})[count]() !== 0) throw Error('failed');
        if (({ a: 1, b: 2 })[count]() !== 2) throw Error('failed');
      }
    },
    
    {
      name: 'Object.prototype[empty]',
      fn: async () => {
        if (({})[empty]() !== true) throw Error('failed');
        if (({ a: 1 })[empty]() !== false) throw Error('failed');
      }
    },
    
    {
      name: 'Object.prototype[group]',
      fn: async () => {
        const obj = { a: 1, b: 10, c: 3 };
        const grouped = obj[group](n => n < 5 ? 'small' : 'big');
        assertEqual(grouped, { small: { a: 1, c: 3 }, big: { b: 10 } });
      }
    },
    
    {
      name: 'Object.prototype[has]',
      fn: async () => {
        const obj = { a: 1 };
        if (!obj[has]('a')) throw Error('failed');
        if (obj[has]('b')) throw Error('failed');
      }
    },
    
    {
      name: 'Object.prototype[map]',
      fn: async () => {
        const obj = { a: 1, b: 2 };
        const mapped = obj[map](v => v * 2);
        assertEqual(mapped, { a: 2, b: 4 });
      }
    },
    
    {
      name: 'Object.prototype[mapk]',
      fn: async () => {
        const obj = { a: 1, b: 2 };
        const mapped = obj[mapk]((v, k) => [ k.toUpperCase(), v * 10 ]);
        assertEqual(mapped, { A: 10, B: 20 });
      }
    },
    
    {
      name: 'Object.prototype[merge]',
      fn: async () => {
        const obj: any = { a: 1, b: { c: 2 } };
        obj[merge]({ b: { d: 3 }, e: 4 });
        if (obj.b.c !== 2 || obj.b.d !== 3 || obj.e !== 4) throw Error('failed');
      }
    },
    
    {
      name: 'Object.prototype[slash]',
      fn: async () => {
        const obj = { a: 1, b: 2, c: 3 };
        const slashed = obj[slash]([ 'b' ]);
        assertEqual(slashed, { a: 1, c: 3 });
      }
    },
    
    {
      name: 'Object.prototype[slice]',
      fn: async () => {
        const obj = { a: 1, b: 2, c: 3 };
        const sliced = obj[slice]([ 'a', 'c' ]);
        assertEqual(sliced, { a: 1, c: 3 });
      }
    },
    
    {
      name: 'Object.prototype[toArr]',
      fn: async () => {
        const obj = { a: 1, b: 2 };
        const arr = obj[toArr]((v, k) => `${k}=${v}`);
        assertEqual(arr, [ 'a=1', 'b=2' ]);
      }
    },
    
    {
      name: 'Object.prototype[Symbol.iterator]',
      fn: async () => {
        const obj = { a: 1, b: 2 };
        const entries: [string, number][] = [];
        for (const entry of obj) entries.push(entry as [string, number]);
        if (entries.length !== 2) throw Error('failed');
      }
    },
    
    // Array
    
    {
      name: 'Array.prototype[add]',
      fn: async () => {
        const arr = [ 1, 2 ];
        const added = arr[add](3);
        if (added !== 3 || arr.length !== 3) throw Error('failed');
      }
    },
    
    {
      name: 'Array.prototype[count]',
      fn: async () => {
        if ([ 1, 2, 3 ][count]() !== 3) throw Error('failed');
        if (([] as any[])[count]() !== 0) throw Error('failed');
      }
    },
    
    {
      name: 'Array.prototype[empty]',
      fn: async () => {
        if (([] as any[])[empty]() !== true) throw Error('failed');
        if ([ 1 ][empty]() !== false) throw Error('failed');
      }
    },
    
    {
      name: 'Array.prototype[find]',
      fn: async () => {
        const arr = [ 10, 20, 30 ];
        const result = arr[find](v => v > 15);
        if (!result.found || result.val !== 20 || result.ind !== 1) throw Error('failed');
        
        const missing = arr[find](v => v > 100);
        if (missing.found) throw Error('failed missing');
      }
    },
    
    {
      name: 'Array.prototype[group]',
      fn: async () => {
        const arr = [ 1, 2, 3, 4, 5 ];
        const grouped = arr[group](n => n < 3 ? 'small' : 'big');
        assertEqual(grouped, { small: [ 1, 2 ], big: [ 3, 4, 5 ] });
      }
    },
    
    {
      name: 'Array.prototype[has]',
      fn: async () => {
        if (![ 1, 2, 3 ][has](2)) throw Error('failed');
        if ([ 1, 2, 3 ][has](5)) throw Error('failed');
      }
    },
    
    {
      name: 'Array.prototype[map]',
      fn: async () => {
        const arr = [ 1, 2, 3 ];
        const mapped = arr[map](v => v * 2);
        assertEqual(mapped, [ 2, 4, 6 ]);
      }
    },
    
    {
      name: 'Array.prototype[rem]',
      fn: async () => {
        const arr = [ 1, 2, 3, 2 ];
        arr[rem](2);
        if (arr.length !== 3 || arr[0] !== 1 || arr[1] !== 3) throw Error('failed');
      }
    },
    
    {
      name: 'Array.prototype[toObj]',
      fn: async () => {
        const arr = [ 'a', 'b', 'c' ];
        const obj = arr[toObj]((v, i) => [ v, i ]);
        assertEqual(obj, { a: 0, b: 1, c: 2 });
      }
    },
    
    // String
    
    {
      name: 'String[baseline]',
      fn: async () => {
        const result = String[baseline](`
          | line1
          | line2
        `);
        if (!result.includes('line1') || !result.includes('line2')) throw Error('failed');
      }
    },
    
    {
      name: 'String[charset]',
      fn: async () => {
        const hex = String[charset]('0123456789abcdef');
        if (hex.size !== 16n) throw Error('failed size');
        if (hex.charVal('a') !== 10n) throw Error('failed charVal');
        if (hex.valChar(15n) !== 'f') throw Error('failed valChar');
      }
    },
    
    {
      name: 'String.prototype[code]',
      fn: async () => {
        if ('A'[code]() !== 65) throw Error('failed');
        if ('AB'[code](1) !== 66) throw Error('failed');
      }
    },
    
    {
      name: 'String.prototype[count]',
      fn: async () => {
        if ('hello'[count]() !== 5) throw Error('failed');
        if (''[count]() !== 0) throw Error('failed');
      }
    },
    
    {
      name: 'String.prototype[cut]',
      fn: async () => {
        const result = 'a:b:c:d'[cut](':');
        if (result[0] !== 'a' || result[1] !== 'b:c:d') throw Error('failed');
        
        const result2 = 'a:b:c:d'[cut](':', 2);
        if (result2[0] !== 'a' || result2[1] !== 'b' || result2[2] !== 'c:d') throw Error('failed 2');
      }
    },
    
    {
      name: 'String.prototype[has]',
      fn: async () => {
        if (!'hello world'[has]('world')) throw Error('failed');
        if ('hello world'[has]('xyz')) throw Error('failed');
      }
    },
    
    {
      name: 'String.prototype[hasHead]',
      fn: async () => {
        if (!'hello'[hasHead]('hel')) throw Error('failed');
        if ('hello'[hasHead]('llo')) throw Error('failed');
      }
    },
    
    {
      name: 'String.prototype[hasTail]',
      fn: async () => {
        if (!'hello'[hasTail]('llo')) throw Error('failed');
        if ('hello'[hasTail]('hel')) throw Error('failed');
      }
    },
    
    {
      name: 'String.prototype[indent]',
      fn: async () => {
        const result = 'line1\nline2'[indent](2);
        if (!result.startsWith('  line1')) throw Error('failed');
      }
    },
    
    {
      name: 'String.prototype[lower]',
      fn: async () => {
        if ('HELLO'[lower]() !== 'hello') throw Error('failed');
      }
    },
    
    {
      name: 'String.prototype[upper]',
      fn: async () => {
        if ('hello'[upper]() !== 'HELLO') throw Error('failed');
      }
    },
    
    {
      name: 'String.prototype[padHead]',
      fn: async () => {
        if ('5'[padHead](3, '0') !== '005') throw Error('failed');
      }
    },
    
    {
      name: 'String.prototype[padTail]',
      fn: async () => {
        if ('5'[padTail](3, '0') !== '500') throw Error('failed');
      }
    },
    
    {
      name: 'String.prototype[toNum]',
      fn: async () => {
        if ('ff'[toNum](String[charset]('0123456789abcdef')) !== 255n) throw Error('failed');
      }
    },
    
    // Number
    
    {
      name: 'Number[int32] / Number[int64]',
      fn: async () => {
        if (Number[int32] !== 2 ** 32) throw Error('failed int32');
        if (Number[int64] !== 2 ** 64) throw Error('failed int64');
      }
    },
    
    {
      name: 'Number.prototype[char]',
      fn: async () => {
        if ((65)[char]() !== 'A') throw Error('failed');
        if ((97)[char]() !== 'a') throw Error('failed');
      }
    },
    
    {
      name: 'Number.prototype[isInt]',
      fn: async () => {
        if (!(5)[isInt]()) throw Error('failed');
        if ((5.5)[isInt]()) throw Error('failed');
      }
    },
    
    {
      name: 'Number.prototype[toArr]',
      fn: async () => {
        const arr = (3)[toArr](i => i * 2);
        assertEqual(arr, [ 0, 2, 4 ]);
      }
    },
    
    {
      name: 'Number.prototype[toObj]',
      fn: async () => {
        const obj = (3)[toObj](i => [ `k${i}`, i * 10 ]);
        assertEqual(obj, { k0: 0, k1: 10, k2: 20 });
      }
    },
    
    {
      name: 'Number.prototype[toStr]',
      fn: async () => {
        const hex = String[charset]('0123456789abcdef');
        if ((255)[toStr](hex) !== 'ff') throw Error('failed');
        if ((5)[toStr](String[base62], 4) !== '0005') throw Error('failed pad');
      }
    },
    
    {
      name: 'Number.prototype[Symbol.iterator]',
      fn: async () => {
        const arr = [ ...3 as any ];
        assertEqual(arr, [ 0, 1, 2 ]);
      }
    },
    
    {
      name: 'Number.prototype[bits]',
      fn: async () => {
        const bitArr = [ ...(13)[bits]() ];
        // 13 = 1101 binary, LSB first = [1, 0, 1, 1]
        assertEqual(bitArr, [ 1, 0, 1, 1 ]);
      }
    },
    
    // BigInt
    
    {
      name: 'BigInt.prototype[toStr]',
      fn: async () => {
        const hex = String[charset]('0123456789abcdef');
        if ((255n)[toStr](hex) !== 'ff') throw Error('failed');
      }
    },
    
    // Function
    
    {
      name: 'Function.prototype[bind]',
      fn: async () => {
        const add = (a: number, b: number, c: number) => a + b + c;
        const add10 = add[bind](10);
        if (add10(5, 3) !== 18) throw Error('failed');
      }
    },
    
    // Error tests
    
    {
      name: 'Error[assert]',
      fn: async () => {
        // Should not throw
        Error[assert]({ x: 5, y: 10 }, ({ x, y }) => x < y);
        
        // Should throw
        let threw = false;
        try {
          Error[assert]({ x: 10, y: 5 }, ({ x, y }) => x < y);
        } catch {
          threw = true;
        }
        if (!threw) throw Error('failed');
      }
    },
    
    {
      name: 'Error.prototype[mod]',
      fn: async () => {
        const err = Error('base')[mod]({ message: 'modified', code: 123 });
        if (err.message !== 'modified' || (err as any).code !== 123) throw Error('failed');
      }
    },
    
    {
      name: 'Error.prototype[fire]',
      fn: async () => {
        let threw = false;
        try {
          Error('test')[fire]({ code: 'ERR' });
        } catch (e: any) {
          threw = true;
          if (e.code !== 'ERR') throw Error('failed code');
        }
        if (!threw) throw Error('failed');
      }
    },
    
    {
      name: 'Error.prototype[limn]',
      fn: async () => {
        const err = Error('test');
        const limned = err[limn]();
        if (limned.msg !== 'test' || limned.form !== 'Error') throw Error('failed');
      }
    },
    
    {
      name: 'Error.prototype[suppress]',
      fn: async () => {
        const err = Error('test')[suppress]();
        if (!err[Symbol.for('@gershy.clearing.err.suppressed')]) throw Error('failed');
      }
    },
    
    // Promise tests
    
    {
      name: 'Promise[allArr]',
      fn: async () => {
        const results = await Promise[allArr]([ Promise.resolve(1), Promise.resolve(2) ]);
        assertEqual(results, [ 1, 2 ]);
      }
    },
    
    {
      name: 'Promise[allObj]',
      fn: async () => {
        const results = await Promise[allObj]({
          a: Promise.resolve(1),
          b: Promise.resolve(2)
        });
        assertEqual(results, { a: 1, b: 2 });
      }
    },
    
    {
      name: 'Promise[later]',
      fn: async () => {
        const p = Promise[later]<string>();
        setTimeout(() => p.resolve('done'), 1);
        const result = await p;
        if (result !== 'done') throw Error('failed');
      }
    },
    
    // Set tests
    
    {
      name: 'Set.prototype[count]',
      fn: async () => {
        if (new Set([ 1, 2, 3 ])[count]() !== 3) throw Error('failed');
      }
    },
    
    {
      name: 'Set.prototype[empty]',
      fn: async () => {
        if (!new Set()[empty]()) throw Error('failed');
        if (new Set([ 1 ])[empty]()) throw Error('failed');
      }
    },
    
    {
      name: 'Set.prototype[find]',
      fn: async () => {
        const s = new Set([ 10, 20, 30 ]);
        const result = s[find](v => v > 15);
        if (!result.found || result.val !== 20) throw Error('failed');
      }
    },
    
    {
      name: 'Set.prototype[map]',
      fn: async () => {
        const s = new Set([ 1, 2, 3 ]);
        const arr = s[map](v => v * 2);
        if (!arr.includes(2) || !arr.includes(4) || !arr.includes(6)) throw Error('failed');
      }
    },
    
    {
      name: 'Set.prototype[rem]',
      fn: async () => {
        const s = new Set([ 1, 2, 3 ]);
        s[rem](2);
        if (s.has(2) || s.size !== 2) throw Error('failed');
      }
    },
    
    {
      name: 'Set.prototype[toArr]',
      fn: async () => {
        const s = new Set([ 1, 2, 3 ]);
        const arr = s[toArr](v => v * 10);
        if (!arr.includes(10) || !arr.includes(20) || !arr.includes(30)) throw Error('failed');
      }
    },
    
    {
      name: 'Set.prototype[toObj]',
      fn: async () => {
        const s = new Set([ 'a', 'b' ]);
        const obj = s[toObj](v => [ v, v.toUpperCase() ]);
        assertEqual(obj, { a: 'A', b: 'B' });
      }
    },
    
    // Map tests
    
    {
      name: 'Map.prototype[count]',
      fn: async () => {
        const m = new Map([ [ 'a', 1 ], [ 'b', 2 ] ]);
        if (m[count]() !== 2) throw Error('failed');
      }
    },
    
    {
      name: 'Map.prototype[empty]',
      fn: async () => {
        if (!new Map()[empty]()) throw Error('failed');
        if (new Map([ [ 'a', 1 ] ])[empty]()) throw Error('failed');
      }
    },
    
    {
      name: 'Map.prototype[find]',
      fn: async () => {
        const m = new Map([ [ 'a', 10 ], [ 'b', 20 ] ]);
        const result = m[find](v => v > 15);
        if (!result.found || result.val !== 20 || result.key !== 'b') throw Error('failed');
      }
    },
    
    {
      name: 'Map.prototype[map]',
      fn: async () => {
        const m = new Map([ [ 'a', 1 ], [ 'b', 2 ] ]);
        const obj = m[map]((v, k) => [ k.toUpperCase(), v * 10 ]);
        assertEqual(obj, { A: 10, B: 20 });
      }
    },
    
    {
      name: 'Map.prototype[rem]',
      fn: async () => {
        const m = new Map([ [ 'a', 1 ], [ 'b', 2 ] ]);
        m[rem]('a');
        if (m.has('a') || m.size !== 1) throw Error('failed');
      }
    },
    
    {
      name: 'Map.prototype[toArr]',
      fn: async () => {
        const m = new Map([ [ 'a', 1 ], [ 'b', 2 ] ]);
        const arr = m[toArr]((v, k) => `${k}=${v}`);
        if (!arr.includes('a=1') || !arr.includes('b=2')) throw Error('failed');
      }
    },
    
    {
      name: 'Map.prototype[toObj]',
      fn: async () => {
        const m = new Map([ [ 'a', 1 ], [ 'b', 2 ] ]);
        const obj = m[toObj]((v, k) => [ k, v * 100 ]);
        assertEqual(obj, { a: 100, b: 200 });
      }
    }
    
  ];
  for (const { name, fn } of cases) {
    
    try {
      
      await fn();
      
    } catch (err: any) {
      
      console.log(`FAILED: "${name}"`, err[limn]());
      process.exit(1);
      
    }
    
  }
  
  console.log(`Passed ${cases.length} test${cases.length === 1 ? '' : 's'}`);
  
})();
