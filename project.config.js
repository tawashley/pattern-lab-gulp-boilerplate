module.exports = {
  itcss: [
    './_source/styles/_settings/*.scss',
    './_source/styles/_tools/**/*.scss',
    './_source/styles/_global/**/*.scss',
    './_source/styles/_scope/*.scss',
    './_source/styles/_generic/*.scss',
    './_source/styles/_elements/*.scss',
    './_source/styles/_objects/*.scss',
    './_source/styles/_components/*.scss',
    './_source/_patternlab/_patterns/**/*.scss',
    './_source/styles/_trumps/*.scss'
  ],
  src: {
    styles: './_source/styles/',
    sass: './_source/styles/main.scss'
  },
  dest: {
    root: './build/',
    scripts: './build/_client/scripts',
    images: './build/_client/images',
    fonts: './build/_client/fonts',
    styles: './build/_client/styles'
  }
}
