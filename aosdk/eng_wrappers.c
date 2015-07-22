/*
	For some reason, node-ffi refuses to pass a pointer to an ArrayType
	properly. Instead, it passes a pointer to the pointer to the ArrayType.
	These wrapper functions remove that indirection because I can't figure
	out how to get node-ffi to pass the proper thing.
*/

#include "ao.h"

int32 psf_gen_wrapper(int16** buffer, uint32 samples) {
	return psf_gen(*buffer, samples);
}

int32 psf2_gen_wrapper(int16** buffer, uint32 samples) {
	return psf2_gen(*buffer, samples);
}

int32 qsf_gen_wrapper(int16** buffer, uint32 samples) {
	return qsf_gen(*buffer, samples);
}

int32 ssf_gen_wrapper(int16** buffer, uint32 samples) {
	return ssf_gen(*buffer, samples);
}

int32 spu_gen_wrapper(int16** buffer, uint32 samples) {
	return spu_gen(*buffer, samples);
}

int32 dsf_gen_wrapper(int16** buffer, uint32 samples) {
	return dsf_gen(*buffer, samples);
}
