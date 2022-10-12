<?php
ob_start();

echo "<pre>";
echo "Loading ...";

ob_flush();
flush();

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "http://stackoverflow.com");
//curl_setopt($ch, CURLOPT_BUFFERSIZE,128);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_PROGRESSFUNCTION, 'progress');
curl_setopt($ch, CURLOPT_NOPROGRESS, false); // needed to make progress function work
curl_setopt($ch, CURLOPT_HEADER, 0);
curl_setopt($ch, CURLOPT_USERAGENT, $_SERVER['HTTP_USER_AGENT']);
$html = curl_exec($ch);
curl_close($ch);


function progress($resource,$download_size, $downloaded, $upload_size, $uploaded)
{
    if($download_size > 0)
         echo $downloaded / $download_size  * 100;
    ob_flush();
    flush();
    sleep(1); // just to see effect
}

echo "Done";
ob_flush();
flush();

?>