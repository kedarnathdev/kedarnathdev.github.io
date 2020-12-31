function ageInDays() {
  
  var birthYear = prompt('Enter your Birth Year 😄');
  let ageInDayss = (2020 - birthYear) * 365;
  
  var h1 = document.createElement('h1');
  
  var textAnswer = document.createTextNode('You are '+ ageInDayss +' Days old !!');
  
  h1.setAttribute('id','ageInDays');
  h1.appendChild(textAnswer);
  document.getElementById('flex-result').appendChild(h1);
  
}