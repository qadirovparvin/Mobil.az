const fs = require('fs');
if (fs.existsSync('stores.html')) {
    let content = fs.readFileSync('stores.html', 'utf8');
    let id = 1;

    content = content.replace(/href="magaza-profil\.html(\?id=1)?"/g, (match) => {
      return 'href="magaza-profil.html?id=' + (id++) + '"';
    });

    fs.writeFileSync('stores.html', content);
    console.log('Fixed stores links.');
}
