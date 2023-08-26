var url = "http://viewbcastgold.dpgold.in:8811/VOTSBroadcast/Services/xml/GetLiveRate";

var priceHistory = {
    "MUMBAI ": 0,
    "BANGALORE": 0,
    "CHENNAI - CBE": 0,
    "HYDERABAD": 0,
    "VJA - VIZAG": 0,
    "NELLORE": 0,
    "SILVER ALL LOCO": 0
}

translate = {
    "MUMBAI ": "ముంబై",
    "BANGALORE": "బెంగళూరు",
    "CHENNAI - CBE": "చెన్నై",
    "HYDERABAD": "హైదరాబాద్",
    "VJA - VIZAG": "విజయవాడ - వైజాగ్",
    "NELLORE": "నెల్లూరు",
    "SILVER ALL LOCO": "వెండి"
}

function fetchData() {
    fetch(url)
    .then(response => {
        if (!response.ok) {
            throw new Error("Failed to retrieve HTML data. Status code: " + response.status);
        }
        return response.text();
    })
    .then(htmlData => {
        const encodedText = htmlData.toString()
        const lines = encodedText.split("\\u000d\\u000a");
        const dataList = lines.map(line => {

                const parts = line.split(/\\u0009|\\s+/);
                const Category = parts[1];
                const Price = parseFloat(parts[2].replace('$', ''));

                const High = parseFloat(parts[3]);
                const Low = parseFloat(parts[4]);
                const Change = parseFloat(parts[5]);
                const ChangePercentage = parseFloat(parts[6]);
                const PreviousClose = parts[7] === "\\u0009" ? NaN : parseFloat(parts[7]);

                return {
                    Category,
                    Price,
                    High,
                    Low,
                    Change,
                    ChangePercentage,
                    PreviousClose
                };
            });

        console.log(dataList);
          const tableBody = document.querySelector('#data-table tbody');
          tableBody.innerHTML = ""
          for (i = 3; i <= dataList.length; i++) {
            var data = dataList[i]
            console.log(data)
            const row = document.createElement('tr');
            const categoryCell = document.createElement('td');
            categoryCell.textContent = translate[data.Category];
            row.appendChild(categoryCell);
            const priceCell = document.createElement('td');
            if (data.Category === "SILVER ALL LOCO") {
                
                priceCell.textContent = data.Price + "  (1 కేజీ)";
                row.appendChild(priceCell);
                tableBody.appendChild(row);
                
            }
            else {
                //const priceCell = document.createElement('td');
                priceCell.textContent = data.Price + "  (1 గ్రాము)";
                row.appendChild(priceCell);
                tableBody.appendChild(row);
            }

            if(priceHistory[data.Category] > data.Price) {
                priceCell.classList.add('highlightred');

                setTimeout(() => {
                    priceCell.classList.remove('highlightred');
                }, 500);
            }
            else if (priceHistory[data.Category] < data.Price) {
                priceCell.classList.add('highlightgreen');

                setTimeout(() => {
                    priceCell.classList.remove('highlightgreen');
                }, 500);
            }

            priceHistory[data.Category] = data.Price
            
          }
          
          

    })
    .catch(error => {
        console.log(error);
    });

}

// Get the current date and time in Telugu and update it every second
function updateCurrentDateTime() {
    const currentDateTimeElement = document.getElementById("current-datetime");
    setInterval(() => {
      const now = new Date();
      const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short"
      };
      const formattedDateTime = now.toLocaleDateString("te-IN", options);
      currentDateTimeElement.textContent = `ప్రస్తుత తేదీ మరియు సమయం: ${formattedDateTime}`;
    }, 1000); // Update every second
  }
  
  // Call the function to start updating the current date and time
  updateCurrentDateTime();
  

setInterval(fetchData, 2000)