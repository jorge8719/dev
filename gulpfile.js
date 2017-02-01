/*******************************************************************************
////////////////////////////// Table of Contents ///////////////////////////////
*******************************************************************************/

// 1.  Plugins
// 2.  Rutas
// 3.  Mover, concatenar, minificar JS
// 4.  Compilar SASS
// 5.  Critical CSS
// 6.  HTML
// 7.  Optimizar y copiar imagenes
// 8.  Copiar Fuentes
// 9.  Watch
// 10. Borra todos los archivos de dist
// 11. Configuración servidor local
// 12. Task all
// 13. Default

/*******************************************************************************
1. Plugins
*******************************************************************************/

var gulp = require('gulp'); // Gulp
var sass = require('gulp-sass'); // Compilador de SASS
var autoprefixer = require('gulp-autoprefixer'); // Autoprefixer para SASS
var combineMq = require('gulp-combine-mq'); // Combina las mediaqueries iguales solo en una
var del = require('del'); // Borra archivos
var path = require('path'); // Coge las rutas de los archivos
var critical = require('critical').stream; // Separa el CSS critico de la web y lo incrusta inline;
var imagemin = require('gulp-imagemin'); // Optimizar imágenes
var rename = require("gulp-rename"); // Cambia los nombres de los ficheros
var uglify = require('gulp-uglify'); // Minificar JS
var concat = require('gulp-concat'); // Concatena ficheros
var plumber = require('gulp-plumber'); // Evita que gulp para de ejecutarse cuando tiene un error
var browserSync = require('browser-sync'); // Servidor local, refresco automatico del navegador
var panini = require('panini'); // Simple html template engine generator

/*******************************************************************************
2. Rutas
*******************************************************************************/

var bowerComponents = 'bower_components/';

var pathSrc = 'src/';
var pathDist = 'dist/';

var pathAssets = 'assets/';

var pathScripts = pathAssets + 'js/';
var pathVendorScripts = pathScripts + 'vendor/';

var pathSass = pathAssets + 'sass/';
var pathCss = pathAssets + 'css/';

var pathImg = pathAssets + 'img/';

var pathFonts = pathAssets + 'fonts/';

var pathHtml = pathSrc + 'html/';
var pathPages = pathHtml + 'pages/';
var pathLayouts = pathHtml + 'layouts/';
var pathPartials = pathHtml + 'partials/';
var pathHelpers = pathHtml + 'helpers/';
var pathData = pathHtml + 'data/';

/*******************************************************************************
3. Mover, concatenar, minificar JS
*******************************************************************************/

gulp.task('scripts', function() {
    gulp.src([
        bowerComponents + 'jquery/dist/jquery.min.js',
        pathSrc + pathVendorScripts + '**/*'
    ])
    .pipe(concat('main.min.js'))
    .pipe(uglify())
    .pipe(plumber())
    .pipe(gulp.dest(pathDist + pathScripts))
    .pipe(browserSync.reload({
        stream: true
    }));
});

gulp.task('customScript', function() {
    gulp.src(pathSrc + pathScripts + 'custom.js')
    .pipe(plumber())
    .pipe(gulp.dest(pathDist + pathScripts))
    .pipe(browserSync.reload({
        stream: true
    }));
});

/*******************************************************************************
4. Compilar SASS
*******************************************************************************/

gulp.task('sass', function(){
    gulp.src([pathSrc + pathSass + 'main.scss'])
    .pipe(sass({
        includePaths: [
            bowerComponents + 'normalize-scss',
            bowerComponents + 'flexbox-grid-mixins/sass',
            bowerComponents + 'mediaqueries-sass-mixin',
        ],
        outputStyle: 'compressed',
        sourcemap: true
    }).on('error', sass.logError))
    .pipe(autoprefixer({
        browsers: ['last 1 versions']
    }))
    .pipe(combineMq({
        beautify: false
    }))
    .pipe(concat("main.min.css"))
    .pipe(plumber())
    .pipe(gulp.dest(pathDist + pathCss))
    .pipe(browserSync.reload({
        stream: true
    }));
});

