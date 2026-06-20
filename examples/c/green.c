
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include "intarray.h"
int successCount = 0;
int errorCount = 0;

static int
add(
    int left,
    int right
);

static int
addCore(
    int left,
    int right
);

static int
badShortCircuit(
    int x,
    int y
);

static void
checkInt(
    int expected,
    int actual
);

static void
checkString(
    char const * expected,
    char const * actual
);

static int
completeWork(
    intarray * array
);

static int
complexAnd(
    int valueA,
    int valueB,
    int valueC
);

static int
complexOr(
    int valueA,
    int valueB,
    int valueC
);

static void
complexSilNoReturn(
    int left,
    int right
);

static int
complexSilhouette(
    int left,
    int right
);

static char const *
degenerateSelect(
    int value
);

static void
doMore(
    intarray * array
);

static void
doSomething(
    intarray * array
);

static int
doWhile(void);

static int
doWhileDo(void);

static void
earlyExit(
    intarray * array,
    int value
);

static void
empty(void);

static int
fibonacci(
    int ordinal
);

static int
fibonacciSil(
    int ordinal
);

static char const *
fizzBuzz(
    int number
);

static void
forArray(
    intarray const * array
);

static void
hello(void);

static int
inversedAnd(
    int one,
    int two,
    int three
);

static int
inversedOr(
    int one,
    int two,
    int three
);

static int
noDublicates(
    int x,
    int y
);

static void
question(
    int value
);

static int
questionMerge(
    int left,
    int right
);

static int
resourcesExample(
    int count
);

static char const *
select(
    int value
);

static int
selectArrow(void);

static char const *
selectShortCircuit(
    int value
);

static char const *
selectWithDefault(
    int value
);

static char const *
selectWithoutDefault(
    int value
);

static int
sil2(
    int value
);

static int
simpleAnd(
    int valueA, //value a
    int valueB, //value b
    int valueC // value c
);

static int
simpleOr(
    int valueA,
    int valueB,
    int valueC
);

static int
twoExits(
    intarray const * array,
    int value
);

static int
whileDo(void);

static void
writeInt(
    int value
);

static void
writeLine(
    char const * message
);

static int
add(
    int left,
    int right
)
{
    int result;
    result = addCore(left, right);
    return result;
}

static int
addCore(
    int left,
    int right
)
{
    return left + right;
}

static int
badShortCircuit(
    int x,
    int y
)
{
    if (!((!(x == 10)) || (y == 20)))
    {
        return 100;
    }
    return 200;
}

static void
checkInt(
    int expected,
    int actual
)
{
    if (expected == actual)
    {
        printf(
            "checkInt expected and actual = %d\n",
            expected
        );
        successCount++;
    }
    else
    {
        printf(
            "ERROR: checkInt expected=%d actual=%d\n",
            expected,
            actual
        );
        errorCount++;
    }
}

static void
checkString(
    char const * expected,
    char const * actual
)
{
    if (strcmp(expected, actual) == 0)
    {
        printf(
            "checkStr expected and actual = %s\n",
            expected
        );
        successCount++;
    }
    else
    {
        printf(
            "ERROR: checkStr expected=%s actual=%s\n",
            expected,
            actual
        );
        errorCount++;
    }
}

static int
completeWork(
    intarray * array
)
{
    return 2;
}

static int
complexAnd(
    int valueA,
    int valueB,
    int valueC
)
{
    if (((!(valueA)) && (valueB)) || (valueC))
    {
        return 1;
    }
    else
    {
        return 0;
    }
}

static int
complexOr(
    int valueA,
    int valueB,
    int valueC
)
{
    if ((valueA) || ((!(valueB)) && (valueC)))
    {
        return 1;
    }
    else
    {
        return 0;
    }
}

static void
complexSilNoReturn(
    int left,
    int right
)
{
    int result;
    result = 0;
    if (left == 3)
    {
        result = result + right;
        goto Second;
    }
    else
    {
        goto Third;
    }
    Second:
    writeInt(result + 2);
    goto Third;
    Third:
    writeInt(result + 10);
    goto Exit;
    Exit:
    return;
}

