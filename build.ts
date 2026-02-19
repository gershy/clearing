import fs from 'node:fs/promises';
import path from 'node:path';

(async () => {
  
  const dir = import.meta.dirname;
  const mode = process.argv.at(-1);
  if (mode === 'copyGlobalTypes') {
    
    await fs.mkdir(path.join(dir, 'cmp', 'types'), { recursive: true });
    await fs.cp(
      path.join(dir, 'src', 'sideEffects.d.ts'),
      path.join(dir, 'cmp', 'types', 'sideEffects.d.ts')
    );
    
  } else if (mode === 'removeCmp') {
    
    await fs.rm(path.join(dir, 'cmp'), { recursive: true, force: true });
    
  }
  
})().catch(err => {
  console.log('fatal', err);
  process.exit(1);
});
