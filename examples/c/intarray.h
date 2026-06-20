#ifndef INTARRAY_H_2119
#define INTARRAY_H_2119
#ifdef __cplusplus
#extern "C"{
#endif

typedef struct intarray intarray;

intarray *
intarray_create(
    int size
);

void
intarray_delete(
    intarray * obj
);

int
intarray_get(
    intarray const * obj,
    int index
);

int
intarray_length(
    intarray const * obj
);

void
intarray_set(
    intarray * obj,
    int index,
    int value
);
#ifdef __cplusplus
}
#endif
#endif
