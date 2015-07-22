import path from 'path';

import ref from 'ref';
import ffi from 'ffi';
import StructType from 'ref-struct';
import ArrayType from 'ref-array';

import {AudioFile} from 'moseamp/audio';
import * as formats from 'moseamp/formats';


let aosdk = ffi.Library(path.resolve(__dirname, 'aosdk'), {
    psf_start: ['int', ['pointer', 'int']],
    psf_gen_wrapper: ['int', ['pointer', 'int']],
    psf_fill_info: ['int', ['pointer']],

    psf2_start: ['int', ['pointer', 'int']],
    psf2_gen_wrapper: ['int', ['pointer', 'int']],
    psf2_fill_info: ['int', ['pointer']],

    qsf_start: ['int', ['pointer', 'int']],
    qsf_gen_wrapper: ['int', ['pointer', 'int']],
    qsf_fill_info: ['int', ['pointer']],

    ssf_start: ['int', ['pointer', 'int']],
    ssf_gen_wrapper: ['int', ['pointer', 'int']],
    ssf_fill_info: ['int', ['pointer']],

    spu_start: ['int', ['pointer', 'int']],
    spu_gen_wrapper: ['int', ['pointer', 'int']],
    spu_fill_info: ['int', ['pointer']],

    dsf_start: ['int', ['pointer', 'int']],
    dsf_gen_wrapper: ['int', ['pointer', 'int']],
    dsf_fill_info: ['int', ['pointer']],
});

let StringArray = ArrayType('char', 256);
let InfoArray = ArrayType(StringArray, 9);
let AudioBufferArray = ArrayType('int16', 8192 * 2);

let AODisplayInfo = StructType({
    title: InfoArray,
    info: InfoArray
});

let displayInfo = new AODisplayInfo();
console.log('Display info: ' + displayInfo['ref.buffer'].address().toString(16));
let audioBuffer = new AudioBufferArray();
console.log('Audio buffer: ' + audioBuffer.buffer.address().toString(16));
console.log('Pointer to audio buffer: ' + audioBuffer.ref().readPointer(0).address().toString(16));
audioBuffer.buffer.fill(0);


export function activate() {
    formats.register(
        'Game Music files',
        ['psf', 'minipsf', 'spu', 'psf2', 'ssf', 'dsf', 'qsf'],
         AOSDKAudioFile
    );
}


export class AOSDKAudioFile extends AudioFile {
    constructor(filePath) {
        super(filePath);
        this.filename = path.basename(filePath);
        this.parentDirectory = path.dirname(filePath);
        this.type = path.extname(filePath).slice(1);
        this.fileBuffer = fs.readFileSync(filePath);

        if (this.type == 'minipsf') {
            this.type = 'psf';
        }
    }

    createAudioNode(ctx) {
        return new Promise((resolve) => {
            resolve(new AOSDKAudioNode(ctx, this));
        });
    }

    start() {
        aosdk[`${this.type}_start`](this.fileBuffer, this.fileBuffer.length);
    }

    fill_info() {
        aosdk[`${this.type}_fill_info`](displayInfo.ref());
    }

    gen() {
        aosdk[`${this.type}_gen_wrapper`](audioBuffer.ref(), 8192);
    }

    load() {
        process.chdir(this.parentDirectory);
        this.start();
        this.fill_info();
        this.title = displayInfo.info[1].buffer.readCString(0);
        this.album = displayInfo.info[2].buffer.readCString(0) || this.artist;
        this.artist = displayInfo.info[3].buffer.readCString(0) || this.album;
    }
}


export class AOSDKAudioNode {
    constructor(ctx, audioFile) {
        this.audioFile = audioFile;
        this.playing = false;

        this.scriptProcessor = ctx.createScriptProcessor(8192, 1, 2);
        this.scriptProcessor.onaudioprocess = (e) => {
            if (this.playing) {
                let left = e.outputBuffer.getChannelData(0);
                let right = e.outputBuffer.getChannelData(1);
                this.synthCallback(left, right, 8192);
            }
        };

        this.gainNode = ctx.createGain();
        this.gainNode.gain.value = 0.0001;
        this.scriptProcessor.connect(this.gainNode);
    }

    synthCallback(left, right, bufferSize) {
        this.audioFile.gen();
        for (var i = 0; i < bufferSize; i++) {
            left[i] = audioBuffer[i * 2];//Module.getValue(ptr + (i * 4), 'i16');
            right[i] = audioBuffer[(i * 2) + 1];//Module.getValue(ptr + (i * 4) + 2, 'i16');
        }
    }

    get currentTime() {
        return 0;
    }

    start() {
        this.playing = true;
    }

    stop() {
        this.playing = false;
    }

    connect(destination) {
        this.gainNode.connect(destination);
    }

    disconnect() {
        this.gainNode.disconnect();
    }
}