static int
complexSilhouette(
    int left,
    int right
)
{
    int result;
    result = 0;
    if (left == 3)
    {
        result += right;
        goto Second;
    }
    else
    {
        goto Third;
    }
    Second:
    result += 2;
    goto Third;
    Third:
    result += 10;
    goto Exit;
    Exit:
    return result;
}

static char const *
degenerateSelect(
    int value
)
{
    if (value == 10)
    {
        return "ten";
    }
    else
    {
        return "many";
    }
}

static void
doMore(
    intarray * array
)
{
}

static void
doSomething(
    intarray * array
)
{
}

static int
doWhile(void)
{
    int result = 0;
    while (1)
    {
        result += 3;
        if (result > 20)
        {
            break;
        }
    }
    return result;
}

static int
doWhileDo(void)
{
    int result = 0;
    while (1)
    {
        result += 7;
        if (result > 20)
        {
            break;
        }
        else
        {
            result += 3;
        }
    }
    return result;
}

static void
earlyExit(
    intarray * array,
    int value
)
{
    int i,
    index,
    count;
    index = -1;
    count = intarray_length(array);
    for (i = 0; i < count; i++)
    {
        if (intarray_get(array, i) == value)
        {
            index = i;
            break;
        }
    }
    printf("index=%d\n", index);
    if (!(index == -1))
    {
        intarray_set(array, index, 0);
    }
}

static void
empty(void)
{
}

static int
fibonacci(
    int ordinal
)
{
    int result,
    i,
    i_1,
    i_2;
    if ((ordinal == 0) || (ordinal == 1))
    {
        result = ordinal;
        return result;
    }
    else
    {
        i_2 = 0;
        i_1 = 1;
        for (i = 2; i <= ordinal; i++)
        {
            result = i_2 + i_1;
            i_2 = i_1;
            i_1 = result;
        }
        return result;
    }
}

static int
fibonacciSil(
    int ordinal
)
{
    int result,
    i,
    i_1,
    i_2;
    result = 0;
    if ((ordinal == 0) || (ordinal == 1))
    {
        result = ordinal;
        goto Exit;
    }
    else
    {
        i_2 = 0;
        i_1 = 1;
        i = 2;
        goto Fibonacci_loop;
    }
    Fibonacci_loop:
    if (i > ordinal)
    {
        goto Exit;
    }
    else
    {
        result = i_2 + i_1;
        i_2 = i_1;
        i_1 = result;
        i++;
        goto Fibonacci_loop;
    }
    Exit:
    return result;
}

static char const *
fizzBuzz(
    int number
)
{
    if (number % 3 == 0)
    {
        if (number % 5 == 0)
        {
            return "FizzBuzz";
        }
        else
        {
            return "Fizz";
        }
    }
    else
    {
        if (number % 5 == 0)
        {
            return "Buzz";
        }
        else
        {
            return "";
        }
    }
}

static void
forArray(
    intarray const * array
)
{
    int i,
    item,
    count;
    count = intarray_length(array);
    for (i = 0; i < count; i++)
    {
        item = intarray_get(array, i);
        printf("%d\n", item);
    }
}

static void
hello(void)
{
    printf("Hello, world\n");
}

static int
inversedAnd(
    int one,
    int two,
    int three
)
{
    if (((one == 1) && (two == 2)) && (three == 3))
    {
        return 1;
    }
    else
    {
        return 0;
    }
}

static int
inversedOr(
    int one,
    int two,
    int three
)
{
    if (((one == 1) || (two == 2)) || (three == 3))
    {
        return 1;
    }
    else
    {
        return 0;
    }
}

