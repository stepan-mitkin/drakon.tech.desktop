#include "intarray.h"

#include <stdlib.h>
#include <string.h>
struct intarray
{
    int * elements;
    int size;
};

intarray *
intarray_create(
    int size
)
{
    intarray * obj;
    size_t dataSize;
    if (size < 0)
    {
        abort();
    }
    obj = malloc(sizeof(intarray));
    if (!(obj))
    {
        abort();
    }
    obj->size = size;
    if (size == 0)
    {
        obj->elements = 0;
    }
    else
    {
        dataSize = sizeof(int) * size;
        obj->elements = malloc(dataSize);
        if (!(obj->elements))
        {
            abort();
        }
        memset(obj->elements, 0, dataSize);
    }
    return obj;
}

void
intarray_delete(
    intarray * obj
)
{
    if (obj)
    {
        if (obj->elements)
        {
            free(obj->elements);
        }
        free(obj);
    }
}

int
intarray_get(
    intarray const * obj,
    int index
)
{
    if (!((index >= 0) && (index < obj->size)))
    {
        abort();
    }
    return obj->elements[index];
}

int
intarray_length(
    intarray const * obj
)
{
    return obj->size;
}

void
intarray_set(
    intarray * obj,
    int index,
    int value
)
{
    if (!((index >= 0) && (index < obj->size)))
    {
        abort();
    }
    obj->elements[index] = value;
}
