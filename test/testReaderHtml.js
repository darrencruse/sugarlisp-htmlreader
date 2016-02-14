// Exercise the SugarLisp Html Reader
// note: this should be changed to be a proper test with pass/fail asserts

var reader = require('sugarlisp-core/reader');
var sl = require('sugarlisp-core/sl-types');

function testReader(msg, src) {
  console.log('* ' + msg + ' ' + src);
  // the .slml extension includes the html dialect by default
  var forms = reader.read_from_source(src, 'test.slml', {baseDialectNames: ['plus', 'htmlreader']});
  //console.log('forms:', JSON.stringify(forms.toJSON()));
  //console.log(sl.pprintJSON(forms.toJSON(),{bareSymbols: true}) + '\n');
  console.log(sl.pprintSEXP(forms.toJSON(),{omitTop: true}) + '\n');
}

testReader('some html:', '<div/>');
testReader('some html:', '<div></div>');
testReader('some html:', '<div id="mydiv"/>');
testReader('some html:', '<div id="mydiv">hello</div>');
testReader('some html:', '<div id="mydiv"><b>hello</b></div>');
testReader('some html:', '<div id="mydiv"><b>hello</b> world</div>');
testReader('some html:', '<div id="mydiv" class="blue">hi <b>hello</b></div>');
testReader('some html:', '<div id="mydiv">hi<b>hello</b>world</div>');
testReader('some html:', '<div id="mydiv">hi <b>hello</b> world</div>');
testReader('some html:', '<div id="mydiv">hi <b>${x}</b> world</div>');
testReader('some html:', '<div id="mydiv">hi ${(+ 12.5 z)}<b> ${x} </b> world</div>');
testReader('some html:', '<div id="${mydiv}">hi ${(+ 12.5 z)}<b> ${x} </b> world</div>');
testReader('html with inline style:', '<h1 style="color:blue;margin-left:30px;">This is a heading.</h1>');

// confirm that reading lispy forms is not affected by #use "html"
testReader('a symbol:', 'sym');
testReader('a string:', '"str"');
testReader('a number:', '13');
testReader('a number:', '173.97');
testReader('a negative number:', '-13');
testReader('a negative number:', '-173.97');
testReader('nil:', 'nil');
testReader('null:', 'null');
testReader('true:', 'true');
testReader('false:', 'false');
testReader('a list of all atom types:', '(list "string1" \'string2\' 123 123.23 nil null true false)');
testReader('anon function +:', '(var f (function (x y) (+ x y)))');
testReader('named function -:', '(var f (function minus (x y) (- x y)))');
testReader('function /:', '(var f (function (x y) (/ x y)))');
testReader('arrow function:', '(x y) => (+ x y)');
testReader('html symbol overlap test 1:', '(var f (function (x y z) (if (= x y) y (if (< x y) x (if (<= x z) z)))))');
testReader('html symbol overlap test 2:', '(var f (function (x y z) (if (= x y) y (if (> x y) x (if (>= x z) z)))))');
testReader('lisp comment by itself:', '(\n; a comment\n)');
testReader('lisp comment in code:', '(do "hello"\n; a comment\n(+ 2 3))\n; another comment');
testReader('some javascript:', '(javascript "alert(\'hello\');")');

testReader('js comment by itself:', '(\n// a comment\n)');
testReader('js comments:', '(do "hello"\n// a comment\n(+ 2 3))\n// another comment');
testReader('js block comment one line:', '(do "hello"\n/* a comment */\n(+ 2 3))\n/* another comment */');
testReader('js block comment multi line:', '/*\n* multi line\n* comment */\n(do "hello" /* a \ncomment\n*/\n(+ 2 3))');
testReader('an array:', '(var arr [1 2 3])');
testReader('js object literal:', '{ first: "fred", last: "flintstone", age: 54, cartoon: true, toString: (function () (this.first)) }');
testReader('json with quoted keys:', '{ "first": "fred", "last": "flintstone", "age": 54, "cartoon": true }');
testReader('code block:', '{ (console.log "hello") }');