/*******************************************************************************
5. Critical CSS
Coge el CSS critico, lo introduce en los archivos html y llama al css de manera
asincrona
*******************************************************************************/

gulp.task('criticalCSS', function() {
    gulp.src(pathDist + '**/*.html')
    .pipe(critical({
        base: pathDist,
        inline: true,
        css: [pathDist + pathCss + 'main.min.css'],
        minify: true
    }))
    .pipe(gulp.dest(pathDist));
});

/*******************************************************************************
6. HTML
Compila todos los html en su corespondiente pagina
*******************************************************************************/

gulp.task('html', function() {
    gulp.src(pathPages + '**/*')
    .pipe(panini({
        root: pathPages,
        layouts: pathLayouts,
        partials: pathPartials,
        helpers: pathHelpers,
        data: pathData
    }))
    .pipe(plumber())
    .pipe(gulp.dest(pathDist))
    .pipe(browserSync.reload({
        stream: true
    }));
});

// Vuelve a compilar
gulp.task('refreshHtml', function() {
    panini.refresh();
});

/*******************************************************************************
7. Optimizar y copiar imagenes
*******************************************************************************/

gulp.task('images', function() {
    gulp.src(pathSrc + pathImg + '**/*.*', {
        base: pathSrc + pathImg
    })
    .pipe(imagemin())
    .pipe(plumber())
    .pipe(gulp.dest(pathDist + pathImg))
    .pipe(browserSync.reload({
        stream: true
    }));
});

/*******************************************************************************
8. Copiar Fuentes
*******************************************************************************/

gulp.task('fonts', function() {
    gulp.src(pathSrc + pathFonts + '**/*.*', {
        base: pathSrc + pathFonts
    })
    .pipe(plumber())
    .pipe(gulp.dest(pathDist + pathFonts))
    .pipe(browserSync.reload({
        stream: true
    }));
});

/*******************************************************************************
9. Watch
Detecta cuando hay cambios en los archivos para moverlos o borrarlos de dist
después de hacer su function
*******************************************************************************/

gulp.task('watch', function() {
    gulp.watch([pathSrc + pathSass + '**/*.scss', pathSrc + pathSass + '**/_*.scss', bowerComponents + '**/*.scss'], ['sass']);
    gulp.watch(pathSrc + pathScripts + '**/*.js', ['scripts', 'customScript']);
    gulp.watch(pathHtml + '**/*.html', ['refreshHtml', 'html']);

    var watcherFonts = gulp.watch(pathSrc + pathFonts + '**/*.*', ['fonts']);
    var watcherImages = gulp.watch(pathSrc + pathImg + '**/*.*', ['images']);

    // Detecta si se borra una fuente para eliminarla de dist
    watcherFonts.on('change', function(event) {
        if (event.type === 'deleted') {
            var filePathFromSrc = path.relative(path.resolve(pathSrc + pathFonts), event.path);
            var destFilePath = path.resolve(pathDist + pathFonts, filePathFromSrc);
            del.sync(destFilePath);
        }
    });

    // Detecta si se borra una imagen para eliminarla de dist
    watcherImages.on('change', function(event) {
        if (event.type === 'deleted') {
            var filePathFromSrc = path.relative(path.resolve(pathSrc + pathImg), event.path);
            var destFilePath = path.resolve(pathDist + pathImg, filePathFromSrc);
            del.sync(destFilePath);
        }
    });
});

/*******************************************************************************
10. Borra todos los archivos de dist
*******************************************************************************/

gulp.task('clearDist', function() {
    del(pathDist + '**/*');
});

/*******************************************************************************
11. Configuración servidor local
*******************************************************************************/

gulp.task('server', function() {
    browserSync.init({
        server: {
            baseDir: pathDist
        },
        port: 7410

    });
});

/*******************************************************************************
12. Task all
Tarea para ejecutar todos las otras tareas
*******************************************************************************/

gulp.task('all', ['customScript', 'scripts', 'sass', 'images', 'html', 'fonts']);

/*******************************************************************************
13. Default
Indicamos que hacer cuando se llame a la tarea por defecto de gulp
*******************************************************************************/

gulp.task('default', ['watch', 'server']);
