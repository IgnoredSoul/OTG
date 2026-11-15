const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const CleanCSS = require('clean-css');
const { minify: terserMinify } = require('terser');
const { minify: htmlMinify } = require('html-minifier-terser');

async function build() {
    const rootDir = __dirname;
    const srcDir = path.join(rootDir, 'src');
    const distDir = path.join(rootDir, 'dist');
    const indexPath = path.join(srcDir, 'index.html');

    if (!fs.existsSync(distDir)) { fs.mkdirSync(distDir); }

    let htmlContent = fs.readFileSync(indexPath, 'utf-8');
    const $ = cheerio.load(htmlContent);

    // 1. Process CSS Files -> Inline & Minify
    const cssPromises = $('link[rel="stylesheet"]').map(async (_, element) => {
        const href = $(element).attr('href');
        const cssPath = path.join(srcDir, href);
        
        if (fs.existsSync(cssPath)) {
            const cssCode = fs.readFileSync(cssPath, 'utf-8');
            const minifiedCss = new CleanCSS().minify(cssCode).styles;
            $(element).replaceWith(`<style>${minifiedCss}</style>`);
        }
    }).get();

    await Promise.all(cssPromises);

    const jsPromises = $('script[src]').map(async (_, element) => {
        const src = $(element).attr('src');
        const jsPath = path.join(srcDir, src);

        if (fs.existsSync(jsPath)) {
            const jsCode = fs.readFileSync(jsPath, 'utf-8');
            
            const minifiedResult = await terserMinify(jsCode, {
                compress: {
                    drop_console: true,
                    drop_debugger: true,
                    passes: 32,
                },
                mangle: true,
            });
            if (minifiedResult.error) { throw minifiedResult.error; }

            $(element).removeAttr('src');
            $(element).text(minifiedResult.code);
        }
    }).get();

    await Promise.all(jsPromises);

    let finalHtml = $.html();
    const minifiedHtml = await htmlMinify(finalHtml, {
        collapseWhitespace: true,
        removeComments: true,
        removeOptionalTags: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
        minifyCSS: true,
        minifyJS: true,
    });

    fs.writeFileSync(path.join(distDir, 'index.html'), minifiedHtml);
}

build();