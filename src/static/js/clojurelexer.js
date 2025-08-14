window.lexClosure = function(text) {
    function isWhitespace(symbol) {
        let code = symbol.charCodeAt(0);
        return code === 32 || code === 9 || code === 10;
    }

    function isDigit(symbol) {
        let code = symbol.charCodeAt(0);
        return code >= 48 && code <= 57;
    }

    function isOperator(symbol) {
        const operators = ["(", ")", "[", "]", "{", "}", "#", ",", "`", "'"];
        return operators.includes(symbol);
    }

    function createLexer() {
        return {
            tokens: [],
            state: "idle",
            substate: "idle",
            buffer: "",
            tokenType: ""
        };
    }

    function createToken(type, text) {
        return {
            text: text,
            type: type
        };
    }

    function finishToken(lexer) {
        if (lexer.buffer.length > 0) {
            let token = createToken(lexer.tokenType, lexer.buffer);
            lexer.tokens.push(token);
            lexer.buffer = "";
        }
        lexer.state = "idle";
    }

    function forwardToken(lexer, type, symbol) {
        let token = createToken(type, symbol);
        lexer.tokens.push(token);
    }

    function processToken(token) {
        if (token.type === "whitespace") {
            if (token.text === "\n") {
                token.type = "eol";
            }
        } else if (token.type === "special") {
            if (token.text === "##Inf" || token.text === "##-Inf" || token.text === "##NaN") {
                token.type = "number";
            } else {
                token.type = "error";
            }
        } else if (token.type === "backslash") {
            token.type = "number";
        }
    }

    function handleBuilding(lexer, symbol) {
        if (symbol === "#") {
            lexer.buffer += symbol;
            lexer.tokenType = "error";
        } else if (symbol === ";") {
            finishToken(lexer);
            forwardToken(lexer, "comment", symbol);
            lexer.state = "comment";
            lexer.substate = "idle";
        } else if (symbol === ":" || symbol === "\"" || symbol === "\\") {
            lexer.buffer += symbol;
            lexer.tokenType = "error";
        } else if (isWhitespace(symbol)) {
            finishToken(lexer);
            forwardToken(lexer, "whitespace", symbol);
        } else if (isOperator(symbol)) {
            finishToken(lexer);
            forwardToken(lexer, "operator", symbol);
        } else {
            lexer.buffer += symbol;
        }
    }

    function handleComment(lexer, symbol) {
        if (symbol === "\n") {
            finishToken(lexer);
            forwardToken(lexer, "whitespace", symbol);
        } else if (lexer.substate === "idle") {
            if (isWhitespace(symbol)) {
                forwardToken(lexer, "whitespace", symbol);
            } else {
                lexer.buffer += symbol;
                lexer.tokenType = "comment";
                lexer.substate = "normal";
            }
        } else {
            if (isWhitespace(symbol)) {
                finishToken(lexer);
                forwardToken(lexer, "whitespace", symbol);
                lexer.state = "comment";
                lexer.substate = "idle";
            } else {
                lexer.buffer += symbol;
            }
        }
    }

    function handleDash(lexer, symbol) {
        if (symbol === "#") {
            lexer.buffer += "##";
            lexer.state = "building";
            lexer.tokenType = "special";
        } else {
            forwardToken(lexer, "operator", "#");
            lexer.state = "idle";
            handleIdle(lexer, symbol);
        }
    }

    function handleIdle(lexer, symbol) {
        if (symbol === "#") {
            lexer.state = "dash";
        } else if (symbol === ";") {
            forwardToken(lexer, "comment", symbol);
            lexer.state = "comment";
            lexer.substate = "idle";
        } else if (symbol === ":") {
            lexer.buffer += symbol;
            lexer.state = "building";
            lexer.tokenType = "keyword";
        } else if (symbol === "\"") {
            lexer.buffer += symbol;
            lexer.state = "string";
            lexer.substate = "normal";
            lexer.tokenType = "string";
        } else if (symbol === "\\") {
            lexer.buffer += symbol;
            lexer.state = "building";
            lexer.tokenType = "backslash";
        } else if (isWhitespace(symbol)) {
            forwardToken(lexer, "whitespace", symbol);
        } else if (isOperator(symbol)) {
            forwardToken(lexer, "operator", symbol);
        } else if (isDigit(symbol)) {
            lexer.buffer += symbol;
            lexer.state = "building";
            lexer.tokenType = "number";
        } else {
            lexer.buffer += symbol;
            lexer.state = "building";
            lexer.tokenType = "identifier";
        }
    }

    function handleString(lexer, symbol) {
        if (symbol === "\n") {
            lexer.tokenType = "error";
            finishToken(lexer);
            forwardToken(lexer, "whitespace", symbol);
        } else {
            lexer.buffer += symbol;
            if (lexer.substate === "normal") {
                if (symbol === "\"") {
                    finishToken(lexer);
                } else if (symbol === "\\") {
                    lexer.substate = "escaping";
                }
            } else {
                lexer.substate = "normal";
            }
        }
    }

    function pushNextSymbol(lexer, symbol) {
        if (symbol !== "\r") {
            if (lexer.state === "idle") {
                handleIdle(lexer, symbol);
            } else if (lexer.state === "dash") {
                handleDash(lexer, symbol);
            } else if (lexer.state === "building") {
                handleBuilding(lexer, symbol);
            } else if (lexer.state === "string") {
                handleString(lexer, symbol);
            } else if (lexer.state === "comment") {
                handleComment(lexer, symbol);
            } else {
                throw new Error("Unexpected case value: " + lexer.state);
            }
        }
    }

    let lexer = createLexer();
    for (let i = 0; i < text.length; i++) {
        pushNextSymbol(lexer, text[i]);
    }
    pushNextSymbol(lexer, "\n");
    for (let token of lexer.tokens) {
        processToken(token);
    }
    return lexer.tokens;
}