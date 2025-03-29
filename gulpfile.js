const gulp = require('gulp');
const path = require('path');
const fs = require('fs-extra'); // Use fs-extra for promise-based operations and ensureDir

// Function to get package directories (nodes and credentials)
async function getPackageDirectories() {
	const basePath = path.join(__dirname);
	const directories = ['nodes', 'credentials'];
	const packageDirs = [];

	for (const dir of directories) {
		const dirPath = path.join(basePath, dir);
		try {
			// Check if directory exists
			const stats = await fs.stat(dirPath);
			if (stats.isDirectory()) {
				const subdirs = await fs.readdir(dirPath);
				for (const subdir of subdirs) {
					const subdirPath = path.join(dirPath, subdir);
					const subdirStats = await fs.stat(subdirPath);
					if (subdirStats.isDirectory()) {
						packageDirs.push(path.join(dir, subdir)); // Store relative path like 'nodes/MyNode'
					}
				}
			}
		} catch (error) {
			// If directory doesn't exist, ignore it (e.g., no credentials yet)
			if (error.code !== 'ENOENT') {
				console.error(`Error reading directory ${dirPath}:`, error);
			}
		}
	}
	return packageDirs;
}

// Task to copy non-TS files (like icons) from source to dist
gulp.task('copy-assets', async () => {
	const packageDirs = await getPackageDirectories();
	const copyPromises = [];

	for (const packageDir of packageDirs) {
		const srcPath = path.join(__dirname, packageDir, '**/*.*');
		const destPath = path.join(__dirname, 'dist', packageDir);

		// Ensure destination directory exists
		await fs.ensureDir(destPath);

		// Copy files, excluding .ts files
		const promise = gulp.src([srcPath, `!${path.join(__dirname, packageDir, '**/*.ts')}`])
			.pipe(gulp.dest(destPath));
		copyPromises.push(promise);
	}

	if (copyPromises.length === 0) {
		console.log('No assets to copy.');
		return Promise.resolve(); // Resolve immediately if no assets
	}

	return Promise.all(copyPromises);
});

// Default build task
gulp.task('build', gulp.series('copy-assets'));

// Default task
gulp.task('default', gulp.series('build'));
