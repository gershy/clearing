# Clearing

Ok Bob, give them the analogy.

Bob:

> Javascript is... a dense forest. And you... want to pitch your tent somewhere. You just need a
friendly plot of flat earth, to use as a home base, so you can move on to follow your dreams. You
search through the dense forest, looking for... a *clearing*.

Thanks Bob that's plenty.

The clearing module gives you all the features any sane person would want to see in javascript.

## Basic bootstrapping

Clearing uses an unorthodox (controversial??) technique to achieve a lot of convenience.
Functionality is added by extending native classes and prototypes with _non-enumerable_, _Symbol_ properties like so:

```ts
const coolNewHelper = Symbol();
Object.defineProperty(Object.prototype, coolNewHelper, { enumerable: false, value: function() {
  return Object.keys(this).map(key => key.toUpperCase());
}});

const obj = { a: 1, b: 2, c: 3 };
console.log(obj[coolNewHelper]());
```

Extending native classes and prototypes is kind of crazy, but only doing so with non-enumerable,
Symbol properties maintains compatibility with the vast majority of npm modules. Oh there's one
more thing - the symbols used to extend functionality are set in the global scope, so they are
always globally available.

## `Object` extensions

There are currently no extensions on the `Object` class.

## `Object.prototype` extensions

### `Object.prototype[at]`

References a potentially nested own property.

```ts
const obj = { a: { b: { c: 'z' } } };
console.log(obj[at]([ 'a', 'b', 'c' ])); // "z"
```

A default value can be supplied if nested lookup finds nothing.

```ts
const obj = { a: { b: { c: 'z' } } };
console.log(obj[at]([ 'missing' ], 'default'));        // "default"
console.log(obj[at]([ 'a', 'lol', 'c' ], 'default'));  // "default"
console.log(obj[at]([ 'a', 'b', 'haha' ], 'default')); // "default"
```

### `Object.prototype[count]`

Returns the number of own properties in an object.

```ts
console.log({}[count]());                   // 0
console.log({ a: 1, b: 2 }[count]());       // 2
console.log({ a: 1, b: 2, c: 3 }[count]()); // 3
```

### `Object.prototype[empty]`

Returns whether an object has any properties.

```ts
console.log({}[empty]());       // true
console.log({ a: 1 }[empty]()); // false
```

### `Object.prototype[group]`

Splits an object into sub-object groups based on a function returning group names.

```ts
const obj = { a: 1, b: 10, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9, j: 2 };

console.log(obj[group](n => {
  if (n < 4) return 'small';
  if (n < 8) return 'medium';
  return 'big';
});

/*
{
  small:  { a: 1, c: 3, j: 2 },
  medium: { d: 4, e: 5, f: 6, g: 7 },
  big:    { b: 10, h: 8, i: 9 }
}
*/
```

### `Object.prototype[has]`

Determines own property existence.

```ts
const obj = { a: 1, b: 2 };
console.log(obj[has]('a')); // true
console.log(obj[has]('b')); // true
console.log(obj[has]('z')); // false
```

### `Object.prototype[map]`

Maps over object values, returning a new object. Return `skip` to omit a property.

```ts
const { skip } = clearing;
const obj = { a: 1, b: 2, c: 3 };
console.log(obj[map](v => v * 2));            // { a: 2, b: 4, c: 6 }
console.log(obj[map](v => v > 1 ? v : skip)); // { b: 2, c: 3 }
```

### `Object.prototype[mapk]`

Maps over object entries returning `[key, value]` pairs to construct a new object; allows remapping
keys.

```ts
const obj = { a: 1, b: 2 };
console.log(obj[mapk]((v, k) => [ k.toUpperCase(), v * 10 ])); // { A: 10, B: 20 }
```

### `Object.prototype[merge]`

Deep merges another object into `this` (mutates in place). Use `clearing.skip` for deletion.

