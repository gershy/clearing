(async () => {
  
  const [ { promises: fs }, path ] = [ 'fs', 'path' ].map(v => require(v));
  
  const dir = __dirname;
  const mode = process.argv.at(-1);
  if (mode === 'copyGlobalTypes') {
    
    await fs.mkdir(path.join(dir, 'cmp', 'types'), { recursive: true });
    await fs.cp(
      path.join(dir, 'src', 'global.d.ts'),
      path.join(dir, 'cmp', 'types', 'global.d.ts')
    );
    
  } else if (mode === 'removeCmp') {
    
    await fs.rm(path.join(dir, 'cmp'), { recursive: true });
    
  }
  
})().catch(err => {
  console.log('fatal', err);
  process.exit(1);
});
