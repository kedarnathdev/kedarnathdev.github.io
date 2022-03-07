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
var input = new String()
var combinedString = new String()
var afterButtonString = 'Your Selection:-'
var movie_id_array = new Array()
const url1 = new URL('https://yts.unblockninja.com/api/v2/list_movies.json')
const url2 = new URL('https://yts.unblockninja.com/api/v2/movie_details.json')

function getMovieSelectionNum() {
  input = document.getElementById("userInput").value;
  console.log(input)
  url2.searchParams.set('movie_id', movie_id_array[input-1])
  fetch(url2)
  .then(res2 => res2.json())
  .then(movieDetailJson => {
    console.log(movieDetailJson)
    console.log(movieDetailJson.data.movie.title_long)
    console.log(movieDetailJson.data.movie.rating)
    console.log(movieDetailJson.data.movie.runtime)
    console.log(movieDetailJson.data.movie.download_count)
    afterButtonString = afterButtonString + '<br>' + 'Title: ' 
    + movieDetailJson.data.movie.title_long+ '<br>' 
    + 'Rating: ' + movieDetailJson.data.movie.rating + '<br>'
    
    for(let i = 0; i < movieDetailJson.data.movie.torrents.length; i++) {
      if (movieDetailJson.data.movie.torrents[i].quality == '720p') {
        afterButtonString = afterButtonString+ '720p Movie Link' +'<br>' +'url: ' + '<a href="'+ movieDetailJson.data.movie.torrents[i].url+ '">' + movieDetailJson.data.movie.torrents[i].url+'</a>' + '<br>'
        + 'size: '+ movieDetailJson.data.movie.torrents[i].size + '<br>' + '<br>'

      }
      if (movieDetailJson.data.movie.torrents[i].quality == '1080p') {
        afterButtonString = afterButtonString+ '1080p Movie Link' +'<br>' +'url: ' + '<a href="'+ movieDetailJson.data.movie.torrents[i].url+ '">' + movieDetailJson.data.movie.torrents[i].url+'</a>' + '<br>'
        + 'size: '+ movieDetailJson.data.movie.torrents[i].size + '<br>' + '<br>'
      }
      if (movieDetailJson.data.movie.torrents[i].quality == '2160p') {
        afterButtonString = afterButtonString+ '2160p Movie Link' +'<br>' +'url: ' + '<a href="'+ movieDetailJson.data.movie.torrents[i].url+ '">' + movieDetailJson.data.movie.torrents[i].url+'</a>' + '<br>'
        + 'size: '+ movieDetailJson.data.movie.torrents[i].size + '<br>' + '<br>'
      }
      if (movieDetailJson.data.movie.torrents[i].quality == '3D') {
        afterButtonString = afterButtonString+ '3D Movie Link' +'<br>' +'url: ' + '<a href="'+ movieDetailJson.data.movie.torrents[i].url+ '">' + movieDetailJson.data.movie.torrents[i].url+'</a>' + '<br>'
        + 'size: '+ movieDetailJson.data.movie.torrents[i].size + '<br>' + '<br>'
      }

      document.getElementById('addAfterButton').innerHTML = afterButtonString

    }


  })
  .catch(error => console.log(error))
}

function getMovieSelection() {
  let movie_name = prompt('Enter a movie name:')
  url1.searchParams.set('query_term', movie_name)
  url1.searchParams.set('limit', 50)
  fetch(url1)
  .then(res => res.json())
  .then(movieSelectJson => {

    for (let i = 0; i < movieSelectJson.data.movie_count; i++) {
      var y = i + 1
      combinedString = combinedString + y +') '+ movieSelectJson.data.movies[i].title_long + '<br>'
      document.getElementById("addto").innerHTML = combinedString
      console.log(y +') '+ movieSelectJson.data.movies[i].title_long)
      movie_id_array.push(movieSelectJson.data.movies[i].id)
    }
    combinedString = combinedString + '<br>' + 'Enter a movie number below and click submit:-'
    document.getElementById("addto").innerHTML = combinedString
  })
  .catch(error => console.log(error))

}

