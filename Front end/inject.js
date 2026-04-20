const fs = require('fs');
const path = require('path');

const dir = process.cwd();

fs.readdir(dir, (err, files) => {
    if (err) throw err;
    files.forEach(file => {
        if (file.endsWith('.html') && file !== 'login.html' && file !== 'signup.html' && file !== 'index.html') {
            const filePath = path.join(dir, file);
            let content = fs.readFileSync(filePath, 'utf8');

            if (!content.includes('auth.js') && !content.includes('auth.ts')) {
                content = content.replace('<script src="JS/script.js"></script>', '<script src="JS/auth.js"></script>\n    <script src="JS/script.js"></script>');
                content = content.replace('<script src="JS/script.js?v=2"></script>', '<script src="JS/auth.js"></script>\n    <script src="JS/script.js?v=2"></script>');
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`Injected auth.js into ${file}`);
            }
        }
    });
});