```ts

const obj = { a: 1, b: { c: 2, d: 3 } };
obj[merge]({ b: { c: 100 }, e: 4 });
console.log(obj); // { a: 1, b: { c: 100, d: 3 }, e: 4 }

// Deleting properties
const { skip } = clearing;
obj[merge]({ a: skip });
console.log(obj); // { b: { c: 100, d: 3 }, e: 4 }
```

### `Object.prototype[slash]`

Returns a copy of the object with specified keys removed/omitted.

```ts
const obj = { a: 1, b: 2, c: 3, d: 4 };
console.log(obj[slash]([ 'b', 'd' ])); // { a: 1, c: 3 }
```

### `Object.prototype[slice]`

Returns a copy of the object containing only the specified keys.

```ts
const obj = { a: 1, b: 2, c: 3, d: 4 };
console.log(obj[slice]([ 'b', 'd' ])); // { b: 2, d: 4 }
```

### `Object.prototype[toArr]`

Converts an object to an array by mapping over its entries.

```ts
const obj = { a: 1, b: 2, c: 3 };
console.log(obj[toArr]((v, k) => `${k}=${v}`)); // [ 'a=1', 'b=2', 'c=3' ]
```

### `Object.prototype[Symbol.iterator]`

Makes objects iterable, yielding `[key, value]` pairs.

```ts
const obj = { a: 1, b: 2 };
for (const [ k, v ] of obj) console.log(k, v);
// "a" 1
// "b" 2
```

## `Array` extensions

There are currently no extensions on the `Array` class.

## `Array.prototype` extensions

### `Array.prototype[add]`

Pushes an item onto the array and returns that item.

```ts
const arr = [ 1, 2, 3 ];
const added = arr[add](4);
console.log(added); // 4
console.log(arr);   // [ 1, 2, 3, 4 ]
```

### `Array.prototype[count]`

Returns the length of the array.

```ts
console.log([ 1, 2, 3 ][count]()); // 3
console.log([][count]());          // 0
```

### `Array.prototype[empty]`

Returns whether the array has no elements.

```ts
console.log([][empty]());          // true
console.log([ 1, 2, 3 ][empty]()); // false
```

### `Array.prototype[find]`

Finds an element matching a predicate, returning `{ found, val, ind }`.

```ts
const arr = [ 10, 20, 30, 40 ];

const result = arr[find](v => v > 25);
console.log(result); // { found: true, val: 30, ind: 2 }

const missing = arr[find](v => v > 100);
console.log(missing); // { found: false, val: null, ind: null }
```

### `Array.prototype[group]`

Splits an array into sub-arrays based on a function returning group names.

```ts
const arr = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ];

console.log(arr[group](n => {
  if (n < 4) return 'small';
  if (n < 8) return 'medium';
  return 'big';
}));

/*
{
  small:  [ 1, 2, 3 ],
  medium: [ 4, 5, 6, 7 ],
  big:    [ 8, 9, 10 ]
}
*/
```

### `Array.prototype[has]`

Checks if an array includes a value.

```ts
console.log([ 1, 2, 3 ][has](2)); // true
console.log([ 1, 2, 3 ][has](5)); // false
```

### `Array.prototype[map]`

Maps over array values. Return `clearing.skip` to omit an element (filter + map in one).

```ts
const arr = [ 1, 2, 3, 4, 5 ];
console.log(arr[map](v => v * 2)); // [ 2, 4, 6, 8, 10 ]

const { skip } = clearing;
console.log(arr[map](v => v > 2 ? v * 10 : skip)); // [ 30, 40, 50 ]
```

### `Array.prototype[rem]`

Removes the first occurrence of a value from the array (mutates in place).

```ts
const arr = [ 1, 2, 3, 2, 4 ];
arr[rem](2);
console.log(arr); // [ 1, 3, 2, 4 ]
```

### `Array.prototype[toObj]`

Converts an array to an object by mapping each element to a `[key, value]` pair.

```ts
const arr = [ 'a', 'b', 'c' ];
console.log(arr[toObj]((v, i) => [ v, i ])); // { a: 0, b: 1, c: 2 }
```

## `String` extensions

