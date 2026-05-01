const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) results.push(file);
    }
  });
  return results;
}

const folders = ['apps', 'components', 'lib', 'actions', 'packages'];
let files = [];
folders.forEach(f => { files = files.concat(walk(f)); });

let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content.replace(/(['"`])\/admin\//g, '$1/');
  newContent = newContent.replace(/(['"`])\/admin(['"`])/g, '$1/$2');
  newContent = newContent.replace(/(['"`])\/portal\//g, '$1/');
  newContent = newContent.replace(/(['"`])\/portal(['"`])/g, '$1/$2');
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    changedFiles++;
    console.log('Updated:', file);
  }
});

console.log('Total files updated:', changedFiles);
