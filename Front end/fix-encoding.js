const fs = require('fs');
const path = require('path');

const dir = 'C:/Users/Gadirov/Desktop/AiryPhone - COPY/Front end/';
const files = ['index.html', 'phone.html', 'elan-yerlesdir.html', 'cabinet.html', 'favorite.html', 'JS/script.js', 'JS/filters.js'];

let changes = 0;
files.forEach(f => {
    let p = path.join(dir, f);
    if(fs.existsSync(p)) {
        let content = fs.readFileSync(p, 'utf8');
        let newContent = content.replace(/â€“/g, '–').replace(/â‚¼/g, '₼');
        if(content !== newContent) {
            fs.writeFileSync(p, newContent, 'utf8');
            console.log(`Fixed encoding in ${f}`);
            changes++;
        }
    }
});

if (changes === 0) {
    console.log("No encoding issues found to fix.");
} else {
    console.log(`Successfully fixed encoding across ${changes} files.`);
}
