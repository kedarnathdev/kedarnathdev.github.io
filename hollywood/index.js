/*const api_url1 = new URL('https://yts.mx/api/v2/list_movies.json');
const api_url2 = new URL('https://yts.mx/api/v2/movie_details.json')

let movie_name = prompt('Enter a movie name:')

async function getMovieSelection(url1, url2) {

  url1.searchParams.set('query_term', movie_name)
  url1.searchParams.set('limit', 50)
  movie_id_array = new Array()
  const response = await fetch(url1);
  const data = await response.json()
  // console.log(data)

  for (let i = 0; i < data.data.movie_count; i++) {
    console.log((i+1)+') '+data.data.movies[i].title_long)
    movie_id_array.push(data.data.movies[i].id)
  }

  x = prompt("Enter movie number from below: ")
  const final_id = movie_id_array[x-1]
  url2.searchParams.set('movie_id', final_id)
  const response2 = await fetch(url2)
  const data2 = await response2.json()
  //console.log(data2)
  console.log('Title: '+ data2.data.movie.title_long+'\n'+'Duration: '+ data2.data.movie.runtime)
}

function showMovie() {
  document.getElementById('addto').textContent(data.data.movie_count)

}*/



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
      combinedString = combinedString + y +') '+ movieSelectJson.data.movies[i].title_long + '<br>'
      document.getElementById("addto").innerHTML = combinedString
      console.log(y +') '+ movieSelectJson.data.movies[i].title_long)
      movie_id_array.push(movieSelectJson.data.movies[i].id)
    }
  })
  .catch(error => console.log(error))
}
