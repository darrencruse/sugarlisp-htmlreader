module.exports = [
  // inner html shorthand <<>>
  // might wrap a simple var i.e. <<elem>>, or a dom selector i.e. <<$#elem>>
  {
    category: 'innerhtml',
    match: /<<[\$a-zA-Z\-\_]+[\#a-zA-Z0-9\-\_]*>>/g
  },

  // html start tag
  {
    category: 'starttag',
    match: /<[a-zA-Z\-\_]+[a-zA-Z0-9\-\_\.\#]*/g
  },

  // html end tag
  {
    category: 'endtag',
    match: /<\/[a-zA-Z\-\_]+[a-zA-Z0-9\-\_\.\#]*>/g
  },

  // we define ">>" as a symbol so the reader stops at the
  // right point when reading e.g. the "elem" in <<elem>>
  {
    category: 'symbol',
    match: />>|\/>|=>|<=|>=|===|==|\$#|##=|#=/g
  },

  {
    category: 'punctuation',
    match: /<|>|\/|=/g
  }
];
