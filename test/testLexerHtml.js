
// Exercise the SugarLisp Html Lexer
// note: this should be changed to be a proper test with pass/fail asserts

var lex = require('sugarlisp-core/lexer'),
    reader = require('sugarlisp-core/reader')
    sl = require('sugarlisp-core/sl-types');

function testLexer(msg, src) {
  console.log('* ' + msg + ' ' + src);
  var tokens = reader.nonlocal_tokens(src, 'testLexer.slml', {baseDialectNames: ['plus', 'htmlreader']});
  console.log(lex.formatTokenDump(tokens, lex.formatTokenSexp, "(tokens ", ")\n"));
}

// html lexer tests

testLexer('some html:', '<div/>');
testLexer('some html:', '<div></div>');
testLexer('some html:', '<div id="mydiv"/>');
testLexer('some html:', '<div id="mydiv">hello</div>');
testLexer('some html:', '<div id="mydiv"><b>hello</b></div>');
testLexer('some html:', '<div id="mydiv"><b>hello</b> world</div>');
testLexer('some html:', '<div id="mydiv" class="blue">hi <b>hello</b></div>');
testLexer('some html:', '<div id="mydiv">hi<b>hello</b>world</div>');
testLexer('some html:', '<div id="mydiv">hi <b>hello</b> world</div>');
testLexer('some html:', '<div id="mydiv">hi <b>${x}</b> world</div>');
testLexer('some html:', '<div id="mydiv">hi ${(+ 12.5 z)}<b> ${x} </b> world</div>');
testLexer('some html:', '<div id="${mydiv}">hi ${(+ 12.5 z)}<b> ${x} </b> world</div>');
testLexer('html with inline style:', '<h1 style="color:blue;margin-left:30px;">This is a heading.</h1>');

// and confirm that reading lispy forms is not affected by #use "htmlreader"
testLexer('a symbol:', 'sym');
testLexer('a string:', '"str"');
testLexer('a number:', '13');
testLexer('a number:', '173.97');
testLexer('a negative number:', '-13');
testLexer('a negative number:', '-173.97');
testLexer('nil:', 'nil');
testLexer('null:', 'null');
testLexer('true:', 'true');
testLexer('false:', 'false');
testLexer('a list of all atom types:', '(list "string1" \'string2\' 123 123.23 nil null true false)');
testLexer('anon function +:', '(var f (function (x y) (+ x y)))');
testLexer('named function -:', '(var f (function minus (x y) (- x y)))');
testLexer('function /:', '(var f (function (x y) (/ x y)))');
testLexer('arrow function:', '(x y) => (+ x y)');
testLexer('html symbol overlap test 1:', '(var f (function (x y z) (if (= x y) y (if (< x y) x (if (<= x z) z)))))');
testLexer('html symbol overlap test 2:', '(var f (function (x y z) (if (= x y) y (if (> x y) x (if (>= x z) z)))))');
testLexer('lisp comment by itself:', '(\n; a comment\n)');
testLexer('lisp comment in code:', '(do "hello"\n; a comment\n(+ 2 3))\n; another comment');
testLexer('some javascript:', '(javascript "alert(\'hello\');")');

testLexer('js comment by itself:', '(\n// a comment\n)');
testLexer('js comments:', '(do "hello"\n// a comment\n(+ 2 3))\n// another comment');
testLexer('js block comment one line:', '(do "hello"\n/* a comment */\n(+ 2 3))\n/* another comment */');
testLexer('js block comment multi line:', '/*\n* multi line\n* comment */\n(do "hello" /* a \ncomment\n*/\n(+ 2 3))');
testLexer('an array:', '(var arr [1 2 3])');
testLexer('js object literal:', '{ first: "fred", last: "flintstone", age: 54, cartoon: true, toString: (function () (this.first)) }');
testLexer('json with quoted keys:', '{ "first": "fred", "last": "flintstone", "age": 54, "cartoon": true }');
testLexer('code block:', '{ (console.log "hello") }');
