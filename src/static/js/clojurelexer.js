window.lexClojure = function(text) {
    // Helper functions
    function isWhitespace(symbol) {
        const code = symbol.charCodeAt(0);
        return code === 32 ||  // space
               code === 9 ||   // tab
               code === 10 ||  // newline
               code === 13;    // carriage return
    }

    function isDigit(symbol) {
        const code = symbol.charCodeAt(0);
        return code >= 48 && code <= 57; // 0-9
    }

    function isOperator(symbol) {
        const operators = ["(", ")", "[", "]", "{", "}", "#", ",", "`", "'"];
        return operators.includes(symbol);
    }

    // Lexer procedures
    function createLexer() {
        return {
            tokens: [],
            state: "idle",
            substate: null,
            buffer: "",
            tokenType: null
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
            const token = createToken(lexer.tokenType, lexer.buffer);
            lexer.tokens.push(token);
            lexer.buffer = "";
        }
        lexer.state = "idle";
    }

    function forwardToken(lexer, type, symbol) {
        const token = createToken(type, symbol);
        lexer.tokens.push(token);
    }

    // Handler procedures
    function handleBuilding(lexer, symbol) {
        if (symbol === "#") {
            lexer.buffer += symbol;
            lexer.tokenType = "error";
        } else {
            if (symbol === ";") {
                finishToken(lexer);
                forwardToken(lexer, "comment", symbol);
                lexer.state = "comment";
                lexer.substate = "idle";
            } else {
                if ((symbol === ":") || (symbol === "\"") || (symbol === "\\")) {
                    lexer.buffer += symbol;
                    lexer.tokenType = "error";
                } else {
                    if (isWhitespace(symbol)) {
                        finishToken(lexer);
                        forwardToken(lexer, "whitespace", symbol);
                    } else {
                        if (isOperator(symbol)) {
                            finishToken(lexer);
                            forwardToken(lexer, "operator", symbol);
                        } else {
                            lexer.buffer += symbol;
                        }
                    }
                }
            }
        }
    }

    function handleComment(lexer, symbol) {
        if (symbol === "\n") {
            finishToken(lexer);
            forwardToken(lexer, "whitespace", symbol);
        } else {
            if (lexer.substate === "idle") {
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
    }

    function handleDash(lexer, symbol) {
        if (symbol === "#") {
            lexer.buffer = "##";
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
        } else {
            if (symbol === ";") {
                forwardToken(lexer, "comment", symbol);
                lexer.state = "comment";
                lexer.substate = "idle";
            } else {
                if (symbol === ":") {
                    lexer.buffer += symbol;
                    lexer.state = "building";
                    lexer.tokenType = "keyword";
                } else {
                    if (symbol === "\"") {
                        lexer.buffer += symbol;
                        lexer.state = "string";
                        lexer.substate = "normal";
                        lexer.tokenType = "string";
                    } else {
                        if (symbol === "\\") {
                            lexer.buffer += symbol;
                            lexer.state = "building";
                            lexer.tokenType = "backslash";
                        } else {
                            if (isWhitespace(symbol)) {
                                forwardToken(lexer, "whitespace", symbol);
                            } else {
                                if (isOperator(symbol)) {
                                    forwardToken(lexer, "operator", symbol);
                                } else {
                                    if (isDigit(symbol)) {
                                        lexer.buffer += symbol;
                                        lexer.state = "building";
                                        lexer.tokenType = "number";
                                    } else {
                                        lexer.buffer += symbol;
                                        lexer.state = "building";
                                        lexer.tokenType = "identifier";
                                    }
                                }
                            }
                        }
                    }
                }
            }
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
                } else {
                    if (symbol === "\\") {
                        lexer.substate = "escaping";
                    }
                }
            } else {
                lexer.substate = "normal";
            }
        }
    }

    function pushNextSymbol(lexer, symbol) {
        if (symbol !== "\r") {
            switch (lexer.state) {
                case "idle":
                    handleIdle(lexer, symbol);
                    break;
                case "dash":
                    handleDash(lexer, symbol);
                    break;
                case "building":
                    handleBuilding(lexer, symbol);
                    break;
                case "string":
                    handleString(lexer, symbol);
                    break;
                case "comment":
                    handleComment(lexer, symbol);
                    break;
                default:
                    throw new Error(`Unexpected case value: ${lexer.state}`);
            }
        }
    }

    function processToken(token) {
        if (token.type === "whitespace") {
            if (token.text === "\n") {
                token.type = "eol";
            }
        } else {
            if (token.type === "special") {
                if (token.text === "##Inf" || token.text === "##-Inf" || token.text === "##NaN") {
                    token.type = "number";
                } else {
                    token.type = "error";
                }
            } else {
                if (token.type === "backslash") {
                    token.type = "number";
                }
            }
        }
    }

    // Main lexing procedure
    const lexer = createLexer();
    
    // Process each character in the input text
    for (let i = 0; i < text.length; i++) {
        pushNextSymbol(lexer, text[i]);
    }
    
    // Push a final newline to ensure all tokens are flushed
    pushNextSymbol(lexer, "\n");
    
    // Process all tokens
    for (const token of lexer.tokens) {
        processToken(token);
    }
    
    // Remove trailing eol tokens
    while (lexer.tokens.length > 0 && lexer.tokens[lexer.tokens.length - 1].type === "eol") {
        lexer.tokens.pop();
    }
    
    return lexer.tokens;
};