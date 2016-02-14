var sl = require('sugarlisp-core/sl-types'),
    reader = require('sugarlisp-core/reader'),
    plusrfuncs = require('sugarlisp-plus/readfuncs');

// parse an html element (when the parser has just encountered the opening "<")
exports.read_html_element = function(lexer) {

  var openingBracket = lexer.next_token("<");  // skip the angle bracket

  var list = sl.list(sl.atom("tag", {token: openingBracket}));
  var tagNameToken = lexer.next_token(/([a-zA-Z\-\_]+[a-zA-Z0-9\-\_\.\#]*)/g);
  list.push(sl.str(tagNameToken.text, {token: tagNameToken}));

  var tagAttributes = exports.read_html_attributes(lexer);
  if(tagAttributes && tagAttributes.length > 0) {
    list.push(tagAttributes);
  }

  var tagBody;
  if(lexer.on('>')) {
      var expectedEndTag = '</' + tagNameToken.text + '>';
      // in an lsml page, we may encounter:
      //   <script type="text/sugarlisp">
      // in which case we read the content as lispy code not html
      if(tagNameToken.text === 'script' &&
        ((t = find_attr_value(tagAttributes, 'type')) &&
        t.value === 'text/sugarlisp') &&
        !find_attr_value(tagAttributes, 'src')) {
          // yup it's an inline script tag containing lispy code
          // little hacky - but the output is javascript!
          t.value = 'text/javascript';
          lexer.skip_token('>'); // skip token also gets following spaces

          // we allow them to use html in this inline sugarlisp,
          // but we need a new dialect that uses the "dynamic" html
          // generation mode (i.e. creating strings of html at run
          // time)
          var dyndialect = reader.use_dialect_module("html", lexer, {
                rootform: list,
                filelevel: false
          });
// ORIGINAL          dyndialect.html_keyword_mode = "dynamic";
dyndialect.html_keyword_mode = "vdom";  // FOR TESTING NEW VDOM STUFF
          tagBody = sl.list();
          // we're missing a return after the script tag:
          tagBody.prelude = "\n\n";
          lexer.new_dialect(dyndialect, tagBody);

          while (!lexer.eos() && !lexer.on(expectedEndTag)) {
            var nextform = reader.read(lexer);

            // some "directives" don't return an actual form:
            if(!reader.isignorableform(nextform)) {
              tagBody.push(nextform);
            }
          }

          if (lexer.eos()) {
              lexer.error('Missing "' + expectedEndTag + '" + tag?', tagNameToken);
          }

          // the top level delimits subexpressions differently
          tagBody.__toplevel = true;
          lexer.skip_text(expectedEndTag);
      }
      else {
        // the tag's body is treated as if it were an automatically quoted
        // template string, except that other html tags may be there too...

        // not yet sure if the ability to read html tags belongs as an option
        // passed to read_template_string or if it's just a separate function of
        // it's own e.g. read_html_body.  Note that we don't want the body to
        // be an (str...) if the only child is another html tag (despite what
        // the line below suggests)
        var concat = sl.atom('tagjoiner');
        concat.noparens = true;
        tagBody = exports.read_html_body(lexer, '>', expectedEndTag, [concat]);
      }
  } else if(lexer.on('/>')) {
    lexer.skip_text('/>');
    tagBody = [] // empty tag
  }
  else {
    reader.error("Malformed html tag...", lexer);
  }

  if(tagBody && !(Array.isArray(tagBody) && tagBody.length === 0)) {
    list.push(tagBody);
  }
  return list;
}

// note that attributes are read as a lispy (attr name value ...) list,
// yet we set the names as actual object properties so it can also be
// used with simple js dot notation.  Note though the values are atoms
// not simple primitives, so they are wrapped with line/col meta data.
exports.read_html_attributes = function(lexer) {

  // they can use a lispy expression to derive their tag attributes
  // e.g. <div (attr id "mydiv")/>
  // this can be useful in macros, etc.
  if(lexer.on("(")) {
    return reader.read(lexer);
  }

  // "attr" is really just a synonym for "object"
  var list = sl.list("attr");
  list.setOpening(lexer);

  var ch;
  var atLeastOneAttribute = false;
  // the attributes end at either ">" or "/>" ...
  while (!lexer.eos() && (ch = lexer.peek_char()) && (ch !== ">" && ch !== "/")) {
    // read the attribute name and add the lispy form:
    list.push(lexer.next_word_token());
    lexer.skip_whitespace();

    if(lexer.on("=")) {
      lexer.skip_text("=");

      // read the attribute value (which may include ${} placeholders)
      var attrVal = plusrfuncs.read_template_string(lexer, undefined, undefined, ['+']);
      list.push(attrVal);
    }
    else {
      // it's not common but sometimes in html there's no equals e.g. "<option selected/>"
      list.push(sl.atom(true));
    }

    atLeastOneAttribute = true;
  }
  if (ch !== ">" && ch !== "/") {
      reader.error("Missing end to tag attributes", lexer);
  }
  if(!atLeastOneAttribute) {
    list.shift();  // return just () not (attr...)
  }
  list.setClosing(lexer);

  list = plusrfuncs.even_keys_to_list_properties(list);

  // note we have intentionally *not* read the ending ">" or "/>"
  return list;
}

// find the value form with the given name in the attribute forms,
// otherwise undefined
function find_attr_value(attrForms, attrName) {
  var attrVal;
  var attrPos = -1;
  if(attrForms && Array.isArray(attrForms)) {
    attrKey = attrForms.find(function (form, i) {
      attrPos = i;
      return (i % 2 === 1) && form.value === attrName;
    })
    if(attrKey && attrPos+1 < attrForms.length) {
      attrVal = attrForms[attrPos+1];
    }
  }
  return attrVal;
}

// Text in html tags default to being a string, unlike in lispy code
// where they default to being symbols (and strings must be quoted).
// Otherwise lispy expressions must be wrapped in ${}, but html tags
// can be nested normally.
exports.read_html_body = function(lexer, start, end, initial) {

  var openingBracket = lexer.next_token(start);
  var strlist = sl.listFromArray(initial || []);
  strlist.setOpening(openingBracket);

  // note we're no longer tokenizing delimited "words"
  // (an html body is text i.e. like a string just without the quotes)
  var text = "";
  lexer.mark_token_start();

  // scan looking for the ending
  while(!lexer.eos() && !lexer.on(end)) {

    // have we hit the start of an ${} escape?
    if(lexer.on('${')) {
      // add the preceding text
      if(text !== "") {
        text = sl.addQuotes(sl.escapeNewlines(text));
        strlist.push(sl.str(text, {token: lexer.create_token(text)}));
        text = "";
      }
      lexer.skip_text("${");
      strlist.push(reader.read(lexer))
      lexer.skip_filler();
      lexer.assert('}',"Missing end for ${");
      lexer.skip_char("}");
      lexer.mark_token_start();
    }
    // a tag name starts '<' then alphabetical after that...
    else if(lexer.on(/<[a-zA-Z\-\_]/g, true)) {
      // add the preceding text
      if(text !== "") {
        text = sl.addQuotes(sl.escapeNewlines(text));
        strlist.push(sl.str(text, {token: lexer.create_token(text)}));
        text = "";
      }
      // add the child html tag(s):
      strlist.push(exports.read_html_element(lexer));
    }
    else {
      // it was just normal text (accumulate it till some delimiter is found)
      text += lexer.next_char();
    }
  }

  // we should be at the end of the template string now
  lexer.assert(end, "Missing end of html body");
  lexer.skip_text(end);

  // add any text between last ${} or html tag and the end
  if(text !== "") {
    text = sl.addQuotes(sl.escapeNewlines(text));
    strlist.push(sl.str(text, {token: lexer.create_token(text)}));
  }

  if(strlist.length === 1) {
    strlist.shift(); // the body was empty - it's *not* a (str...)
  }
  else if(strlist.length === 2) {
    strlist = strlist[1]; // the body was just a single string or html tag
  }

  return strlist;
}