int
main(void)
{
    intarray * array;
    array = intarray_create(3);
    hello();
    successCount = 0;
    errorCount = 0;
    writeLine("Question");
    checkInt(1, inversedAnd(1, 2, 3));
    checkInt(0, inversedAnd(4, 5, 6));
    checkInt(0, inversedAnd(0, 2, 3));
    checkInt(1, inversedOr(1, 2, 3));
    checkInt(1, inversedOr(1, 2, 2));
    checkInt(0, inversedOr(4, 5, 6));
    checkInt(1, simpleAnd(1, 1, 1));
    checkInt(0, simpleAnd(0, 0, 0));
    checkInt(0, simpleAnd(0, 1, 1));
    checkInt(0, simpleAnd(1, 1, 0));
    checkInt(1, simpleOr(1, 1, 1));
    checkInt(0, simpleOr(0, 0, 0));
    checkInt(1, simpleOr(0, 1, 1));
    checkInt(1, simpleOr(1, 1, 0));
    checkInt(10, questionMerge(1, 1));
    checkInt(6, questionMerge(0, 0));
    checkInt(11, questionMerge(0, 1));
    checkInt(10, questionMerge(1, 0));
    checkInt(1, complexAnd(1, 1, 1));
    checkInt(0, complexAnd(0, 0, 0));
    checkInt(1, complexAnd(0, 1, 1));
    checkInt(0, complexAnd(1, 1, 0));
    checkInt(1, complexOr(1, 1, 1));
    checkInt(0, complexOr(0, 0, 0));
    checkInt(0, complexOr(0, 1, 1));
    checkInt(1, complexOr(1, 1, 0));
    checkString("FizzBuzz", fizzBuzz(0));
    checkString("", fizzBuzz(1));
    checkString("Fizz", fizzBuzz(3));
    checkString("", fizzBuzz(4));
    checkString("Buzz", fizzBuzz(5));
    checkString("FizzBuzz", fizzBuzz(15));
    writeLine("");
    writeLine("Choice");
    checkString(
        "ten",
        selectWithoutDefault(5)
    );
    checkString(
        "twenty",
        selectWithoutDefault(15)
    );
    checkString(
        "thirty",
        selectWithoutDefault(25)
    );
    checkString(
        "good",
        selectShortCircuit(5)
    );
    checkString(
        "good",
        selectShortCircuit(15)
    );
    checkString(
        "bad",
        selectShortCircuit(25)
    );
    checkString("ten", selectWithDefault(10));
    checkString(
        "twenty",
        selectWithDefault(20)
    );
    checkString(
        "many",
        selectWithDefault(30)
    );
    checkString("ten", degenerateSelect(10));
    checkString("many", degenerateSelect(20));
    checkString("many", degenerateSelect(30));
    writeLine("");
    writeLine("Math");
    checkInt(10, add(4, 6));
    checkInt(6, add(1, 5));
    writeLine("");
    writeLine("Repeats");
    checkInt(1015, noDublicates(2, 4));
    checkInt(1015, noDublicates(-2, 4));
    checkInt(-1, noDublicates(-10, -20));
    writeLine("");
    writeLine("Silhouette");
    checkInt(-95, sil2(-10));
    checkInt(315, sil2(31));
    checkInt(1005, sil2(100));
    checkInt(17, complexSilhouette(3, 5));
    checkInt(10, complexSilhouette(10, 5));
    complexSilNoReturn(3, 5);
    complexSilNoReturn(10, 5);
    checkInt(0, fibonacci(0));
    checkInt(1, fibonacci(1));
    checkInt(1, fibonacci(2));
    checkInt(2, fibonacci(3));
    checkInt(3, fibonacci(4));
    checkInt(5, fibonacci(5));
    checkInt(8, fibonacci(6));
    checkInt(13, fibonacci(7));
    checkInt(21, fibonacci(8));
    checkInt(34, fibonacci(9));
    checkInt(55, fibonacci(10));
    checkInt(2, resourcesExample(100));
    writeLine("");
    writeLine("ForLoop");
    intarray_set(array, 0, 10);
    intarray_set(array, 1, 20);
    intarray_set(array, 2, 30);
    forArray(array);
    checkInt(20, intarray_get(array, 1));
    earlyExit(array, 20);
    checkInt(0, intarray_get(array, 1));
    writeLine("");
    writeLine("ArrowLoop");
    checkInt(10, selectArrow());
    checkInt(-1, twoExits(array, 100));
    checkInt(2, twoExits(array, 30));
    checkInt(21, doWhile());
    checkInt(21, whileDo());
    checkInt(27, doWhileDo());
    writeLine("");
    writeLine("Tests completed");
    printf("Successful: %d\n", successCount);
    printf("Errors: %d\n", errorCount);
    intarray_delete(array);
    return 0;
}

