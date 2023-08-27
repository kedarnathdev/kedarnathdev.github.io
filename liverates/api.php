<?php
        $url = "http://viewbcastgold.dpgold.in:8811/VOTSBroadcast/Services/xml/GetLiveRate";
        $response = file_get_contents($url);
        echo $response;
        ?>