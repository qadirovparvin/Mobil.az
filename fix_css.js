const fs = require('fs');

const files = [
    'c:/Users/Gadirov/Desktop/AiryPhone - COPY/Front end/CSS/login.css',
    'c:/Users/Gadirov/Desktop/AiryPhone - COPY/Front end/CSS/cabinet.css'
];

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    // replace body.dark-mode with [data-theme="dark"]
    content = content.replace(/body\.dark-mode/g, '[data-theme="dark"] body');
    // For cases where it's just .dark-mode maybe
    content = content.replace(/\.dark-mode/g, '[data-theme="dark"]');
    fs.writeFileSync(f, content, 'utf8');
});

console.log('Fixed CSS dark mode selectors');
