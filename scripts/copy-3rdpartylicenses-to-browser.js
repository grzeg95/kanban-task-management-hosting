const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, '../', 'dist', 'kanban-task-management-hosting');

fs.copyFile(path.join(basePath, '3rdpartylicenses.txt'), path.join(basePath, 'browser/3rdpartylicenses.txt'), (err) => {

  if (err) {
    console.log(`3rdpartylicenses.txt not found`);
  } else {
    console.log(`3rdpartylicenses.txt has been copied`);
  }
});