### `String[baseline]`

Allows writing coherent multiline strings with predictable indentation.

```ts
const text = (() => {
  
  return (() => {
    
    return (() => {
      
      return String[baseline](`
        | Even though this text is in an indented scope, it will have predictable indentation.
        | 
        | This is achieved by using the pipe ("|") character plus a space as a delimiter for
        | every line.
        | 
        | You can also pass a 2nd argument to String[baseline] to change the delimiter.
        | 
        | Thanks for your attention :)
      `);
      
    })();
    
  })();
  
})();
```

### `String[base32]`, `String[base36]`, `String[base62]`, `String[base64Url]`, `String[base64Std]`

Character sets for encoding/decoding numbers to strings.

```ts
console.log(String[base32]);    // '0123456789abcdefghijklmnopqrstuv'
console.log(String[base36]);    // '0123456789abcdefghijklmnopqrstuvwxyz'
console.log(String[base62]);    // '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
console.log(String[base64Url]); // '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_'
console.log(String[base64Std]); // '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/'
```

## `String.prototype` extensions

### `String.prototype[code]`

Returns the character code at a given index (default 0).

```ts
console.log('A'[code]());  // 65
console.log('AB'[code](1)); // 66
```

### `String.prototype[count]`

Returns the length of the string.

```ts
console.log('hello'[count]()); // 5
console.log(''[count]());      // 0
```

### `String.prototype[cut]`

Splits a string by a delimiter with a maximum number of cuts.

```ts
console.log('a:b:c:d:e'[cut](':'));    // [ 'a', 'b:c:d:e' ]
console.log('a:b:c:d:e'[cut](':', 2)); // [ 'a', 'b', 'c:d:e' ]
console.log('a:b:c:d:e'[cut](':', Infinity)); // [ 'a', 'b', 'c', 'd', 'e' ]
```

### `String.prototype[has]`

Checks if a string contains a substring.

```ts
console.log('hello world'[has]('world')); // true
console.log('hello world'[has]('xyz'));   // false
```

### `String.prototype[hasHead]`

Checks if a string starts with a given prefix.

```ts
console.log('hello world'[hasHead]('hello')); // true
console.log('hello world'[hasHead]('world')); // false
```

### `String.prototype[hasTail]`

Checks if a string ends with a given suffix.

```ts
console.log('hello world'[hasTail]('world')); // true
console.log('hello world'[hasTail]('hello')); // false
```

### `String.prototype[indent]`

Indents each line of a string.

```ts
const text = 'line1\nline2\nline3';

console.log(text[indent]());       // 2 spaces (default)
console.log(text[indent](4));      // 4 spaces
console.log(text[indent](2, '-')); // '--' prefix
console.log(text[indent]('>>> ')); // custom prefix
```

### `String.prototype[lower]`

Converts the string to lowercase.

```ts
console.log('HELLO'[lower]()); // 'hello'
```

### `String.prototype[upper]`

Converts the string to uppercase.

```ts
console.log('hello'[upper]()); // 'HELLO'
```

### `String.prototype[padHead]`

Pads the start of the string to a given length.

```ts
console.log('5'[padHead](3, '0')); // '005'
```

### `String.prototype[padTail]`

Pads the end of the string to a given length.

```ts
console.log('5'[padTail](3, '0')); // '500'
```

### `String.prototype[toNum]`

Decodes a string to a BigInt using a given charset.

```ts
console.log('ff'[toNum](String[charset]('0123456789abcdef'))); // 255n
console.log('10'[toNum](String[base62])); // 62n
```

## `Number` extensions

### `Number[int32]`, `Number[int64]`

Constants for 32-bit and 64-bit integer ranges.

```ts
console.log(Number[int32]); // 4294967296 (2^32)
console.log(Number[int64]); // 18446744073709551616 (2^64)
```

## `Number.prototype` extensions

### `Number.prototype[char]`

Converts a character code to its character.

```ts
console.log((65)[char]()); // 'A'
console.log((97)[char]()); // 'a'
```

