const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');
let id = 1;

content = content.replace(/href="elan-detail\.html"/g, (match) => {
  return 'href="elan-detail.html?id=' + (id++) + '"';
});

content = content.replace(/href="elan-detail-magaza\.html"/g, (match) => {
  return 'href="elan-detail-magaza.html?id=' + (id++) + '"';
});

fs.writeFileSync('index.html', content);

let detailHtml = fs.readFileSync('elan-detail.html', 'utf8');
let detailId = 100;
detailHtml = detailHtml.replace(/href="elan-detail\.html"/g, () => 'href="elan-detail.html?id=' + (detailId++) + '"');
fs.writeFileSync('elan-detail.html', detailHtml);

console.log('Fixed links.');
