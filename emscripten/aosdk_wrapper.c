#include <stdlib.h>
#include <stdio.h>
#include "ao.h"
#include "eng_protos.h"
#include "json.h"

static ao_display_info info;
static JsonNode* json_node;
static char json_str[2048];
static short audio_buffer[8192 * 2];

static int current_file_type;
static struct {
    int32 (*start)(uint8 *, uint32);
	int32 (*gen)(int16 *, uint32);
	int32 (*stop)(void);
	int32 (*fillinfo)(ao_display_info *);
} types[] = {
    {qsf_start, qsf_gen, qsf_stop, qsf_fill_info},
    {ssf_start, ssf_gen, ssf_stop, ssf_fill_info},
    {psf_start, psf_gen, psf_stop, psf_fill_info},
    {spu_start, spu_gen, spu_stop, spu_fill_info},
    {psf2_start, psf2_gen, psf2_stop, psf2_fill_info},
    //{dsf_start, dsf_gen, dsf_stop, dsf_fill_info}
};


void open_file(char* filename, int file_type) {
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

    chdir(dirname(filename));

    current_file_type = file_type;
    (*types[current_file_type].start)(buffer, size);
}

short* generate_sound_data() {
    (*types[current_file_type].gen)(audio_buffer, 8192);
    return audio_buffer;
}

char* song_info() {
    (*types[current_file_type].fillinfo)(&info);

    json_node = json_mkobject();
    json_append_member(json_node, "title", json_mkstring(info.info[1]));
    json_append_member(json_node, "game", json_mkstring(info.info[2]));
    json_append_member(json_node, "artist", json_mkstring(info.info[3]));
    json_append_member(json_node, "copyright", json_mkstring(info.info[4]));
    json_append_member(json_node, "year", json_mkstring(info.info[5]));
    json_append_member(json_node, "length", json_mkstring(info.info[6]));
    json_append_member(json_node, "fade", json_mkstring(info.info[7]));
    json_append_member(json_node, "ripper", json_mkstring(info.info[8]));
    return json_stringify(json_node, "\t");
}