### `Number.prototype[isInt]`

Returns whether a number is an integer.

```ts
console.log((5)[isInt]());   // true
console.log((5.1)[isInt]()); // false
```

### `Number.prototype[toArr]`

Creates an array of length `n` by mapping over indices.

```ts
console.log((5)[toArr](i => i * 2)); // [ 0, 2, 4, 6, 8 ]
```

### `Number.prototype[toObj]`

Creates an object by mapping over indices, returning `[key, value]` pairs.

```ts
console.log((3)[toObj](i => [ `key${i}`, i * 10 ])); // { key0: 0, key1: 10, key2: 20 }
```

### `Number.prototype[toStr]`

Encodes a number to a string using a given charset.

```ts
console.log((255)[toStr](String[charset]('0123456789abcdef'))); // 'ff'
console.log((62)[toStr](String[base62]));  // '10'
console.log((5)[toStr](String[base62], 4)); // '0005' (padded)
```

### `Number.prototype[Symbol.iterator]`

Makes numbers iterable from 0 to n-1.

```ts
for (const i of 3) console.log(i);
// 0
// 1
// 2

console.log([ ...5 ]); // [ 0, 1, 2, 3, 4 ]
```

### `Number.prototype[bits]`

Yields the bits of a number (least significant first).

```ts
console.log([ ...(13)[bits]() ]); // [ 1, 0, 1, 1 ] (13 is 1101 in binary)
```

## `BigInt.prototype` extensions

### `BigInt.prototype[toStr]`

Same as `Number.prototype[toStr]`, but for BigInt values.

```ts
console.log((1000000000000n)[toStr](String[base62])); // 'bLY38W'
```

## `Function.prototype` extensions

### `Function.prototype[bind]`

Partially applies arguments to a function (like `bind`, but without a `this` context).

```ts
const add = (a, b, c) => a + b + c;
const add10 = add[bind](10);
console.log(add10(5, 3)); // 18
```

## `Error` extensions

### `Error[assert]`

Throws an error if the assertion function returns false.

```ts
Error[assert]({ x: 5, y: 10 }, ({ x, y }) => x < y); // passes
Error[assert]({ x: 10, y: 5 }, ({ x, y }) => x < y); // throws!
```

## `Error.prototype` extensions

### `Error.prototype[mod]`

Modifies an error's message and adds properties. Returns the error for chaining.

```ts
throw Error('something failed')[mod]({ code: 'err99', context: { userId: 123 } });

// Can also modify the message
throw Error('base error')[mod]({ message: 'enhanced message', extra: 'data' });
```

### `Error.prototype[fire]`

Shorthand for `throw error[mod](props)`.

```ts
Error('something failed')[fire]({ code: 'err99' });
```

### `Error.prototype[limn]`

Converts an error (and its cause chain) to a plain, json-serializable object.

```ts
const err = Error('outer')[mod]({ cause: Error('inner') });
console.log(err[limn]());
/*
{
  form: 'Error',
  msg: 'outer',
  trace: [ ... ],
  cause: { form: 'Error', msg: 'inner', trace: [ ... ], cause: null }
}
*/
```

### `Error.prototype[suppress]`

Marks an error (and its causes) as suppressed for custom error handling.

```ts
const err = Error('handled gracefully');
err[suppress]();
console.log(err[Symbol.for('clearing.err.suppressed')]); // true
```

Useful for preventing certain errors from crashing the js process, for example in node.js:
```ts
process.on('unhandledException', err => {
  
  // Ignore suppressed errors
  if (err[Symbol.for('clearing.err.suppressed')]) return;
  
  console.log('Fatal error!');
  process.exit(1);
  
});
```

## `Promise` extensions

### `Promise[allArr]`

Alias for `Promise.all`.

```ts
const results = await Promise[allArr]([ fetch('/a'), fetch('/b'), fetch('/c') ]);
```

### `Promise[allObj]`

Like `Promise.all`, but for an object of promises, returning an object of results.

