import path from 'path';

import {AudioFile} from 'moseamp/audio';
import * as formats from 'moseamp/formats';

import {FS, Module, NODEFS} from '../aosdk_emscripten.js';


let extToType = {
    qsf: 0,
    ssf: 1,
    psf: 2,
    minipsf: 2,
    spu: 3,
    psf2: 4,
    dsf: 5,
};


let aosdk = {
    openFile: Module.cwrap('open_file', null, ['string', 'number']),
    generateSoundData: Module.cwrap('generate_sound_data', 'number'),
    songInfo: Module.cwrap('song_info', 'string'),
};


FS.mkdir('/realworld');
FS.mount(NODEFS, {root: '/'}, '/realworld');


export function activate() {
    formats.register(
        'Game Music files',
        ['psf', 'minipsf', 'spu', /*'psf2',*/ 'ssf', /*'dsf',*/ 'qsf'],
         AOSDKAudioFile
    );
}


export class AOSDKAudioFile extends AudioFile {
    constructor(filePath) {
        super(filePath);
        this.filename = path.basename(filePath);
        this.emsPath = path.join('/realworld', filePath);
    }

    createAudioNode(ctx) {
        return new Promise((resolve) => {
            resolve(new AOSDKAudioNode(ctx, this));
        });
    }

    load() {
        let type = extToType[path.extname(this.filename).slice(1)];
        aosdk.openFile(this.emsPath, type);

        this.metadata = JSON.parse(aosdk.songInfo());
        this.title = this.metadata.title;
        this.artist = this.metadata.artist || this.artist;
        this.album = this.metadata.game || this.album;
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
        var ptr = aosdk.generateSoundData();
        for (var i = 0; i < bufferSize; i++) {
            left[i] = Module.getValue(ptr + (i * 4), 'i16');
            right[i] = Module.getValue(ptr + (i * 4) + 2, 'i16');
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
