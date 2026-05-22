function CreateSyntaxHighlightingOptions() {

    function arrayToSet(array) {
        var set = {}
        for (var element of array) {
            set[element] = true
        }
        return set
    }

    return {
        "JS": {
            prettify: true,
            keywords: arrayToSet([
                "abstract", "arguments", "boolean", "break", "byte", "case", "catch",
                "char", "class", "const", "continue", "debugger", "default", "delete",
                "do", "double", "else", "enum", "eval", "export", "extends",
                "final", "finally", "float", "for", "function", "goto", "if",
                "implements", "import", "in", "instanceof", "int", "interface",
                "let", "long", "native", "new", "package", "private", "protected",
                "public", "return", "short", "static", "super",
                "switch", "synchronized", "throw", "throws", "transient", "try", "typeof", "var",
                "void", "volatile", "while", "yield", "async", "await"]),
            values: arrayToSet(["true", "false", "null", "undefined", "this"])
        },
        "LUA": {
            prettify: true,
            keywords: arrayToSet(["and", "break", "do", "else",
                "elseif", "end", "for", "function", "goto",
                "if", "in", "local", "not", "or",
                "repeat", "return", "then", "until", "while"]),
            values: arrayToSet(["true", "false", "nil"])
        },
        "PFL": {
            prettify: false,
            yes: "Да",
            no: "Нет",
            end: "Конец",
            async: "Асинх",
            export: "ВидноВсем",
            keywords: {},
            values: arrayToSet([
                "Из",
                "False", "Nothing", "True", "Да", "Истина",
                "Ложь", "Неопределено", "Нет", "Правда",
                "And", "BitAnd", "BitOr", "BitXor", "Is", "IsNot", "LogAnd",
                "LogOr", "Or", "Xor", "БитИ", "БитИли", "БитИсклИли", "И", "Или", "ИсклИли",
                "Как", "ЛогИ", "ЛогИли", "Это", "ЭтоНе", "ЭтоТип", "ЭтоНеТип",
                "Блокировка", "Выбор", "Если", "Завершение", "Иначе", "ИначеЕсли",
                "Исключение", "Использовать", "Когда", "Попытка", "При", "Тогда",
                "Для", "Каждого", "По", "Пока", "Прервать", "ПрерватьЕсли", "Продолжить",
                "ПродолжитьЕсли", "Цикл", "Шаг", "ИмпортИмен", "Наследует", "Определено",
                "Реализует", "Родитель", "Тип", "ЭтотКласс", "ЭтотОбъект", "КонецБлокировки",
                "КонецВыбора", "КонецЕсли", "КонецИспользовать", "КонецПопытки",
                "КонецЦикла", "КонецВызвать", "КонецДеструктора", "КонецДобавить",
                "КонецЗавершителя", "КонецИтератора", "КонецКонструктора", "КонецМетода",
                "КонецОператора", "КонецПолучить", "КонецПроцедуры", "КонецУдалить",
                "КонецУстановить", "КонецФункции", "КонецСвойства", "КонецСобытия",
                "КонецИнтерфейса", "КонецКласса", "КонецМодуля", "КонецПеречисления",
                "КонецПрограммы", "КонецСтруктуры", "ИсточникСобытий", "Поле", "Поля",
                "Свойства", "Свойство", "Событие", "События", "ВводСтроки", "Возврат",
                "ВозвратЕсли", "ВыводСтроки", "ВызватьЗавершитель", "ВызватьИсключение",
                "ВызватьСобытие", "ДобавитьОбработчик", "Ждать", "МассивИзменить",
                "МассивНовый", "МассивОчистить", "МассивУдалить", "Новый", "Перейти",
                "ПолучитьДелегат", "ПолучитьРесурс", "Присвоить", "УдалитьОбработчик",
                "Вызвать", "Деструктор", "Добавить", "Завершитель", "Итератор", "Конструктор",
                "Метод", "Оператор", "Получить", "Процедура", "Удалить", "Установить",
                "Функция", "Знч", "Исп", "Конст", "Константа", "Массив", "Пер", "Перем",
                "Переменная", "До", "От", "BitNot", "IsTrue", "IsFalse", "Not", "БитНе",
                "Не", "ЭтоИстина", "ЭтоЛожь", "Делегат", "Интерфейс", "Класс", "Модуль",
                "Перечисление", "Программа", "Структура", "тип"
            ])
        },
        "clojure": {
            prettify: false,
            keywords: arrayToSet([
                "first", "rest", "cons", "conj", "map", "filter", "reduce", "into", "take", "drop",
                "nth", "get", "assoc", "dissoc", "keys", "vals", "merge", "select-keys",
                "lazy-seq", "range", "repeat", "cycle", "interleave", "partition", "flatten",
                "apply", "partial", "comp", "juxt", "memoize", "constantly", "complement",
                "if", "when", "cond", "case", "and", "or", "not", "some", "every?", "not-any?",
                "<", ">", "<=", ">=", "=", "==", "not=",
                "+", "-", "*", "/",
                "->", "->>", "some->", "as->",
                "atom", "swap!", "reset!", "deref", "ref", "alter", "dosync",
                "println", "prn", "slurp", "spit", "with-open", "future", "pmap",
                "meta", "with-meta", "type", "instance?", "ns",
                "new", ".", "doto", "bean",
                "future", "promise", "deliver", "pmap", "pcalls",
                "str", "format", "clojure.string/split", "clojure.string/join", "re-matches", "re-find",
                "defn", "let", "fn", "def", "loop", "recur"
            ]),
            values: {}
        }
    }
}