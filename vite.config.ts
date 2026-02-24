import { defineConfig, type Plugin } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

/**
 * Vite plugin that resolves `figma:asset/...` virtual imports
 * to a default avatar placeholder. In the Figma Make environment
 * these are handled natively, but on Vercel we need a fallback.
 */
function figmaAssetPlugin(): Plugin {
  const VIRTUAL_PREFIX = 'figma:asset/';
  const RESOLVED_PREFIX = '\0figma-asset:';

  return {
    name: 'vite-plugin-figma-asset',
    resolveId(source) {
      if (source.startsWith(VIRTUAL_PREFIX)) {
        return RESOLVED_PREFIX + source.slice(VIRTUAL_PREFIX.length);
      }
      return null;
    },
    load(id) {
      if (id.startsWith(RESOLVED_PREFIX)) {
        // Return a module that re-exports the default avatar placeholder
        return `import avatar from '/src/assets/default-avatar.ts';\nexport default avatar;`;
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    figmaAssetPlugin(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
      // Map the Figma Make absolute path to our env-based module
      '/utils/supabase/info': path.resolve(__dirname, './src/utils/supabase-info.ts'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
