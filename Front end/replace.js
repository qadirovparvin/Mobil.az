const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, '.'); 

fs.readdir(directoryPath, function (err, files) {
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    } 
    files.forEach(function (file) {
        if(file.endsWith('.html')){
             const filePath = path.join(directoryPath, file);
             let content = fs.readFileSync(filePath, 'utf8');
             
             const newContent = content.replace(/<h3>Əlaqə<\/h3>/g, '<h3 class="contact" data-translate="contact">Əlaqə</h3>');

             if(newContent !== content){
                  fs.writeFileSync(filePath, newContent, 'utf8');
                  console.log(`Updated ${file}`);
             }
        }
    });
});
