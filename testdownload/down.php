<?php
  ini_set('memory_limit', '-1'); // unlimited memory limit
  ini_set('max_execution_time', 3000);
	$url = $_POST["name"];
	// $file_name = basename($url);
  $file_name = "sample.mp4";
  file_put_contents($file_name, file_get_contents($url))
?>

<html>
  <a href='<?php echo $file_name; ?>'>download</a>
  <br>
  <iframe width="560" height="315" src="<?php echo $file_name ?>" frameborder="0" allowfullscreen></iframe>
</html>
