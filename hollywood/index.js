function getMovieSelection() {
  url1 = new URL('https://yts.mx/api/v2/list_movies.json')
  let movie_name = prompt('Enter a movie name:')
  url1.searchParams.set('query_term', movie_name)
  url1.searchParams.set('limit', 50)
  fetch(url1)
  .then(res => res.json())
  .then(movieSelectJson => {
    let movie_id_array = new Array()
    var combinedString = new String()
    for (let i = 0; i < movieSelectJson.data.movie_count; i++) {
      var y = i + 1
      //combinedString = combinedString + y +') '+ movieSelectJson.data.movies[i].title_long + '\n'
      document.write(y +') ' + movieSelectJson.data.movies[i].title_long + '<br>')
      console.log(y +') '+ movieSelectJson.data.movies[i].title_long)
      movie_id_array.push(movieSelectJson.data.movies[i].id)
    }
  })
  .catch(error => console.log(error))
}

