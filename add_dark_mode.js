const fs = require('fs');

function addDarkMode(file) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('mobilaz_theme')) {
        const scriptToAdd = "    <script>\n        if (localStorage.getItem('mobilaz_theme') === 'dark') {\n            document.documentElement.setAttribute('data-theme', 'dark');\n        }\n    </script>\n</head>";
        content = content.replace('</head>', scriptToAdd);
        fs.writeFileSync(file, content, 'utf8');
        console.log('Added dark mode script to ' + file);
    }
}

const dir = 'c:/Users/Gadirov/Desktop/AiryPhone - COPY/Front end/';
addDarkMode(dir + 'login.html');
addDarkMode(dir + 'signup.html');
addDarkMode(dir + 'cabinet.html');
