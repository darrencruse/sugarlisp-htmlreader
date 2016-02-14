var sl = require('sugarlisp-core/sl-types'),
    reader = require('sugarlisp-core/reader'),
    rfuncs = require('./readfuncs');

// inner html shorthand <<>>
// might wrap a simple var i.e. <<elem>>, or a dom selector i.e. <<$#elem>>
exports['*:innerhtml'] = function(lexer) {
  // skip the "<<" brackets
  // note our regex is very specific so no concern over "<<" operator here
  var openingBracketsToken = lexer.skip_token("<<");

  // we generate:
  //   (.innerHTML expr)
  // where expr means what was inside ie. <<expr>>
  var list = sl.list(".innerHTML");
  list.setOpening(openingBracketsToken);

  // read what's inside normally
  list.push(reader.read(lexer));

  // skip the ending brackets
  var closingBrackets = lexer.skip_text(">>");

  return list;
};

// $#element is a convention for referring to DOM elements
// ($# meant to be reminiscent of jquery's $("#element")
exports['$#'] = function(lexer) {
  lexer.skip_text('$#');
  var nextForm = reader.read(lexer);
  var list = sl.list("document.getElementById", sl.str(sl.valueOf(nextForm)));
  list.setOpening(nextForm);
  return list;
}

// this is kind of a hacky way to ensure "read" doesn't misinterpret
// the ending ">>" as an infix right shift operator:
exports['>>'] = reader.postfix(15, {enabled:false});

// start of html tag
exports['*:starttag'] = function(lexer) {
  return rfuncs.read_html_element(lexer);
};