static int
noDublicates(
    int x,
    int y
)
{
    int result,
    i;
    if (x > 0)
    {
        result = 1000;
        for (i = 0; i < x + y; i++)
        {
            result += i;
        }
        return result;
    }
    else
    {
        x = -x;
        if (y > 0)
        {
            result = 1000;
            for (i = 0; i < x + y; i++)
            {
                result += i;
            }
            return result;
        }
        else
        {
            return -1;
        }
    }
}

static void
question(
    int value
)
{
    if (value >= 0)
    {
        printf("neg\n");
    }
    else
    {
        printf("pos\n");
    }
}

static int
questionMerge(
    int left,
    int right
)
{
    int result;
    result = 0;
    if (left)
    {
        result += 10;
    }
    else
    {
        result++;
        if (right)
        {
            result += 10;
        }
        else
        {
            result += 5;
        }
    }
    return result;
}

static int
resourcesExample(
    int count
)
{
    intarray * array;
    int result;
    array = intarray_create(count);
    doSomething(array);
    doMore(array);
    result = completeWork(array);
    intarray_delete(array);
    return result;
}

static char const *
select(
    int value
)
{
    if (value == 10)
    {
        return "ten";
    }
    else
    {
        if (value == 20)
        {
            return "twenty";
        }
        else
        {
            return "other";
        }
    }
}

static int
selectArrow(void)
{
    int result = 0;
    while (1)
    {
        if (result == 10)
        {
            break;
        }
        else
        {
            if (result == 5)
            {
                result += 2;
            }
            else
            {
                result++;
            }
        }
    }
    return result;
}

static char const *
selectShortCircuit(
    int value
)
{
    if ((value + 5 == 10) || (value + 5 == 20))
    {
        return "good";
    }
    else
    {
        if (!(value + 5 == 30))
        {
            abort();
        }
        return "bad";
    }
}

static char const *
selectWithDefault(
    int value
)
{
    if (value == 10)
    {
        return "ten";
    }
    else
    {
        if (value == 20)
        {
            return "twenty";
        }
        else
        {
            return "many";
        }
    }
}

static char const *
selectWithoutDefault(
    int value
)
{
    if (value + 5 == 10)
    {
        return "ten";
    }
    else
    {
        if (value + 5 == 20)
        {
            return "twenty";
        }
        else
        {
            if (!(value + 5 == 30))
            {
                abort();
            }
            return "thirty";
        }
    }
}

static int
sil2(
    int value
)
{
    int foo;
    if (value >= 0)
    {
        if (value % 10 == 0)
        {
            foo = value * 10;
        }
        else
        {
            foo = value * 10;
        }
    }
    else
    {
        foo = value * 10;
    }
    foo += 5;
    return foo;
}

static int
simpleAnd(
    int valueA, //value a
    int valueB, //value b
    int valueC // value c
)
{
    if (((valueA) && (valueB)) && (valueC))
    {
        return 1;
    }
    else
    {
        return 0;
    }
}

static int
simpleOr(
    int valueA,
    int valueB,
    int valueC
)
{
    if (((valueA) || (valueB)) || (valueC))
    {
        return 1;
    }
    else
    {
        return 0;
    }
}

static int
twoExits(
    intarray const * array,
    int value
)
{
    int i,
    index,
    item;
    i = 0;
    while (1)
    {
        if (i < intarray_length(array))
        {
            item = intarray_get(array, i);
            if (item == value)
            {
                index = i;
                break;
            }
            else
            {
                i++;
            }
        }
        else
        {
            index = -1;
            break;
        }
    }
    return index;
}

static int
whileDo(void)
{
    int result = 0;
    while (1)
    {
        if (result > 20)
        {
            break;
        }
        else
        {
            result += 3;
        }
    }
    return result;
}

static void
writeInt(
    int value
)
{
    printf("%d\n", value);
}

static void
writeLine(
    char const * message
)
{
    printf("%s\n", message);
}
