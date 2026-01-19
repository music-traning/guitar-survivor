import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // ★これを追加！必須です
  build: {
    assetsInlineLimit: 0, // (任意) アセットをBase64化せずファイルとして出力する場合
  }
});