```ts
const results = await Promise[allObj]({
  user: fetchUser(),
  posts: fetchPosts(),
  comments: fetchComments()
});
console.log(results.user, results.posts, results.comments);
```

### `Promise[later]`

Creates a promise with externally accessible `resolve` and `reject` functions.

```ts
const p = Promise[later]();

setTimeout(() => p.resolve('done!'), 1000);

console.log(await p); // 'done!'
```

## `Set.prototype` extensions

### `Set.prototype[count]`

Returns the size of the set.

```ts
console.log(new Set([ 1, 2, 3 ])[count]()); // 3
```

### `Set.prototype[empty]`

Returns whether the set is empty.

```ts
console.log(new Set()[empty]());          // true
console.log(new Set([ 1 ])[empty]()); // false
```

### `Set.prototype[find]`

Finds an element matching a predicate, returning `{ found, val }`.

```ts
const s = new Set([ 10, 20, 30 ]);
console.log(s[find](v => v > 15)); // { found: true, val: 20 }
```

### `Set.prototype[map]`

Maps over set values to produce an array.

```ts
const s = new Set([ 1, 2, 3 ]);
console.log(s[map](v => v * 2)); // [ 2, 4, 6 ]
```

### `Set.prototype[rem]`

Removes a value from the set.

```ts
const s = new Set([ 1, 2, 3 ]);
s[rem](2);
console.log([ ...s ]); // [ 1, 3 ]
```

### `Set.prototype[toArr]`

Converts a set to an array by mapping over its values.

```ts
const s = new Set([ 1, 2, 3 ]);
console.log(s[toArr](v => v * 10)); // [ 10, 20, 30 ]
```

### `Set.prototype[toObj]`

Converts a set to an object by mapping each value to a `[key, value]` pair.

```ts
const s = new Set([ 'a', 'b', 'c' ]);
console.log(s[toObj](v => [ v, v.toUpperCase() ])); // { a: 'A', b: 'B', c: 'C' }
```

## `Map.prototype` extensions

### `Map.prototype[add]`

Alias for `Map.prototype.set` (for consistency with Set).

```ts
const m = new Map();
m[add]('key', 'value');
```

### `Map.prototype[count]`

Returns the size of the map.

```ts
const m = new Map([ [ 'a', 1 ], [ 'b', 2 ] ]);
console.log(m[count]()); // 2
```

### `Map.prototype[empty]`

Returns whether the map is empty.

```ts
console.log(new Map()[empty]());               // true
console.log(new Map([ [ 'a', 1 ] ])[empty]()); // false
```

### `Map.prototype[find]`

Finds an entry matching a predicate, returning `{ found, val, key }`.

```ts
const m = new Map([ [ 'a', 10 ], [ 'b', 20 ], [ 'c', 30 ] ]);
console.log(m[find](v => v > 15)); // { found: true, val: 20, key: 'b' }
```

### `Map.prototype[map]`

Maps entries to produce an object; iterator receives `(val, key)` and returns `[key, val]`.

```ts
const m = new Map([ [ 'a', 1 ], [ 'b', 2 ] ]);
console.log(m[map]((v, k) => [ k.toUpperCase(), v * 10 ])); // { A: 10, B: 20 }
```

### `Map.prototype[rem]`

Removes an entry from the map by key.

```ts
const m = new Map([ [ 'a', 1 ], [ 'b', 2 ] ]);
m[rem]('a');
console.log(m[count]()); // 1
```

### `Map.prototype[toArr]`

Converts a map to an array by mapping over its entries.

```ts
const m = new Map([ [ 'a', 1 ], [ 'b', 2 ] ]);
console.log(m[toArr]((v, k) => `${k}=${v}`)); // [ 'a=1', 'b=2' ]
```

### `Map.prototype[toObj]`

Converts a map to an object by mapping over its entries.

```ts
const m = new Map([ [ 'a', 1 ], [ 'b', 2 ] ]);
console.log(m[toObj]((v, k) => [ k, v * 100 ])); // { a: 100, b: 200 }
```