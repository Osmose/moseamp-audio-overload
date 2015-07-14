import path from 'path';

import {AudioFile} from 'moseamp/audio';
import * as formats from 'moseamp/formats';

import {FS, Module, NODEFS} from '../aosdk_emscripten.js';


let aosdk = {
    openFile: Module.cwrap('open_psf', null, ['string']),
    generateSoundData: Module.cwrap('generate_sound_data_psf', 'number'),
    //songInfo: Module.cwrap('song_info', 'string', ['string', 'number']),
};


FS.mkdir('/realworld');
FS.mount(NODEFS, {root: '/'}, '/realworld');


export function activate() {
    formats.register(
        'Game Music files',
        ['psf', 'minipsf'],//, 'spu', 'psf2', 'ssf', 'dsf', 'qsf'],
         AOSDKAudioFile
    );
}


export class AOSDKAudioFile extends AudioFile {
    constructor(filePath) {
        super(filePath);
        this.filename = path.basename(filePath);
        this.emsPath = path.join('/realworld', filePath);

        /*
        this.metadata = JSON.parse(gme.songInfo(this.emsPath, 0));
        this.title = this.metadata.game;
        this.artist = this.metadata.author || this.artist;
        this.album = this.metadata.system || this.album;
        this.duration = this.metadata.length / 1000;
        */
    }

    createAudioNode(ctx) {
        return new Promise((resolve) => {
            resolve(new GMEAudioNode(ctx, this));
        });
    }

    load() {
        aosdk.openFile(this.emsPath);
    }
}


export class GMEAudioNode {
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
