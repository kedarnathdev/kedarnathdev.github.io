function getIdFromUrl() {
    let url1 = prompt('Enter Google Drive Link: ');
    let gdriveId = url1.match(/[-\w]{25,}/);
    let link1 = 'https://www.googleapis.com/drive/v3/files/';
    let finalID = gdriveId[0];
    let link2 = '?alt=media&key=AIzaSyB_nRjgTcqm4Z7-wvvHJrb7hDCsTYdGxLs';
    let finalLink = link1 + finalID + link2
    document.getElementById('addAfterButton').innerText = finalLink;
}


function copyToClipboard(element) {
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val($(element).text()).select();
    document.execCommand("copy");
    $temp.remove();
    alert('Link copies Successfully')
}
