#include <stdlib.h>
#include <stdio.h>
#include "ao.h"
#include "eng_protos.h"
#include "json.h"

static JsonNode* json_node;
static char json_str[2048];
static short audio_buffer[8192 * 2];


void open_psf(char* filename) {
    FILE *file;
	uint8 *buffer;
	uint32 size, filesig;

    file = fopen(filename, "rb");
    fseek(file, 0, SEEK_END);
    size = ftell(file);
    fseek(file, 0, SEEK_SET);
    buffer = (uint8*) malloc(size);
    fread(buffer, size, 1, file);
    fclose(file);

    psf_start(buffer, size);
}

short* generate_sound_data_psf() {
    psf_gen(audio_buffer, 8192 * 2);
    return audio_buffer;
}
