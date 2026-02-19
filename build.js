import fs from 'node:fs/promises';
import path from 'node:path';

(async () => {
  
  const dir = import.meta.dirname;
  const mode = process.argv.at(-1);
  if (mode === 'removeCmp') {
    
    await fs.rm(path.join(dir, 'cmp'), { recursive: true, force: true });
    
  } else if (mode === 'importSideEffects') {
    
    // Copy to cmp/mjs
    await fs.mkdir(path.join(dir, 'cmp', 'mjs'), { recursive: true });
    await fs.cp(
      path.join(dir, 'src', 'sideEffects.d.ts'),
      path.join(dir, 'cmp', 'mjs', 'sideEffects.d.ts')
    );
    
    // TODO: What about typing for cjs??
    const mainFp = path.join(dir, 'cmp', 'mjs', 'main.d.ts');
    const content = await fs.readFile(mainFp, 'utf8');
    await fs.writeFile(mainFp, `import './sideEffects.js';\n${content}`);
    
  } else {
    
    console.log('Unsupported option', process.argv);
    
  }
  
})().catch(err => {
  console.log('fatal', err);
  process.exit(1);
});
