import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const validSupabaseUrl = supabaseUrl.startsWith('http') ? supabaseUrl : '';

  return {
    plugins: [react(), tailwindcss()],
    define: {
      ...(validSupabaseUrl ? { 'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(validSupabaseUrl) } : {}),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      chunkSizeWarningLimit: 2500,
    },
  };
});
