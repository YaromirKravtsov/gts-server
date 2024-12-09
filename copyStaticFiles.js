const fs = require('fs');
const path = require('path');

// Относительные пути
const sourceDir = path.join(__dirname, 'src', 'static');
const targetDir = path.join(__dirname, 'dist', 'src', 'static');

function copyFilesRecursive(src, dest) {
    if (!fs.existsSync(src)) {
        console.error(`Source directory does not exist: ${src}`);
        return;
    }

    // Создаем целевую директорию, если её нет
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const items = fs.readdirSync(src);

    items.forEach((item) => {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);

        const stats = fs.statSync(srcPath);

        if (stats.isDirectory()) {
            // Рекурсивно копируем директорию
            copyFilesRecursive(srcPath, destPath);
        } else if (stats.isFile()) {
            // Копируем файл
            fs.copyFileSync(srcPath, destPath);
            console.log(`Copied: ${srcPath} -> ${destPath}`);
        }
    });
}

copyFilesRecursive(sourceDir, targetDir);
console.log('All files copied successfully!');
