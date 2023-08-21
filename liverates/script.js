var url = "http://viewbcastgold.dpgold.in:8811/VOTSBroadcast/Services/xml/GetLiveRate";

translate = {
    "MUMBAI ": "ముంబై",
    "BANGALORE": "బెంగళూరు",
    "CHENNAI - CBE": "చెన్నై",
    "HYDERABAD": "హైదరాబాద్",
    "VJA - VIZAG": "విజయవాడ - వైజాగ్",
    "NELLORE": "నెల్లూరు",
    "SILVER ALL LOCO": "వెండి"
}

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
          

          for (i = 3; i <= dataList.length; i++) {
            var data = dataList[i]
            console.log(data)
            const row = document.createElement('tr');
            
            const categoryCell = document.createElement('td');
            categoryCell.textContent = translate[data.Category];
            row.appendChild(categoryCell);

            if (data.Category === "SILVER ALL LOCO") {
                const priceCell = document.createElement('td');
                priceCell.textContent = data.Price + "  (1 కేజీ)";
                row.appendChild(priceCell);
                tableBody.appendChild(row);
            }
            else {
                const priceCell = document.createElement('td');
                priceCell.textContent = data.Price + "  (1 గ్రాము)";
                row.appendChild(priceCell);
                tableBody.appendChild(row);
            }
            
          }
          
          

    })
    .catch(error => {
        console.log(error);
    });
