var argv = require('yargs').argv;
var glob = require('glob');
var gulp = require('gulp');
var gutil = require('gulp-util');
var path = require('path');
var spawn = require('child_process').spawn;


var aosdk_dir = path.join('emscripten', 'aosdk');
var json_dir = path.join('emscripten', 'json', 'ccan', 'json');
var json_files = glob.sync(json_dir + '/*.c');

var aosdk_files = [
    // Main files
    'main.c',
    'corlett.c',

    // DSF engine
    'eng_dsf/eng_dsf.c',
    'eng_dsf/dc_hw.c',
    'eng_dsf/aica.c',
    'eng_dsf/aicadsp.c',
    'eng_dsf/arm7.c',
    'eng_dsf/arm7i.c',

    // SSF engine
    'eng_ssf/m68kcpu.c',
    'eng_ssf/m68kopac.c',
    'eng_ssf/m68kopdm.c',
    'eng_ssf/m68kopnz.c',
    'eng_ssf/m68kops.c',
    'eng_ssf/scsp.c',
    'eng_ssf/scspdsp.c',
    'eng_ssf/sat_hw.c',
    'eng_ssf/eng_ssf.c',

    // QSF engine
    'eng_qsf/eng_qsf.c',
    'eng_qsf/kabuki.c',
    'eng_qsf/qsound.c',
    'eng_qsf/z80.c',
    'eng_qsf/z80dasm.c',

    // PSF engine
    'eng_psf/eng_psf.c',
    'eng_psf/psx.c',
    'eng_psf/psx_hw.c',
    'eng_psf/peops/spu.c',

    // PSF2 extentions
    'eng_psf/eng_psf2.c',
    'eng_psf/peops2/spu.c',
    'eng_psf/peops2/dma.c',
    'eng_psf/peops2/registers.c',

    // SPU engine (requires PSF engine)
    'eng_psf/eng_spu.c',

    // zlib (included for max portability)
    'zlib/adler32.c',
    'zlib/compress.c',
    'zlib/crc32.c',
    'zlib/gzio.c',
    'zlib/uncompr.c',
    'zlib/deflate.c',
    'zlib/trees.c',
    'zlib/zutil.c',
    'zlib/inflate.c',
    'zlib/infback.c',
    'zlib/inftrees.c',
    'zlib/inffast.c',
].map(aosdk_path);

function aosdk_path(filePath) {
    return path.join(aosdk_dir, filePath);
}


/**
 * Compile the C libraries with emscripten.
 */
gulp.task('build', function(done) {
    var emcc = process.env.EMCC_BIN || argv.emcc || 'emcc';

    var source_files = [
        'emscripten/aosdk_wrapper.c',
    ].concat(json_files, aosdk_files);
    var outfile = 'aosdk_emscripten.js';
    var preJS = path.resolve(__dirname, 'src', 'pre_emscripten.js');
    var postJS = path.resolve(__dirname, 'src', 'post_emscripten.js');

    var flags = [
        '-o', outfile,
        '--pre-js', preJS,
        '--post-js', postJS,

        '-s', 'ASM_JS=1',
        '-s', 'EXPORTED_FUNCTIONS=@emscripten/exported_functions.json',
        '-s', 'ASSERTIONS=1',
        '-s', 'ALLOW_MEMORY_GROWTH=1',

        '-O2',
        '-I' + aosdk_dir,
        '-I' + aosdk_path('eng_ssf'),
        '-I' + aosdk_path('eng_qsf'),
        '-I' + aosdk_path('eng_dsf'),
        '-I' + aosdk_path('zlib'),
        '-I' + json_dir,
        '-lm',
        '-DPATH_MAX=1024',
        '-DHAS_PSX_CPU=1',
        '-DLSB_FIRST=1',

        '-Wno-implicit-function-declaration',
        '-Wno-dangling-else',
        '-Wno-logical-op-parentheses',
        '-Wno-format',
        '-Wno-implicit-int',
        '-Wno-return-type',
        '-Wno-c++11-compat-deprecated-writable-strings',
    ];
    var args = [].concat(flags, source_files);

    gutil.log('Compiling via emscripten to ' + outfile);
    var build_proc = spawn(emcc, args, {stdio: 'inherit'});
    build_proc.on('exit', function() {
        done();
    });
});
