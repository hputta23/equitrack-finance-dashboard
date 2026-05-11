const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('./src/pages').concat(walk('./src/components'));

let totalReplaced = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const orig = content;
    // Replace text-[Xpx] with text-fluid-X
    content = content.replace(/text-\[(\d+)px\]/g, 'text-fluid-$1');
    if (content !== orig) {
        fs.writeFileSync(file, content, 'utf8');
        totalReplaced++;
    }
});

console.log(`Replaced in ${totalReplaced} files.`);
