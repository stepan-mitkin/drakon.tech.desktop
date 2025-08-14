QUnit.module('lexClosure', function() {
    QUnit.test('should tokenize whitespace correctly', function(assert) {
        const text = " \t\n";
        const tokens = window.lexClojure(text);
        assert.equal(tokens[0].type, 'whitespace', 'First token should be whitespace');
        assert.equal(tokens[0].text, ' ', 'First token text should be space');
        assert.equal(tokens[1].type, 'whitespace');
        assert.equal(tokens[1].text, '\t');
    });

    QUnit.test('should tokenize operators correctly', function(assert) {
        const text = "(){}";
        const tokens = window.lexClojure(text);
        assert.equal(tokens[0].type, 'operator', 'First token should be operator');
        assert.equal(tokens[0].text, '(', 'First token text should be (');
        assert.equal(tokens[1].type, 'operator', 'Second token should be operator');
        assert.equal(tokens[1].text, ')', 'Second token text should be )');
        assert.equal(tokens[2].type, 'operator', 'Third token should be operator');
        assert.equal(tokens[2].text, '{', 'Third token text should be {');
        assert.equal(tokens[3].type, 'operator', 'Fourth token should be operator');
        assert.equal(tokens[3].text, '}', 'Fourth token text should be }');
    });

    QUnit.test('should tokenize comments correctly', function(assert) {
        const text = ";hello world\n";
        const tokens = window.lexClojure(text);
        assert.equal(tokens[0].type, 'comment', 'First token should be comment');
        assert.equal(tokens[0].text, ';', 'First token text should be ;');
        assert.equal(tokens[1].type, 'comment');
        assert.equal(tokens[1].text, 'hello');
        assert.equal(tokens[2].type, 'whitespace');
        assert.equal(tokens[2].text, ' ');
        assert.equal(tokens[3].type, 'comment');
        assert.equal(tokens[3].text, 'world');
        const text2 = "(wow);hello world";
        const tokens2 = window.lexClojure(text2);        
        assert.equal(tokens2[0].type, 'operator');
        assert.equal(tokens2[0].text, '(');        
        assert.equal(tokens2[1].type, 'identifier');
        assert.equal(tokens2[1].text, 'wow');
        assert.equal(tokens2[2].type, 'operator');
        assert.equal(tokens2[2].text, ')');                
        assert.equal(tokens2[3].type, 'comment');
        assert.equal(tokens2[3].text, ';');                
        assert.equal(tokens2[4].type, 'comment');
        assert.equal(tokens2[4].text, 'hello');
        assert.equal(tokens2[5].type, 'whitespace');
        assert.equal(tokens2[5].text, ' ');    
        assert.equal(tokens2[6].type, 'comment');
        assert.equal(tokens2[6].text, 'world');
    });

    QUnit.test('should tokenize strings correctly', function(assert) {
        const text = "\"hello\"";
        const tokens = window.lexClojure(text);
        assert.equal(tokens[0].type, 'string', 'First token should be string');
        assert.equal(tokens[0].text, '"hello"', 'First token text should be "hello"');

        const text2 = "\"hello \\\"world\\\"\"";
        const tokens2 = window.lexClojure(text2);        
        var i = 0
        assert.equal(tokens2[i].type, 'string');
        assert.equal(tokens2[i++].text, text2);
    });

    QUnit.test('should handle unterminated string as error', function(assert) {
        const text = "\"hello\n";
        const tokens = window.lexClojure(text);
        assert.equal(tokens[0].type, 'error', 'First token should be error');
        assert.equal(tokens[0].text, '"hello', 'First token text should be unterminated string');
    });

    QUnit.test('should tokenize numbers correctly', function(assert) {
        const text = "123";
        const tokens = window.lexClojure(text);
        assert.equal(tokens[0].type, 'number', 'First token should be number');
        assert.equal(tokens[0].text, '123', 'First token text should be 123');
    });

    QUnit.test('should tokenize keywords correctly', function(assert) {
        const text = ":key";
        const tokens = window.lexClojure(text);
        assert.equal(tokens[0].type, 'keyword', 'First token should be keyword');
        assert.equal(tokens[0].text, ':key', 'First token text should be :key');
    });

    QUnit.test('should handle special tokens like ##Inf, ##-Inf, ##NaN', function(assert) {
        const text = "##Inf ##-Inf ##NaN";
        const tokens = window.lexClojure(text);
        assert.equal(tokens[0].type, 'number', 'First token should be number');
        assert.equal(tokens[0].text, '##Inf', 'First token text should be ##Inf');
        assert.equal(tokens[1].type, 'whitespace', 'Second token should be whitespace');
        assert.equal(tokens[2].type, 'number', 'Third token should be number');
        assert.equal(tokens[2].text, '##-Inf', 'Third token text should be ##-Inf');
        assert.equal(tokens[3].type, 'whitespace', 'Fourth token should be whitespace');
        assert.equal(tokens[4].type, 'number', 'Fifth token should be number');
        assert.equal(tokens[4].text, '##NaN', 'Fifth token text should be ##NaN');
    });

    QUnit.test('should handle backslash correctly', function(assert) {
        const text = "\\x";
        const tokens = window.lexClojure(text);
        assert.equal(tokens[0].type, 'number', 'First token should be number');
        assert.equal(tokens[0].text, '\\x', 'First token text should be \\x');
    });

    QUnit.test('should handle generic tokens correctly', function(assert) {
        const text = "abc";
        const tokens = window.lexClojure(text);
        assert.equal(tokens[0].type, 'identifier', 'First token should be token');
        assert.equal(tokens[0].text, 'abc', 'First token text should be abc');
    });

    QUnit.test('should handle invalid ## sequence as error', function(assert) {
        const text = "##x";
        const tokens = window.lexClojure(text);
        assert.equal(tokens[0].type, 'error', 'First token should be error');
        assert.equal(tokens[0].text, '##x', 'First token text should be ##x');
    });

    QUnit.test('lists', function(assert) {
        const text = "(foo (one two)\n[three four])";
        const tokens = window.lexClojure(text);
        var i = 0
        assert.equal(tokens[i].type, 'operator');
        assert.equal(tokens[i++].text, '(');
        assert.equal(tokens[i].type, 'identifier');
        assert.equal(tokens[i++].text, 'foo');
        assert.equal(tokens[i].type, 'whitespace');
        assert.equal(tokens[i++].text, ' ');
        assert.equal(tokens[i].type, 'operator');
        assert.equal(tokens[i++].text, '(');
        assert.equal(tokens[i].type, 'identifier');
        assert.equal(tokens[i++].text, 'one');
        assert.equal(tokens[i].type, 'whitespace');
        assert.equal(tokens[i++].text, ' ');        
        assert.equal(tokens[i].type, 'identifier');
        assert.equal(tokens[i++].text, 'two');        
        assert.equal(tokens[i].type, 'operator');
        assert.equal(tokens[i++].text, ')');
        assert.equal(tokens[i].type, 'eol');
        assert.equal(tokens[i++].text, '\n');
        assert.equal(tokens[i].type, 'operator');
        assert.equal(tokens[i++].text, '[');
        assert.equal(tokens[i].type, 'identifier');
        assert.equal(tokens[i++].text, 'three');
        assert.equal(tokens[i].type, 'whitespace');
        assert.equal(tokens[i++].text, ' ');        
        assert.equal(tokens[i].type, 'identifier');
        assert.equal(tokens[i++].text, 'four');        
        assert.equal(tokens[i].type, 'operator');
        assert.equal(tokens[i++].text, ']');
    });    

    QUnit.test('map', function(assert) {
        const text0 = "#{eight}";
        const tokens0 = window.lexClojure(text0);
        //console.log(JSON.stringify(tokens0, null, 4))
        const text = "{:one two\n:three 1.20 :four\t\"five\" :six \\t :seven #{eight #\"reg\" '(nine)}}";
        const tokens = window.lexClojure(text);
        console.log(text)
        var i = 0
        assert.equal(tokens[i].type, 'operator');
        assert.equal(tokens[i++].text, '{');
        assert.equal(tokens[i].type, 'keyword');
        assert.equal(tokens[i++].text, ':one');        
        assert.equal(tokens[i].type, 'whitespace');
        assert.equal(tokens[i++].text, ' ');           
        assert.equal(tokens[i].type, 'identifier');
        assert.equal(tokens[i++].text, 'two');
        assert.equal(tokens[i].type, 'eol');
        assert.equal(tokens[i++].text, '\n');
        assert.equal(tokens[i].type, 'keyword');
        assert.equal(tokens[i++].text, ':three');
        assert.equal(tokens[i].type, 'whitespace');
        assert.equal(tokens[i++].text, ' ');  
        assert.equal(tokens[i].type, 'number');
        assert.equal(tokens[i++].text, '1.20');
        assert.equal(tokens[i].type, 'whitespace');
        assert.equal(tokens[i++].text, ' ');     
        assert.equal(tokens[i].type, 'keyword');
        assert.equal(tokens[i++].text, ':four');
        assert.equal(tokens[i].type, 'whitespace');
        assert.equal(tokens[i++].text, '\t');
        assert.equal(tokens[i].type, 'string');
        assert.equal(tokens[i++].text, '\"five\"');
        assert.equal(tokens[i].type, 'whitespace');
        assert.equal(tokens[i++].text, ' ');     
        assert.equal(tokens[i].type, 'keyword');
        assert.equal(tokens[i++].text, ':six');
        assert.equal(tokens[i].type, 'whitespace');
        assert.equal(tokens[i++].text, ' ');  
        assert.equal(tokens[i].type, 'number');
        assert.equal(tokens[i++].text, '\\t'); 
        assert.equal(tokens[i].type, 'whitespace');
        assert.equal(tokens[i++].text, ' ');     
        assert.equal(tokens[i].type, 'keyword');
        assert.equal(tokens[i++].text, ':seven');
        assert.equal(tokens[i].type, 'whitespace');
        assert.equal(tokens[i++].text, ' ');        
        assert.equal(tokens[i].type, 'operator');
        assert.equal(tokens[i++].text, '#');   
        assert.equal(tokens[i].type, 'operator');
        assert.equal(tokens[i++].text, '{');
        assert.equal(tokens[i].type, 'identifier');
        assert.equal(tokens[i++].text, 'eight');       
        assert.equal(tokens[i].type, 'whitespace');
        assert.equal(tokens[i++].text, ' ');        
        assert.equal(tokens[i].type, 'operator');
        assert.equal(tokens[i++].text, '#');          
        assert.equal(tokens[i].type, 'string');
        assert.equal(tokens[i++].text, '\"reg\"');
        assert.equal(tokens[i].type, 'whitespace');
        assert.equal(tokens[i++].text, ' ');        
        assert.equal(tokens[i].type, 'operator');
        assert.equal(tokens[i++].text, '\'');       
        assert.equal(tokens[i].type, 'operator');
        assert.equal(tokens[i].type, 'operator');
        assert.equal(tokens[i++].text, '(');
        assert.equal(tokens[i].type, 'identifier');
        assert.equal(tokens[i++].text, 'nine');        
        assert.equal(tokens[i].type, 'operator');
        assert.equal(tokens[i++].text, ')');        
        assert.equal(tokens[i++].text, '}');                                            
        assert.equal(tokens[i].type, 'operator');
        assert.equal(tokens[i++].text, '}');                                                    
    })
});